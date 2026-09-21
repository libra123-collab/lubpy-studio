import React, { useState, useEffect } from 'react';
import { 
  Terminal, Code2, Clock, Search, Mail, LogOut, Edit2, Shield, 
  Zap, Settings, FileText, CheckCircle2, AlertTriangle, Play, 
  FolderGit2, ExternalLink, Filter, ChevronRight, Menu, X, 
  BookOpen, History, Download, Copy, Check, Sparkles, MessageSquare,
  AlertCircle, ArrowUpRight
} from 'lucide-react';
import { User } from '../../types';
import { getStoredOrganization } from '../../utils/organizationStore';
import { getVisibleNotificationsForUser } from '../../utils/notificationStore';
import NotificationMailboxModal from '../NotificationMailboxModal';
import UserProfileModal from '../UserProfileModal';

interface TechStaffDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onSwitchToManagerView?: () => void;
  onSwitchToSystemManager?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export interface ProjectTask {
  id: string; // e.g. DA-102
  title: string;
  techStack: string;
  clientName: string;
  deadline: string;
  isUrgentDeadline: boolean;
  status: 'Mới nhận' | 'Đang code' | 'Đã gửi Demo' | 'Cần sửa theo GVHD';
  progress: number;
  assignedDate: string;
  requirements: string;
  sourceCodeUrl: string;
  driveFolderUrl: string;
  notes?: string;
  gvhdFeedback?: {
    date: string;
    content: string;
    isResolved: boolean;
  };
}

export interface RevisionLog {
  id: string;
  projectId: string;
  projectTitle: string;
  feedbackContent: string;
  resolvedAt: string;
  resolvedBy: string;
  status: 'Đã xử lý xong' | 'Đang kiểm tra';
}

export interface SampleTemplate {
  id: string;
  title: string;
  category: 'Frontend' | 'Backend' | 'Mobile' | 'AI / Machine Learning';
  techStack: string;
  description: string;
  githubUrl: string;
  downloadCount: number;
}

