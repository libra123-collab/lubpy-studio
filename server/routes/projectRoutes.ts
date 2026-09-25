import { Router, Response } from 'express';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.ts';
import {
  createProjectSchema,
  updateProjectSchema,
  assignProjectSchema,
} from '../schemas/validationSchemas.ts';
import { realtime } from '../realtime/socket.ts';
import { fcmService } from '../services/fcmService.ts';
import { generateProjectThumbnail } from '../services/imageGenerationService.ts';
import {
  successResponse,
  errorResponse,
  formatProjectResponse,
  normalizeProjectStatus,
} from '../utils/responseFormatter.ts';

const router = Router();

// VALID PROJECT STATUS TRANSITIONS
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONSULTING', 'APPROVED', 'ASSIGNED', 'CANCELLED', 'PLANNING', 'IN_PROGRESS', 'CODING'],
  PLANNING: ['ASSIGNED', 'DEPOSIT_50', 'CODING', 'CANCELLED'],
  CONSULTING: ['APPROVED', 'ASSIGNED', 'PENDING', 'CANCELLED'],
  APPROVED: ['ASSIGNED', 'DEPOSIT_50', 'CANCELLED', 'REFUNDED'],
  ASSIGNED: ['DEPOSIT_50', 'CODING', 'IN_PROGRESS', 'CANCELLED'],
  DEPOSIT_50: ['CODING', 'IN_PROGRESS', 'REVIEW', 'CANCELLED', 'REFUNDED'],
  CODING: ['REVIEW', 'PAID_100', 'DELIVERED', 'COMPLETED', 'DEPOSIT_50'],
  IN_PROGRESS: ['REVIEW', 'PAID_100', 'DELIVERED', 'COMPLETED'],
  REVIEW: ['PAID_100', 'DELIVERED', 'COMPLETED', 'CODING'],
  PAID_100: ['DELIVERED', 'COMPLETED', 'REVIEW'],
  DELIVERED: ['PAID_100', 'REVIEW'],
  COMPLETED: ['DELIVERED', 'REVIEW'],
  CANCELLED: ['PENDING', 'PLANNING'],
  REFUNDED: [],
};

// GENERATE THUMBNAIL ON DEMAND
router.post('/generate-thumbnail', async (req: AuthRequest, res: Response) => {
  try {
    const { title, projectType, techStack } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Tiêu đề dự án không hợp lệ.'));
    }

    const result = await generateProjectThumbnail({
      title,
      projectType,
      techStack,
    });

    return res.json(
      successResponse(result, 'Tạo ảnh thumbnail placeholder cho dự án thành công.')
    );
  } catch (err: any) {
    console.error('Error generating project thumbnail:', err);
    return res.status(500).json(errorResponse('SERVER_ERROR', err.message));
  }
});

// 1. GET ALL PROJECTS (Filtered by user role)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const filterOptions = user
      ? { role: user.role, uid: user.uid, email: user.email, name: user.name }
      : undefined;

    const data = await storage.getAllProjects(filterOptions);
    const formatted = data.map(formatProjectResponse);

    return res.json(
      successResponse(formatted, 'Lấy danh sách dự án thành công.')
    );
  } catch (err: any) {
    console.error('Error fetching projects:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tải danh sách dự án')
    );
  }
});

