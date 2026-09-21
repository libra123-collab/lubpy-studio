import React, { useState } from 'react';
import { User } from '../../types';
import { 
  getHRTechStaff, 
  getHRCSStaff, 
  getHRAccountingStaff, 
  getHRStaffMembers,
  TechSpecialist,
  CSSpecialist,
  AccountantStaff,
  HRSpecialist
} from '../../utils/staffSyncStore';
import { 
  Laptop as LaptopIcon, 
  HeartHandshake as HeartHandshakeIcon, 
  Briefcase as BriefcaseIcon, 
  Calculator as CalculatorIcon, 
  Crown as CrownIcon, 
  Users as UsersIcon, 
  Star as StarIcon, 
  Activity as ActivityIcon, 
  ChevronDown as ChevronDownIcon, 
  ChevronUp as ChevronUpIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Clock as ClockIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  AlertCircle as AlertCircleIcon, 
  Code2 as Code2Icon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Sparkles as SparklesIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  Edit3 as Edit3Icon,
  Lock as LockIcon,
  X as XIcon,
  Key as KeyIcon,
  ShieldCheck as ShieldCheckIcon,
  Calendar as CalendarIcon,
  UserPlus as UserPlusIcon,
  RefreshCw as RefreshCwIcon,
  Trash2 as Trash2Icon
} from 'lucide-react';
import { LubpyProjectItem } from '../AdminFintrixityDashboard';
import { dobTo8Digits, syncHeadAccountToAllStores, nameToLubpyEmail, normalizeNameToEmail } from '../../utils/authSyncHelper';
import { removeSavedAccountFromStorage } from '../../utils/savedAccounts';
import { saveOrganization } from '../../utils/organizationStore';
import { 
  DEPARTMENT_SPECIALTY_CONFIGS, 
  getHeadsForSpecialty, 
  getAllHeadsForDept,
  getDepartmentQuotaStats 
} from '../../utils/departmentSpecialtiesConfig';

interface AdminSubStaffMatrixProps {
  orgData: {
    heads: Record<string, User>;
    members: User[];
  };
  projects: LubpyProjectItem[];
  onAppointHead?: (deptKey: string, specialtyPreset?: string, replacingHeadUid?: string) => void;
  onAssignDev?: (project: LubpyProjectItem) => void;
  onUpdateHead?: (deptKey: string, updatedHead: User) => void;
  onRemoveHead?: (headUidOrKey: string, deptKey: string) => void;
}