export default function TechStaffDashboard({
  user,
  onLogout,
  language,
  onSwitchToManagerView,
  onSwitchToSystemManager,
  onUpdateUser
}: TechStaffDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sidebar Menu Tabs (3 Main Sections)
  const [activeTab, setActiveTab] = useState<'projects' | 'history' | 'templates'>('projects');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Modals
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<ProjectTask | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateStatus, setUpdateStatus] = useState<ProjectTask['status']>('Đang code');
  const [updateNote, setUpdateNote] = useState<string>('');

  const [viewReqTask, setViewReqTask] = useState<ProjectTask | null>(null);
  const [viewCodeTask, setViewCodeTask] = useState<ProjectTask | null>(null);

  const orgData = getStoredOrganization();
  const techHead = orgData.heads.tech;
  const supervisorName = techHead?.name || 'Nguyễn Hoàng Long';
  const supervisorEmail = techHead?.email || 'nguyenlong@lubpystudio.vn';

  // Role permissions
  const canSwitchView = (currentUser.role as string) === 'admin' || currentUser.isDepartmentHead === true || (currentUser.role as string) === 'tech_lead';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. DANH SÁCH ĐỒ ÁN / DỰ ÁN CODE ĐƯỢC GIAO (Để trống khi khởi tạo)
  const [projectsList, setProjectsList] = useState<ProjectTask[]>(() => {
    try {
      const saved = localStorage.getItem('lubpy_tech_staff_projects');
      if (saved) {
        const parsed: ProjectTask[] = JSON.parse(saved);
        return parsed.filter(p => !['DA-102', 'DA-105', 'DA-108', 'DA-110', 'DA-101'].includes(p.id));
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lubpy_tech_staff_projects', JSON.stringify(projectsList));
    } catch (e) {}
  }, [projectsList]);

  // 2. LỊCH SỬ CHỈNH SỬA / BÁO SỬA BÀI (Để trống khi khởi tạo)
  const [revisionLogs, setRevisionLogs] = useState<RevisionLog[]>(() => {
    try {
      const saved = localStorage.getItem('lubpy_tech_staff_revisions');
      if (saved) {
        const parsed: RevisionLog[] = JSON.parse(saved);
        return parsed.filter(r => !['REV-201', 'REV-202', 'REV-203'].includes(r.id));
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lubpy_tech_staff_revisions', JSON.stringify(revisionLogs));
    } catch (e) {}
  }, [revisionLogs]);

  // 3. KHO TÀI LIỆU / CODE MẪU BÀN GIAO (TEMPLATES)
  const [templatesList] = useState<SampleTemplate[]>([
    {
      id: 'TPL-01',
      title: 'Boilerplate Fullstack ReactJS + Spring Boot 3 + JWT Auth',
      category: 'Frontend',
      techStack: 'ReactJS, TailwindCSS, Spring Security, JWT, MySQL',
      description: 'Khung mẫu chuẩn đã cài đặt sẵn Phân quyền Role (Admin/User), Thanh toán VNPAY, Upload ảnh Cloudinary.',
      githubUrl: 'https://github.com/lubpystudio/template-react-springboot',
      downloadCount: 142
    },
    {
      id: 'TPL-02',
      title: 'Template Flutter Clean Architecture + Provider + Firebase',
      category: 'Mobile',
      techStack: 'Flutter 3, Firebase Auth, Firestore, Push Notification FCM',
      description: 'Mẫu ứng dụng Mobile cơ sở có sẵn Đăng nhập Google/Phone, Dark Mode, Offline Cache.',
      githubUrl: 'https://github.com/lubpystudio/template-flutter-clean',
      downloadCount: 98
    },
    {
      id: 'TPL-03',
      title: 'Khung Đồ Án Python Django REST API + Swagger Docs',
      category: 'Backend',
      techStack: 'Python 3.10, Django REST Framework, PostgreSQL, Redis',
      description: 'Dự án backend cấu hình sẵn CORS, Token Auth, Swagger UI tự động tạo tài liệu API.',
      githubUrl: 'https://github.com/lubpystudio/template-django-rest',
      downloadCount: 215
    },
    {
      id: 'TPL-04',
      title: 'Mẫu Đồ Án AI Phát Hiện Khẩu Trang & Khuôn Mặt OpenCV',
      category: 'AI / Machine Learning',
      techStack: 'Python, OpenCV, TensorFlow/Keras, Flask App',
      description: 'Source code mẫu nhận diện khuôn mặt qua webcam, thích hợp cho các đồ án thị giác máy tính.',
      githubUrl: 'https://github.com/lubpystudio/template-ai-mask-detection',
      downloadCount: 180
    }
  ]);

  // THAO TÁC CẬP NHẬT TIẾN ĐỘ TASK
  const handleOpenUpdateModal = (task: ProjectTask) => {
    setSelectedTaskForUpdate(task);
    setUpdateProgress(task.progress);
    setUpdateStatus(task.status);
    setUpdateNote(task.notes || '');
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForUpdate) return;

    setProjectsList(prev => prev.map(p => {
      if (p.id === selectedTaskForUpdate.id) {
        return {
          ...p,
          progress: updateProgress,
          status: updateStatus,
          notes: updateNote
        };
      }
      return p;
    }));

    triggerToast(`✅ Đã cập nhật tiến độ đồ án [${selectedTaskForUpdate.id}] lên ${updateProgress}%!`);
    setSelectedTaskForUpdate(null);
  };

  const handleMarkCompleted = (task: ProjectTask) => {
    setProjectsList(prev => prev.map(p => {
      if (p.id === task.id) {
        return {
          ...p,
          progress: 100,
          status: 'Đã gửi Demo',
          notes: 'Đã hoàn thành 100% code, đã bàn giao cho sinh viên xem video Demo.'
        };
      }
      return p;
    }));
    triggerToast(`🎉 Đã đánh dấu hoàn thành đồ án [${task.id}]!`);
  };

  // THAO TÁC XÁC NHẬN SỬA XONG YÊU CẦU GVHD
  const handleResolveGvhdFeedback = (task: ProjectTask) => {
    if (!task.gvhdFeedback) return;

    // Cập nhật trạng thái đồ án
    setProjectsList(prev => prev.map(p => {
      if (p.id === task.id) {
        return {
          ...p,
          status: 'Đang code',
          notes: `Đã xử lý xong phản hồi GVHD: "${task.gvhdFeedback?.content}"`,
          gvhdFeedback: {
            ...task.gvhdFeedback!,
            isResolved: true
          }
        };
      }
      return p;
    }));

    // Lưu vào Lịch sử sửa bài
    const newLog: RevisionLog = {
      id: `REV-${Math.floor(100 + Math.random() * 900)}`,
      projectId: task.id,
      projectTitle: task.title,
      feedbackContent: task.gvhdFeedback.content,
      resolvedAt: new Date().toLocaleString('vi-VN'),
      resolvedBy: currentUser.name,
      status: 'Đã xử lý xong'
    };
    setRevisionLogs(prev => [newLog, ...prev]);

    triggerToast(`✨ Đã xác nhận sửa xong yêu cầu GVHD cho đồ án [${task.id}]!`);
  };

  // LỌC DANH SÁCH ĐỒ ÁN
  const filteredProjects = projectsList.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.techStack.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || 
      (urgencyFilter === 'urgent_deadline' && p.isUrgentDeadline) ||
      (urgencyFilter === 'gvhd' && p.status === 'Cần sửa theo GVHD');

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // DANH SÁCH YÊU CẦU CẦN SỬA GẤP TỪ GVHD
  const urgentGvhdRequests = projectsList.filter(p => p.gvhdFeedback && !p.gvhdFeedback.isResolved);

  // THỐNG KÊ CARDS
  const activeCodeCount = projectsList.filter(p => p.status === 'Đang code' || p.status === 'Mới nhận').length;
  const urgentFixCount = urgentGvhdRequests.length;
  const nearDeadlineCount = projectsList.filter(p => p.isUrgentDeadline && p.status !== 'Đã gửi Demo').length;
  const completedThisWeekCount = projectsList.filter(p => p.status === 'Đã gửi Demo' || p.progress === 100).length;

  const { visibleNotifs } = getVisibleNotificationsForUser(currentUser, orgData.heads);
  const unreadCount = visibleNotifs.filter(n => !n.readBy || !n.readBy.includes(currentUser.email.toLowerCase())).length;

  return (
    <div className="min-h-screen bg-[#090d14] text-gray-100 font-sans flex flex-col lg:flex-row relative overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-cyan-400 font-black text-slate-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce border border-white/20">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION (3 MAIN TABS) */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0d1522] border-r border-[#1b2638] flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Branding */}
        <div className="p-5 border-b border-[#1b2638]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black shadow-lg shadow-cyan-500/10">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black text-white tracking-tight block">Lubpy Studio</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold block">Tech Project Board</span>
              </div>
            </div>

            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Main Menu Items */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] uppercase font-mono font-bold text-gray-400 tracking-wider">
            Quản Lý Lập Trình Đồ Án
          </div>

          <button
            onClick={() => { setActiveTab('projects'); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'text-gray-400 hover:text-white hover:bg-[#141f30]'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`w-4 h-4 ${activeTab === 'projects' ? 'text-cyan-400' : 'text-gray-400'}`} />
              <span>📋 Danh Sách Đồ Án</span>
            </div>
            {urgentFixCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono rounded-full font-black animate-pulse">
                {urgentFixCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('history'); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'text-gray-400 hover:text-white hover:bg-[#141f30]'
            }`}
          >
            <div className="flex items-center gap-3">
              <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-cyan-400' : 'text-gray-400'}`} />
              <span>🔄 Lịch Sử Sửa Bài</span>
            </div>
            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono rounded-full font-bold">
              {revisionLogs.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('templates'); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'text-gray-400 hover:text-white hover:bg-[#141f30]'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className={`w-4 h-4 ${activeTab === 'templates' ? 'text-cyan-400' : 'text-gray-400'}`} />
              <span>📂 Kho Code / Mẫu</span>
            </div>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-mono rounded-full font-bold">
              {templatesList.length}
            </span>
          </button>
        </div>

        {/* Footer User Info & Logout */}
        <div className="p-4 border-t border-[#1b2638] space-y-3 bg-[#0a101a]">
          <div className="p-2.5 bg-[#121c2b] border border-[#1e2c40] rounded-xl flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate">Đang Online (Kỹ Thuật)</p>
              <p className="text-[9px] text-gray-400 font-mono">LUBPY Studio Dev System</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span className="text-[10px] font-mono">Lubpy Studio v4.2</span>
            <button
              onClick={onLogout}
              className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 lg:p-6 space-y-6 overflow-y-auto">
        {/* HEADER TOP BAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#1b2432]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 bg-[#121924] border border-[#202c3d] rounded-xl text-cyan-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Lubpy Studio</span>
                <span className="text-gray-500">/</span>
                <span className="text-xs font-mono text-gray-400">Tiến Độ Code Đồ Án</span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">
                {activeTab === 'projects' && '📋 Bảng Tiến Độ Code Đồ Án Theo Yêu Cầu'}
                {activeTab === 'history' && '🔄 Nhật Ký Lịch Sử Sửa Bài Cho Sinh Viên'}
                {activeTab === 'templates' && '📂 Kho Tài Liệu / Code Mẫu Chuẩn Studio'}
              </h1>
            </div>
          </div>

          {/* Controls: Search, Mailbox, Profile */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="relative flex-1 md:flex-initial">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Tìm mã đề tài, sinh viên..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-56 bg-[#121924] border border-[#202c3d] text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Notification Mailbox Modal Trigger */}
            <button 
              onClick={() => setShowNotifModal(true)}
              className="p-2.5 bg-[#121924] hover:bg-[#1a2536] text-gray-300 hover:text-white rounded-xl border border-[#202c3d] transition-all relative group cursor-pointer"
              title="Hộp thư chỉ đạo từ Trưởng Phòng & Admin"
            >
              <Mail className="w-4.5 h-4.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full shadow animate-pulse">
                  {unreadCount}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full" />
              )}
            </button>

            {/* User Profile Trigger */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#121924] hover:bg-[#1a2536] border border-[#202c3d] hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 text-slate-950 font-black text-xs flex items-center justify-center overflow-hidden shrink-0 shadow">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <Edit2 className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 1. SUPERVISOR BANNER */}
        <div className="p-4 bg-[#101622] border border-[#1d2738] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-black flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-mono uppercase font-bold tracking-wider">
                TRƯỜNG ĐỘI NGŨ KỸ THUẬT CHỈ ĐẠO:
              </div>
              <div className="text-sm font-bold text-white">{supervisorName}</div>
              <div className="text-xs text-cyan-400 font-mono">{supervisorEmail}</div>
            </div>
          </div>

          {canSwitchView && (
            <div className="flex items-center gap-2">
              {onSwitchToManagerView && (
                <button
                  onClick={onSwitchToManagerView}
                  className="px-3.5 py-2 bg-[#182332] hover:bg-[#202f44] text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View Tech Lead</span>
                </button>
              )}

              {onSwitchToSystemManager && (
                <button
                  onClick={onSwitchToSystemManager}
                  className="px-3.5 py-2 bg-[#101622] hover:bg-[#1a2332] text-gray-300 border border-[#202c3d] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                  <span>System Manager</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4 CARDS - KHU VỰC CHỈ SỐ NHANH (KPI TOP CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#101622] border border-[#1d2738] p-5 rounded-2xl space-y-2 shadow-xl hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span>📝 Đồ án đang code</span>
              <Code2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{activeCodeCount} Đồ Án</span>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Đang tiến hành
              </span>
            </div>
          </div>

          <div className="bg-[#101622] border border-[#1d2738] p-5 rounded-2xl space-y-2 shadow-xl hover:border-rose-500/40 transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span>⚠️ Cần sửa gấp (GVHD/Khách)</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{urgentFixCount} Đề Tài</span>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
                Ưu tiên xử lý
              </span>
            </div>
          </div>

          <div className="bg-[#101622] border border-[#1d2738] p-5 rounded-2xl space-y-2 shadow-xl hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span>⏰ Sắp đến Deadline</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{nearDeadlineCount} Đề Tài</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Trong 24h-48h
              </span>
            </div>
          </div>

          <div className="bg-[#101622] border border-[#1d2738] p-5 rounded-2xl space-y-2 shadow-xl hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span>✅ Đã hoàn thành (Tuần này)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{completedThisWeekCount} Đồ Án</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% Đạt
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================================= */}
        {/* TAB 1: DANH SÁCH ĐỒ ÁN (PROJECTS) */}
        {/* ========================================================================================= */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* 3. KHU VỰC TẬP TRUNG "YÊU CẦU CHỈNH SỬA TỪ GIẢNG VIÊN (GVHD)" */}
            {urgentGvhdRequests.length > 0 && (
              <div className="p-5 bg-gradient-to-r from-rose-950/40 via-[#16121e] to-[#101622] border border-rose-500/40 rounded-2xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>YÊU CẦU CHỈNH SỬA GẤP TỪ GIẢNG VIÊN (GVHD)</span>
                        <span className="px-2 py-0.5 bg-rose-500 text-slate-950 text-[10px] font-black rounded-full">
                          {urgentGvhdRequests.length} Đồ án
                        </span>
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Danh sách phản hồi do CSKH chuyển tiếp từ sinh viên. Vui lòng xử lý ưu tiên hàng đầu.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {urgentGvhdRequests.map(task => (
                    <div key={task.id} className="p-4 bg-[#141824] border border-rose-500/30 rounded-xl space-y-3 relative hover:border-rose-500/60 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20 text-xs">
                          {task.id}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Phản hồi lúc: {task.gvhdFeedback?.date}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white leading-snug">{task.title}</h4>
                        <p className="text-[11px] text-cyan-400 font-mono mt-0.5">Sinh viên: {task.clientName}</p>
                      </div>

                      <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-lg text-xs text-rose-200 leading-relaxed font-sans">
                        <strong className="block text-[11px] text-rose-400 mb-1 font-mono uppercase">Nội dung GVHD yêu cầu:</strong>
                        {task.gvhdFeedback?.content}
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <button
                          onClick={() => setViewReqTask(task)}
                          className="text-xs text-gray-400 hover:text-white underline font-mono flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Xem toàn bộ đề bài</span>
                        </button>

                        <button
                          onClick={() => handleResolveGvhdFeedback(task)}
                          className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>[Xác nhận đã sửa xong]</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BAR BỘ LỌC TÌM KIẾM */}
            <div className="p-4 bg-[#101622] border border-[#1d2738] rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Filter className="w-4 h-4 text-cyan-400" />
                  <span>Bộ lọc:</span>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#141d2b] border border-[#202c3d] text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none font-bold"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Mới nhận">🔵 Mới nhận</option>
                  <option value="Đang code">🟡 Đang code</option>
                  <option value="Cần sửa theo GVHD">🔴 Cần sửa theo GVHD</option>
                  <option value="Đã gửi Demo">🟢 Đã gửi Demo / Hoàn thành</option>
                </select>

                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="bg-[#141d2b] border border-[#202c3d] text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none font-bold"
                >
                  <option value="all">Tất cả mức độ hạn nộp</option>
                  <option value="urgent_deadline">⏰ Sắp đến Deadline (24h-48h)</option>
                  <option value="gvhd">⚠️ Yêu cầu sửa GVHD</option>
                </select>
              </div>

              <div className="text-xs text-cyan-400 font-mono font-bold">
                Hiển thị {filteredProjects.length} / {projectsList.length} đồ án
              </div>
            </div>

            {/* 2. BẢNG CÔNG VIỆC / ĐỒ ÁN ĐƯỢC GIAO (BỐ CỤC BẢNG TỐI GIẢN CHUẨN) */}
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className={`p-5 bg-[#101622] border rounded-2xl space-y-4 transition-all shadow-xl hover:border-cyan-500/40 ${
                    project.status === 'Cần sửa theo GVHD' 
                      ? 'border-rose-500/30' 
                      : project.isUrgentDeadline 
                        ? 'border-amber-500/30' 
                        : 'border-[#1d2738]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 text-xs">
                        {project.id}
                      </span>
                      <h3 className="text-sm font-bold text-white tracking-tight">{project.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        project.status === 'Cần sửa theo GVHD' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' :
                        project.status === 'Đang code' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        project.status === 'Đã gửi Demo' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        [{project.status}]
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <Clock className={`w-3.5 h-3.5 ${project.isUrgentDeadline ? 'text-rose-400 animate-bounce' : 'text-gray-400'}`} />
                      <span className="text-gray-400">Deadline:</span>
                      <span className={`font-bold ${project.isUrgentDeadline ? 'text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20' : 'text-gray-200'}`}>
                        {project.deadline}
                      </span>
                    </div>
                  </div>

                  {/* Sub Details: Techstack & Client */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-400 font-mono bg-[#0c121c] p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-gray-500">Khách hàng / SV: </span>
                      <span className="text-gray-200 font-bold">{project.clientName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Công nghệ: </span>
                      <span className="text-cyan-300 font-bold">{project.techStack}</span>
                    </div>
                  </div>

                  {/* Quick Utilities & Progress Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
                    {/* Quick Utility Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setViewReqTask(project)}
                        className="px-3 py-1.5 bg-[#162132] hover:bg-[#1e2e46] text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>[Xem Yêu Cầu]</span>
                      </button>

                      <button
                        onClick={() => setViewCodeTask(project)}
                        className="px-3 py-1.5 bg-[#162132] hover:bg-[#1e2e46] text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>[Link Source Code]</span>
                      </button>
                    </div>

                    {/* Progress & Action Controls */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="text-gray-400 font-mono font-bold">Tiến độ: {project.progress}%</span>
                        <div className="w-28 sm:w-36 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              project.progress === 100 ? 'bg-emerald-400' : 'bg-cyan-400'
                            }`} 
                            style={{ width: `${project.progress}%` }} 
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenUpdateModal(project)}
                          className="px-3.5 py-1.5 bg-[#1a2638] hover:bg-[#23334a] text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all"
                        >
                          Cập nhật tiến độ
                        </button>
                        
                        {project.progress < 100 && (
                          <button
                            onClick={() => handleMarkCompleted(project)}
                            className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all"
                          >
                            Báo hoàn thành
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================================= */}
        {/* TAB 2: LỊCH SỬ SỬA BÀI (REVISION HISTORY) */}
        {/* ========================================================================================= */}
        {activeTab === 'history' && (
          <div className="bg-[#101622] border border-[#1d2738] p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1d2738]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Lịch Sử Xử Lý Yêu Cầu Chỉnh Sửa GVHD</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">Tổng cộng: {revisionLogs.length} lượt sửa</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#1f2b3e] text-gray-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-3">Mã Đồ Án</th>
                    <th className="py-3 px-3">Tên Đề Tài Đồ Án</th>
                    <th className="py-3 px-3">Nội Dung GVHD Yêu Cầu Sửa</th>
                    <th className="py-3 px-3">Thời Gian Sửa Xong</th>
                    <th className="py-3 px-3">Người Thực Hiện</th>
                    <th className="py-3 px-3 text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182232]">
                  {revisionLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#151d2c] transition-colors">
                      <td className="py-4 px-3 font-mono font-bold text-cyan-400">{log.projectId}</td>
                      <td className="py-4 px-3 font-bold text-white">{log.projectTitle}</td>
                      <td className="py-4 px-3 text-gray-300 max-w-xs leading-snug">{log.feedbackContent}</td>
                      <td className="py-4 px-3 text-gray-400 font-mono">{log.resolvedAt}</td>
                      <td className="py-4 px-3 text-gray-200 font-bold">{log.resolvedBy}</td>
                      <td className="py-4 px-3 text-right">
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-full">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================================= */}
        {/* TAB 3: KHO TÀI LIỆU / CODE MẪU (TEMPLATES) */}
        {/* ========================================================================================= */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="p-4 bg-[#101622] border border-[#1d2738] rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Kho Boilerplate & Code Mẫu Chuẩn Lubpy Studio</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">Sử dụng các bộ khung code mẫu dựng sẵn để tăng tốc 50% thời gian code đồ án.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templatesList.map(tpl => (
                <div key={tpl.id} className="p-5 bg-[#101622] border border-[#1d2738] rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                      {tpl.category}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {tpl.downloadCount} lượt tải
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{tpl.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{tpl.description}</p>
                  
                  <div className="text-xs font-mono text-cyan-300 bg-[#0c121c] p-2 rounded-lg border border-white/5">
                    <strong>Tech:</strong> {tpl.techStack}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#1d2738]">
                    <a
                      href={tpl.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1"
                    >
                      <span>Clone Repository</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => triggerToast(`📥 Đã tải bộ mẫu ${tpl.title} về máy!`)}
                      className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải zip Mẫu</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CẬP NHẬT TIẾN ĐỘ TASK */}
      {selectedTaskForUpdate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101726] border border-[#22324a] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#22324a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>Cập nhật tiến độ đồ án [{selectedTaskForUpdate.id}]</span>
              </h3>
              <button 
                onClick={() => setSelectedTaskForUpdate(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Tên đề tài:</label>
                <p className="p-2.5 bg-[#162132] border border-[#22324a] rounded-xl font-bold text-white">
                  {selectedTaskForUpdate.title}
                </p>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  Phần trăm hoàn thành: <span className="text-cyan-400 font-mono text-sm font-black">{updateProgress}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={updateProgress}
                  onChange={(e) => setUpdateProgress(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Trạng thái công việc:</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as any)}
                  className="w-full bg-[#162132] border border-[#22324a] text-white p-2.5 rounded-xl font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Mới nhận">🔵 Mới nhận</option>
                  <option value="Đang code">🟡 Đang code</option>
                  <option value="Cần sửa theo GVHD">🔴 Cần sửa theo GVHD</option>
                  <option value="Đã gửi Demo">🟢 Đã gửi Demo / Hoàn thành</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Ghi chú công việc / Tiến độ chi tiết:</label>
                <textarea
                  rows={3}
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Nhập tiến độ chi tiết (ví dụ: Đã xong module Đăng nhập và Giỏ hàng...)"
                  className="w-full bg-[#162132] border border-[#22324a] text-white p-2.5 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForUpdate(null)}
                  className="px-4 py-2 bg-[#162132] hover:bg-[#1e2e46] text-gray-300 rounded-xl font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  Lưu Tiến Độ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CÂU HỎI / ĐỀ BÀI YÊU CẦU */}
      {viewReqTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101726] border border-[#22324a] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#22324a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Chi Tiết Yêu Cầu Đồ Án [{viewReqTask.id}]</span>
              </h3>
              <button onClick={() => setViewReqTask(null)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <strong className="text-gray-400 block font-mono">Tên đồ án:</strong>
                <p className="text-sm font-bold text-white mt-0.5">{viewReqTask.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#162132] p-3 rounded-xl border border-white/5 font-mono">
                <div>
                  <span className="text-gray-400 block">Sinh viên:</span>
                  <span className="text-cyan-300 font-bold">{viewReqTask.clientName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Hạn nộp:</span>
                  <span className="text-amber-400 font-bold">{viewReqTask.deadline}</span>
                </div>
              </div>

              <div>
                <strong className="text-gray-400 block font-mono">Mô tả chức năng & Yêu cầu kỹ thuật:</strong>
                <div className="p-3 bg-[#162132] border border-[#22324a] rounded-xl text-gray-200 mt-1 space-y-2 whitespace-pre-line font-sans">
                  {viewReqTask.requirements}
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setViewReqTask(null)}
                className="px-4 py-2 bg-cyan-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM LINK SOURCE CODE / DRIVE */}
      {viewCodeTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101726] border border-[#22324a] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#22324a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
                <span>Link Source Code & Tài Liệu [{viewCodeTask.id}]</span>
              </h3>
              <button onClick={() => setViewCodeTask(null)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">GitHub Repository Link:</label>
                <div className="flex items-center gap-2 bg-[#162132] p-2.5 rounded-xl border border-[#22324a]">
                  <input
                    type="text"
                    readOnly
                    value={viewCodeTask.sourceCodeUrl}
                    className="bg-transparent text-cyan-300 font-mono w-full focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewCodeTask.sourceCodeUrl);
                      triggerToast('📋 Đã sao chép link GitHub Repository!');
                    }}
                    className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 cursor-pointer"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Google Drive Folder (Thư mục tài liệu):</label>
                <div className="flex items-center gap-2 bg-[#162132] p-2.5 rounded-xl border border-[#22324a]">
                  <input
                    type="text"
                    readOnly
                    value={viewCodeTask.driveFolderUrl}
                    className="bg-transparent text-indigo-300 font-mono w-full focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewCodeTask.driveFolderUrl);
                      triggerToast('📋 Đã sao chép link Google Drive!');
                    }}
                    className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 cursor-pointer"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setViewCodeTask(null)}
                className="px-4 py-2 bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION MAILBOX MODAL */}
      <NotificationMailboxModal 
        isOpen={showNotifModal}
        user={currentUser}
        orgHeads={orgData.heads as any}
        onClose={() => setShowNotifModal(false)}
        onTriggerToast={triggerToast}
      />

      {/* USER PROFILE MODAL */}
      <UserProfileModal
        isOpen={showProfileModal}
        user={currentUser}
        onClose={() => setShowProfileModal(false)}
        onUpdateUser={(updatedUser) => {
          setCurrentUser(updatedUser);
          if (onUpdateUser) onUpdateUser(updatedUser);
          triggerToast('✨ Đã cập nhật thông tin hồ sơ tài khoản thành công!');
        }}
        onTriggerToast={triggerToast}
      />
    </div>
  );
}
