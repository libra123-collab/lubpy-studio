import { Router, Response } from 'express';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { sendLiveChatSchema } from '../schemas/validationSchemas.ts';
import { realtime } from '../realtime/socket.ts';
import { successResponse, errorResponse, formatChatMessageResponse } from '../utils/responseFormatter.ts';

const router = Router();

/**
 * 1. GET /api/v1/chat/messages or GET /api/v1/chat
 * Fetch chat message history (optionally filtered by sessionId)
 */
router.get(['/', '/messages'], async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.query;
    let data = await storage.getLiveChats();

    if (sessionId) {
      data = data.filter(c => c.sessionId === String(sessionId));
    }

    const formatted = data.map(formatChatMessageResponse);
    return res.json(
      successResponse(formatted, 'Lấy lịch sử tin nhắn chat thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tải lịch sử chat.')
    );
  }
});

/**
 * 2. POST /api/v1/chat/messages or POST /api/v1/chat/send or POST /api/v1/chat
 * Send a new chat message compatible with Mobile and Web clients
 */
router.post(['/', '/messages', '/send'], async (req: AuthRequest, res: Response) => {
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
    const effectiveSessionId = sessionId || (user ? `session_${user.uid}` : 'default-session');
    const effectiveSender = sender || user?.name || 'Khách hàng';
    const effectiveRole = senderRole || (user?.role ? user.role.toLowerCase() : 'client');

    const item = await storage.createLiveChat({
      sessionId: effectiveSessionId,
      senderId: user?.uid || null,
      sender: effectiveSender,
      senderRole: effectiveRole,
      message: finalMsg.trim(),
    });

    const formatted = formatChatMessageResponse(item);

    // Realtime broadcast via Socket.IO
    const io = realtime.getIO();
    if (io) {
      io.to(`chat:${effectiveSessionId}`).emit('new_chat_message', formatted);
      io.to('dept:CS').emit('new_chat_message', formatted);
      io.to('dept:ADMIN').emit('new_chat_message', formatted);
    }

    return res.status(201).json(
      successResponse(formatted, 'Gửi tin nhắn thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể gửi tin nhắn.')
    );
  }
});

/**
 * 3. GET /api/v1/chat/sessions
 * List active chat sessions
 */
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const all = await storage.getLiveChats();
    const sessionMap = new Map<string, { sessionId: string; lastMessage: any; messageCount: number }>();

    for (const c of all) {
      const existing = sessionMap.get(c.sessionId);
      if (!existing) {
        sessionMap.set(c.sessionId, {
          sessionId: c.sessionId,
          lastMessage: formatChatMessageResponse(c),
          messageCount: 1,
        });
      } else {
        existing.messageCount += 1;
        existing.lastMessage = formatChatMessageResponse(c);
      }
    }

    const sessions = Array.from(sessionMap.values());
    return res.json(
      successResponse(sessions, 'Lấy danh sách phiên chat thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tải phiên chat.')
    );
  }
});

export default router;
