import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest, generateToken, requireAuth, requireRoles } from '../middleware/auth.ts';
import {
  registerClientSchema,
  loginSchema,
  adminLoginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  updateUserSchema,
} from '../schemas/validationSchemas.ts';
import { createRateLimiter } from '../middleware/security.ts';
import { successResponse, errorResponse } from '../utils/responseFormatter.ts';

const router = Router();

// Rate limiter for auth endpoints: max 30 attempts per 15 minutes
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Quá nhiều yêu cầu đăng nhập/xác thực. Vui lòng thử lại sau ít phút.',
});

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

// 1. REGISTER CLIENT
router.post('/register', authRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = registerClientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu đăng ký không hợp lệ.')
      );
    }

    const {
      name,
      email,
      password,
      phone,
      dob,
      hometown,
      occupation,
      workEnvironment,
      skills,
    } = parseResult.data;

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists in PostgreSQL
    const existing = await storage.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json(
        errorResponse('EMAIL_EXISTS', 'Email này đã được đăng ký trên hệ thống. Vui lòng đăng nhập.')
      );
    }

    // Hash password with bcrypt strictly (no plaintext)
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(password.trim(), salt);
    const uid = `usr_client_${Date.now()}`;
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f172a`;

    const newUser = await storage.createUser({
      uid,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'CLIENT',
      isDepartmentHead: false,
      phone: phone ? phone.trim() : undefined,
      dob: dob ? dob.trim() : undefined,
      hometown: hometown ? hometown.trim() : undefined,
      occupation: occupation ? occupation.trim() : 'Khách Hàng Đồ Án CNTT',
      workEnvironment: workEnvironment ? workEnvironment.trim() : 'Cá nhân',
      skills: skills ? skills.trim() : undefined,
      avatar,
      photoUrl: avatar,
      status: 'active',
    });

    const token = generateToken({
      id: newUser.id,
      uid: newUser.uid,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
    });

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Record audit log
    await storage.createAuditLog({
      action: 'REGISTER_CLIENT',
      entityType: 'USER',
      entityId: newUser.uid,
      userId: newUser.uid,
      userName: newUser.name,
      userRole: newUser.role,
      details: `Đăng ký tài khoản khách hàng mới: ${newUser.name} (${newUser.email})`,
      ipAddress: req.ip,
    });

    const sanitized = sanitizeUser(newUser);

    return res.status(201).json(
      successResponse(
        { token, user: sanitized },
        'Đăng ký tài khoản thành công.',
        { token, user: sanitized }
      )
    );
  } catch (err: any) {
    console.error('Error during client registration:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Đăng ký không thành công.')
    );
  }
});

// 2. LOGIN (CLIENT & INTERNAL STAFF)
// Standard login flow: Email -> PostgreSQL user -> bcrypt.compareSync -> JWT Session
// NO universal/role-based password bypasses
router.post('/login', authRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Vui lòng nhập đầy đủ Email và Mật khẩu.')
      );
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();
    const user = await storage.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json(
        errorResponse('AUTH_FAILED', 'Email hoặc mật khẩu không chính xác.')
      );
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json(
        errorResponse('ACCOUNT_DISABLED', 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Admin.')
      );
    }

    // Verify password strictly against bcrypt hash stored in PostgreSQL
    if (!user.passwordHash) {
      return res.status(401).json(
        errorResponse('AUTH_FAILED', 'Email hoặc mật khẩu không chính xác.')
      );
    }

    const enteredPass = password.trim();
    const isBcryptMatch = bcrypt.compareSync(enteredPass, user.passwordHash);

    if (!isBcryptMatch) {
      return res.status(401).json(
        errorResponse('AUTH_FAILED', 'Email hoặc mật khẩu không chính xác.')
      );
    }

    const token = generateToken({
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      isDepartmentHead: user.isDepartmentHead || false,
      department: user.department || undefined,
      departmentTitle: user.departmentTitle || undefined,
      status: user.status,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await storage.createAuditLog({
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.uid,
      userId: user.uid,
      userName: user.name,
      userRole: user.role,
      details: `Đăng nhập thành công với vai trò ${user.role}`,
      ipAddress: req.ip,
    });

    const sanitized = sanitizeUser(user);

    return res.json(
      successResponse(
        { token, user: sanitized },
        'Đăng nhập thành công.',
        { token, user: sanitized }
      )
    );
  } catch (err: any) {
    console.error('Error during login:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Đăng nhập không thành công.')
    );
  }
});

// 3. ADMIN LOGIN (SUPER ADMIN & EXECUTIVES)
// Standard admin login: Email -> PostgreSQL user -> Role Verification -> bcrypt compare
// NO universal/demo password bypasses
router.post('/admin-login', authRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = adminLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Vui lòng cung cấp đầy đủ thông tin đăng nhập quản trị.')
      );
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();
    const user = await storage.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json(
        errorResponse('AUTH_FAILED', 'Tài khoản Quản Trị không tồn tại.')
      );
    }

    const upperRole = user.role.toUpperCase();
    if (upperRole !== 'SUPER_ADMIN' && upperRole !== 'ADMIN') {
      return res.status(403).json(
        errorResponse('FORBIDDEN', 'Tài khoản không có thẩm quyền truy cập cổng Quản Trị Hệ Thống.')
      );
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json(
        errorResponse('ACCOUNT_DISABLED', 'Tài khoản Quản Trị đã bị tạm khóa.')
      );
    }

    if (!user.passwordHash) {
      return res.status(401).json(
        errorResponse('AUTH_FAILED', 'Mật khẩu Quản Trị không chính xác.')
      );
    }

    const enteredPass = password.trim();
    const isBcryptMatch = bcrypt.compareSync(enteredPass, user.passwordHash);

    if (!isBcryptMatch) {
      return res.status(401).json(
        errorResponse('AUTH_FAILED', 'Mật khẩu Quản Trị không chính xác.')
      );
    }

    const token = generateToken({
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      isDepartmentHead: true,
      department: user.department || 'Ban Quản Trị Hệ Thống',
      departmentTitle: user.departmentTitle || 'Tổng Giám Đốc / Super Admin',
      status: user.status,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await storage.createAuditLog({
      action: 'ADMIN_LOGIN',
      entityType: 'USER',
      entityId: user.uid,
      userId: user.uid,
      userName: user.name,
      userRole: user.role,
      details: 'Đăng nhập thành công vào Trung Tâm Điều Hành Quản Trị LUBPY Studio',
      ipAddress: req.ip,
    });

    const sanitized = sanitizeUser(user);

    return res.json(
      successResponse(
        { token, user: sanitized },
        'Đăng nhập quản trị thành công.',
        { token, user: sanitized }
      )
    );
  } catch (err: any) {
    console.error('Error during admin login:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Đăng nhập quản trị thất bại.')
    );
  }
});

// 3.1. SYNC ACCOUNT (SECURED: ADMIN ONLY)
// Requires Admin Authentication or valid Admin Security Key
router.post('/sync-account', async (req: AuthRequest, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'] as string;
    const isKeyAuthorized = process.env.ADMIN_SECURITY_KEY && adminKey === process.env.ADMIN_SECURITY_KEY;
    const isUserAdmin = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role.toUpperCase());

    if (!isKeyAuthorized && !isUserAdmin) {
      return res.status(403).json(
        errorResponse('FORBIDDEN', 'Yêu cầu quyền Quản Trị Hệ Thống để thực hiện đồng bộ tài khoản.')
      );
    }

    const { email, name, role, password, isDepartmentHead, department, departmentTitle, phone, dob, photoUrl } = req.body;
    if (!email) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Email là bắt buộc.'));
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await storage.findUserByEmail(cleanEmail);

    let passwordHash: string | undefined = undefined;
    if (password && String(password).trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      passwordHash = bcrypt.hashSync(String(password).trim(), salt);
    }

    if (existing) {
      const updateData: any = {
        name: name ? String(name).trim() : existing.name,
        role: role ? String(role).toUpperCase() : existing.role,
        isDepartmentHead: isDepartmentHead !== undefined ? !!isDepartmentHead : existing.isDepartmentHead,
      };
      if (passwordHash) updateData.passwordHash = passwordHash;
      if (department) updateData.department = department;
      if (departmentTitle) updateData.departmentTitle = departmentTitle;
      if (phone) updateData.phone = phone;
      if (dob) updateData.dob = dob;
      if (photoUrl) {
        updateData.photoUrl = photoUrl;
        updateData.avatar = photoUrl;
      }

      const updated = await storage.updateUser(existing.id, updateData);
      return res.json(successResponse(sanitizeUser(updated), 'Đồng bộ tài khoản thành công.'));
    } else {
      const uidRole = role ? String(role).toLowerCase() : 'staff';
      const defaultPass = password ? String(password).trim() : 'SecurePass@2026';
      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(defaultPass, salt);

      const newUser = await storage.createUser({
        uid: `usr_${uidRole}_${Date.now()}`,
        name: name ? String(name).trim() : cleanEmail.split('@')[0],
        email: cleanEmail,
        passwordHash: newHash,
        role: role ? String(role).toUpperCase() : 'DEVELOPER',
        isDepartmentHead: !!isDepartmentHead,
        department: department || 'Đội Ngũ Kỹ Thuật (Tech Team)',
        departmentTitle: departmentTitle || 'Trưởng Nghiệp Vụ',
        phone: phone || '',
        dob: dob || '',
        photoUrl: photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
        avatar: photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
        status: 'active',
      });
      return res.status(201).json(successResponse(sanitizeUser(newUser), 'Tạo và đồng bộ tài khoản thành công.'));
    }
  } catch (err: any) {
    console.error('Error syncing account:', err);
    return res.status(500).json(errorResponse('SERVER_ERROR', err.message || 'Lỗi đồng bộ tài khoản'));
  }
});

// 4. SEND OTP (SECURE - NO OTP CODE EXPOSED IN RESPONSE)
router.post('/send-otp', authRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('INVALID_INPUT', 'Vui lòng cung cấp Email hoặc Số điện thoại hợp lệ.')
      );
    }

    const { target } = parseResult.data;
    const cleanTarget = target.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    await storage.createOtp(cleanTarget, code, expiresAt);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SECURE_OTP_DEBUG] OTP for ${cleanTarget}: ${code} (Expires in 5 minutes)`);
    }

    return res.json(
      successResponse(
        { target: cleanTarget, expiresIn: 300 },
        `Mã xác thực OTP đã được tạo và gửi thành công tới: ${cleanTarget}`
      )
    );
  } catch (err: any) {
    console.error('Error sending OTP:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', 'Không thể khởi tạo mã OTP.')
    );
  }
});

