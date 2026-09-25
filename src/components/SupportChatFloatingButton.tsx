import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Headphones, Sparkles, CheckCheck, 
  Clock, ShieldCheck, ChevronDown, User as UserIcon, AlertCircle,
  Phone, Flame, CornerDownLeft, Bot, UserCheck, CreditCard,
  CheckCircle2, ExternalLink, Download, Star, HeartHandshake,
  ArrowRight, Shield, Minimize2
} from 'lucide-react';
import LubpyRobotMascot from './LubpyRobotMascot';
import { User } from '../types';
import { 
  sendSupportMessageToFirestore, 
  subscribeToSupportMessages, 
  SupportChatMessage 
} from '../lib/firebase';
import { 
  getWorkflowChatMessages, 
  saveWorkflowChatMessage, 
  WorkflowSupportMessage,
  getWorkflowProjects,
  clientPayInvoice,
  clientConfirmSatisfaction,
  formatVNDCurrency,
  WorkflowProject
} from '../utils/projectWorkflowStore';
import { sendNewNotification } from '../utils/notificationStore';

interface SupportChatFloatingButtonProps {
  user: User | null;
  language?: 'en' | 'vi';
}

const PRESET_QUICK_CHIPS_VI = [
  '🎓 Tư vấn Đồ án CNTT & Báo giá',
  '💻 Thiết kế Web & Web App Doanh nghiệp',
  '📱 Lập trình Mobile App (Flutter/RN)',
  '☁️ Thuê Cloud Server / VPS / Deploy',
  '🛠️ Báo lỗi / Sửa Bug demo gấp',
  '👩‍💼 Gặp Trực Tiếp Chuyên Viên CSKH'
];

const PRESET_QUICK_CHIPS_EN = [
  '🎓 IT Capstone Project & Quote',
  '💻 Web & Enterprise App Development',
  '📱 Mobile App Dev (Flutter/RN)',
  '☁️ Cloud Server / VPS / Deploy',
  '🛠️ Urgent Bug Demo Fix',
  '👩‍💼 Speak With CS Specialist'
];