export default function AdminSubStaffMatrix({
  orgData,
  projects,
  onAppointHead,
  onAssignDev,
  onUpdateHead,
  onRemoveHead
}: AdminSubStaffMatrixProps) {
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    tech: true, // open tech department by default
    cs: false,
    hr: false,
    accounting: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<'all' | 'tech' | 'cs' | 'hr' | 'accounting'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'free' | 'busy' | 'overloaded'>('all');
  const [syncVersion, setSyncVersion] = useState(0);

  // States for viewing and editing Department Heads (Level 2)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [viewingHead, setViewingHead] = useState<{ deptKey: string; head: User } | null>(null);
  const [editingHead, setEditingHead] = useState<{ deptKey: string; head: User } | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    dob: '',
    phone: '',
    departmentTitle: '',
    experience: '',
    competence: '',
    skills: '',
    password: '',
    photoUrl: ''
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getHeadPassword = (head: User): string => {
    if (head.dob) {
      const dobPass = dobTo8Digits(head.dob);
      if (dobPass) return dobPass;
    }
    if (head.password && head.password.trim()) return head.password.trim();
    return '123456';
  };

  const handleCopyPassword = (email: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedEmail(email);
    showToast(`📋 Đã sao chép mật khẩu (${pass}) vào bộ nhớ tạm!`);
    setTimeout(() => setCopiedEmail(null), 3000);
  };

  const openEditModal = (deptKey: string, head: User) => {
    // RÀNG BUỘC ĐIỀU KIỆN: Nếu có ngày tháng năm sinh thì mật khẩu dùng đúng 8 số ngày sinh
    const dobDigits = head.dob ? dobTo8Digits(head.dob) : '';
    const currentPass = dobDigits || getHeadPassword(head);
    setEditingHead({ deptKey, head });
    setEditForm({
      name: head.name || '',
      email: head.email || '',
      dob: head.dob || '',
      phone: head.phone || '',
      departmentTitle: head.departmentTitle || '',
      experience: head.experience || 'Từ 2 đến 5 năm',
      competence: head.competence || '',
      skills: head.skills || '',
      password: currentPass,
      photoUrl: head.photoUrl || ''
    });
    setShowModalPassword(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHead) return;

    const { deptKey, head } = editingHead;
    const finalDob = editForm.dob.trim();
    const dobDigits = dobTo8Digits(finalDob);

    // RÀNG BUỘC ĐIỀU KIỆN TUYỆT ĐỐI THEO YÊU CẦU CỦA ADMIN:
    // Ngày tháng năm sinh admin nhập bao nhiêu, thì mật khẩu sẽ dùng ngày tháng năm sinh đó là mật khẩu (8 số).
    // Ví dụ: nhập 15/11/1990 thì mật khẩu là 15111990. Nếu có cập nhật hay thay đổi ngày tháng năm sinh thì mật khẩu sẽ đổi theo đúng với ngày tháng năm sinh nếu có cập nhật thay đổi.
    const finalPassword = dobDigits || editForm.password.trim() || head.password || '123456';

    const finalEmail = editForm.email.trim() || normalizeNameToEmail(editForm.name.trim()) || head.email;

    const updatedUser: User = {
      ...head,
      name: editForm.name.trim(),
      email: finalEmail,
      dob: finalDob,
      phone: editForm.phone.trim(),
      departmentTitle: editForm.departmentTitle.trim() || head.departmentTitle,
      experience: editForm.experience.trim(),
      competence: editForm.competence.trim(),
      skills: editForm.skills.trim(),
      password: finalPassword,
      photoUrl: editForm.photoUrl.trim() || head.photoUrl
    };

    // Update in orgData heads
    const updatedHeads = { ...orgData.heads };
    let found = false;
    for (const k of Object.keys(updatedHeads)) {
      if (updatedHeads[k]?.uid === head.uid || (k === deptKey && updatedHeads[k]?.email === head.email)) {
        updatedHeads[k] = updatedUser;
        found = true;
      }
    }
    if (!found) {
      updatedHeads[head.uid || `head_${deptKey}_${Date.now()}`] = updatedUser;
    }
    if (orgData.heads[deptKey]?.uid === head.uid || !orgData.heads[deptKey]) {
      updatedHeads[deptKey] = updatedUser;
    }

    orgData.heads = updatedHeads;
    saveOrganization(updatedHeads, orgData.members);

    // Sync to all stores (localStorage lubpy_users, savedAccounts)
    syncHeadAccountToAllStores(updatedUser, finalPassword);

    if (onUpdateHead) {
      onUpdateHead(deptKey, updatedUser);
    }

    setEditingHead(null);
    if (viewingHead && viewingHead.deptKey === deptKey) {
      setViewingHead({ deptKey, head: updatedUser });
    }

    showToast(`✅ Đã cập nhật thành công hồ sơ Trưởng phòng ${updatedUser.name}! Mật khẩu tự động ràng buộc 8 số ngày sinh: ${finalPassword}`);
    setSyncVersion(v => v + 1);
    window.dispatchEvent(new Event('organization-updated'));
  };

  const handleRemoveHeadLocally = (deptKey: string, head: User) => {
    if (!window.confirm(`Bạn có chắc chắn muốn miễn nhiệm Trưởng phòng "${head.name}" khỏi chuyên môn "${head.competence || 'này'}" không?\n\nSau khi miễn nhiệm, vị trí này sẽ được mở khóa để tuyển nhân sự mới.`)) {
      return;
    }

    const updatedHeads = { ...orgData.heads };
    for (const k of Object.keys(updatedHeads)) {
      if (updatedHeads[k]?.uid === head.uid || (k === deptKey && updatedHeads[k]?.email === head.email)) {
        delete updatedHeads[k];
      }
    }

    // If primary head of dept was deleted, promote another head from that department if available
    if (updatedHeads[deptKey]?.uid === head.uid) {
      delete updatedHeads[deptKey];
      const remaining = getAllHeadsForDept(updatedHeads, deptKey);
      if (remaining.length > 0) {
        updatedHeads[deptKey] = remaining[0];
      }
    }

    orgData.heads = updatedHeads;
    saveOrganization(updatedHeads, orgData.members);

    if (head.email) {
      removeSavedAccountFromStorage(head.email);
    }

    if (onRemoveHead) {
      onRemoveHead(head.uid, deptKey);
    }

    showToast(`🗑️ Đã miễn nhiệm Trưởng phòng "${head.name}". Vị trí chuyên môn đã được mở khóa!`);
    setSyncVersion(v => v + 1);
    window.dispatchEvent(new Event('organization-updated'));
  };

  // Listen to storage and staff update events
  React.useEffect(() => {
    const handleUpdate = () => {
      setSyncVersion(v => v + 1);
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('lubpy_staff_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('lubpy_staff_updated', handleUpdate);
    };
  }, []);

  const toggleDept = (deptKey: string) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptKey]: !prev[deptKey]
    }));
  };

  // Load Sub-staff from sync store
  const techStaff = getHRTechStaff();
  const csStaff = getHRCSStaff();
  const hrStaff = getHRStaffMembers();
  const accStaff = getHRAccountingStaff();

  const DEPARTMENTS = [
    {
      key: 'tech',
      label: 'Đội Ngũ Kỹ Thuật (Tech Team)',
      icon: <LaptopIcon className="w-5 h-5 text-emerald-400" />,
      headRole: 'Trưởng Đội Ngũ Kỹ Thuật (Tech Lead)',
      color: 'emerald',
      subStaff: techStaff.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        title: s.title,
        level: s.level,
        status: s.status,
        rating: s.rating || 5.0,
        avatarUrl: s.avatarUrl,
        skills: s.skills,
        activeProjectsCount: s.activeProjectsCount,
        completedProjectsCount: s.completedProjectsCount,
        avgProgress: s.avgProgress,
        managedByDept: 'Đội Ngũ Kỹ Thuật',
        headName: orgData.heads['tech']?.name || 'Chưa bổ nhiệm'
      }))
    },
    {
      key: 'cs',
      label: 'Chăm Sóc Khách Hàng (Customer Service)',
      icon: <HeartHandshakeIcon className="w-5 h-5 text-amber-400" />,
      headRole: 'Trưởng Bộ Phận CSKH (CS Lead)',
      color: 'amber',
      subStaff: csStaff.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        title: s.title,
        level: s.level,
        status: s.status,
        rating: s.rating || 5.0,
        avatarUrl: s.avatarUrl,
        skills: s.skills,
        activeProjectsCount: s.ticketsHandledCount,
        completedProjectsCount: 18,
        avgProgress: 95,
        managedByDept: 'Chăm Sóc Khách Hàng',
        headName: orgData.heads['cs']?.name || 'Chưa bổ nhiệm'
      }))
    },
    {
      key: 'hr',
      label: 'Quản Lý Nhân Sự (HR Management)',
      icon: <BriefcaseIcon className="w-5 h-5 text-indigo-400" />,
      headRole: 'Trưởng Phòng Nhân Sự (HR Lead)',
      color: 'indigo',
      subStaff: hrStaff.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        title: s.title,
        level: s.level,
        status: s.status,
        rating: s.rating || 5.0,
        avatarUrl: s.avatarUrl,
        skills: s.skills,
        activeProjectsCount: s.candidatesProcessedCount,
        completedProjectsCount: 24,
        avgProgress: 90,
        managedByDept: 'Quản Lý Nhân Sự',
        headName: orgData.heads['hr']?.name || 'Chưa bổ nhiệm'
      }))
    },
    {
      key: 'accounting',
      label: 'Kế Toán & Tài Chính (Finance & Payout)',
      icon: <CalculatorIcon className="w-5 h-5 text-purple-400" />,
      headRole: 'Kế Toán Trưởng & Trưởng Ban Tài Chính',
      color: 'purple',
      subStaff: accStaff.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        title: s.title,
        level: s.level,
        status: s.status,
        rating: s.rating || 5.0,
        avatarUrl: s.avatarUrl,
        skills: s.skills,
        activeProjectsCount: s.invoicesProcessedCount,
        completedProjectsCount: 30,
        avgProgress: 92,
        managedByDept: 'Kế Toán & Tài Chính',
        headName: orgData.heads['accounting']?.name || 'Chưa bổ nhiệm'
      }))
    }
  ];

  // Flatten all sub-staff for the unified matrix table
  const allSubStaff = DEPARTMENTS.flatMap(d => d.subStaff);

  const filteredAllSubStaff = allSubStaff.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.skills.some(sk => sk.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = 
      selectedDeptFilter === 'all' || 
      (selectedDeptFilter === 'tech' && s.managedByDept.includes('Kỹ Thuật')) ||
      (selectedDeptFilter === 'cs' && s.managedByDept.includes('Chăm Sóc')) ||
      (selectedDeptFilter === 'hr' && s.managedByDept.includes('Nhân Sự')) ||
      (selectedDeptFilter === 'accounting' && s.managedByDept.includes('Kế Toán'));

    const matchesStatus = selectedStatusFilter === 'all' || s.status === selectedStatusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-8" id="admin-substaff-matrix-section">

      {/* ================= LEVEL 2 & LEVEL 3 EXPANDABLE ACCORDIONS ================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <CrownIcon className="w-5 h-5 text-amber-400" />
              <span>Cấp 2 • Danh Sách Trưởng Nghiệp Vụ &amp; Cán Bộ Cấp Dưới</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Theo dõi trực tiếp Trưởng phòng và toàn bộ kỹ thuật viên, chuyên viên thuộc từng bộ phận
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setExpandedDepts({
                  tech: true,
                  cs: true,
                  hr: true,
                  accounting: true
                });
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-lg border border-white/10"
            >
              Mở Rộng Tất Cả
            </button>
            <button
              onClick={() => {
                setExpandedDepts({
                  tech: false,
                  cs: false,
                  hr: false,
                  accounting: false
                });
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-lg border border-white/10"
            >
              Thu Gọn
            </button>
          </div>
        </div>

        {/* 4 DEPARTMENT CARDS */}
        <div className="grid grid-cols-1 gap-6">
          {DEPARTMENTS.map((dept) => {
            const headUser = orgData.heads[dept.key];
            const isExpanded = !!expandedDepts[dept.key];
            const subCount = dept.subStaff.length;

            // Relevant projects for this department (e.g. tech)
            const deptProjects = dept.key === 'tech' 
              ? projects.filter(p => p.status !== 'Pending') 
              : [];
            const avgDeptProgress = deptProjects.length > 0
              ? Math.round(deptProjects.reduce((sum, p) => sum + p.progress, 0) / deptProjects.length)
              : 82;

            return (
              <div 
                key={dept.key} 
                className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl transition-all hover:border-white/20"
              >
                {/* Department Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                      {dept.icon}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">{dept.label}</h4>
                      <p className="text-xs text-gray-400 font-mono">
                        Cơ cấu: 1 Trưởng nghiệp vụ + {subCount} Cán bộ / Kỹ thuật viên cấp dưới
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleDept(dept.key)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <UsersIcon className="w-4 h-4" />
                      <span>{isExpanded ? 'Ẩn Cấp Dưới' : `Xem Cấp Dưới (${subCount})`}</span>
                      {isExpanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                    </button>

                    {onAppointHead && (
                      <button
                        onClick={() => onAppointHead(dept.key)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        {headUser ? 'Đổi Trưởng Phòng' : '+ Bổ Nhiệm'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Level 2 Department Heads & Specialties Constraint Section */}
                {(() => {
                  const deptConfig = DEPARTMENT_SPECIALTY_CONFIGS[dept.key];
                  const quotaStats = getDepartmentQuotaStats(orgData.heads, dept.key);
                  const isDeptLocked = quotaStats.isFullyLocked;

                  return (
                    <div className="space-y-4 pt-1">
                      {/* Department Quota Overview & Constraint Rules Banner */}
                      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl shadow-lg space-y-3">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                                <CrownIcon className="w-4 h-4 text-amber-400" />
                                <span>Cấp 2 • Danh Sách Trưởng Nghiệp Vụ &amp; Trưởng Phòng</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 uppercase">
                                {deptConfig?.specialtiesCount || 0} Chuyên Môn Nghiệp Vụ
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                              📌 <strong>Ràng buộc tuyển dụng:</strong> Ứng với mỗi chuyên môn nghiệp vụ sẽ có <strong>tối đa 2 Trưởng phòng</strong>. Khi đã tuyển đủ số Trưởng phòng ứng với số chuyên môn nghiệp vụ đang có, hệ thống sẽ <strong>khóa và không cho nhập thêm</strong>. Nếu cần thay đổi, Admin sẽ cập nhật thông tin hoặc thay đổi Trưởng phòng mới.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isDeptLocked ? (
                              <div className="px-3.5 py-1.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-xl text-xs font-black flex items-center gap-1.5 shadow">
                                <LockIcon className="w-4 h-4 text-red-400" />
                                <span>ĐÃ TUYỂN ĐỦ ({quotaStats.currentHeadsCount}/{quotaStats.maxHeadsCapacity}) • ĐÃ KHÓA NHẬP THÊM</span>
                              </div>
                            ) : (
                              <div className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black flex items-center gap-1.5 shadow">
                                <CheckCircle2Icon className="w-4 h-4 text-emerald-400" />
                                <span>TIẾN ĐỘ TUYỂN: {quotaStats.currentHeadsCount}/{quotaStats.maxHeadsCapacity} TRƯỞNG PHÒNG (CÒN {quotaStats.remainingSlots} VỊ TRÍ)</span>
                              </div>
                            )}

                            {onAppointHead && !isDeptLocked && (
                              <button
                                type="button"
                                onClick={() => onAppointHead(dept.key)}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                              >
                                <UserPlusIcon className="w-4 h-4" />
                                <span>+ Tuyển Trưởng Phòng</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Lock Warning Banner if all specialties are filled */}
                        {isDeptLocked && (
                          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <LockIcon className="w-4 h-4 text-red-400 shrink-0" />
                              <span>
                                <strong>HỆ THỐNG ĐÃ KHÓA NHẬP THÊM:</strong> Tất cả {deptConfig?.specialtiesCount} chuyên môn nghiệp vụ của bộ phận này đã tuyển đủ tối đa 2 Trưởng phòng/chuyên môn. Để điều chỉnh nhân sự, Admin vui lòng dùng nút <strong>[Cập Nhật Thông Tin]</strong> hoặc <strong>[Thay Đổi Trưởng Phòng Mới]</strong> trên từng hồ sơ bên dưới.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Specialties Grid: 6 for Tech, 5 for CS, 5 for HR, 5 for Accounting */}
                      <div className="grid grid-cols-1 gap-4">
                        {deptConfig?.specialties.map((spec, specIdx) => {
                          const specHeads = getHeadsForSpecialty(orgData.heads, dept.key, spec.name);
                          const isSpecLocked = specHeads.length >= 2;

                          return (
                            <div
                              key={spec.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                isSpecLocked 
                                  ? 'bg-slate-950/80 border-red-500/30 shadow-md' 
                                  : specHeads.length === 1 
                                    ? 'bg-slate-950/70 border-amber-500/30' 
                                    : 'bg-slate-950/50 border-white/10'
                              }`}
                            >
                              {/* Specialty Header */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 pb-3 border-b border-white/10">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-lg bg-white/10 text-gray-300 text-[10px] font-mono font-bold">
                                      Chuyên Môn #{specIdx + 1}
                                    </span>
                                    <h5 className="text-sm font-black text-white">{spec.name}</h5>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">{spec.description}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isSpecLocked ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-black flex items-center gap-1">
                                      <LockIcon className="w-3.5 h-3.5 text-red-400" />
                                      <span>ĐÃ ĐỦ 2/2 TRƯỞNG PHÒNG (ĐÃ KHÓA)</span>
                                    </span>
                                  ) : specHeads.length === 1 ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1">
                                      <CheckCircle2Icon className="w-3.5 h-3.5 text-amber-400" />
                                      <span>ĐÃ TUYỂN 1/2 (CÒN 1 VỊ TRÍ)</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-gray-400 border border-white/10 text-[11px] font-bold flex items-center gap-1">
                                      <AlertCircleIcon className="w-3.5 h-3.5 text-amber-400" />
                                      <span>CHƯA CÓ TRƯỞNG PHÒNG (CÒN 2 VỊ TRÍ)</span>
                                    </span>
                                  )}

                                  {onAppointHead && !isSpecLocked && (
                                    <button
                                      type="button"
                                      onClick={() => onAppointHead(dept.key, spec.name)}
                                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                    >
                                      <UserPlusIcon className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Tuyển Vị Trí #{specHeads.length + 1}</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Appointed Heads List for this Specialty */}
                              <div className="pt-3 space-y-3">
                                {specHeads.length === 0 ? (
                                  <div className="p-3 bg-slate-900/60 rounded-xl border border-dashed border-white/10 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
                                    <span className="text-xs text-gray-400">
                                      ⚠️ Chưa có Trưởng phòng phụ trách chuyên môn <strong>{spec.name}</strong>.
                                    </span>
                                    {onAppointHead && (
                                      <button
                                        type="button"
                                        onClick={() => onAppointHead(dept.key, spec.name)}
                                        className="text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer"
                                      >
                                        + Bổ nhiệm Trưởng phòng ngay
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  specHeads.map((headItem, headIdx) => {
                                    const headPass = getHeadPassword(headItem);
                                    const headKey = headItem.uid || headItem.email;
                                    const isPassVisible = !!showPasswordMap[headKey];
                                    const dobDigits = headItem.dob ? dobTo8Digits(headItem.dob) : '';

                                    return (
                                      <div
                                        key={headItem.uid || headIdx}
                                        className="p-3.5 bg-gradient-to-r from-amber-950/25 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl shadow space-y-3"
                                      >
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                          <div className="flex items-center gap-3">
                                            <img
                                              src={headItem.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(headItem.name)}&backgroundColor=0f172a`}
                                              alt={headItem.name}
                                              className="w-12 h-12 rounded-xl border-2 border-amber-400 bg-slate-950 shrink-0 shadow object-cover"
                                            />
                                            <div>
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-black text-amber-300">{headItem.name}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 uppercase">
                                                  👑 Trưởng Phòng Chuyên Môn [Vị Trí {headIdx + 1}/2]
                                                </span>
                                              </div>
                                              <div className="text-xs font-semibold text-gray-200 mt-0.5">
                                                {headItem.departmentTitle || dept.headRole} • {headItem.competence || spec.name}
                                              </div>
                                              <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                                                <span>📧 {headItem.email}</span>
                                                <span>•</span>
                                                <span>📞 {headItem.phone || '0901234567'}</span>
                                                {headItem.dob && (
                                                  <>
                                                    <span>•</span>
                                                    <span className="text-amber-400 font-bold">🎂 Ngày sinh: {headItem.dob}</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Action Buttons: View, Edit, Replace, Remove */}
                                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                            <button
                                              type="button"
                                              onClick={() => setViewingHead({ deptKey: dept.key, head: headItem })}
                                              className="px-2.5 py-1.5 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                                              title="Xem chi tiết hồ sơ & mật khẩu"
                                            >
                                              <EyeIcon className="w-3.5 h-3.5 text-sky-400" />
                                              <span>Xem</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => openEditModal(dept.key, headItem)}
                                              className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                                              title="Cập nhật thông tin (Họ tên, Ngày sinh -> Mật khẩu 8 số, SĐT, Kỹ năng)"
                                            >
                                              <Edit3Icon className="w-3.5 h-3.5 text-emerald-400" />
                                              <span>Cập Nhật Thông Tin</span>
                                            </button>

                                            {onAppointHead && (
                                              <button
                                                type="button"
                                                onClick={() => onAppointHead(dept.key, spec.name, headItem.uid)}
                                                className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                                                title="Thay đổi nhân sự Trưởng phòng mới cho vị trí chuyên môn này"
                                              >
                                                <RefreshCwIcon className="w-3.5 h-3.5 text-amber-400" />
                                                <span>Thay Trưởng Phòng Mới</span>
                                              </button>
                                            )}

                                            <button
                                              type="button"
                                              onClick={() => handleRemoveHeadLocally(dept.key, headItem)}
                                              className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                                              title="Miễn nhiệm Trưởng phòng (Mở khóa lại vị trí chuyên môn)"
                                            >
                                              <Trash2Icon className="w-3.5 h-3.5 text-red-400" />
                                              <span>Miễn Nhiệm</span>
                                            </button>
                                          </div>
                                        </div>

                                        {/* Password Display Box with Strict DOB 8-digit binding */}
                                        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-950/60 px-3 py-2 rounded-lg border border-amber-500/20">
                                          <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 uppercase">
                                              <LockIcon className="w-3.5 h-3.5 text-amber-400" />
                                              <span>Mật Khẩu Cấp:</span>
                                            </span>

                                            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded border border-white/15">
                                              <span className="text-xs font-mono font-black tracking-wider text-white">
                                                {isPassVisible ? headPass : '••••••••'}
                                              </span>

                                              <button
                                                type="button"
                                                onClick={() => setShowPasswordMap(prev => ({ ...prev, [headKey]: !prev[headKey] }))}
                                                className="p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-amber-300 cursor-pointer transition-colors"
                                                title={isPassVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                              >
                                                {isPassVisible ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => handleCopyPassword(headItem.email, headPass)}
                                                className="p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-emerald-300 cursor-pointer transition-colors"
                                                title="Sao chép mật khẩu"
                                              >
                                                {copiedEmail === headItem.email ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                              </button>
                                            </div>

                                            {dobDigits ? (
                                              <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle2Icon className="w-3 h-3 text-emerald-400" />
                                                <span>Ràng buộc 8 số ngày sinh ({dobDigits})</span>
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                                                ⚠️ Chưa có ngày sinh
                                              </span>
                                            )}
                                          </div>

                                          {headItem.skills && (
                                            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1 truncate max-w-xs">
                                              <SparklesIcon className="w-3 h-3 text-amber-400 shrink-0" />
                                              <span className="truncate">{headItem.skills}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}

                                {/* If exactly 1 head appointed, show available slot 2 */}
                                {specHeads.length === 1 && (
                                  <div className="p-2.5 bg-slate-900/40 rounded-xl border border-dashed border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                                    <span className="text-gray-400">
                                      ⚡ Vị trí Trưởng phòng thứ 2 cho chuyên môn này còn trống (1/2).
                                    </span>
                                    {onAppointHead && (
                                      <button
                                        type="button"
                                        onClick={() => onAppointHead(dept.key, spec.name)}
                                        className="text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer flex items-center gap-1"
                                      >
                                        <UserPlusIcon className="w-3.5 h-3.5" />
                                        <span>+ Tuyển Trưởng phòng thứ 2</span>
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* If 2 heads appointed, show locked indicator */}
                                {isSpecLocked && (
                                  <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded-xl text-[11px] text-red-300 flex items-center gap-2">
                                    <LockIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                    <span>
                                      <strong>ĐÃ KHÓA:</strong> Đã tuyển đủ 2/2 Trưởng phòng cho chuyên môn này. Nếu cần thay đổi, Admin vui lòng bấm <strong>[Cập Nhật Thông Tin]</strong> hoặc <strong>[Thay Trưởng Phòng Mới]</strong> ở trên.
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Level 3 Sub-Staff List (Visible when expanded) */}
                {isExpanded && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        <span>Cấp 3 • Kỹ Thuật Viên / Cán Bộ Cấp Dưới Trực Thuộc ({subCount})</span>
                      </span>
                    </div>

                    {subCount === 0 ? (
                      <div className="p-4 bg-slate-950/60 rounded-xl border border-dashed border-white/10 text-center text-xs text-gray-400">
                        Chưa có nhân sự cấp dưới được liên kết trong phòng ban này.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dept.subStaff.map((staff) => {
                          // Find projects assigned to this developer
                          const assignedProjects = projects.filter(p => 
                            p.assignedDev && p.assignedDev.toLowerCase().includes(staff.name.toLowerCase())
                          );

                          return (
                            <div 
                              key={staff.id}
                              className="bg-slate-950/80 border border-white/10 hover:border-sky-500/40 rounded-xl p-4 space-y-3 transition-all flex flex-col justify-between"
                            >
                              <div className="space-y-2.5">
                                {/* Staff Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <img 
                                      src={staff.avatarUrl} 
                                      alt={staff.name} 
                                      className="w-10 h-10 rounded-full border border-sky-400/30 bg-slate-900 shrink-0" 
                                    />
                                    <div>
                                      <h5 className="text-xs font-black text-white leading-snug">{staff.name}</h5>
                                      <p className="text-[10px] text-sky-300 font-mono">{staff.title}</p>
                                    </div>
                                  </div>

                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                                    staff.status === 'busy' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                    staff.status === 'overloaded' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}>
                                    {staff.status === 'busy' ? 'Đang làm' : staff.status === 'overloaded' ? 'Quá tải' : 'Sẵn sàng'}
                                  </span>
                                </div>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-1">
                                  {staff.skills.slice(0, 3).map((sk, sidx) => (
                                    <span key={sidx} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-gray-300 font-mono">
                                      {sk}
                                    </span>
                                  ))}
                                </div>

                                {/* Rating & Progress Bar */}
                                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-white/5 space-y-1.5 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-gray-400">Đánh Giá Hiệu Suất:</span>
                                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                                      <StarIcon className="w-3 h-3 fill-amber-400" />
                                      <span>{staff.rating.toFixed(1)} / 5.0</span>
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-gray-400">Tiến Độ Làm Việc:</span>
                                    <span className="text-[10px] text-emerald-400 font-bold font-mono">
                                      {staff.avgProgress}%
                                    </span>
                                  </div>

                                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full" 
                                      style={{ width: `${staff.avgProgress}%` }}
                                    />
                                  </div>

                                  {/* Assigned Projects Details */}
                                  {assignedProjects.length > 0 && (
                                    <div className="pt-1 border-t border-white/5 text-[10px] space-y-1">
                                      <span className="text-gray-400 block font-bold">Đồ án đang code:</span>
                                      {assignedProjects.slice(0, 2).map(p => (
                                        <div key={p.id} className="text-gray-300 truncate flex items-center justify-between">
                                          <span className="truncate">• {p.title}</span>
                                          <span className="text-sky-400 font-mono shrink-0 ml-1">{p.progress}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 flex items-center justify-between text-[10px] text-gray-400 font-mono border-t border-white/5">
                                <span>Liên hệ: {staff.phone}</span>
                                <span className="text-sky-300 font-bold">{staff.activeProjectsCount} Đồ án</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= CẤP 3: BẢNG MA TRẬN TIẾN ĐỘ TOÀN BỘ NHÂN SỰ CẤP DƯỚI ================= */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-sky-400" />
              <span>Cấp 3 • Bảng Giám Sát Ma Trận Tiến Độ Toàn Bộ Kỹ Sư &amp; Cán Bộ Cấp Dưới</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Theo dõi chi tiết từng nhân viên cấp dưới, Trưởng nghiệp vụ trực tiếp quản lý, đồ án phụ trách và đánh giá năng lực
            </p>
          </div>
        </div>

        {/* Toolbar Filter */}
        <div className="bg-slate-900/60 border border-white/10 p-3.5 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-500" />
            </span>
            <input 
              type="text"
              placeholder="Tìm theo tên cán bộ, kỹ sư, kỹ năng, đồ án phụ trách..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value as any)}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Tất Cả Nghiệp Vụ</option>
              <option value="tech">Đội Ngũ Kỹ Thuật (Tech)</option>
              <option value="cs">Chăm Sóc Khách Hàng (CS)</option>
              <option value="hr">Quản Lý Nhân Sự (HR)</option>
              <option value="accounting">Kế Toán &amp; Tài Chính</option>
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Tất Cả Trạng Thái</option>
              <option value="free">Sẵn Sàng Nhận Việc</option>
              <option value="busy">Đang Thực Hiện Đồ Án</option>
              <option value="overloaded">Cảnh Báo Quá Tải (&gt; 3)</option>
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-slate-950/80 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Nhân Sự Cấp Dưới</th>
                  <th className="py-3.5 px-4">Nghiệp Vụ &amp; Trưởng Quản Lý</th>
                  <th className="py-3.5 px-4">Kỹ Năng / Chuyên Môn</th>
                  <th className="py-3.5 px-4">Tiến Độ Làm Việc</th>
                  <th className="py-3.5 px-4">Đánh Giá ⭐</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAllSubStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UsersIcon className="w-8 h-8 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-300">Chưa có kỹ sư hoặc cán bộ cấp dưới nào</span>
                        <p className="text-xs text-gray-500 max-w-md">
                          Dữ liệu nhân sự cấp 3 đang trống hoặc đã được xóa hoàn toàn khỏi hệ thống.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAllSubStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={staff.avatarUrl} 
                            alt={staff.name} 
                            className="w-9 h-9 rounded-full border border-sky-400/30 bg-slate-950 shrink-0" 
                          />
                          <div>
                            <div className="font-bold text-white text-xs">{staff.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{staff.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Dept & Head */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sky-300">{staff.managedByDept}</div>
                        <div className="text-[10px] text-amber-300/90 font-mono">👑 Quản lý: {staff.headName}</div>
                      </td>

                      {/* Skills */}
                      <td className="py-3.5 px-4">
                        <div className="text-gray-200 font-medium mb-1">{staff.title}</div>
                        <div className="flex flex-wrap gap-1">
                          {staff.skills.slice(0, 2).map((sk, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-mono">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-gray-400">{staff.activeProjectsCount} Đồ án</span>
                            <span className="text-emerald-400 font-bold">{staff.avgProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full" 
                              style={{ width: `${staff.avgProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center text-amber-400 font-bold font-mono text-xs gap-1">
                          <StarIcon className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{staff.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono ${
                          staff.status === 'busy' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          staff.status === 'overloaded' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {staff.status === 'busy' ? 'Đang làm' : staff.status === 'overloaded' ? 'Quá tải' : 'Sẵn sàng'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TOAST ALERT NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-amber-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <span className="text-amber-400 text-base">✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL: VIEW HEAD PROFILE & PASSWORD */}
      {viewingHead && (() => {
        const head = viewingHead.head;
        const pass = getHeadPassword(head);
        const dobDigits = head.dob ? dobTo8Digits(head.dob) : '';
        const isPassVis = !!showPasswordMap[`modal_${viewingHead.deptKey}`];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl p-5 sm:p-6 relative space-y-5 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setViewingHead(null)}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-800 rounded-full text-gray-400 hover:text-white cursor-pointer transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <img
                  src={head.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(head.name)}&backgroundColor=0f172a`}
                  alt={head.name}
                  className="w-16 h-16 rounded-2xl border-2 border-amber-400 bg-slate-950 object-cover shadow-lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{head.name}</h3>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 uppercase">
                      👑 Trưởng Nghiệp Vụ
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 font-medium mt-0.5">{head.departmentTitle || 'Trưởng Phòng Nghiệp Vụ'}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{head.email}</p>
                </div>
              </div>

              {/* Password Highlight Box */}
              <div className="p-4 bg-gradient-to-r from-amber-950/40 to-slate-950 border border-amber-500/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                    <KeyIcon className="w-4 h-4 text-amber-400" />
                    <span>Mật Khẩu Đăng Nhập Cấp Cho Trưởng Phòng</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Đang hoạt động</span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-white/10">
                  <div className="font-mono text-base font-black text-white tracking-wider">
                    {isPassVis ? pass : '••••••••••••'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordMap(p => ({ ...p, [`modal_${viewingHead.deptKey}`]: !p[`modal_${viewingHead.deptKey}`] }))}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isPassVis ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                      <span>{isPassVis ? 'Ẩn' : 'Hiện'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyPassword(head.email, pass)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                    >
                      {copiedEmail === head.email ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      <span>{copiedEmail === head.email ? 'Đã Sao Chép' : 'Sao Chép'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  💡 <strong>Quy định mật khẩu:</strong> Sử dụng <strong>8 số ngày tháng năm sinh (DDMMYYYY)</strong> của cán bộ ({dobDigits ? `Ví dụ: ${dobDigits}` : 'chưa có ngày sinh'}) hoặc mật khẩu riêng do Admin ấn định để cán bộ đăng nhập dễ dàng, không bị quên.
                </p>
              </div>

              {/* Full Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">🎂 Ngày Tháng Năm Sinh</span>
                  <span className="text-white font-mono font-bold">{head.dob || 'Chưa cập nhật'}</span>
                  {dobDigits && <span className="text-[10px] text-amber-400 block font-mono mt-0.5">8 số: {dobDigits}</span>}
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">📞 Số Điện Thoại / Zalo</span>
                  <span className="text-white font-mono font-bold">{head.phone || 'Chưa cập nhật'}</span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">💼 Kinh Nghiệm Làm Việc</span>
                  <span className="text-white font-medium">{head.experience || 'Từ 2 đến 5 năm'}</span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">🎯 Chuyên Môn Chính</span>
                  <span className="text-sky-300 font-medium">{head.competence || 'Quản lý & Điều hành kỹ thuật'}</span>
                </div>

                <div className="sm:col-span-2 bg-slate-950/70 p-3 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">🛠️ Kỹ Năng &amp; Công Nghệ Phụ Trách</span>
                  <span className="text-emerald-300 font-mono text-[11px] leading-relaxed block">{head.skills || 'React, Node.js, System Design'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const h = viewingHead;
                    setViewingHead(null);
                    openEditModal(h.deptKey, h.head);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all"
                >
                  <Edit3Icon className="w-4 h-4" />
                  <span>Chỉnh Sửa Hồ Sơ &amp; Mật Khẩu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingHead(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: EDIT DEPARTMENT HEAD PROFILE & PASSWORD */}
      {editingHead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl p-5 sm:p-6 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingHead(null)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-800 rounded-full text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
                <Edit3Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Cập Nhật Thông Tin &amp; Mật Khẩu Trưởng Phòng
                </h3>
                <p className="text-xs text-gray-400">
                  Chỉnh sửa hồ sơ nghiệp vụ, đồng bộ tài khoản đăng nhập và mật khẩu
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                    Họ &amp; Tên Trưởng Phòng <span className="text-red-400">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const autoEmail = normalizeNameToEmail(newName);
                      setEditForm(p => ({
                        ...p,
                        name: newName,
                        email: autoEmail || p.email
                      }));
                    }}
                    placeholder="VD: Nguyễn Văn A / Lê Bảo"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-300 uppercase">
                      Email Công Việc <span className="text-red-400">*</span>:
                    </label>
                    <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                      ⚡ @lubpystudio.vn
                    </span>
                  </div>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="nguyenvana@lubpystudio.vn"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-mono focus:border-emerald-500 transition-colors"
                  />
                  {editForm.name.trim() && (
                    <p className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-1 font-mono truncate">
                      ✓ Ràng buộc email chuẩn hóa: <span className="text-white font-bold">{editForm.email || normalizeNameToEmail(editForm.name)}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Title & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                    Chức Danh / Vị Trí Nghiệp Vụ:
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.departmentTitle}
                    onChange={(e) => setEditForm(p => ({ ...p, departmentTitle: e.target.value }))}
                    placeholder="Trưởng Đội Ngũ Kỹ Thuật"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                    Số Điện Thoại / Zalo:
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="0912345678"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-mono focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Row 3: DOB & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-amber-300 uppercase">
                      🎂 Ngày Tháng Năm Sinh (DOB):
                    </label>
                    {editForm.dob && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                        8 số: <strong>{dobTo8Digits(editForm.dob)}</strong>
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => {
                      const newDob = e.target.value;
                      const calculatedPass = dobTo8Digits(newDob);
                      setEditForm(p => ({
                        ...p,
                        dob: newDob,
                        // RÀNG BUỘC ĐIỀU KIỆN: Khi admin nhập hay thay đổi ngày tháng năm sinh, mật khẩu đổi theo đúng 8 số ngày sinh
                        password: calculatedPass || p.password
                      }));
                    }}
                    className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-mono focus:border-amber-400"
                  />
                  <p className="text-[10px] text-amber-300/80 leading-normal">
                    ⚡ <strong>Ràng buộc điều kiện:</strong> Mật khẩu sẽ tự động dùng 8 số ngày sinh (DDMMYYYY). Khi cập nhật thay đổi ngày sinh, mật khẩu sẽ tự động cập nhật theo.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10 space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-300 uppercase">
                    💼 Kinh Nghiệm Làm Việc:
                  </label>
                  <select
                    value={editForm.experience}
                    onChange={(e) => setEditForm(p => ({ ...p, experience: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Dưới 2 năm">Dưới 2 năm</option>
                    <option value="Từ 2 đến 5 năm">Từ 2 đến 5 năm</option>
                    <option value="Từ 5 đến 10 năm">Từ 5 đến 10 năm</option>
                    <option value="Trên 10 năm">Trên 10 năm</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Password Management (With Strict DOB Binding) */}
              <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-amber-500/40 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1.5">
                    <KeyIcon className="w-4 h-4 text-amber-400" />
                    <span>Mật Khẩu Cấp Cho Trưởng Phòng:</span>
                  </label>

                  {editForm.dob ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1">
                      <CheckCircle2Icon className="w-3 h-3 text-emerald-400" />
                      <span>Ràng buộc 8 số ngày sinh ({dobTo8Digits(editForm.dob)})</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-mono">
                      (Chưa nhập ngày sinh)
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    value={editForm.password}
                    onChange={(e) => setEditForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mật khẩu 8 số ngày sinh..."
                    className="w-full bg-slate-900 border border-white/15 text-sm text-white pl-3.5 pr-24 py-2 rounded-xl font-mono font-black tracking-wider focus:border-amber-400"
                  />

                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title={showModalPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showModalPassword ? <EyeOffIcon className="w-4 h-4 text-amber-400" /> : <EyeIcon className="w-4 h-4 text-gray-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyPassword(editForm.email, editForm.password)}
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Sao chép mật khẩu"
                    >
                      {copiedEmail === editForm.email ? (
                        <CheckIcon className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <CopyIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {editForm.dob ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
                    <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-normal">
                      <strong>Ràng buộc tự động hoạt động:</strong> Ngày sinh <strong>{editForm.dob}</strong> ➔ Mật khẩu được cố định 8 số: <strong className="font-mono text-white text-xs underline decoration-emerald-400 underline-offset-2">{dobTo8Digits(editForm.dob)}</strong>. Nếu thay đổi ngày sinh, mật khẩu sẽ tự động cập nhật đổi theo tức thì.
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-400/90 leading-normal">
                    ⚠️ Vui lòng nhập ngày tháng năm sinh ở trên để hệ thống tự động gán mật khẩu 8 số theo định dạng ngày sinh (DDMMYYYY).
                  </p>
                )}
              </div>

              {/* Row 5: Competence & Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                    Chuyên Môn Nghiệp Vụ (Tối Đa 2 Trưởng Phòng):
                  </label>
                  <select
                    value={editForm.competence}
                    onChange={(e) => setEditForm(p => ({ ...p, competence: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:border-emerald-500 cursor-pointer"
                  >
                    {DEPARTMENT_SPECIALTY_CONFIGS[editingHead.deptKey]?.specialties.map(spec => (
                      <option key={spec.id} value={spec.name}>
                        {spec.name}
                      </option>
                    ))}
                    {editForm.competence && !DEPARTMENT_SPECIALTY_CONFIGS[editingHead.deptKey]?.specialties.some(s => s.name === editForm.competence) && (
                      <option value={editForm.competence}>{editForm.competence}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                    Kỹ Năng &amp; Công Nghệ:
                  </label>
                  <input
                    type="text"
                    value={editForm.skills}
                    onChange={(e) => setEditForm(p => ({ ...p, skills: e.target.value }))}
                    placeholder="VD: React, Node.js, Python, DevOps"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-mono focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Row 6: Photo URL */}
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                  Đường Dẫn Ảnh Chân Dung (Avatar URL):
                </label>
                <input
                  type="text"
                  value={editForm.photoUrl}
                  onChange={(e) => setEditForm(p => ({ ...p, photoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-mono focus:border-emerald-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingHead(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Lưu &amp; Đồng Bộ Tài Khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
