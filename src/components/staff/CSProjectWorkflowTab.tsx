import React, { useState, useEffect } from 'react';
import { 
  Layers, Search, ArrowRight, CheckCircle2, Clock, AlertCircle, 
  Send, UserCheck, CreditCard, Shield, Download, ExternalLink, 
  Star, HeartHandshake, FileText, Sparkles, Plus, Eye, RefreshCw
} from 'lucide-react';
import { User } from '../../types';
import { 
  getWorkflowProjects, 
  csHandoverToTechTeam, 
  csSendInvoiceToClient, 
  csDeliverProjectToClient, 
  formatVNDCurrency,
  WorkflowProject,
  createProjectFromSupportRequest
} from '../../utils/projectWorkflowStore';
import { sendNewNotification } from '../../utils/notificationStore';
import ProjectContractModal from '../ProjectContractModal';

interface CSProjectWorkflowTabProps {
  currentUser: User;
  onTriggerToast: (msg: string) => void;
  language?: 'en' | 'vi';
}

export default function CSProjectWorkflowTab({
  currentUser,
  onTriggerToast,
  language = 'vi'
}: CSProjectWorkflowTabProps) {
  const [projects, setProjects] = useState<WorkflowProject[]>(() => getWorkflowProjects());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals
  const [selectedContractProject, setSelectedContractProject] = useState<WorkflowProject | null>(null);
  const [handoverModalProject, setHandoverModalProject] = useState<WorkflowProject | null>(null);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [deliverModalProject, setDeliverModalProject] = useState<WorkflowProject | null>(null);
  const [sourceCodeUrl, setSourceCodeUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('');
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);

  // New Request Form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newCategory, setNewCategory] = useState('Đồ án tốt nghiệp CNTT');
  const [newRequirements, setNewRequirements] = useState('');
  const [newBudget, setNewBudget] = useState(12000000);

  const refreshProjects = () => {
    setProjects(getWorkflowProjects());
  };

  useEffect(() => {
    refreshProjects();
    const handleUpdate = () => refreshProjects();
    window.addEventListener('lubpy_workflow_projects_updated', handleUpdate);
    return () => window.removeEventListener('lubpy_workflow_projects_updated', handleUpdate);
  }, []);

  // Filtered list
  const filtered = projects.filter(p => {
    const matchSearch = 
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientPhone.includes(searchTerm);

    if (!matchSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'need_handover') return p.status === 'cs_intake';
    if (statusFilter === 'in_progress') return ['tech_assigned', 'price_agreed'].includes(p.status);
    if (statusFilter === 'invoice_ready') return p.status === 'invoice_sent_to_cs';
    if (statusFilter === 'paid') return p.paymentStatus === 'paid_100';
    if (statusFilter === 'delivered') return p.status === 'delivered' || p.status === 'client_satisfied';
    return true;
  });

  // Action 1: CSKH Handover to Technical Team
  const handleConfirmHandover = () => {
    if (!handoverModalProject) return;

    const res = csHandoverToTechTeam(handoverModalProject.id, handoverNotes);
    if (res) {
      // Send notification to Tech Team
      sendNewNotification({
        senderName: `${currentUser.name || 'CS Specialist'} (Chăm Sóc Khách Hàng)`,
        senderEmail: currentUser.email,
        targetScope: 'single_position',
        targetDeptKey: 'tech',
        targetPosition: 'Fullstack Lead Dev (Trưởng Nhóm Lập Trình)',
        title: `🚀 CSKH chuyển giao yêu cầu dự án: ${res.id}`,
        content: `Khách hàng: ${res.clientName} (${res.clientPhone})\nĐề tài: ${res.projectName}\nYêu cầu: ${res.requirements}\nCSKH đã tiếp nhận đầy đủ thông tin và chuyển sang để Trưởng Kỹ Thuật phân công kỹ sư cấp dưới triển khai!`,
        priority: 'urgent',
      });

      onTriggerToast(`✅ Đã chuyển giao dự án ${res.id} sang Đội Ngũ Kỹ Thuật!`);
      setHandoverModalProject(null);
      setHandoverNotes('');
      refreshProjects();
    }
  };

  // Action 2: CSKH sends progress report & invoice to client
  const handleSendInvoiceToClient = (prj: WorkflowProject) => {
    const res = csSendInvoiceToClient(prj.id);
    if (res) {
      sendNewNotification({
        senderName: `${currentUser.name || 'CSKH'} (LUBPY Support)`,
        senderEmail: currentUser.email,
        targetScope: 'all_members',
        title: `📄 Báo cáo tiến độ & Hóa đơn dự án ${prj.id}`,
        content: `CSKH đã gửi báo cáo hoàn thành và Hóa đơn ${prj.invoiceId || 'HD-2026'} tới khách hàng ${prj.clientName}. Vui lòng thanh toán để nhận Source Code & Link Demo chính thức.`,
        priority: 'important',
      });

      onTriggerToast(`📤 Đã báo cáo tiến độ và gửi hóa đơn cho khách hàng ${prj.clientName}!`);
      refreshProjects();
    }
  };

  // Action 3: CSKH delivers project deliverables (Strict gate: paid_100)
  const handleConfirmDelivery = () => {
    if (!deliverModalProject) return;

    const res = csDeliverProjectToClient(deliverModalProject.id, {
      sourceCodeUrl: sourceCodeUrl || 'https://github.com/lubpystudio/release-repo',
      liveDemoUrl: liveDemoUrl || 'https://demo.lubpystudio.vn',
      documentationUrl: documentationUrl || 'https://docs.lubpystudio.vn/full-report.pdf'
    });

    if (res.success) {
      onTriggerToast(`🎉 Đã mở khóa & bàn giao dự án ${deliverModalProject.id} cho khách hàng ${deliverModalProject.clientName}!`);
      setDeliverModalProject(null);
      setSourceCodeUrl('');
      setLiveDemoUrl('');
      setDocumentationUrl('');
      refreshProjects();
    } else {
      onTriggerToast(`⚠️ ${res.error}`);
    }
  };

  // Action 4: Create new client request manually
  const handleCreateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newProjectName) {
      onTriggerToast('⚠️ Vui lòng điền họ tên khách hàng và tên dự án.');
      return;
    }

    const created = createProjectFromSupportRequest({
      clientName: newClientName,
      clientEmail: newClientEmail || `${newClientName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      clientPhone: newClientPhone || '0900000000',
      projectName: newProjectName,
      category: newCategory,
      requirements: newRequirements || 'Phát triển hệ thống phần mềm hoàn chỉnh theo yêu cầu',
      estimatedBudget: Number(newBudget) || 12000000,
      assignedCS: `${currentUser.name || 'Chuyên viên CSKH'} (${currentUser.departmentTitle || 'CS Specialist'})`
    });

    onTriggerToast(`✅ Đã tạo hồ sơ yêu cầu dự án ${created.id} thành công!`);
    setShowCreateRequestModal(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewProjectName('');
    setNewRequirements('');
    refreshProjects();
  };

  return (
    <div className="space-y-6">
      {/* Header & Metric Banner */}
      <div className="bg-gradient-to-r from-[#181a20] via-indigo-950/40 to-[#181a20] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-md">
                Quy trình nghiệp vụ 6 bước
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Hợp Tác Đa Phòng Ban LUBPY STUDIO
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Quản Lý Dự Án, Hóa Đơn &amp; Bàn Giao Khách Hàng
            </h2>
            <p className="text-xs text-gray-400 max-w-3xl mt-1 leading-relaxed">
              Tiếp nhận yêu cầu từ Khách hàng / Lubpy AI ➔ Chuyển giao Kỹ thuật ➔ Thống nhất giá Kế toán ➔ Nhận Hóa đơn &amp; Gửi Khách ➔ Khách thanh toán 100% ➔ Bàn giao Source Code ➔ Lubpy AI Tri ân &amp; Các Trưởng ban ký số hợp đồng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateRequestModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-950/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tiếp Nhận Đồ Án Mới</span>
            </button>

            <button
              type="button"
              onClick={refreshProjects}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl transition-all cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Pipeline Stat Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">1. Chờ chuyển Kỹ thuật:</span>
            <span className="text-lg font-black text-amber-400">
              {projects.filter(p => p.status === 'cs_intake').length}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">2. Đang code &amp; Thống nhất giá:</span>
            <span className="text-lg font-black text-sky-400">
              {projects.filter(p => ['tech_assigned', 'price_agreed'].includes(p.status)).length}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">3. Hóa đơn nhận từ Kế toán:</span>
            <span className="text-lg font-black text-indigo-400">
              {projects.filter(p => p.status === 'invoice_sent_to_cs' || p.status === 'invoice_sent_to_client').length}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">4. Đã thanh toán &amp; Bàn giao:</span>
            <span className="text-lg font-black text-emerald-400">
              {projects.filter(p => p.status === 'delivered' || p.status === 'client_satisfied').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#181a20] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, mã dự án, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-400">Lọc theo trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả ({projects.length})</option>
            <option value="need_handover">Chờ chuyển Kỹ Thuật</option>
            <option value="in_progress">Kỹ thuật đang xử lý</option>
            <option value="invoice_ready">Hóa đơn Kế toán gửi lại</option>
            <option value="paid">Khách đã thanh toán đủ</option>
            <option value="delivered">Đã hoàn tất bàn giao</option>
          </select>
        </div>
      </div>

      {/* Projects List Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-[#181a20] border border-white/10 rounded-2xl text-gray-400 text-xs">
            Không tìm thấy dự án nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          filtered.map((prj) => {
            const isDelivered = prj.status === 'delivered' || prj.status === 'client_satisfied';
            const isFullyPaid = prj.paymentStatus === 'paid_100';
            const isInvoiceReady = prj.status === 'invoice_sent_to_cs' || prj.status === 'invoice_sent_to_client';

            return (
              <div 
                key={prj.id}
                className="p-5 rounded-2xl bg-[#14161c] border border-white/10 hover:border-sky-500/40 transition-all shadow-lg space-y-4"
              >
                {/* Row 1: ID, Title, Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {prj.id}
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {prj.projectName}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      prj.status === 'cs_intake'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : prj.status === 'tech_assigned'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : prj.status === 'price_agreed'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : prj.status === 'invoice_sent_to_cs'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : prj.status === 'invoice_sent_to_client'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {prj.status === 'cs_intake' && '1. Chờ chuyển Kỹ Thuật'}
                      {prj.status === 'tech_assigned' && '2. Kỹ Thuật đang phân công'}
                      {prj.status === 'price_agreed' && '3. Kỹ thuật & Kế toán thống nhất giá'}
                      {prj.status === 'invoice_sent_to_cs' && '4. Kế toán đã gửi Hóa Đơn'}
                      {prj.status === 'invoice_sent_to_client' && '5. Đã gửi Hóa đơn cho Khách'}
                      {prj.status === 'deposit_paid' && 'Đã thanh toán cọc 50%'}
                      {prj.status === 'fully_paid' && 'Đã thanh toán đủ 100%'}
                      {prj.status === 'delivered' && 'Đã bàn giao dự án'}
                      {prj.status === 'client_satisfied' && '🌟 Khách hàng hài lòng 100%'}
                    </span>

                    {/* Payment badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      isFullyPaid 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : prj.paymentStatus === 'deposit_paid'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {isFullyPaid ? 'Đã thanh toán 100%' : prj.paymentStatus === 'deposit_paid' ? 'Đã cọc 50%' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Client Info & Requirements & Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Client details */}
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Thông Tin Khách Hàng
                    </span>
                    <p><strong className="text-white">Khách hàng:</strong> {prj.clientName}</p>
                    <p><strong className="text-white">Số điện thoại:</strong> {prj.clientPhone}</p>
                    <p><strong className="text-white">Email:</strong> {prj.clientEmail}</p>
                    <p><strong className="text-white">CS phụ trách:</strong> {prj.assignedCS}</p>
                  </div>

                  {/* Requirements & Dev */}
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Kỹ Thuật &amp; Tiến Độ
                    </span>
                    <p><strong className="text-white">Chuyên môn:</strong> {prj.category}</p>
                    <p><strong className="text-white">Kỹ sư phụ trách:</strong> {prj.assignedDev}</p>
                    <p><strong className="text-white">Hạn hoàn thành:</strong> {prj.deadline}</p>
                    <p className="text-gray-400 line-clamp-2" title={prj.requirements}>
                      <strong className="text-white">Yêu cầu:</strong> {prj.requirements}
                    </p>
                  </div>

                  {/* Financials & Invoice */}
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Hóa Đơn &amp; Tài Chính (Kế Toán)
                    </span>
                    <p><strong className="text-white">Mã Hóa đơn:</strong> <span className="font-mono text-indigo-300 font-bold">{prj.invoiceId || 'Chờ kế toán tạo'}</span></p>
                    <p><strong className="text-white">Tổng chi phí:</strong> <span className="font-bold text-amber-300">{formatVNDCurrency(prj.totalAmountVnd)}</span></p>
                    <p><strong className="text-white">Tiền cọc:</strong> <span className="text-sky-300 font-bold">{formatVNDCurrency(prj.depositAmountVnd)}</span></p>
                    <p><strong className="text-white">Số tiền còn lại:</strong> <span className="text-emerald-300 font-bold">{formatVNDCurrency(prj.remainingAmountVnd)}</span></p>
                  </div>
                </div>

                {/* Satisfaction Review & Lubpy AI Appreciation Note if present */}
                {prj.clientSatisfaction?.isSatisfied && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-amber-400" />
                        Đánh giá nghiệm thu của khách: {prj.clientSatisfaction.rating} ★★★★★
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{prj.clientSatisfaction.confirmedAt}</span>
                    </div>
                    <p className="text-gray-300 italic">"{prj.clientSatisfaction.feedback}"</p>
                    {prj.clientSatisfaction.lubpyAiThankYouMessage && (
                      <div className="mt-2 pt-2 border-t border-amber-500/20 text-[11px] text-amber-200 bg-black/40 p-2.5 rounded-lg whitespace-pre-wrap font-sans">
                        <div className="font-bold text-sky-300 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-sky-400" />
                          Thư tri ân tự động từ Lubpy AI:
                        </div>
                        {prj.clientSatisfaction.lubpyAiThankYouMessage}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons across the 6 Requirements */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedContractProject(prj)}
                      className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Hợp Đồng Dự Án ({prj.contract?.signatures?.length || 0}/4 Chữ ký)</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Requirement 2: CSKH Handover to Technical Team */}
                    {prj.status === 'cs_intake' && (
                      <button
                        type="button"
                        onClick={() => setHandoverModalProject(prj)}
                        className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-950/40"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>🚀 Chuyển Giao Sang Đội Ngũ Kỹ Thuật</span>
                      </button>
                    )}

                    {/* Requirement 5: CSKH sends invoice & progress report to client */}
                    {prj.status === 'invoice_sent_to_cs' && (
                      <button
                        type="button"
                        onClick={() => handleSendInvoiceToClient(prj)}
                        className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>📤 Báo Cáo Tiến Độ &amp; Gửi Hóa Đơn Cho Khách</span>
                      </button>
                    )}

                    {/* Requirement 5B: CSKH Delivers Project to Client (Strict Gate: MUST BE PAID_100) */}
                    {isFullyPaid && !isDelivered && (
                      <button
                        type="button"
                        onClick={() => setDeliverModalProject(prj)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 animate-pulse"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>📦 Mở Khóa &amp; Bàn Giao Dự Án Cho Khách Hàng</span>
                      </button>
                    )}

                    {/* Warning if client has not paid 100% */}
                    {!isFullyPaid && (prj.status === 'invoice_sent_to_client' || prj.status === 'deposit_paid') && (
                      <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Chờ khách thanh toán 100% mới được bàn giao Source Code</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Handover Modal (CSKH -> Technical Team) */}
      {handoverModalProject && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-400" />
              Chuyển Giao Yêu Cầu Sang Đội Ngũ Kỹ Thuật (Tech Team)
            </h3>
            <p className="text-xs text-gray-400">
              Dự án: <strong className="text-white">{handoverModalProject.projectName}</strong> ({handoverModalProject.id})<br />
              Khách hàng: <strong className="text-white">{handoverModalProject.clientName}</strong> ({handoverModalProject.clientPhone})
            </p>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Ghi chú bổ sung cho Trưởng Đội Ngũ Kỹ Thuật (Tech Lead):
              </label>
              <textarea
                rows={3}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Ví dụ: Khách cần bảo vệ vào giữa tháng 10, yêu cầu làm trên React + NodeJS chuẩn RESTful API, có kết nối cổng thanh toán VNPay..."
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHandoverModalProject(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmHandover}
                className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Xác Nhận Chuyển Kỹ Thuật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliver Project Modal (CSKH -> Client) */}
      {deliverModalProject && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Bàn Giao Dự Án Cho Khách Hàng (Mở Khóa Deliverables)
            </h3>
            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-200">
              ✅ Khách hàng <strong>{deliverModalProject.clientName}</strong> đã hoàn thành thanh toán 100% hợp đồng. Hệ thống cho phép mở khóa bàn giao toàn bộ sản phẩm.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Link Source Code (GitHub / GitLab / Google Drive .zip) *
                </label>
                <input
                  type="text"
                  value={sourceCodeUrl}
                  onChange={(e) => setSourceCodeUrl(e.target.value)}
                  placeholder="https://github.com/lubpystudio/release-project"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Link Live Demo Web / App APK (Trải nghiệm trực tuyến)
                </label>
                <input
                  type="text"
                  value={liveDemoUrl}
                  onChange={(e) => setLiveDemoUrl(e.target.value)}
                  placeholder="https://demo-project.lubpystudio.vn"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Link Báo Cáo Đồ Án &amp; Slide Thuyết Trình (.docx, .pdf)
                </label>
                <input
                  type="text"
                  value={documentationUrl}
                  onChange={(e) => setDocumentationUrl(e.target.value)}
                  placeholder="https://docs.lubpystudio.vn/final-report.pdf"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeliverModalProject(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelivery}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Xác Nhận Bàn Giao Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Request Creation Modal */}
      {showCreateRequestModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleCreateNewRequest} className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-400" />
              Tiếp Nhận Đề Tài &amp; Yêu Cầu Mới Từ Khách Hàng
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Họ tên khách hàng *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Email liên hệ</label>
              <input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="client@gmail.com"
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Tên đề tài / Dự án phần mềm *</label>
              <input
                type="text"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Website bán hàng trực tuyến tích hợp AI & VNPay"
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Chuyên môn</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="Đồ án tốt nghiệp CNTT">Đồ án tốt nghiệp CNTT</option>
                  <option value="Phát triển Web / Web App">Phát triển Web / Web App</option>
                  <option value="Lập trình Mobile App">Lập trình Mobile App</option>
                  <option value="Trí tuệ nhân tạo & AI">Trí tuệ nhân tạo & AI</option>
                  <option value="Fix bug demo / Sửa code gấp">Fix bug demo / Sửa code gấp</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Dự toán ước tính (VNĐ)</label>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(Number(e.target.value))}
                  step={500000}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Nội dung yêu cầu chi tiết</label>
              <textarea
                rows={3}
                value={newRequirements}
                onChange={(e) => setNewRequirements(e.target.value)}
                placeholder="Mô tả các chức năng bắt buộc, công nghệ mong muốn, deadline..."
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateRequestModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Tạo Hồ Sơ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contract & Digital Signature Modal */}
      {selectedContractProject && (
        <ProjectContractModal
          project={selectedContractProject}
          currentUser={currentUser}
          onClose={() => setSelectedContractProject(null)}
          onContractUpdated={(updatedPrj) => {
            setSelectedContractProject(updatedPrj);
            refreshProjects();
          }}
          language={language}
        />
      )}
    </div>
  );
}