// 5. VERIFY OTP (STRICT: VERIFIED AGAINST POSTGRESQL, NO BYPASS)
router.post('/verify-otp', authRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('INVALID_INPUT', 'Vui lòng nhập đích nhận và mã OTP 6 chữ số.')
      );
    }

    const { target, code } = parseResult.data;
    const cleanTarget = target.trim().toLowerCase();
    const isValid = await storage.verifyOtp(cleanTarget, code.trim());

    if (!isValid) {
      return res.status(400).json(
        errorResponse('INVALID_OTP', 'Mã OTP không chính xác hoặc đã hết hiệu lực (5 phút).')
      );
    }

    return res.json(
      successResponse(
        { target: cleanTarget, verified: true },
        'Xác thực OTP thành công.'
      )
    );
  } catch (err: any) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', 'Không thể xác thực mã OTP.')
    );
  }
});

// Helper for fetching self profile
async function handleGetProfile(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json(
      errorResponse('UNAUTHORIZED', 'Chưa đăng nhập hoặc phiên làm việc đã kết thúc.', 401)
    );
  }

  try {
    const user = await storage.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json(
        errorResponse('USER_NOT_FOUND', 'Không tìm thấy thông tin tài khoản.')
      );
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      res.clearCookie('token');
      return res.status(403).json(
        errorResponse('ACCOUNT_DISABLED', 'Tài khoản của bạn đã bị khóa.')
      );
    }

    const sanitized = sanitizeUser(user);

    return res.json(
      successResponse(
        sanitized,
        'Lấy thông tin tài khoản thành công.',
        { user: sanitized }
      )
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
}

