import React, { useState, useEffect } from 'react';
import { 
  Code, UserCheck, DollarSign, Calendar, Clock, CheckCircle2, 
  AlertCircle, Send, FileText, Sparkles, RefreshCw, ChevronRight,
  Shield, Layers, Wrench, Users, ArrowRight
} from 'lucide-react';
import { User } from '../../types';
import { 
  getWorkflowProjects, 
  techLeadAssignDeveloper, 
  techSubmitPricingToAccounting, 
  formatVNDCurrency,
  WorkflowProject 
} from '../../utils/projectWorkflowStore';
import { sendNewNotification } from '../../utils/notificationStore';
import ProjectContractModal from '../ProjectContractModal';

interface TechWorkflowTabProps {
  currentUser: User;
  onTriggerToast: (msg: string) => void;
  language?: 'en' | 'vi';
}

const AVAILABLE_ENGINEERS = [
  { name: 'Trần Hoàng Nam', role: 'Senior Fullstack & AI Lead', stack: 'React, Node, Python, PyTorch' },
  { name: 'Lê Minh Tuấn', role: 'Frontend & UI/UX Specialist', stack: 'NextJS, Tailwind, Three.js' },
  { name: 'Phạm Đức Huy', role: 'Backend & Cloud DevOps Engineer', stack: 'Go, PostgreSQL, Docker, AWS' },
  { name: 'Ngô Văn Phúc', role: 'Mobile App Developer', stack: 'Flutter, React Native, Firebase' },
  { name: 'Đỗ Thùy Trang', role: 'QA & Test Automation Engineer', stack: 'Selenium, Postman, Jest' }
];

