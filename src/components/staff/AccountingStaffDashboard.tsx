import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownLeft, Send, Download, Search, 
  Calendar, CreditCard, Filter, ChevronDown, CheckCircle2, AlertCircle, 
  Mail, LogOut, Edit2, Shield, User as UserIcon, RefreshCw, Zap, Settings,
  PieChart, TrendingUp, Wallet, Layers, Eye, PlusCircle, BellRing, Copy,
  Printer, FileText, Check, Phone, UserCheck, Clock, ExternalLink, Sparkles,
  BarChart3, MoreVertical, Menu, X, ArrowRight, MessageSquare, Receipt,
  CheckSquare, FileSpreadsheet, AlertTriangle, ChevronRight, Building2
} from 'lucide-react';
import { User } from '../../types';
import { getStoredOrganization } from '../../utils/organizationStore';
import { getVisibleNotificationsForUser } from '../../utils/notificationStore';
import NotificationMailboxModal from '../NotificationMailboxModal';
import UserProfileModal from '../UserProfileModal';
import { formatVND } from '../../utils/currency';
import { fetchTransactionsFromDb, createTransactionInDb, fetchFinancialSummaryFromDb } from '../../utils/apiClient';

interface AccountingStaffDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onSwitchToManagerView?: () => void;
  onSwitchToSystemManager?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export interface ProjectFinancialItem {
  id: string;
  code: string;
  name: string;
  studentName: string;
  studentPhone: string;
  university: string;
  totalContract: number; // VNĐ
  paidAmount: number; // VNĐ
  ktvFee: number; // VNĐ
  ktvName: string;
  ktvStatus: 'Đã giải ngân' | 'Chờ duyệt' | 'Chưa duyệt';
  paymentStatus: 'Chưa cọc' | 'Đã cọc 50%' | 'Đã tất toán 100%';
  dueDate: string;
  lastPaymentDate?: string;
  bankTransactionCode?: string;
  notes?: string;
}

type TabKey = 'overview' | 'debts' | 'ktv_payout' | 'ledger' | 'reports';

const INITIAL_PROJECTS: ProjectFinancialItem[] = [];