// 2. GET SINGLE PROJECT BY ID (Authenticated & Authorized)
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const p = await storage.getProjectById(id);

    if (!p) {
      return res.status(404).json(
        errorResponse('PROJECT_NOT_FOUND', 'Không tìm thấy dự án.')
      );
    }

    // Role-based access and ownership check
    const user = req.user!;
    const userRole = (user.role || '').toUpperCase();

    if (userRole === 'CLIENT') {
      const isOwner = (p.clientId && p.clientId === user.uid) || 
                      (p.clientEmail && p.clientEmail.toLowerCase() === user.email.toLowerCase());
      if (!isOwner) {
        return res.status(403).json(
          errorResponse('FORBIDDEN', 'Bạn không có quyền truy cập hồ sơ dự án của khách hàng khác.')
        );
      }
    } else if (userRole === 'DEV') {
      const isAssigned = (p.assignedDevId && p.assignedDevId === user.uid) ||
                         (p.assignedDevName && p.assignedDevName.toLowerCase() === user.name.toLowerCase());
      if (!isAssigned && !user.isDepartmentHead) {
        return res.status(403).json(
          errorResponse('FORBIDDEN', 'Bạn chỉ có quyền truy cập dự án đã được phân công hoặc dưới sự quản lý của Trưởng bộ phận.')
        );
      }
    }

    const formatted = formatProjectResponse(p);
    return res.json(
      successResponse(formatted, 'Lấy thông tin dự án thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 3. CREATE PROJECT
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu dự án không hợp lệ.')
      );
    }

    const body = parseResult.data;
    const user = req.user;

    const clientName = body.clientName || body.name || user?.name || 'Khách Hàng';
    const clientEmail = body.clientEmail || user?.email || 'client@gmail.com';
    const clientPhone = body.clientPhone || body.phone || '';
    const title = body.title || body.projectName || 'Đồ án CNTT mới';
    const description = body.description || body.details || '';
    const projectType = body.projectType || 'Đồ án tốt nghiệp';
    const deadline = body.deadline || '2026-12-31';
    const priceVnd = body.priceVnd || body.price || body.totalAmount || 12000000;
    const depositAmount = body.depositAmount || 0;
    const remainingAmount = Math.max(0, priceVnd - depositAmount);

    const generatedId = body.id || body.projectCode || `PRJ-${Math.floor(2400 + Math.random() * 7500)}`;
    const techStackStr = Array.isArray(body.techStack)
      ? JSON.stringify(body.techStack)
      : typeof body.techStack === 'string'
      ? body.techStack
      : JSON.stringify(['React', 'Node.js']);

    const initialReports = JSON.stringify([
      {
        author: 'LUBPY System Automation',
        content: 'Yêu cầu dự án đã được tiếp nhận thành công trên hệ thống LUBPY Studio. Đội ngũ CSKH & Tech Lead đang tiến hành thẩm định kỹ thuật.',
        timestamp: new Date().toLocaleString('vi-VN'),
      },
    ]);

    const initialDocs = JSON.stringify([]);

    // Automatically create placeholder thumbnail based on project title if not provided
    let thumbnailUrl = body.thumbnailUrl || body.imageUrl;
    if (!thumbnailUrl) {
      try {
        const thumbResult = await generateProjectThumbnail({
          title,
          projectType,
          techStack: body.techStack,
        });
        thumbnailUrl = thumbResult.thumbnailUrl;
      } catch (err) {
        console.warn('Auto thumbnail generation warning on project create:', err);
      }
    }

    const newProject = await storage.createProject({
      id: generatedId,
      projectCode: generatedId,
      clientId: user?.uid || `client_${Date.now()}`,
      clientName,
      clientEmail,
      clientPhone,
      title,
      description,
      projectType,
      techStack: techStackStr,
      deadline,
      status: 'PENDING',
      progress: 5,
      priceVnd,
      depositAmount,
      remainingAmount,
      devCommissionRate: body.devCommissionRate || 65,
      assignedDevName: body.assignedDevName || 'Chưa phân công',
      assignedCsName: body.assignedCsName || 'Đặng Ngọc Mai (Consultant)',
      thumbnailUrl,
      documents: initialDocs,
      reports: initialReports,
      createdBy: user?.name || clientName,
    });

    await storage.createNotification({
      type: 'PROJECT',
      title: `Dự án mới [${generatedId}] được tạo`,
      content: `Khách hàng ${clientName} vừa đăng ký dự án: "${title}". Vui lòng kiểm tra và phân công chuyên viên.`,
      targetDept: 'ALL',
    });

    await storage.createAuditLog({
      action: 'CREATE_PROJECT',
      entityType: 'PROJECT',
      entityId: generatedId,
      userId: user?.uid || 'guest_client',
      userName: user?.name || clientName,
      userRole: user?.role || 'CLIENT',
      details: `Khởi tạo dự án ${generatedId} - ${title} (Ngân sách: ${priceVnd.toLocaleString('vi-VN')} VNĐ)`,
      ipAddress: req.ip,
    });

    const formatted = formatProjectResponse(newProject);

    // Realtime broadcast & Push notification
    realtime.emitProjectUpdate(generatedId, formatted);
    fcmService.notifyProjectStatus(undefined, generatedId, 'PENDING').catch(() => {});

    return res.status(201).json(
      successResponse(formatted, 'Khởi tạo dự án thành công.')
    );
  } catch (err: any) {
    console.error('Error creating project:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tạo dự án.')
    );
  }
});