export default function TechWorkflowTab({
  currentUser,
  onTriggerToast,
  language = 'vi'
}: TechWorkflowTabProps) {
  const [projects, setProjects] = useState<WorkflowProject[]>(() => getWorkflowProjects());
  const [selectedContractProject, setSelectedContractProject] = useState<WorkflowProject | null>(null);

  // Assign Dev Modal state
  const [assignModalProject, setAssignModalProject] = useState<WorkflowProject | null>(null);
  const [selectedDevName, setSelectedDevName] = useState(AVAILABLE_ENGINEERS[0].name);
  const [assignDeadline, setAssignDeadline] = useState('2026-10-25');
  const [devNotes, setDevNotes] = useState('');

  // Pricing Consensus Modal state (Tech <-> Accounting)
  const [priceModalProject, setPriceModalProject] = useState<WorkflowProject | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(12000000);
  const [depositRate, setDepositRate] = useState<number>(50); // 50%
  const [pricingNotes, setPricingNotes] = useState('');

  const refreshProjects = () => {
    setProjects(getWorkflowProjects());
  };

  useEffect(() => {
    refreshProjects();
    const handleUpdate = () => refreshProjects();
    window.addEventListener('lubpy_workflow_projects_updated', handleUpdate);
    return () => window.removeEventListener('lubpy_workflow_projects_updated', handleUpdate);
  }, []);

  // Filter projects relevant for Tech team
  const techProjects = projects;

  // Handler: Assign developer subordinate
  const handleConfirmAssignDev = () => {
    if (!assignModalProject) return;

    const res = techLeadAssignDeveloper(assignModalProject.id, selectedDevName, assignDeadline);
    if (res) {
      sendNewNotification({
        senderName: `${currentUser.name || 'Tech Lead'} (Trưởng Kỹ Thuật)`,
        senderEmail: currentUser.email,
        targetScope: 'single_position',
        targetDeptKey: 'tech',
        targetPosition: 'Senior Developer',
        title: `🎯 Phân công dự án mới: ${res.id}`,
        content: `Kỹ sư ${selectedDevName} đã được phân công đảm nhận dự án "${res.projectName}". Hạn chót hoàn thiện: ${assignDeadline}. Ghi chú: ${devNotes || 'Triển khai theo chuẩn Clean Code'}`,
        priority: 'important',
      });

      onTriggerToast(`✅ Đã phân công kỹ sư ${selectedDevName} phụ trách dự án ${res.id}!`);
      setAssignModalProject(null);
      setDevNotes('');
      refreshProjects();
    }
  };

  // Handler: Submit pricing agreement to Accounting
  const handleConfirmPriceConsensus = () => {
    if (!priceModalProject) return;

    const calculatedDeposit = Math.round((totalPrice * depositRate) / 100);
    const res = techSubmitPricingToAccounting(
      priceModalProject.id,
      totalPrice,
      calculatedDeposit,
      `Thống nhất chi phí kỹ thuật: ${pricingNotes || 'Đã kiểm tra khối lượng module & công nghệ'}`
    );

    if (res) {
      sendNewNotification({
        senderName: `${currentUser.name || 'Tech Lead'} (Trưởng Đội Ngũ Kỹ Thuật)`,
        senderEmail: currentUser.email,
        targetScope: 'single_position',
        targetDeptKey: 'accounting',
        targetPosition: 'Kế Toán Trưởng & Tài Chính',
        title: `💰 Thống nhất giá cả & Tiền cọc dự án ${res.id}`,
        content: `Đội ngũ Kỹ Thuật đã thống nhất chi phí với Kế toán cho dự án "${res.projectName}":\n- Tổng giá: ${formatVNDCurrency(totalPrice)}\n- Tiền cọc trước khi làm (${depositRate}%): ${formatVNDCurrency(calculatedDeposit)}\n- Số tiền trả nốt còn lại: ${formatVNDCurrency(totalPrice - calculatedDeposit)}\nVui lòng Kế toán lập hóa đơn gửi lại cho CSKH!`,
        priority: 'urgent',
      });

      onTriggerToast(`✅ Đã thống nhất giá cả & gửi sang Kế Toán lập hóa đơn!`);
      setPriceModalProject(null);
      setPricingNotes('');
      refreshProjects();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#181a20] via-sky-950/40 to-[#181a20] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-md">
                Kỹ thuật &amp; Phân Công Nhiệm Vụ
              </span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Nghiệp vụ Yêu Cầu 2 &amp; 3
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Tiếp Nhận Dự Án Từ CSKH &amp; Thống Nhất Giá Với Kế Toán
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl mt-1 leading-relaxed">
              Trưởng Đội Ngũ Kỹ Thuật (Tech Lead) xem xét yêu cầu từ CSKH ➔ Phân chia nhiệm vụ cho các kỹ sư cấp dưới làm ➔ Thống nhất giá cả &amp; tiền cọc với Kế toán ➔ Ký duyệt hợp đồng số.
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

      {/* Projects Feed */}
      <div className="space-y-4">
        {techProjects.length === 0 ? (
          <div className="p-12 text-center bg-[#181a20] border border-white/10 rounded-2xl text-gray-400 text-xs">
            Hiện chưa có dự án nào được CSKH chuyển giao.
          </div>
        ) : (
          techProjects.map((prj) => {
            const hasAssignedDev = prj.assignedDev && !prj.assignedDev.includes('Chờ');
            const isPriceAgreed = ['price_agreed', 'invoice_sent_to_cs', 'invoice_sent_to_client', 'deposit_paid', 'fully_paid', 'delivered', 'client_satisfied'].includes(prj.status);

            return (
              <div
                key={prj.id}
                className="p-5 rounded-2xl bg-[#14161c] border border-white/10 hover:border-sky-500/40 transition-all shadow-lg space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {prj.id}
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {prj.projectName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {prj.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-gray-300">
                      Hạn chót: {prj.deadline}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  {/* Customer Scope */}
                  <div className="p-3 bg-slate-900/70 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Yêu Cầu Tiếp Nhận Từ CSKH
                    </span>
                    <p><strong className="text-white">Khách hàng:</strong> {prj.clientName} ({prj.clientPhone})</p>
                    <p><strong className="text-white">CS tiếp nhận:</strong> {prj.assignedCS}</p>
                    <p className="text-gray-300 line-clamp-3">
                      <strong className="text-white">Mô tả:</strong> {prj.requirements}
                    </p>
                  </div>

                  {/* Dev Assignment */}
                  <div className="p-3 bg-slate-900/70 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Phân Công Kỹ Sư Cấp Dưới (Requirement 2)
                    </span>
                    <p>
                      <strong className="text-white">Kỹ sư phụ trách:</strong>{' '}
                      <span className={hasAssignedDev ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {prj.assignedDev}
                      </span>
                    </p>
                    <p><strong className="text-white">Hạn cam kết:</strong> {prj.deadline}</p>
                    <p className="text-gray-400 text-[11px]">
                      {hasAssignedDev ? 'Kỹ sư đã nhận task và đang triển khai source code.' : 'Chưa phân công kỹ sư. Vui lòng chọn kỹ sư phù hợp.'}
                    </p>
                  </div>

                  {/* Pricing Consensus with Accounting */}
                  <div className="p-3 bg-slate-900/70 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Thống Nhất Giá &amp; Cọc Kế Toán (Requirement 3)
                    </span>
                    <p><strong className="text-white">Tổng chi phí:</strong> <span className="text-amber-300 font-bold">{formatVNDCurrency(prj.totalAmountVnd)}</span></p>
                    <p><strong className="text-white">Tiền cọc trước khi làm:</strong> <span className="text-sky-300 font-bold">{formatVNDCurrency(prj.depositAmountVnd)}</span></p>
                    <p><strong className="text-white">Trả nốt khi xong:</strong> <span className="text-emerald-300 font-bold">{formatVNDCurrency(prj.remainingAmountVnd)}</span></p>
                    <p className="text-[10px] text-gray-400">
                      Trạng thái: <span className={isPriceAgreed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{isPriceAgreed ? 'Đã thống nhất giá với Kế toán' : 'Chưa gửi bảng giá Kế toán'}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedContractProject(prj)}
                    className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Hợp Đồng &amp; Chữ Ký Tech Lead ({prj.contract?.signatures?.length || 0}/4)</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Requirement 2 Action: Assign Dev Subordinate */}
                    <button
                      type="button"
                      onClick={() => {
                        setAssignModalProject(prj);
                        setAssignDeadline(prj.deadline || '2026-10-25');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-950/40"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>🎯 Phân Chia Nhiệm Vụ Cho Kỹ Sư</span>
                    </button>

                    {/* Requirement 3 Action: Price Consensus with Accounting */}
                    <button
                      type="button"
                      onClick={() => {
                        setPriceModalProject(prj);
                        setTotalPrice(prj.totalAmountVnd || 12000000);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>💰 Thống Nhất Giá &amp; Cọc Với Kế Toán</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Assign Developer Modal */}
      {assignModalProject && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              Phân Chia Nhiệm Vụ Cho Kỹ Sư Cấp Dưới
            </h3>
            <p className="text-xs text-gray-400">
              Dự án: <strong className="text-white">{assignModalProject.projectName}</strong> ({assignModalProject.id})
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Chọn kỹ sư lập trình phù hợp với Tech Stack:
                </label>
                <div className="space-y-2">
                  {AVAILABLE_ENGINEERS.map((eng) => (
                    <label
                      key={eng.name}
                      onClick={() => setSelectedDevName(eng.name)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedDevName === eng.name
                          ? 'bg-sky-500/20 border-sky-500/50 text-white'
                          : 'bg-slate-950/60 border-white/5 text-gray-400 hover:bg-slate-950'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{eng.name}</span>
                        <span className="text-[10px] text-sky-300 block">{eng.role}</span>
                        <span className="text-[9px] text-gray-400 font-mono block">Stack: {eng.stack}</span>
                      </div>
                      <input
                        type="radio"
                        name="dev_selection"
                        checked={selectedDevName === eng.name}
                        onChange={() => setSelectedDevName(eng.name)}
                        className="accent-sky-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Hạn chót hoàn thành (Deadline)</label>
                <input
                  type="date"
                  value={assignDeadline}
                  onChange={(e) => setAssignDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Chỉ đạo kỹ thuật &amp; Module phân chia</label>
                <textarea
                  rows={2}
                  value={devNotes}
                  onChange={(e) => setDevNotes(e.target.value)}
                  placeholder="Ví dụ: Thiết kế Database PostgreSQL trước, xây dựng API Authentication, kết nối Payment Gateway..."
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalProject(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignDev}
                className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Giao Việc Cho Kỹ Sư
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Consensus Modal with Accounting */}
      {priceModalProject && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Thống Nhất Giá Cả &amp; Tiền Cọc Với Kế Toán (Requirement 3)
            </h3>
            <p className="text-xs text-gray-400">
              Dự án: <strong className="text-white">{priceModalProject.projectName}</strong> ({priceModalProject.id})<br />
              Khách hàng: <strong className="text-white">{priceModalProject.clientName}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Tổng giá trị dự án thống nhất (VNĐ) *
                </label>
                <input
                  type="number"
                  step={500000}
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Tỷ lệ tiền cọc trước khi làm (%)
                </label>
                <div className="flex items-center gap-3">
                  {[30, 40, 50].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setDepositRate(rate)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        depositRate === rate
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-950 border border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {rate}% Cọc
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Summary Box */}
              <div className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Tiền cọc trước khi làm ({depositRate}%):</span>
                  <strong className="text-sky-300 font-bold">
                    {formatVNDCurrency(Math.round((totalPrice * depositRate) / 100))}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Số tiền trả nốt sau khi làm xong:</span>
                  <strong className="text-emerald-300 font-bold">
                    {formatVNDCurrency(totalPrice - Math.round((totalPrice * depositRate) / 100))}
                  </strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Ghi chú thống kê chi phí cho Kế Toán Trưởng</label>
                <textarea
                  rows={2}
                  value={pricingNotes}
                  onChange={(e) => setPricingNotes(e.target.value)}
                  placeholder="Ghi chú: Đã tính chi phí Server Cloud 3 tháng, công lập trình 2 kỹ sư và hỗ trợ GVHD phản biện..."
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPriceModalProject(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmPriceConsensus}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Gửi Kế Toán Lập Hóa Đơn
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
