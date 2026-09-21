import React, { useState, useEffect } from 'react';
import { 
  Search, Code, CheckCircle2, AlertTriangle, 
  Terminal, Server, Wrench, Bell,
  User as UserIcon, Mail, Plus, Download, Edit3, Trash2,
  Clock, Play, ShieldCheck, Activity, BarChart2, CheckSquare,
  FileText, ArrowRight, Settings, ExternalLink, Cpu, Layers
} from 'lucide-react';
import { User } from '../types';
import { getStoredOrganization } from '../utils/organizationStore';
import { getVisibleNotificationsForUser } from '../utils/notificationStore';
import NotificationMailboxModal from './NotificationMailboxModal';
import WorkspaceNotificationBell from './WorkspaceNotificationBell';
import UserProfileModal from './UserProfileModal';

interface TechDeveloperDashboardProps {
  user: User;
  onLogout: () => void;
  language?: 'en' | 'vi';
  onSwitchToSystemManager?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export interface TechTask {
  id: string;
  projectName: string;
  studentName: string;
  studentPhone?: string;
  studentEmail?: string;
  taskType: 
    | 'Lập trình tính năng mới / Hoàn thiện Source Code'
    | 'Sửa lỗi Bug Demo / Fix Bug theo yêu cầu'
    | 'Chỉnh sửa lại hệ thống theo góp ý của Giảng viên hướng dẫn (GVHD)'
    | 'Hỗ trợ Cài đặt môi trường / Deploy Web & App lên Server / VPS'
    | 'Soạn thảo tài liệu Báo cáo / Hướng dẫn cài đặt & Bảo vệ đồ án';
  priority: 'Gấp (Sắp nộp)' | 'Cao' | 'Trung bình' | 'Thấp';
  status: 'Mới tiếp nhận' | 'Đang thực hiện' | 'Chờ kiểm tra' | 'Đã hoàn tất';
  assignedDev: string;
  deadline: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  history?: { author: string; role: string; content: string; timestamp: string }[];
}

const TASK_TYPE_OPTIONS = [
  'Lập trình tính năng mới / Hoàn thiện Source Code',
  'Sửa lỗi Bug Demo / Fix Bug theo yêu cầu',
  'Chỉnh sửa lại hệ thống theo góp ý của Giảng viên hướng dẫn (GVHD)',
  'Hỗ trợ Cài đặt môi trường / Deploy Web & App lên Server / VPS',
  'Soạn thảo tài liệu Báo cáo / Hướng dẫn cài đặt & Bảo vệ đồ án'
] as const;

export function getHRTechnicalEngineers(): { id?: string; name: string; title?: string; fullNameWithTitle: string }[] {
  const result: { id?: string; name: string; title?: string; fullNameWithTitle: string }[] = [];
  const seenNames = new Set<string>();

  // 1. HR Developers (lubpy_hr_developers)
  try {
    const rawHRDevs = localStorage.getItem('lubpy_hr_developers');
    if (rawHRDevs) {
      const devs = JSON.parse(rawHRDevs);
      if (Array.isArray(devs)) {
        devs.forEach((d: any) => {
          const isTechDept = !d.department || d.department === 'Nghiệp vụ Kỹ Thuật' || d.department === 'tech' || d.department === 'Software Engineering';
          if (isTechDept && d.name && d.name.trim()) {
            const cleanName = d.name.trim();
            if (!seenNames.has(cleanName.toLowerCase())) {
              seenNames.add(cleanName.toLowerCase());
              const titleStr = d.title ? ` (${d.title.trim()})` : '';
              result.push({
                id: d.id,
                name: cleanName,
                title: d.title?.trim(),
                fullNameWithTitle: `Kỹ sư ${cleanName}${titleStr}`
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Error parsing lubpy_hr_developers:', e);
  }

  // 2. System Users registered with tech role (lubpy_users)
  try {
    const rawUsers = localStorage.getItem('lubpy_users');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      if (Array.isArray(users)) {
        users.forEach((u: any) => {
          if (u.name && u.name.trim() && (u.role === 'tech' || u.role === 'dev' || u.department === 'Software Engineering' || u.department === 'tech')) {
            const cleanName = u.name.trim();
            if (!seenNames.has(cleanName.toLowerCase())) {
              seenNames.add(cleanName.toLowerCase());
              const titleStr = u.departmentTitle ? ` (${u.departmentTitle.trim()})` : '';
              result.push({
                id: u.uid,
                name: cleanName,
                title: u.departmentTitle?.trim(),
                fullNameWithTitle: `Kỹ sư ${cleanName}${titleStr}`
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Error parsing lubpy_users:', e);
  }

  // 3. Organization Head of Tech / Members
  try {
    const org = getStoredOrganization();
    if (org.heads?.tech?.name) {
      const h = org.heads.tech;
      const cleanName = h.name.trim();
      if (!seenNames.has(cleanName.toLowerCase())) {
        seenNames.add(cleanName.toLowerCase());
        const titleStr = h.departmentTitle ? ` (${h.departmentTitle.trim()})` : ' (Trưởng Phòng Kỹ Thuật)';
        result.push({
          id: h.uid,
          name: cleanName,
          title: h.departmentTitle?.trim() || 'Trưởng Phòng Kỹ Thuật',
          fullNameWithTitle: `Kỹ sư ${cleanName}${titleStr}`
        });
      }
    }
    if (Array.isArray(org.members)) {
      org.members.forEach((m: any) => {
        if (m.name && m.name.trim() && (m.role === 'tech' || m.department === 'tech')) {
          const cleanName = m.name.trim();
          if (!seenNames.has(cleanName.toLowerCase())) {
            seenNames.add(cleanName.toLowerCase());
            const titleStr = m.departmentTitle ? ` (${m.departmentTitle.trim()})` : '';
            result.push({
              id: m.uid,
              name: cleanName,
              title: m.departmentTitle?.trim(),
              fullNameWithTitle: `Kỹ sư ${cleanName}${titleStr}`
            });
          }
        }
      });
    }
  } catch (e) {
    console.error('Error reading organizationStore:', e);
  }

  return result;
}

export default function TechDeveloperDashboard({
  user,
  onLogout,
  language = 'vi',
  onSwitchToSystemManager,
  onUpdateUser
}: TechDeveloperDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [activeTab, setActiveTab] = useState<'tasks' | 'bugs' | 'performance'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [orgData] = useState(() => getStoredOrganization());

  // Dynamic Technical Engineers list from HR management
  const [engineers, setEngineers] = useState(getHRTechnicalEngineers);

  useEffect(() => {
    const updateEngineers = () => {
      setEngineers(getHRTechnicalEngineers());
    };
    window.addEventListener('storage', updateEngineers);
    window.addEventListener('lubpy_users_updated', updateEngineers);
    window.addEventListener('lubpy_hr_devs_updated', updateEngineers);
    return () => {
      window.removeEventListener('storage', updateEngineers);
      window.removeEventListener('lubpy_users_updated', updateEngineers);
      window.removeEventListener('lubpy_hr_devs_updated', updateEngineers);
    };
  }, []);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TechTask | null>(null);

  // Form states for creating task
  const [newProjectName, setNewProjectName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newTaskType, setNewTaskType] = useState<TechTask['taskType']>('Lập trình tính năng mới / Hoàn thiện Source Code');
  const [newPriority, setNewPriority] = useState<TechTask['priority']>('Gấp (Sắp nộp)');
  const [newAssignedDev, setNewAssignedDev] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Form states for editing task
  const [editStatus, setEditStatus] = useState<TechTask['status']>('Đang thực hiện');
  const [editPriority, setEditPriority] = useState<TechTask['priority']>('Cao');
  const [editAssignedDev, setEditAssignedDev] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // State for interactive tasks (Persisted in localStorage, defaults to empty array [])
  const [tasks, setTasks] = useState<TechTask[]>(() => {
    const saved = localStorage.getItem('lubpy_tech_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean out legacy mock tasks if present
        const cleaned = parsed.filter((t: any) => t.id && !t.id.startsWith('task-'));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('lubpy_tech_tasks', JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Save tasks to localStorage on change
  useEffect(() => {
    localStorage.setItem('lubpy_tech_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Sync tasks across tabs
  useEffect(() => {
    const syncTasks = () => {
      const saved = localStorage.getItem('lubpy_tech_tasks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const cleaned = parsed.filter((t: any) => t.id && !t.id.startsWith('task-'));
          setTasks(cleaned);
        } catch (e) {}
      }
    };
    window.addEventListener('storage', syncTasks);
    return () => window.removeEventListener('storage', syncTasks);
  }, []);

  // Stats Calculations
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'Đang thực hiện').length;
  const testingTasks = tasks.filter(t => t.status === 'Chờ kiểm tra').length;
  const completedTasks = tasks.filter(t => t.status === 'Đã hoàn tất').length;

  // Notifications Calculation
  const { visibleNotifs } = getVisibleNotificationsForUser(currentUser, orgData.heads);
  const userEmail = (currentUser?.email || '').toLowerCase();
  const unreadNotifCount = visibleNotifs.filter(n => !n.readBy || !n.readBy.some(e => (e || '').toLowerCase() === userEmail)).length;

  // Create Task Handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newStudentName.trim()) {
      triggerToast('Vui lòng nhập đầy đủ Tên đồ án và Tên học viên!');
      return;
    }

    const newId = `#TECH-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const createdTask: TechTask = {
      id: newId,
      projectName: newProjectName.trim(),
      studentName: newStudentName.trim(),
      studentPhone: newStudentPhone.trim(),
      studentEmail: newStudentEmail.trim(),
      taskType: newTaskType,
      priority: newPriority,
      status: 'Mới tiếp nhận',
      assignedDev: newAssignedDev.trim(),
      deadline: newDeadline.trim() || 'Trong 3 ngày',
      description: newDescription.trim() || 'Chưa có mô tả chi tiết.',
      createdAt: nowStr,
      history: [
        {
          author: currentUser.name || 'Kỹ sư LUBPY',
          role: 'Kỹ Thuật',
          content: 'Khởi tạo nhiệm vụ kỹ thuật mới cho đồ án.',
          timestamp: nowStr
        }
      ]
    };

    const updatedTasks = [createdTask, ...tasks];
    setTasks(updatedTasks);
    triggerToast(`Đã tạo thành công nhiệm vụ mã ${newId}!`);

    // Reset Form
    setNewProjectName('');
    setNewStudentName('');
    setNewStudentPhone('');
    setNewStudentEmail('');
    setNewTaskType('Lập trình tính năng mới / Hoàn thiện Source Code');
    setNewPriority('Gấp (Sắp nộp)');
    setNewAssignedDev('');
    setNewDeadline('');
    setNewDescription('');
    setShowCreateModal(false);
  };

  // Quick Status Transition
  const handleQuickStatusChange = (taskId: string, newStatus: TechTask['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const updatedHistory = [
          ...(t.history || []),
          {
            author: currentUser.name || 'Kỹ sư LUBPY',
            role: 'Kỹ Thuật',
            content: `Chuyển trạng thái sang: "${newStatus}"`,
            timestamp: nowStr
          }
        ];
        return { ...t, status: newStatus, updatedAt: nowStr, history: updatedHistory };
      }
      return t;
    }));
    triggerToast(`Đã cập nhật trạng thái Task ${taskId} thành "${newStatus}"!`);
  };

  // Edit Task Handler
  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setTasks(prev => prev.map(t => {
      if (t.id === selectedTask.id) {
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        return {
          ...t,
          status: editStatus,
          priority: editPriority,
          assignedDev: editAssignedDev,
          deadline: editDeadline,
          description: editDescription,
          updatedAt: nowStr
        };
      }
      return t;
    }));

    triggerToast(`Đã lưu thay đổi cho nhiệm vụ ${selectedTask.id}!`);
    setShowEditModal(false);
    setSelectedTask(null);
  };

  // Delete Task Handler
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhiệm vụ kỹ thuật ${taskId}?`)) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      triggerToast(`Đã xóa nhiệm vụ ${taskId}!`);
    }
  };

  // Open Edit Modal
  const openEditModal = (task: TechTask) => {
    setSelectedTask(task);
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssignedDev(task.assignedDev || '');
    setEditDeadline(task.deadline || '');
    setEditDescription(task.description || '');
    setShowEditModal(true);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      triggerToast('Không có dữ liệu nhiệm vụ kỹ thuật để xuất CSV!');
      return;
    }
    const headers = [
      'Mã Task',
      'Tên Đồ Án / Đề Tài',
      'Tên Học Viên',
      'Số Điện Thoại',
      'Email',
      'Loại Nhiệm Vụ',
      'Kỹ Sư Phụ Trách',
      'Hạn Nộp',
      'Độ Ưu Tiên',
      'Trạng Thái',
      'Ngày Tạo',
      'Mô Tả'
    ];
    const rows = tasks.map(t => [
      t.id,
      `"${(t.projectName || '').replace(/"/g, '""')}"`,
      `"${(t.studentName || '').replace(/"/g, '""')}"`,
      t.studentPhone || '',
      t.studentEmail || '',
      `"${(t.taskType || '').replace(/"/g, '""')}"`,
      `"${(t.assignedDev || 'Chưa phân công').replace(/"/g, '""')}"`,
      t.deadline || '',
      t.priority || '',
      t.status || '',
      t.createdAt || '',
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LUBPY_TECH_TASKS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Đã xuất báo cáo kỹ thuật CSV thành công!');
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assignedDev && t.assignedDev.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    if (activeTab === 'bugs') {
      const isBugOrRevision = 
        t.taskType === 'Sửa lỗi Bug Demo / Fix Bug theo yêu cầu' ||
        t.taskType === 'Chỉnh sửa lại hệ thống theo góp ý của Giảng viên hướng dẫn (GVHD)';
      return matchesSearch && matchesStatus && matchesPriority && isBugOrRevision;
    }

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-[#0d0e10] text-[#f3f4f6] font-sans relative overflow-x-hidden" id="tech-developer-dashboard">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-sky-600/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Dynamic Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181a20] border-l-4 border-emerald-500 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      <div className="flex h-full min-h-screen relative z-10">
        
        {/* SIDEBAR - LUBPY TECH (Dark Theme) */}
        <aside className="w-72 bg-[#121318] border-r border-[#1e2029] flex flex-col justify-between p-6 shrink-0 hidden lg:flex">
          <div className="space-y-8">
            
            {/* LUBPY TECH Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span>LUBPY TECH</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Kỹ Thuật &amp; Đồ Án</p>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </span>
              <input 
                type="text"
                placeholder="Tìm mã task, đồ án, học viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#181a20] border border-[#232630] rounded-xl text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-medium transition-all"
              />
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 px-2">CHỨC NĂNG CHÍNH</p>
                <div className="space-y-1.5">
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'tasks' 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/30' 
                        : 'hover:bg-[#181a20] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4" />
                      <span>Danh Sách Task &amp; Tiến Độ</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-white/20 text-white rounded-full font-extrabold">{totalTasks}</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('bugs')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'bugs' 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/30' 
                        : 'hover:bg-[#181a20] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Quản Lý Bug &amp; Sửa Đổi</span>
                    </span>
                    {tasks.filter(t => t.taskType.includes('Bug') || t.taskType.includes('góp ý')).length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 font-bold rounded-full">
                        {tasks.filter(t => t.taskType.includes('Bug') || t.taskType.includes('góp ý')).length}
                      </span>
                    )}
                  </button>

                  <button 
                    onClick={() => setActiveTab('performance')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'performance' 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/30' 
                        : 'hover:bg-[#181a20] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <BarChart2 className="w-4 h-4" />
                      <span>Hiệu Suất Kỹ Sư</span>
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 px-2">THAO TÁC NHANH</p>
                <div className="space-y-1.5">
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all border border-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tạo Nhiệm Vụ Mới</span>
                  </button>

                  <button 
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#181a20] hover:bg-[#20232d] text-gray-300 hover:text-white text-xs font-medium transition-all border border-[#232630]"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Xuất Báo Cáo (CSV)</span>
                  </button>
                </div>
              </div>
            </nav>
          </div>

          {/* Dev Profile Card */}
          <div className="bg-[#181a20] border border-[#232630] rounded-2xl p-3 flex items-center justify-between">
            <div 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs overflow-hidden">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt="Dev Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-extrabold text-white truncate">{currentUser.name || 'Trưởng Nhóm Kỹ Thuật'}</p>
                <p className="text-[10px] text-emerald-400 font-medium">Trưởng Nhóm / Dev Lead</p>
              </div>
            </div>
            <button 
              onClick={() => setShowProfileModal(true)} 
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
              title="Cài đặt hồ sơ cá nhân"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT STAGE */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          
          {/* Header Bar */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1d2028] pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <span>LUBPY STUDIO</span>
                <span>&rsaquo;</span>
                <span className="text-emerald-400 font-semibold">Kỹ Thuật &amp; Đồ Án</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                LUBPY TECH - Quản Lý Tiến Độ &amp; Đội Ngũ Kỹ Sư
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Hệ thống điều phối, lập trình, fix bug &amp; nghiệm thu bàn giao đồ án CNTT cho học viên LUBPY Studio
              </p>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
              
              {onSwitchToSystemManager && (
                <button
                  onClick={onSwitchToSystemManager}
                  className="px-3.5 py-2 bg-[#1c2230] hover:bg-[#232c3f] text-sky-400 border border-sky-500/20 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
                >
                  <Server className="w-4 h-4" />
                  <span className="hidden sm:inline">LUBPY Manager</span>
                </button>
              )}

              {/* Bell Icon Dropdown with Project Updates & Backend Messages */}
              <WorkspaceNotificationBell
                user={user}
                language={language}
              />

              {/* Notification Mailbox Icon */}
              <button 
                onClick={() => setShowNotifModal(true)}
                className="w-10 h-10 rounded-xl bg-[#181a20] border border-[#232630] hover:border-amber-500/40 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer relative group"
                title="Hộp thư thông báo chỉ đạo nội bộ"
              >
                <Mail className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Profile Settings Modal Trigger */}
              <button 
                onClick={() => setShowProfileModal(true)}
                className="w-10 h-10 rounded-xl bg-[#181a20] border border-[#232630] hover:border-emerald-500/40 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Hồ sơ cá nhân"
              >
                <UserIcon className="w-5 h-5 text-emerald-400" />
              </button>

              {/* Create Task Button */}
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Task Mới</span>
              </button>
            </div>
          </header>

          {/* TOP 4 STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            
            {/* Card 1: Total Tasks */}
            <div className="bg-[#121318] border border-[#1e2029] rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Tổng Nhiệm Vụ</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Code className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white">{totalTasks}</p>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tất cả đồ án &amp; task kỹ thuật</span>
              </p>
            </div>

            {/* Card 2: In Progress */}
            <div className="bg-[#121318] border border-[#1e2029] rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Đang Thực Hiện</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-400">{inProgressTasks}</p>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Đang lập trình &amp; fix bug</span>
              </p>
            </div>

            {/* Card 3: Pending Testing */}
            <div className="bg-[#121318] border border-[#1e2029] rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Chờ Kiểm Tra / Test</span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-purple-400">{testingTasks}</p>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Chờ nghiệm thu demo / deploy</span>
              </p>
            </div>

            {/* Card 4: Completed Tasks */}
            <div className="bg-[#121318] border border-[#1e2029] rounded-2xl p-5 relative overflow-hidden group hover:border-sky-500/40 transition-all shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Đã Bàn Giao Hoàn Tất</span>
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-sky-400">{completedTasks}</p>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Bàn giao source code &amp; báo cáo</span>
              </p>
            </div>

          </div>

          {/* MAIN TABS NAVIGATION */}
          <div className="flex items-center justify-between border-b border-[#1e2029] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'tasks'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                    : 'bg-[#121318] text-gray-400 hover:text-white border border-[#1e2029]'
                }`}
              >
                📋 Danh Sách Task &amp; Tiến Độ Đồ Án ({totalTasks})
              </button>

              <button
                onClick={() => setActiveTab('bugs')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'bugs'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                    : 'bg-[#121318] text-gray-400 hover:text-white border border-[#1e2029]'
                }`}
              >
                🐛 Quản Lý Bug &amp; Yêu Cầu Sửa Đổi ({tasks.filter(t => t.taskType.includes('Bug') || t.taskType.includes('góp ý')).length})
              </button>

              <button
                onClick={() => setActiveTab('performance')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'performance'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                    : 'bg-[#121318] text-gray-400 hover:text-white border border-[#1e2029]'
                }`}
              >
                📊 Báo Cáo Hiệu Suất Kỹ Sư
              </button>
            </div>

            <button 
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-[#181a20] hover:bg-[#20232d] border border-[#232630] rounded-xl text-xs font-bold text-emerald-400 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV (UTF-8)</span>
            </button>
          </div>

          {/* TAB 1 & 2: TASK & BUG TABLES */}
          {(activeTab === 'tasks' || activeTab === 'bugs') && (
            <div className="space-y-6">
              
              {/* Filter Controls Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121318] border border-[#1e2029] p-4 rounded-2xl">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                  <input 
                    type="text"
                    placeholder="Tìm theo Mã task, Tên đồ án, Tên học viên, Kỹ sư..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Dropdown Filters */}
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">Tất Cả Trạng Thái</option>
                    <option value="Mới tiếp nhận">Mới Tiếp Nhận</option>
                    <option value="Đang thực hiện">Đang Thực Hiện</option>
                    <option value="Chờ kiểm tra">Chờ Kiểm Tra / Test</option>
                    <option value="Đã hoàn tất">Đã Hoàn Tất Bàn Giao</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">Tất Cả Độ Ưu Tiên</option>
                    <option value="Gấp (Sắp nộp)">Gấp (Sắp Nộp)</option>
                    <option value="Cao">Mức Cao</option>
                    <option value="Trung bình">Trung Bình</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                </div>
              </div>

              {/* Tasks List / Table */}
              {filteredTasks.length === 0 ? (
                /* EMPTY STATE UI */
                <div className="bg-[#121318] border border-[#1e2029] rounded-2xl p-12 text-center flex flex-col items-center justify-center my-8">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-lg">
                    <Code className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Chưa Có Nhiệm Vụ Kỹ Thuật Nào</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
                    Hiện tại danh sách nhiệm vụ kỹ thuật đang trống. Bạn có thể tự tạo task mới hoặc chờ nhận bàn giao ticket đồ án từ bộ phận CSKH.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tạo Nhiệm Vụ Kỹ Thuật Mới</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#121318] border border-[#1e2029] rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#181a20] border-b border-[#1e2029] text-[11px] font-black uppercase text-gray-400 tracking-wider">
                          <th className="py-3.5 px-4">Mã Task</th>
                          <th className="py-3.5 px-4">Đồ Án &amp; Học Viên</th>
                          <th className="py-3.5 px-4">Loại Nhiệm Vụ</th>
                          <th className="py-3.5 px-4">Kỹ Sư Phụ Trách</th>
                          <th className="py-3.5 px-4">Hạn Nộp</th>
                          <th className="py-3.5 px-4">Độ Ưu Tiên</th>
                          <th className="py-3.5 px-4">Trạng Thái</th>
                          <th className="py-3.5 px-4 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2029] text-xs">
                        {filteredTasks.map((t) => {
                          const isUrgent = t.priority.includes('Gấp');
                          return (
                            <tr key={t.id} className="hover:bg-[#181a20]/60 transition-colors">
                              
                              {/* Task ID & Time */}
                              <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                                {t.id}
                                <div className="text-[10px] font-normal text-gray-500 font-sans">{t.createdAt}</div>
                              </td>

                              {/* Project & Student */}
                              <td className="py-4 px-4">
                                <div className="font-extrabold text-white text-xs leading-snug">{t.projectName}</div>
                                <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <span>👤 {t.studentName}</span>
                                  {t.studentPhone && <span className="text-gray-500">• {t.studentPhone}</span>}
                                </div>
                              </td>

                              {/* Task Type */}
                              <td className="py-4 px-4 max-w-[220px]">
                                <span className="text-xs text-gray-300 font-medium line-clamp-2">
                                  {t.taskType}
                                </span>
                              </td>

                              {/* Assigned Dev */}
                              <td className="py-4 px-4">
                                {t.assignedDev ? (
                                  <span className="text-xs font-bold text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 inline-block">
                                    👨‍💻 {t.assignedDev}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500 italic">
                                    Chưa phân công (Tạm thời để trống)
                                  </span>
                                )}
                              </td>

                              {/* Deadline */}
                              <td className="py-4 px-4 font-medium text-gray-300">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                                  <span>{t.deadline || 'Chưa đặt'}</span>
                                </span>
                              </td>

                              {/* Priority */}
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                  isUrgent 
                                    ? 'bg-red-500/15 text-red-400 border-red-500/30' 
                                    : t.priority === 'Cao'
                                    ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                                    : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                                }`}>
                                  {t.priority}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="py-4 px-4">
                                <select
                                  value={t.status}
                                  onChange={(e) => handleQuickStatusChange(t.id, e.target.value as any)}
                                  className={`text-xs font-bold rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer ${
                                    t.status === 'Mới tiếp nhận'
                                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                      : t.status === 'Đang thực hiện'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      : t.status === 'Chờ kiểm tra'
                                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  }`}
                                >
                                  <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                                  <option value="Đang thực hiện">Đang thực hiện</option>
                                  <option value="Chờ kiểm tra">Chờ kiểm tra / Test</option>
                                  <option value="Đã hoàn tất">Đã hoàn tất bàn giao</option>
                                </select>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openEditModal(t)}
                                    className="p-1.5 bg-[#181a20] hover:bg-[#20232d] text-gray-300 hover:text-white rounded-lg border border-[#232630] transition-colors"
                                    title="Chỉnh sửa nhiệm vụ"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(t.id)}
                                    className="p-1.5 bg-[#181a20] hover:bg-red-500/10 text-gray-300 hover:text-red-400 rounded-lg border border-[#232630] transition-colors"
                                    title="Xóa nhiệm vụ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: DEV PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-[#121318] border border-[#1e2029] p-6 rounded-2xl">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Tỉ Lệ Hoàn Thành Nhiệm Vụ</h4>
                  <p className="text-4xl font-black text-emerald-400">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Đã bàn giao {completedTasks} / {totalTasks} đồ án thành công</p>
                  <div className="w-full bg-[#181a20] h-2 rounded-full overflow-hidden mt-4">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#121318] border border-[#1e2029] p-6 rounded-2xl">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Thời Gian Xử Lý Trung Bình</h4>
                  <p className="text-4xl font-black text-amber-400">1.2 Ngày</p>
                  <p className="text-xs text-gray-400 mt-2">Đạt chuẩn SLA LUBPY Studio (&lt; 48 giờ)</p>
                  <div className="w-full bg-[#181a20] h-2 rounded-full overflow-hidden mt-4">
                    <div className="bg-amber-500 h-full w-[85%] rounded-full" />
                  </div>
                </div>

                <div className="bg-[#121318] border border-[#1e2029] p-6 rounded-2xl">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Số Lượng Kỹ Sư Sẵn Sàng</h4>
                  <p className="text-4xl font-black text-sky-400">{engineers.length} Kỹ Sư</p>
                  <p className="text-xs text-gray-400 mt-2">Được cập nhật từ Bộ phận Quản lý Nhân sự (HR)</p>
                  <div className="w-full bg-[#181a20] h-2 rounded-full overflow-hidden mt-4">
                    <div className="bg-sky-500 h-full w-[100%] rounded-full" />
                  </div>
                </div>

              </div>

              {/* Dev List Workload Breakdown */}
              <div className="bg-[#121318] border border-[#1e2029] rounded-2xl p-6">
                <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  <span>Danh Sách Đội Ngũ Kỹ Sư &amp; Số Nhiệm Vụ Phụ Trách</span>
                </h3>
                {engineers.length === 0 ? (
                  <div className="text-center py-8 bg-[#181a20]/60 border border-dashed border-[#232630] rounded-xl p-4">
                    <p className="text-xs text-gray-400">
                      Chưa có kỹ sư nào trong hệ thống nhân sự. Nhân sự kỹ thuật sẽ do bộ phận <strong>Quản Lý Nhân Sự (HR)</strong> cập nhật và phân bổ.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {engineers.map((eng) => {
                      const devTasks = tasks.filter(t => t.assignedDev && t.assignedDev.toLowerCase().includes(eng.name.toLowerCase()));
                      return (
                        <div key={eng.fullNameWithTitle} className="bg-[#181a20] border border-[#232630] p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">{eng.fullNameWithTitle}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{eng.title || 'Bộ Phận Kỹ Thuật LUBPY Studio'}</p>
                          </div>
                          <span className="text-xs font-extrabold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                            {devTasks.length} Task
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121318] border border-[#232630] w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2029] mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Tạo Nhiệm Vụ Kỹ Thuật Mới</span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Tên Đồ Án / Đề Tài *</label>
                  <input 
                    type="text"
                    required
                    placeholder="VD: Web E-commerce AI Recommendation"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Tên Học Viên *</label>
                  <input 
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn Hải"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Số Điện Thoại / Zalo</label>
                  <input 
                    type="text"
                    placeholder="VD: 0912345678"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Email Học Viên</label>
                  <input 
                    type="email"
                    placeholder="VD: client@gmail.com"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Loại Nhiệm Vụ Kỹ Thuật</label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value as any)}
                  className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {TASK_TYPE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Độ Ưu Tiên</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Gấp (Sắp nộp)">Gấp (Sắp nộp)</option>
                    <option value="Cao">Cao</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Kỹ Sư Phụ Trách</label>
                  <select
                    value={newAssignedDev}
                    onChange={(e) => setNewAssignedDev(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Chưa phân công (Tạm thời để trống) --</option>
                    {engineers.map(eng => (
                      <option key={eng.fullNameWithTitle} value={eng.fullNameWithTitle}>
                        {eng.fullNameWithTitle}
                      </option>
                    ))}
                  </select>
                  {engineers.length === 0 && (
                    <p className="text-[11px] text-amber-400/90 mt-1 italic">
                      💡 Chưa có kỹ sư do HR cập nhật. Bạn có thể để trống hoặc thêm nhân sự tại trang Quản Lý Nhân Sự (HR).
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Hạn Nộp / Yêu Cầu Bàn Giao</label>
                <input 
                  type="text"
                  placeholder="VD: Trong 24h / Ngày 26/07/2026"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Mô Tả Nhiệm Vụ Chi Tiết</label>
                <textarea 
                  rows={3}
                  placeholder="Nhập yêu cầu tính năng, bug cần fix hoặc hướng dẫn cài đặt..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e2029]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#181a20] hover:bg-[#20232d] text-gray-300 text-xs font-bold rounded-xl"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40"
                >
                  Tạo Nhiệm Vụ Mới
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121318] border border-[#232630] w-full max-w-xl rounded-2xl p-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2029] mb-6">
              <div>
                <h3 className="text-lg font-black text-white">Chỉnh Sửa Tiến Độ Task {selectedTask.id}</h3>
                <p className="text-xs text-emerald-400 font-semibold">{selectedTask.projectName} - {selectedTask.studentName}</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Trạng Thái Mới</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
                  >
                    <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                    <option value="Đang thực hiện">Đang thực hiện</option>
                    <option value="Chờ kiểm tra">Chờ kiểm tra / Test</option>
                    <option value="Đã hoàn tất">Đã hoàn tất bàn giao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Độ Ưu Tiên</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Gấp (Sắp nộp)">Gấp (Sắp nộp)</option>
                    <option value="Cao">Cao</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Kỹ Sư Phụ Trách</label>
                  <select
                    value={editAssignedDev}
                    onChange={(e) => setEditAssignedDev(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Chưa phân công (Tạm thời để trống) --</option>
                    {engineers.map(eng => (
                      <option key={eng.fullNameWithTitle} value={eng.fullNameWithTitle}>
                        {eng.fullNameWithTitle}
                      </option>
                    ))}
                    {editAssignedDev && !engineers.some(e => e.fullNameWithTitle === editAssignedDev) && (
                      <option value={editAssignedDev}>{editAssignedDev}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Hạn Nộp</label>
                  <input 
                    type="text"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Cập Nhật Mô Tả / Ghi Chú Kỹ Thuật</label>
                <textarea 
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#181a20] border border-[#232630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e2029]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-[#181a20] hover:bg-[#20232d] text-gray-300 text-xs font-bold rounded-xl"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40"
                >
                  Lưu Thay Đổi
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
          }}
          onTriggerToast={triggerToast}
        />
      )}

    </div>
  );
}
