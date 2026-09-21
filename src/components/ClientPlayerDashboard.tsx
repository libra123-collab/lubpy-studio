import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Share2, Layers, Wallet, CreditCard, 
  HelpCircle, Gift, ArrowUpRight, Headphones, 
  User as UserIcon, Plus, CheckCircle2, MoreHorizontal, Mail,
  Code2, Download, MessageSquare, AlertCircle, Phone, Sparkles,
  FolderKanban, Clock, Send, FileText, ChevronRight, X, Copy,
  Building2, Briefcase, Calendar, ShieldCheck, Check, LogOut,
  Camera
} from 'lucide-react';
import { User, ProjectRequest, SupportTicket } from '../types';
import { getStoredOrganization } from '../utils/organizationStore';
import { getVisibleNotificationsForUser } from '../utils/notificationStore';
import NotificationMailboxModal from './NotificationMailboxModal';
import WorkspaceNotificationBell from './WorkspaceNotificationBell';

interface ClientPlayerDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onOpenRequestModal?: () => void;
  onSwitchToSystemManager?: () => void;
  onTakePhoto?: () => void;
}

// Helper function to standardize date format to DD/MM/YYYY
function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    // If it's already DD/MM/YYYY HH:mm, extract date part
    return dateStr;
  }
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
}

// Sample Client IT Projects fallback data (Empty by default)
const DEFAULT_CLIENT_PROJECTS: ProjectRequest[] = [];

// Initial Transactions (Empty by default)
const INITIAL_TRANSACTIONS: any[] = [];

