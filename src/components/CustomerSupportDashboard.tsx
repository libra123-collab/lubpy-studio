import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Share2, Layers, MessageSquare, Ticket, Users, BookOpen, 
  ThumbsUp, BarChart3, Zap, FileText, Headphones, ChevronRight, Star, 
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle, MoreHorizontal, Mail,
  Plus, Download, Filter, Eye, Trash2, Send, Settings, UserCheck, Shield, Sparkles, Check, X, Phone, AlertTriangle, Code, HardDriveUpload
} from 'lucide-react';
import { User } from '../types';
import { getStoredOrganization } from '../utils/organizationStore';
import { getVisibleNotificationsForUser } from '../utils/notificationStore';
import NotificationMailboxModal from './NotificationMailboxModal';
import UserProfileModal from './UserProfileModal';
import { getHRCSStaff, CSSpecialist } from '../utils/staffSyncStore';
import { 
  CustomerReview, 
  getStoredCustomerReviews, 
  replyToCustomerReview, 
  STANDARD_REVIEW_TEMPLATES, 
  getStandardResponseByRating 
} from '../utils/reviewStore';
import CSProjectWorkflowTab from './staff/CSProjectWorkflowTab';

export interface LUBPYCSTicket {
  id: string; // e.g. '#TK-2401'
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  projectName: string;
  issueCategory: 'Lỗi Source Code / Bug Demo' | 'Chỉnh sửa theo ý GVHD' | 'Hỏi tiến độ bàn giao' | 'Tư vấn báo giá đồ án' | 'Cài đặt môi trường / Deploy';
  priority: 'Gấp (Sắp đến ngày nộp)' | 'Cao' | 'Trung bình' | 'Thấp';
  status: 'Mới tiếp nhận' | 'Đang xử lý (Chuyển Kỹ sư)' | 'Chờ Học viên test' | 'Đã hoàn tất';
  assignedAgent: string;
  assignedDev: string;
  createdAt: string;
  description: string;
  history?: {
    author: string;
    role: 'CSKH' | 'Kỹ Sư' | 'Học Viên' | 'Hệ Thống';
    content: string;
    timestamp: string;
  }[];
}

interface CustomerSupportDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onSwitchToSystemManager?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

const DEFAULT_LUBPY_TICKETS: LUBPYCSTicket[] = [];

