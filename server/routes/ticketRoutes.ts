import { Router, Response } from 'express';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';
import {
  createTicketSchema,
  addTicketMessageSchema,
  sendLiveChatSchema,
} from '../schemas/validationSchemas.ts';
import { realtime } from '../realtime/socket.ts';
import { fcmService } from '../services/fcmService.ts';
import {
  successResponse,
  errorResponse,
  formatTicketResponse,
  formatChatMessageResponse,
} from '../utils/responseFormatter.ts';

const router = Router();

// 1. GET ALL TICKETS (Filtered by role)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let data = await storage.getAllTickets();

    if (user && user.role.toUpperCase() === 'CLIENT') {
      data = data.filter(t => 
        (t.clientId && t.clientId === user.uid) || 
        (t.clientEmail && t.clientEmail.toLowerCase() === user.email.toLowerCase()) ||
        (t.clientName && t.clientName.toLowerCase().includes(user.name.toLowerCase()))
      );
    }

    const formatted = data.map(formatTicketResponse);

    return res.json(
      successResponse(formatted, 'Lấy danh sách ticket thành công.')
    );
  } catch (err: any) {
    console.error('Error fetching tickets:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tải danh sách ticket.')
    );
  }
});

// 2. GET SINGLE TICKET
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await storage.getTicketById(id);

    if (!ticket) {
      return res.status(404).json(
        errorResponse('TICKET_NOT_FOUND', 'Không tìm thấy ticket yêu cầu.')
      );
    }

    const formatted = formatTicketResponse(ticket);
    return res.json(
      successResponse(formatted, 'Lấy thông tin ticket thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 3. CREATE TICKET
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu ticket không hợp lệ.')
      );
    }

    const body = parseResult.data;
    const user = req.user;

    const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    const clientName = body.clientName || user?.name || 'Khách Hàng';
    const clientEmail = body.clientEmail || user?.email || 'client@lubpystudio.vn';
    const clientPhone = body.clientPhone || (user as any)?.phone || '';
    const subject = body.subject || body.title || 'Hỗ trợ kỹ thuật';
    const description = body.description || body.content || body.body || '';
    const priority = (body.priority || 'MEDIUM').toUpperCase();

    const initialMessages = [
      {
        sender: clientName,
        senderRole: 'client',
        content: body.initialMessage || description || 'Khởi tạo yêu cầu hỗ trợ',
        body: body.initialMessage || description || 'Khởi tạo yêu cầu hỗ trợ',
        message: body.initialMessage || description || 'Khởi tạo yêu cầu hỗ trợ',
        timestamp: new Date().toLocaleString('vi-VN'),
        createdAt: new Date().toISOString(),
      },
    ];

    const newTicket = await storage.createTicket({
      id: ticketId,
      ticketCode: ticketId,
      clientId: user?.uid || `client_${Date.now()}`,
      clientName,
      clientEmail,
      clientPhone,
      projectId: body.projectId || undefined,
      subject,
      description,
      priority,
      status: 'OPEN',
      assignedCs: 'Đặng Ngọc Mai (CSKH)',
      messages: JSON.stringify(initialMessages),
    });

    await storage.createNotification({
      type: 'TICKET',
      title: `Ticket mới [${ticketId}]`,
      content: `Khách hàng ${clientName} vừa tạo ticket: "${subject}". Mức độ ưu tiên: ${priority}.`,
      targetDept: 'CSKH',
    });

    const formatted = formatTicketResponse(newTicket);

    realtime.emitTicketUpdate(ticketId, formatted);
    fcmService.notifyTicketReply(undefined, ticketId, subject, clientName).catch(() => {});

    return res.status(201).json(
      successResponse(formatted, 'Khởi tạo ticket thành công.')
    );
  } catch (err: any) {
    console.error('Error creating ticket:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tạo ticket.')
    );
  }
});

