import { Router, Response } from 'express';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.ts';
import { createNotificationSchema } from '../schemas/validationSchemas.ts';
import { realtime } from '../realtime/socket.ts';
import {
  successResponse,
  errorResponse,
  formatNotificationResponse,
} from '../utils/responseFormatter.ts';

const router = Router();

// 1. GET NOTIFICATIONS (Filtered for user's department & ownership)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const all = await storage.getAllNotifications();

    let filtered = all;

    if (!user) {
      // Unauthenticated: only view public ALL notifications
      filtered = all.filter(n => n.targetDept === 'ALL' || n.targetDept === 'CLIENT');
    } else {
      const userDept = (user.department || '').toUpperCase();
      const userRole = user.role.toUpperCase();

      filtered = all.filter(n => {
        if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
        if (n.targetUserId && n.targetUserId === user.uid) return true;
        if (n.targetDept === 'ALL') return true;
        if (userRole.includes('TECH') && n.targetDept === 'TECH') return true;
        if (userRole.includes('CS') && (n.targetDept === 'CSKH' || n.targetDept === 'CS')) return true;
        if (userRole.includes('ACCOUNTING') && n.targetDept === 'ACCOUNTING') return true;
        if (userRole.includes('HR') && n.targetDept === 'HR') return true;
        if (userRole === 'CLIENT' && n.targetDept === 'CLIENT') return true;
        return false;
      });
    }

    const formatted = filtered.map(formatNotificationResponse);

    return res.json(
      successResponse(formatted, 'Lấy danh sách thông báo thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tải thông báo.')
    );
  }
});

// 2. CREATE NOTIFICATION
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createNotificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu thông báo không hợp lệ.')
      );
    }

    const { type, title, content, body, message, targetDept, targetUserId } = parseResult.data;
    const finalContent = content || body || message || title;

    const inserted = await storage.createNotification({
      type,
      title,
      content: finalContent,
      targetDept: (targetDept === 'CS' ? 'CSKH' : targetDept) as any,
      targetUserId: targetUserId || undefined,
    });

    const formatted = formatNotificationResponse(inserted);

    // Realtime broadcast
    realtime.emitNotification({ userId: targetUserId, dept: targetDept }, formatted);

    return res.status(201).json(
      successResponse(formatted, 'Tạo thông báo thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 3. MARK NOTIFICATION AS READ
router.put('/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notifId = parseInt(id, 10);
    const success = await storage.markNotificationRead(notifId);

    return res.json(
      successResponse({ id: notifId, isRead: true }, 'Đã đánh dấu thông báo là đã đọc.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 4. GET AUDIT LOGS (ADMIN ONLY)
router.get('/audit-logs', requireAuth, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const data = await storage.getAllAuditLogs();
    return res.json(
      successResponse(data, 'Lấy nhật ký kiểm toán hệ thống thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

export default router;