export default function CustomerSupportDashboard({
  user,
  onLogout,
  language,
  onSwitchToSystemManager,
  onUpdateUser
}: CustomerSupportDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [orgData] = useState(() => getStoredOrganization());

  // Main Tickets State persisted in localStorage (defaults to empty array [])
  const [tickets, setTickets] = useState<LUBPYCSTicket[]>(() => {
    const saved = localStorage.getItem('lubpy_cs_tickets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clear mock items if present
        const cleaned = parsed.filter((t: any) => !['#TK-2401', '#TK-2402', '#TK-2403', '#TK-2404', '#TK-2405'].includes(t.id));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('lubpy_cs_tickets', JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Navigation & Search / Filter
  const [activeTab, setActiveTab] = useState<'tickets' | 'workflow' | 'issues' | 'csat' | 'team'>('workflow');
  const [csStaffList, setCsStaffList] = useState<CSSpecialist[]>(() => getHRCSStaff());

  // Customer Reviews & CSAT state for CS specialists
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>(() => getStoredCustomerReviews());
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [reviewStarFilter, setReviewStarFilter] = useState<'all' | '5_4' | '3' | '2_1'>('all');
  const [reviewReplyFilter, setReviewReplyFilter] = useState<'all' | 'unreplied' | 'replied'>('all');

  // CS Reply Modal State
  const [replyingReview, setReplyingReview] = useState<CustomerReview | null>(null);
  const [csReplyText, setCsReplyText] = useState('');
  const [csSelectedCaseNum, setCsSelectedCaseNum] = useState<number>(3);
  const [csAuthorName, setCsAuthorName] = useState<string>(currentUser.name || 'Chu Phiêu Dật');
  const [csAuthorRole, setCsAuthorRole] = useState<string>(currentUser.departmentTitle || 'Chuyên Viên Chăm Sóc Khách Hàng');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<LUBPYCSTicket | null>(null);

  // Form states for Create Ticket
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newIssueCategory, setNewIssueCategory] = useState<LUBPYCSTicket['issueCategory']>('Lỗi Source Code / Bug Demo');
  const [newPriority, setNewPriority] = useState<LUBPYCSTicket['priority']>('Gấp (Sắp đến ngày nộp)');
  const [newAssignedDev, setNewAssignedDev] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Form states for Ticket Reply
  const [replyText, setReplyText] = useState('');
  const [editStatus, setEditStatus] = useState<LUBPYCSTicket['status']>('Mới tiếp nhận');
  const [editPriority, setEditPriority] = useState<LUBPYCSTicket['priority']>('Cao');
  const [editAssignedDev, setEditAssignedDev] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const handleUpdateCS = () => {
      setCsStaffList(getHRCSStaff());
    };
    const handleUpdateReviews = () => {
      setCustomerReviews(getStoredCustomerReviews());
    };
    handleUpdateCS();
    handleUpdateReviews();
    window.addEventListener('storage', handleUpdateCS);
    window.addEventListener('storage', handleUpdateReviews);
    window.addEventListener('lubpy_users_updated' as any, handleUpdateCS);
    window.addEventListener('lubpy_reviews_updated' as any, handleUpdateReviews);
    return () => {
      window.removeEventListener('storage', handleUpdateCS);
      window.removeEventListener('storage', handleUpdateReviews);
      window.removeEventListener('lubpy_users_updated' as any, handleUpdateCS);
      window.removeEventListener('lubpy_reviews_updated' as any, handleUpdateReviews);
    };
  }, []);

  const handleOpenCsReplyModal = (rev: CustomerReview) => {
    setReplyingReview(rev);
    let defaultCase = 3;
    if (rev.ratingOverall < 3.0) {
      defaultCase = 1;
    } else if (rev.ratingOverall < 4.0) {
      defaultCase = 2;
    } else {
      defaultCase = 3;
    }
    setCsSelectedCaseNum(defaultCase);
    setCsReplyText(rev.adminReply ? rev.adminReply.content : getStandardResponseByRating(rev.ratingOverall));
    setCsAuthorName(currentUser.name || 'Chu Phiêu Dật');
    setCsAuthorRole(currentUser.departmentTitle || 'Chuyên Viên Chăm Sóc Khách Hàng');
  };

  const handleApplyCsTemplate = (caseNum: number) => {
    setCsSelectedCaseNum(caseNum);
    if (caseNum === 1) {
      setCsReplyText(STANDARD_REVIEW_TEMPLATES.CASE_1_UNSATISFIED.content);
    } else if (caseNum === 2) {
      setCsReplyText(STANDARD_REVIEW_TEMPLATES.CASE_2_AVERAGE.content);
    } else {
      setCsReplyText(STANDARD_REVIEW_TEMPLATES.CASE_3_SATISFIED.content);
    }
  };

  const handleSendCsReviewReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !csReplyText.trim()) return;

    const updated = replyToCustomerReview(
      replyingReview.id,
      csReplyText.trim(),
      csAuthorName.trim() || 'Chuyên Viên CSKH LUBPY',
      csAuthorRole.trim() || 'Ban Chăm Sóc Khách Hàng',
      currentUser.photoUrl,
      csSelectedCaseNum
    );
    setCustomerReviews(updated);
    triggerToast(`💬 Đã gửi phản hồi thành công đến học viên ${replyingReview.clientName}!`);
    setReplyingReview(null);
    setCsReplyText('');
  };

  // Sync back to localStorage
  const saveTickets = (updated: LUBPYCSTicket[]) => {
    setTickets(updated);
    localStorage.setItem('lubpy_cs_tickets', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LUBPY CSKH Portal',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      triggerToast("Đã sao chép liên kết Cổng CSKH LUBPY!");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (tickets.length === 0) {
      triggerToast('Danh sách ticket đang trống, không thể xuất báo cáo!');
      return;
    }
    const headers = ['Mã Ticket', 'Tên Học Viên', 'SĐT', 'Email', 'Tên Đồ Án', 'Loại Vấn Đề', 'Mức Độ Ưu Tiên', 'Trạng Thái', 'CSKH Phụ Trách', 'Kỹ Sư Phụ Trách', 'Ngày Tạo', 'Mô Tả'];
    
    const rows = tickets.map(t => [
      t.id,
      `"${t.studentName.replace(/"/g, '""')}"`,
      `"${t.studentPhone}"`,
      `"${t.studentEmail}"`,
      `"${t.projectName.replace(/"/g, '""')}"`,
      `"${t.issueCategory}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.assignedAgent}"`,
      `"${t.assignedDev || 'Chưa phân công'}"`,
      `"${t.createdAt}"`,
      `"${(t.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_CSKH_LUBPY_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('📥 Đã xuất file Báo cáo CSKH (CSV/Excel) thành công!');
  };

  // Escalate to Tech
  const handleEscalateToTech = (ticket: LUBPYCSTicket) => {
    let existingTasks: any[] = [];
    try {
      const raw = localStorage.getItem('lubpy_tech_tasks');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) existingTasks = parsed;
      }
    } catch (e) {}
    const newTask = {
      id: `task-cs-${Date.now().toString().slice(-4)}`,
      name: `[CSKH - ${ticket.id}] ${ticket.studentName} - ${ticket.projectName}: ${ticket.issueCategory}`,
      priority: ticket.priority.includes('Gấp') ? 'Urgent' : ticket.priority.includes('Cao') ? 'High' : 'Medium',
      due: ticket.priority.includes('Gấp') ? 'Trong 24h (Gấp)' : '3 Ngày',
      color: ticket.priority.includes('Gấp') ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      status: 'pending',
      assignedTo: ticket.assignedDev || 'Chưa phân công (Đang chờ bổ nhiệm)',
      description: `[Đồ án: ${ticket.projectName}] SĐT: ${ticket.studentPhone} - Mô tả: ${ticket.description}`
    };
    const updated = [newTask, ...existingTasks];
    localStorage.setItem('lubpy_tech_tasks', JSON.stringify(updated));
    
    const updatedTickets = tickets.map(t => {
      if (t.id === ticket.id) {
        return { ...t, status: 'Đang xử lý (Chuyển Kỹ sư)' as const };
      }
      return t;
    });
    saveTickets(updatedTickets);

    triggerToast(`⚡ Đã chuyển Ticket ${ticket.id} sang danh sách Task Lập Trình (Tech Dev)!`);
  };

  // Delete Ticket
  const handleDeleteTicket = (id: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa Ticket ${id} khỏi hệ thống không?`)) {
      const updated = tickets.filter(t => t.id !== id);
      saveTickets(updated);
      if (selectedTicket?.id === id) setSelectedTicket(null);
      triggerToast(`Đã xóa Ticket ${id} thành công!`);
    }
  };

  // Notifications Calculation
  const { visibleNotifs } = getVisibleNotificationsForUser(currentUser, orgData.heads);
  const userEmail = (currentUser?.email || '').toLowerCase();
  const unreadNotifCount = visibleNotifs.filter(n => !n.readBy || !n.readBy.some(e => (e || '').toLowerCase() === userEmail)).length;

  // Create Ticket Submit
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newProjectName.trim() || !newDescription.trim()) {
      triggerToast('Vui lòng điền đầy đủ Tên học viên, Tên đồ án và Nội dung mô tả!');
      return;
    }

    const newId = `#TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const createdTicket: LUBPYCSTicket = {
      id: newId,
      studentName: newStudentName.trim(),
      studentPhone: newStudentPhone.trim() || 'Chưa cập nhật',
      studentEmail: newStudentEmail.trim() || 'hocvien@lubpy.vn',
      projectName: newProjectName.trim(),
      issueCategory: newIssueCategory,
      priority: newPriority,
      status: 'Mới tiếp nhận',
      assignedAgent: currentUser.name || 'Đặng Ngọc Mai (CSKH)',
      assignedDev: newAssignedDev || 'Chưa phân công',
      createdAt: timestampStr,
      description: newDescription.trim(),
      history: [
        {
          author: currentUser.name || 'CSKH LUBPY',
          role: 'CSKH',
          content: `Khởi tạo ticket hỗ trợ: ${newDescription.trim()}`,
          timestamp: timestampStr
        }
      ]
    };

    const updatedTickets = [createdTicket, ...tickets];
    saveTickets(updatedTickets);

    setNewStudentName('');
    setNewStudentPhone('');
    setNewStudentEmail('');
    setNewProjectName('');
    setNewIssueCategory('Lỗi Source Code / Bug Demo');
    setNewPriority('Gấp (Sắp đến ngày nộp)');
    setNewAssignedDev('');
    setNewDescription('');
    setShowCreateModal(false);

    triggerToast(`🎉 Đã tạo mới Yêu cầu Hỗ trợ ${newId} thành công!`);
  };

  // Reply Submit
  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let newHistory = selectedTicket.history || [];
    if (replyText.trim()) {
      newHistory = [
        ...newHistory,
        {
          author: currentUser.name || 'CSKH LUBPY',
          role: 'CSKH',
          content: replyText.trim(),
          timestamp: timestampStr
        }
      ];
    }

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: editStatus,
          priority: editPriority,
          assignedDev: editAssignedDev,
          history: newHistory
        };
      }
      return t;
    });

    saveTickets(updatedTickets);
    setSelectedTicket({
      ...selectedTicket,
      status: editStatus,
      priority: editPriority,
      assignedDev: editAssignedDev,
      history: newHistory
    });

    setReplyText('');
    triggerToast('🎉 Cập nhật trạng thái và phản hồi ticket thành công!');
  };

  // Open ticket detail modal
  const handleOpenDetail = (ticket: LUBPYCSTicket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditAssignedDev(ticket.assignedDev || '');
    setReplyText('');
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.studentPhone.includes(searchTerm) ||
      t.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate Metrics
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(t => t.status !== 'Đã hoàn tất').length;
  const resolvedTickets = tickets.filter(t => t.status === 'Đã hoàn tất').length;

  return (
    <div className="min-h-screen bg-[#0d0e10] text-[#f3f4f6] font-sans relative overflow-x-hidden" id="cs-dashboard-page">
      
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Dynamic Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181a20] border-l-4 border-emerald-500 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Headphones className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      <div className="flex h-full min-h-screen relative z-10" id="cs-layout">
        
        {/* SIDEBAR */}
        <aside className="w-72 bg-[#121318] border-r border-[#1e2029] flex flex-col justify-between p-6 shrink-0 hidden lg:flex" id="cs-sidebar">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3" id="cs-logo">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
                  <span>LUBPY CSKH</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Hỗ Trợ Học Viên</p>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-[#181a20] border border-[#232630] p-3.5 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Chỉ tiêu SLA phản hồi:</span>
                <span className="text-emerald-400 font-mono font-bold">≤ 15 phút</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[95%]" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono text-right">98.5% Hoàn thành đúng SLA</div>
            </div>

            {/* Menu Navigation */}
            <nav className="space-y-6" id="cs-menu">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 px-2">CHỨC NĂNG CHÍNH</p>
                <div className="space-y-1.5">
                  <button 
                    onClick={() => setActiveTab('workflow')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'workflow' 
                        ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-sky-950/40 border border-sky-400/30' 
                        : 'hover:bg-[#181a20] text-gray-300 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-sky-400" />
                      <span>Quy Trình Dự Án &amp; Bàn Giao</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-300 font-bold rounded-full">6 Bước</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('tickets')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'tickets' 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-950/30' 
                        : 'hover:bg-[#181a20] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Ticket className="w-4 h-4" />
                      <span>Danh Sách Yêu Cầu (Tickets)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-white/20 text-white font-bold rounded-full">{tickets.length}</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('issues')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'issues' 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-950/30' 
                        : 'hover:bg-[#181a20] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4" />
                      <span>Phân Loại Vấn Đề</span>
                    </span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('csat')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'csat' 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-950/30' 
                        : 'hover:bg-[#181a20] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Đánh Giá CSAT</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded-full">4.9 ★</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('team')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'team' 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-950/30' 
                        : 'hover:bg-[#181a20] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Đội Ngũ CSKH & OA</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full">{csStaffList.length} Nhân Sự</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 px-2">THAO TÁC NHANH</p>
                <div className="space-y-1.5">
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tạo Yêu Cầu Mới</span>
                  </button>

                  <button 
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-[#181a20] text-gray-400 hover:text-white text-xs transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-gray-500" />
                    <span>Xuất Báo Cáo (CSV)</span>
                  </button>
                </div>
              </div>
            </nav>
          </div>

          {/* Profile Card Bottom Sidebar */}
          <div 
            onClick={() => setShowProfileModal(true)}
            className="bg-[#181a20] border border-[#232630] hover:border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all"
            title="Bấm để chỉnh sửa hồ sơ cá nhân"
          >
            <div className="flex items-center gap-3">
              <img 
                src={currentUser.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
                alt="CS Avatar" 
                className="w-9 h-9 rounded-xl object-cover bg-slate-950 border border-emerald-500/40"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs font-extrabold text-white leading-tight">{currentUser.name || 'Tư Vấn CSKH'}</p>
                <p className="text-[10px] text-emerald-400 font-semibold uppercase">{currentUser.departmentTitle || 'Chuyên Viên CSKH'}</p>
              </div>
            </div>
            <Settings className="w-4 h-4 text-slate-400 hover:text-emerald-400 transition-colors" />
          </div>
        </aside>

        {/* MAIN STAGE */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8" id="cs-main">
          
          {/* Top Header Bar */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#1d2028] pb-6 mb-8" id="cs-header">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <span>LUBPY STUDIO</span>
                <span>&rsaquo;</span>
                <span className="text-emerald-400 font-semibold">Chăm Sóc Khách Hàng</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">LUBPY CSKH - Quản Lý Yêu Cầu &amp; Hỗ Trợ Học Viên</h2>
              <p className="text-xs text-slate-400 mt-0.5">Tiếp nhận, xử lý thắc mắc đồ án &amp; điều phối Kỹ sư giải quyết cho người học</p>
            </div>

            {/* Top Right Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto justify-end" id="cs-top-actions">
              {onSwitchToSystemManager && (
                <button
                  onClick={onSwitchToSystemManager}
                  className="px-3.5 py-2 bg-[#1c2230] hover:bg-[#232c3f] text-sky-400 border border-sky-500/20 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>🔧</span>
                  <span className="hidden sm:inline">LUBPY Manager</span>
                </button>
              )}

              {/* Notification Mailbox */}
              <button 
                onClick={() => setShowNotifModal(true)}
                className="h-9 px-3 rounded-xl bg-[#181a20] border border-[#232630] hover:border-amber-500/40 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer relative group text-xs font-bold gap-2"
                title="Hộp thư thông báo chỉ đạo nội bộ từ Admin"
              >
                <Mail className="w-4 h-4 group-hover:text-amber-400 transition-colors text-amber-400" />
                <span className="hidden sm:inline">Hộp Thư</span>
                {unreadNotifCount > 0 ? (
                  <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full border border-slate-950 animate-pulse">
                    {unreadNotifCount}
                  </span>
                ) : (
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                )}
              </button>

              {/* User Profile Settings Button */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-3 py-2 bg-[#181a20] hover:bg-slate-800 text-slate-200 border border-[#232630] hover:border-emerald-500/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Cài đặt hồ sơ cá nhân (Ảnh đại diện, Họ tên, Ngày sinh, SĐT, Mật khẩu)"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Hồ Sơ</span>
              </button>

              {/* CSV Export Button */}
              <button 
                onClick={handleExportCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Xuất danh sách ticket ra file Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Xuất CSV</span>
              </button>

              {/* New Ticket Button */}
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-950/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Ticket</span>
              </button>
            </div>
          </header>

          {/* 4 TOP METRIC CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8" id="cs-metrics">
            
            {/* Card 1: Total Support Tickets */}
            <div className="bg-[#181a20] border border-[#232630] hover:border-emerald-500/30 rounded-2xl p-5 transition-all shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400">Tổng Yêu Cầu Hỗ Trợ</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{totalTickets}</div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>100% Đã lưu trữ hệ thống</span>
              </div>
            </div>

            {/* Card 2: Pending/In-Progress Tickets */}
            <div className="bg-[#181a20] border border-[#232630] hover:border-emerald-500/30 rounded-2xl p-5 transition-all shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400">Yêu Cầu Đang Xử Lý</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-amber-400">{pendingTickets}</div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300 mt-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Cần xử lý &amp; bàn giao sớm</span>
              </div>
            </div>

            {/* Card 3: Resolved Tickets */}
            <div className="bg-[#181a20] border border-[#232630] hover:border-emerald-500/30 rounded-2xl p-5 transition-all shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400">Đã Hoàn Thành Giải Quyết</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{resolvedTickets}</div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-sky-400 mt-2">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Học viên xác nhận OK</span>
              </div>
            </div>

            {/* Card 4: Avg Response Time */}
            <div className="bg-[#181a20] border border-[#232630] hover:border-emerald-500/30 rounded-2xl p-5 transition-all shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400">Thời Gian Phản Hồi TB</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">15 Phút</div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đạt chuẩn cam kết LUBPY SLA</span>
              </div>
            </div>

          </section>

          {/* MAIN TAB CONTENT */}
          {activeTab === 'workflow' && (
            <CSProjectWorkflowTab
              currentUser={currentUser}
              onTriggerToast={triggerToast}
              language={language}
            />
          )}

          {activeTab === 'tickets' && (
            <section className="bg-[#181a20] border border-[#232630] rounded-2xl p-6" id="cs-tickets-tab">
              {/* Table Controls & Search */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">Danh Sách Yêu Cầu Hỗ Trợ</h3>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-full">
                    {filteredTickets.length} / {tickets.length} Ticket
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Tìm Mã ticket, Tên học viên, SĐT..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#0d0e10] border border-[#232630] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Status */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#0d0e10] border border-[#232630] text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                  >
                    <option value="all">Tất cả Trạng thái</option>
                    <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                    <option value="Đang xử lý (Chuyển Kỹ sư)">Đang xử lý (Chuyển Kỹ sư)</option>
                    <option value="Chờ Học viên test">Chờ Học viên test</option>
                    <option value="Đã hoàn tất">Đã hoàn tất</option>
                  </select>

                  {/* Filter Priority */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-[#0d0e10] border border-[#232630] text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                  >
                    <option value="all">Tất cả Độ ưu tiên</option>
                    <option value="Gấp (Sắp đến ngày nộp)">Gấp (Sắp nộp)</option>
                    <option value="Cao">Ưu tiên Cao</option>
                    <option value="Trung bình">Ưu tiên Trung bình</option>
                    <option value="Thấp">Ưu tiên Thấp</option>
                  </select>
                </div>
              </div>

              {/* Tickets Table */}
              {filteredTickets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#232630] text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-[#121318]">
                        <th className="py-3 px-3">Mã Ticket</th>
                        <th className="py-3 px-3">Học Viên &amp; Liên Hệ</th>
                        <th className="py-3 px-3">Đồ Án &amp; Loại Vấn Đề</th>
                        <th className="py-3 px-3">Mức Độ Ưu Tiên</th>
                        <th className="py-3 px-3">Trạng Thái</th>
                        <th className="py-3 px-3">Phụ Trách</th>
                        <th className="py-3 px-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232630]">
                      {filteredTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-[#1f222d] transition-colors group">
                          <td className="py-3.5 px-3">
                            <span className="font-mono font-bold text-emerald-400">{t.id}</span>
                            <div className="text-[10px] text-slate-500">{t.createdAt}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-bold text-white">{t.studentName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{t.studentPhone}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 max-w-xs">
                            <div className="font-bold text-slate-200 truncate">{t.projectName}</div>
                            <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-semibold mt-1">
                              {t.issueCategory}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              t.priority.includes('Gấp') 
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : t.priority.includes('Cao')
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : t.priority.includes('Trung bình')
                                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}>
                              {t.priority.includes('Gấp') && <AlertTriangle className="w-3 h-3 text-red-400" />}
                              <span>{t.priority}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              t.status === 'Đã hoàn tất'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : t.status === 'Đang xử lý (Chuyển Kỹ sư)'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : t.status === 'Chờ Học viên test'
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                            }`}>
                              {t.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="text-slate-300 font-medium">{t.assignedAgent}</div>
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{t.assignedDev || 'Chưa gán Dev'}</div>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenDetail(t)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Xem chi tiết & Cập nhật"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="hidden xl:inline">Chi tiết</span>
                              </button>

                              <button
                                onClick={() => handleEscalateToTech(t)}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Chuyển Ticket thành Task Lập Trình (Tech)"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span className="hidden xl:inline">Chuyển Dev</span>
                              </button>

                              <button
                                onClick={() => handleDeleteTicket(t.id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Xóa ticket"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* EMPTY STATE */
                <div className="py-16 text-center border border-dashed border-[#232630] rounded-2xl bg-[#121318]">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 mb-4">
                    <Ticket className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">Chưa có yêu cầu hỗ trợ nào</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                    Danh sách ticket hiện đang trống hoặc không tìm thấy kết quả phù hợp với từ khóa và bộ lọc của bạn.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 inline-flex items-center gap-2 cursor-pointer hover:from-emerald-500"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tạo Yêu Cầu Hỗ Trợ Mới</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* TAB 2: TOP ISSUES REPORT */}
          {activeTab === 'issues' && (
            <section className="space-y-6" id="cs-issues-tab">
              <div className="bg-[#181a20] border border-[#232630] rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white">Báo Cáo Phân Loại Vấn Đề Thường Gặp</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Thống kê tỉ lệ các nhóm thắc mắc và sự cố học viên gửi về hệ thống LUBPY STUDIO</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-mono font-bold">
                    Tổng: {tickets.length} yêu cầu
                  </span>
                </div>

                {tickets.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#232630] rounded-xl bg-[#121318] space-y-2">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      📊
                    </div>
                    <h4 className="text-sm font-bold text-white">Chưa có dữ liệu thống kê sự cố</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Hệ thống sẽ tự động tính toán biểu đồ phân loại khi có yêu cầu hỗ trợ mới được tạo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {[
                      { name: 'Lỗi Source Code / Bug Demo (Cần Fix gấp)', key: 'Lỗi Source Code', color: 'from-red-500 to-amber-500' },
                      { name: 'Yêu cầu chỉnh sửa lại bài theo góp ý GVHD', key: 'Chỉnh sửa theo ý GVHD', color: 'from-amber-500 to-yellow-500' },
                      { name: 'Hỏi tiến độ bàn giao Source Code & Báo cáo', key: 'Hỏi tiến độ', color: 'from-sky-500 to-indigo-500' },
                      { name: 'Cài đặt môi trường / Deploy Web & App lên Server', key: 'Cài đặt môi trường', color: 'from-emerald-500 to-teal-500' },
                      { name: 'Tư vấn báo giá đồ án mới & Bổ sung tính năng', key: 'Tư vấn báo giá', color: 'from-purple-500 to-pink-500' },
                    ].map((item, idx) => {
                      const count = tickets.filter(t => t.issueCategory && t.issueCategory.includes(item.key)).length;
                      const percentNum = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
                      const percentStr = `${percentNum}%`;
                      return (
                        <div key={idx} className="space-y-1.5 p-3.5 bg-[#121318] border border-[#232630] rounded-xl">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-white flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>{item.name}</span>
                            </span>
                            <span className="font-mono text-emerald-400">{count} Lượt ({percentStr})</span>
                          </div>
                          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`}
                              style={{ width: percentStr }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB 3: CSAT SATISFACTION & STUDENT FEEDBACK */}
          {activeTab === 'csat' && (
            <section className="space-y-6" id="cs-csat-tab">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#181a20] border border-[#232630] rounded-2xl p-5">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span>Đánh Giá Khách Hàng &amp; Phản Hồi CSAT Chuẩn</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tiếp nhận ý kiến đánh giá từ học viên và gửi phản hồi chuẩn mực theo 3 bộ kịch bản CSKH (1-2 sao, 3 sao, 4-5 sao).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {customerReviews.filter(r => !r.adminReply).length > 0 ? (
                    <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>{customerReviews.filter(r => !r.adminReply).length} đánh giá cần phản hồi</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã phản hồi toàn bộ đánh giá</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Score Summary Card */}
                <div className="lg:col-span-4 bg-[#181a20] border border-[#232630] rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Chỉ Số Hài Lòng Toàn Hệ Thống</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Dựa trên {customerReviews.length} đánh giá thực tế của học viên</p>
                  </div>

                  {(() => {
                    const avg = customerReviews.length > 0
                      ? (customerReviews.reduce((sum, r) => sum + r.ratingOverall, 0) / customerReviews.length).toFixed(1)
                      : '5.0';
                    const star5_4 = customerReviews.filter(r => r.ratingOverall >= 4.0).length;
                    const star3 = customerReviews.filter(r => r.ratingOverall >= 3.0 && r.ratingOverall < 4.0).length;
                    const star2_1迷 = customerReviews.filter(r => r.ratingOverall < 3.0).length;
                    const pct5_4 = customerReviews.length > 0 ? Math.round((star5_4 / customerReviews.length) * 100) : 100;
                    const pct3 = customerReviews.length > 0 ? Math.round((star3 / customerReviews.length) * 100) : 0;
                    const pct2_1 = customerReviews.length > 0 ? Math.round((star2_1迷 / customerReviews.length) * 100) : 0;

                    return (
                      <>
                        <div className="text-center py-2">
                          <div className="text-5xl font-black text-white tracking-tight font-mono">
                            {avg} <span className="text-2xl text-slate-500 font-sans">/ 5.0</span>
                          </div>
                          <div className="flex justify-center items-center gap-1.5 my-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star 
                                key={i} 
                                className={`w-5 h-5 ${i <= Math.round(Number(avg)) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} 
                              />
                            ))}
                          </div>
                          <div className="text-xs text-emerald-400 font-bold font-mono">
                            {pct5_4}% Tỷ lệ khách hàng hài lòng &amp; đề xuất
                          </div>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>Hài lòng (4-5 ⭐)</span>
                              <span className="text-emerald-400 font-bold">{star5_4} đánh giá ({pct5_4}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct5_4}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>Trung bình / Cần hoàn thiện (3 ⭐)</span>
                              <span className="text-amber-400 font-bold">{star3} đánh giá ({pct3}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct3}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>Không hài lòng / Gấp (1-2 ⭐)</span>
                              <span className="text-red-400 font-bold">{star2_1迷} đánh giá ({pct2_1}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct2_1}%` }} />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div className="p-3 bg-[#121318] border border-[#232630] rounded-xl text-[11px] text-slate-400 space-y-1">
                    <span className="font-bold text-white block">Quy chuẩn CSKH LUBPY:</span>
                    <p>Mọi đánh giá từ học viên phải được Chuyên viên CSKH kiểm tra và phản hồi trong vòng 2 giờ làm việc theo quy chuẩn CSAT.</p>
                  </div>
                </div>

                {/* Feedback Reviews Interactive List */}
                <div className="lg:col-span-8 bg-[#181a20] border border-[#232630] rounded-2xl p-6 space-y-4">
                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Tìm theo tên học viên, trường, đề tài đồ án..."
                        value={reviewSearchTerm}
                        onChange={(e) => setReviewSearchTerm(e.target.value)}
                        className="w-full bg-[#121318] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={reviewReplyFilter}
                        onChange={(e) => setReviewReplyFilter(e.target.value as any)}
                        className="bg-[#121318] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                      >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="unreplied">⏳ Chờ CSKH trả lời</option>
                        <option value="replied">✅ Đã trả lời</option>
                      </select>

                      <select
                        value={reviewStarFilter}
                        onChange={(e) => setReviewStarFilter(e.target.value as any)}
                        className="bg-[#121318] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                      >
                        <option value="all">Tất cả sao ⭐</option>
                        <option value="5_4">4 - 5 ⭐ (Hài lòng)</option>
                        <option value="3">3 ⭐ (Tầm trung)</option>
                        <option value="2_1">1 - 2 ⭐ (Yếu)</option>
                      </select>
                    </div>
                  </div>

                  {/* Reviews Loop */}
                  {(() => {
                    const filtered = customerReviews.filter(r => {
                      if (reviewSearchTerm) {
                        const q = reviewSearchTerm.toLowerCase();
                        const matchName进 = r.clientName.toLowerCase().includes(q);
                        const matchProj = r.projectTitle.toLowerCase().includes(q);
                        const matchSchool = (r.clientSchool || '').toLowerCase().includes(q);
                        if (!matchName进 && !matchProj && !matchSchool) return false;
                      }
                      if (reviewReplyFilter === 'unreplied' && r.adminReply) return false;
                      if (reviewReplyFilter === 'replied' && !r.adminReply) return false;
                      if (reviewStarFilter === '5_4' && r.ratingOverall < 4.0) return false;
                      if (reviewStarFilter === '3' && (r.ratingOverall < 3.0 || r.ratingOverall >= 4.0)) return false;
                      if (reviewStarFilter === '2_1' && r.ratingOverall >= 3.0) return false;
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 bg-[#121318] border border-dashed border-slate-800 rounded-xl space-y-2">
                          <p className="text-xs text-slate-400">Không tìm thấy đánh giá học viên nào phù hợp với bộ lọc.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {filtered.map((rev) => {
                          const isLow = rev.ratingOverall < 3.0;
                          const isMid = rev.ratingOverall >= 3.0 && rev.ratingOverall < 4.0;

                          return (
                            <div 
                              key={rev.id} 
                              className={`p-4 bg-[#121318] border rounded-xl space-y-3 transition-all ${
                                isLow ? 'border-red-500/30' : isMid ? 'border-amber-500/30' : 'border-[#232630] hover:border-slate-700'
                              }`}
                            >
                              {/* Header */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-2.5">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={rev.clientAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(rev.clientName)}&backgroundColor=0f172a`} 
                                    alt={rev.clientName}
                                    className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900 shrink-0"
                                  />
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-white text-xs">{rev.clientName}</span>
                                      {rev.clientSchool && (
                                        <span className="text-[11px] text-sky-400 font-mono">({rev.clientSchool})</span>
                                      )}
                                      {rev.highlightTag && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                          {rev.highlightTag}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-medium line-clamp-1">
                                      Đề tài: <span className="text-emerald-400">{rev.projectTitle}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 sm:text-right">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                      <Star 
                                        key={i} 
                                        className={`w-3.5 h-3.5 ${i <= Math.round(rev.ratingOverall) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} 
                                      />
                                    ))}
                                    <span className="text-xs font-black font-mono ml-1 text-white">{rev.ratingOverall.toFixed(1)}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-mono ml-2">{rev.createdAt}</span>
                                </div>
                              </div>

                              {/* Student Comment */}
                              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-900 text-xs">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Nhận xét của học viên:</span>
                                <p className="text-slate-200 italic leading-relaxed font-normal">"{rev.comment}"</p>
                              </div>

                              {/* CS Response Box or Reply Action */}
                              {rev.adminReply ? (
                                <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{rev.adminReply.author}</span>
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-medium">
                                        {rev.adminReply.authorRole || 'Chuyên Viên CSKH'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500 font-mono">{rev.adminReply.repliedAt}</span>
                                      <button
                                        onClick={() => handleOpenCsReplyModal(rev)}
                                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[10px] font-bold cursor-pointer"
                                      >
                                        Sửa Phản Hồi
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-slate-300 leading-relaxed italic">
                                    "{rev.adminReply.content}"
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-amber-500/5 border border-dashed border-amber-500/30 rounded-xl text-xs">
                                  <span className="text-amber-300 font-medium flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4 text-amber-400" />
                                    <span>Đánh giá này chưa được chuyên viên CSKH phản hồi</span>
                                  </span>
                                  <button
                                    onClick={() => handleOpenCsReplyModal(rev)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow flex items-center gap-1.5"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>💬 Trả Lời Theo Kịch Bản Chuẩn</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>
            </section>
          )}

          {/* TAB 4: CS TEAM & CHANNEL ASSIGNMENT (SYNCED FROM HR) */}
          {activeTab === 'team' && (
            <section className="space-y-6" id="cs-team-tab">
              <div className="bg-[#181a20] border border-[#232630] rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#232630]">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <span>Đội Ngũ Chuyên Viên CSKH & Phân Công OA/Fanpage</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Dữ liệu nhân sự được đồng bộ tự động trực tiếp từ HR Dashboard & Tài khoản hệ thống</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold rounded-xl">
                    {csStaffList.length} Nhân Sự Khả Dụng
                  </span>
                </div>

                {csStaffList.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-[#232630] rounded-xl bg-[#121318]">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-xs text-slate-400">Chưa có nhân sự thuộc Nghiệp vụ Chăm Sóc Khách Hàng nào trong HR Dashboard.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {csStaffList.map((staff) => (
                      <div key={staff.id} className="bg-[#121318] border border-[#232630] hover:border-emerald-500/40 rounded-xl p-5 transition-all space-y-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={staff.avatarUrl} 
                            alt={staff.name} 
                            className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-emerald-500/30"
                          />
                          <div>
                            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono rounded">
                                {staff.id}
                              </span>
                            </h4>
                            <p className="text-xs text-emerald-400 font-medium">{staff.title}</p>
                            <span className="inline-block text-[10px] text-slate-400 font-mono mt-0.5">{staff.level}</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs pt-2 border-t border-[#232630]">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Trạng Thái:</span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded text-[10px]">
                              🟢 Sẵn sàng trực
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Kênh Phân Công:</span>
                            <span className="text-slate-200 font-semibold truncate max-w-[180px] text-right" title={staff.zaloFanpageAssigned}>
                              {staff.zaloFanpageAssigned}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Tỷ Lệ SLA Phản Hồi:</span>
                            <span className="text-emerald-400 font-bold font-mono">{staff.slaResponseRate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Điểm CSAT:</span>
                            <span className="text-amber-400 font-bold font-mono">★ {staff.csatScore} / 5.0</span>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-wrap gap-1">
                          {staff.skills.map((sk, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-medium">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

        </main>

      </div>

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121318] border border-emerald-500/30 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-[#232630] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Tạo Yêu Cầu Hỗ Trợ Mới</h3>
                  <p className="text-[11px] text-slate-400">Ghi nhận thông tin ticket khi học viên liên hệ tư vấn/sửa bài</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tên Học Viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn Hải"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Số Điện Thoại / Zalo *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 0912345678"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Email Học Viên</label>
                  <input
                    type="email"
                    placeholder="VD: client@gmail.com"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tên Đồ Án / Đề Tài *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Web E-commerce AI Recommendation"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Loại Vấn Đề</label>
                  <select
                    value={newIssueCategory}
                    onChange={(e) => setNewIssueCategory(e.target.value as any)}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="Lỗi Source Code / Bug Demo">Lỗi Source Code / Bug Demo</option>
                    <option value="Chỉnh sửa theo ý GVHD">Chỉnh sửa theo ý GVHD</option>
                    <option value="Hỏi tiến độ bàn giao">Hỏi tiến độ bàn giao Source Code &amp; Báo cáo</option>
                    <option value="Cài đặt môi trường / Deploy">Cài đặt môi trường / Deploy Server</option>
                    <option value="Tư vấn báo giá đồ án">Tư vấn báo giá đồ án &amp; Bổ sung tính năng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mức Độ Ưu Tiên</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="Gấp (Sắp đến ngày nộp)">Gấp (Sắp đến ngày nộp)</option>
                    <option value="Cao">Ưu tiên Cao</option>
                    <option value="Trung bình">Ưu tiên Trung bình</option>
                    <option value="Thấp">Ưu tiên Thấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Kỹ Sư Phụ Trách</label>
                <select
                  value={newAssignedDev}
                  onChange={(e) => setNewAssignedDev(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                >
                  <option value="">-- Chưa phân công (Để trống, chờ bổ nhiệm) --</option>
                  {newAssignedDev && newAssignedDev !== '' && (
                    <option value={newAssignedDev}>{newAssignedDev}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Chi Tiết Yêu Cầu Hỗ Trợ *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập mô tả câu hỏi, chi tiết lỗi hoặc góp ý của GVHD..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#232630]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-bold rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Tạo Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET DETAIL & REPLY MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121318] border border-emerald-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-[#232630] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-bold text-base">{selectedTicket.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {selectedTicket.issueCategory}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">{selectedTicket.projectName}</h3>
                <p className="text-xs text-slate-400">Học viên: <strong className="text-white">{selectedTicket.studentName}</strong> ({selectedTicket.studentPhone})</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status & Priority Edit controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#0a0b0d] border border-slate-800 rounded-xl text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Trạng Thái Ticket</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-[#181a20] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
                >
                  <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                  <option value="Đang xử lý (Chuyển Kỹ sư)">Đang xử lý (Chuyển Kỹ sư)</option>
                  <option value="Chờ Học viên test">Chờ Học viên test</option>
                  <option value="Đã hoàn tất">Đã hoàn tất</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Mức Độ Ưu Tiên</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full bg-[#181a20] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
                >
                  <option value="Gấp (Sắp đến ngày nộp)">Gấp (Sắp nộp)</option>
                  <option value="Cao">Ưu tiên Cao</option>
                  <option value="Trung bình">Ưu tiên Trung bình</option>
                  <option value="Thấp">Ưu tiên Thấp</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Kỹ Sư Phụ Trách</label>
                <select
                  value={editAssignedDev}
                  onChange={(e) => setEditAssignedDev(e.target.value)}
                  className="w-full bg-[#181a20] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
                >
                  <option value="">-- Chưa phân công (Để trống, chờ bổ nhiệm) --</option>
                  {editAssignedDev && editAssignedDev !== '' && (
                    <option value={editAssignedDev}>{editAssignedDev}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Initial description */}
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-300">Nội dung thắc mắc / Yêu cầu ban đầu:</div>
              <p className="text-slate-200 leading-relaxed">{selectedTicket.description}</p>
            </div>

            {/* Conversation History */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400">Lịch sử trao đổi &amp; xử lý:</div>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {(selectedTicket.history || []).map((h, i) => (
                  <div key={i} className={`p-3 rounded-xl text-xs border ${
                    h.role === 'CSKH' 
                      ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200 ml-4' 
                      : 'bg-slate-900 border-slate-800 text-slate-200 mr-4'
                  }`}>
                    <div className="flex justify-between items-center mb-1 text-[11px] font-bold">
                      <span className={h.role === 'CSKH' ? 'text-emerald-400' : 'text-cyan-400'}>{h.author}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{h.timestamp}</span>
                    </div>
                    <p className="leading-relaxed">{h.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleAddReply} className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-300 font-bold text-xs mb-1">Phản hồi cho Học viên / Ghi chú nội bộ</label>
                <textarea
                  rows={2}
                  placeholder="Nhập nội dung phản hồi cho học viên hoặc ghi chú cho Dev..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleEscalateToTech(selectedTicket)}
                  className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>⚡ Đồng bộ Task sang Tech Dev</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-bold cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5 hover:from-emerald-500"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Lưu &amp; Phản Hồi</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CS REVIEW REPLY MODAL WITH 3 STANDARD CASES */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101a26] border border-amber-500/30 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <span>Phản Hồi Đánh Giá Học Viên: {replyingReview.clientName}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đề tài: <span className="text-sky-300 font-bold">{replyingReview.projectTitle}</span> ({replyingReview.ratingOverall.toFixed(1)} ⭐)
                </p>
              </div>
              <button 
                onClick={() => setReplyingReview(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student's Feedback Recap */}
            <div className="bg-[#0c0e12] p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Nội dung học viên đã nhận xét:</span>
              <p className="text-slate-300 italic font-medium">
                "{replyingReview.comment}"
              </p>
            </div>

            {/* 3 Quick Template Selector Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Chọn Kịch Bản Trả Lời Chuẩn CSAT (3 Trường Hợp):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Case 1 */}
                <button
                  type="button"
                  onClick={() => handleApplyCsTemplate(1)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    csSelectedCaseNum === 1
                      ? 'bg-red-950/40 border-red-500 text-white shadow-lg ring-1 ring-red-500'
                      : 'bg-[#121318] border-slate-800 text-slate-400 hover:border-red-500/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-red-400">1. Không Hài Lòng / Gấp</span>
                    {csSelectedCaseNum === 1 && <Check className="w-4 h-4 text-red-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">1 ⭐ đến 2 ⭐</span>
                </button>

                {/* Case 2 */}
                <button
                  type="button"
                  onClick={() => handleApplyCsTemplate(2)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    csSelectedCaseNum === 2
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg ring-1 ring-amber-500'
                      : 'bg-[#121318] border-slate-800 text-slate-400 hover:border-amber-500/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400">2. Tầm Trung / Góp Ý</span>
                    {csSelectedCaseNum === 2 && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">3 ⭐</span>
                </button>

                {/* Case 3 */}
                <button
                  type="button"
                  onClick={() => handleApplyCsTemplate(3)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    csSelectedCaseNum === 3
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
                      : 'bg-[#121318] border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-400">3. Hài Lòng / Khen Ngợi</span>
                    {csSelectedCaseNum === 3 && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">4 ⭐ đến 5 ⭐</span>
                </button>
              </div>
            </div>

            {/* Response Form */}
            <form onSubmit={handleSendCsReviewReply} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Chuyên Viên Ký Tên Phản Hồi:</label>
                  <input 
                    type="text"
                    required
                    value={csAuthorName}
                    onChange={(e) => setCsAuthorName(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Chức Danh / Ban CSKH:</label>
                  <input 
                    type="text"
                    required
                    value={csAuthorRole}
                    onChange={(e) => setCsAuthorRole(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5 flex items-center justify-between">
                  <span>Nội Dung Câu Trả Lời Gửi Khách Hàng:</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Có thể tùy chỉnh thêm)</span>
                </label>
                <textarea 
                  rows={5}
                  required
                  value={csReplyText}
                  onChange={(e) => setCsReplyText(e.target.value)}
                  placeholder="Nhập nội dung phản hồi gửi đến học viên..."
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl p-3.5 text-white leading-relaxed focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white font-black rounded-xl cursor-pointer shadow-lg flex items-center gap-2 uppercase tracking-wider"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi Câu Trả Lời Tới Khách Hàng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION MAILBOX MODAL */}
      {showNotifModal && (
        <NotificationMailboxModal 
          isOpen={showNotifModal}
          onClose={() => setShowNotifModal(false)}
          user={currentUser}
          orgHeads={orgData.heads}
          onTriggerToast={triggerToast}
        />
      )}

      {/* USER PROFILE SETTINGS MODAL */}
      {showProfileModal && (
        <UserProfileModal 
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            if (onUpdateUser) onUpdateUser(updated);
            triggerToast("🎉 Đã cập nhật hồ sơ cá nhân CSKH thành công!");
          }}
          onTriggerToast={triggerToast}
        />
      )}

    </div>
  );
}
