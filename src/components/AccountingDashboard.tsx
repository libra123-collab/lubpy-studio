import React, { useState, useEffect } from 'react';
import { 
  DollarSign, FileText, TrendingUp, Clock, CreditCard, ArrowUpRight, ArrowDownRight, 
  Search, Plus, Filter, Calendar, CheckCircle, AlertCircle, LogOut, ChevronRight,
  Shield, Building2, User as UserIcon, Send, Download, ExternalLink, Mail,
  Check, X, Lock, RefreshCw, PieChart, Users, Layers, Wallet, UserX, Settings, Server
} from 'lucide-react';
import { User } from '../types';
import { getStoredOrganization } from '../utils/organizationStore';
import { getVisibleNotificationsForUser } from '../utils/notificationStore';
import NotificationMailboxModal from './NotificationMailboxModal';
import UserProfileModal from './UserProfileModal';
import { getHRAccountingStaff, AccountantStaff } from '../utils/staffSyncStore';

interface AccountingDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onSwitchToSystemManager?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

// Payment record for student/client project invoice
interface ProjectInvoice {
  id: string; // e.g. HD-2026-081
  projectName: string;
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  paymentMethod?: string;
  paymentDate?: string;
  paymentNotes?: string;
  totalCost: number; // e.g. 15000000
  depositAmount: number; // e.g. 7500000
  remainingAmount: number; // e.g. 7500000
  status: 'Đã cọc' | 'Đã nghiệm thu' | 'Đã quyết toán';
  createdDate: string;
  assignedDev: string;
  devPayoutPercentage: number; // e.g. 35%
}

// Dev Payout entry
interface DevPayout {
  id: string;
  devName: string;
  devAvatar: string;
  assignedProjects: string[];
  totalProjectsCount: number;
  payoutRate: string; // e.g. "35% Hợp đồng"
  earnedAmount: number; // e.g. 10500000 VNĐ
  status: 'Chờ duyệt' | 'Đã thanh toán';
  paymentDate?: string;
  bankInfo?: string;
}