// Modal Subcomponent for Project Deliverables & Access Control
function ProjectDeliverablesModal({
  project,
  onClose,
  onPayRemaining,
  triggerToast
}: {
  project: ProjectRequest;
  onClose: () => void;
  onPayRemaining: (project: ProjectRequest) => void;
  triggerToast: (msg: string) => void;
}) {
  const isFullyPaid = project.status === 'paid_100' || project.status === 'delivered';
  const isLocked = !isFullyPaid && project.progress < 100;
  const totalPrice = project.priceVnd || 12000000;
  const remainingVnd = isFullyPaid ? 0 : Math.round(totalPrice * 0.5);

  const rawDocs = project.documents || [];

  const categories = [
    {
      id: 'code',
      title: '📦 Source Code (File .zip hoặc Link Git)',
      badgeColor: 'border-sky-500/30 text-sky-300 bg-sky-950/40',
      items: rawDocs.filter(d => d.name.match(/\.(zip|rar|7z|tar|gz)$/i) || d.name.toLowerCase().includes('code') || d.name.toLowerCase().includes('source'))
    },
    {
      id: 'report',
      title: '📄 Báo cáo Đồ án (File Word / PDF)',
      badgeColor: 'border-blue-500/30 text-blue-300 bg-blue-950/40',
      items: rawDocs.filter(d => d.name.match(/\.(docx?|pdf)$/i) || d.name.toLowerCase().includes('bao_cao') || d.name.toLowerCase().includes('srs') || d.name.toLowerCase().includes('report'))
    },
    {
      id: 'slide',
      title: '📊 Slide Thuyết trình (File .pptx)',
      badgeColor: 'border-purple-500/30 text-purple-300 bg-purple-950/40',
      items: rawDocs.filter(d => d.name.match(/\.(pptx?)$/i) || d.name.toLowerCase().includes('slide') || d.name.toLowerCase().includes('thuyet_trinh'))
    },
    {
      id: 'demo',
      title: '📽️ Video Demo & Hướng dẫn Cài đặt (README / Video)',
      badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-950/40',
      items: rawDocs.filter(d => d.name.match(/\.(mp4|mov|avi|txt|md)$/i) || d.name.toLowerCase().includes('readme') || d.name.toLowerCase().includes('huong_dan') || d.name.toLowerCase().includes('demo'))
    }
  ];

  categories.forEach(cat => {
    if (cat.items.length === 0) {
      if (cat.id === 'code') {
        cat.items = [{ name: `Source_Code_${project.id}_Full_Release.zip`, url: '#', uploadedAt: 'Mới cập nhật' }];
      } else if (cat.id === 'report') {
        cat.items = [{ name: `Bao_Cao_Do_An_${project.id}_Full_Thuyet_Minh.docx`, url: '#', uploadedAt: 'Mới cập nhật' }];
      } else if (cat.id === 'slide') {
        cat.items = [{ name: `Slide_Thuyet_Trinh_${project.id}_Bao_Ve.pptx`, url: '#', uploadedAt: 'Mới cập nhật' }];
      } else if (cat.id === 'demo') {
        cat.items = [{ name: `HDCD_README_Setup_${project.id}.pdf`, url: '#', uploadedAt: 'Mới cập nhật' }];
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#181a20] text-white border border-sky-500/40 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232630] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-tight">DANH MỤC FILE BÀN GIAO &amp; SOURCE CODE</h3>
              <p className="text-[11px] text-gray-400 font-mono">{project.id} - {project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
        </div>

        {/* ACCESS CONTROL WARNING BANNER FOR UNPAID PROJECTS */}
        {isLocked && (
          <div className="p-4 bg-amber-950/70 border border-amber-500/50 rounded-2xl space-y-3 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <span>🔒 DỰ ÁN CHƯA HOÀN TẤT THANH TOÁN 100%</span>
            </div>
            <p className="text-xs text-amber-100 font-medium leading-relaxed">
              ⚠️ Vui lòng thanh toán 100% chi phí hợp đồng để mở khóa toàn bộ Source Code và Báo cáo chính thức!
            </p>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-gray-400 block text-[10px]">• Cọc đợt 1 (50%): <strong className="text-emerald-400 font-bold">Đã thanh toán</strong></span>
                <span className="text-amber-300 block font-bold">• Còn lại đợt 2 (50%): {remainingVnd.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <button
                onClick={() => onPayRemaining(project)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:opacity-90 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <CreditCard className="w-4 h-4 text-slate-950" />
                <span>Thanh Toán Ngay ({remainingVnd.toLocaleString('vi-VN')} đ)</span>
              </button>
            </div>
          </div>
        )}

        {/* CATEGORIZED DELIVERABLES LIST */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {categories.map((cat) => (
            <div key={cat.id} className="p-3.5 bg-[#121318] border border-[#232630] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg border ${cat.badgeColor}`}>
                  {cat.title}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">({cat.items.length} file)</span>
              </div>

              <div className="space-y-2">
                {cat.items.map((doc, idx) => (
                  <div key={idx} className="p-2.5 bg-[#181a20] border border-[#232630] hover:border-sky-500/30 rounded-xl flex items-center justify-between gap-2 transition-all">
                    <div className="truncate min-w-0">
                      <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        Cập nhật: {formatDateVN(doc.uploadedAt)}
                      </p>
                    </div>
                    {(() => {
                      const isCode = cat.id === 'code';
                      const itemIsLocked = isCode && isLocked;
                      return (
                        <button
                          onClick={() => {
                            if (itemIsLocked) {
                              triggerToast("⚠️ Vui lòng thanh toán 100% chi phí hợp đồng để mở khóa toàn bộ Source Code chính thức!");
                            } else {
                              triggerToast(`🎉 Khởi tạo tải xuống file: ${doc.name}`);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
                            itemIsLocked 
                              ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40' 
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          }`}
                        >
                          {itemIsLocked ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>Source Code (Khóa)</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Tải Về</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#232630] flex items-center justify-between shrink-0">
          <p className="text-[11px] text-gray-400">
            {isLocked 
              ? '🔒 Bấm nút "Thanh toán ngay" để mở khóa tải trực tiếp lập tức.' 
              : '✅ Đã hoàn tất thanh toán 100%. Bạn có thể tải toàn bộ tài liệu.'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#121318] hover:bg-[#1a1c24] text-gray-300 font-bold text-xs rounded-xl border border-[#232630] cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientPlayerDashboard({
  user,
  onLogout,
  language,
  onOpenRequestModal,
  onSwitchToSystemManager,
  onTakePhoto
}: ClientPlayerDashboardProps) {
  const isVi = language === 'vi';
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>(() => {
    const savedTx = localStorage.getItem('lubpy_client_transactions');
    if (savedTx) {
      try {
        const parsed = JSON.parse(savedTx);
        const cleaned = parsed.filter((t: any) => !['TX-901', 'TX-902', 'TX-903', 'TX-904'].includes(t.id));
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [balanceVnd, setBalanceVnd] = useState<number>(() => {
    if (Array.isArray(transactions) && transactions.length > 0) {
      return transactions.reduce((acc: number, tx: any) => acc + (tx.amountVnd || 0), 0);
    }
    return 0;
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [orgData] = useState(() => getStoredOrganization());

  // Derived Notification & Greeting Data
  const { visibleNotifs } = getVisibleNotificationsForUser(user, orgData.heads);
  const userEmailLower = (user?.email || '').toLowerCase();
  const unreadNotifCount = visibleNotifs.filter(n => !n.readBy || !n.readBy.includes(userEmailLower)).length;

  const rawGreetingName = (user?.name || '').trim().replace(/^[\s.,!:]+/, '').replace(/[\s.,!:]+$/, '');
  const isValidGreetingName = rawGreetingName.length > 0 && rawGreetingName !== '.' && rawGreetingName !== '..';

  // Projects State
  const [projects, setProjects] = useState<ProjectRequest[]>(() => {
    const saved = localStorage.getItem('lubpy_projects');
    if (saved) {
      try {
        const parsed: ProjectRequest[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter by client email or return default list if empty
          const clientOwned = parsed.filter(p => p.email && p.email.toLowerCase() === userEmailLower && !['PRJ-2401', 'PRJ-2402'].includes(p.id));
          return clientOwned;
        }
      } catch (e) {}
    }
    return [];
  });

  // Listen for real-time project updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      const saved = localStorage.getItem('lubpy_projects');
      if (saved) {
        try {
          const parsed: ProjectRequest[] = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clientOwned = parsed.filter(p => p.email && p.email.toLowerCase() === userEmailLower);
            if (clientOwned.length > 0) {
              setProjects(clientOwned);
            }
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('lubpy_new_project' as any, handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('lubpy_new_project' as any, handleStorageUpdate);
    };
  }, [user.email]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositMethod, setDepositMethod] = useState<'vietqr' | 'momo' | 'atm'>('vietqr');
  const [depositAmountVnd, setDepositAmountVnd] = useState<number>(1000000);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedProjectForFeedback, setSelectedProjectForFeedback] = useState<ProjectRequest | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState('bug');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackPriority, setFeedbackPriority] = useState<'normal' | 'urgent' | 'critical'>('normal');

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedProjectForDownload, setSelectedProjectForDownload] = useState<ProjectRequest | null>(null);

  const [showSupportChatModal, setShowSupportChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Handle deposit confirmation
  const handleConfirmDeposit = () => {
    setBalanceVnd(prev => prev + Number(depositAmountVnd));
    const clientCode = user.id || user.email.split('@')[0].toUpperCase();
    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Chuyển khoản nạp tiền Ví LUBPY [${clientCode}] (VietQR 24/7)`,
      date: new Date().toLocaleString('vi-VN'),
      amountVnd: Number(depositAmountVnd),
      status: 'Đang xử lý',
      type: 'deposit'
    };
    const savedTx = localStorage.getItem('lubpy_client_transactions');
    let txList = INITIAL_TRANSACTIONS;
    if (savedTx) {
      try {
        const parsed = JSON.parse(savedTx);
        if (Array.isArray(parsed)) txList = parsed;
      } catch (e) {}
    }
    txList.unshift(newTx);
    localStorage.setItem('lubpy_client_transactions', JSON.stringify(txList));
    setShowDepositModal(false);
    triggerToast(`Đã ghi nhận giao dịch chuyển khoản! Hệ thống đang tự động đối soát VietQR và sẽ cộng số dư trong ít phút.`);
  };

  // Handle Pay Remaining 50% for Project Unlock
  const handlePayRemaining = (project: ProjectRequest) => {
    const totalPrice = project.priceVnd || 12000000;
    const isPaid100 = project.status === 'paid_100' || project.status === 'delivered';
    const remainingVnd = isPaid100 ? 0 : Math.round(totalPrice * 0.5);

    if (remainingVnd <= 0) {
      triggerToast("Dự án này đã hoàn tất thanh toán 100%!");
      return;
    }

    if (balanceVnd >= remainingVnd) {
      setBalanceVnd(prev => prev - remainingVnd);

      const newTx = {
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `Thanh toán 100% tất toán mở khóa Source Code đồ án ${project.id}`,
        date: new Date().toLocaleString('vi-VN'),
        amountVnd: -remainingVnd,
        status: 'Thành công',
        type: 'payment'
      };
      const savedTx = localStorage.getItem('lubpy_client_transactions');
      let txList = INITIAL_TRANSACTIONS;
      if (savedTx) {
        try {
          const parsed = JSON.parse(savedTx);
          if (Array.isArray(parsed)) txList = parsed;
        } catch (e) {}
      }
      txList.unshift(newTx);
      localStorage.setItem('lubpy_client_transactions', JSON.stringify(txList));

      const updatedProjects = projects.map(p => {
        if (p.id === project.id) {
          return {
            ...p,
            status: 'paid_100' as const,
            progress: 100
          };
        }
        return p;
      });

      setProjects(updatedProjects);
      localStorage.setItem('lubpy_projects', JSON.stringify(updatedProjects));
      
      const refreshed = updatedProjects.find(p => p.id === project.id) || null;
      setSelectedProjectForDownload(refreshed);

      triggerToast(`🎉 Thanh toán thành công ${remainingVnd.toLocaleString('vi-VN')} VNĐ! Đã mở khóa toàn bộ Source Code & Báo cáo chính thức.`);
    } else {
      const needed = remainingVnd - balanceVnd;
      setDepositAmountVnd(needed > 0 ? needed : 1000000);
      setShowDepositModal(true);
      triggerToast(`Số dư Ví LUBPY hiện tại (${balanceVnd.toLocaleString('vi-VN')} VNĐ) chưa đủ. Vui lòng nạp thêm để thanh toán mở khóa!`);
    }
  };

  // Handle Feedback Submission
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) {
      alert('Vui lòng nhập nội dung yêu cầu sửa / phản hồi!');
      return;
    }

    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      clientName: user.name,
      clientEmail: user.email,
      subject: `[${feedbackCategory.toUpperCase()}] Yêu cầu sửa code đồ án: ${selectedProjectForFeedback?.name || 'Đồ án'}`,
      status: 'open',
      messages: [
        {
          sender: 'Client',
          content: `[Mức độ ưu tiên: ${feedbackPriority.toUpperCase()}]\n${feedbackContent}`,
          timestamp: new Date().toLocaleString('vi-VN')
        }
      ]
    };

    // Save ticket to localStorage
    const savedTickets = localStorage.getItem('lubpy_tickets');
    let ticketList: SupportTicket[] = [];
    if (savedTickets) {
      try {
        const parsed = JSON.parse(savedTickets);
        if (Array.isArray(parsed)) ticketList = parsed;
      } catch (e) {}
    }
    ticketList.unshift(newTicket);
    localStorage.setItem('lubpy_tickets', JSON.stringify(ticketList));

    // Append report to project in projects state & localStorage
    if (selectedProjectForFeedback) {
      const newReport = {
        author: `Khách hàng (${user.name})`,
        content: `[${feedbackCategory.toUpperCase()}] [Ưu tiên: ${feedbackPriority.toUpperCase()}] ${feedbackContent}`,
        timestamp: new Date().toLocaleString('vi-VN')
      };

      const updatedProjects = projects.map(p => {
        if (p.id === selectedProjectForFeedback.id) {
          return {
            ...p,
            reports: [newReport, ...(p.reports || [])]
          };
        }
        return p;
      });

      setProjects(updatedProjects);
      localStorage.setItem('lubpy_projects', JSON.stringify(updatedProjects));
    }

    setShowFeedbackModal(false);
    setFeedbackContent('');
    triggerToast('Đã gửi phản hồi & báo lỗi Bug Report thành công tới Đội ngũ KTV!');
  };

  // Handle direct support message
  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      clientName: user.name,
      clientEmail: user.email,
      subject: `Yêu cầu hỗ trợ trực tiếp từ Khách hàng: ${user.name}`,
      status: 'open',
      messages: [
        {
          sender: 'Client',
          content: chatMessage,
          timestamp: new Date().toLocaleString('vi-VN')
        }
      ]
    };

    const savedTickets = localStorage.getItem('lubpy_tickets');
    let ticketList: SupportTicket[] = [];
    if (savedTickets) {
      try {
        const parsed = JSON.parse(savedTickets);
        if (Array.isArray(parsed)) ticketList = parsed;
      } catch (e) {}
    }
    ticketList.unshift(newTicket);
    localStorage.setItem('lubpy_tickets', JSON.stringify(ticketList));

    setShowSupportChatModal(false);
    setChatMessage('');
    triggerToast('Đã gửi tin nhắn hỗ trợ khẩn cấp tới KTV & Tư vấn viên!');
  };

  // Filtered projects
  const searchLower = (searchTerm || '').trim().toLowerCase();
  const filteredProjects = projects.filter(p => {
    if (!p) return false;
    if (!searchLower) return true;
    const nameMatch = (p.name || '').toLowerCase().includes(searchLower);
    const typeMatch = (p.projectType || '').toLowerCase().includes(searchLower);
    const stackMatch = Array.isArray(p.techStack) && p.techStack.some(t => t && t.toLowerCase().includes(searchLower));
    return nameMatch || typeMatch || stackMatch;
  });

  // Status Badge Mapper
  const renderStatusBadge = (status: ProjectRequest['status']) => {
    switch (status) {
      case 'coding':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />Đang Triển Khai</span>;
      case 'deposit_50':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><span>•</span>Đã Cọc (50%)</span>;
      case 'review':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1"><span>•</span>Chờ Review / Test</span>;
      case 'delivered':
      case 'paid_100':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><span>✓</span>Đã Bàn Giao</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-gray-500/20 text-gray-300 border border-gray-500/30">Mới Tiếp Nhận</span>;
    }
  };

  // Formatted user occupation and environment
  const displayOccupation = user.occupation || 'Sinh viên Công Nghệ Thông Tin';
  const displayEnvironment = (user.workEnvironment && user.workEnvironment !== 'Trường học / Doanh nghiệp' && user.workEnvironment !== 'Trường học')
    ? user.workEnvironment 
    : 'Đại học Bách Khoa TP.HCM (Khách hàng Học viên)';

  return (
    <div className="min-h-screen bg-[#0d0e12] text-[#f3f4f6] font-sans relative overflow-x-hidden" id="client-dashboard-page">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Dynamic Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181a20] border-l-4 border-sky-500 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Wallet className="w-5 h-5 text-sky-400 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      <div className="flex h-full min-h-screen relative z-10" id="client-layout">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-72 bg-[#121318] border-r border-[#1e2029] flex flex-col justify-between p-6 shrink-0 hidden lg:flex" id="client-sidebar">
          <div className="space-y-7">
            
            {/* Lubpy Studio Logo */}
            <div className="flex items-center gap-3" id="client-logo">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-950/50 border border-sky-400/30">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg tracking-tight text-white flex items-center gap-1 uppercase">
                  <span>LUBPY STUDIO</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-sky-400 font-extrabold">Cổng Khách Hàng IT</p>
              </div>
            </div>

            {/* Quick Search Bar */}
            <div className="relative" id="client-search">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </span>
              <input 
                type="text"
                placeholder="Tìm đồ án, tech stack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#181a20] border border-[#232630] rounded-xl text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
              />
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="space-y-2" id="client-menu">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 px-2">Danh mục quản lý</p>
              
              <button className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs font-bold shadow-md shadow-sky-950/40">
                <span className="flex items-center gap-2.5">
                  <FolderKanban className="w-4 h-4" />
                  <span>Bảng Tiến Độ Đồ Án</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-white/20 text-white rounded font-mono font-bold">LIVE</span>
              </button>

              {/* Hộp Thư Thông Báo KTV */}
              <button 
                onClick={() => setShowNotifModal(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#181a20] text-gray-300 hover:text-sky-300 text-xs font-medium transition-all cursor-pointer group border border-transparent hover:border-sky-500/20"
              >
                <span className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>Hộp Thư Thông Báo KTV</span>
                </span>
                {unreadNotifCount > 0 ? (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">
                    {unreadNotifCount} mới
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500 font-mono">({visibleNotifs.length})</span>
                )}
              </button>

              <button 
                onClick={() => setShowDepositModal(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-[#181a20] text-gray-300 hover:text-white text-xs transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Nạp Tiền Ví LUBPY</span>
              </button>

              <button 
                onClick={() => triggerToast("Hiển thị Lịch sử giao dịch thanh toán")}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-[#181a20] text-gray-300 hover:text-white text-xs transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span>Lịch Sử Giao Dịch</span>
              </button>

              <button 
                onClick={() => setShowSupportChatModal(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-[#181a20] text-gray-300 hover:text-white text-xs transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Chat Hỗ Trợ KTV</span>
              </button>

              {/* Explicit Log Out Menu Item */}
              <div className="pt-2 border-t border-[#232630]">
                <button
                  onClick={() => {
                    triggerToast("Đã đăng xuất tài khoản thành công!");
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-extrabold transition-all cursor-pointer group"
                >
                  <LogOut className="w-4 h-4 text-red-400 group-hover:rotate-12 transition-transform" />
                  <span>Đăng Xuất Tài Khoản</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Bottom Sidebar Wallet Box & Profile */}
          <div className="space-y-3" id="client-sidebar-bottom">
            <div className="bg-[#181a20] border border-[#232630] rounded-2xl p-4 space-y-3" id="client-balance-widget">
              <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
                <span>Số dư Ví LUBPY</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-mono">VNĐ</span>
              </div>
              <div className="text-xl font-black text-white font-mono">{balanceVnd.toLocaleString('vi-VN')} VNĐ</div>
              <button 
                onClick={() => setShowDepositModal(true)}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
              >
                + Nạp Tiền Ví
              </button>
            </div>

            {/* Profile User Footer */}
            <div className="bg-[#181a20] border border-[#232630] rounded-2xl p-3 flex items-center justify-between" id="client-profile-card">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative group shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs overflow-hidden">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      user.name ? user.name[0].toUpperCase() : 'C'
                    )}
                  </div>
                  {onTakePhoto && (
                    <button
                      type="button"
                      onClick={onTakePhoto}
                      className="absolute -bottom-1 -right-1 p-1 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-full shadow border border-slate-900 transition-all active:scale-90 cursor-pointer"
                      title={language === 'vi' ? 'Chụp ảnh đại diện bằng Camera' : 'Take photo with camera'}
                      id="client-avatar-camera-btn"
                    >
                      <Camera className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-extrabold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-sky-400 font-mono truncate">{user.email || user.phone}</p>
                </div>
              </div>

              {onTakePhoto && (
                <button
                  type="button"
                  onClick={onTakePhoto}
                  className="p-1.5 text-gray-400 hover:text-sky-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title={language === 'vi' ? 'Chụp ảnh đại diện' : 'Take avatar photo'}
                  id="client-profile-camera-action-btn"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN STAGE WORKSPACE */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8" id="client-main">
          
          {/* Header Bar with Dynamic User Greeting & Sub-tags */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#1d2028] pb-6 mb-8" id="client-header">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                <span>LUBPY STUDIO</span>
                <span>&rsaquo;</span>
                <span className="text-sky-400 font-semibold">Cổng Khách Hàng &amp; Học Viên</span>
              </div>
              
              {/* Dynamic Welcome Greeting Requirement #1 */}
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                {isValidGreetingName ? (
                  <span>Xin chào khách hàng, <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">{rawGreetingName}</span>!</span>
                ) : (
                  <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">Xin chào quý khách!</span>
                )}
              </h2>

              {/* Dynamic User Sub-Tags Requirement #2 */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                <span className="px-2.5 py-1 bg-sky-950/80 text-sky-300 border border-sky-500/30 rounded-lg font-bold flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                  <span>{displayOccupation}</span>
                </span>

                <span className="px-2.5 py-1 bg-blue-950/80 text-blue-300 border border-blue-500/30 rounded-lg font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{displayEnvironment}</span>
                </span>

                {user.email && (
                  <span className="px-2.5 py-1 bg-slate-900 text-gray-400 border border-white/10 rounded-lg font-mono text-[11px]">
                    ✉️ {user.email}
                  </span>
                )}
              </div>
            </div>

            {/* Top Right Action Controls */}
            <div className="flex items-center gap-3 self-stretch lg:self-auto justify-end flex-wrap" id="client-top-actions">
              
              {/* Primary CTA Button: Create Project Request */}
              {onOpenRequestModal && (
                <button
                  onClick={onOpenRequestModal}
                  className="px-4 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-950/50 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>TẠO ĐỒ ÁN / ĐẶT HÀNG MỚI</span>
                </button>
              )}

              {/* Switch to Admin/System Manager if permitted */}
              {onSwitchToSystemManager && user.role !== 'client' && (
                <button
                  onClick={onSwitchToSystemManager}
                  className="px-3.5 py-2 bg-[#1c2230] hover:bg-[#232c3f] text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>🔧 System Manager</span>
                </button>
              )}

              {/* Bell Icon Dropdown with Project Updates & Backend Messages */}
              <WorkspaceNotificationBell
                user={user}
                language={language}
              />

              {/* Notification Mailbox */}
              <button 
                onClick={() => setShowNotifModal(true)}
                className="p-2.5 bg-[#181a20] hover:bg-[#20232c] border border-[#232630] text-gray-300 rounded-xl transition-all relative cursor-pointer group"
                title="Hộp thư thông báo"
              >
                <Mail className="w-4 h-4 text-gray-300 group-hover:text-sky-400 transition-colors" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => triggerToast("Đã cập nhật dữ liệu tiến độ đồ án mới nhất!")}
                className="p-2.5 bg-[#181a20] hover:bg-[#20232c] border border-[#232630] text-gray-300 rounded-xl transition-all cursor-pointer"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className="w-4 h-4 text-gray-300" />
              </button>

              <button 
                onClick={() => {
                  triggerToast("Đã đăng xuất tài khoản thành công!");
                  onLogout();
                }}
                className="px-3.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                title="Đăng xuất khỏi tài khoản"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">Đăng Xuất</span>
              </button>
            </div>
          </header>

          {/* 4 SUMMARY METRIC CARDS (VNĐ Currency & IT Service Focus) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8" id="client-metrics">
            
            {/* Card 1: Số Dư Ví LUBPY */}
            <div className="bg-[#181a20] border border-[#232630] hover:border-sky-500/40 rounded-2xl p-5 transition-all relative overflow-hidden group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs font-bold text-gray-400">Số Dư Ví LUBPY</p>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                    {balanceVnd.toLocaleString('vi-VN')} <span className="text-xs font-sans text-sky-400 font-bold">VNĐ</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Sẵn sàng thanh toán
                </span>
                <button 
                  onClick={() => setShowDepositModal(true)}
                  className="text-xs font-extrabold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                >
                  + Nạp tiền
                </button>
              </div>
            </div>

            {/* Card 2: Tổng Chi Phí Đã Thanh Toán */}
            <div className="bg-[#181a20] border border-[#232630] hover:border-sky-500/40 rounded-2xl p-5 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-gray-400">Chi Phí Đã Thanh Toán</p>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                    13.500.000 <span className="text-xs font-sans text-emerald-400 font-bold">VNĐ</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[11px] text-gray-500 font-medium pt-2 border-t border-white/5">
                Cho các hợp đồng &amp; cọc đồ án
              </div>
            </div>

            {/* Card 3: Số Đồ Án Đang Thực Hiện */}
            <div className="bg-[#181a20] border border-[#232630] hover:border-sky-500/40 rounded-2xl p-5 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-gray-400">Đồ Án Đang Thực Hiện</p>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                    {projects.length} <span className="text-xs font-sans text-sky-400 font-bold">Đồ án</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold pt-2 border-t border-white/5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đang chạy đúng tiến độ
              </div>
            </div>

            {/* Card 4: Ticket Hỗ Trợ Khách Hàng */}
            <div className="bg-[#181a20] border border-[#232630] hover:border-sky-500/40 rounded-2xl p-5 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-gray-400">Yêu Cầu Hỗ Trợ / Bug</p>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                    1 <span className="text-xs font-sans text-purple-400 font-bold">Ticket</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[11px] text-gray-400 font-medium pt-2 border-t border-white/5">
                KTV đang xử lý trong 24h
              </div>
            </div>

          </section>

          {/* MAIN SECTION: TIẾN ĐỘ DỰ ÁN DÀNH CHO KHÁCH HÀNG (PROMINENT AT TOP) */}
          <section className="bg-[#181a20] border border-sky-500/30 rounded-2xl p-6 mb-8 space-y-6 shadow-2xl relative overflow-hidden" id="client-main-projects">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232630] pb-5">
              <div>
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest px-2.5 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-full inline-block mb-1">
                  💻 TRONG TÂM QUẢN LÝ CÔNG NGHỆ
                </span>
                <h3 className="text-xl font-black text-white tracking-tight uppercase">
                  TIẾN ĐỘ DỰ ÁN DÀNH CHO KHÁCH HÀNG
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Theo dõi tiến độ phát triển source code, tài liệu và nghiệm thu đồ án công nghệ trực tiếp
                </p>
              </div>

              {onOpenRequestModal && (
                <button
                  onClick={onOpenRequestModal}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Đặt Hàng / Tạo Đồ Án Mới</span>
                </button>
              )}
            </div>

            {/* Projects List Container */}
            <div className="space-y-5">
              {filteredProjects.length === 0 ? (
                <div className="p-8 text-center bg-[#121318] rounded-xl border border-[#232630] text-gray-400 space-y-3">
                  <FolderKanban className="w-10 h-10 text-gray-500 mx-auto" />
                  <p className="text-sm font-bold">Chưa tìm thấy đồ án / dự án phù hợp.</p>
                  {onOpenRequestModal && (
                    <button
                      onClick={onOpenRequestModal}
                      className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Tạo yêu cầu đồ án mới ngay
                    </button>
                  )}
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div 
                    key={project.id}
                    className="p-5 bg-[#121318] border border-[#232630] hover:border-sky-500/40 rounded-2xl space-y-4 transition-all"
                  >
                    {/* Top Row: Title, Status, Price */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#232630] pb-3">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30">
                            {project.id}
                          </span>
                          <h4 className="text-base font-black text-white">{project.name}</h4>
                          {renderStatusBadge(project.status)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                      </div>

                      <div className="text-left md:text-right shrink-0">
                        <span className="text-[10px] uppercase font-mono text-gray-500 block font-bold">Giá Trị Hợp Đồng</span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                          {project.priceVnd ? `${project.priceVnd.toLocaleString('vi-VN')} VNĐ` : 'Thỏa thuận'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Progress Bar & Tech Stack */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Tech Stack Badges */}
                      <div className="md:col-span-5 space-y-1">
                        <span className="text-[10px] font-mono text-gray-400 font-bold block uppercase">Công nghệ (Tech Stack):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {project.techStack.map((tech, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-0.5 bg-slate-800 text-sky-300 border border-sky-500/20 rounded-md text-[11px] font-mono font-bold"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="md:col-span-7 space-y-1.5">
                        <div className="flex justify-between text-xs font-mono font-bold">
                          <span className="text-gray-400">Tiến độ hoàn thiện tổng thể:</span>
                          <span className="text-sky-400 font-black">{project.progress}% / 100%</span>
                        </div>
                        <div className="w-full bg-[#181a20] rounded-full h-3 border border-[#232630] overflow-hidden p-0.5">
                          <div 
                            className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-md shadow-sky-500/30" 
                            style={{ width: `${project.progress}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* REQUIREMENT 2: 4 PROJECT MILESTONES STEPPER */}
                    <div className="bg-[#181a20] p-4 rounded-xl border border-[#232630] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-extrabold uppercase text-gray-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-sky-400" />
                          <span>4 Cột Mốc Tiến Độ Tiêu Chuẩn IT:</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950 px-2.5 py-0.5 rounded border border-sky-500/30">
                          {project.progress >= 100 
                            ? 'Mốc 4: Đã Hoàn Tất Bàn Giao' 
                            : project.progress >= 75 
                            ? 'Mốc 3: Đang Soạn Báo Cáo & Slide' 
                            : project.progress >= 50 
                            ? 'Mốc 2: Đang Lập Trình Chức Năng Cốt Lõi' 
                            : 'Mốc 1: Đang Chốt Database & UML/ERD'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {[
                          { step: 1, name: 'Mốc 1: Database & UML/ERD', detail: 'Chốt Sơ đồ Kiến trúc & CSDL', req: 25 },
                          { step: 2, name: 'Mốc 2: Lập trình Cốt lõi', detail: 'Core Backend & Frontend UI', req: 50 },
                          { step: 3, name: 'Mốc 3: Báo cáo & Slide', detail: 'File Word Báo cáo & Slide .pptx', req: 75 },
                          { step: 4, name: 'Mốc 4: Bàn giao & Demo', detail: 'README, Setup Video & Demo', req: 100 }
                        ].map((m) => {
                          const isDone = project.progress >= m.req;
                          const isActive = !isDone && (m.step === 1 || project.progress >= m.req - 25);
                          return (
                            <div 
                              key={m.step}
                              className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                                isDone 
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                                  : isActive
                                  ? 'bg-sky-950/50 border-sky-500/50 text-sky-200 ring-1 ring-sky-500/30'
                                  : 'bg-[#121318] border-[#232630] text-gray-500'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                isDone 
                                  ? 'bg-emerald-500 text-slate-950 font-black' 
                                  : isActive
                                  ? 'bg-sky-500 text-slate-950 font-black animate-pulse'
                                  : 'bg-slate-800 text-gray-500'
                              }`}>
                                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : m.step}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-bold leading-tight ${isDone ? 'text-emerald-300' : isActive ? 'text-sky-300' : 'text-gray-400'}`}>
                                  {m.name}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{m.detail}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Info Metadata Bar: Dev assigned & Delivery date */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 bg-[#181a20] p-3 rounded-xl border border-[#232630] gap-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span>👨‍💻 <strong>KTV Đảm Nhận:</strong> <span className="text-sky-300 font-bold">{project.assignedTech || 'Đang phân công'}</span></span>
                        <span>👩‍💼 <strong>Tư Vấn CS:</strong> <span className="text-blue-300 font-bold">{project.assignedCS || 'Đặng Ngọc Mai'}</span></span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-amber-300 font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Hạn Bàn Giao: {formatDateVN(project.deadline)}</span>
                      </div>
                    </div>

                    {/* Action Buttons for Client */}
                    <div className="flex items-center justify-end gap-3 pt-1 flex-wrap">
                      {/* Button 1: Download Source & Docs - Differentiated by milestone */}
                      {project.progress < 50 ? (
                        <button
                          onClick={() => {
                            setSelectedProjectForDownload(project);
                            setShowDownloadModal(true);
                          }}
                          className="px-4 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-sky-400" />
                          <span>📄 Tải Tài Liệu Thiết Kế &amp; CSDL (Mốc 1)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedProjectForDownload(project);
                            setShowDownloadModal(true);
                          }}
                          className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-emerald-400" />
                          <span>💻 Tải Source Code &amp; Báo Cáo</span>
                        </button>
                      )}

                      {/* Button 2: Submit Bug / Revision Feedback */}
                      <button
                        onClick={() => {
                          setSelectedProjectForFeedback(project);
                          setShowFeedbackModal(true);
                        }}
                        className="px-4 py-2 bg-[#181a20] hover:bg-[#20232c] text-gray-300 border border-[#232630] hover:border-sky-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-sky-400" />
                        <span>Gửi Yêu Cầu Sửa Code (Feedback)</span>
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </section>

          {/* SECONDARY SECTION: TRANSACTION HISTORY & QUICK SUPPORT CHAT */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" id="client-secondary-grid">
            
            {/* Lịch Sử Giao Dịch (Thanh Toán Đợt 1, 2, Nạp Ví VNĐ) */}
            <div className="lg:col-span-7 bg-[#181a20] border border-[#232630] rounded-2xl p-6" id="client-tx-box">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-black text-white">Lịch Sử Giao Dịch &amp; Thanh Toán</h3>
                  <p className="text-xs text-gray-400">Các đợt thanh toán cọc đồ án &amp; nạp ví Lubpy</p>
                </div>
                <button 
                  onClick={() => setShowDepositModal(true)}
                  className="text-xs font-extrabold text-sky-400 hover:underline cursor-pointer"
                >
                  + Nạp Tiền
                </button>
              </div>

              <div className="space-y-3">
                {INITIAL_TRANSACTIONS.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3.5 bg-[#121318] border border-[#232630] rounded-xl hover:bg-[#1a1c24] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full border-2 ${tx.amountVnd > 0 ? 'border-emerald-400 bg-emerald-500/20' : 'border-amber-400 bg-amber-500/20'}`} />
                      <div>
                        <p className="text-xs font-bold text-white">{tx.title}</p>
                        <p className="text-[10px] font-mono text-gray-500">{tx.date} • Mã GD: {tx.id}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold ${tx.amountVnd > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {tx.amountVnd > 0 ? `+${tx.amountVnd.toLocaleString('vi-VN')} VNĐ` : `${tx.amountVnd.toLocaleString('vi-VN')} VNĐ`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Khung Tương Tác Nhanh: Hotline & Direct KTV Support */}
            <div className="lg:col-span-5 bg-[#181a20] border border-[#232630] rounded-2xl p-6 space-y-4" id="client-support-box">
              <div className="flex justify-between items-center border-b border-[#232630] pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-sky-400" />
                  <span>Kênh Hỗ Trợ 24/7</span>
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  • Online
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Đội ngũ Kỹ thuật viên &amp; Chăm sóc khách hàng LUBPY Studio luôn sẵn sàng hỗ trợ bạn qua kênh trực tuyến.
              </p>

              {/* Direct Support Contact Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => setShowSupportChatModal(true)}
                  className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat Trực Tiếp Với KTV Hỗ Trợ</span>
                </button>

                <div className="p-3 bg-[#121318] border border-[#232630] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="font-bold text-white">Hotline CS / HR Support:</p>
                      <p className="font-mono text-emerald-400 font-extrabold">0988.123.456 (Zalo 24/7)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText("0988123456");
                      triggerToast("Đã sao chép số Hotline LUBPY Studio!");
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg cursor-pointer"
                    title="Sao chép Hotline"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </section>

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NẠP TIỀN VÍ LUBPY (VIETQR / MOMO / BANKING - VNĐ) */}
      {/* ========================================================================= */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181a20] text-white border border-sky-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#232630] pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-extrabold uppercase">Nạp Tiền Vào Số Dư Ví LUBPY</h3>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
            </div>

            {/* Phương Thức Thanh Toán */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-gray-400">1. Chọn phương thức nạp tiền (VNĐ)</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDepositMethod('vietqr')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    depositMethod === 'vietqr' ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold' : 'border-[#232630] bg-[#121318] text-gray-400'
                  }`}
                >
                  <span className="text-xs block font-bold">VietQR 24/7</span>
                  <span className="text-[9px] font-mono text-gray-500">Mọi Ngân Hàng</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositMethod('momo')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    depositMethod === 'momo' ? 'border-pink-500 bg-pink-500/10 text-pink-400 font-bold' : 'border-[#232630] bg-[#121318] text-gray-400'
                  }`}
                >
                  <span className="text-xs block font-bold">Ví MoMo</span>
                  <span className="text-[9px] font-mono text-gray-500">Quét Mã QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositMethod('atm')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    depositMethod === 'atm' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold' : 'border-[#232630] bg-[#121318] text-gray-400'
                  }`}
                >
                  <span className="text-xs block font-bold">Thẻ ATM / App</span>
                  <span className="text-[9px] font-mono text-gray-500">Chuyển Khẩu</span>
                </button>
              </div>
            </div>

            {/* Mức Tiền VNĐ */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-gray-400">2. Chọn số tiền nạp (VNĐ)</label>
              <div className="grid grid-cols-3 gap-2">
                {[500000, 1000000, 2000000, 5000000, 10000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmountVnd(amt)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                      depositAmountVnd === amt ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-[#121318] text-gray-300 border-[#232630]'
                    }`}
                  >
                    {amt.toLocaleString('vi-VN')} đ
                  </button>
                ))}
              </div>
            </div>

            {/* VietQR Code Display */}
            <div className="bg-[#121318] border border-sky-500/30 rounded-xl p-4 text-center space-y-2">
              <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=LUBPY_${user.id || user.email.split('@')[0].toUpperCase()}_${depositAmountVnd}`} 
                  alt="QR Transfer Code" 
                  className="w-full h-full" 
                />
              </div>
              <div className="text-[11px] font-mono text-gray-300 space-y-1">
                <p>📌 Ngân Hàng: <strong className="text-sky-300">MB Bank (Ngân Hàng Quân Đội)</strong></p>
                <p>📌 Số Tài Khoản: <strong className="text-sky-300 font-black">0988123456</strong></p>
                <p>📌 Tên Tài Khoản: <strong className="text-sky-300">CÔNG TY LUBPY STUDIO</strong></p>
                <p className="bg-slate-900 p-2 rounded-xl border border-sky-500/30 text-emerald-400 text-xs">
                  Cú pháp Nội dung CK: <strong className="font-mono text-white bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40">LUBPY {user.id || user.email.split('@')[0].toUpperCase()}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="flex-1 py-3 bg-[#121318] hover:bg-[#1a1c24] text-gray-400 font-bold text-xs rounded-xl border border-[#232630] cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeposit}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>TÔI ĐÃ CHUYỂN KHOẢN ({depositAmountVnd.toLocaleString('vi-VN')} VNĐ)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GỬI PHẢN HỒI / YÊU CẦU SỬA BUG (CODE REVISION FEEDBACK) */}
      {/* ========================================================================= */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181a20] text-white border border-sky-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#232630] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-extrabold uppercase">GỬI YÊU CẦU SỬA CODE / PHẢN HỒI</h3>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Đồ án áp dụng *</label>
                <input
                  type="text"
                  readOnly
                  value={selectedProjectForFeedback?.name || 'Đồ án'}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-sky-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Loại yêu cầu *</label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="bug">Sửa lỗi Bug / Error</option>
                    <option value="feature">Thêm tính năng mới</option>
                    <option value="ui">Chỉnh sửa giao diện UI/UX</option>
                    <option value="explain">Giải thích &amp; Hướng dẫn Code</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Mức độ ưu tiên *</label>
                  <select
                    value={feedbackPriority}
                    onChange={(e) => setFeedbackPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="normal">Bình thường (48h)</option>
                    <option value="urgent">Gấp (24h)</option>
                    <option value="critical">Khẩn cấp (Ngay trong ngày)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Chi tiết lỗi hoặc nội dung cần chỉnh sửa *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả cụ thể dòng code, màn hình hoặc lỗi phát sinh cần KTV điều chỉnh..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2.5 bg-[#121318] hover:bg-[#1a1c24] text-gray-400 font-bold text-xs rounded-xl border border-[#232630] cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>GỬI YÊU CẦU CHO KTV</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TẢI SOURCE CODE & TÀI LIỆU DỰ ÁN (DELIVERABLES & ACCESS CONTROL) */}
      {/* ========================================================================= */}
      {showDownloadModal && selectedProjectForDownload && (
        <ProjectDeliverablesModal
          project={selectedProjectForDownload}
          onClose={() => setShowDownloadModal(false)}
          onPayRemaining={handlePayRemaining}
          triggerToast={triggerToast}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CHAT TRỰC TIẾP VỚI KTV HỖ TRỢ */}
      {/* ========================================================================= */}
      {showSupportChatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181a20] text-white border border-sky-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#232630] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-extrabold uppercase">CHAT TRỰC TIẾP VỚI KTV</h3>
              </div>
              <button onClick={() => setShowSupportChatModal(false)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSendSupportMessage} className="space-y-3">
              <div className="p-3 bg-sky-950/50 border border-sky-500/30 rounded-xl text-xs text-sky-200">
                💬 Tin nhắn sẽ được chuyển trực tiếp tới KTV đảm nhận đồ án và bộ phận Tư vấn CS LUBPY Studio.
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Nội dung tin nhắn hỗ trợ *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập thắc mắc hoặc yêu cầu tư vấn cần hỗ trợ..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportChatModal(false)}
                  className="px-4 py-2.5 bg-[#121318] hover:bg-[#1a1c24] text-gray-400 font-bold text-xs rounded-xl border border-[#232630] cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>GỬI TIN NHẮN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION MAILBOX MODAL */}
      <NotificationMailboxModal
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        user={user}
        orgHeads={orgData.heads}
        onTriggerToast={triggerToast}
      />

    </div>
  );
}
