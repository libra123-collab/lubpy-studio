import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { sendLiveChatSchema } from '../schemas/validationSchemas.ts';
import { realtime } from '../realtime/socket.ts';
import { successResponse, errorResponse, formatChatMessageResponse } from '../utils/responseFormatter.ts';

const router = Router();

// Server-side Gemini AI Client for Lubpy AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

/**
 * 4. POST /api/v1/chat/lubpy-ai
 * Chatbot AI (Lubpy AI) handling:
 * - Greeting & announcing LUBPY Studio services
 * - Categorizing client specialized requirements & sending notification to CSKH
 * - Handover to CSKH when client asks deep/non-basic questions
 * - Generates AI appreciation letter when client is 100% satisfied
 */
router.post('/lubpy-ai', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      message, 
      clientName = 'Quý khách', 
      clientEmail = '', 
      clientPhone = '',
      sessionId, 
      isAppreciationRequest = false,
      projectName = '' 
    } = req.body;

    if (!message && !isAppreciationRequest) {
      return res.status(400).json(errorResponse('EMPTY_MESSAGE', 'Thiếu nội dung tin nhắn.'));
    }

    const effectiveSessionId = sessionId || (req.user ? `session_${req.user.uid}` : `session_guest_${Date.now()}`);

    // If client requested AI appreciation letter
    if (isAppreciationRequest) {
      const thankYouPrompt = `Bạn là Lubpy AI - Trợ lý trí tuệ nhân tạo chính thức của LUBPY STUDIO.
Khách hàng "${clientName}" vừa hoàn thành và xác nhận hoàn toàn hài lòng 100% với dự án "${projectName}".
Hãy soạn một bức thư/tin nhắn cảm ơn chân thành, ấm áp, trang trọng và mang đậm phong cách công nghệ cao.
Nội dung bao gồm:
1. Chúc mừng khách hàng đã nghiệm thu thành công dự án "${projectName}".
2. Cảm ơn sự tin tưởng đồng hành cùng đội ngũ kỹ sư và chuyên viên LUBPY STUDIO.
3. Kích hoạt chính sách bảo hành hỗ trợ source code trọn đời & tặng kèm mã giảm giá LUBPY_VIP20 (20%) cho dự án tiếp theo.
4. Lời chúc thành công rực rỡ trong công việc/kỳ bảo vệ đồ án.
Viết bằng tiếng Việt, thân thiện, súc tích (khoảng 3-4 đoạn ngắn).`;

      let aiText = '';
      try {
        if (process.env.GEMINI_API_KEY) {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: thankYouPrompt,
          });
          aiText = response.text || '';
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to built-in appreciation:', geminiErr);
      }

      if (!aiText) {
        aiText = `🤖 LUBPY AI xin trân trọng gửi lời tri ân sâu sắc đến bạn ${clientName}!\n\nChúng tôi vô cùng vinh hạnh khi bạn hoàn toàn hài lòng với dự án "${projectName}". Sự tin tưởng và đồng hành của bạn là động lực to lớn cho toàn thể đội ngũ Kỹ Sư & Chuyên Viên LUBPY STUDIO.\n\n✨ Đặc quyền của bạn đã được kích hoạt:\n- 🛡️ Bảo hành và hỗ trợ giải đáp kỹ thuật Source Code trọn đời.\n- 🎓 Hỗ trợ ôn luyện demo và trả lời câu hỏi phản biện 1-1.\n- 🎁 Tặng bạn mã ưu đãi LUBPY_VIP20 giảm 20% cho dự án tiếp theo.\n\nChúc bạn đạt điểm số cao nhất trong kỳ bảo vệ và gặt hái nhiều thành công rực rỡ trên con đường sự nghiệp! 🚀`;
      }

      return res.json(successResponse({
        reply: aiText,
        sender: 'Lubpy AI',
        senderRole: 'lubpy_ai',
        isHandoverToCS: false,
      }, 'Tạo lời tri ân thành công.'));
    }

    // Standard Chat with Lubpy AI
    const lowerMsg = (message || '').toLowerCase();
    
    // Check if client wants human CS specialist
    const wantsHumanCS = 
      lowerMsg.includes('gặp người') || 
      lowerMsg.includes('gặp cskh') || 
      lowerMsg.includes('nhân viên') || 
      lowerMsg.includes('tư vấn viên') || 
      lowerMsg.includes('hỏi sâu') || 
      lowerMsg.includes('hợp đồng đặc thù') || 
      lowerMsg.includes('gặp trực tiếp') ||
      lowerMsg.includes('báo giá chi tiết') ||
      lowerMsg.includes('nói chuyện với cskh');

    // System instruction for Lubpy AI
    const systemPrompt = `Bạn là Lubpy AI - Trợ lý thông minh và đại diện tư vấn dịch vụ của LUBPY STUDIO (Công ty giải pháp công nghệ & đồ án CNTT cao cấp).
Danh mục dịch vụ chính của LUBPY STUDIO:
1. 🎓 Làm đồ án tốt nghiệp CNTT (Web, Mobile App iOS/Android, AI / Machine Learning, IoT, Cloud, An toàn thông tin).
2. 💻 Thiết kế Website & Web App doanh nghiệp (React, NextJS, NodeJS, Python, Java, Spring Boot).
3. 📱 Lập trình ứng dụng di động Mobile App (Flutter, React Native, Swift, Kotlin).
4. ☁️ Thuê Cloud Server / VPS / Cài đặt triển khai hệ thống, Docker, CI/CD.
5. 🛠️ Fix bug demo gấp, chỉnh sửa code theo góp ý của Giảng viên hướng dẫn (GVHD).
6. 🎯 Khóa học kèm 1-1 & hướng dẫn thuyết trình bảo vệ đồ án tốt nghiệp.

Quy trình hợp tác 6 bước chuẩn mực của LUBPY STUDIO:
- Bước 1: Tiếp nhận yêu cầu & Lubpy AI/CSKH tư vấn.
- Bước 2: Chuyển giao yêu cầu sang Đội Ngũ Kỹ Thuật (Tech Lead phân công kỹ sư).
- Bước 3: Kỹ thuật & Kế toán thống nhất chi phí & tiền cọc hợp đồng.
- Bước 4: Kế toán lập hóa đơn gửi lại cho CSKH đảm nhận.
- Bước 5: CSKH báo cáo tiến độ, gửi hóa đơn khách hàng thanh toán; thanh toán xong mới bàn giao dự án; nghiệm thu xong Lubpy AI tự động tri ân.
- Bước 6: Trưởng các bộ phận (CS, Tech, Kế Toán, Super Admin) cùng ký số hợp đồng pháp lý.

Yêu cầu câu trả lời:
- Luôn giữ thái độ thân thiện, chuyên nghiệp, nhiệt tình, xưng "Lubpy AI" và gọi khách là "bạn" hoặc "${clientName}".
- Nếu khách hỏi chào hỏi: Chào mừng và tóm tắt nhanh các dịch vụ nổi bật của Lubpy Studio.
- Nếu khách hỏi về đề tài/yêu cầu làm phần mềm/đồ án: Phân tích nhanh công nghệ, tóm tắt lại nghiệp vụ và thông báo sẽ chuyển thông tin đến Chuyên viên CSKH để lên bảng kế hoạch chi tiết.
- Nếu khách hỏi sâu, thắc mắc phức tạp, hoặc muốn gặp người thật: Hãy thông báo rõ ràng rằng bạn đã chuyển tiếp yêu cầu đến Chuyên viên Chăm Sóc Khách Hàng (CSKH), và nhân viên CSKH đang trực tiếp phản hồi.
- Viết ngắn gọn, rõ ràng, gạch đầu dòng dễ nhìn.`;

    let reply = '';
    let shouldHandoverToCS = wantsHumanCS;
    let extractedCategory = 'Tư vấn đồ án & Dịch vụ phần mềm';

    if (lowerMsg.includes('bug') || lowerMsg.includes('lỗi')) {
      extractedCategory = 'Fix bug demo / Sửa code gấp';
    } else if (lowerMsg.includes('mobile') || lowerMsg.includes('app') || lowerMsg.includes('flutter')) {
      extractedCategory = 'Lập trình Mobile App';
    } else if (lowerMsg.includes('ai') || lowerMsg.includes('machine learning') || lowerMsg.includes('yolo')) {
      extractedCategory = 'Trí tuệ nhân tạo & AI';
    } else if (lowerMsg.includes('web') || lowerMsg.includes('react') || lowerMsg.includes('node')) {
      extractedCategory = 'Phát triển Web / Web App';
    } else if (lowerMsg.includes('cloud') || lowerMsg.includes('server') || lowerMsg.includes('vps')) {
      extractedCategory = 'Hạ tầng Cloud & Server';
    }

    try {
      if (process.env.GEMINI_API_KEY) {
        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemPrompt}\n\nTin nhắn của khách hàng (${clientName}): "${message}"`,
        });
        reply = aiResponse.text || '';
      }
    } catch (genaiErr) {
      console.warn('Gemini chat generateContent error:', genaiErr);
    }

    // Built-in intelligent knowledge fallback
    if (!reply) {
      if (wantsHumanCS) {
        reply = `🤖 **Lubpy AI**: Dạ vâng bạn ${clientName}! Yêu cầu chuyên sâu của bạn đã được kết nối trực tiếp đến **Bộ phận Chăm Sóc Khách Hàng (CSKH)** của LUBPY Studio.\n\n👩‍💼 Chuyên viên CSKH đang vào phòng chat để cùng bạn thống nhất chi tiết yêu cầu, phạm vi nghiệp vụ và kết nối cùng Trưởng Đội Ngũ Kỹ Thuật ngay lúc này ạ!`;
      } else if (lowerMsg.includes('chào') || lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.length < 15) {
        reply = `🤖 **Lubpy AI chào bạn ${clientName}!** Chào mừng bạn đến với **LUBPY STUDIO** — Hệ sinh thái phát triển phần mềm & đồ án CNTT cao cấp.\n\nHiện tại Lubpy Studio đang cung cấp các dịch vụ chuyên môn:\n1. 🚀 **Làm đồ án tốt nghiệp CNTT trọn gói** (Web, Mobile App, AI, Cloud, IoT, Data).\n2. 💻 **Thiết kế & Lập trình Website / Web App** theo yêu cầu doanh nghiệp.\n3. 📱 **Phát triển Mobile App iOS & Android** (Flutter, React Native).\n4. ☁️ **Cho thuê Cloud Server / VPS & Deploy hệ thống** chuẩn Docker.\n5. 🛠️ **Sửa lỗi / Fix Bug demo gấp** & chỉnh sửa theo ý Giảng viên hướng dẫn.\n6. 🎓 **Coaching 1-1** hướng dẫn bảo vệ & tự tin trả lời vấn đáp.\n\n👉 Bạn đang cần hỗ trợ về đề tài hoặc dự án nào, hãy chia sẻ cụ thể để Lubpy AI và đội ngũ CSKH phục vụ bạn tốt nhất nhé!`;
      } else {
        reply = `🤖 **Lubpy AI**: Cảm ơn bạn ${clientName} đã gửi yêu cầu! Lubpy AI đã ghi nhận yêu cầu về: **${extractedCategory}**.\n\n📌 **Tóm tắt tiếp nhận**:\n- Nội dung yêu cầu: "${message}"\n- Trạng thái: Đã lập hồ sơ yêu cầu và chuyển tiếp thông báo đến **Bộ phận Chăm Sóc Khách Hàng (CSKH)**.\n\nNếu bạn có thắc mắc chuyên sâu hoặc muốn trao đổi trực tiếp với nhân viên CSKH về bảng báo giá & tiến độ, bạn có thể nhắn tiếp tại đây — CSKH sẽ trực tiếp giải đáp ngay!`;
      }
    }

    // Store in storage
    const chatRecord = await storage.createLiveChat({
      sessionId: effectiveSessionId,
      senderId: req.user?.uid || null,
      sender: 'Lubpy AI',
      senderRole: 'lubpy_ai',
      message: reply,
    });

    const formatted = formatChatMessageResponse(chatRecord);

    // Emit via socket.io
    const io = realtime.getIO();
    if (io) {
      io.to(`chat:${effectiveSessionId}`).emit('new_chat_message', formatted);
      if (shouldHandoverToCS) {
        io.to('dept:CS').emit('cs_handover_alert', {
          clientName,
          clientEmail,
          clientPhone,
          message,
          sessionId: effectiveSessionId,
          category: extractedCategory
        });
      }
    }

    return res.json(successResponse({
      reply,
      sender: 'Lubpy AI',
      senderRole: 'lubpy_ai',
      isHandoverToCS: shouldHandoverToCS,
      category: extractedCategory,
      sessionId: effectiveSessionId,
    }, 'Phản hồi từ Lubpy AI thành công.'));

  } catch (err: any) {
    console.error('Error in /api/v1/chat/lubpy-ai:', err);
    return res.status(500).json(errorResponse('SERVER_ERROR', err.message || 'Lỗi xử lý Lubpy AI.'));
  }
});

export default router;