export default function AccountingDashboard({ user, onLogout, language, onSwitchToSystemManager, onUpdateUser }: AccountingDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const [activeTab, setActiveTab] = useState<'Invoices' | 'Payouts' | 'Reports' | 'Staff'>('Invoices');
  const [accountingStaffList, setAccountingStaffList] = useState<AccountantStaff[]>(() => getHRAccountingStaff());

  useEffect(() => {
    const handleUpdateAcc = () => {
      setAccountingStaffList(getHRAccountingStaff());
    };
    handleUpdateAcc();
    window.addEventListener('storage', handleUpdateAcc);
    window.addEventListener('lubpy_users_updated' as any, handleUpdateAcc);
    return () => {
      window.removeEventListener('storage', handleUpdateAcc);
      window.removeEventListener('lubpy_users_updated' as any, handleUpdateAcc);
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Format currency helper
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  // Default Invoices (Quản Lý Thu Tiền Đồ Án) - Khởi tạo mảng rỗng do dự án mới khởi tạo
  const [invoices, setInvoices] = useState<ProjectInvoice[]>([]);

  // Default Dev Payouts - Khởi tạo mảng rỗng do dự án mới khởi tạo
  const [devPayouts, setDevPayouts] = useState<DevPayout[]>([]);

  // Report Time Range Filter
  const [reportTimeRange, setReportTimeRange] = useState<'this_month' | 'last_month' | 'this_quarter' | 'this_year'>('this_month');

  // Helper to sync Dev Payouts from Invoices automatically (Tab 1 -> Tab 2 flow)
  const syncDevPayoutsFromInvoices = (invList: ProjectInvoice[], currentPayouts: DevPayout[]): DevPayout[] => {
    const payoutsMap: Record<string, {
      devName: string;
      devAvatar: string;
      assignedProjects: string[];
      totalProjectsCount: number;
      payoutRate: string;
      earnedAmount: number;
      bankInfo?: string;
    }> = {};

    invList.forEach((inv) => {
      const rawDev = inv.assignedDev ? inv.assignedDev.trim() : '';
      const devName = (rawDev && !rawDev.includes('Chưa bổ nhiệm'))
        ? rawDev
        : 'Kỹ Sư Chưa Bổ Nhiệm';

      const payoutPercentage = inv.devPayoutPercentage || 35;
      const payoutAmount = Math.round(inv.totalCost * (payoutPercentage / 100));

      if (!payoutsMap[devName]) {
        payoutsMap[devName] = {
          devName,
          devAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(devName)}`,
          assignedProjects: [inv.id],
          totalProjectsCount: 1,
          payoutRate: `${payoutPercentage}% Hợp đồng`,
          earnedAmount: payoutAmount,
          bankInfo: 'MB Bank - 0988888888 (Tự động)'
        };
      } else {
        if (!payoutsMap[devName].assignedProjects.includes(inv.id)) {
          payoutsMap[devName].assignedProjects.push(inv.id);
          payoutsMap[devName].totalProjectsCount += 1;
        }
        payoutsMap[devName].earnedAmount += payoutAmount;
      }
    });

    return Object.keys(payoutsMap).map((devName, index) => {
      const existing = currentPayouts.find(p => p.devName === devName);
      const data = payoutsMap[devName];
      return {
        id: existing ? existing.id : `PAY-DEV-0${index + 1}`,
        devName: data.devName,
        devAvatar: existing ? existing.devAvatar : data.devAvatar,
        assignedProjects: data.assignedProjects,
        totalProjectsCount: data.totalProjectsCount,
        payoutRate: data.payoutRate,
        earnedAmount: data.earnedAmount,
        status: existing ? existing.status : 'Chờ duyệt',
        paymentDate: existing ? existing.paymentDate : undefined,
        bankInfo: existing?.bankInfo || data.bankInfo
      };
    });
  };

  // Calculations for Top Stats
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalCost, 0);
  const totalDepositCollected = invoices.reduce((acc, inv) => acc + inv.depositAmount, 0);
  const totalPendingBalance = invoices.reduce((acc, inv) => acc + inv.remainingAmount, 0);
  const totalDevPayouts = devPayouts.reduce((acc, dev) => acc + dev.earnedAmount, 0);

  // States for modals
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    projectName: '',
    studentName: '',
    studentPhone: '',
    studentEmail: '',
    paymentMethod: 'Chuyển khoản Ngân hàng (Vietcombank/MB)',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentNotes: '',
    totalCost: 15000000,
    depositAmount: 7500000,
    assignedDev: ''
  });

  const [payoutNotification, setPayoutNotification] = useState<string | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [orgData] = useState(() => getStoredOrganization());

  // 2FA Verification modal for Dev Payout
  const [show2FAForPayout, setShow2FAForPayout] = useState<DevPayout | null>(null);
  const [twoFactorPassword, setTwoFactorPassword] = useState('');

  // Auto Invoice ID calculation helper
  const nextInvoiceId = `HD-2026-${String(invoices.length + 81).padStart(3, '0')}`;

  // Handlers
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.projectName || !newInvoice.studentName) return;

    const remaining = Math.max(0, newInvoice.totalCost - newInvoice.depositAmount);
    const newId = nextInvoiceId;
    
    const formattedDate = newInvoice.paymentDate 
      ? new Date(newInvoice.paymentDate).toLocaleDateString('vi-VN') 
      : new Date().toLocaleDateString('vi-VN');

    const created: ProjectInvoice = {
      id: newId,
      projectName: newInvoice.projectName.trim(),
      studentName: newInvoice.studentName.trim(),
      studentPhone: newInvoice.studentPhone.trim() || '0900 000 000',
      studentEmail: newInvoice.studentEmail.trim() || `${newInvoice.studentName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      paymentMethod: newInvoice.paymentMethod,
      paymentDate: newInvoice.paymentDate,
      paymentNotes: newInvoice.paymentNotes.trim(),
      totalCost: Number(newInvoice.totalCost),
      depositAmount: Number(newInvoice.depositAmount),
      remainingAmount: remaining,
      status: remaining === 0 ? 'Đã quyết toán' : 'Đã cọc',
      createdDate: formattedDate,
      assignedDev: newInvoice.assignedDev.trim() || 'Chưa bổ nhiệm (Tạm thời để trống)',
      devPayoutPercentage: 35
    };

    const updatedInvoices = [created, ...invoices];
    setInvoices(updatedInvoices);
    setDevPayouts(prev => syncDevPayoutsFromInvoices(updatedInvoices, prev));

    setShowCreateInvoiceModal(false);
    setNewInvoice({
      projectName: '',
      studentName: '',
      studentPhone: '',
      studentEmail: '',
      paymentMethod: 'Chuyển khoản Ngân hàng (Vietcombank/MB)',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentNotes: '',
      totalCost: 15000000,
      depositAmount: 7500000,
      assignedDev: ''
    });

    setPayoutNotification(`✨ Tạo thành công hóa đơn ${newId} (Đã tự động trích 35% thù lao Devs & phát hành phiếu thu)`);
    setTimeout(() => setPayoutNotification(null), 3500);
  };

  // Notifications Calculation
  const { visibleNotifs } = getVisibleNotificationsForUser(currentUser, orgData.heads);
  const userEmail = (currentUser?.email || '').toLowerCase();
  const unreadNotifCount = visibleNotifs.filter(n => !n.readBy || !n.readBy.some(e => (e || '').toLowerCase() === userEmail)).length;

  const handleOpen2FAPayout = (payout: DevPayout) => {
    setShow2FAForPayout(payout);
    setTwoFactorPassword('');
  };

  const handleConfirmPayout2FA = () => {
    if (!twoFactorPassword || !show2FAForPayout) return;
    
    setDevPayouts(prev => prev.map(p => {
      if (p.id === show2FAForPayout.id) {
        return {
          ...p,
          status: 'Đã thanh toán',
          paymentDate: new Date().toLocaleDateString('vi-VN')
        };
      }
      return p;
    }));

    setPayoutNotification(`Đã duyệt & giải ngân thù lao cho ${show2FAForPayout.devName} (${formatVND(show2FAForPayout.earnedAmount)})!`);
    setShow2FAForPayout(null);
    setTwoFactorPassword('');
    setTimeout(() => setPayoutNotification(null), 3500);
  };

  const handleExportCSVReport = () => {
    let csvHeader = "";
    let csvRows = "";
    let filename = "";

    if (activeTab === 'Invoices') {
      filename = `lubpy_invoices_${new Date().toISOString().slice(0, 10)}.csv`;
      csvHeader = "Ma Do An,Ten Do An,Ten Hoc Vien,So Dien Thoai,Tong Chi Phi (VND),Tien Da Coc (VND),Con No (VND),Trang Thai,Ngay Tao,Ky Su Phu Trach\n";
      csvRows = invoices.map(i => 
        `"${i.id}","${i.projectName}","${i.studentName}","${i.studentPhone}",${i.totalCost},${i.depositAmount},${i.remainingAmount},"${i.status}","${i.createdDate}","${i.assignedDev}"`
      ).join("\n");
    } else if (activeTab === 'Payouts') {
      filename = `lubpy_dev_payouts_${new Date().toISOString().slice(0, 10)}.csv`;
      csvHeader = "Ma Ky Su,Ten Ky Su,Do An Dam Nhan,Ty Le Thu Lao,Tong Tien Thu Lao (VND),Ngan Hang,Trang Thai\n";
      csvRows = devPayouts.map(p => 
        `"${p.id}","${p.devName}","${p.assignedProjects.join('; ')}","${p.payoutRate}",${p.earnedAmount},"${p.bankInfo || ''}","${p.status}"`
      ).join("\n");
    } else if (activeTab === 'Reports') {
      filename = `lubpy_cashflow_report_${new Date().toISOString().slice(0, 10)}.csv`;
      csvHeader = "Chi Tieu,Gia Tri (VND),Ghi Chu\n";
      csvRows = [
        `"Tong Doanh Thu Hop Dong",${totalRevenue},"Tong gia tri tat ca hop dong do an"`,
        `"Tien Coc Da Thu (50%)",${totalDepositCollected},"Thuc nhan tai khoan trung gian"`,
        `"Thanh Toan Con Lai (Cho Nghiem Thu)",${totalPendingBalance},"Thu khi ban giao source code"`,
        `"Thu Lao Tra Devs & Chi Phi Van Hanh",${totalDevPayouts},"Quy chi tra cho doi ngu Lap trinh"`,
        `"Doanh Thu Rong",${totalRevenue - totalDevPayouts},"Loi nhuan gop sau tra Dev"`,
        `"Tong So Do An",${invoices.length},"So luong do an da nhan"`
      ].join("\n");
    } else {
      filename = `lubpy_accounting_staff_${new Date().toISOString().slice(0, 10)}.csv`;
      csvHeader = "Ma NV,Ten Nhan Vien,Chuc Danh,Cap Bac,Nhiem Vu,Hoa Don Da Kiem Soat,Tong Tien Da Kiem Soat (VND),Trang Thai\n";
      csvRows = accountingStaffList.map(s => 
        `"${s.id}","${s.name}","${s.title}","${s.level}","${s.assignedScope}",${s.auditedInvoicesCount},${s.auditedAmountVND},"${s.status}"`
      ).join("\n");
    }

    const blob = new Blob(["\uFEFF" + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setPayoutNotification(`Đã xuất file báo cáo CSV (${activeTab === 'Invoices' ? 'Hóa đơn' : activeTab === 'Payouts' ? 'Lương Dev' : activeTab === 'Reports' ? 'Dòng tiền' : 'Nhân sự'}) thành công!`);
    setTimeout(() => setPayoutNotification(null), 3000);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = inv.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        inv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#0d0e10] text-slate-100 font-sans p-4 sm:p-6" id="accounting-dashboard-root">
      
      {/* Toast Notification */}
      {payoutNotification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle className="w-5 h-5 text-slate-950" />
          <span>{payoutNotification}</span>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-500/20">
            L
          </div>
          <div>
            <div className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent uppercase tracking-wider">
                LUBPY FINANCE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold font-mono">
                Enterprise
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">Quản Lý Dòng Tiền & Thù Lao Đồ Án IT</div>
          </div>
        </div>

        {/* Action Controls & User Header */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Mailbox / Notifications */}
          <button 
            onClick={() => setShowNotifModal(true)}
            className="relative p-2.5 bg-slate-800/60 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="Hộp thư thông báo chỉ đạo từ Admin"
          >
            <Mail className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* LUBPY Manager / System Switcher */}
          {onSwitchToSystemManager && (
            <button
              onClick={onSwitchToSystemManager}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              title="Chuyển sang Bảng Quản Lý Hệ Thống LUBPY Studio"
            >
              <Server className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">LUBPY Manager</span>
            </button>
          )}

          {/* Settings Profile Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Cài Đặt Hồ Sơ Cá Nhân (Ảnh đại diện, Họ tên, Ngày sinh, SĐT, Mật khẩu)"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Cài Đặt Hồ Sơ</span>
          </button>

          {/* User Badge */}
          <div 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 pl-2 border-l border-slate-800 cursor-pointer hover:opacity-90 transition-opacity"
            title="Bấm để cập nhật hồ sơ cá nhân"
          >
            <img 
              src={currentUser.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
              alt={currentUser.name} 
              className="w-8 h-8 rounded-full border border-cyan-500/50 object-cover bg-slate-950"
              referrerPolicy="no-referrer"
            />
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-white leading-none">{currentUser.name}</div>
              <div className="text-[10px] text-cyan-400 font-semibold uppercase">{currentUser.departmentTitle || currentUser.role}</div>
            </div>
          </div>

          {/* Logout */}
          <button 
            onClick={onLogout}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 transition-all cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT (Sidebar Menu + Main Dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDEBAR NAVIGATION MENU (Mẫu Ảnh 2) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-5 sticky top-6">
            
            {/* SECTION 1: CHỨC NĂNG CHÍNH */}
            <div>
              <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase mb-3 px-1 flex items-center justify-between">
                <span>CHỨC NĂNG CHÍNH</span>
              </div>
              <div className="space-y-2">
                {[
                  { id: 'Invoices', label: 'Thu Tiền Đồ Án (Invoices)', icon: CreditCard, badge: invoices.length },
                  { id: 'Payouts', label: 'Quyết Toán Lương Dev', icon: Wallet, badge: devPayouts.filter(p => p.status === 'Chờ duyệt').length > 0 ? `${devPayouts.filter(p => p.status === 'Chờ duyệt').length} Chờ` : `${devPayouts.length}` },
                  { id: 'Reports', label: 'Báo Cáo Dòng Tiền', icon: PieChart, badge: 'Chi tiết' },
                  { id: 'Staff', label: 'Nhân Sự Kế Toán', icon: Users, badge: `${accountingStaffList.length} Nhân Sự` },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive 
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 font-black' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                        <span className="truncate">{tab.label}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-emerald-950/20 text-emerald-950 border border-emerald-900/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {tab.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: THAO TÁC NHANH */}
            <div className="pt-3 border-t border-slate-800">
              <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase mb-3 px-1">
                THAO TÁC NHANH
              </div>
              <div className="space-y-2">
                {/* Quick Action 1: + Tạo Hóa Đơn Mới */}
                <button
                  onClick={() => setShowCreateInvoiceModal(true)}
                  className="w-full px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:border-emerald-500 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">+ Tạo Yêu Cầu / Hóa Đơn Mới</span>
                </button>

                {/* Quick Action 2: Xuất Báo Cáo (CSV) */}
                <button
                  onClick={handleExportCSVReport}
                  className="w-full px-3.5 py-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">Xuất Báo Cáo (CSV)</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="lg:col-span-9 space-y-6">

      {/* TOP STATS CARDS (Rebranded for IT Project Accounting) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Card 1: Tổng Doanh Thu Hợp Đồng */}
        <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu Hợp Đồng</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight mb-1">
            {formatVND(totalRevenue)}
          </div>
          <div className={totalRevenue > 0 ? "text-xs text-emerald-400 font-semibold flex items-center gap-1" : "text-xs text-slate-500 font-medium flex items-center gap-1"}>
            {totalRevenue > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
            <span>{totalRevenue > 0 ? '+18.5% so với tháng trước' : '0% so với tháng trước'}</span>
          </div>
        </div>

        {/* Card 2: Tiền Cọc Đã Thu (50%) */}
        <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiền Cọc Đã Thu (50%)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight mb-1">
            {formatVND(totalDepositCollected)}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Thực nhận tài khoản trung gian LUBPY
          </div>
        </div>

        {/* Card 3: Thanh Toán Còn Lại (Chờ Nghiệm Thu) */}
        <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chờ Nghiệm Thu (50%)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight mb-1">
            {formatVND(totalPendingBalance)}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Thu khi bàn giao source code & demo
          </div>
        </div>

        {/* Card 4: Thù Lao Devs & Chi Phí Vận Hành */}
        <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">THÙ LAO DEVS & CHI PHÍ VẬN HÀNH</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400 tracking-tight mb-1">
            {formatVND(totalDevPayouts)}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Tỷ lệ trung bình 35 - 40% giá trị đồ án
          </div>
        </div>

      </div>

      {/* TAB 1: QUẢN LÝ THU TIỀN ĐỒ ÁN */}
      {activeTab === 'Invoices' && (
        <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-5 shadow-xl">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Danh Sách Hóa Đơn / Phiếu Thu Tiền Đồ Án</span>
              </h2>
              <p className="text-xs text-slate-400">Quản lý tiền cọc, nợ đọng và nghiệm thu hợp đồng học viên</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Tìm học viên, tên đồ án, mã..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Đã cọc">Đã cọc</option>
                <option value="Đã nghiệm thu">Đã nghiệm thu</option>
                <option value="Đã quyết toán">Đã quyết toán</option>
              </select>

              {/* Create Invoice Button */}
              <button
                onClick={() => setShowCreateInvoiceModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Hóa Đơn / Thu Tiền Mới</span>
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-[#0a0b0d]">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-300">
                {invoices.length === 0 
                  ? 'Chưa có hóa đơn nào trong hệ thống.' 
                  : 'Không tìm thấy hóa đơn phù hợp với từ khóa hoặc bộ lọc đã chọn.'}
              </div>
              <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {invoices.length === 0 
                  ? 'Nhấn nút "+ Tạo Hóa Đơn / Thu Tiền Mới" trên thanh công cụ góc phải để khởi tạo phiếu thu tiền hợp đồng đầu tiên.' 
                  : 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-[#0a0b0d]">
                    <th className="py-3 px-4 rounded-l-xl">Mã & Tên Đồ Án</th>
                    <th className="py-3 px-4">Học Viên</th>
                    <th className="py-3 px-4">Tổng Chi Phí</th>
                    <th className="py-3 px-4">Đã Cọc (50%)</th>
                    <th className="py-3 px-4">Còn Nợ</th>
                    <th className="py-3 px-4">Kỹ Sư Đảm Nhận</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-all">
                      {/* Mã & Đồ án */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-cyan-400 font-mono text-[11px]">{inv.id}</div>
                        <div className="text-slate-200 font-semibold max-w-xs truncate" title={inv.projectName}>{inv.projectName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>{inv.createdDate}</span>
                          {inv.paymentMethod && <span className="text-slate-600">•</span>}
                          {inv.paymentMethod && <span className="text-slate-400 truncate max-w-[120px]">{inv.paymentMethod.split(' ')[0]}</span>}
                        </div>
                      </td>

                      {/* Học viên */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{inv.studentName}</div>
                        <div className="text-[11px] text-slate-400">{inv.studentPhone}</div>
                        {inv.studentEmail && (
                          <div className="text-[10px] text-cyan-400/80 max-w-[150px] truncate" title={inv.studentEmail}>
                            {inv.studentEmail}
                          </div>
                        )}
                      </td>

                      {/* Tổng chi phí */}
                      <td className="py-4 px-4 font-bold text-white">
                        {formatVND(inv.totalCost)}
                      </td>

                      {/* Đã cọc */}
                      <td className="py-4 px-4 font-semibold text-emerald-400">
                        {formatVND(inv.depositAmount)}
                      </td>

                      {/* Còn nợ */}
                      <td className="py-4 px-4 font-semibold">
                        {inv.remainingAmount > 0 ? (
                          <span className="text-amber-400">{formatVND(inv.remainingAmount)}</span>
                        ) : (
                          <span className="text-slate-500">0 VNĐ (Đã xong)</span>
                        )}
                      </td>

                      {/* Kỹ sư */}
                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {(!inv.assignedDev || inv.assignedDev.includes('Chưa bổ nhiệm') || inv.assignedDev === 'Chưa bổ nhiệm (Tạm thời để trống)') ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-amber-400/90 border border-amber-500/20 text-[11px] font-medium">
                            <UserX className="w-3 h-3 text-amber-400/80" /> Chưa bổ nhiệm (Tạm trống)
                          </span>
                        ) : (
                          <span className="text-slate-200 font-semibold">{inv.assignedDev}</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-4">
                        {inv.status === 'Đã cọc' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                            <Clock className="w-3 h-3" /> Đã cọc ({inv.totalCost > 0 ? Math.round((inv.depositAmount / inv.totalCost) * 100) : 100}%)
                          </span>
                        )}
                        {inv.status === 'Đã nghiệm thu' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-bold">
                            <CheckCircle className="w-3 h-3" /> Đã nghiệm thu
                          </span>
                        )}
                        {inv.status === 'Đã quyết toán' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                            <Shield className="w-3 h-3" /> Đã quyết toán
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 text-right">
                        {inv.remainingAmount > 0 ? (
                          <button
                            onClick={() => {
                              const updatedInvoices = invoices.map(item => item.id === inv.id ? { ...item, remainingAmount: 0, status: 'Đã quyết toán' as const } : item);
                              setInvoices(updatedInvoices);
                              setDevPayouts(prev => syncDevPayoutsFromInvoices(updatedInvoices, prev));
                              setPayoutNotification(`Đã ghi nhận thu đủ 100% tiền đồ án ${inv.id} (Tự động cập nhật hồ sơ quyết toán)`);
                              setTimeout(() => setPayoutNotification(null), 3000);
                            }}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Thu nốt 50%
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Đã hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUYẾT TOÁN LƯƠNG & THÙ LAO KỸ SƯ */}
      {activeTab === 'Payouts' && (
        <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                <span>Bảng Quyết Toán Lương / Thù Lao Kỹ Sư LUBPY</span>
              </h2>
              <p className="text-xs text-slate-400">Thù lao chi trả cho Đội ngũ Developer thực hiện đồ án</p>
            </div>

            <div className="text-xs text-slate-400 bg-[#0a0b0d] px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Yêu cầu xác minh 2FA Kế toán trưởng trước khi chuyển khoản giải ngân</span>
            </div>
          </div>

          {devPayouts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-[#0a0b0d]">
              <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-300">Chưa có danh sách quyết toán thù lao kỹ sư</div>
              <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Dự án đang trong quá trình khởi tạo nên chưa có dữ liệu chi trả thù lao. Danh sách sẽ tự động được ghi nhận khi có hóa đơn đồ án mới được tạo.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-[#0a0b0d]">
                    <th className="py-3 px-4 rounded-l-xl">Kỹ Sư Lập Trình</th>
                    <th className="py-3 px-4">Đồ Án Đảm Nhận</th>
                    <th className="py-3 px-4">Tỷ Lệ Mức Thù Lao</th>
                    <th className="py-3 px-4">Tổng Tiền Thù Lao</th>
                    <th className="py-3 px-4">Thông Tin Ngân Hàng</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">Duyệt Chi Khẩn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {devPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-slate-800/40 transition-all">
                      {/* Kỹ sư */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={payout.devAvatar} 
                            alt={payout.devName} 
                            className="w-9 h-9 rounded-full border border-purple-500/40 bg-slate-800"
                          />
                          <div>
                            <div className="font-bold text-white">{payout.devName}</div>
                            <div className="text-[10px] text-purple-400 font-mono">{payout.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Đồ án đảm nhận */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {payout.assignedProjects.map(pCode => (
                            <span key={pCode} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px] font-bold">
                              {pCode}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">{payout.totalProjectsCount} Đồ án</div>
                      </td>

                      {/* Tỷ lệ */}
                      <td className="py-4 px-4 font-semibold text-slate-300">
                        {payout.payoutRate}
                      </td>

                      {/* Tiền thù lao */}
                      <td className="py-4 px-4 font-black text-purple-300 text-sm">
                        {formatVND(payout.earnedAmount)}
                      </td>

                      {/* Ngân hàng */}
                      <td className="py-4 px-4 text-slate-400 text-[11px] font-mono">
                        {payout.bankInfo || 'Chưa cập nhật'}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-4">
                        {payout.status === 'Chờ duyệt' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                            <Clock className="w-3 h-3" /> Chờ duyệt chi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                            <CheckCircle className="w-3 h-3" /> Đã thanh toán ({payout.paymentDate})
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 text-right">
                        {payout.status === 'Chờ duyệt' ? (
                          <button
                            onClick={() => handleOpen2FAPayout(payout)}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-600/20"
                          >
                            Duyệt Chi (2FA)
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Hoàn thành
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BÁO CÁO DOANH THU & DÒNG TIỀN */}
      {activeTab === 'Reports' && (
        <div className="space-y-6">
          <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-cyan-400" />
                  <span>Báo Cáo Doanh Thu & Dòng Tiền LUBPY</span>
                </h2>
                <p className="text-xs text-slate-400">Thống kê chi tiết tài chính dịch vụ hỗ trợ đồ án công nghệ thông tin</p>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-medium">Kỳ báo cáo:</span>
                <select
                  value={reportTimeRange}
                  onChange={(e) => setReportTimeRange(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-[#0a0b0d] text-cyan-300 border border-slate-800 font-bold text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="this_month">Tháng này (08/2026)</option>
                  <option value="last_month">Tháng trước (07/2026)</option>
                  <option value="this_quarter">Quý 3/2026</option>
                  <option value="this_year">Năm 2026</option>
                </select>
              </div>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0a0b0d] p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Tổng Số Đồ Án Đã Nhận</div>
                <div className="text-2xl font-black text-white">{invoices.length} Đồ Án</div>
                <div className="text-[11px] text-emerald-400 mt-1">
                  {invoices.length > 0 ? '100% Học viên đã đặt cọc' : 'Chưa có hợp đồng nào'}
                </div>
              </div>

              <div className="bg-[#0a0b0d] p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Doanh Thu Ròng (Sau Trả Dev)</div>
                <div className="text-2xl font-black text-cyan-400">{formatVND(totalRevenue - totalDevPayouts)}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {totalRevenue > 0 ? 'Lợi nhuận gộp xấp xỉ 65%' : '0 VNĐ'}
                </div>
              </div>

              <div className="bg-[#0a0b0d] p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Tỷ Lệ Hoàn Thành Đồ Án</div>
                <div className="text-2xl font-black text-emerald-400">{invoices.length > 0 ? '98.5%' : '100%'}</div>
                <div className="text-[11px] text-slate-400 mt-1">Sẵn sàng nhận hợp đồng mới</div>
              </div>
            </div>

            {/* Monthly Chart Bar Mockup */}
            <div className="bg-[#0a0b0d] p-5 rounded-xl border border-slate-800">
              <div className="text-sm font-bold text-slate-200 mb-4 flex items-center justify-between">
                <span>Biểu Đồ Doanh Thu LUBPY STUDIO (VNĐ)</span>
                <span className="text-xs text-slate-500 font-normal">Đơn vị: VNĐ</span>
              </div>

              <div className="space-y-4">
                {/* Tháng 07/2026 */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold">
                    <span className="text-cyan-400">Tháng 07/2026 (Tháng Hiện Tại)</span>
                    <span className="text-white">{formatVND(totalRevenue)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: totalRevenue > 0 ? '85%' : '0%' }}></div>
                  </div>
                </div>

                {/* Tháng 08/2026 (Dự báo) */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold">
                    <span className="text-slate-400">Tháng 08/2026 (Dự kiến Đợt Bảo Vệ Kế Tiếp)</span>
                    <span className="text-slate-300">{formatVND(totalPendingBalance)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500" style={{ width: totalPendingBalance > 0 ? '50%' : '0%' }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleExportCSVReport}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 Xuất Báo Cáo CSV Chi Tiết</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNTING STAFF & AUDIT SYNC (SYNCED FROM HR) */}
      {activeTab === 'Staff' && (
        <div className="space-y-6" id="accounting-staff-tab">
          <div className="bg-[#14161a] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>Đội Ngũ Nhân Sự Kế Toán & Đối Soát Doanh Thu / Lương</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Dữ liệu nhân sự được đồng bộ tự động trực tiếp từ HR Dashboard & Tài khoản hệ thống</p>
              </div>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold rounded-xl">
                {accountingStaffList.length} Nhân Sự Khả Dụng
              </span>
            </div>

            {accountingStaffList.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-[#0a0b0d]">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-xs text-slate-400">Chưa có nhân sự thuộc Nghiệp vụ Kế Toán & Tài Chính nào trong HR Dashboard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountingStaffList.map((staff) => (
                  <div key={staff.id} className="bg-[#0a0b0d] border border-slate-800 hover:border-cyan-500/40 rounded-xl p-5 transition-all space-y-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <img 
                        src={staff.avatarUrl} 
                        alt={staff.name} 
                        className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-cyan-500/30"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>{staff.name}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono rounded">
                            {staff.id}
                          </span>
                        </h4>
                        <p className="text-xs text-cyan-400 font-medium">{staff.title}</p>
                        <span className="inline-block text-[10px] text-slate-400 font-mono mt-0.5">{staff.level}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Nhiệm Vụ Phân Công:</span>
                        <span className="text-slate-200 font-semibold truncate max-w-[180px] text-right" title={staff.assignedScope}>
                          {staff.assignedScope}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Hóa Đơn Đã Đối Soát:</span>
                        <span className="text-cyan-400 font-bold font-mono">{staff.auditedInvoicesCount} Hóa Đơn</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Tổng Tiền Đã Đối Soát:</span>
                        <span className="text-emerald-400 font-bold font-mono">{formatVND(staff.auditedAmountVND)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Trạng Thái Làm Việc:</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded text-[10px]">
                          🟢 {staff.status}
                        </span>
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
        </div>
      )}
        </div> {/* Close lg:col-span-9 */}
      </div> {/* Close grid container */}

      {/* MODAL: TẠO HÓA ĐƠN THU TIỀN MỚI CHUẨN KẾ TOÁN */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14161a] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowCreateInvoiceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-2 pr-8">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Tạo Hóa Đơn / Phiếu Thu Tiền Đồ Án</span>
              </h3>
              <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 font-mono font-bold text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Mã: {nextInvoiceId}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-5">Nhập đầy đủ thông tin chứng từ tài chính & hạch toán phiếu thu điện tử</p>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              {/* Tên Đồ Án */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tên Đồ Án CNTT <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Website Bán Hàng Microservices Spring Boot & React"
                  value={newInvoice.projectName}
                  onChange={(e) => setNewInvoice({ ...newInvoice, projectName: e.target.value })}
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              {/* Tên Học Viên & Số Điện Thoại */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tên Học Viên <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nguyễn Văn A"
                    value={newInvoice.studentName}
                    onChange={(e) => setNewInvoice({ ...newInvoice, studentName: e.target.value })}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Số Điện Thoại <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="0912 345 678"
                    value={newInvoice.studentPhone}
                    onChange={(e) => setNewInvoice({ ...newInvoice, studentPhone: e.target.value })}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>

              {/* Email & Ngày Thu Tiền */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Email Học Viên (Gửi E-Invoice)</span>
                  </label>
                  <input 
                    type="email" 
                    placeholder="hocvien@gmail.com"
                    value={newInvoice.studentEmail}
                    onChange={(e) => setNewInvoice({ ...newInvoice, studentEmail: e.target.value })}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ngày Lập Hóa Đơn / Thu Tiền <span className="text-rose-500">*</span></span>
                  </label>
                  <input 
                    type="date" 
                    required
                    value={newInvoice.paymentDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, paymentDate: e.target.value })}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                  />
                </div>
              </div>

              {/* Phương Thức Thanh Toán & Mã Giao Dịch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Phương Thức Thanh Toán <span className="text-rose-500">*</span></span>
                  </label>
                  <select 
                    value={newInvoice.paymentMethod}
                    onChange={(e) => setNewInvoice({ ...newInvoice, paymentMethod: e.target.value })}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                  >
                    <option value="Chuyển khoản Ngân hàng (Vietcombank/MB)">Chuyển khoản Ngân hàng (CK)</option>
                    <option value="Tiền mặt trực tiếp (Cash)">Tiền mặt trực tiếp (Quỹ)</option>
                    <option value="Cổng Ví Điện Tử (MoMo / VNPay / ZaloPay)">Ví Điện Tử (MoMo / VNPay)</option>
                    <option value="Thẻ Quốc Tế (Visa / Mastercard)">Thẻ Quốc Tế (Visa/Master)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mã Giao Dịch / Ghi Chú Chứng Từ</label>
                  <input 
                    type="text" 
                    placeholder="MGD: 987654 - CK Vietcombank"
                    value={newInvoice.paymentNotes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, paymentNotes: e.target.value })}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>

              {/* Chi Phí & Tiền Cọc (Auto 50%) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tổng Chi Phí Hợp Đồng (VNĐ) <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    step={500000}
                    value={newInvoice.totalCost}
                    onChange={(e) => {
                      const cost = Number(e.target.value);
                      setNewInvoice({ 
                        ...newInvoice, 
                        totalCost: cost,
                        depositAmount: Math.round(cost * 0.5)
                      });
                    }}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-amber-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tiền Cọc Thu Ngay (Tự động 50%) <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    step={500000}
                    value={newInvoice.depositAmount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, depositAmount: Number(e.target.value) })}
                    className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-emerald-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Kỹ Sư Bổ Nhiệm */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Kỹ Sư Lập Trình Phụ Trách</label>
                <input
                  type="text"
                  value={newInvoice.assignedDev}
                  onChange={(e) => setNewInvoice({ ...newInvoice, assignedDev: e.target.value })}
                  placeholder="Chưa bổ nhiệm (Tạm thời để trống)"
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-medium placeholder:text-slate-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Có thể tạm thời để trống do chưa bổ nhiệm nhân sự. Trích thù lao 35% sẽ tự động hạch toán cho Kỹ sư phụ trách.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Tạo Hóa Đơn & Gửi Phiếu Thu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 2FA XÁC THỰC GIẢI NGÂN THÙ LAO */}
      {show2FAForPayout && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14161a] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShow2FAForPayout(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white mb-1">Xác Thực 2FA Duyệt Chi Lương</h3>
            <p className="text-xs text-slate-400 mb-4">
              Bạn đang thực hiện giải ngân thù lao cho <span className="text-white font-bold">{show2FAForPayout.devName}</span> với số tiền <span className="text-purple-400 font-bold">{formatVND(show2FAForPayout.earnedAmount)}</span>.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Mật khẩu PIN Kế toán trưởng / OTP 2FA</label>
                <input 
                  type="password"
                  placeholder="Nhập 123456 hoặc mật khẩu bảo mật..."
                  value={twoFactorPassword}
                  onChange={(e) => setTwoFactorPassword(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FAForPayout(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout2FA}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  Xác Nhận Giải Ngân
                </button>
              </div>
            </div>
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
          onTriggerToast={(msg) => {
            setPayoutNotification(msg);
            setTimeout(() => setPayoutNotification(null), 3500);
          }}
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
            setPayoutNotification("🎉 Đã cập nhật hồ sơ cá nhân thành công!");
            setTimeout(() => setPayoutNotification(null), 3500);
          }}
          onTriggerToast={(msg) => {
            setPayoutNotification(msg);
            setTimeout(() => setPayoutNotification(null), 3500);
          }}
        />
      )}

    </div>
  );
}
