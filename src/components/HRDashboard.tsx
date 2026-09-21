import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, AlertTriangle, DollarSign, Search, Filter, Plus, Edit2, 
  Trash2, Shield, Mail, LogOut, Code2, Star, RefreshCw, Phone, Zap, FileText, 
  X, Check, AlertCircle, ArrowUpRight, FolderKanban, Award, CheckCircle2,
  Calendar, Lock, Camera, Eye, EyeOff, User as UserIcon, Crown, Building2, Briefcase
} from 'lucide-react';
import { User, UserRole } from '../types';
import { getStoredOrganization } from '../utils/organizationStore';
import { getVisibleNotificationsForUser } from '../utils/notificationStore';
import { normalizeNameToEmail } from '../utils/authSyncHelper';
import NotificationMailboxModal from './NotificationMailboxModal';
import UserProfileModal from './UserProfileModal';

export const SALARY_RANGES = [
  '5.000.000 VND - 7.000.000 VND',
  '7.000.000 VND - 10.000.000 VND',
  '10.000.000 VND - 30.000.000 VND',
  '30.000.000 VND - 50.000.000 VND',
  '50.000.000 VND - 80.000.000 VND',
];

export const TECH_SKILL_CATEGORIES = [
  {
    category: 'Frontend & UI Frameworks',
    skills: ['React', 'Next.js', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Redux / Zustand']
  },
  {
    category: 'Backend & Kiến Trúc Hệ Thống',
    skills: ['Node.js', 'Express', 'NestJS', 'Python', 'FastAPI / Django', 'Java (Spring)', 'Golang', 'REST API']
  },
  {
    category: 'Cơ Sở Dữ Liệu & Data Layer',
    skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Prisma', 'Firebase / Firestore']
  },
  {
    category: 'Lập Trình Mobile & AI Specialist',
    skills: ['Flutter', 'React Native', 'Kotlin', 'Swift', 'Gemini API / OpenAI', 'PyTorch / TensorFlow']
  }
];

export const CS_SKILL_CATEGORIES = [
  {
    category: 'Kỹ Năng Tư Vấn & Chăm Sóc Khách Hàng',
    skills: ['Tư Vấn Đồ Án', 'Chăm Sóc Khách Hàng', 'Xử Lý Khiếu Nại', 'Giữ Chân Khách Hàng', 'Tư Vấn Báo Giá']
  },
  {
    category: 'Công Cụ & Kênh Tương Tác',
    skills: ['Zalo OA', 'Facebook Fanpage CRM', 'LiveChat / Hotline', 'Call Center', 'Google Workspace']
  }
];

export const ACCOUNTING_SKILL_CATEGORIES = [
  {
    category: 'Nghiệp Vụ Tài Chính & Kế Toán',
    skills: ['Báo Cáo Tài Chính', 'Kế Toán Thuế', 'Xuất Hóa Đơn VAT', 'Đối Soát Thù Lao', 'Kiểm Soát Thu Chi']
  },
  {
    category: 'Phần Mềm & Công Cụ Kế Toán',
    skills: ['MISA', 'Fast Accounting', 'Excel Kế Toán Advanced', 'Google Sheets Finance']
  }
];

export const HR_SKILL_CATEGORIES = [
  {
    category: 'Nghiệp Vụ Tuyển Dụng & Quản Lý Nhân Sự',
    skills: ['Tuyển Dụng IT', 'Sàng Lọc Hồ Sơ', 'Quản Lý Hợp Đồng', 'Đánh Giá KPI', 'Văn Hóa Doanh Nghiệp', 'Đào Tạo Onboarding']
  },
  {
    category: 'Công Cụ HR & Quản Lý Hệ Thống',
    skills: ['Google Workspace HR', 'Excel Nhân Sự', 'Zalo Group Internal', 'Phần Mềm LUBPY HR', 'Bảo Mật Hồ Sơ']
  }
];

export const PRESET_SKILL_CATEGORIES = TECH_SKILL_CATEGORIES;

export const getNextStaffId = (dept: string, devList: HRDeveloper[]) => {
  let prefix = 'DEV-';
  if (dept === 'Nghiệp vụ Chăm Sóc Khách Hàng') prefix = 'CS-';
  else if (dept === 'Nghiệp vụ Kế Toán & Tài Chính') prefix = 'ACC-';
  else if (dept === 'Nghiệp vụ Quản Lý Nhân Sự (HR)') prefix = 'HR-';

  const matchingNums = devList
    .map(d => d.id)
    .filter(id => id && id.startsWith(prefix))
    .map(id => parseInt(id.replace(prefix, ''), 10))
    .filter(num => !isNaN(num));

  const maxNum = matchingNums.length > 0 ? Math.max(...matchingNums) : 0;
  const nextNum = maxNum + 1;
  return `${prefix}${nextNum < 10 ? '0' : ''}${nextNum}`;
};

export const countHRSubordinates = (devList: HRDeveloper[], currentEditingId?: string) => {
  return devList.filter(d => {
    if (currentEditingId && d.id === currentEditingId) return false;
    const isHRDept = d.department === 'Nghiệp vụ Quản Lý Nhân Sự (HR)' || (d.department || '').toLowerCase().includes('nhân sự') || (d.department || '').toLowerCase().includes('hr');
    const isSubordinate = d.level === 'Nhân Viên / Chuyên Viên' || !d.level;
    return isHRDept && isSubordinate;
  }).length;
};

export interface HRDeveloper {
  id: string; // e.g. DEV-01
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string; // Ảnh đại diện
  dob?: string; // Ngày tháng năm sinh (YYYY-MM-DD)
  password?: string; // Mật khẩu
  department?: 'Nghiệp vụ Kỹ Thuật' | 'Nghiệp vụ Chăm Sóc Khách Hàng' | 'Nghiệp vụ Kế Toán & Tài Chính' | string;
  level?: 'Quản Lý / Trưởng Nhóm' | 'Nhân Viên / Chuyên Viên' | string;
  title: string; // e.g. Fullstack Lead Dev, AI Specialist
  skills: string[]; // e.g. ['React', 'Python', 'Node.js']
  projectCount: number;
  rating: number; // e.g. 5.0
  payoutRate?: number; // e.g. 65% (legacy)
  salaryRange?: string; // e.g. "5.000.000 VND - 7.000.000 VND"
  totalPayoutEarned: number; // VNĐ
  status: 'free' | 'busy' | 'overloaded' | 'inactive';
  joinedDate: string;
  projectsHistory?: Array<{
    id: string;
    projectName: string;
    clientName: string;
    payoutAmount: number;
    completedDate: string;
    status: 'completed' | 'in_progress';
  }>;
}

interface HRDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onSwitchToSystemManager?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export default function HRDashboard({ user, onLogout, language, onSwitchToSystemManager, onUpdateUser }: HRDashboardProps) {
  // Current user state
  const [currentUser, setCurrentUser] = useState<User>(user);
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Load Developers from localStorage, default to empty array [] as requested
  const [developers, setDevelopers] = useState<HRDeveloper[]>(() => {
    const saved = localStorage.getItem('lubpy_hr_developers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('lubpy_hr_developers', JSON.stringify(developers));
  }, [developers]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'busy' | 'overloaded' | 'inactive'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDev, setEditingDev] = useState<HRDeveloper | null>(null);
  const [historyDev, setHistoryDev] = useState<HRDeveloper | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [orgData] = useState(() => getStoredOrganization());

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Form Fields State for Add/Edit Developer
  const [formDevId, setFormDevId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDepartment, setFormDepartment] = useState<string>('Nghiệp vụ Kỹ Thuật');
  const [formLevel, setFormLevel] = useState<string>('Nhân Viên / Chuyên Viên');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formTitle, setFormTitle] = useState('Fullstack Lead Dev');
  const [formSkillsInput, setFormSkillsInput] = useState('React, Node.js, Python, PostgreSQL');
  const [formProjectCount, setFormProjectCount] = useState(0);
  const [formRating, setFormRating] = useState(5.0);
  const [formPayoutRate, setFormPayoutRate] = useState(65);
  const [formSalaryRange, setFormSalaryRange] = useState<string>('5.000.000 VND - 7.000.000 VND');
  const [formTotalPayout, setFormTotalPayout] = useState(0);
  const [formStatus, setFormStatus] = useState<'free' | 'busy' | 'overloaded' | 'inactive'>('free');

  // Permission checks
  const isHRManager = 
    currentUser.role === 'admin' || 
    currentUser.isDepartmentHead || 
    currentUser.role !== 'hr' || 
    (currentUser.departmentTitle || '').toLowerCase().includes('trưởng') || 
    (currentUser.departmentTitle || '').toLowerCase().includes('lead') || 
    (currentUser.departmentTitle || '').toLowerCase().includes('manager');

  // HR Subordinate Quota count
  const hrSubordinateCount = countHRSubordinates(developers, editingDev ? editingDev.id : undefined);
  const isHRStaffQuotaReached = 
    formDepartment === 'Nghiệp vụ Quản Lý Nhân Sự (HR)' && 
    formLevel === 'Nhân Viên / Chuyên Viên' && 
    hrSubordinateCount >= 5;

  // Notifications Calculation
  const { visibleNotifs } = getVisibleNotificationsForUser(currentUser, orgData.heads);
  const userEmail = (currentUser?.email || '').toLowerCase();
  const unreadNotifCount = visibleNotifs.filter(n => !n.readBy || !n.readBy.some(e => (e || '').toLowerCase() === userEmail)).length;

  // New Project entry for History Modal
  const [newHistProjectName, setNewHistProjectName] = useState('');
  const [newHistClientName, setNewHistClientName] = useState('');
  const [newHistPayoutAmount, setNewHistPayoutAmount] = useState<number>(3500000);

  const openAddModal = () => {
    const defaultDept = 'Nghiệp vụ Kỹ Thuật';
    const nextId = getNextStaffId(defaultDept, developers);
    setFormDevId(nextId);
    setFormName('');
    setFormDepartment(defaultDept);
    setFormLevel('Nhân Viên / Chuyên Viên');
    setFormPhone('');
    setFormEmail('');
    setFormAvatarUrl('');
    setFormDob('');
    setFormPassword('');
    setShowFormPassword(false);
    setFormTitle('Fullstack Lead Dev');
    setFormSkillsInput('React, Node.js, Python');
    setFormProjectCount(0);
    setFormRating(5.0);
    setFormPayoutRate(65);
    setFormSalaryRange('5.000.000 VND - 7.000.000 VND');
    setFormTotalPayout(0);
    setFormStatus('free');
    setEditingDev(null);
    setShowAddModal(true);
  };

  const openEditModal = (dev: HRDeveloper) => {
    setEditingDev(dev);
    setFormDevId(dev.id);
    setFormName(dev.name);
    setFormDepartment(dev.department || 'Nghiệp vụ Kỹ Thuật');
    setFormLevel(dev.level || 'Nhân Viên / Chuyên Viên');
    setFormPhone(dev.phone);
    setFormEmail(dev.email);
    setFormAvatarUrl(dev.avatarUrl || '');
    setFormDob(dev.dob || '');
    setFormPassword(dev.password || '');
    setShowFormPassword(false);
    setFormTitle(dev.title);
    setFormSkillsInput(dev.skills.join(', '));
    setFormProjectCount(dev.projectCount);
    setFormRating(dev.rating);
    setFormPayoutRate(dev.payoutRate || 65);
    setFormSalaryRange(dev.salaryRange || '5.000.000 VND - 7.000.000 VND');
    setFormTotalPayout(dev.totalPayoutEarned || 0);
    setFormStatus(dev.status);
    setShowAddModal(true);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processSaveDeveloper = (): boolean => {
    if (!formName.trim() || !formEmail.trim()) {
      alert('Vui lòng điền đầy đủ Họ tên và Email nhân sự!');
      return false;
    }

    if (isHRStaffQuotaReached) {
      alert('⚠️ Đã đạt giới hạn tối đa 5 Nhân viên HR cấp dưới hỗ trợ quản lý! Không thể tạo thêm người thứ 6.');
      return false;
    }

    if (!isHRManager && formLevel === 'Quản Lý / Trưởng Nhóm') {
      alert('🚫 Tài khoản Nhân viên HR cấp dưới không có thẩm quyền phân quyền Quản Lý / Trưởng Nhóm!');
      return false;
    }

    const rawSkills = formSkillsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const parsedSkills: string[] = [];
    for (const sk of rawSkills) {
      if (!parsedSkills.some(existing => existing.toLowerCase() === sk.toLowerCase())) {
        parsedSkills.push(sk);
      }
    }

    let autoStatus = formStatus;
    if (formProjectCount === 0 && formStatus !== 'inactive') autoStatus = 'free';
    else if (formProjectCount >= 1 && formProjectCount <= 2 && formStatus !== 'inactive') autoStatus = 'busy';
    else if (formProjectCount >= 3 && formStatus !== 'inactive') autoStatus = 'overloaded';

    const assignedDevId = formDevId.trim() || getNextStaffId(formDepartment, developers);

    if (editingDev) {
      const updatedDevObj: HRDeveloper = {
        ...editingDev,
        id: assignedDevId,
        name: formName.trim(),
        department: formDepartment,
        level: formLevel,
        phone: formPhone.trim(),
        email: formEmail.trim(),
        avatarUrl: formAvatarUrl.trim(),
        dob: formDob,
        password: formPassword.trim(),
        title: formTitle,
        skills: parsedSkills.length > 0 ? parsedSkills : ['Fullstack'],
        projectCount: Number(formProjectCount),
        rating: Number(formRating),
        payoutRate: Number(formPayoutRate) || 65,
        salaryRange: formSalaryRange,
        totalPayoutEarned: Number(formTotalPayout),
        status: autoStatus
      };
      const updatedList = developers.map(d => d.id === editingDev.id ? updatedDevObj : d);
      setDevelopers(updatedList);
      triggerToast(`✏️ Đã cập nhật hồ sơ nhân sự ${formName} (${assignedDevId}) thành công!`);
    } else {
      const newDevObj: HRDeveloper = {
        id: assignedDevId,
        name: formName.trim(),
        department: formDepartment,
        level: formLevel,
        phone: formPhone.trim() || '0900000000',
        email: (formEmail.trim() || normalizeNameToEmail(formName.trim())).toLowerCase(),
        avatarUrl: formAvatarUrl.trim(),
        dob: formDob,
        password: formPassword.trim(),
        title: formTitle,
        skills: parsedSkills.length > 0 ? parsedSkills : ['Fullstack'],
        projectCount: Number(formProjectCount),
        rating: Number(formRating),
        payoutRate: Number(formPayoutRate) || 65,
        salaryRange: formSalaryRange,
        totalPayoutEarned: Number(formTotalPayout),
        status: autoStatus,
        joinedDate: new Date().toLocaleDateString('vi-VN'),
        projectsHistory: []
      };
      setDevelopers([newDevObj, ...developers]);
      triggerToast(`✨ Đã thêm nhân sự ${formName} (${assignedDevId}) vào hệ thống!`);
    }

    // Sync to lubpy_users for authentication
    try {
      const savedUsersRaw = localStorage.getItem('lubpy_users');
      let usersList: User[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
      
      let syncedRole: UserRole = 'tech';
      if (formDepartment === 'Nghiệp vụ Chăm Sóc Khách Hàng') syncedRole = 'cs';
      else if (formDepartment === 'Nghiệp vụ Kế Toán & Tài Chính') syncedRole = 'accounting';
      else if (formDepartment === 'Nghiệp vụ Quản Lý Nhân Sự (HR)') syncedRole = 'hr';

      const isHead = formLevel === 'Quản Lý / Trưởng Nhóm';
      const cleanEmail = (formEmail.trim() || normalizeNameToEmail(formName.trim())).toLowerCase();

      const userObj: User = {
        uid: `staff_${Date.now()}`,
        name: formName.trim(),
        email: cleanEmail,
        photoUrl: formAvatarUrl.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formEmail)}&backgroundColor=0f172a`,
        role: syncedRole,
        isDepartmentHead: isHead,
        department: formDepartment,
        departmentTitle: formTitle || 'Chuyên Viên',
        password: formPassword.trim() || '123456',
        createdByAdmin: true
      };
      const existingIdx = usersList.findIndex(u => u.email.toLowerCase() === formEmail.trim().toLowerCase());
      if (existingIdx >= 0) {
        usersList[existingIdx] = { ...usersList[existingIdx], ...userObj };
      } else {
        usersList.push(userObj);
      }
      localStorage.setItem('lubpy_users', JSON.stringify(usersList));
      window.dispatchEvent(new Event('lubpy_users_updated'));
    } catch (e) {
      console.error('Failed to sync dev account to lubpy_users:', e);
    }

    return true;
  };

  const handleSaveDeveloperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = processSaveDeveloper();
    if (ok) {
      setShowAddModal(false);
    }
  };

  const handleSaveAndNextSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    const ok = processSaveDeveloper();
    if (ok) {
      setEditingDev(null);
      setFormName('');
      setFormPhone('');
      setFormEmail('');
      setFormAvatarUrl('');
      setFormDob('');
      setFormPassword('');
      setShowFormPassword(false);
      
      // Auto increment ID for next entry
      setTimeout(() => {
        setDevelopers(latestDevs => {
          const nextId = getNextStaffId(formDepartment, latestDevs);
          setFormDevId(nextId);
          return latestDevs;
        });
      }, 50);
    }
  };

  const handleDeleteDeveloper = (id: string, name: string) => {
    if (!isHRManager) {
      alert('🚫 Tài khoản Nhân viên HR cấp dưới không có thẩm quyền xóa nhân sự!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa nhân sự "${name}" (${id}) khỏi hệ thống?`)) {
      setDevelopers(developers.filter(d => d.id !== id));
      triggerToast(`🗑️ Đã xóa nhân sự ${name} khỏi hệ thống.`);
    }
  };

  const handleAddProjectHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyDev || !newHistProjectName.trim()) return;

    const newPrj = {
      id: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      projectName: newHistProjectName.trim(),
      clientName: newHistClientName.trim() || 'Sinh viên CNTT',
      payoutAmount: Number(newHistPayoutAmount) || 0,
      completedDate: new Date().toLocaleDateString('vi-VN'),
      status: 'completed' as const
    };

    const updatedDevs = developers.map(d => {
      if (d.id === historyDev.id) {
        const history = d.projectsHistory || [];
        const updatedHistory = [newPrj, ...history];
        const newTotalPayout = (d.totalPayoutEarned || 0) + newPrj.payoutAmount;
        const newProjectCount = d.projectCount + 1;
        return {
          ...d,
          projectCount: newProjectCount,
          totalPayoutEarned: newTotalPayout,
          projectsHistory: updatedHistory,
          status: newProjectCount >= 3 ? ('overloaded' as const) : ('busy' as const)
        };
      }
      return d;
    });

    setDevelopers(updatedDevs);
    const updatedDev = updatedDevs.find(d => d.id === historyDev.id);
    if (updatedDev) setHistoryDev(updatedDev);

    setNewHistProjectName('');
    setNewHistClientName('');
    setNewHistPayoutAmount(3500000);
    triggerToast(`📊 Đã ghi nhận đồ án bàn giao cho kỹ sư ${historyDev.name}!`);
  };

  // Filtered developers list
  const filteredDevs = developers.filter(dev => {
    const matchesSearch = 
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dev.department && dev.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (dev.level && dev.level.toLowerCase().includes(searchTerm.toLowerCase())) ||
      dev.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || dev.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || dev.department === departmentFilter || (!dev.department && departmentFilter === 'Nghiệp vụ Kỹ Thuật');
    const matchesLevel = levelFilter === 'all' || dev.level === levelFilter || (!dev.level && levelFilter === 'Nhân Viên / Chuyên Viên');

    return matchesSearch && matchesStatus && matchesDept && matchesLevel;
  });

  // Calculate Core Metrics filtered by department selection
  const deptFilteredDevs = developers.filter(d => 
    departmentFilter === 'all' || 
    d.department === departmentFilter || 
    (!d.department && departmentFilter === 'Nghiệp vụ Kỹ Thuật')
  );

  const totalDevs = deptFilteredDevs.length;
  const freeDevs = deptFilteredDevs.filter(d => d.status === 'free').length;
  const busyOrOverloadedDevs = deptFilteredDevs.filter(d => d.status === 'busy' || d.status === 'overloaded' || d.projectCount >= 2).length;
  const totalPayoutAll = deptFilteredDevs.reduce((sum, d) => sum + (d.totalPayoutEarned || 0), 0);

  const formatVND = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <div className="min-h-screen bg-[#0d0e10] text-gray-100 font-sans p-4 sm:p-6 lg:p-8" id="hr-dashboard-dark-root">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[200] bg-slate-900 border-2 border-emerald-500/80 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER CARD (Sync Dark Theme #121316) */}
      <div className="bg-[#121316] border border-[#232630] rounded-2xl p-5 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-black tracking-tight text-lg shadow-lg">
            HR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>Trang Quản Lý Nhân Sự</span>
                <span className="text-amber-400 font-sans font-bold text-xs bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  LUBPY STUDIO
                </span>
              </h1>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Hệ thống quản lý đội ngũ Kỹ sư, Freelancers & Điều phối thù lao lập trình (65%)
            </p>
          </div>
        </div>

          <div className="flex items-center gap-3">
            {/* User Profile Card Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#181a20] hover:bg-[#20232c] border border-[#232630] hover:border-amber-500/40 rounded-xl transition-all cursor-pointer group text-left"
              title="Cập nhật hồ sơ cá nhân (Họ tên, SĐT, Avatar, Ngày sinh, Mật khẩu)"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center overflow-hidden shrink-0 shadow">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <Edit2 className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 inline-block">
                  Quản Lý HR
                </div>
              </div>
            </button>

            {/* Notification Mailbox */}
            <button 
              onClick={() => setShowNotifModal(true)}
              className="p-2.5 bg-[#181a20] hover:bg-[#20232c] text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer relative group border border-[#232630]"
              title="Hộp thư thông báo chỉ đạo nội bộ"
            >
              <Mail className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              {unreadNotifCount > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full shadow animate-pulse">
                  {unreadNotifCount}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full" />
              )}
            </button>

            {onSwitchToSystemManager && (
              <button
                onClick={onSwitchToSystemManager}
                className="px-3.5 py-2 bg-[#181a20] hover:bg-[#232630] border border-sky-500/30 text-sky-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Chuyển sang Bảng Quản Lý Hệ Thống LUBPY Studio"
              >
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>LUBPY Manager</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
      </div>

      {/* 1. TOP STAT CARDS (4 CARDS Core Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* Stat 1: Total Personnel */}
        <div className="bg-[#121316] border border-[#232630] rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                TỔNG NHÂN SỰ TẤT CẢ NGHIỆP VỤ
              </span>
              <div className="text-3xl font-black text-white font-mono">{totalDevs}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span>Tổng nhân sự theo bộ phận đã chọn</span>
          </p>
        </div>

        {/* Stat 2: Idle Staff */}
        <div className="bg-[#121316] border border-[#232630] rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                NHÂN VIÊN ĐANG RẢNH
              </span>
              <div className="text-3xl font-black text-emerald-400 font-mono">{freeDevs}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Sẵn sàng nhận nhiệm vụ / đồ án mới</span>
          </p>
        </div>

        {/* Stat 3: Busy/Overloaded Staff */}
        <div className="bg-[#121316] border border-[#232630] rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                NHÂN VIÊN ĐANG BẬN / QUÁ TẢI
              </span>
              <div className="text-3xl font-black text-amber-400 font-mono">{busyOrOverloadedDevs}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Đang gánh công việc / đồ án</span>
          </p>
        </div>

        {/* Stat 4: Total Salary / Payout */}
        <div className="bg-[#121316] border border-[#232630] rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                TỔNG LƯƠNG / THÙ LAO TẤT CẢ BỘ PHẬN
              </span>
              <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono">{formatVND(totalPayoutAll)}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>Tính tự động theo tổng lương / thù lao</span>
          </p>
        </div>

      </div>

      {/* 2. DEVS DIRECTORY CONTAINER */}
      <div className="bg-[#121316] border border-[#232630] rounded-2xl p-6 shadow-2xl space-y-6">
        
        {/* Section Title & Add Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#232630] pb-5">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-400" />
              <span>Danh Sách Quản Lý Nhân Sự Tất Cả Nghiệp Vụ</span>
            </h2>
            <p className="text-xs text-gray-400 font-light mt-0.5">
              Danh bạ cán bộ &amp; cộng tác viên thuộc các bộ phận Kỹ Thuật, CSKH, Kế Toán, cấp bậc và chuyên môn trực thuộc
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ THÊM NHÂN SỰ / CỘNG TÁC VIÊN MỚI</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input 
              type="text"
              placeholder="Tìm theo Mã NV, Tên Kỹ sư, Email, Chức danh, Bộ phận hoặc Công nghệ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#181a20] border border-[#232630] text-xs text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-[#181a20] border border-[#232630] text-xs text-gray-200 px-2.5 py-2.5 rounded-xl font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="all">🏢 Tất Cả Bộ Phận</option>
              <option value="Nghiệp vụ Kỹ Thuật">💻 NV Kỹ Thuật</option>
              <option value="Nghiệp vụ Chăm Sóc Khách Hàng">🎧 NV Chăm Sóc KH</option>
              <option value="Nghiệp vụ Kế Toán & Tài Chính">📊 NV Kế Toán &amp; Tài Chính</option>
              <option value="Nghiệp vụ Quản Lý Nhân Sự (HR)">🏢 NV Quản Lý Nhân Sự (HR)</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full bg-[#181a20] border border-[#232630] text-xs text-gray-200 px-2 py-2.5 rounded-xl font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="all">👑 Tất Cả Cấp Bậc</option>
              <option value="Quản Lý / Trưởng Nhóm">👑 Quản Lý / Trưởng Nhóm</option>
              <option value="Nhân Viên / Chuyên Viên">👤 Nhân Viên / Chuyên Viên</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#181a20] border border-[#232630] text-xs text-gray-200 px-2 py-2.5 rounded-xl font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="all">🌐 Tất Cả Trạng Thái</option>
              <option value="free">🟢 Đang Rảnh</option>
              <option value="busy">🟡 Đang Nhận Đồ Án</option>
              <option value="overloaded">🔴 Quá Tải (&gt;=3)</option>
              <option value="inactive">⚪ Tạm Ngưng</option>
            </select>
          </div>
        </div>

        {/* TABLE OR EMPTY STATE */}
        {filteredDevs.length === 0 ? (
          <div className="py-16 text-center bg-[#181a20]/60 border border-dashed border-[#232630] rounded-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Code2 className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-white">Chưa Có Dữ Liệu Nhân Sự Khớp Với Bộ Lọc</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' || levelFilter !== 'all'
                  ? 'Không tìm thấy nhân sự nào khớp với bộ lọc tìm kiếm của bạn.' 
                  : 'Hệ thống chưa ghi nhận nhân sự nào. Hãy bấm nút phía dưới để bổ sung nhân sự mới.'}
              </p>
            </div>
            {(!searchTerm && statusFilter === 'all' && departmentFilter === 'all' && levelFilter === 'all') && (
              <button
                onClick={openAddModal}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Thêm Nhân Sự Đầu Tiên</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#232630]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181a20] text-gray-400 uppercase font-mono tracking-wider border-b border-[#232630]">
                <tr>
                  <th className="py-3.5 px-4">Mã NV / Dev ID</th>
                  <th className="py-3.5 px-4">Họ & Tên Nhân Sự</th>
                  <th className="py-3.5 px-4">Bộ Phận & Cấp Bậc</th>
                  <th className="py-3.5 px-4">Vị Trí / Chức Danh</th>
                  <th className="py-3.5 px-4">Skill Stack / Công Nghệ</th>
                  <th className="py-3.5 px-4 text-center">Đồ Án Gánh</th>
                  <th className="py-3.5 px-4 text-center">Đánh Giá</th>
                  <th className="py-3.5 px-4 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232630] text-gray-300">
                {filteredDevs.map((dev) => {
                  const isOverloaded = dev.projectCount >= 3;
                  return (
                    <tr key={dev.id} className="hover:bg-[#181a20]/80 transition-colors group">
                      {/* ID */}
                      <td className="py-4 px-4 font-mono font-bold text-amber-400">
                        {dev.id}
                      </td>

                      {/* Name & Contact */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 text-white flex items-center justify-center font-black text-xs shadow overflow-hidden shrink-0">
                            {dev.avatarUrl ? (
                              <img src={dev.avatarUrl} alt={dev.name} className="w-full h-full object-cover" />
                            ) : (
                              dev.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                              <span>{dev.name}</span>
                              {dev.dob && (
                                <span className="text-[10px] font-normal text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {dev.dob}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2 flex-wrap mt-0.5">
                              <span>{dev.email}</span>
                              <span className="text-gray-600">•</span>
                              <span className="flex items-center gap-0.5 text-gray-300">
                                <Phone className="w-3 h-3 text-sky-400" />
                                {dev.phone}
                              </span>
                              {dev.password && (
                                <>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Đã bảo mật</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Level Badges */}
                      <td className="py-4 px-4 space-y-1">
                        <div>
                          {(!dev.department || dev.department === 'Nghiệp vụ Kỹ Thuật') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              <Code2 className="w-3 h-3" />
                              <span>Nghiệp vụ Kỹ Thuật</span>
                            </span>
                          )}
                          {dev.department === 'Nghiệp vụ Chăm Sóc Khách Hàng' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                              <Users className="w-3 h-3" />
                              <span>NV Chăm Sóc KH</span>
                            </span>
                          )}
                          {dev.department === 'Nghiệp vụ Kế Toán & Tài Chính' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                              <DollarSign className="w-3 h-3" />
                              <span>NV Kế Toán &amp; Tài Chính</span>
                            </span>
                          )}
                        </div>

                        <div>
                          {dev.level === 'Quản Lý / Trưởng Nhóm' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black shadow-sm">
                              <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>Quản Lý / Trưởng Nhóm</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-sky-500/30 text-[10px] font-semibold">
                              <UserCheck className="w-3 h-3 text-sky-400" />
                              <span>Nhân Viên / Chuyên Viên</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-200 block">
                          {dev.title}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                          Mức lương: {dev.salaryRange || '5.000.000 VND - 7.000.000 VND'}
                        </span>
                      </td>

                      {/* Skill Stack Badges */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {dev.skills.map((skill, idx) => (
                            <span 
                              key={`${skill}_${idx}`}
                              className="text-[10px] font-mono font-bold bg-slate-800/90 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Projects Assigned Count */}
                      <td className="py-4 px-4 text-center">
                        {isOverloaded ? (
                          <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span>{dev.projectCount} Đồ án (Quá Tải)</span>
                          </span>
                        ) : dev.projectCount > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <span>{dev.projectCount} Đồ án</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <span>0 (Đang Rảnh)</span>
                          </span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-amber-400 font-bold font-mono">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{(dev?.rating ?? 0).toFixed(1)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(dev)}
                            className="p-2 bg-[#181a20] hover:bg-amber-500/20 text-gray-300 hover:text-amber-400 border border-[#232630] hover:border-amber-500/40 rounded-xl transition-colors cursor-pointer"
                            title="Sửa thông tin kỹ sư"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setHistoryDev(dev)}
                            className="px-2.5 py-1.5 bg-[#181a20] hover:bg-sky-500/20 text-sky-400 border border-[#232630] hover:border-sky-500/40 rounded-xl transition-colors text-[10px] font-bold cursor-pointer flex items-center gap-1"
                            title="Lịch sử đồ án đảm nhận"
                          >
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>Lịch Sử</span>
                          </button>

                          <button
                            onClick={() => handleDeleteDeveloper(dev.id, dev.name)}
                            className="p-2 bg-[#181a20] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-[#232630] hover:border-red-500/40 rounded-xl transition-colors cursor-pointer"
                            title="Xóa kỹ sư"
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
        )}

      </div>

      {/* MODAL 1: ADD / EDIT DEVELOPER FORM */}
      {showAddModal && (
        <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveDeveloperSubmit}
            className="bg-[#121316] border border-[#232630] w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-5 animate-fadeIn text-white max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#232630] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Code2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black uppercase">
                  {editingDev ? `Sửa Hồ Sơ Nhân Sự (${editingDev.id})` : '+ THÊM NHÂN SỰ / CỘNG TÁC VIÊN MỚI'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Mã NV / Dev ID:
                </label>
                <input 
                  type="text"
                  required
                  value={formDevId}
                  onChange={(e) => setFormDevId(e.target.value)}
                  className="w-full bg-[#181a20] border border-[#232630] text-xs text-amber-400 font-mono font-bold px-3 py-2 rounded-xl focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Họ &amp; Tên Nhân Sự <span className="text-amber-400">*</span>:
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Vd: Nguyễn Văn A"
                  value={formName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormName(newName);
                    const autoEmail = normalizeNameToEmail(newName);
                    if (autoEmail) {
                      setFormEmail(autoEmail);
                    }
                  }}
                  className="w-full bg-[#181a20] border border-[#232630] text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Số Điện Thoại / Zalo:
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text"
                    placeholder="Vd: 0912345678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">
                    Email Liên Hệ (@lubpystudio.vn) <span className="text-amber-400">*</span>:
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">⚡ @lubpystudio.vn</span>
                </div>
                <input 
                  type="email"
                  required
                  placeholder="nguyenvana@lubpystudio.vn"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-[#181a20] border border-[#232630] text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500 font-mono"
                />
                {formName.trim() && (
                  <p className="text-[10px] text-emerald-400 font-mono mt-1">
                    ✓ Email chuẩn hóa: <span className="text-white font-bold">{formEmail || normalizeNameToEmail(formName)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Ngày Tháng Năm Sinh:
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5" />
                  <input 
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] text-xs text-amber-300 font-mono pl-9 pr-3 py-2 rounded-xl focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Mật Khẩu Tài Khoản Nhân Sự:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-2.5" />
                  <input 
                    type={showFormPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới..."
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-[#181a20] border border-[#232630] text-xs text-emerald-300 font-mono pl-9 pr-9 py-2 rounded-xl focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Department Field */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Bộ Phận / Nghiệp Vụ Trực Thuộc *:
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5" />
                  <select
                    value={formDepartment}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setFormDepartment(newDept);
                      if (!editingDev) {
                        const nextId = getNextStaffId(newDept, developers);
                        setFormDevId(nextId);
                      }
                      if (newDept === 'Nghiệp vụ Chăm Sóc Khách Hàng') {
                        setFormTitle('Chuyên Viên Tư Vấn & Hỗ Trợ Đồ Án');
                        setFormSkillsInput('Tư Vấn Đồ Án, Chăm Sóc Khách Hàng, Zalo OA');
                      } else if (newDept === 'Nghiệp vụ Kế Toán & Tài Chính') {
                        setFormTitle('Chuyên Viên Đối Soát Thù Lao & Doanh Thu');
                        setFormSkillsInput('Báo Cáo Tài Chính, MISA, Kế Toán Thuế');
                      } else if (newDept === 'Nghiệp vụ Quản Lý Nhân Sự (HR)') {
                        setFormTitle(formLevel === 'Quản Lý / Trưởng Nhóm' ? 'Trưởng Phòng HR (HR Manager)' : 'Chuyên Viên Tuyển Dụng (Recruiter)');
                        setFormSkillsInput('Tuyển Dụng IT, Sàng Lọc Hồ Sơ, Quản Lý Hợp Đồng');
                      } else {
                        setFormTitle('Fullstack Lead Dev');
                        setFormSkillsInput('React, Node.js, Python, PostgreSQL');
                      }
                    }}
                    className="w-full bg-[#181a20] border border-[#232630] text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:border-amber-500 cursor-pointer font-bold"
                  >
                    <option value="Nghiệp vụ Kỹ Thuật">💻 Nghiệp vụ Kỹ Thuật (Tech & Development)</option>
                    <option value="Nghiệp vụ Chăm Sóc Khách Hàng">🎧 Nghiệp vụ Chăm Sóc Khách Hàng (Customer Support)</option>
                    <option value="Nghiệp vụ Kế Toán & Tài Chính">📊 Nghiệp vụ Kế Toán & Tài Chính (Accounting & Finance)</option>
                    <option value="Nghiệp vụ Quản Lý Nhân Sự (HR)">🏢 Nghiệp vụ Quản Lý Nhân Sự (HR)</option>
                  </select>
                </div>
              </div>

              {/* Quota warning banner if HR Subordinate quota reached */}
              {formDepartment === 'Nghiệp vụ Quản Lý Nhân Sự (HR)' && formLevel === 'Nhân Viên / Chuyên Viên' && (
                <div className="col-span-1 sm:col-span-2">
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    isHRStaffQuotaReached 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        {isHRStaffQuotaReached 
                          ? '⚠️ Đã đạt giới hạn tối đa 5 Nhân viên HR cấp dưới hỗ trợ quản lý!' 
                          : `Sức chứa Nhân viên HR cấp dưới: ${hrSubordinateCount}/5 nhân viên`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40">
                      {hrSubordinateCount}/5 HR Staff
                    </span>
                  </div>
                </div>
              )}

              {/* Seniority Level Field */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Cấp Bậc Nhân Sự *:
                </label>
                <div className="relative">
                  <Crown className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5" />
                  <select
                    value={formLevel}
                    onChange={(e) => {
                      const newLvl = e.target.value;
                      if (!isHRManager && newLvl === 'Quản Lý / Trưởng Nhóm') {
                        alert('🚫 Tài khoản Nhân viên HR không thể nâng cấp tài khoản lên Quản Lý / Trưởng Nhóm!');
                        return;
                      }
                      setFormLevel(newLvl);
                      if (formDepartment === 'Nghiệp vụ Quản Lý Nhân Sự (HR)') {
                        setFormTitle(newLvl === 'Quản Lý / Trưởng Nhóm' ? 'Trưởng Phòng HR (HR Manager)' : 'Chuyên Viên Tuyển Dụng (Recruiter)');
                      }
                    }}
                    className="w-full bg-[#181a20] border border-[#232630] text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:border-amber-500 cursor-pointer font-bold"
                  >
                    <option value="Quản Lý / Trưởng Nhóm">👑 Quản Lý / Trưởng Nhóm Nghiệp Vụ (Team Leader / Supervisor)</option>
                    <option value="Nhân Viên / Chuyên Viên">👤 Nhân Viên / Chuyên Viên Nghiệp Vụ (Staff / Engineer)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Chức Danh / Vị Trí Cụ Thể:
                </label>
                <select
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#181a20] border border-[#232630] text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500 cursor-pointer font-bold"
                >
                  {formDepartment === 'Nghiệp vụ Chăm Sóc Khách Hàng' ? (
                    <>
                      <option value="Trưởng Nhóm Chăm Sóc KH (CS Lead)">Trưởng Nhóm Chăm Sóc KH (CS Lead)</option>
                      <option value="Chuyên Viên Tư Vấn & Hỗ Trợ Đồ Án">Chuyên Viên Tư Vấn & Hỗ Trợ Đồ Án</option>
                      <option value="Chuyên Viên Tiếp Nhận Yêu Cầu & Khiếu Nại">Chuyên Viên Tiếp Nhận Yêu Cầu & Khiếu Nại</option>
                      <option value="Chuyên Viên CSKH Zalo OA & Fanpage">Chuyên Viên CSKH Zalo OA & Fanpage</option>
                    </>
                  ) : formDepartment === 'Nghiệp vụ Kế Toán & Tài Chính' ? (
                    <>
                      <option value="Kế Toán Trưởng / Manager">Kế Toán Trưởng / Manager</option>
                      <option value="Chuyên Viên Kế Toán Hóa Đơn & Thuế">Chuyên Viên Kế Toán Hóa Đơn & Thuế</option>
                      <option value="Chuyên Viên Đối Soát Thù Lao & Doanh Thu">Chuyên Viên Đối Soát Thù Lao & Doanh Thu</option>
                      <option value="Thủ Quỹ & Kiểm Soát Thu Chi">Thủ Quỹ & Kiểm Soát Thu Chi</option>
                    </>
                  ) : formDepartment === 'Nghiệp vụ Quản Lý Nhân Sự (HR)' ? (
                    <>
                      {formLevel === 'Quản Lý / Trưởng Nhóm' ? (
                        <>
                          <option value="Trưởng Phòng HR (HR Manager)">Trưởng Phòng HR (HR Manager)</option>
                          <option value="Lead Recruiter">Lead Recruiter</option>
                          <option value="Trưởng Nhóm C&B">Trưởng Nhóm C&B</option>
                        </>
                      ) : (
                        <>
                          <option value="Chuyên Viên Tuyển Dụng (Recruiter)">Chuyên Viên Tuyển Dụng (Recruiter)</option>
                          <option value="Chuyên Viên Quản Lý Hồ Sơ">Chuyên Viên Quản Lý Hồ Sơ</option>
                          <option value="HR Generalist">HR Generalist</option>
                          <option value="HR Assistant / Trợ Lý HR">HR Assistant / Trợ Lý HR</option>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <option value="Fullstack Lead Dev">Fullstack Lead Dev</option>
                      <option value="AI / Machine Learning Specialist">AI / Machine Learning Specialist</option>
                      <option value="Mobile App Developer (Flutter/RN)">Mobile App Developer (Flutter/RN)</option>
                      <option value="Backend Software Engineer">Backend Software Engineer</option>
                      <option value="Frontend UI/UX Specialist">Frontend UI/UX Specialist</option>
                      <option value="Data Engineer / Analytics">Data Engineer / Analytics</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Mức Lương / Thù Lao Hàng Tháng {!isHRManager && '(Chỉ Trưởng phòng)'}:
                </label>
                <select
                  disabled={!isHRManager}
                  value={formSalaryRange}
                  onChange={(e) => setFormSalaryRange(e.target.value)}
                  className={`w-full bg-[#181a20] border border-[#232630] text-xs text-emerald-400 font-mono font-bold px-3 py-2 rounded-xl focus:border-amber-500 ${
                    !isHRManager ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={!isHRManager ? 'Chỉ Trưởng phòng HR mới có quyền thay đổi khung lương' : ''}
                >
                  {SALARY_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Avatar URL & Upload Section */}
            <div className="bg-[#181a20] border border-[#232630] p-3.5 rounded-xl space-y-2">
              <label className="block text-[10px] font-bold text-amber-400 uppercase">
                Ảnh Đại Diện / Avatar Nhân Sự:
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#121316] border border-[#232630] flex items-center justify-center overflow-hidden shrink-0 shadow">
                  {formAvatarUrl ? (
                    <img src={formAvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input 
                    type="text"
                    placeholder="Dán link ảnh (https://...)"
                    value={formAvatarUrl}
                    onChange={(e) => setFormAvatarUrl(e.target.value)}
                    className="w-full bg-[#121316] border border-[#232630] text-xs text-sky-300 font-mono px-3 py-1.5 rounded-lg focus:border-amber-500"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-[#232630] hover:bg-[#2c303c] text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-all border border-white/10">
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>Tải ảnh lên</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarFileUpload} 
                        className="hidden" 
                      />
                    </label>
                    {formAvatarUrl && (
                      <button 
                        type="button"
                        onClick={() => setFormAvatarUrl('')}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">
                {formDepartment === 'Nghiệp vụ Chăm Sóc Khách Hàng'
                  ? 'Kỹ Năng & Chuyên Môn CSKH (Nhập hoặc chọn nhanh từ danh mục):'
                  : formDepartment === 'Nghiệp vụ Kế Toán & Tài Chính'
                  ? 'Nghiệp Vụ & Phần Mềm Kế Toán (Nhập hoặc chọn nhanh từ danh mục):'
                  : formDepartment === 'Nghiệp vụ Quản Lý Nhân Sự (HR)'
                  ? 'Kỹ Năng & Công Cụ Quản Lý Nhân Sự HR (Nhập hoặc chọn nhanh từ danh mục):'
                  : 'Skill Stack / Công Nghệ Chuyên Môn (Nhập hoặc chọn nhanh từ danh mục):'}
              </label>
              <input 
                type="text"
                placeholder={
                  formDepartment === 'Nghiệp vụ Chăm Sóc Khách Hàng'
                    ? 'Tư Vấn Đồ Án, Chăm Sóc KH, Xử Lý Khiếu Nại, Zalo OA, CRM'
                    : formDepartment === 'Nghiệp vụ Kế Toán & Tài Chính'
                    ? 'Báo Cáo Tài Chính, MISA, Kế Toán Thuế, Excel, Xuất Hóa Đơn'
                    : formDepartment === 'Nghiệp vụ Quản Lý Nhân Sự (HR)'
                    ? 'Tuyển Dụng IT, Sàng Lọc CV, Quản Lý Hợp Đồng, Onboarding, KPI'
                    : 'React, Node.js, Python, PostgreSQL, Flutter, Docker'
                }
                value={formSkillsInput}
                onChange={(e) => setFormSkillsInput(e.target.value)}
                className="w-full bg-[#181a20] border border-[#232630] text-xs text-sky-300 font-mono px-3 py-2 rounded-xl focus:border-amber-500"
              />

              {/* Categorized Quick Selector */}
              <div className="p-3 bg-[#121316] border border-[#232630] rounded-xl space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>💡 Chọn nhanh Kỹ năng theo Nghiệp vụ ({formDepartment}):</span>
                  <span className="text-[9px] text-gray-500 font-normal">Click để thêm/bỏ</span>
                </div>
                {(formDepartment === 'Nghiệp vụ Chăm Sóc Khách Hàng'
                  ? CS_SKILL_CATEGORIES
                  : formDepartment === 'Nghiệp vụ Kế Toán & Tài Chính'
                  ? ACCOUNTING_SKILL_CATEGORIES
                  : formDepartment === 'Nghiệp vụ Quản Lý Nhân Sự (HR)'
                  ? HR_SKILL_CATEGORIES
                  : TECH_SKILL_CATEGORIES
                ).map((cat, cIdx) => {
                  const activeSkills = formSkillsInput
                    .split(',')
                    .map(s => s.trim().toLowerCase())
                    .filter(Boolean);
                  return (
                    <div key={cat.category || cIdx} className="space-y-1">
                      <div className="text-[10px] font-semibold text-gray-300 font-mono">
                        • {cat.category}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-2">
                        {cat.skills.map((sk, sIdx) => {
                          const skClean = sk.trim().toLowerCase();
                          const isSelected = activeSkills.includes(skClean);
                          return (
                            <button
                              key={`${cat.category}_${sk}_${sIdx}`}
                              type="button"
                              onClick={() => {
                                const currentList = formSkillsInput
                                  .split(',')
                                  .map(s => s.trim())
                                  .filter(Boolean);
                                if (isSelected) {
                                  const newList = currentList.filter(
                                    s => s.trim().toLowerCase() !== skClean
                                  );
                                  setFormSkillsInput(newList.join(', '));
                                } else {
                                  if (!currentList.some(s => s.trim().toLowerCase() === skClean)) {
                                    currentList.push(sk);
                                  }
                                  setFormSkillsInput(currentList.join(', '));
                                }
                              }}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                                  : 'bg-[#1a1d24] text-gray-400 border-white/5 hover:border-gray-500 hover:text-gray-200'
                              }`}
                            >
                              <span>{sk}</span>
                              <span className="text-[9px] opacity-70">{isSelected ? '✓' : '+'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#232630]">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Số Đồ Án Đang Gánh:
                </label>
                <input 
                  type="number"
                  min="0"
                  max="10"
                  value={formProjectCount}
                  onChange={(e) => setFormProjectCount(Number(e.target.value))}
                  className="w-full bg-[#181a20] border border-[#232630] text-xs text-white font-mono font-bold px-3 py-2 rounded-xl focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Đánh Giá (Rating ⭐):
                </label>
                <input 
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={formRating}
                  onChange={(e) => setFormRating(Number(e.target.value))}
                  className="w-full bg-[#181a20] border border-[#232630] text-xs text-amber-400 font-mono font-bold px-3 py-2 rounded-xl focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Trạng Thái:
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-[#181a20] border border-[#232630] text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500 cursor-pointer font-bold"
                >
                  <option value="free">🟢 Đang Rảnh</option>
                  <option value="busy">🟡 Đang Bận (1-2 đồ án)</option>
                  <option value="overloaded">🔴 Quá Tải (&gt;=3 đồ án)</option>
                  <option value="inactive">⚪ Tạm Ngưng Nhận</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#232630]">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-[#181a20] hover:bg-[#20232c] text-gray-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Hủy
              </button>

              {!editingDev && (
                <button 
                  type="button"
                  onClick={handleSaveAndNextSubmit}
                  disabled={isHRStaffQuotaReached}
                  className={`w-full sm:w-auto px-4 py-2 bg-[#1f222e] hover:bg-[#282c3c] border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    isHRStaffQuotaReached ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>💾 Lưu &amp; Thêm Người Tiếp Theo</span>
                </button>
              )}

              <button 
                type="submit"
                disabled={isHRStaffQuotaReached}
                className={`w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer shadow-lg hover:brightness-110 transition-all ${
                  isHRStaffQuotaReached ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {editingDev ? 'Lưu Cập Nhật Hồ Sơ' : 'Lưu Nhân Sự Mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: PROJECT HISTORY MODAL */}
      {historyDev && (
        <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#232630] w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 animate-fadeIn text-white max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#232630] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase flex items-center gap-2">
                    <span>Lịch Sử Đồ Án Kỹ Sư: {historyDev.name}</span>
                    <span className="text-amber-400 font-mono text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      {historyDev.id}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    {historyDev.title} • Thù lao tích lũy: <span className="text-purple-400 font-mono font-bold">{formatVND(historyDev.totalPayoutEarned || 0)}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setHistoryDev(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Record New Completed Project Form */}
            <form onSubmit={handleAddProjectHistory} className="bg-[#181a20] border border-[#232630] p-4 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                + Ghi Nhận Đồ Án Mới Bàn Giao (Tính Thù Lao)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input 
                  type="text"
                  required
                  placeholder="Tên đồ án (Vd: Website E-Commerce AI)"
                  value={newHistProjectName}
                  onChange={(e) => setNewHistProjectName(e.target.value)}
                  className="bg-[#121316] border border-[#232630] text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500"
                />
                <input 
                  type="text"
                  placeholder="Tên Khách hàng / Sinh viên"
                  value={newHistClientName}
                  onChange={(e) => setNewHistClientName(e.target.value)}
                  className="bg-[#121316] border border-[#232630] text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500"
                />
                <div className="flex gap-2">
                  <input 
                    type="number"
                    step="100000"
                    placeholder="Thù lao (VNĐ)"
                    value={newHistPayoutAmount}
                    onChange={(e) => setNewHistPayoutAmount(Number(e.target.value))}
                    className="bg-[#121316] border border-[#232630] text-xs text-purple-400 font-mono font-bold px-3 py-2 rounded-xl focus:border-amber-500 w-full"
                  />
                  <button 
                    type="submit"
                    className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase rounded-xl shrink-0 cursor-pointer"
                  >
                    Ghi Nhận
                  </button>
                </div>
              </div>
            </form>

            {/* List of Projects History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Danh Sách Đồ Án Đã Đảm Nhận ({(historyDev.projectsHistory || []).length}):
              </h4>

              {(historyDev.projectsHistory || []).length === 0 ? (
                <div className="p-8 text-center bg-[#181a20]/40 rounded-xl text-gray-500 text-xs italic">
                  Chưa ghi nhận lịch sử đồ án nào cho kỹ sư này.
                </div>
              ) : (
                <div className="space-y-2">
                  {(historyDev.projectsHistory || []).map((prj) => (
                    <div 
                      key={prj.id}
                      className="p-3.5 bg-[#181a20] border border-[#232630] rounded-xl flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="text-amber-400 font-mono font-bold">{prj.id}</span>
                          <span>{prj.projectName}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                          Khách hàng: {prj.clientName} • Ngày hoàn thành: {prj.completedDate}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-purple-400 font-mono font-bold block">
                          +{formatVND(prj.payoutAmount)}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Đã Bàn Giao
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#232630] text-right">
              <button 
                onClick={() => setHistoryDev(null)}
                className="px-5 py-2 bg-[#181a20] hover:bg-[#20232c] text-white font-bold text-xs rounded-xl cursor-pointer"
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
          triggerToast('🎉 Cập nhật thông tin hồ sơ cá nhân thành công!');
        }}
        onTriggerToast={triggerToast}
      />

    </div>
  );
}