function CreatePaymentModalContent({
  setShowCreatePaymentModal,
  receiptForm,
  setReceiptForm,
  projects,
  handleCreatePaymentSubmit,
}: {
  setShowCreatePaymentModal: (val: boolean) => void;
  receiptForm: any;
  setReceiptForm: React.Dispatch<React.SetStateAction<any>>;
  projects: ProjectFinancialItem[];
  handleCreatePaymentSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const selectedProj = projects.find(p => p.code === receiptForm.projectCode) || projects[0];
  const remDebt = selectedProj ? Math.max(0, selectedProj.totalContract - selectedProj.paidAmount) : 0;
  const currentAmountNum = parseInt(receiptForm.amount.replace(/[^0-9]/g, ''), 10) || 0;
  const isExceeding = currentAmountNum > remDebt && remDebt > 0;

  const filteredProjsForSelect = projects.filter(p => {
    const q = receiptForm.searchProjectTerm.toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.studentName.toLowerCase().includes(q) ||
      p.studentPhone.includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#14161c] border border-[#2a2d39] rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-5 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#262a36] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Ghi Nhận Thanh Toán &amp; Tạo Phiếu Thu</span>
              </h3>
              <p className="text-xs text-gray-400">Nghiệp vụ lập phiếu thu tiền đồ án dịch vụ Lubpy Studio</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreatePaymentModal(false)} 
            className="p-2 text-gray-400 hover:text-white bg-[#1a1d26] hover:bg-[#252836] rounded-xl border border-[#2e3342] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreatePaymentSubmit} className="space-y-5 text-xs">
          
          {/* 2-COLUMN SPLIT LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: PROJECT SELECTION & STUDENT PREVIEW */}
            <div className="space-y-4 bg-[#181a22] p-4 rounded-xl border border-[#282c39]">
              
              {/* Receipt Code Display with Regenerate */}
              <div className="flex items-center justify-between bg-[#1c1e28] p-2.5 rounded-xl border border-[#2e3342]">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono block">MÃ PHIẾU THU TỰ ĐỘNG</span>
                  <span className="font-mono font-bold text-orange-400 text-sm tracking-wider">{receiptForm.receiptCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptForm((prev: any) => ({ ...prev, receiptCode: `PT-${Date.now().toString().slice(-6)}` }))}
                  className="p-1.5 bg-[#252836] hover:bg-[#2e3346] text-gray-300 rounded-lg transition-colors cursor-pointer"
                  title="Tạo mã mới"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search & Select Project */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  Chọn Đồ Án / Sinh Viên <span className="text-rose-400">*</span>
                </label>
                
                {/* Search Filter input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Lọc nhanh Mã DA, Tên SV, SĐT..."
                    value={receiptForm.searchProjectTerm}
                    onChange={(e) => setReceiptForm({ ...receiptForm, searchProjectTerm: e.target.value })}
                    className="w-full bg-[#1c1e28] border border-[#2e3342] text-white text-[11px] pl-8 pr-3 py-1.5 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <select
                  value={receiptForm.projectCode}
                  onChange={(e) => {
                    const proj = projects.find(p => p.code === e.target.value);
                    const defaultAmt = proj ? Math.max(0, proj.totalContract - proj.paidAmount) : 0;
                    setReceiptForm({
                      ...receiptForm,
                      projectCode: e.target.value,
                      amount: defaultAmt > 0 ? defaultAmt.toString() : '1000000'
                    });
                  }}
                  className="w-full bg-[#1c1e28] border border-[#2e3342] text-white p-2.5 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                >
                  {filteredProjsForSelect.map(p => (
                    <option key={p.id} value={p.code}>
                      {p.code} - {p.name} ({p.studentName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Project Card Details */}
              {selectedProj && (
                <div className="p-3.5 bg-[#12141a] rounded-xl border border-[#262a36] space-y-2 text-[11px]">
                  <div className="flex items-center justify-between border-b border-[#222532] pb-2">
                    <span className="font-mono font-bold text-orange-400">{selectedProj.code}</span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-[10px] font-bold">
                      {selectedProj.paymentStatus}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px]">TÊN ĐỀ TÀI</span>
                    <span className="text-white font-bold block">{selectedProj.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#222532]">
                    <div>
                      <span className="text-gray-400 block text-[10px]">SINH VIÊN</span>
                      <span className="text-gray-200 font-bold block">{selectedProj.studentName}</span>
                      <span className="text-gray-400 text-[10px] font-mono">{selectedProj.studentPhone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">TRƯỜNG</span>
                      <span className="text-gray-300 block">{selectedProj.university}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[#171a22] rounded-lg border border-[#252834] space-y-1 font-mono pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tổng Hợp Đồng:</span>
                      <span className="text-white font-bold">{formatVND(selectedProj.totalContract)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Đã Thanh Toán:</span>
                      <span className="text-emerald-400 font-bold">{formatVND(selectedProj.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#2a2d3d] pt-1">
                      <span className="text-rose-300 font-bold">Số Tiền Còn Nợ:</span>
                      <span className="text-rose-400 font-black">{formatVND(remDebt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: AMOUNT, QUICK SUGGESTIONS & PAYMENT METHOD */}
            <div className="space-y-4">
              
              {/* Amount Input & Quick Suggestion Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-300 font-bold">
                    Số Tiền Thu (VNĐ) <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    {currentAmountNum > 0 ? formatVND(currentAmountNum) : ''}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Ví dụ: 9.250.000"
                  value={receiptForm.amount}
                  onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                  className="w-full bg-[#1c1e28] border border-[#2e3342] text-emerald-400 font-mono font-black p-2.5 rounded-xl text-base focus:border-orange-500 focus:outline-none"
                  required
                />

                {/* Quick Buttons */}
                {selectedProj && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-gray-400 font-mono">Gợi ý:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const amt = Math.round(selectedProj.totalContract * 0.3);
                        setReceiptForm({ ...receiptForm, amount: amt.toString() });
                      }}
                      className="px-2 py-1 bg-[#1c1e28] hover:bg-[#252836] text-sky-400 border border-sky-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Cọc 30% ({formatVND(Math.round(selectedProj.totalContract * 0.3))})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const amt = Math.round(selectedProj.totalContract * 0.5);
                        setReceiptForm({ ...receiptForm, amount: amt.toString() });
                      }}
                      className="px-2 py-1 bg-[#1c1e28] hover:bg-[#252836] text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Cọc 50% ({formatVND(Math.round(selectedProj.totalContract * 0.5))})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptForm({ ...receiptForm, amount: remDebt.toString() });
                      }}
                      className="px-2 py-1 bg-[#1c1e28] hover:bg-[#252836] text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Tất Toán ({formatVND(remDebt)})
                    </button>
                  </div>
                )}

                {/* RED EXCEEDING WARNING */}
                {isExceeding && (
                  <div className="mt-2.5 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      Cảnh báo: Số tiền thu (<b>{formatVND(currentAmountNum)}</b>) vượt quá số tiền nợ còn lại (<b>{formatVND(remDebt)}</b>).
                    </span>
                  </div>
                )}
              </div>

              {/* Hình Thức Thanh Toán (Radio Buttons) */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5">
                  Hình Thức Thanh Toán <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setReceiptForm({ ...receiptForm, paymentMethod: 'bank' })}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      receiptForm.paymentMethod === 'bank'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-[#1c1e28] border-[#2e3342] text-gray-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Banking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptForm({ ...receiptForm, paymentMethod: 'cash' })}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      receiptForm.paymentMethod === 'cash'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-[#1c1e28] border-[#2e3342] text-gray-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Tiền Mặt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptForm({ ...receiptForm, paymentMethod: 'e_wallet' })}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      receiptForm.paymentMethod === 'e_wallet'
                        ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                        : 'bg-[#1c1e28] border-[#2e3342] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Ví Điện Tử</span>
                  </button>
                </div>

                {/* Payment Method Details Conditional Sub-Fields */}
                {receiptForm.paymentMethod === 'bank' && (
                  <div className="p-3 bg-[#181a22] rounded-xl border border-[#282c39] space-y-2.5">
                    <div>
                      <label className="block text-gray-300 text-[11px] font-bold mb-1">Tài Khoản Ngân Hàng Nhận</label>
                      <select
                        value={receiptForm.bankAccount}
                        onChange={(e) => setReceiptForm({ ...receiptForm, bankAccount: e.target.value })}
                        className="w-full bg-[#1c1e28] border border-[#2e3342] text-white p-2 rounded-lg text-xs"
                      >
                        <option value="MBBank - 999988883333 (Lubpy Studio)">MBBank - 999988883333 (Lubpy Studio)</option>
                        <option value="Vietcombank - 001100889999 (Lubpy Studio)">Vietcombank - 001100889999 (Lubpy Studio)</option>
                        <option value="Techcombank - 190388822211 (Lubpy Studio)">Techcombank - 190388822211 (Lubpy Studio)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-[11px] font-bold mb-1">Mã Giao Dịch Banking</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: FT2608119901"
                        value={receiptForm.transactionRef}
                        onChange={(e) => setReceiptForm({ ...receiptForm, transactionRef: e.target.value })}
                        className="w-full bg-[#1c1e28] border border-[#2e3342] text-white font-mono p-2 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {receiptForm.paymentMethod === 'cash' && (
                  <div className="p-3 bg-[#181a22] rounded-xl border border-[#282c39] space-y-2.5">
                    <div>
                      <label className="block text-gray-300 text-[11px] font-bold mb-1">Họ Tên Người Thu Tiền Mặt</label>
                      <input
                        type="text"
                        value={receiptForm.cashCollector}
                        onChange={(e) => setReceiptForm({ ...receiptForm, cashCollector: e.target.value })}
                        className="w-full bg-[#1c1e28] border border-[#2e3342] text-white p-2 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>
                )}

                {receiptForm.paymentMethod === 'e_wallet' && (
                  <div className="p-3 bg-[#181a22] rounded-xl border border-[#282c39] space-y-2.5">
                    <div>
                      <label className="block text-gray-300 text-[11px] font-bold mb-1">Ví Điện Tử</label>
                      <select
                        value={receiptForm.walletProvider}
                        onChange={(e) => setReceiptForm({ ...receiptForm, walletProvider: e.target.value as any })}
                        className="w-full bg-[#1c1e28] border border-[#2e3342] text-white p-2 rounded-lg text-xs"
                      >
                        <option value="MoMo">Ví MoMo (0988.123.456 - Lubpy Studio)</option>
                        <option value="ZaloPay">Ví ZaloPay (0988.123.456 - Lubpy Studio)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-[11px] font-bold mb-1">Mã Giao Dịch Ví</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: MM-8819203"
                        value={receiptForm.transactionRef}
                        onChange={(e) => setReceiptForm({ ...receiptForm, transactionRef: e.target.value })}
                        className="w-full bg-[#1c1e28] border border-[#2e3342] text-white font-mono p-2 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Mục Đích Thu */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Mục Đích Thu Tiền</label>
                <select
                  value={receiptForm.purpose}
                  onChange={(e) => setReceiptForm({ ...receiptForm, purpose: e.target.value as any })}
                  className="w-full bg-[#1c1e28] border border-[#2e3342] text-white p-2.5 rounded-xl text-xs font-bold focus:border-orange-500 focus:outline-none"
                >
                  <option value="Tiền cọc ban đầu">Tiền cọc ban đầu (30% - 50%)</option>
                  <option value="Tất toán hợp đồng">Tất toán hợp đồng (100%)</option>
                  <option value="Phụ phí làm thêm Slide/Poster">Phụ phí làm thêm Slide/Poster</option>
                  <option value="Phụ phí sửa bài quá hạn">Phụ phí sửa bài quá hạn hợp đồng</option>
                </select>
              </div>

              {/* Ghi Chú / Diễn Giải */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Diễn Giải / Ghi Chú</label>
                <input
                  type="text"
                  placeholder="Nội dung ghi chú thêm..."
                  value={receiptForm.note}
                  onChange={(e) => setReceiptForm({ ...receiptForm, note: e.target.value })}
                  className="w-full bg-[#1c1e28] border border-[#2e3342] text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

            </div>
          </div>

          {/* Form Buttons */}
          <div className="pt-3 border-t border-[#262a36] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreatePaymentModal(false)}
              className="px-5 py-2.5 bg-[#1f222b] hover:bg-[#282c38] text-gray-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Xác Nhận Thu Tiền</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default function AccountingStaffDashboard({
  user,
  onLogout,
  language,
  onSwitchToManagerView,
  onSwitchToSystemManager,
  onUpdateUser
}: AccountingStaffDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [timeFilter, setTimeFilter] = useState<'30days' | 'quarter' | 'year2026'>('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'chua_coc' | 'con_no' | 'tat_toan'>('all');

  // Modal controls
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Projects State stored in local storage
  const [projects, setProjects] = useState<ProjectFinancialItem[]>(() => {
    try {
      const saved = localStorage.getItem('lubpy_accounting_projects');
      if (saved) {
        const parsed: ProjectFinancialItem[] = JSON.parse(saved);
        return parsed.filter(p => !['prj-101', 'prj-102', 'prj-103', 'prj-104', 'prj-105', 'prj-106'].includes(p.id));
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lubpy_accounting_projects', JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  // Helper to generate dynamic auto-increment style receipt code
  const generateReceiptCode = () => {
    const today = new Date();
    const YYYY = today.getFullYear();
    const MM = String(today.getMonth() + 1).padStart(2, '0');
    const DD = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(10 + Math.random() * 90);
    return `PT-${YYYY}${MM}${DD}-${rand}`;
  };

  // Action Modals
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    receiptCode: generateReceiptCode(),
    projectCode: 'DA-102',
    searchProjectTerm: '',
    amount: '9250000',
    paymentMethod: 'bank' as 'bank' | 'cash' | 'e_wallet',
    bankAccount: 'MBBank - 999988883333 (Lubpy Studio)',
    transactionRef: `FT${Date.now().toString().slice(-8)}`,
    cashCollector: user.name || 'Lê Hoàng Minh',
    walletProvider: 'MoMo' as 'MoMo' | 'ZaloPay',
    purpose: 'Tiền cọc ban đầu' as 'Tiền cọc ban đầu' | 'Tất toán hợp đồng' | 'Phụ phí làm thêm Slide/Poster' | 'Phụ phí sửa bài quá hạn',
    note: 'Sinh viên chuyển khoản cọc làm đồ án'
  });

  const [successReceiptModal, setSuccessReceiptModal] = useState<{
    receiptCode: string;
    project: ProjectFinancialItem;
    paidAmountSubmitted: number;
    paymentMethodLabel: string;
    refCode: string;
    purpose: string;
    collector: string;
    date: string;
    note: string;
    previousPaid: number;
    newTotalPaid: number;
    remainingDebt: number;
  } | null>(null);

  const openCreatePaymentModal = (projCode?: string) => {
    const code = generateReceiptCode();
    const defaultCode = projCode || projects[0]?.code || 'DA-102';
    const targetProj = projects.find(p => p.code === defaultCode) || projects[0];
    const remDebt = targetProj ? Math.max(0, targetProj.totalContract - targetProj.paidAmount) : 0;

    setReceiptForm({
      receiptCode: code,
      projectCode: defaultCode,
      searchProjectTerm: '',
      amount: remDebt > 0 ? remDebt.toString() : '1000000',
      paymentMethod: 'bank',
      bankAccount: 'MBBank - 999988883333 (Lubpy Studio)',
      transactionRef: `FT${Date.now().toString().slice(-8)}`,
      cashCollector: currentUser.name || 'Lê Hoàng Minh',
      walletProvider: 'MoMo',
      purpose: 'Tiền cọc ban đầu',
      note: 'Sinh viên chuyển khoản cọc đồ án'
    });
    setShowCreatePaymentModal(true);
  };

  const [showKtvPayoutModal, setShowKtvPayoutModal] = useState(false);
  const [ktvForm, setKtvForm] = useState({
    projectCode: 'DA-102',
    ktvName: 'Lê Hoàng KTV - Mobile/AI',
    payoutAmount: '8000000',
    bankInfo: 'MBBank - 999988883333',
    transactionCode: 'FT2608109922'
  });

  // Table row actions
  const [quickPayProject, setQuickPayProject] = useState<ProjectFinancialItem | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState('');
  const [quickPayBankRef, setQuickPayBankRef] = useState('');

  const [reminderProject, setReminderProject] = useState<ProjectFinancialItem | null>(null);
  const [invoiceProject, setInvoiceProject] = useState<ProjectFinancialItem | null>(null);
  const [activeActionDropdown, setActiveActionDropdown] = useState<string | null>(null);

  const orgData = getStoredOrganization();
  const accHead = orgData.heads.accounting;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync with DB if available
  useEffect(() => {
    const loadDb = async () => {
      try {
        await fetchFinancialSummaryFromDb();
        await fetchTransactionsFromDb();
      } catch (e) {}
    };
    loadDb();
  }, []);

  // Calculate 4 Core Financial Metrics
  const metrics = useMemo(() => {
    let multiplier = 1;
    if (timeFilter === 'quarter') multiplier = 2.4;
    if (timeFilter === 'year2026') multiplier = 5.2;

    const baseRevenue = projects.reduce((acc, p) => acc + p.paidAmount, 0);
    const revenueThisMonth = Math.round(baseRevenue * (timeFilter === '30days' ? 1 : multiplier));

    const debtToCollect = projects.reduce((acc, p) => {
      return acc + Math.max(0, p.totalContract - p.paidAmount);
    }, 0);

    const depositCollected = projects
      .filter(p => p.paidAmount > 0)
      .reduce((acc, p) => acc + (p.paymentStatus === 'Đã cọc 50%' ? p.paidAmount : Math.round(p.totalContract * 0.5)), 0);

    const ktvDisbursedTotal = projects
      .filter(p => p.ktvStatus === 'Đã giải ngân')
      .reduce((acc, p) => acc + p.ktvFee, 0);

    const unpaidCount = projects.filter(p => (p.totalContract - p.paidAmount) > 0).length;

    return {
      revenueThisMonth,
      debtToCollect,
      depositCollected,
      ktvDisbursedTotal,
      unpaidCount
    };
  }, [projects, timeFilter]);

  // Filtered Projects for Main Table
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        p.studentPhone.includes(q) ||
        p.university.toLowerCase().includes(q) ||
        p.ktvName.toLowerCase().includes(q);

      const debt = p.totalContract - p.paidAmount;
      let matchesBadge = true;
      if (badgeFilter === 'chua_coc') matchesBadge = p.paymentStatus === 'Chưa cọc';
      if (badgeFilter === 'con_no') matchesBadge = debt > 0;
      if (badgeFilter === 'tat_toan') matchesBadge = p.paymentStatus === 'Đã tất toán 100%';

      return matchesSearch && matchesBadge;
    });
  }, [projects, searchQuery, badgeFilter]);

  // Create payment receipt submit
  const handleCreatePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = projects.find(p => p.code === receiptForm.projectCode) || projects[0];
    if (!targetProject) {
      triggerToast('⚠️ Không tìm thấy thông tin đồ án.');
      return;
    }

    const payNum = parseInt(receiptForm.amount.replace(/[^0-9]/g, ''), 10);
    if (!payNum || payNum <= 0) {
      triggerToast('⚠️ Vui lòng nhập số tiền thanh toán hợp lệ (VNĐ).');
      return;
    }

    let paymentMethodLabel = 'Chuyển khoản Ngân hàng';
    let refCode = receiptForm.transactionRef || `FT${Date.now().toString().slice(-6)}`;

    if (receiptForm.paymentMethod === 'bank') {
      paymentMethodLabel = `Banking (${receiptForm.bankAccount.split(' - ')[0]})`;
    } else if (receiptForm.paymentMethod === 'cash') {
      paymentMethodLabel = `Tiền mặt (${receiptForm.cashCollector})`;
      refCode = `TM-${Date.now().toString().slice(-6)}`;
    } else if (receiptForm.paymentMethod === 'e_wallet') {
      paymentMethodLabel = `Ví điện tử ${receiptForm.walletProvider}`;
    }

    // Update Project State
    const newPaid = targetProject.paidAmount + payNum;
    const finalPaid = Math.min(newPaid, targetProject.totalContract);
    let newStatus: 'Chưa cọc' | 'Đã cọc 50%' | 'Đã tất toán 100%' = targetProject.paymentStatus;
    if (finalPaid >= targetProject.totalContract) {
      newStatus = 'Đã tất toán 100%';
    } else if (finalPaid > 0) {
      newStatus = 'Đã cọc 50%';
    }

    setProjects(prev => prev.map(p => {
      if (p.code === targetProject.code) {
        return {
          ...p,
          paidAmount: finalPaid,
          paymentStatus: newStatus,
          lastPaymentDate: new Date().toLocaleDateString('vi-VN'),
          bankTransactionCode: refCode
        };
      }
      return p;
    }));

    // Record transaction in DB if available
    try {
      createTransactionInDb({
        projectCode: targetProject.code,
        amount: payNum,
        type: 'income',
        category: receiptForm.purpose,
        bankRef: refCode,
        notes: receiptForm.note
      }).catch(() => {});
    } catch (e) {}

    // Prepare Success Modal Data
    const updatedProject = {
      ...targetProject,
      paidAmount: finalPaid,
      paymentStatus: newStatus
    };

    setSuccessReceiptModal({
      receiptCode: receiptForm.receiptCode,
      project: updatedProject,
      paidAmountSubmitted: payNum,
      paymentMethodLabel,
      refCode,
      purpose: receiptForm.purpose,
      collector: receiptForm.cashCollector || currentUser.name,
      date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      note: receiptForm.note || 'Thu tiền thành công',
      previousPaid: targetProject.paidAmount,
      newTotalPaid: finalPaid,
      remainingDebt: Math.max(0, targetProject.totalContract - finalPaid)
    });

    setShowCreatePaymentModal(false);
    triggerToast(`✨ Đã ghi nhận phiếu thu ${receiptForm.receiptCode} (${formatVND(payNum)})!`);
  };

  // KTV Payout submit
  const handleKtvPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payoutNum = parseInt(ktvForm.payoutAmount.replace(/[^0-9]/g, ''), 10);
    if (!payoutNum || payoutNum <= 0) {
      triggerToast('⚠️ Vui lòng nhập số tiền thù lao KTV hợp lệ.');
      return;
    }

    setProjects(prev => prev.map(p => {
      if (p.code === ktvForm.projectCode) {
        return {
          ...p,
          ktvStatus: 'Đã giải ngân',
          bankTransactionCode: ktvForm.transactionCode || `PAY-${Date.now().toString().slice(-6)}`
        };
      }
      return p;
    }));

    setShowKtvPayoutModal(false);
    triggerToast(`💸 Đã duyệt giải ngân ${formatVND(payoutNum)} cho KTV ${ktvForm.ktvName}!`);
  };

  // Quick Pay Submit
  const handleQuickPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayProject) return;
    const addAmt = parseInt(quickPayAmount.replace(/[^0-9]/g, ''), 10);
    if (!addAmt || addAmt <= 0) return;

    setProjects(prev => prev.map(p => {
      if (p.id === quickPayProject.id) {
        const newPaid = p.paidAmount + addAmt;
        let newStatus: 'Chưa cọc' | 'Đã cọc 50%' | 'Đã tất toán 100%' = p.paymentStatus;
        if (newPaid >= p.totalContract) {
          newStatus = 'Đã tất toán 100%';
        } else if (newPaid > 0) {
          newStatus = 'Đã cọc 50%';
        }
        return {
          ...p,
          paidAmount: Math.min(newPaid, p.totalContract),
          paymentStatus: newStatus,
          lastPaymentDate: new Date().toLocaleDateString('vi-VN'),
          bankTransactionCode: quickPayBankRef || `MBB-FT${Date.now().toString().slice(-6)}`
        };
      }
      return p;
    }));

    triggerToast(`🎉 Đã thu thêm ${formatVND(addAmt)} từ SV ${quickPayProject.studentName}!`);
    setQuickPayProject(null);
    setQuickPayAmount('');
    setQuickPayBankRef('');
  };

  const navItems = [
    { key: 'overview', label: '📊 Tổng Quan Tài Chính', icon: BarChart3, badge: null },
    { key: 'debts', label: '💰 Quản Lý Công Nợ', icon: Wallet, badge: metrics.unpaidCount > 0 ? `${metrics.unpaidCount} Nợ` : 'Đã tất toán' },
    { key: 'ktv_payout', label: '👨‍💻 Thù Lao Kỹ Thuật Viên', icon: Zap, badge: projects.filter(p => p.ktvStatus !== 'Đã giải ngân').length > 0 ? `${projects.filter(p => p.ktvStatus !== 'Đã giải ngân').length} Chờ duyệt` : 'Xong' },
    { key: 'ledger', label: '🧾 Sổ Quỹ & Thu Chi', icon: Receipt, badge: 'MBBank' },
    { key: 'reports', label: '📈 Báo Cáo & Thuế', icon: FileSpreadsheet, badge: 'BCTC 2026' },
  ];

  const { visibleNotifs } = getVisibleNotificationsForUser(currentUser, orgData.heads);
  const unreadCount = visibleNotifs.filter(n => !n.readBy?.includes(currentUser.email.toLowerCase())).length;

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-gray-100 flex flex-col md:flex-row font-sans selection:bg-orange-500 selection:text-slate-950">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 font-black px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span className="text-xs tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-[#14161c] border-b border-[#262a36] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-slate-950 font-black">
            <DollarSign className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <span className="font-black text-sm text-white tracking-wider">LUBPY STUDIO</span>
            <span className="text-[10px] block text-orange-400 font-mono">Kế Toán &amp; Tài Chính</span>
          </div>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-[#1f222b] rounded-xl border border-[#2d313f] text-gray-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 1. SIDEBAR NAVIGATION (MENU TRÁI CỐ ĐỊNH) */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#12141a] border-r border-[#222530] flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-[#222530]/80">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20">
              <DollarSign className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">LUBPY STUDIO</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold block w-fit mt-0.5">
                Kế Toán &amp; Tài Chính
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-gray-500 uppercase px-3 mb-2 tracking-wider">
              Phân Hệ Nghiệp Vụ
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key as TabKey);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20 font-black' 
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1d26]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-slate-950 text-orange-400 font-black' 
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - Supervisor & User Profile */}
        <div className="space-y-3 pt-4 border-t border-[#222530]">
          {/* Supervisor Card */}
          <div className="p-3 bg-[#171a22] rounded-xl border border-[#252834] flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="text-[11px] truncate">
              <span className="text-gray-400 block text-[9px] uppercase font-mono">Kế Toán Trưởng:</span>
              <span className="font-bold text-white truncate block">{accHead?.name || 'Nguyễn Văn Minh'}</span>
            </div>
          </div>

          {/* Quick Switch to Supervisor view if available */}
          {onSwitchToManagerView && (
            <button
              onClick={onSwitchToManagerView}
              className="w-full py-2 bg-[#1a1d26] hover:bg-[#252836] text-orange-300 border border-orange-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>Manager View</span>
            </button>
          )}

          {/* User Account */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer truncate mr-2"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400 text-xs shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-gray-400 font-mono">Chuyên Viên KT</div>
              </div>
            </button>

            <button
              onClick={onLogout}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* TOP BAR / HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#14161c] p-4 rounded-2xl border border-[#262a36] shadow-md">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span>
                {activeTab === 'overview' && '📊 Tổng Quan Tài Chính & Doanh Thu'}
                {activeTab === 'debts' && '💰 Quản Lý Công Nợ Sinh Viên'}
                {activeTab === 'ktv_payout' && '👨‍💻 Thù Lao Kỹ Thuật Viên Coder'}
                {activeTab === 'ledger' && '🧾 Sổ Quỹ & Lịch Sử Giao Dịch'}
                {activeTab === 'reports' && '📈 Báo Cáo Tài Chính & Thuế'}
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Hệ thống kế toán dịch vụ làm đồ án CNTT trọn gói Lubpy Studio
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Time Filter */}
            <div className="flex items-center bg-[#1c1e28] border border-[#2e3342] rounded-xl px-3 py-1.5 text-xs text-gray-300 font-bold gap-2">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                <option value="30days" className="bg-[#1c1e28]">30 Ngày Qua</option>
                <option value="quarter" className="bg-[#1c1e28]">Quý Này (Q3/2026)</option>
                <option value="year2026" className="bg-[#1c1e28]">Năm 2026</option>
              </select>
            </div>

            {/* Mailbox button */}
            <button 
              onClick={() => setShowNotifModal(true)}
              className="p-2.5 bg-[#1c1e28] hover:bg-[#252836] text-gray-300 hover:text-white rounded-xl border border-[#2e3342] transition-all relative group cursor-pointer"
              title="Hộp thư chỉ đạo từ Kế Toán Trưởng"
            >
              <Mail className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-slate-950 font-black text-[9px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Quick Create Payment */}
            <button
              onClick={() => openCreatePaymentModal()}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Tạo Phiếu Thu</span>
            </button>
          </div>
        </div>

        {/* UNIFIED HORIZONTAL NAVIGATION RIBBON (SEGMENTED TABS) */}
        <div className="bg-[#14161c] p-1.5 rounded-2xl border border-[#262a36] shadow-xl overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key as TabKey)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20 scale-[1.01]'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1d26]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-orange-400/90'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-slate-950 text-orange-400 font-black'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: OVERVIEW (TỔNG QUAN TÀI CHÍNH) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 CORE KPI CARDS (TOP FINANCIAL METRICS IN VNĐ) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Doanh Thu Tháng Này */}
              <div className="bg-[#14161c] border border-[#262a36] hover:border-emerald-500/30 p-5 rounded-2xl shadow-lg transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span className="font-semibold text-gray-300">Doanh Thu Tháng Này</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                    +18.4%
                  </span>
                </div>
                <div className="text-xl xl:text-2xl font-black text-white tracking-tight font-mono my-1">
                  {formatVND(metrics.revenueThisMonth)}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tổng thực thu đồ án sinh viên</span>
                </div>
              </div>

              {/* Card 2: Công Nợ Cần Thu */}
              <div className="bg-[#14161c] border border-[#262a36] hover:border-rose-500/30 p-5 rounded-2xl shadow-lg transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span className="font-semibold text-rose-300">Công Nợ Cần Thu</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold">
                    {metrics.unpaidCount} đồ án
                  </span>
                </div>
                <div className="text-xl xl:text-2xl font-black text-rose-400 tracking-tight font-mono my-1">
                  {formatVND(metrics.debtToCollect)}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sinh viên chưa tất toán</span>
                </div>
              </div>

              {/* Card 3: Tiền Cọc Đã Thu */}
              <div className="bg-[#14161c] border border-[#262a36] hover:border-sky-500/30 p-5 rounded-2xl shadow-lg transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span className="font-semibold text-sky-300">Tiền Cọc Đã Thu</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-bold">
                    30% - 50%
                  </span>
                </div>
                <div className="text-xl xl:text-2xl font-black text-sky-400 tracking-tight font-mono my-1">
                  {formatVND(metrics.depositCollected)}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-2">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tiền cọc duy trì hợp đồng</span>
                </div>
              </div>

              {/* Card 4: Chi Trả Kỹ Thuật Viên */}
              <div className="bg-[#14161c] border border-[#262a36] hover:border-amber-500/30 p-5 rounded-2xl shadow-lg transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span className="font-semibold text-amber-300">Chi Trả KTV / Coder</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
                    Giải ngân
                  </span>
                </div>
                <div className="text-xl xl:text-2xl font-black text-amber-400 tracking-tight font-mono my-1">
                  {formatVND(metrics.ktvDisbursedTotal)}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-2">
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thù lao đã thanh toán cho Coder</span>
                </div>
              </div>
            </div>

            {/* SPLIT LAYOUT: MAIN TABLE + COMPACT CASHFLOW SIDE PANEL */}
            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-5">
              
              {/* MAIN TABLE: QUẢN LÝ TÀI CHÍNH THEO ĐỒ ÁN (RESPONSIVE 8/12 ON 2XL, 100% ON LAPTOP) */}
              <div className="2xl:col-span-8 bg-[#14161c] border border-[#262a36] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 min-w-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#22252e] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-400" />
                      <span>Danh Sách Đồ Án &amp; Công Nợ</span>
                    </h3>
                  </div>

                  {/* QUICK BADGE FILTERS */}
                  <div className="flex items-center gap-1 bg-[#1a1d26] p-1 rounded-xl border border-[#282c39] flex-wrap">
                    <button
                      onClick={() => setBadgeFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        badgeFilter === 'all' ? 'bg-orange-500 text-slate-950' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setBadgeFilter('chua_coc')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        badgeFilter === 'chua_coc' ? 'bg-orange-500 text-slate-950' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Chờ cọc
                    </button>
                    <button
                      onClick={() => setBadgeFilter('con_no')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        badgeFilter === 'con_no' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400 hover:text-white'
                      }`}
                    >
                      Còn nợ ({metrics.unpaidCount})
                    </button>
                    <button
                      onClick={() => setBadgeFilter('tat_toan')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        badgeFilter === 'tat_toan' ? 'bg-emerald-500 text-slate-950' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Đã tất toán
                    </button>
                  </div>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo Mã đồ án, Tên sinh viên, SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#1c1e28] border border-[#2e3342] text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-orange-500 focus:outline-none w-full"
                  />
                </div>

                {/* OPTIMIZED COMPACT TABLE WITH ZERO OVERFLOW */}
                <div className="overflow-x-auto rounded-xl border border-[#222530]">
                  <table className="w-full text-left text-xs text-gray-300 table-auto">
                    <thead className="bg-[#1a1d26] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#222530]">
                      <tr>
                        <th className="py-2.5 px-2.5">Mã &amp; Tên Đồ Án</th>
                        <th className="py-2.5 px-2.5">Khách Hàng (SV)</th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Tổng Tiền</th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Đã Thu</th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Còn Nợ</th>
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Trạng Thái</th>
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222530]">
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500 italic">
                            Không tìm thấy dữ liệu đồ án phù hợp.
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((p) => {
                          const remainingDebt = Math.max(0, p.totalContract - p.paidAmount);
                          return (
                            <tr key={p.id} className="hover:bg-[#1a1d26]/60 transition-colors">
                              {/* Code & Title */}
                              <td className="py-2.5 px-2.5">
                                <span className="font-mono font-bold text-orange-400 text-[11px] block">{p.code}</span>
                                <span className="font-medium text-white truncate max-w-[130px] xl:max-w-[170px] block" title={p.name}>
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono block mt-0.5 truncate max-w-[130px] xl:max-w-[170px]">
                                  👨‍💻 Coder: <span className="text-gray-300 font-medium">{p.ktvName}</span>
                                </span>
                              </td>

                              {/* Student Info */}
                              <td className="py-2.5 px-2.5">
                                <div className="font-bold text-white text-[11px] truncate max-w-[100px] xl:max-w-[130px]">{p.studentName}</div>
                                <div className="text-[10px] text-gray-400 font-mono whitespace-nowrap">{p.studentPhone}</div>
                              </td>

                              {/* Total Contract */}
                              <td className="py-2.5 px-2.5 text-right font-mono font-bold text-gray-200 text-[11px] whitespace-nowrap">
                                {formatVND(p.totalContract)}
                              </td>

                              {/* Paid Amount */}
                              <td className="py-2.5 px-2.5 text-right font-mono font-bold text-emerald-400 text-[11px] whitespace-nowrap">
                                {formatVND(p.paidAmount)}
                              </td>

                              {/* Remaining Debt (Bold Red if > 0) */}
                              <td className="py-2.5 px-2.5 text-right font-mono font-black whitespace-nowrap">
                                {remainingDebt > 0 ? (
                                  <span className="text-rose-400 font-black bg-rose-500/15 px-1.5 py-0.5 rounded-md border border-rose-500/30 text-[11px] shadow-sm whitespace-nowrap">
                                    {formatVND(remainingDebt)}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 font-normal text-[11px] whitespace-nowrap">0 VNĐ</span>
                                )}
                              </td>

                              {/* Payment Status */}
                              <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                                {p.paymentStatus === 'Đã tất toán 100%' && (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                                    Tất toán
                                  </span>
                                )}
                                {p.paymentStatus === 'Đã cọc 50%' && (
                                  <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-[10px] font-bold">
                                    Cọc 50%
                                  </span>
                                )}
                                {p.paymentStatus === 'Chưa cọc' && (
                                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-bold">
                                    Chưa cọc
                                  </span>
                                )}
                              </td>

                              {/* Consolidated Action Column */}
                              <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  {/* Primary Action Button */}
                                  {remainingDebt === 0 || p.paymentStatus === 'Đã tất toán 100%' ? (
                                    <button
                                      onClick={() => {
                                        setSuccessReceiptModal({
                                          receiptCode: p.bankTransactionCode ? `PT-${p.code}` : `PT-COMPLETED-${p.code}`,
                                          project: p,
                                          paidAmountSubmitted: p.paidAmount,
                                          paymentMethodLabel: 'Chuyển khoản Ngân hàng (Tất toán)',
                                          refCode: p.bankTransactionCode || 'TCB-8819201',
                                          purpose: 'Tất toán hợp đồng (100%)',
                                          collector: user.name || 'Lê Hoàng Minh',
                                          date: p.lastPaymentDate || '01/08/2026',
                                          note: 'Đồ án đã tất toán 100% hợp đồng',
                                          previousPaid: p.paidAmount,
                                          newTotalPaid: p.paidAmount,
                                          remainingDebt: 0
                                        });
                                      }}
                                      className="px-2 py-1 bg-[#222532] hover:bg-[#2c3040] text-gray-300 border border-[#2e3342] font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap"
                                    >
                                      <Receipt className="w-3 h-3 text-gray-400" />
                                      <span>Xem Phiếu Thu</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => openCreatePaymentModal(p.code)}
                                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[10px] transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                                    >
                                      [Ghi Nhận Thu]
                                    </button>
                                  )}

                                  {/* Dropdown Menu Button [...] */}
                                  <div className="relative">
                                    <button
                                      onClick={() => setActiveActionDropdown(activeActionDropdown === p.id ? null : p.id)}
                                      className="p-1 bg-[#222532] hover:bg-[#2c3040] text-gray-300 rounded-lg transition-all cursor-pointer"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>

                                    {activeActionDropdown === p.id && (
                                      <div className="absolute right-0 top-7 z-30 w-44 bg-[#1c1e28] border border-[#2d3142] rounded-xl shadow-2xl p-1 text-left space-y-0.5">
                                        <button
                                          onClick={() => {
                                            setReminderProject(p);
                                            setActiveActionDropdown(null);
                                          }}
                                          className="w-full px-2.5 py-1.5 hover:bg-[#252836] text-amber-300 text-[11px] font-bold rounded-lg flex items-center gap-2 text-left cursor-pointer"
                                        >
                                          <BellRing className="w-3.5 h-3.5 text-amber-400" />
                                          <span>Nhắc Nợ Zalo/SMS</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setInvoiceProject(p);
                                            setActiveActionDropdown(null);
                                          }}
                                          className="w-full px-2.5 py-1.5 hover:bg-[#252836] text-gray-200 text-[11px] font-bold rounded-lg flex items-center gap-2 text-left cursor-pointer"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-sky-400" />
                                          <span>Xem Hóa Đơn</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setKtvForm({
                                              projectCode: p.code,
                                              ktvName: p.ktvName,
                                              payoutAmount: p.ktvFee.toString(),
                                              bankInfo: 'MBBank - 999988883333',
                                              transactionCode: `FT${Date.now().toString().slice(-6)}`
                                            });
                                            setShowKtvPayoutModal(true);
                                            setActiveActionDropdown(null);
                                          }}
                                          className="w-full px-2.5 py-1.5 hover:bg-[#252836] text-orange-300 text-[11px] font-bold rounded-lg flex items-center gap-2 text-left border-t border-[#2d3142] cursor-pointer"
                                        >
                                          <Zap className="w-3.5 h-3.5 text-orange-400" />
                                          <span>Giải Ngân KTV</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SIDE PANEL: COMPACT CASHFLOW CHART & QUICK SUMMARY (4/12 ON 2XL, STACKED BELOW ON LAPTOP) */}
              <div className="2xl:col-span-4 space-y-4 min-w-0">
                <div className="bg-[#14161c] border border-[#262a36] rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#22252e] pb-2">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-400" />
                      <span>Biểu Đồ Dòng Tiền Thu Chi</span>
                    </h3>
                    <span className="text-[10px] font-mono text-gray-400">4 Tuần</span>
                  </div>

                  {/* Compact Cashflow Bar Chart with Y-Axis & Hover Tooltips */}
                  <div className="pt-2 space-y-2">
                    <div className="flex gap-2 h-36 pt-2">
                      {/* Y-axis Ticks */}
                      <div className="flex flex-col justify-between text-[9px] font-mono text-gray-400 py-1 text-right select-none w-7 shrink-0 border-r border-[#222532] pr-1.5">
                        <span>70M</span>
                        <span>50M</span>
                        <span>30M</span>
                        <span>10M</span>
                        <span>0M</span>
                      </div>

                      {/* Bars Container with Gridlines */}
                      <div className="flex-1 flex items-end justify-between gap-2.5 border-b border-[#262a36] pb-1 relative">
                        {/* Dashed Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15">
                          <div className="border-b border-dashed border-gray-400 w-full" />
                          <div className="border-b border-dashed border-gray-400 w-full" />
                          <div className="border-b border-dashed border-gray-400 w-full" />
                          <div className="border-b border-dashed border-gray-400 w-full" />
                          <div className="border-b border-dashed border-gray-400 w-full" />
                        </div>

                        {[
                          { label: 'T1', thu: 35, chi: 18, thuStr: '35.000.000 VNĐ', chiStr: '18.000.000 VNĐ' },
                          { label: 'T2', thu: 48, chi: 24, thuStr: '48.000.000 VNĐ', chiStr: '24.000.000 VNĐ' },
                          { label: 'T3', thu: 52, chi: 28, thuStr: '52.000.000 VNĐ', chiStr: '28.000.000 VNĐ' },
                          { label: 'T4', thu: 65, chi: 32, thuStr: '65.000.000 VNĐ', chiStr: '32.000.000 VNĐ' },
                        ].map((b, idx) => {
                          const maxVal = 70;
                          const thuPct = Math.min(100, Math.round((b.thu / maxVal) * 100));
                          const chiPct = Math.min(100, Math.round((b.chi / maxVal) * 100));

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative z-10">
                              
                              {/* Tooltip on Hover */}
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#101218] border border-[#2e3346] text-white p-2 rounded-lg text-[9px] shadow-2xl whitespace-nowrap z-30 font-mono space-y-0.5">
                                <div className="text-emerald-400 font-bold">Thu ({b.label}): {b.thuStr}</div>
                                <div className="text-orange-400 font-bold">Chi ({b.label}): {b.chiStr}</div>
                              </div>

                              <div className="w-full flex items-end justify-center gap-1 h-full">
                                <div 
                                  className="w-1/2 bg-emerald-500 rounded-t-md hover:bg-emerald-400 transition-all cursor-pointer relative group/bar"
                                  style={{ height: `${thuPct}%` }}
                                >
                                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-400 opacity-0 group-hover/bar:opacity-100 font-mono">
                                    {b.thu}M
                                  </div>
                                </div>
                                <div 
                                  className="w-1/2 bg-orange-500 rounded-t-md hover:bg-orange-400 transition-all cursor-pointer relative group/bar"
                                  style={{ height: `${chiPct}%` }}
                                >
                                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-orange-400 opacity-0 group-hover/bar:opacity-100 font-mono">
                                    {b.chi}M
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono font-bold">{b.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] font-mono mt-2 pt-1 border-t border-[#22252e]">
                      <span className="text-emerald-400 font-bold">■ Thu: Doanh Thu SV</span>
                      <span className="text-orange-400 font-bold">■ Chi: Thù Lao Coder</span>
                    </div>
                  </div>
                </div>

                {/* QUICK KTV STATUS SUMMARY */}
                <div className="bg-[#14161c] border border-[#262a36] rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-400" />
                      <span>Trạng Thái Giải Ngân KTV</span>
                    </span>
                    <button 
                      onClick={() => setActiveTab('ktv_payout')}
                      className="text-[10px] text-orange-400 hover:underline"
                    >
                      Chi tiết ›
                    </button>
                  </h3>

                  <div className="space-y-2">
                    {projects.map((p) => (
                      <div key={p.id} className="p-2 bg-[#1a1d26] rounded-xl flex items-center justify-between text-xs">
                        <div className="truncate mr-2">
                          <span className="font-mono text-orange-400 font-bold block">{p.code}</span>
                          <span className="text-gray-300 font-medium truncate block">{p.ktvName}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-white text-[11px]">{formatVND(p.ktvFee)}</div>
                          <span className={`text-[9px] font-bold ${
                            p.ktvStatus === 'Đã giải ngân' ? 'text-emerald-400' : 'text-orange-400'
                          }`}>
                            {p.ktvStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ CÔNG NỢ (DEBTS TAB) */}
        {activeTab === 'debts' && (
          <div className="space-y-6">
            <div className="bg-[#14161c] border border-[#262a36] p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#22252e] pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-rose-400" />
                    <span>Theo Dõi Công Nợ Sinh Viên</span>
                  </h2>
                  <p className="text-xs text-gray-400">Danh sách đồ án còn thiếu tiền cọc hoặc tất toán trước khi nhận mã nguồn</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-400">Tổng Công Nợ Cần Thu:</div>
                  <div className="text-xl font-black text-rose-400 font-mono">{formatVND(metrics.debtToCollect)}</div>
                </div>
              </div>

              {/* UNIFIED SEARCH & ACTION BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1a1d26] p-3 rounded-xl border border-[#282c39]">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo Mã đồ án, Sinh viên, SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#1c1e28] border border-[#2e3342] text-xs text-white pl-9 pr-8 py-2 rounded-xl focus:border-orange-500 focus:outline-none w-full"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => openCreatePaymentModal()}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>Tạo Phiếu Thu</span>
                  </button>
                </div>
              </div>

              {/* Debt Table */}
              <div className="overflow-x-auto rounded-xl border border-[#222530]">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#1a1d26] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#222530]">
                    <tr>
                      <th className="py-3 px-3">Mã Đồ Án</th>
                      <th className="py-3 px-3">Đề Tài Đồ Án</th>
                      <th className="py-3 px-3">Sinh Viên / SĐT</th>
                      <th className="py-3 px-3 text-right">Tổng Hợp Đồng</th>
                      <th className="py-3 px-3 text-right">Đã Thu</th>
                      <th className="py-3 px-3 text-right">Còn Thiếu (Nợ)</th>
                      <th className="py-3 px-3 text-center">Hạn Bàn Giao</th>
                      <th className="py-3 px-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222530]">
                    {projects
                      .filter(p => (p.totalContract - p.paidAmount) > 0)
                      .filter(p => {
                        const q = searchQuery.toLowerCase();
                        return (
                          p.code.toLowerCase().includes(q) ||
                          p.name.toLowerCase().includes(q) ||
                          p.studentName.toLowerCase().includes(q) ||
                          p.studentPhone.includes(q)
                        );
                      })
                      .map(p => {
                      const debt = p.totalContract - p.paidAmount;
                      return (
                        <tr key={p.id} className="hover:bg-[#1a1d26]/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-orange-400">{p.code}</td>
                          <td className="py-3 px-3 font-medium text-white max-w-[200px] truncate">{p.name}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{p.studentName}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{p.studentPhone}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono">{formatVND(p.totalContract)}</td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-400">{formatVND(p.paidAmount)}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-rose-400 bg-rose-500/10">
                            {formatVND(debt)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-gray-400">{p.dueDate}</td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setReminderProject(p)}
                                className="px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <BellRing className="w-3.5 h-3.5" />
                                <span>Nhắc Nợ Zalo</span>
                              </button>
                              <button
                                onClick={() => openCreatePaymentModal(p.code)}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer shadow-sm"
                              >
                                [Ghi Nhận Thu]
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
          </div>
        )}

        {/* TAB 3: THÙ LAO KĨ THUẬT VIÊN (KTV PAYOUT TAB) */}
        {activeTab === 'ktv_payout' && (
          <div className="space-y-6">
            <div className="bg-[#14161c] border border-[#262a36] p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#22252e] pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-400" />
                    <span>Quản Lý Thù Lao Kỹ Thuật Viên (Coder/Dev)</span>
                  </h2>
                  <p className="text-xs text-gray-400">Duyệt chuyển khoản thù lao khi KTV đã hoàn tất code &amp; hướng dẫn đồ án</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-400">Đã Giải Ngân:</div>
                  <div className="text-xl font-black text-amber-400 font-mono">{formatVND(metrics.ktvDisbursedTotal)}</div>
                </div>
              </div>

              {/* UNIFIED SEARCH & ACTION BAR FOR KTV */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1a1d26] p-3 rounded-xl border border-[#282c39]">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo KTV, Mã đồ án, Techstack..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#1c1e28] border border-[#2e3342] text-xs text-white pl-9 pr-8 py-2 rounded-xl focus:border-orange-500 focus:outline-none w-full"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs text-gray-400 font-mono">Trạng Thái:</span>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold font-mono">
                    {projects.filter(p => p.ktvStatus !== 'Đã giải ngân').length} Căn chờ duyệt
                  </span>
                </div>
              </div>

              {/* KTV Table */}
              <div className="overflow-x-auto rounded-xl border border-[#222530]">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#1a1d26] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#222530]">
                    <tr>
                      <th className="py-3 px-3">Mã Đồ Án</th>
                      <th className="py-3 px-3">Kỹ Thuật Viên (KTV)</th>
                      <th className="py-3 px-3 text-right">Thù Lao KTV</th>
                      <th className="py-3 px-3 text-center">Trạng Thái Giải Ngân</th>
                      <th className="py-3 px-3 text-center">Mã Giao Dịch Banking</th>
                      <th className="py-3 px-3 text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222530]">
                    {projects
                      .filter(p => {
                        const q = searchQuery.toLowerCase();
                        return (
                          p.code.toLowerCase().includes(q) ||
                          p.ktvName.toLowerCase().includes(q) ||
                          p.name.toLowerCase().includes(q)
                        );
                      })
                      .map(p => (
                      <tr key={p.id} className="hover:bg-[#1a1d26]/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-orange-400">{p.code}</td>
                        <td className="py-3 px-3 font-bold text-white">{p.ktvName}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">{formatVND(p.ktvFee)}</td>
                        <td className="py-3 px-3 text-center">
                          {p.ktvStatus === 'Đã giải ngân' ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                              ✓ Đã giải ngân
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full font-bold">
                              ⏳ Chờ duyệt
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-gray-400">
                          {p.bankTransactionCode || 'Chưa phát sinh'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {p.ktvStatus !== 'Đã giải ngân' ? (
                            <button
                              onClick={() => {
                                setKtvForm({
                                  projectCode: p.code,
                                  ktvName: p.ktvName,
                                  payoutAmount: p.ktvFee.toString(),
                                  bankInfo: 'MBBank - 999988883333',
                                  transactionCode: `FT${Date.now().toString().slice(-6)}`
                                });
                                setShowKtvPayoutModal(true);
                              }}
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer shadow-sm"
                            >
                              [Duyệt Chuyển Khoản]
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500 italic">Hoàn tất</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SỔ QUỸ & LỊCH SỬ GIAO DỊCH (LEDGER TAB) */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="bg-[#14161c] border border-[#262a36] p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#22252e] pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-400" />
                    <span>Sổ Quỹ &amp; Lịch Sử Thu Chi Banking</span>
                  </h2>
                  <p className="text-xs text-gray-400">Nhật ký giao dịch thực tế qua tài khoản ngân hàng MBBank / VCB Lubpy Studio</p>
                </div>

                <button
                  onClick={() => setShowCreatePaymentModal(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Lập Phiếu Thu / Chi</span>
                </button>
              </div>

              {/* UNIFIED SEARCH BAR FOR LEDGER */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1a1d26] p-3 rounded-xl border border-[#282c39]">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo Mã GD, Tên SV, Mã đồ án..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#1c1e28] border border-[#2e3342] text-xs text-white pl-9 pr-8 py-2 rounded-xl focus:border-orange-500 focus:outline-none w-full"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                  <span>Tài khoản chính: <strong className="text-emerald-400 font-bold">MBBank 999988883333</strong></span>
                </div>
              </div>

              {/* Transaction Logs */}
              <div className="space-y-3">
                {projects
                  .filter(p => {
                    const q = searchQuery.toLowerCase();
                    return (
                      p.code.toLowerCase().includes(q) ||
                      p.studentName.toLowerCase().includes(q) ||
                      (p.bankTransactionCode && p.bankTransactionCode.toLowerCase().includes(q))
                    );
                  })
                  .map((p, idx) => (
                  <div key={idx} className="p-4 bg-[#1a1d26] rounded-xl border border-[#252834] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Ghi nhận thu tiền từ SV {p.studentName} ({p.code})
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          Mã GD: {p.bankTransactionCode || 'MBB-8822019'} • Ngày: {p.lastPaymentDate || p.dueDate}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-emerald-400 text-sm">
                        +{formatVND(p.paidAmount)}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Chuyển khoản Banking
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BÁO CÁO & THUẾ (REPORTS TAB) */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-[#14161c] border border-[#262a36] p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#22252e] pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                    <span>Xuất Báo Cáo Doanh Thu &amp; Dòng Tiền</span>
                  </h2>
                  <p className="text-xs text-gray-400">Trích xuất file báo cáo tài chính định kỳ cho Ban Giám Đốc Lubpy Studio</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => triggerToast('📊 Đã trích xuất báo cáo Excel thành công!')}
                    className="px-3.5 py-2 bg-[#1f222b] hover:bg-[#282c38] text-gray-200 border border-[#2e3342] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Xuất Excel</span>
                  </button>

                  <button
                    onClick={() => triggerToast('📄 Đã xuất bản in PDF Báo Cáo Kế Toán!')}
                    className="px-3.5 py-2 bg-[#1f222b] hover:bg-[#282c38] text-gray-200 border border-[#2e3342] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-sky-400" />
                    <span>In Báo Cáo PDF</span>
                  </button>
                </div>
              </div>

              {/* Summary Statement Mockup */}
              <div className="p-6 bg-[#1a1d26] rounded-2xl border border-[#252834] space-y-4">
                <div className="flex justify-between items-center border-b border-[#2d3142] pb-3">
                  <div>
                    <span className="text-xs font-mono text-orange-400 block font-bold">LUBPY STUDIO - CÔNG TY DỊCH VỤ CNTT</span>
                    <h3 className="text-lg font-black text-white">BÁO CÁO KẾ TOÁN THU CHI THÁNG 08/2026</h3>
                  </div>
                  <div className="text-right text-xs font-mono text-gray-400">
                    Người Lập: <span className="text-white font-bold">{currentUser.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                  <div className="p-3 bg-[#14161c] rounded-xl border border-[#262a36]">
                    <span className="text-[10px] text-gray-400 block">TỔNG DOANH THU (THỰC THU)</span>
                    <span className="text-lg font-bold text-emerald-400">{formatVND(metrics.revenueThisMonth)}</span>
                  </div>

                  <div className="p-3 bg-[#14161c] rounded-xl border border-[#262a36]">
                    <span className="text-[10px] text-gray-400 block">TỔNG THÙ LAO KTV (THỰC CHI)</span>
                    <span className="text-lg font-bold text-amber-400">{formatVND(metrics.ktvDisbursedTotal)}</span>
                  </div>

                  <div className="p-3 bg-[#14161c] rounded-xl border border-[#262a36]">
                    <span className="text-[10px] text-gray-400 block">LỢI NHUẬN RÒNG DỊCH VỤ</span>
                    <span className="text-lg font-bold text-sky-400">
                      {formatVND(metrics.revenueThisMonth - metrics.ktvDisbursedTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: CREATE PAYMENT / RECORD RECEIPT (TẠO PHIẾU THU CHUYÊN NGHIỆP) */}
      {showCreatePaymentModal && (
        <CreatePaymentModalContent 
          setShowCreatePaymentModal={setShowCreatePaymentModal}
          receiptForm={receiptForm}
          setReceiptForm={setReceiptForm}
          projects={projects}
          handleCreatePaymentSubmit={handleCreatePaymentSubmit}
        />
      )}

      {/* MODAL SUCCESS: RECEIPT CONFIRMATION & QUICK ACTIONS */}
      {successReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14161c] border border-[#2a2d39] rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-5 my-8">
            
            {/* Header Success Badge */}
            <div className="text-center space-y-2 border-b border-[#262a36] pb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">TẠO PHIẾU THU THÀNH CÔNG!</h3>
              <p className="text-xs text-gray-400">Giao dịch đã được ghi nhận vào sổ quỹ Lubpy Studio</p>
            </div>

            {/* Printable Receipt Card Format */}
            <div id="lubpy-printable-receipt" className="p-5 bg-[#181a22] rounded-2xl border border-[#2e3342] space-y-4 font-mono text-xs relative overflow-hidden">
              {/* Stamp Badge */}
              <div className="absolute top-4 right-4 border-2 border-emerald-500 text-emerald-400 font-black px-3 py-1 rounded-xl rotate-12 text-[10px] tracking-widest bg-emerald-500/10 uppercase">
                ✓ ĐÃ THU TIỀN
              </div>

              {/* Company & Receipt Code Header */}
              <div className="border-b border-[#2d3142] pb-3">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>LUBPY STUDIO - CNTT TRỌN GÓI</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">PHIẾU THU TIỀN DỊCH VỤ / HỢP ĐỒNG ĐỒ ÁN</div>
                <div className="text-xs text-white font-bold mt-2">Mã Phiếu: <span className="text-orange-400">{successReceiptModal.receiptCode}</span></div>
                <div className="text-[10px] text-gray-400">Thời gian lập: {successReceiptModal.date}</div>
              </div>

              {/* Student & Project Details */}
              <div className="space-y-1.5 text-[11px] border-b border-[#2d3142] pb-3">
                <div>Sinh Viên: <span className="text-white font-bold">{successReceiptModal.project.studentName}</span> ({successReceiptModal.project.studentPhone})</div>
                <div>Đơn Vị: <span className="text-gray-300">{successReceiptModal.project.university}</span></div>
                <div>Mã Đồ Án: <span className="text-orange-400 font-bold">{successReceiptModal.project.code}</span> - {successReceiptModal.project.name}</div>
                <div>Mục Đích: <span className="text-sky-300 font-bold">{successReceiptModal.purpose}</span></div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-1 text-[11px] bg-[#12141a] p-3 rounded-xl border border-[#262a36]">
                <div className="flex justify-between text-gray-400">
                  <span>Tổng Giá Trị Hợp Đồng:</span>
                  <span className="text-white font-bold">{formatVND(successReceiptModal.project.totalContract)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Số Tiền Thu Lần Này:</span>
                  <span className="text-sm font-black">{formatVND(successReceiptModal.paidAmountSubmitted)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Hình Thức:</span>
                  <span>{successReceiptModal.paymentMethodLabel}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Mã GD / Tham Chiếu:</span>
                  <span className="text-orange-300">{successReceiptModal.refCode}</span>
                </div>
                <div className="flex justify-between text-rose-400 font-bold border-t border-[#2a2d3d] pt-1 mt-1">
                  <span>Công Nợ Còn Thiếu:</span>
                  <span className="font-black">{formatVND(successReceiptModal.remainingDebt)}</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 flex justify-between pt-1">
                <span>Người thu tiền: {successReceiptModal.collector}</span>
                <span>Kế Toán Trưởng: Nguyễn Văn Minh</span>
              </div>
            </div>

            {/* Post-Submit 2 Quick Action Buttons */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* 🖨️ [In / Tải Phiếu Thu PDF] */}
                <button
                  onClick={() => {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(`
                        <html>
                          <head>
                            <title>Phiếu Thu - ${successReceiptModal.receiptCode}</title>
                            <style>
                              body { font-family: monospace; padding: 24px; background: #fff; color: #000; line-height: 1.5; }
                              .box { border: 2px solid #000; padding: 24px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
                              .header { text-align: center; border-bottom: 2px border #000; padding-bottom: 12px; margin-bottom: 16px; }
                              .title { font-size: 20px; font-weight: bold; }
                              .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
                              .bold { font-weight: bold; }
                              .stamp { float: right; border: 2px solid green; color: green; padding: 4px 12px; font-weight: bold; border-radius: 6px; }
                              .footer { margin-top: 30px; display: flex; justify-content: space-between; text-align: center; }
                            </style>
                          </head>
                          <body>
                            <div class="box">
                              <div class="stamp">✓ ĐÃ THU TIỀN</div>
                              <div class="header">
                                <div class="title">LUBPY STUDIO - PHIẾU THU TIỀN</div>
                                <div>Mã Phiếu Thu: <b>${successReceiptModal.receiptCode}</b></div>
                                <div>Ngày lập: ${successReceiptModal.date}</div>
                              </div>
                              
                              <div>Khách Hàng (SV): <b>${successReceiptModal.project.studentName}</b> (${successReceiptModal.project.studentPhone})</div>
                              <div>Trường: <b>${successReceiptModal.project.university}</b></div>
                              <div>Đồ Án: <b>${successReceiptModal.project.code}</b> - ${successReceiptModal.project.name}</div>
                              <div>Mục Đích: <b>${successReceiptModal.purpose}</b></div>
                              <hr style="margin: 12px 0;" />
                              
                              <div class="row"><span>Tổng Giá Trị Hợp Đồng:</span> <b>${formatVND(successReceiptModal.project.totalContract)}</b></div>
                              <div class="row"><span>Số Tiền Thu Lần Này:</span> <b style="font-size: 16px; color: green;">${formatVND(successReceiptModal.paidAmountSubmitted)}</b></div>
                              <div class="row"><span>Hình Thức Thanh Toán:</span> <span>${successReceiptModal.paymentMethodLabel}</span></div>
                              <div class="row"><span>Mã Giao Dịch Banking:</span> <span>${successReceiptModal.refCode}</span></div>
                              <div class="row"><span>Công Nợ Còn Lại:</span> <b style="color: red;">${formatVND(successReceiptModal.remainingDebt)}</b></div>
                              <hr style="margin: 12px 0;" />

                              <div class="footer">
                                <div>
                                  <b>Người Nộp Tiền</b><br/><br/><br/>
                                  ${successReceiptModal.project.studentName}
                                </div>
                                <div>
                                  <b>Người Thu Tiền</b><br/><br/><br/>
                                  ${successReceiptModal.collector}
                                </div>
                              </div>
                            </div>
                          </body>
                        </html>
                      `);
                      win.document.close();
                      win.print();
                    }
                    triggerToast('🖨️ Đã xuất lệnh in / lưu phiếu thu PDF!');
                  }}
                  className="py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Tải Phiếu Thu PDF</span>
                </button>

                {/* 📲 [Gửi Biên Nhận Zalo] */}
                <button
                  onClick={() => {
                    const phoneClean = successReceiptModal.project.studentPhone.replace(/[^0-9]/g, '');
                    const zaloMsg = `[LUBPY STUDIO] XÁC NHẬN PHIẾU THU TIỀN (${successReceiptModal.receiptCode})
----------------------------------
Chào ${successReceiptModal.project.studentName},
Lubpy Studio đã nhận thanh toán thành công:
• Đồ án: ${successReceiptModal.project.code} - ${successReceiptModal.project.name}
• Số tiền thu: ${formatVND(successReceiptModal.paidAmountSubmitted)}
• Hình thức: ${successReceiptModal.paymentMethodLabel}
• Số tiền còn nợ: ${formatVND(successReceiptModal.remainingDebt)}
----------------------------------
Cảm ơn bạn đã tin tưởng dịch vụ Lubpy Studio!`;

                    navigator.clipboard.writeText(zaloMsg);
                    if (phoneClean) {
                      window.open(`https://zalo.me/${phoneClean}`, '_blank');
                    }
                    triggerToast('📲 Đã sao chép nội dung biên nhận & mở Zalo gửi cho sinh viên!');
                  }}
                  className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                  <span>Gửi Biên Nhận Zalo</span>
                </button>
              </div>

              <button
                onClick={() => setSuccessReceiptModal(null)}
                className="w-full py-2 bg-[#1f222b] hover:bg-[#282c38] text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: KTV PAYOUT APPROVAL */}
      {showKtvPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14161c] border border-[#2a2d39] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400" />
                <span>Duyệt Thù Lao Kỹ Thuật Viên</span>
              </h3>
              <button onClick={() => setShowKtvPayoutModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKtvPayoutSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Tên KTV &amp; Đồ Án</label>
                <div className="p-3 bg-[#1c1e28] border border-[#2e3342] rounded-xl text-white font-bold">
                  {ktvForm.ktvName} ({ktvForm.projectCode})
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Số Tiền Thù Lao 解 ngân (VNĐ)</label>
                <input
                  type="text"
                  value={ktvForm.payoutAmount}
                  onChange={(e) => setKtvForm({ ...ktvForm, payoutAmount: e.target.value })}
                  className="w-full bg-[#1c1e28] border border-[#2e3342] text-amber-400 font-mono font-bold p-2.5 rounded-xl text-sm focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Tài Khoản Nhận Của KTV</label>
                <input
                  type="text"
                  value={ktvForm.bankInfo}
                  onChange={(e) => setKtvForm({ ...ktvForm, bankInfo: e.target.value })}
                  className="w-full bg-[#1c1e28] border border-[#2e3342] text-white font-mono p-2.5 rounded-xl focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Mã Giao Dịch Chuyển Khoản Banking</label>
                <input
                  type="text"
                  value={ktvForm.transactionCode}
                  onChange={(e) => setKtvForm({ ...ktvForm, transactionCode: e.target.value })}
                  className="w-full bg-[#1c1e28] border border-[#2e3342] text-white font-mono p-2.5 rounded-xl focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowKtvPayoutModal(false)}
                  className="flex-1 py-2.5 bg-[#1f222b] text-gray-300 font-bold rounded-xl hover:bg-[#282c38]"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 text-slate-950 font-black rounded-xl hover:bg-orange-400 shadow-lg shadow-orange-500/20"
                >
                  Xác Nhận Giải Ngân
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK PAY MODAL (Row action) */}
      {quickPayProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14161c] border border-[#2a2d39] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Ghi Nhận Thu Tiền {quickPayProject.code}</span>
              </h3>
              <button onClick={() => setQuickPayProject(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPaySubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-[#1c1e28] rounded-xl border border-[#2e3342] space-y-1">
                <div className="text-white font-bold">{quickPayProject.name}</div>
                <div className="text-gray-400">Sinh viên: <span className="text-white font-bold">{quickPayProject.studentName}</span> ({quickPayProject.studentPhone})</div>
                <div className="text-gray-400">Đã thanh toán: <span className="text-emerald-400 font-mono font-bold">{formatVND(quickPayProject.paidAmount)}</span> / {formatVND(quickPayProject.totalContract)}</div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Số Tiền Thu Lần Này (VNĐ)</label>
                <input
                  type="text"
                  value={quickPayAmount}
                  onChange={(e) => setQuickPayAmount(e.target.value)}
                  className="w-full bg-[#1c1e28] border border-[#2e3342] text-emerald-400 font-mono font-bold p-2.5 rounded-xl text-sm focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Mã Giao Dịch Chuyển Khoản</label>
                <input
                  type="text"
                  placeholder="MBB-FT881923"
                  value={quickPayBankRef}
                  onChange={(e) => setQuickPayBankRef(e.target.value)}
                  className="w-full bg-[#1c1e28] border border-[#2e3342] text-white font-mono p-2.5 rounded-xl focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuickPayProject(null)}
                  className="flex-1 py-2.5 bg-[#1f222b] text-gray-300 font-bold rounded-xl"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                >
                  Xác Nhận Thu Tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REMINDER MODAL */}
      {reminderProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14161c] border border-[#2a2d39] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <BellRing className="w-5 h-5" />
                <span>Nhắc Nợ Zalo/SMS Sinh Viên</span>
              </h3>
              <button onClick={() => setReminderProject(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#1c1e28] rounded-xl border border-[#2e3342]">
                <div className="font-bold text-white">{reminderProject.studentName} - {reminderProject.studentPhone}</div>
                <div className="text-gray-400 mt-0.5">Đồ án: {reminderProject.code}</div>
                <div className="text-rose-400 font-mono font-bold mt-1">
                  Số tiền còn thiếu: {formatVND(reminderProject.totalContract - reminderProject.paidAmount)}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Mẫu Tin Nhắn Nhắc Nợ Tự Động:</label>
                <textarea
                  readOnly
                  rows={4}
                  value={`[Lubpy Studio] Chào ${reminderProject.studentName}, đồ án ${reminderProject.code} của bạn sắp đến hạn bàn giao (${reminderProject.dueDate}). Vui lòng hoàn tất số tiền còn thiếu ${formatVND(reminderProject.totalContract - reminderProject.paidAmount)} qua MBBank: 999988883333 (Lubpy Studio) để nhận toàn bộ Source Code & Báo cáo nhé!`}
                  className="w-full bg-[#181a22] border border-[#2e3342] text-gray-300 p-2.5 rounded-xl font-mono text-[11px] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`[Lubpy Studio] Chào ${reminderProject.studentName}, đồ án ${reminderProject.code} của bạn sắp đến hạn bàn giao (${reminderProject.dueDate}). Vui lòng hoàn tất số tiền còn thiếu ${formatVND(reminderProject.totalContract - reminderProject.paidAmount)} qua MBBank: 999988883333 (Lubpy Studio) để nhận toàn bộ Source Code & Báo cáo nhé!`);
                    triggerToast('📋 Đã sao chép nội dung tin nhắn nhắc nợ Zalo!');
                    setReminderProject(null);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Sao Chép Tin Nhắn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: INVOICE MODAL */}
      {invoiceProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14161c] border border-[#2a2d39] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <span>Hóa Đơn &amp; Phiếu Thu Tiền</span>
              </h3>
              <button onClick={() => setInvoiceProject(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-[#181a22] rounded-2xl border border-[#2e3342] space-y-3 font-mono text-xs">
              <div className="flex justify-between items-start border-b border-[#2d3142] pb-3">
                <div>
                  <span className="font-bold text-orange-400">LUBPY STUDIO</span>
                  <div className="text-[10px] text-gray-400">HÓA ĐƠN DỊCH VỤ CNTT</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{invoiceProject.code}</div>
                  <div className="text-[10px] text-gray-400">Mã GD: {invoiceProject.bankTransactionCode || 'MBB-8822019'}</div>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div>Sinh Viên: <span className="text-white font-bold">{invoiceProject.studentName}</span> ({invoiceProject.studentPhone})</div>
                <div>Đồ Án: <span className="text-white font-bold">{invoiceProject.name}</span></div>
                <div>Tổng Giá Trị: <span className="text-white font-bold">{formatVND(invoiceProject.totalContract)}</span></div>
                <div>Đã Thanh Toán: <span className="text-emerald-400 font-bold">{formatVND(invoiceProject.paidAmount)}</span></div>
                <div>Còn Thiếu: <span className="text-rose-400 font-bold">{formatVND(invoiceProject.totalContract - invoiceProject.paidAmount)}</span></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  triggerToast('📄 Đã xuất bản in Hóa đơn PDF cho sinh viên!');
                  setInvoiceProject(null);
                }}
                className="w-full py-2.5 bg-sky-500 text-slate-950 font-black rounded-xl hover:bg-sky-400 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In Hóa Đơn PDF</span>
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
        }}
        onTriggerToast={triggerToast}
      />
    </div>
  );
}