// Helper for adding messages & replying to ticket
async function handleTicketMessageReply(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const parseResult = addTicketMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Nội dung tin nhắn không hợp lệ.')
      );
    }

    const { content, message, body, sender, senderRole } = parseResult.data;
    const finalContent = content || message || body;

    if (!finalContent || finalContent.trim().length === 0) {
      return res.status(400).json(
        errorResponse('EMPTY_MESSAGE', 'Nội dung tin nhắn phản hồi không được để trống.')
      );
    }

    const user = req.user;
    const effectiveSender = sender || user?.name || 'Chuyên viên Hỗ Trợ';
    const effectiveRole = senderRole || (user?.role ? user.role.toLowerCase() : 'cskh');

    const updatedTicket = await storage.addTicketMessage(id, {
      sender: effectiveSender,
      senderRole: effectiveRole,
      content: finalContent.trim(),
      timestamp: new Date().toLocaleString('vi-VN'),
    });

    if (!updatedTicket) {
      return res.status(404).json(
        errorResponse('TICKET_NOT_FOUND', 'Không tìm thấy ticket để gửi phản hồi.')
      );
    }

    const formatted = formatTicketResponse(updatedTicket);

    realtime.emitTicketUpdate(id, formatted);
    fcmService.notifyTicketReply(undefined, id, updatedTicket.subject, effectiveSender).catch(() => {});

    return res.json(
      successResponse(formatted, 'Gửi tin nhắn phản hồi ticket thành công.')
    );
  } catch (err: any) {
    console.error('Error adding ticket message:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể gửi phản hồi ticket.')
    );
  }
}

// 4. ADD MESSAGE TO TICKET & ALIAS REPLY ROUTE
router.post(['/:id/messages', '/:id/reply'], handleTicketMessageReply);

// 5. UPDATE TICKET STATUS
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedCs } = req.body;

    const updateFields: any = {};
    if (status) updateFields.status = String(status).toUpperCase();
    if (priority) updateFields.priority = String(priority).toUpperCase();
    if (assignedCs) updateFields.assignedCs = assignedCs;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateFields.resolvedAt = new Date();
    }

    const updated = await storage.updateTicket(id, updateFields);
    if (!updated) {
      return res.status(404).json(
        errorResponse('TICKET_NOT_FOUND', 'Không tìm thấy ticket để cập nhật.')
      );
    }

    const formatted = formatTicketResponse(updated);
    realtime.emitTicketUpdate(id, formatted);

    return res.json(
      successResponse(formatted, 'Cập nhật trạng thái ticket thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 6. LIVE CHATS (For legacy and direct chat endpoints)
router.get('/live-chats', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.query;
    let data = await storage.getLiveChats();
    if (sessionId) {
      data = data.filter(c => c.sessionId === String(sessionId));
    }
    const formatted = data.map(formatChatMessageResponse);
    return res.json(
      successResponse(formatted, 'Lấy lịch sử tin nhắn trực tuyến thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

router.post('/live-chats', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = sendLiveChatSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu chat không hợp lệ.')
      );
    }

    const { sessionId, sender, senderRole, message, content, body } = parseResult.data;
    const finalMsg = message || content || body;

    if (!finalMsg || finalMsg.trim().length === 0) {
      return res.status(400).json(
        errorResponse('EMPTY_MESSAGE', 'Nội dung tin nhắn không được để trống.')
      );
    }

    const user = req.user;
    const item = await storage.createLiveChat({
      sessionId: sessionId || 'default-session',
      senderId: user?.uid || null,
      sender: sender || user?.name || 'Khách hàng',
      senderRole: senderRole || (user?.role ? user.role.toLowerCase() : 'client'),
      message: finalMsg.trim(),
    });

    const formatted = formatChatMessageResponse(item);

    // Socket.IO broadcast
    const io = realtime.getIO();
    if (io) {
      io.to(`chat:${sessionId || 'default-session'}`).emit('new_chat_message', formatted);
      io.to('dept:CS').emit('new_chat_message', formatted);
    }

    return res.status(201).json(
      successResponse(formatted, 'Gửi tin nhắn chat thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

export default router;