// 4. UPDATE PROJECT
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu cập nhật không hợp lệ.')
      );
    }

    const body = parseResult.data;
    const user = req.user!;

    const current = await storage.getProjectById(id);
    if (!current) {
      return res.status(404).json(
        errorResponse('PROJECT_NOT_FOUND', 'Không tìm thấy dự án cần cập nhật.')
      );
    }

    // Role check and Field-level authorization
    const userRole = user.role.toUpperCase();
    if (userRole === 'CLIENT') {
      const isOwner = (current.clientId && current.clientId === user.uid) ||
                      (current.clientEmail && current.clientEmail.toLowerCase() === user.email.toLowerCase());
      if (!isOwner) {
        return res.status(403).json(
          errorResponse('FORBIDDEN', 'Bạn không có quyền chỉnh sửa dự án này.')
        );
      }
      // Clients are strictly forbidden from modifying financial data, staff assignments, or project status
      if (body.priceVnd !== undefined || body.price !== undefined || body.depositAmount !== undefined || 
          body.devCommissionRate !== undefined || body.assignedDevName !== undefined || 
          body.assignedDevId !== undefined || body.status !== undefined) {
        return res.status(403).json(
          errorResponse('FORBIDDEN', 'Khách hàng không được phép tự ý thay đổi báo giá, trạng thái dự án hoặc phân công nhân sự.')
        );
      }
    } else if (userRole === 'DEV') {
      const isAssigned = (current.assignedDevId && current.assignedDevId === user.uid) ||
                         (current.assignedDevName && current.assignedDevName.toLowerCase() === user.name.toLowerCase());
      if (!isAssigned && !user.isDepartmentHead) {
        return res.status(403).json(
          errorResponse('FORBIDDEN', 'Bạn chỉ có quyền cập nhật dự án kỹ thuật đã được phân công.')
        );
      }
      // Devs cannot modify pricing or accounting deposits
      if (body.priceVnd !== undefined || body.price !== undefined || body.depositAmount !== undefined || body.devCommissionRate !== undefined) {
        return res.status(403).json(
          errorResponse('FORBIDDEN', 'Lập trình viên không có quyền thay đổi thông số tài chính và hoa hồng của dự án.')
        );
      }
    }

    const updateData: any = {};

    const rawStatus = body.status || body.projectStatus;
    if (rawStatus) {
      const normalized = normalizeProjectStatus(rawStatus) || 'PENDING';
      updateData.status = normalized;
      if (normalized === 'DELIVERED' || normalized === 'COMPLETED') {
        updateData.deliveredAt = new Date();
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
    }

    if (body.progress !== undefined) updateData.progress = Number(body.progress);
    
    const priceVal = body.priceVnd !== undefined ? body.priceVnd : body.price !== undefined ? body.price : body.totalAmount;
    if (priceVal !== undefined) {
      updateData.priceVnd = Number(priceVal);
      updateData.remainingAmount = Number(priceVal) - (Number(current.depositAmount) || 0);
    }

    const depositVal = body.depositAmount !== undefined ? body.depositAmount : body.deposited;
    if (depositVal !== undefined) {
      updateData.depositAmount = Number(depositVal);
      updateData.remainingAmount = (Number(current.priceVnd) || 0) - Number(depositVal);
    }

    if (body.devCommissionRate !== undefined) updateData.devCommissionRate = Number(body.devCommissionRate);
    if (body.assignedDevName !== undefined) updateData.assignedDevName = body.assignedDevName;
    if (body.assignedDevId !== undefined) updateData.assignedDevId = body.assignedDevId;
    if (body.assignedCsName !== undefined) updateData.assignedCsName = body.assignedCsName;
    if (body.assignedCsId !== undefined) updateData.assignedCsId = body.assignedCsId;
    if (body.feedback !== undefined) updateData.feedback = body.feedback;
    if (body.description !== undefined) updateData.description = body.description;

    if (body.documents !== undefined) {
      updateData.documents = Array.isArray(body.documents) ? JSON.stringify(body.documents) : body.documents;
    }
    if (body.reports !== undefined) {
      updateData.reports = Array.isArray(body.reports) ? JSON.stringify(body.reports) : body.reports;
    }

    const updated = await storage.updateProject(id, updateData);

    await storage.createAuditLog({
      action: 'UPDATE_PROJECT',
      entityType: 'PROJECT',
      entityId: id,
      userId: user.uid,
      userName: user.name,
      userRole: user.role,
      details: `Cập nhật thông tin dự án ${id}: Trạng thái ${updateData.status || current.status}`,
      ipAddress: req.ip,
    });

    const formatted = formatProjectResponse(updated || current);

    // Realtime broadcast & Push notification
    if (updated) {
      realtime.emitProjectUpdate(id, formatted);
      if (updateData.status) {
        fcmService.notifyProjectStatus(undefined, id, updateData.status).catch(() => {});
      }
    }

    return res.json(
      successResponse(formatted, 'Cập nhật dự án thành công.')
    );
  } catch (err: any) {
    console.error('Error updating project:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể cập nhật dự án.')
    );
  }
});

// 5. ASSIGN PROJECT TO DEVELOPER / CS
router.post('/:id/assignments', requireAuth, requireRoles('TECH_LEAD', 'DEVELOPER', 'CS', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = assignProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('INVALID_INPUT', parseResult.error.issues[0]?.message || 'Thông tin phân công không hợp lệ.')
      );
    }

    const { userName, userId, role } = parseResult.data;
    const updateFields: any = {};
    const upperRole = role.toUpperCase();

    if (upperRole.includes('DEV') || upperRole.includes('TECH')) {
      updateFields.assignedDevName = userName;
      if (userId) updateFields.assignedDevId = userId;
      updateFields.status = 'ASSIGNED';
    } else if (upperRole.includes('CS')) {
      updateFields.assignedCsName = userName;
      if (userId) updateFields.assignedCsId = userId;
    }

    const updated = await storage.updateProject(id, updateFields);

    await storage.createNotification({
      type: 'PROJECT',
      title: `Phân công nhiệm vụ dự án [${id}]`,
      content: `Bạn vừa được phân công phụ trách dự án ${id} với vai trò ${role}.`,
      targetDept: upperRole.includes('TECH') ? 'TECH' : 'CSKH',
    });

    const formatted = formatProjectResponse(updated);

    return res.json(
      successResponse(
        { projectId: id, assignedTo: userName, role, project: formatted },
        `Phân công dự án ${id} cho ${userName} thành công.`
      )
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

export default router;
