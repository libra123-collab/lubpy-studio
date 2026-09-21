import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.ts';
import {
  createUserSchema,
  updateUserSchema,
  createInterviewSchema,
  fcmTokenSchema,
} from '../schemas/validationSchemas.ts';
import { fcmService } from '../services/fcmService.ts';
import { successResponse, errorResponse } from '../utils/responseFormatter.ts';

const router = Router();

function sanitizeUser(user: any) {
  const roleMapping: Record<string, string> = {
    SUPER_ADMIN: 'admin',
    ADMIN: 'admin',
    TECH_LEAD: 'tech',
    DEVELOPER: 'tech',
    CS: 'cs',
    ACCOUNTING: 'accounting',
    HR: 'hr',
    CLIENT: 'client',
  };

  const standardRole = (user.role || 'CLIENT').toUpperCase();
  const clientRole = roleMapping[standardRole] || (user.role ? user.role.toLowerCase() : 'client');
  const avatarUrl = user.photoUrl || user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name || 'User')}&backgroundColor=0f172a`;

  return {
    id: user.id,
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: clientRole,
    rawRole: standardRole,
    userRole: standardRole,
    isDepartmentHead: !!user.isDepartmentHead,
    department: user.department || undefined,
    departmentTitle: user.departmentTitle || undefined,
    phone: user.phone || '',
    dob: user.dob || '',
    hometown: user.hometown || '',
    occupation: user.occupation || '',
    workEnvironment: user.workEnvironment || '',
    skills: user.skills || '',
    photoUrl: avatarUrl,
    avatar: avatarUrl,
    status: user.status || 'active',
  };
}

// 1. GET ALL USERS (Filtered by role: clients cannot see all internal staff)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const all = await storage.getAllUsers();

    if (user && user.role.toUpperCase() === 'CLIENT') {
      const publicContacts = all.filter(u => u.role !== 'CLIENT');
      const sanitized = publicContacts.map(u => ({
        id: u.id,
        uid: u.uid,
        name: u.name,
        role: u.role,
        department: u.department,
        departmentTitle: u.departmentTitle,
        avatar: u.photoUrl || u.avatar,
        photoUrl: u.photoUrl || u.avatar,
      }));
      return res.json(
        successResponse(sanitized, 'Lấy danh sách chuyên viên liên hệ thành công.')
      );
    }

    const sanitized = all.map(sanitizeUser);
    return res.json(
      successResponse(sanitized, 'Lấy danh sách người dùng thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tải danh sách người dùng.')
    );
  }
});

// 2. CREATE NEW USER (ADMIN / HR ONLY)
router.post('/', requireAuth, requireRoles('SUPER_ADMIN', 'ADMIN', 'HR'), async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu người dùng không hợp lệ.')
      );
    }

    const { name, email, password, role, department, departmentTitle, isDepartmentHead, phone, skills } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();

    const existing = await storage.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json(
        errorResponse('EMAIL_EXISTS', 'Email này đã tồn tại trong hệ thống.')
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync((password || 'lubpy@2026').trim(), salt);
    const uid = `usr_${role.toLowerCase()}_${Date.now()}`;
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f172a`;

    const newUser = await storage.createUser({
      uid,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role.toUpperCase(),
      department,
      departmentTitle,
      isDepartmentHead,
      phone,
      skills,
      avatar,
      photoUrl: avatar,
      status: 'active',
    });

    const sanitized = sanitizeUser(newUser);

    return res.status(201).json(
      successResponse(sanitized, 'Tạo tài khoản nhân sự thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 3. UPDATE USER PROFILE (Admin or Self)
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const currentUser = req.user!;

    if (currentUser.id !== userId && !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(currentUser.role.toUpperCase())) {
      return res.status(403).json(
        errorResponse('FORBIDDEN', 'Bạn không có quyền chỉnh sửa tài khoản này.')
      );
    }

    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu cập nhật không hợp lệ.')
      );
    }

    const updated = await storage.updateUser(userId, parseResult.data);
    if (!updated) {
      return res.status(404).json(
        errorResponse('USER_NOT_FOUND', 'Không tìm thấy tài khoản để cập nhật.')
      );
    }

    const sanitized = sanitizeUser(updated);

    return res.json(
      successResponse(sanitized, 'Cập nhật thông tin người dùng thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 4. POST /api/v1/users/fcm-token
// Save Push Notification Token for Mobile / Web clients
router.post('/fcm-token', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = fcmTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'FCM Token không hợp lệ.')
      );
    }

    const { fcmToken, token, deviceToken, platform } = parseResult.data;
    const finalToken = fcmToken || token || deviceToken;

    if (!finalToken || finalToken.trim().length === 0) {
      return res.status(400).json(
        errorResponse('EMPTY_TOKEN', 'FCM Token không được để trống.')
      );
    }

    const user = req.user;
    const effectiveUserId = user?.uid || (req.body.userId ? String(req.body.userId) : `anonymous_device_${Date.now()}`);

    // Register token in FCM Push Notification Service
    fcmService.registerUserToken(effectiveUserId, finalToken.trim(), platform || 'android');

    return res.json(
      successResponse(
        {
          userId: effectiveUserId,
          fcmToken: finalToken.trim(),
          platform: platform || 'android',
          registeredAt: new Date().toISOString(),
        },
        'Lưu FCM Push Notification Token thành công.'
      )
    );
  } catch (err: any) {
    console.error('Error saving FCM Token:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể lưu FCM Token.')
    );
  }
});

// 5. INTERVIEWS (HR)
router.get('/interviews', async (req: AuthRequest, res: Response) => {
  try {
    const data = await storage.getAllInterviews();
    return res.json(
      successResponse(data, 'Lấy danh sách lịch phỏng vấn thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

router.post('/interviews', requireAuth, requireRoles('HR', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createInterviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu phỏng vấn không hợp lệ.')
      );
    }

    const body = parseResult.data;
    const interviewId = `int-${Date.now()}`;
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(body.candidateName)}&backgroundColor=0f172a`;

    const item = await storage.createInterview({
      id: interviewId,
      candidateName: body.candidateName,
      candidateEmail: body.candidateEmail,
      candidatePhone: body.candidatePhone,
      role: body.role,
      date: body.date,
      time: body.time,
      status: body.status || 'Confirmed',
      interviewer: body.interviewer || 'Nguyễn Minh Thư (HR Manager)',
      notes: body.notes,
      avatar,
    });

    return res.status(201).json(
      successResponse(item, 'Tạo lịch phỏng vấn thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

export default router;