export default function SupportChatFloatingButton({
  user,
  language = 'vi'
}: SupportChatFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tư vấn đồ án CNTT');
  const [messages, setMessages] = useState<WorkflowSupportMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [hasNewUnread, setHasNewUnread] = useState(false);
  const [isCSHandoffActive, setIsCSHandoffActive] = useState(false);
  
  // Client's active project if any
  const [activeProject, setActiveProject] = useState<WorkflowProject | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const clientEmail = user?.email || guestContact;

  // Load chat messages & sync active projects
  const syncChatAndProject = () => {
    const loadedMsgs = getWorkflowChatMessages(clientEmail);
    setMessages(loadedMsgs);

    const allProjects = getWorkflowProjects();
    const myProject = allProjects.find(p => 
      (user?.email && p.clientEmail.toLowerCase() === user.email.toLowerCase()) ||
      (guestContact.trim() && p.clientEmail.toLowerCase() === guestContact.trim().toLowerCase())
    );
    setActiveProject(myProject || null);
  };

  useEffect(() => {
    syncChatAndProject();

    const handleChatUpdated = () => syncChatAndProject();
    const handleProjectsUpdated = () => syncChatAndProject();

    window.addEventListener('lubpy_workflow_chat_updated', handleChatUpdated);
    window.addEventListener('lubpy_workflow_projects_updated', handleProjectsUpdated);

    return () => {
      window.removeEventListener('lubpy_workflow_chat_updated', handleChatUpdated);
      window.removeEventListener('lubpy_workflow_projects_updated', handleProjectsUpdated);
    };
  }, [user?.email, guestContact]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      setHasNewUnread(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages, isAiThinking]);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Send message from client
  const handleSendMessage = async (textToSend?: string) => {
    const finalMsg = (textToSend || messageText).trim();
    if (!finalMsg || isSending) return;

    const senderDisplayName = user?.name || guestName.trim() || (language === 'vi' ? 'Khách hàng' : 'Client');
    const senderEmailStr = user?.email || guestContact.trim() || 'guest@lubpystudio.vn';

    setMessageText('');
    setIsSending(true);

    // 1. Save user message locally and to state
    const userMsg = saveWorkflowChatMessage({
      senderName: senderDisplayName,
      senderRole: 'client',
      clientEmail: senderEmailStr,
      clientName: senderDisplayName,
      clientPhone: user?.phone || '',
      message: finalMsg,
      category: selectedCategory,
    });

    // Also fire off firestore backup
    sendSupportMessageToFirestore({
      senderName: senderDisplayName,
      senderEmail: senderEmailStr,
      senderId: user?.uid || 'guest_' + Math.random().toString(36).slice(2, 8),
      senderRole: user?.role || 'client',
      senderAvatar: user?.photoUrl || '',
      message: finalMsg,
      category: selectedCategory,
      clientInfo: `LUBPY Studio Support Chat`,
    }).catch(() => {});

    setIsSending(false);

    // 2. Determine if user directly clicked "Gặp Trực Tiếp Chuyên Viên CSKH"
    const isDirectCSRequest = 
      finalMsg.includes('Gặp Trực Tiếp') || 
      finalMsg.toLowerCase().includes('gặp người') || 
      finalMsg.toLowerCase().includes('gặp cskh') || 
      finalMsg.toLowerCase().includes('tư vấn viên');

    if (isDirectCSRequest) {
      setIsCSHandoffActive(true);
      // Notify CS Department
      sendNewNotification({
        senderName: 'LUBPY AI (Hệ Thống)',
        senderEmail: 'lubpy-ai@lubpystudio.vn',
        targetScope: 'single_position',
        targetDeptKey: 'cs',
        targetPosition: 'Chuyên Viên Tư Vấn CSKH & Support',
        title: `⚡ Khách hàng ${senderDisplayName} yêu cầu gặp trực tiếp CSKH`,
        content: `Khách hàng ${senderDisplayName} (${senderEmailStr}) đang ở phòng chat và muốn tư vấn sâu về: "${finalMsg}". Vui lòng phản hồi khách trong CustomerSupportDashboard!`,
        priority: 'urgent',
      });

      setTimeout(() => {
        saveWorkflowChatMessage({
          senderName: 'LUBPY AI (Hệ Thống)',
          senderRole: 'lubpy_ai',
          clientEmail: senderEmailStr,
          clientName: senderDisplayName,
          message: `🤖 **Lubpy AI**: Dạ vâng bạn ${senderDisplayName}! Yêu cầu của bạn đã được kết nối khẩn cấp đến **Chuyên Viên Chăm Sóc Khách Hàng (CSKH)**.\n\n👩‍💼 Chuyên viên CSKH của LUBPY Studio đang trực tiếp kiểm tra hồ sơ và sẽ phản hồi trong ít phút tại đây! Bạn có thể gửi thêm tài liệu/yêu cầu chi tiết tại phòng chat này nhé.`,
          category: selectedCategory,
          isAiResponse: true,
          isHandedOverToCS: true
        });
      }, 700);
      return;
    }

    // 3. Request reply from server-side Lubpy AI (Gemini 3.8 Flash)
    setIsAiThinking(true);
    try {
      const response = await fetch('/api/v1/chat/lubpy-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalMsg,
          clientName: senderDisplayName,
          clientEmail: senderEmailStr,
          clientPhone: user?.phone || '',
          sessionId: `session_${senderEmailStr.replace(/[^a-zA-Z0-9]/g, '_')}`,
          projectName: activeProject?.projectName || ''
        })
      });

      const resData = await response.json();
      setIsAiThinking(false);

      if (resData.success && resData.data?.reply) {
        const isHandover = !!resData.data.isHandoverToCS;
        if (isHandover) {
          setIsCSHandoffActive(true);
        }

        saveWorkflowChatMessage({
          senderName: 'LUBPY AI',
          senderRole: 'lubpy_ai',
          clientEmail: senderEmailStr,
          clientName: senderDisplayName,
          message: resData.data.reply,
          category: resData.data.category || selectedCategory,
          isAiResponse: true,
          isHandedOverToCS: isHandover
        });

        // If AI recommended CS handover, dispatch an internal notification to CS Team
        if (isHandover) {
          sendNewNotification({
            senderName: 'LUBPY AI (Bộ lọc yêu cầu)',
            senderEmail: 'lubpy-ai@lubpystudio.vn',
            targetScope: 'single_position',
            targetDeptKey: 'cs',
            targetPosition: 'Chuyên Viên Tư Vấn CSKH & Support',
            title: `📋 Yêu cầu đồ án mới từ khách hàng ${senderDisplayName}`,
            content: `Khách hàng: ${senderDisplayName} (${senderEmailStr})\nChuyên môn: ${resData.data.category || 'Đồ án CNTT'}\nNội dung: "${finalMsg}".\nLubpy AI đã tư vấn sơ bộ và chuyển tiếp cho CSKH tiếp nhận & chuyển giao Kỹ thuật.`,
            priority: 'important',
          });
        }
      }
    } catch (err) {
      console.warn('AI call error, fallback:', err);
      setIsAiThinking(false);

      // Graceful local fallback reply
      saveWorkflowChatMessage({
        senderName: 'LUBPY AI',
        senderRole: 'lubpy_ai',
        clientEmail: senderEmailStr,
        clientName: senderDisplayName,
        message: `🤖 **Lubpy AI**: Cảm ơn bạn ${senderDisplayName}! Lubpy AI đã ghi nhận yêu cầu: "${finalMsg}".\n\n📌 Toàn bộ thông tin đề tài của bạn đã được chuyển tới **Bộ phận Chăm Sóc Khách Hàng (CSKH)** để liên hệ chuyên viên Kỹ Thuật thẩm định cấu trúc source code và gửi bạn bảng phân tích chi tiết sớm nhất.`,
        category: selectedCategory,
        isAiResponse: true
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Payment Handler inside Chat
  const handleClientPayment = (isFull: boolean) => {
    if (!activeProject) return;
    const updated = clientPayInvoice(activeProject.id, isFull);
    if (updated) {
      setActiveProject(updated);
      showToast(isFull ? '✅ Đã thanh toán 100% hợp đồng!' : '✅ Đã thanh toán tiền đặt cọc!');
      
      saveWorkflowChatMessage({
        senderName: user?.name || 'Khách hàng',
        senderRole: 'client',
        clientEmail: clientEmail || 'client@lubpystudio.vn',
        clientName: user?.name || 'Khách hàng',
        message: isFull ? '💳 Tôi đã thanh toán hoàn tất 100% giá trị hợp đồng qua cổng thanh toán.' : '💳 Tôi đã chuyển khoản tiền cọc 50% cho dự án.',
        category: 'Thanh toán hợp đồng'
      });
    }
  };

  // Satisfaction Confirmation Handler -> Lubpy AI Auto Appreciation
  const handleClientConfirmSatisfaction = () => {
    if (!activeProject) return;
    const updated = clientConfirmSatisfaction(
      activeProject.id, 
      'Dự án hoàn thành rất tốt, source code sạch sẽ và hướng dẫn nhiệt tình!'
    );
    if (updated) {
      setActiveProject(updated);
      showToast('🎉 Đã xác nhận nghiệm thu thành công! Lubpy AI đang gửi lời tri ân.');
    }
  };

  const chips = language === 'vi' ? PRESET_QUICK_CHIPS_VI : PRESET_QUICK_CHIPS_EN;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="support-chat-container">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="mb-3 px-4 py-2 bg-slate-900/95 border border-sky-500/40 text-sky-200 text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md"
            id="support-toast-notice"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{toastNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-3 w-[94vw] sm:w-[400px] md:w-[420px] max-h-[84vh] h-[560px] bg-[#0c1017] border border-sky-500/20 rounded-2xl shadow-2xl shadow-sky-950/50 flex flex-col overflow-hidden backdrop-blur-xl"
            id="support-chat-window"
          >
            {/* Dual Header: Lubpy AI Mascot & Live CSKH Specialist */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-sky-950/90 to-slate-900 border-b border-sky-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-sky-400/40 flex items-center justify-center shadow-lg shadow-sky-500/20 overflow-hidden">
                    <LubpyRobotMascot size={36} animated={true} showGlow={false} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black text-white tracking-tight">
                      LUBPY Support Hub
                    </h4>
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">
                      Lubpy AI + CSKH
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>{isCSHandoffActive ? '👩‍💼 Chuyên viên CSKH đang trực tiếp hỗ trợ' : '🤖 Lubpy AI đang trực tuyến (24/7)'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Thu nhỏ cửa sổ chat"
                  id="support-chat-minimize-btn"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Đóng cửa sổ chat"
                  id="support-chat-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Service & Role Indicator Bar */}
            <div className="px-3.5 py-2 bg-slate-950/90 border-b border-white/5 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Đang phục vụ:</span>
                <span className="font-bold text-sky-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  Lubpy AI Assistant
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage('👩‍💼 Tôi muốn gặp trực tiếp Chuyên viên CSKH')}
                className="px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Gặp người thật"
              >
                <UserCheck className="w-3 h-3" />
                <span>Gặp Chuyên Viên CSKH</span>
              </button>
            </div>

            {/* Quick Chips Bar */}
            <div className="px-3 py-2 bg-slate-950/60 border-b border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar" id="support-chips-bar">
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(chip.replace(/^[^\w\s]+/, '').trim());
                    handleSendMessage(chip);
                  }}
                  className="whitespace-nowrap px-2.5 py-1 text-[11px] font-medium bg-white/5 hover:bg-sky-500/20 text-gray-300 hover:text-sky-200 border border-white/10 hover:border-sky-500/40 rounded-full transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0a0c10]" id="support-messages-list">
              
              {/* Official Lubpy AI Welcome & Service Announcement */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950 border border-sky-400/40 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/10 overflow-hidden">
                  <LubpyRobotMascot size={30} animated={false} showGlow={false} />
                </div>
                <div className="max-w-[85%] bg-slate-900 border border-white/10 rounded-2xl rounded-tl-sm p-3.5 text-xs text-gray-200 shadow-md space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                    <span className="font-black text-sky-400 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      LUBPY AI - Trợ Lý Chính Thức
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Sẵn sàng 24/7
                    </span>
                  </div>
                  <p className="leading-relaxed text-gray-300">
                    Xin chào! Tôi là <strong>Lubpy AI</strong>, trợ lý dịch vụ của <strong>LUBPY STUDIO</strong>. Chúng tôi cung cấp các gói dịch vụ chất lượng cao:
                  </p>
                  <ul className="space-y-1 text-[11px] text-gray-300 pl-1">
                    <li>🚀 <strong>Đồ án tốt nghiệp CNTT:</strong> Web, Mobile, AI/ML, Cloud, IoT.</li>
                    <li>💻 <strong>Phát triển Website &amp; Web App:</strong> Doanh nghiệp, TMĐT, CMS.</li>
                    <li>📱 <strong>Lập trình Mobile App:</strong> Flutter &amp; React Native iOS/Android.</li>
                    <li>☁️ <strong>Hạ tầng Cloud &amp; Server:</strong> Thuê VPS, Deploy Docker, CI/CD.</li>
                    <li>🛠️ <strong>Fix bug demo gấp &amp; Chỉnh sửa theo ý GVHD.</strong></li>
                  </ul>
                  <div className="pt-1 text-[11px] text-sky-300 bg-sky-950/40 p-2 rounded-lg border border-sky-500/20">
                    💡 Hãy nhắn tin yêu cầu đề tài của bạn! Tôi sẽ tóm tắt chuyên môn và chuyển tiếp tới <strong>Chăm Sóc Khách Hàng (CSKH)</strong> để lập kế hoạch &amp; báo giá cho bạn nhé.
                  </div>
                </div>
              </div>

              {/* Active Project Card in Chat (If Available) */}
              {activeProject && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      Hồ sơ dự án: {activeProject.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      activeProject.paymentStatus === 'paid_100' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {activeProject.paymentStatus === 'paid_100' ? 'Đã thanh toán 100%' : 'Chờ thanh toán'}
                    </span>
                  </div>

                  <p className="text-gray-300 text-[11px] font-medium">
                    {activeProject.projectName}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/40 p-2 rounded-lg border border-white/5">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Tổng hợp đồng:</span>
                      <strong className="text-amber-300">{formatVNDCurrency(activeProject.totalAmountVnd)}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Tiền cọc / Còn lại:</span>
                      <strong className="text-sky-300">{formatVNDCurrency(activeProject.depositAmountVnd)}</strong>
                    </div>
                  </div>

                  {/* Stage 5: Invoice Payment & Deliverables Gating */}
                  {activeProject.status === 'invoice_sent_to_client' && activeProject.paymentStatus !== 'paid_100' && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <p className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        CSKH đã gửi hóa đơn {activeProject.invoiceId || 'HD-2026'}. Vui lòng thanh toán:
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleClientPayment(true)}
                          className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Thanh toán 100% ({formatVNDCurrency(activeProject.totalAmountVnd)})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Deliverables Download (UNLOCKED ONLY WHEN PAID_100) */}
                  {activeProject.paymentStatus === 'paid_100' && activeProject.deliverables && (
                    <div className="pt-2 border-t border-emerald-500/30 space-y-1.5">
                      <div className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã thanh toán đủ! Dự án đã được mở khóa bàn giao:
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        {activeProject.deliverables.sourceCodeUrl && (
                          <a
                            href={activeProject.deliverables.sourceCodeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-md font-bold flex items-center gap-1 hover:bg-sky-500/30"
                          >
                            <Download className="w-3 h-3" />
                            Source Code (.zip / Git)
                          </a>
                        )}
                        {activeProject.deliverables.liveDemoUrl && (
                          <a
                            href={activeProject.deliverables.liveDemoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-md font-bold flex items-center gap-1 hover:bg-purple-500/30"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Live Demo Web
                          </a>
                        )}
                      </div>

                      {/* Client Satisfaction Button */}
                      {!activeProject.clientSatisfaction?.isSatisfied && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleClientConfirmSatisfaction}
                            className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 font-black text-xs rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>🌟 Tôi hoàn toàn hài lòng với dự án</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Appreciation Note Received */}
                  {activeProject.clientSatisfaction?.isSatisfied && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-200">
                      <span className="font-bold flex items-center gap-1 mb-1">
                        <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                        Đã nghiệm thu hài lòng 100%!
                      </span>
                      <span>Lubpy AI đã lưu hồ sơ bảo hành trọn đời &amp; cấp mã ưu đãi LUBPY_VIP20 cho bạn.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Messages */}
              {messages.map((m, i) => {
                const isMe = m.senderRole === 'client';
                const isAI = m.senderRole === 'lubpy_ai';
                const isCS = m.senderRole === 'cs_staff';

                return (
                  <div 
                    key={m.id || i} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-md ${
                        isMe 
                          ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-sm' 
                          : isAI
                          ? 'bg-slate-900 border border-sky-500/30 text-gray-200 rounded-tl-sm'
                          : 'bg-indigo-950/80 border border-indigo-500/40 text-gray-200 rounded-tl-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold flex items-center gap-1.5 ${
                          isMe 
                            ? 'text-sky-100' 
                            : isAI 
                            ? 'text-sky-400' 
                            : 'text-indigo-300'
                        }`}>
                          {isAI && <LubpyRobotMascot size={16} animated={false} showGlow={false} />}
                          {isCS && <Headphones className="w-3 h-3 text-indigo-400" />}
                          {isMe ? (user?.name || m.senderName || 'Bạn') : m.senderName}
                        </span>
                        <span className={`text-[9px] ${isMe ? 'text-sky-200/80' : 'text-gray-500'}`}>
                          {m.timestamp}
                        </span>
                      </div>
                      
                      <div className="leading-relaxed whitespace-pre-wrap font-sans">
                        {m.message}
                      </div>

                      {/* Handover Notice if AI transferred */}
                      {m.isHandedOverToCS && (
                        <div className="mt-2 pt-2 border-t border-indigo-500/30 text-[10px] text-indigo-300 flex items-center gap-1 font-semibold">
                          <UserCheck className="w-3 h-3" />
                          <span>Đã thông báo Chăm Sóc Khách Hàng tiếp nhận cuộc hội thoại</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-gray-500 mt-0.5 px-1 font-mono">
                      <span>{m.timestamp}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-sky-400" />}
                    </div>
                  </div>
                );
              })}

              {/* AI Thinking Indicator */}
              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-950/40 border border-sky-500/20 p-2.5 rounded-xl max-w-[70%]">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                  <span>Lubpy AI đang phân tích &amp; soạn phản hồi...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Guest details if user not logged in */}
            {!user && (
              <div className="px-3 py-1.5 bg-slate-950 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Tên của bạn"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-slate-900 border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="SĐT / Email để CSKH gọi lại"
                  value={guestContact}
                  onChange={(e) => setGuestContact(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-slate-900 border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-slate-950 border-t border-white/10">
              <div className="relative flex items-center gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isCSHandoffActive 
                      ? 'Nhập tin nhắn trao đổi với Chuyên Viên CSKH...' 
                      : 'Hỏi Lubpy AI về đồ án, dịch vụ, báo giá hoặc yêu cầu gặp CSKH...'
                  }
                  className="flex-1 max-h-24 py-2.5 px-3.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 resize-none font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!messageText.trim() || isSending}
                  className="p-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                  id="support-chat-send-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500 px-1">
                <span>Nhấn Enter để gửi tin</span>
                <span className="text-sky-400/80 font-medium">Lubpy AI 24/7 • CSKH 08:00 - 22:00</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button - Ultra Compact Lubpy AI Robot Mascot */}
      <div className="relative group">
        {/* Subtle Non-Intrusive Tooltip on Hover Only (Hidden on Mobile, Zero Click Obstruction) */}
        {!isOpen && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-50 whitespace-nowrap bg-slate-900/95 text-white border border-sky-500/30 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-left">
              <p className="text-xs font-bold text-sky-300 leading-tight">Lubpy AI &amp; CSKH</p>
              <p className="text-[10px] text-gray-400 leading-tight">Tư vấn đồ án &amp; dịch vụ 24/7</p>
            </div>
          </div>
        )}

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xl ${
            isOpen
              ? 'bg-slate-900 border-2 border-white/20 text-gray-300 hover:text-white hover:border-white/40 shadow-slate-950/50'
              : 'bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/90 border-2 border-sky-400/60 shadow-sky-500/30 hover:border-cyan-400 hover:shadow-cyan-400/50'
          }`}
          id="support-chat-trigger-btn"
          title={isOpen ? 'Thu nhỏ cửa sổ chat' : 'Mở trợ lý Lubpy AI & CSKH'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-300 transition-transform hover:scale-110" />
          ) : (
            <>
              {/* Cute Lubpy AI Robot Mascot from Image 2 */}
              <LubpyRobotMascot size={46} animated={true} />

              {/* Online Emerald Status Dot */}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-sm" />

              {/* Unread Alert Ping */}
              {hasNewUnread && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-slate-950" />
                </span>
              )}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
