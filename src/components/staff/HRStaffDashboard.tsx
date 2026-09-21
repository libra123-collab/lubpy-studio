import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Calendar, Clock, Award, Briefcase, Search, Mail, 
  LogOut, Edit2, Shield, User as UserIcon, RefreshCw, Zap, Settings,
  CheckCircle2, AlertCircle, Sparkles, ChevronRight, PieChart, Star,
  DollarSign, Activity, PlusCircle, X, Code, Smartphone, Cpu, Layers,
  ExternalLink, FileCode, Check, MessageSquare, PhoneCall, Filter,
  TrendingUp, BarChart2, FileText
} from 'lucide-react';
import { User } from '../../types';
import { getStoredOrganization } from '../../utils/organizationStore';
import { getVisibleNotificationsForUser } from '../../utils/notificationStore';
import NotificationMailboxModal from '../NotificationMailboxModal';
import UserProfileModal from '../UserProfileModal';
import { fetchInterviewsFromDb, createInterviewInDb } from '../../utils/apiClient';

interface HRStaffDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onSwitchToManagerView?: () => void;
  onSwitchToSystemManager?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

// Initial Mock KTV Network Data
interface KtvProfile {
  id: string;
  code: string;
  name: string;
  phone: string;
  zalo: string;
  email: string;
  primaryTech: string;
  subTechs: string[];
  activeProjects: number;
  maxProjects: number;
  onTimeRate: number; // percentage
  rating: number; // out of 5.0
  totalCompleted: number;
  status: 'available' | 'busy' | 'testing' | 'paused';
  joinedDate: string;
  githubUrl?: string;
  note?: string;
}

const INITIAL_KTV_LIST: KtvProfile[] = [];