// Helper for updating self profile
async function handleUpdateProfile(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json(
      errorResponse('UNAUTHORIZED', 'Chưa đăng nhập hoặc phiên làm việc đã kết thúc.', 401)
    );
  }

  try {
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu cập nhật không hợp lệ.')
      );
    }

    const body = parseResult.data;
    const updateFields: any = {};

    if (body.name !== undefined) updateFields.name = body.name;
    if (body.phone !== undefined) updateFields.phone = body.phone;
    if (body.dob !== undefined) updateFields.dob = body.dob;
    if (body.hometown !== undefined) updateFields.hometown = body.hometown;
    if (body.occupation !== undefined) updateFields.occupation = body.occupation;
    if (body.workEnvironment !== undefined) updateFields.workEnvironment = body.workEnvironment;
    if (body.skills !== undefined) updateFields.skills = body.skills;
    if (body.photoUrl !== undefined) updateFields.photoUrl = body.photoUrl;
    if (body.avatar !== undefined) updateFields.avatar = body.avatar;

    const updated = await storage.updateUser(req.user.id, updateFields);
    if (!updated) {
      return res.status(404).json(
        errorResponse('USER_NOT_FOUND', 'Không tìm thấy tài khoản để cập nhật.')
      );
    }

    const sanitized = sanitizeUser(updated);

    return res.json(
      successResponse(
        sanitized,
        'Cập nhật hồ sơ tài khoản thành công.',
        { user: sanitized }
      )
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
}

// 6. GET CURRENT AUTHENTICATED USER & PROFILE ALIAS
router.get(['/me', '/profile'], handleGetProfile);
router.post('/profile', handleUpdateProfile);
router.put('/profile', handleUpdateProfile);

// 7. LOGOUT
router.post('/logout', (req: AuthRequest, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json(
    successResponse(null, 'Đăng xuất khỏi hệ thống thành công.')
  );
});

export default router;
