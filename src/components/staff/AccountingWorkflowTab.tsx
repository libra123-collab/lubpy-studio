import React, { useState, useEffect } from 'react';
import { 
  DollarSign, FileText, Send, CheckCircle2, Clock, AlertCircle, 
  Sparkles, RefreshCw, UserCheck, CreditCard, Shield, Download,
  Layers, ArrowRight
} from 'lucide-react';
import { User } from '../../types';
import { 
  getWorkflowProjects, 
  accountingSendInvoiceToCS, 
  formatVNDCurrency,
  WorkflowProject 
} from '../../utils/projectWorkflowStore';
import { sendNewNotification } from '../../utils/notificationStore';
import ProjectContractModal from '../ProjectContractModal';

interface AccountingWorkflowTabProps {
  currentUser: User;
  onTriggerToast: (msg: string) => void;
  language?: 'en' | 'vi';
}

export default function AccountingWorkflowTab({
  currentUser,
  onTriggerToast,
  language = 'vi'
}: AccountingWorkflowTabProps) {
  const [projects, setProjects] = useState<WorkflowProject[]>(() => getWorkflowProjects());
  const [selectedContractProject, setSelectedContractProject] = useState<WorkflowProject | null>(null);

  // Invoice Dispatch Modal state
  const [invoiceModalProject, setInvoiceModalProject] = useState<WorkflowProject | null>(null);
  const [customInvoiceId, setCustomInvoiceId] = useState('');
  const [invoiceNote, setInvoiceNote] = useState('');

  const refreshProjects = () => {
    setProjects(getWorkflowProjects());
  };

  useEffect(() => {
    refreshProjects();
    const handleUpdate = () => refreshProjects();
    window.addEventListener('lubpy_workflow_projects_updated', handleUpdate);
    return () => window.removeEventListener('lubpy_workflow_projects_updated', handleUpdate);
  }, []);

  // Handler: Accounting completes invoice and sends it back to the assigned CSKH
  const handleConfirmSendInvoiceToCS = () => {
    if (!invoiceModalProject) return;

    const res = accountingSendInvoiceToCS(invoiceModalProject.id, customInvoiceId);
    if (res) {
      // Send notification specifically to CS Department & assigned CS agent
      sendNewNotification({
        senderName: `${currentUser.name || 'Kế Toán Trưởng'} (Phòng Kế Toán & Tài Chính)`,
        senderEmail: currentUser.email,
        targetScope: 'single_position',
        targetDeptKey: 'cs',
        targetPosition: 'Chuyên Viên Tư Vấn CSKH & Support',
        title: `📄 Đã phát hành Hóa Đơn ${res.invoiceId} cho dự án ${res.id}`,
        content: `Kế toán đã hoàn tất hóa đơn ${res.invoiceId} cho khách hàng ${res.clientName} (Dự án: ${res.projectName}):\n- Tổng tiền: ${formatVNDCurrency(res.totalAmountVnd)}\n- Tiền cọc: ${formatVNDCurrency(res.depositAmountVnd)}\n- Trả nốt sau: ${formatVNDCurrency(res.remainingAmountVnd)}\nHóa đơn đã được gửi lại cho CSKH đảm nhận (${res.assignedCS}) để gửi khách hàng!`,
        priority: 'urgent',
      });

      onTriggerToast(`✅ Đã phát hành hóa đơn ${res.invoiceId} & chuyển lại cho CSKH (${res.assignedCS})!`);
      setInvoiceModalProject(null);
      setCustomInvoiceId('');
      setInvoiceNote('');
      refreshProjects();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#181a20] via-emerald-950/40 to-[#181a20] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                Kế toán &amp; Quản Lý Hóa Đơn Dự Án
              </span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Nghiệp vụ Yêu Cầu 3 &amp; 4
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Phát Hành Hóa Đơn &amp; Chuyển Lại Cho Chuyên Viên CSKH Đảm Nhận
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl mt-1 leading-relaxed">
              Tiếp nhận thỏa thuận chi phí từ Đội Ngũ Kỹ Thuật ➔ Lập hóa đơn chính thức (Tiền cọc &amp; Tiền trả nốt) ➔ Gửi lại cho CSKH đã tiếp nhận khách hàng đó ➔ Ký duyệt số hợp đồng.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshProjects}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl transition-all cursor-pointer self-start sm:self-center"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Feed for Accounting */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="p-12 text-center bg-[#181a20] border border-white/10 rounded-2xl text-gray-400 text-xs">
            Hiện chưa có dự án nào trong hệ thống kế toán.
          </div>
        ) : (
          projects.map((prj) => {
            const hasInvoice = !!prj.invoiceId;
            const isSentToCS = prj.status === 'invoice_sent_to_cs' || prj.status === 'invoice_sent_to_client' || prj.paymentStatus !== 'unpaid';

            return (
              <div
                key={prj.id}
                className="p-5 rounded-2xl bg-[#14161c] border border-white/10 hover:border-emerald-500/40 transition-all shadow-lg space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {prj.id}
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {prj.projectName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      prj.paymentStatus === 'paid_100'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : prj.paymentStatus === 'deposit_paid'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {prj.paymentStatus === 'paid_100' ? 'Đã thanh toán đủ 100%' : prj.paymentStatus === 'deposit_paid' ? 'Đã đặt cọc 50%' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  {/* Client & Assigned CS */}
                  <div className="p-3 bg-slate-900/70 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Khách Hàng &amp; CSKH Đảm Nhận (Requirement 4)
                    </span>
                    <p><strong className="text-white">Khách hàng:</strong> {prj.clientName}</p>
                    <p><strong className="text-white">Điện thoại:</strong> {prj.clientPhone}</p>
                    <p><strong className="text-white">CSKH đảm nhận:</strong> <span className="text-sky-300 font-bold">{prj.assignedCS}</span></p>
                    <p><strong className="text-white">Kỹ sư phụ trách:</strong> {prj.assignedDev}</p>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="p-3 bg-slate-900/70 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Thống Kê Chi Phí Hợp Đồng
                    </span>
                    <p><strong className="text-white">Tổng giá trị:</strong> <span className="text-amber-300 font-bold">{formatVNDCurrency(prj.totalAmountVnd)}</span></p>
                    <p><strong className="text-white">Tiền cọc trước khi làm:</strong> <span className="text-sky-300 font-bold">{formatVNDCurrency(prj.depositAmountVnd)}</span></p>
                    <p><strong className="text-white">Trả nốt khi xong:</strong> <span className="text-emerald-300 font-bold">{formatVNDCurrency(prj.remainingAmountVnd)}</span></p>
                  </div>

                  {/* Invoice Code */}
                  <div className="p-3 bg-slate-900/70 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Mã Hóa Đơn &amp; Trạng Thái Chuyển CSKH
                    </span>
                    <p><strong className="text-white">Mã Hóa Đơn:</strong> <span className="font-mono text-emerald-400 font-bold">{prj.invoiceId || 'Chưa phát hành'}</span></p>
                    <p><strong className="text-white">Ngày lập:</strong> {prj.invoiceDate || 'Chưa xác lập'}</p>
                    <p className="text-[11px] text-gray-400">
                      Trạng thái: <span className={isSentToCS ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{isSentToCS ? `Đã chuyển hóa đơn lại cho ${prj.assignedCS}` : 'Chờ kế toán phát hành hóa đơn'}</span>
                    </p>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedContractProject(prj)}
                    className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Hợp Đồng &amp; Chữ Ký Kế Toán Trưởng ({prj.contract?.signatures?.length || 0}/4)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Requirement 4 Action: Accounting sends invoice back to assigned CS */}
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceModalProject(prj);
                        setCustomInvoiceId(prj.invoiceId || `HD-2026-${Math.floor(100 + Math.random() * 900)}`);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>📤 Phát Hành Hóa Đơn &amp; Gửi Lại Cho CSKH Đảm Nhận</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Invoice Modal */}
      {invoiceModalProject && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Phát Hành Hóa Đơn &amp; Chuyển Lại Cho CSKH Đảm Nhận (Requirement 4)
            </h3>
            <p className="text-xs text-gray-400">
              Dự án: <strong className="text-white">{invoiceModalProject.projectName}</strong> ({invoiceModalProject.id})<br />
              Khách hàng: <strong className="text-white">{invoiceModalProject.clientName}</strong><br />
              Chuyên viên CSKH nhận lại hóa đơn: <strong className="text-sky-300">{invoiceModalProject.assignedCS}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Mã số hóa đơn tài chính *</label>
                <input
                  type="text"
                  required
                  value={customInvoiceId}
                  onChange={(e) => setCustomInvoiceId(e.target.value)}
                  placeholder="HD-2026-001"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Financial Review Box */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-1 text-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Tổng thanh toán hợp đồng:</span>
                  <strong className="text-amber-300 font-bold">
                    {formatVNDCurrency(invoiceModalProject.totalAmountVnd)}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Tiền cọc yêu cầu thanh toán đợt 1:</span>
                  <strong className="text-sky-300 font-bold">
                    {formatVNDCurrency(invoiceModalProject.depositAmountVnd)}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Số tiền còn lại thanh toán đợt 2:</span>
                  <strong className="text-emerald-300 font-bold">
                    {formatVNDCurrency(invoiceModalProject.remainingAmountVnd)}
                  </strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Ghi chú gửi kèm cho CSKH</label>
                <textarea
                  rows={2}
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                  placeholder="Ví dụ: Đã xuất phiếu thu, yêu cầu khách chuyển khoản đúng mã hóa đơn kèm tên học viên..."
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInvoiceModalProject(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSendInvoiceToCS}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Phát Hành &amp; Gửi Lại Cho CSKH
              </button>
            </div>
          </div>
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