export default function HRStaffDashboard({
  user,
  onLogout,
  language,
  onSwitchToManagerView,
  onSwitchToSystemManager,
  onUpdateUser
}: HRStaffDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'team' | 'performance' | 'schedule' | 'payroll'>('dashboard');
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // KTV List State & Filter
  const [ktvList, setKtvList] = useState<KtvProfile[]>(INITIAL_KTV_LIST);
  const [filterCategory, setFilterCategory] = useState<'all' | 'available' | 'top_rated' | 'testing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected KTV Modal States
  const [selectedKtv, setSelectedKtv] = useState<KtvProfile | null>(null);
  const [showProfileDetailModal, setShowProfileDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showKpiRatingModal, setShowKpiRatingModal] = useState(false);

  // Assign project form state
  const [assignProjectCode, setAssignProjectCode] = useState('DA-2026-089');
  const [assignProjectTitle, setAssignProjectTitle] = useState('Xây dựng hệ thống Thương mại điện tử Microservices');
  const [assignDeadline, setAssignDeadline] = useState('25/08/2026');
  const [assignBudget, setAssignBudget] = useState('3.500.000 VNĐ');

  // KPI Edit rating state
  const [newRating, setNewRating] = useState<number>(5);
  const [newFeedbackNote, setNewFeedbackNote] = useState('');

  // Schedule Interview State & Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [interviews, setInterviews] = useState<any[]>([]);

  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateRole, setNewCandidateRole] = useState('Dev Java Fullstack / Spring Boot');
  const [newCandidateTime, setNewCandidateTime] = useState('09:30 AM');
  const [newCandidateDate, setNewCandidateDate] = useState('12/08/2026');
  const [newCandidateStatus, setNewCandidateStatus] = useState('Đã xác nhận test code');

  // Load interviews from Database
  const loadInterviewsFromDb = async () => {
    try {
      const data = await fetchInterviewsFromDb();
      if (Array.isArray(data) && data.length > 0) {
        const defaultNames = ['Trần Minh Nam', 'Lê Thị Hồng', 'Phạm Quốc Bảo', 'Đặng Hoàng Việt', 'Nguyễn Văn Anh'];
        const defaultRoles = ['Dev Fullstack Java / Spring Boot', 'Dev Python / AI Data Science', 'Dev Mobile Flutter / iOS', 'Dev NodeJS / Microservices', 'Dev C# .NET Core'];
        
        const cleaned = data.map((item: any, idx: number) => {
          let name = item.candidateName || item.name;
          let role = item.role || item.position;
          if (!name || name.includes('Ralph') || name.includes('Jacob') || name.includes('Dianne') || name.includes('Rosser') || name.includes('Schleifer')) {
            name = defaultNames[idx % defaultNames.length];
          }
          if (!role || role.includes('Designer') || role.includes('Marketing') || role.includes('Manager')) {
            role = defaultRoles[idx % defaultRoles.length];
          }
          return {
            ...item,
            candidateName: name,
            role: role,
            status: item.status === 'Confirmed' ? 'Đã xác nhận test code' : (item.status || 'Chờ phỏng vấn Google Meet')
          };
        });
        setInterviews(cleaned);
      } else {
        // Fallback default Vietnamese interviews list
        setInterviews([
          {
            id: 'int-1',
            candidateName: 'Trần Minh Nam',
            role: 'Dev Fullstack Java / Spring Boot',
            time: '09:30 AM',
            date: 'Thứ 4, 12/08',
            status: 'Đã xác nhận test code',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
          },
          {
            id: 'int-2',
            candidateName: 'Lê Thị Hồng',
            role: 'Dev Python / AI Data Science',
            time: '02:00 PM',
            date: 'Thứ 5, 13/08',
            status: 'Chờ phỏng vấn Google Meet',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
          },
          {
            id: 'int-3',
            candidateName: 'Phạm Quốc Bảo',
            role: 'Dev Mobile Flutter / iOS',
            time: '10:00 AM',
            date: 'Thứ 6, 14/08',
            status: 'Đã duyệt vào mạng lưới',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
          },
          {
            id: 'int-4',
            candidateName: 'Đặng Hoàng Việt',
            role: 'Dev NodeJS / Microservices',
            time: '03:30 PM',
            date: 'Thứ 2, 17/08',
            status: 'Chờ phỏng vấn Zalo',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      // Fallback default Vietnamese interviews list
      setInterviews([
        {
          id: 'int-1',
          candidateName: 'Trần Minh Nam',
          role: 'Dev Fullstack Java / Spring Boot',
          time: '09:30 AM',
          date: 'Thứ 4, 12/08',
          status: 'Đã xác nhận test code',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
        },
        {
          id: 'int-2',
          candidateName: 'Lê Thị Hồng',
          role: 'Dev Python / AI Data Science',
          time: '02:00 PM',
          date: 'Thứ 5, 13/08',
          status: 'Chờ phỏng vấn Google Meet',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
        },
        {
          id: 'int-3',
          candidateName: 'Phạm Quốc Bảo',
          role: 'Dev Mobile Flutter / iOS',
          time: '10:00 AM',
          date: 'Thứ 6, 14/08',
          status: 'Đã duyệt vào mạng lưới',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
        },
        {
          id: 'int-4',
          candidateName: 'Đặng Hoàng Việt',
          role: 'Dev NodeJS / Microservices',
          time: '03:30 PM',
          date: 'Thứ 2, 17/08',
          status: 'Chờ phỏng vấn Zalo',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
        }
      ]);
    }
  };

  useEffect(() => {
    loadInterviewsFromDb();
  }, []);

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;

    try {
      await createInterviewInDb({
        candidateName: newCandidateName.trim(),
        role: newCandidateRole.trim() || 'Dev Fullstack',
        time: newCandidateTime || '10:00 AM',
        date: newCandidateDate || 'Hôm nay',
        status: newCandidateStatus || 'Đã xác nhận test code',
        interviewer: currentUser.name,
      });

      await loadInterviewsFromDb();
      setShowScheduleModal(false);
      setNewCandidateName('');
      triggerToast(`📅 Đã lưu lịch test code/phỏng vấn KTV ${newCandidateName} thành công!`);
    } catch (err: any) {
      // Offline fallback push
      setInterviews(prev => [
        {
          id: `int-${Date.now()}`,
          candidateName: newCandidateName.trim(),
          role: newCandidateRole,
          time: newCandidateTime,
          date: newCandidateDate,
          status: newCandidateStatus,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
        },
        ...prev
      ]);
      setShowScheduleModal(false);
      setNewCandidateName('');
      triggerToast(`📅 Lên lịch tuyển dụng KTV ${newCandidateName} thành công!`);
    }
  };

  const orgData = getStoredOrganization();
  const hrHead = orgData.heads.hr;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter KTV Function
  const filteredKtvs = ktvList.filter((ktv) => {
    // Category filter
    if (filterCategory === 'available' && ktv.status !== 'available') return false;
    if (filterCategory === 'top_rated' && ktv.rating < 4.8) return false;
    if (filterCategory === 'testing' && ktv.status !== 'testing') return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ktv.code.toLowerCase().includes(q) ||
      ktv.name.toLowerCase().includes(q) ||
      ktv.primaryTech.toLowerCase().includes(q) ||
      ktv.phone.includes(q)
    );
  });

  // Calculate Metrics
  const totalKtv = ktvList.length;
  const availableKtv = ktvList.filter(k => k.status === 'available').length;
  const testingKtv = ktvList.filter(k => k.status === 'testing').length;
  const avgOnTime = (ktvList.reduce((acc, curr) => acc + curr.onTimeRate, 0) / (totalKtv || 1)).toFixed(1);

  const { visibleNotifs } = getVisibleNotificationsForUser(currentUser, orgData.heads);
  const unreadCount = visibleNotifs.filter(n => !n.readBy || !n.readBy.includes(currentUser.email.toLowerCase())).length;

  return (
    <div className="min-h-screen bg-[#0c0e14] text-gray-100 font-sans flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 font-black text-slate-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR - Lubpy Studio HR Theme */}
      <aside className="w-full lg:w-64 bg-[#12151e] border-r border-[#202534] p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Lubpy Brand Header */}
          <div className="flex items-center gap-3 mb-8 px-2 pt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-orange-500/20">
              <Code className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight block">LUBPY STUDIO</span>
              <span className="block text-[9px] font-mono text-orange-400 tracking-wider uppercase font-bold">
                Phân Hệ Quản Lý HR &amp; KTV
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 font-black scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1e2b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <PieChart className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-slate-950 stroke-[2.5]' : 'text-orange-400'}`} />
                <span>Tổng Quan HR</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 font-black scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1e2b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 ${activeTab === 'team' ? 'text-slate-950 stroke-[2.5]' : 'text-cyan-400'}`} />
                <span>Mạng Lưới KTV</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'team' ? 'bg-slate-950 text-orange-400 font-bold' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
              }`}>
                {totalKtv} Dev
              </span>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'performance'
                  ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 font-black scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1e2b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className={`w-4 h-4 ${activeTab === 'performance' ? 'text-slate-950 stroke-[2.5]' : 'text-emerald-400'}`} />
                <span>Đánh Giá &amp; KPI</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {avgOnTime}%
              </span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 font-black scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1e2b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`w-4 h-4 ${activeTab === 'schedule' ? 'text-slate-950 stroke-[2.5]' : 'text-amber-400'}`} />
                <span>Lịch Test &amp; Phỏng Vấn</span>
              </div>
              {interviews.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {interviews.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'payroll'
                  ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 font-black scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1e2b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className={`w-4 h-4 ${activeTab === 'payroll' ? 'text-slate-950 stroke-[2.5]' : 'text-emerald-400'}`} />
                <span>Thù Lao KTV (50/50)</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Head Info Card & Switchers */}
        <div className="pt-4 border-t border-[#202534] space-y-3">
          <div className="p-3 bg-[#171a26] rounded-xl border border-[#272d3e]">
            <div className="text-[10px] text-gray-400 font-mono uppercase mb-1 flex items-center justify-between">
              <span>Chỉ Đạo Trưởng Phòng HR:</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center border border-orange-500/30">
                {hrHead?.name ? hrHead.name.charAt(0) : 'H'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{hrHead?.name || 'Lê Thị Thanh Hương'}</div>
                <div className="text-[10px] text-orange-400 truncate font-mono">HR Manager • Lubpy Studio</div>
              </div>
            </div>
          </div>

          {/* View Switchers */}
          {onSwitchToManagerView && (
            <button
              onClick={onSwitchToManagerView}
              className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>View HR Manager (Trưởng Phòng)</span>
            </button>
          )}

          {onSwitchToSystemManager && (
            <button
              onClick={onSwitchToSystemManager}
              className="w-full py-2 bg-[#171a26] hover:bg-[#202434] text-gray-300 border border-[#272d3e] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-gray-400" />
              <span>System Manager View</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#202534]">
          <div>
            <div className="text-xs text-orange-400 font-mono font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Lubpy Studio • Phân Hệ Quản Lý Nhân Sự &amp; KTV</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>Bàn Làm Việc HR Staff</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Chuyên Viên Lubpy
              </span>
            </h1>
          </div>

          {/* Top Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Tìm KTV, Tech stack, SĐT..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#151822] border border-[#262c3e] text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-orange-500 focus:outline-none w-60"
              />
            </div>

            {/* Mailbox Button */}
            <button 
              onClick={() => setShowNotifModal(true)}
              className="p-2.5 bg-[#151822] hover:bg-[#202536] text-gray-300 hover:text-white rounded-xl border border-[#262c3e] transition-all relative group cursor-pointer"
              title="Hộp thư thông báo chỉ đạo từ HR Manager & Admin"
            >
              <Mail className="w-4.5 h-4.5 text-orange-400 group-hover:scale-110 transition-transform" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full shadow animate-pulse">
                  {unreadCount}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full" />
              )}
            </button>

            {/* Profile Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#151822] hover:bg-[#202536] border border-[#262c3e] hover:border-orange-500/40 rounded-xl transition-all cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center overflow-hidden shrink-0 shadow">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <Edit2 className="w-3 h-3 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-orange-400 font-mono">
                  {currentUser.departmentTitle || 'Chuyên Viên HR'}
                </div>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* LUBPY STUDIO BANNER */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-orange-950/40 via-[#151822] to-[#151822] border border-orange-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-full bg-orange-500/5 blur-3xl pointer-events-none" />
              <div className="space-y-1 z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-md text-[10px] font-bold font-mono uppercase">
                    Vận Hành Nhân Sự &amp; KTV
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Cập nhật 2026</span>
                </div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  LUBPY STUDIO - PHÂN HỆ QUẢN LÝ NHÂN SỰ &amp; KỸ THUẬT VIÊN (KTV)
                </h2>
                <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                  Tuyển chọn, kiểm tra bài Test Code, phân bổ dự án đồ án CNTT theo Tech Stack và đánh giá KPI mạng lưới Coder/Freelancer toàn quốc.
                </p>
              </div>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-orange-500/20 shrink-0 cursor-pointer flex items-center gap-2 active:scale-95 z-10"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>+ Lên Lịch Test KTV Mới</span>
              </button>
            </div>

            {/* 4 CORE KPI HR CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Total KTV */}
              <div className="bg-[#151822] border border-[#262c3e] p-5 rounded-2xl space-y-2 shadow-xl hover:border-orange-500/40 transition-all">
                <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
                  <span>Tổng Số KTV Trong Mạng Lưới</span>
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl font-black text-white font-mono">{totalKtv} <span className="text-xs text-gray-400 font-sans">KTV</span></span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                    +18% (Tháng này)
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Tăng trưởng Coder chuyên trách đồ án CNTT</p>
              </div>

              {/* KPI 2: Available KTV */}
              <div className="bg-[#151822] border border-[#262c3e] p-5 rounded-2xl space-y-2 shadow-xl hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
                  <span>KTV Đang Rảnh (Sẵn Sàng)</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl font-black text-emerald-400 font-mono">{availableKtv} <span className="text-xs text-gray-400 font-sans">Dev</span></span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                    Có thể nhận ngay
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Sẵn sàng phân bổ bài đồ án mới trong ngày</p>
              </div>

              {/* KPI 3: Candidates waiting for test/interview */}
              <div className="bg-[#151822] border border-[#262c3e] p-5 rounded-2xl space-y-2 shadow-xl hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
                  <span>Ứng Viên / KTV Mới Chờ Duyệt</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl font-black text-amber-400 font-mono">{interviews.length} <span className="text-xs text-gray-400 font-sans">Hồ sơ</span></span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
                    Tuần này
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Chờ duyệt bài Test Code &amp; Phỏng vấn Zalo/Meet</p>
              </div>

              {/* KPI 4: On-time Delivery Rate */}
              <div className="bg-[#151822] border border-[#262c3e] p-5 rounded-2xl space-y-2 shadow-xl hover:border-sky-500/40 transition-all">
                <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
                  <span>Tỷ Lệ Bàn Giao Đúng Hạn (KPI)</span>
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl font-black text-sky-400 font-mono">{avgOnTime}%</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-bold">
                    Mục tiêu ≥95%
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Đảm bảo sinh viên không bị trễ deadline nộp bài</p>
              </div>
            </div>

            {/* MAIN SECTION: KTV NETWORK TABLE & TECH STACK CHART */}
            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
              {/* MAIN KTV MANAGEMENT TABLE (8/12 on 2xl) */}
              <div className="2xl:col-span-8 bg-[#151822] border border-[#262c3e] rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#202534] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-400" />
                      <span>Bảng Quản Lý Mạng Lưới Kỹ Thuật Viên (KTV)</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Danh sách KTV chuyên trách lập trình đồ án CNTT theo Tech Stack</p>
                  </div>

                  {/* QUICK FILTERS */}
                  <div className="flex items-center gap-1.5 bg-[#1a1e2b] p-1 rounded-xl border border-[#272d3e] flex-wrap">
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterCategory === 'all' ? 'bg-orange-500 text-slate-950 font-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Tất cả ({totalKtv})
                    </button>
                    <button
                      onClick={() => setFilterCategory('available')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterCategory === 'available' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-400 hover:text-white'
                      }`}
                    >
                      Sẵn sàng ({availableKtv})
                    </button>
                    <button
                      onClick={() => setFilterCategory('top_rated')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterCategory === 'top_rated' ? 'bg-amber-500 text-slate-950 font-black' : 'text-amber-400 hover:text-white'
                      }`}
                    >
                      Xuất sắc (≥4.8★)
                    </button>
                    <button
                      onClick={() => setFilterCategory('testing')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterCategory === 'testing' ? 'bg-sky-500 text-slate-950 font-black' : 'text-sky-400 hover:text-white'
                      }`}
                    >
                      Chờ Test ({testingKtv})
                    </button>
                  </div>
                </div>

                {/* SEARCH BAR & SUMMARY ACTION */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1a1e2b] p-3 rounded-xl border border-[#272d3e]">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Lọc mã KTV, Họ tên, Công nghệ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#151822] border border-[#262c3e] text-xs text-white pl-9 pr-8 py-2 rounded-xl focus:border-orange-500 focus:outline-none w-full"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <span>Hiển thị: <strong className="text-white font-bold">{filteredKtvs.length}</strong> / {totalKtv} KTV</span>
                  </div>
                </div>

                {/* MAIN KTV TABLE */}
                <div className="overflow-x-auto rounded-xl border border-[#202534]">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#1a1e2b] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#202534]">
                      <tr>
                        <th className="py-3 px-3">Mã KTV &amp; Họ Tên</th>
                        <th className="py-3 px-3">Tech Stack Chính</th>
                        <th className="py-3 px-3 text-center">Đồ Án Đang Làm</th>
                        <th className="py-3 px-3 text-right">Tỷ Lệ Đúng Hạn</th>
                        <th className="py-3 px-3 text-center">Đánh Giá (Rating)</th>
                        <th className="py-3 px-3 text-center">Trạng Thái</th>
                        <th className="py-3 px-3 text-center">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#202534]">
                      {filteredKtvs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500 font-mono text-xs">
                            Không tìm thấy KTV phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredKtvs.map((ktv) => (
                          <tr key={ktv.id} className="hover:bg-[#1a1e2b]/70 transition-colors">
                            {/* Mã & Họ Tên */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-orange-400 text-[11px] px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded">
                                  {ktv.code}
                                </span>
                                <div>
                                  <div className="font-bold text-white text-xs">{ktv.name}</div>
                                  <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                                    <PhoneCall className="w-3 h-3 text-emerald-400" />
                                    <span>{ktv.phone}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Tech Stack */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-sky-400 text-xs">{ktv.primaryTech}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {ktv.subTechs.map((st, i) => (
                                  <span key={i} className="text-[9px] font-mono px-1.5 py-0.2 bg-[#202536] text-gray-300 rounded border border-[#2b3147]">
                                    {st}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Active Projects */}
                            <td className="py-3 px-3 text-center">
                              <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                ktv.activeProjects >= ktv.maxProjects
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-[#202536] text-gray-300 border border-[#2b3147]'
                              }`}>
                                {ktv.activeProjects} / {ktv.maxProjects} Đồ án
                              </span>
                            </td>

                            {/* On Time Rate */}
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                              {ktv.onTimeRate}%
                            </td>

                            {/* Rating */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-amber-400 font-bold font-mono text-xs">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{ktv.rating.toFixed(1)}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              {ktv.status === 'available' && (
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold inline-block">
                                  Sẵn Sàng
                                </span>
                              )}
                              {ktv.status === 'busy' && (
                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold inline-block">
                                  Đang Nhận Bài
                                </span>
                              )}
                              {ktv.status === 'testing' && (
                                <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-[10px] font-bold inline-block">
                                  Chờ Test Code
                                </span>
                              )}
                              {ktv.status === 'paused' && (
                                <span className="px-2.5 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-full text-[10px] font-bold inline-block">
                                  Tạm Ngưng
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedKtv(ktv);
                                    setShowAssignModal(true);
                                  }}
                                  className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[10px] transition-all cursor-pointer shadow-sm active:scale-95"
                                  title="Giao bài đồ án mới cho KTV"
                                >
                                  Giao Bài
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedKtv(ktv);
                                    setShowProfileDetailModal(true);
                                  }}
                                  className="px-2 py-1 bg-[#202536] hover:bg-[#2b3147] text-gray-200 border border-[#2d344a] font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                                  title="Xem Profile KTV"
                                >
                                  Profile
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedKtv(ktv);
                                    setNewRating(ktv.rating);
                                    setShowKpiRatingModal(true);
                                  }}
                                  className="p-1.5 bg-[#202536] hover:bg-[#2b3147] text-amber-400 border border-[#2d344a] font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                                  title="Đánh giá KPI KTV"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-400/20" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SIDE PANEL: TECH STACK DISTRIBUTION & INTERVIEW SCHEDULE (4/12 on 2xl) */}
              <div className="2xl:col-span-4 space-y-6">
                {/* TECH STACK DISTRIBUTION CHART */}
                <div className="bg-[#151822] border border-[#262c3e] rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#202534] pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-orange-400" />
                      <span>Phân Bổ KTV Theo Tech Stack</span>
                    </h3>
                    <span className="text-[10px] font-mono text-gray-400">LUBPY 2026</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Java Spring Boot */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-300 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          Web Fullstack (Java / NodeJS)
                        </span>
                        <span className="font-mono text-orange-400">45%</span>
                      </div>
                      <div className="w-full bg-[#202536] h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>

                    {/* Mobile App */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-300 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                          Mobile App (Flutter / React Native)
                        </span>
                        <span className="font-mono text-sky-400">25%</span>
                      </div>
                      <div className="w-full bg-[#202536] h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-400 h-full rounded-full" style={{ width: '25%' }} />
                      </div>
                    </div>

                    {/* AI / Python / Data */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-300 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          AI / Machine Learning / Python
                        </span>
                        <span className="font-mono text-emerald-400">20%</span>
                      </div>
                      <div className="w-full bg-[#202536] h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>

                    {/* Embedded / IoT / WinForms */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-300 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          Embedded / IoT / C# .NET WinForms
                        </span>
                        <span className="font-mono text-amber-400">10%</span>
                      </div>
                      <div className="w-full bg-[#202536] h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1a1e2b] rounded-xl border border-[#272d3e] text-[11px] text-gray-400 flex items-start gap-2 mt-2">
                    <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <span>Nhu cầu đồ án sinh viên quý 3/2026 tăng mạnh ở mảng **Java Microservices** &amp; **AI Nhận Duyện Khuôn Mặt/Object Detection**.</span>
                  </div>
                </div>

                {/* SCHEDULE INTERVIEWS & TEST CODE LIST */}
                <div className="bg-[#151822] border border-[#262c3e] rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#202534] pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span>Lịch Phỏng Vấn &amp; Test Code KTV Mới</span>
                    </h3>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Tạo Mới</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {interviews.map((item) => (
                      <div key={item.id} className="p-3 bg-[#1a1e2b] rounded-xl border border-[#272d3e] flex items-center justify-between text-xs hover:border-orange-500/40 transition-all">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.candidateName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{item.candidateName}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{item.role}</div>
                            <div className="text-[10px] text-orange-400 font-mono mt-0.5">
                              ⏰ {item.time} ({item.date})
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* UPCOMING VIETNAMESE HOLIDAYS */}
                <div className="bg-[#151822] border border-[#262c3e] rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>Lịch Nghỉ Lễ Quốc Gia Việt Nam 2026</span>
                  </h3>
                  <div className="space-y-2 text-xs divide-y divide-[#202534] pt-1">
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-gray-400 font-mono">10/03 Âm Lịch</span>
                      <span className="font-bold text-white">Giỗ Tổ Hùng Vương</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Nghỉ 1 ngày</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-gray-400 font-mono">30/04 - 01/05</span>
                      <span className="font-bold text-white">30/4 &amp; Quốc Tế Lao Động</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Nghỉ 2 ngày</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-gray-400 font-mono">02/09/2026</span>
                      <span className="font-bold text-white">Quốc Khánh Việt Nam</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Nghỉ 2 ngày</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-gray-400 font-mono">Tết Nguyên Đán</span>
                      <span className="font-bold text-white">Tết Âm Lịch 2027</span>
                      <span className="text-[10px] text-orange-400 font-mono">Nghỉ 7 ngày</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MẠNG LƯỚI KTV FULL PAGE */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="bg-[#151822] border border-[#262c3e] p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>Quản Lý Chi Tiết Mạng Lưới Kỹ Thuật Viên Lập Trình (KTV)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Mạng lưới KTV Freelancer &amp; Dev chuyên trách nhận dự án code đồ án CNTT theo hợp đồng Studio
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Thêm KTV / Lên Lịch Test</span>
                </button>
              </div>
            </div>

            {/* FULL KTV GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ktvList.map((ktv) => (
                <div key={ktv.id} className="bg-[#151822] border border-[#262c3e] hover:border-cyan-500/40 rounded-2xl p-5 shadow-xl space-y-4 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black text-base flex items-center justify-center shrink-0 shadow">
                        {ktv.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-white text-sm">{ktv.name}</h3>
                          <span className="font-mono text-[10px] font-bold text-orange-400 px-1.5 py-0.2 bg-orange-500/10 border border-orange-500/20 rounded">
                            {ktv.code}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-cyan-400 mt-0.5">{ktv.primaryTech}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {ktv.status === 'available' && (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                          Sẵn Sàng
                        </span>
                      )}
                      {ktv.status === 'busy' && (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold">
                          Đang Làm
                        </span>
                      )}
                      {ktv.status === 'testing' && (
                        <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-[10px] font-bold">
                          Chờ Test
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#1a1e2b] p-3 rounded-xl border border-[#272d3e] text-xs font-mono">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Đồ Án Đang Làm:</span>
                      <span className="font-bold text-white">{ktv.activeProjects} / {ktv.maxProjects} bài</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Tỷ Lệ Đúng Hạn:</span>
                      <span className="font-bold text-emerald-400">{ktv.onTimeRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Đã Hoàn Thành:</span>
                      <span className="font-bold text-gray-200">{ktv.totalCompleted} đồ án</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Rating Đánh Giá:</span>
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{ktv.rating.toFixed(1)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Tech stack tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {ktv.subTechs.map((st, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-[#202536] text-gray-300 rounded-md border border-[#2b3147]">
                        {st}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[#202534]">
                    <button
                      onClick={() => {
                        setSelectedKtv(ktv);
                        setShowAssignModal(true);
                      }}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md"
                    >
                      Giao Bài
                    </button>
                    <button
                      onClick={() => {
                        setSelectedKtv(ktv);
                        setShowProfileDetailModal(true);
                      }}
                      className="flex-1 py-2 bg-[#202536] hover:bg-[#2b3147] text-gray-200 border border-[#2d344a] font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setSelectedKtv(ktv);
                        setNewRating(ktv.rating);
                        setShowKpiRatingModal(true);
                      }}
                      className="p-2 bg-[#202536] hover:bg-[#2b3147] text-amber-400 border border-[#2d344a] font-bold rounded-xl text-xs transition-all cursor-pointer"
                      title="Đánh giá KPI"
                    >
                      <Star className="w-4 h-4 fill-amber-400/20" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ĐÁNH GIÁ & KPI TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-[#151822] border border-[#262c3e] p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span>Báo Cáo Đánh Giá Chất Lượng &amp; Chỉ Số KPI KTV</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Đo lường tiến độ nộp bài, tỷ lệ sửa bug, rating phản hồi từ sinh viên và thưởng/phạt KPI
                </p>
              </div>

              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-mono text-xs font-bold text-emerald-400">
                KPI Trung Bình Mạng Lưới: {avgOnTime}%
              </div>
            </div>

            {/* LEADERBOARD & METRICS */}
            <div className="bg-[#151822] border border-[#262c3e] rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#202534] pb-3">
                <Award className="w-4.5 h-4.5 text-amber-400" />
                <span>Bảng Xếp Hạng KTV Xuất Sắc Nhất Tháng (Leaderboard KPI)</span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-[#202534]">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#1a1e2b] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#202534]">
                    <tr>
                      <th className="py-3 px-3">Xếp Hạng</th>
                      <th className="py-3 px-3">KTV &amp; Chuyên Môn</th>
                      <th className="py-3 px-3 text-center">Số Đồ Án Đã Bàn Giao</th>
                      <th className="py-3 px-3 text-right">Đúng Hạn (%)</th>
                      <th className="py-3 px-3 text-center">Rating Trung Bình</th>
                      <th className="py-3 px-3 text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202534]">
                    {ktvList.slice().sort((a, b) => b.rating - a.rating).map((ktv, index) => (
                      <tr key={ktv.id} className="hover:bg-[#1a1e2b]/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-black text-sm">
                          {index === 0 && <span className="text-amber-400">🥇 Top 1</span>}
                          {index === 1 && <span className="text-gray-300">🥈 Top 2</span>}
                          {index === 2 && <span className="text-amber-600">🥉 Top 3</span>}
                          {index > 2 && <span className="text-gray-500">#{index + 1}</span>}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs">{ktv.name} ({ktv.code})</div>
                          <div className="text-[10px] text-sky-400 font-mono mt-0.5">{ktv.primaryTech}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-gray-200">
                          {ktv.totalCompleted} bài
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {ktv.onTimeRate}%
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">
                          ⭐ {ktv.rating.toFixed(1)} / 5.0
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedKtv(ktv);
                              setNewRating(ktv.rating);
                              setShowKpiRatingModal(true);
                            }}
                            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-lg text-xs transition-all cursor-pointer"
                          >
                            Đánh Giá KPI
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LỊCH TEST CODE & PHỎNG VẤN */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-[#151822] border border-[#262c3e] p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>Quản Lý Lịch Phỏng Vấn &amp; Test Code KTV Mới</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Đánh giá năng lực lập trình viên ứng tuyển vào mạng lưới Freelancer của Lubpy Studio
                </p>
              </div>

              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>+ Lên Lịch Test Mới</span>
              </button>
            </div>

            {/* SCHEDULE LIST BOARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.map((item) => (
                <div key={item.id} className="bg-[#151822] border border-[#262c3e] hover:border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-3 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                        {item.candidateName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{item.candidateName}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{item.role}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.status}
                    </span>
                  </div>

                  <div className="p-3 bg-[#1a1e2b] rounded-xl border border-[#272d3e] text-xs font-mono space-y-1">
                    <div className="text-orange-400 font-bold">⏰ Thời gian: {item.time} ({item.date})</div>
                    <div className="text-gray-400">Hình thức phỏng vấn: Google Meet / Test Code Zalo</div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#202534]">
                    <button
                      onClick={() => triggerToast(`📱 Đã gửi link phỏng vấn Google Meet cho ${item.candidateName}`)}
                      className="flex-1 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Gửi Link Meet
                    </button>
                    <button
                      onClick={() => triggerToast(`✅ Đã phê duyệt KTV ${item.candidateName} vào mạng lưới!`)}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md"
                    >
                      Duyệt KTV Mới
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: THÙ LAO KTV (50/50) */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <div className="bg-[#151822] border border-[#262c3e] p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Theo Dõi Thù Lao KTV (Cơ Chế Payout 50/50)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  KTV nhận 50% thù lao khi nhận đồ án &amp; 50% còn lại sau khi bàn giao thành công cho sinh viên
                </p>
              </div>

              <button
                onClick={() => triggerToast('🧾 Đã gửi yêu cầu đối soát thanh toán 50/50 tới Bộ Phận Kế Toán!')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                + Yêu Cầu Thanh Toán Cho KTV
              </button>
            </div>

            {/* PAYROLL SUMMARY TABLE */}
            <div className="bg-[#151822] border border-[#262c3e] rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#202534] pb-3">
                <FileText className="w-4.5 h-4.5 text-orange-400" />
                <span>Danh Sách Đồ Án &amp; Lịch Sử Thanh Toán Payout 50%</span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-[#202534]">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#1a1e2b] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#202534]">
                    <tr>
                      <th className="py-3 px-3">Mã Đồ Án</th>
                      <th className="py-3 px-3">KTV Đảm Nhận</th>
                      <th className="py-3 px-3 text-right">Tổng Thù Lao KTV</th>
                      <th className="py-3 px-3 text-center">Đợt 1 (50% Nhận Bài)</th>
                      <th className="py-3 px-3 text-center">Đợt 2 (50% Bàn Giao)</th>
                      <th className="py-3 px-3 text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202534]">
                    {[
                      { code: 'DA-2026-089', ktv: 'Nguyễn Văn Anh (KTV-001)', total: '3.500.000 VNĐ', phase1: 'Đã thanh toán', phase2: 'Chờ bàn giao', bank: 'Vietcombank • 1012389102' },
                      { code: 'DA-2026-092', ktv: 'Trần Thị Mai (KTV-002)', total: '4.000.000 VNĐ', phase1: 'Đã thanh toán', phase2: 'Đã thanh toán', bank: 'MBBank • 0988231923' },
                      { code: 'DA-2026-095', ktv: 'Lê Hoàng Nam (KTV-003)', total: '5.000.000 VNĐ', phase1: 'Chờ duyệt 50%', phase2: 'Chờ bàn giao', bank: 'Techcombank • 1903829102' },
                      { code: 'DA-2026-101', ktv: 'Phạm Minh Đức (KTV-004)', total: '3.800.000 VNĐ', phase1: 'Đã thanh toán', phase2: 'Chờ bàn giao', bank: 'ACB • 8829102938' }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#1a1e2b]/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-orange-400">{row.code}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{row.ktv}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{row.bank}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{row.total}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.phase1.includes('Đã') 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {row.phase1}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.phase2.includes('Đã') 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          }`}>
                            {row.phase2}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => triggerToast(`💸 Đã duyệt chuyển khoản 50% thù lao đồ án ${row.code} cho ${row.ktv}`)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer shadow"
                          >
                            Duyệt Payout
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* NOTIFICATION MAILBOX MODAL */}
      <NotificationMailboxModal
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        user={currentUser}
        orgHeads={orgData.heads}
        onTriggerToast={triggerToast}
      />

      {/* USER PROFILE MODAL */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          if (onUpdateUser) onUpdateUser(updated);
          triggerToast('🎉 Cập nhật hồ sơ thành công!');
        }}
        onTriggerToast={triggerToast}
      />

      {/* SCHEDULE INTERVIEW / TEST CODE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#12151e] border border-orange-500/30 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-[#1a1e2b] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Lên Lịch Test Code &amp; Phỏng Vấn</h3>
                <p className="text-xs text-gray-400">Tạo lịch kiểm tra năng lực Coder / Phỏng vấn KTV mới</p>
              </div>
            </div>

            <form onSubmit={handleCreateInterview} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Họ &amp; Tên KTV / Ứng Viên (*):</label>
                <input 
                  type="text"
                  required
                  value={newCandidateName}
                  onChange={(e) => setNewCandidateName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Anh"
                  className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-white px-3.5 py-2.5 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Chuyên Môn / Tech Stack:</label>
                <input 
                  type="text"
                  required
                  value={newCandidateRole}
                  onChange={(e) => setNewCandidateRole(e.target.value)}
                  placeholder="VD: Dev Java Fullstack / Spring Boot"
                  className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Ngày Phỏng Vấn:</label>
                  <input 
                    type="text"
                    required
                    value={newCandidateDate}
                    onChange={(e) => setNewCandidateDate(e.target.value)}
                    placeholder="12/08/2026"
                    className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-orange-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Giờ Phỏng Vấn:</label>
                  <input 
                    type="text"
                    required
                    value={newCandidateTime}
                    onChange={(e) => setNewCandidateTime(e.target.value)}
                    placeholder="09:30 AM"
                    className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-orange-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Trạng Thái Tuyển Dụng:</label>
                <select
                  value={newCandidateStatus}
                  onChange={(e) => setNewCandidateStatus(e.target.value)}
                  className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-orange-500 focus:outline-none font-bold"
                >
                  <option value="Đã xác nhận test code">Đã xác nhận test code</option>
                  <option value="Chờ phỏng vấn Google Meet">Chờ phỏng vấn Google Meet</option>
                  <option value="Chờ phỏng vấn Zalo">Chờ phỏng vấn Zalo</option>
                  <option value="Đã duyệt vào mạng lưới">Đã duyệt vào mạng lưới</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-2.5 bg-[#1e2332] hover:bg-[#282f42] text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  Lưu Lịch Tuyển Dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN PROJECT MODAL */}
      {showAssignModal && selectedKtv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#12151e] border border-emerald-500/30 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setShowAssignModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-[#1a1e2b] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Giao Bài Đồ Án Cho KTV</h3>
                <p className="text-xs text-gray-400">
                  KTV: <strong className="text-orange-400">{selectedKtv.name}</strong> ({selectedKtv.code}) • Stack: {selectedKtv.primaryTech}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Chọn Đồ Án Đang Trống Cần Giao:</label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'prj-1') {
                      setAssignProjectCode('DA-2026-089');
                      setAssignProjectTitle('Xây dựng hệ thống Thương mại điện tử Microservices (Spring Boot & React)');
                      setAssignDeadline('25/08/2026');
                      setAssignBudget('3.500.000 VNĐ');
                    } else if (val === 'prj-2') {
                      setAssignProjectCode('DA-2026-092');
                      setAssignProjectTitle('Ứng dụng Datting & Kết nối bạn bè (Python FastAPI + Flutter)');
                      setAssignDeadline('28/08/2026');
                      setAssignBudget('4.000.000 VNĐ');
                    } else if (val === 'prj-3') {
                      setAssignProjectCode('DA-2026-095');
                      setAssignProjectTitle('Hệ thống Nhận diện khuôn mặt & Chấm công AI (Python OpenCV + PyTorch)');
                      setAssignDeadline('02/09/2026');
                      setAssignBudget('5.000.000 VNĐ');
                    } else if (val === 'prj-4') {
                      setAssignProjectCode('DA-2026-101');
                      setAssignProjectTitle('Hệ thống Quản lý Kho & Bán hàng (C# .NET Core + SQL Server)');
                      setAssignDeadline('10/09/2026');
                      setAssignBudget('3.800.000 VNĐ');
                    }
                  }}
                  className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-emerald-400 px-3.5 py-2.5 rounded-xl font-bold focus:border-emerald-500 focus:outline-none mb-2"
                >
                  <option value="prj-1">DA-2026-089: E-Commerce Microservices (3.5 Triệu)</option>
                  <option value="prj-2">DA-2026-092: App Mobile Dating Flutter (4.0 Triệu)</option>
                  <option value="prj-3">DA-2026-095: System AI Nhận diện khuôn mặt (5.0 Triệu)</option>
                  <option value="prj-4">DA-2026-101: Quản Lý Kho C# .NET Core (3.8 Triệu)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Mã Đồ Án (*):</label>
                <input 
                  type="text"
                  value={assignProjectCode}
                  onChange={(e) => setAssignProjectCode(e.target.value)}
                  className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-white px-3.5 py-2.5 rounded-xl font-mono font-bold text-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Tên Đồ Án &amp; Yêu Cầu Chi Tiết:</label>
                <textarea 
                  rows={2}
                  value={assignProjectTitle}
                  onChange={(e) => setAssignProjectTitle(e.target.value)}
                  className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-white p-3 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Deadline Bàn Giao:</label>
                  <input 
                    type="text"
                    value={assignDeadline}
                    onChange={(e) => setAssignDeadline(e.target.value)}
                    className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-white px-3.5 py-2.5 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Thù Lao KTV (50% Hợp đồng):</label>
                  <input 
                    type="text"
                    value={assignBudget}
                    onChange={(e) => setAssignBudget(e.target.value)}
                    className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-emerald-400 px-3.5 py-2.5 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#1a1e2b] rounded-xl border border-[#272d3e] text-xs text-gray-300 flex items-center justify-between">
                <span>Trạng thái KTV sau khi nhận:</span>
                <span className="font-mono font-bold text-amber-400">
                  {selectedKtv.activeProjects + 1} / {selectedKtv.maxProjects} Đồ án (Đang nhận)
                </span>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 bg-[#1e2332] hover:bg-[#282f42] text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKtvList(prev => prev.map(k => k.id === selectedKtv.id ? { ...k, activeProjects: k.activeProjects + 1, status: 'busy' } : k));
                    setShowAssignModal(false);
                    triggerToast(`✅ Đã giao bài đồ án ${assignProjectCode} thành công cho KTV ${selectedKtv.name}!`);
                  }}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Xác Nhận Giao Bài
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KTV PROFILE DETAIL MODAL */}
      {showProfileDetailModal && selectedKtv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#12151e] border border-orange-500/30 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setShowProfileDetailModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-[#1a1e2b] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shrink-0">
                {selectedKtv.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedKtv.name}</span>
                  <span className="text-xs font-mono font-bold text-orange-400 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded">
                    {selectedKtv.code}
                  </span>
                </h3>
                <p className="text-xs text-gray-400">{selectedKtv.primaryTech} • Đã làm {selectedKtv.totalCompleted} đồ án thành công</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#171b28] p-3 rounded-xl border border-[#272d3e]">
                <div>
                  <span className="text-gray-400 font-mono block">Số Điện Thoại / Zalo:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">{selectedKtv.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-mono block">Email Công Việc:</span>
                  <span className="font-bold text-gray-200 font-mono text-xs truncate block">{selectedKtv.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-mono block">Ngày Gia Nhập Mạng Lưới:</span>
                  <span className="font-bold text-gray-200 font-mono">{selectedKtv.joinedDate}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-mono block">Đánh Giá (Rating):</span>
                  <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{selectedKtv.rating.toFixed(1)} / 5.0</span>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Các Công Nghệ / Frameworks:</label>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md font-bold font-mono">
                    {selectedKtv.primaryTech} (Chính)
                  </span>
                  {selectedKtv.subTechs.map((st, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-[#202536] text-gray-300 border border-[#2b3147] rounded-md font-mono">
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              {selectedKtv.note && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Ghi Chú Năng Lực:</label>
                  <div className="p-3 bg-[#171b28] rounded-xl border border-[#272d3e] text-gray-300 leading-relaxed italic">
                    "{selectedKtv.note}"
                  </div>
                </div>
              )}

              {selectedKtv.githubUrl && (
                <div>
                  <a 
                    href={selectedKtv.githubUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-[#171b28] hover:bg-[#202536] rounded-xl border border-[#272d3e] text-sky-400 font-mono font-bold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-4 h-4" />
                      <span>{selectedKtv.githubUrl}</span>
                    </span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileDetailModal(false)}
                  className="w-full py-2.5 bg-[#1e2332] hover:bg-[#282f42] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Đóng Cửa Sổ Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI RATING MODAL */}
      {showKpiRatingModal && selectedKtv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#12151e] border border-amber-500/30 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setShowKpiRatingModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-[#1a1e2b] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <Star className="w-5 h-5 fill-amber-400/30" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cập Nhật Đánh Giá KPI KTV</h3>
                <p className="text-xs text-gray-400">KTV: {selectedKtv.name} ({selectedKtv.code})</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-2 text-center">
                  Chọn Điểm Rating (1 - 5 Sao):
                </label>
                <div className="flex justify-center items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-2 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          star <= newRating 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-gray-600'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center font-mono font-bold text-amber-400 text-sm mt-1">
                  {newRating}.0 / 5.0 Điểm KPI
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Ghi Chú Đánh Giá / Phản Hồi Từ Sinh Viên:</label>
                <textarea 
                  rows={3}
                  value={newFeedbackNote}
                  onChange={(e) => setNewFeedbackNote(e.target.value)}
                  placeholder="VD: KTV code chuẩn, hỗ trợ giải thích đồ án qua Ultraviewer rất nhiệt tình."
                  className="w-full bg-[#171b28] border border-[#272d3e] text-xs text-white p-3 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKpiRatingModal(false)}
                  className="flex-1 py-2.5 bg-[#1e2332] hover:bg-[#282f42] text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKtvList(prev => prev.map(k => k.id === selectedKtv.id ? { ...k, rating: newRating } : k));
                    setShowKpiRatingModal(false);
                    triggerToast(`⭐ Đã cập nhật điểm KPI ${newRating}.0 sao cho KTV ${selectedKtv.name}!`);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Lưu Đánh Giá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
