import React, { useState } from 'react';
import { 
  FileCheck, Shield, CheckCircle2, X, Download, Stamp, 
  UserCheck, Building2, Calendar, AlertCircle, Sparkles, Printer
} from 'lucide-react';
import { User } from '../types';
import { WorkflowProject, signProjectContract, formatVNDCurrency } from '../utils/projectWorkflowStore';

interface ProjectContractModalProps {
  project: WorkflowProject;
  currentUser: User;
  onClose: () => void;
  onContractUpdated?: (updatedProject: WorkflowProject) => void;
  language?: 'en' | 'vi';
}

export default function ProjectContractModal({
  project,
  currentUser,
  onClose,
  onContractUpdated,
  language = 'vi'
}: ProjectContractModalProps) {
  const [currentProject, setCurrentProject] = useState<WorkflowProject>(project);
  const [isSigning, setIsSigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDigitalSignModal, setShowDigitalSignModal] = useState(false);
  const [selectedCA, setSelectedCA] = useState<'VNPT-CA' | 'Viettel-CA' | 'FPT-CA'>('Viettel-CA');
  const [isReviewedNoError, setIsReviewedNoError] = useState(true);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ';
  };

  // Determine if current user is an authorized head who can sign
  const userRole = (currentUser.role || '').toLowerCase();
  const userDept = (currentUser.department || '').toLowerCase();
  const isSuperAdmin = userRole === 'admin' || currentUser.email === 'superadmin@lubpystudio.vn';
  const isCSHead = currentUser.isDepartmentHead && (userRole === 'cs' || userDept.includes('chăm sóc') || userDept.includes('khách hàng'));
  const isTechHead = currentUser.isDepartmentHead && (userRole === 'tech' || userRole === 'dev' || userDept.includes('kỹ thuật') || userDept.includes('software'));
  const isAccountingHead = currentUser.isDepartmentHead && (userRole === 'accounting' || userDept.includes('kế toán') || userDept.includes('tài chính'));

  // Which role this user can sign for
  let eligibleSignRole: 'CS_HEAD' | 'TECH_HEAD' | 'ACCOUNTING_HEAD' | 'SUPER_ADMIN' | null = null;
  let eligibleTitle = '';

  if (isSuperAdmin) {
    eligibleSignRole = 'SUPER_ADMIN';
    eligibleTitle = 'Tổng Giám Đốc / Super Admin';
  } else if (isCSHead) {
    eligibleSignRole = 'CS_HEAD';
    eligibleTitle = 'Trưởng Phòng CSKH & Tiếp Nhận Dự Án';
  } else if (isTechHead) {
    eligibleSignRole = 'TECH_HEAD';
    eligibleTitle = 'Trưởng Đội Ngũ Kỹ Thuật (Tech Lead)';
  } else if (isAccountingHead) {
    eligibleSignRole = 'ACCOUNTING_HEAD';
    eligibleTitle = 'Kế Toán Trưởng & Quản Lý Tài Chính';
  }

  const existingSignatures = currentProject.contract?.signatures || [];
  const hasUserAlreadySigned = eligibleSignRole ? existingSignatures.some(s => s.role === eligibleSignRole) : false;

  const handleSignContract = () => {
    if (!eligibleSignRole) {
      setToastMessage('⚠️ Bạn cần đăng nhập bằng tài khoản Trưởng Bộ Phận hoặc Super Admin để ký duyệt hợp đồng này.');
      return;
    }

    setIsSigning(true);
    setTimeout(() => {
      const res = signProjectContract(currentProject.id, {
        role: eligibleSignRole!,
        title: eligibleTitle,
        signerName: currentUser.name || 'Cán Bộ Quản Trị',
        signerEmail: currentUser.email,
      });

      setIsSigning(false);
      if (res.success && res.project) {
        setCurrentProject({ ...res.project });
        if (onContractUpdated) {
          onContractUpdated(res.project);
        }
        setToastMessage(`✅ ${res.message}`);
      } else {
        setToastMessage(`⚠️ ${res.message || 'Không thể ký hợp đồng.'}`);
      }
    }, 600);
  };

  const handlePrintContract = () => {
    window.print();
  };

  const requiredRoles: { role: 'CS_HEAD' | 'TECH_HEAD' | 'ACCOUNTING_HEAD' | 'SUPER_ADMIN'; label: string; desc: string }[] = [
    { role: 'CS_HEAD', label: 'Trưởng Phòng CSKH', desc: 'Xác nhận phạm vi yêu cầu học viên & SLA chăm sóc' },
    { role: 'TECH_HEAD', label: 'Trưởng Kỹ Thuật (Tech Lead)', desc: 'Xác nhận kiến trúc kỹ thuật & phân công kỹ sư' },
    { role: 'ACCOUNTING_HEAD', label: 'Kế Toán Trưởng', desc: 'Xác nhận biểu phí, tiến độ cọc & hóa đơn tài chính' },
    { role: 'SUPER_ADMIN', label: 'Tổng Giám Đốc / Super Admin', desc: 'Phê chuẩn ban hành & bảo chứng trách nhiệm pháp lý cao nhất' }
  ];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  HỢP ĐỒNG DỊCH VỤ PHÁT TRIỂN DỰ ÁN
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                  {currentProject.contract?.contractNumber || 'HD-LUBPY-2026'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Xác nhận pháp lý đa tầng giữa Khách Hàng và 4 Trưởng Nghiệp Vụ LUBPY STUDIO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintContract}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="In hoặc lưu PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In / Xuất PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-indigo-950/90 border-b border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between">
            <span>{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-white cursor-pointer ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Contract Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-gray-300 text-xs sm:text-sm bg-slate-950/60 font-sans leading-relaxed">
          
          {/* Document Title Header */}
          <div className="text-center pb-6 border-b border-white/10 space-y-1">
            <div className="text-[11px] uppercase tracking-widest text-indigo-400 font-bold">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-[10px] text-gray-400">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="text-xs text-gray-500 py-1">***</div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
              HỢP ĐỒNG KINH TẾ &amp; DỊCH VỤ CÔNG NGHỆ THÔNG TIN
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Số: {currentProject.contract?.contractNumber || 'HD-LUBPY-2026-001'} / HĐ-LUBPY-TECH
            </p>
          </div>

          {/* Legal Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/80 border border-white/10">
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                BÊN A: ĐƠN VỊ CUNG CẤP DỊCH VỤ (LUBPY STUDIO)
              </span>
              <ul className="space-y-1 text-xs text-gray-300">
                <li><strong className="text-white">Công ty:</strong> LUBPY STUDIO TECH &amp; ACADEMIC SOLUTIONS</li>
                <li><strong className="text-white">Đại diện pháp lý:</strong> Ban Quản Trị Hệ Thống &amp; Các Trưởng Nghiệp Vụ</li>
                <li><strong className="text-white">Hotline CSKH 24/7:</strong> 0901.888.999</li>
                <li><strong className="text-white">Email chính thức:</strong> support@lubpystudio.vn</li>
              </ul>
            </div>

            <div>
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                BÊN B: KHÁCH HÀNG / HỌC VIÊN ĐẶT HÀNG
              </span>
              <ul className="space-y-1 text-xs text-gray-300">
                <li><strong className="text-white">Họ và tên:</strong> {currentProject.clientName}</li>
                <li><strong className="text-white">Email tiếp nhận:</strong> {currentProject.clientEmail}</li>
                <li><strong className="text-white">Số điện thoại:</strong> {currentProject.clientPhone || '0900000000'}</li>
                <li><strong className="text-white">Mã hồ sơ:</strong> {currentProject.id}</li>
              </ul>
            </div>
          </div>

          {/* Article 1: Scope of Work */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-black">1</span>
              ĐIỀU 1: PHẠM VI DỰ ÁN &amp; YÊU CẦU KỸ THUẬT
            </h4>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1.5 text-xs">
              <p><strong className="text-white">Tên đề tài / Dự án:</strong> {currentProject.projectName}</p>
              <p><strong className="text-white">Phân loại chuyên môn:</strong> {currentProject.category}</p>
              <p><strong className="text-white">Nội dung yêu cầu chi tiết:</strong> {currentProject.requirements}</p>
              <p><strong className="text-white">Thời hạn cam kết bàn giao:</strong> Trước ngày {currentProject.deadline}</p>
            </div>
          </div>

          {/* Article 2: Financial Terms */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-black">2</span>
              ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG, TIỀN CỌC &amp; TIẾN ĐỘ THANH TOÁN
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900 rounded-xl border border-white/10">
                <span className="text-[10px] text-gray-400 block">Tổng giá trị hợp đồng:</span>
                <span className="text-sm font-black text-amber-300">{formatMoney(currentProject.totalAmountVnd)}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-white/10">
                <span className="text-[10px] text-gray-400 block">Tiền đặt cọc ban đầu (50%):</span>
                <span className="text-sm font-black text-sky-400">{formatMoney(currentProject.depositAmountVnd)}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-white/10">
                <span className="text-[10px] text-gray-400 block">Số tiền còn lại sau khi hoàn thành:</span>
                <span className="text-sm font-black text-emerald-400">{formatMoney(currentProject.remainingAmountVnd)}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 italic">
              * Quy định bàn giao: Bên A chỉ bàn giao toàn bộ Source Code, Tài liệu báo cáo và link Demo chính thức sau khi Bên B thanh toán đủ 100% giá trị hợp đồng theo hóa đơn từ Kế toán.
            </p>
          </div>

          {/* Article 3: Warranties */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-black">3</span>
              ĐIỀU 3: CAM KẾT BẢO HÀNH &amp; HỖ TRỢ BẢO VỆ ĐỒ ÁN
            </h4>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1 text-xs text-gray-300">
              <p>• Hỗ trợ cài đặt môi trường trực tiếp qua Ultraviewer / AnyDesk hoặc Teamviewer 24/7.</p>
              <p>• Cam kết bảo hành, giải đáp câu hỏi phản biện của Giảng viên hướng dẫn trọn đời.</p>
              <p>• Bảo mật 100% danh tính học viên và đề tài đồ án tốt nghiệp.</p>
            </div>
          </div>

          {/* Article 4: Digital Signatures Section (4 Heads) */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Stamp className="w-4 h-4 text-indigo-400" />
                CHỮ KÝ SỐ ĐIỆN TỬ CỦA CÁC TRƯỞNG NGHIỆP VỤ (DIGITAL SIGNATURES)
              </h4>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {existingSignatures.length} / 4 Chữ ký đã hoàn tất
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {requiredRoles.map((req) => {
                const signed = existingSignatures.find(s => s.role === req.role);

                return (
                  <div 
                    key={req.role}
                    className={`p-4 rounded-xl border transition-all ${
                      signed 
                        ? 'bg-emerald-950/20 border-emerald-500/40' 
                        : 'bg-slate-900/60 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-xs font-bold text-white block">{req.label}</span>
                        <span className="text-[10px] text-gray-400 block">{req.desc}</span>
                      </div>
                      {signed ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã ký</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Chờ ký duyệt
                        </div>
                      )}
                    </div>

                    {signed ? (
                      <div className="p-2.5 bg-slate-950/70 rounded-lg border border-emerald-500/20 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Người ký:</span>
                          <span className="font-bold text-white">{signed.signerName}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500">Thời gian:</span>
                          <span className="font-mono text-emerald-400">{signed.signedAt}</span>
                        </div>
                        <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-gray-400">
                          <span>Mã con dấu:</span>
                          <span className="text-indigo-300 truncate max-w-[150px]">{signed.signatureStamp}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-950/40 rounded-lg border border-white/5 text-center text-xs text-gray-500">
                        Chưa có chữ ký của {req.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Action Bar */}
        <div className="px-6 py-4 bg-slate-900 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Hợp đồng có hiệu lực pháp lý cao nhất khi đủ chữ ký của các Trưởng Nghiệp Vụ.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {eligibleSignRole && !hasUserAlreadySigned && (
              <button
                type="button"
                onClick={() => setShowDigitalSignModal(true)}
                disabled={isSigning}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Stamp className="w-4 h-4 text-slate-950" />
                <span>🖋️ Ký Chữ Ký Số (CA Token)</span>
              </button>
            )}

            {hasUserAlreadySigned && (
              <div className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bạn đã ký chữ ký số cho hợp đồng này</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>

      {/* MODAL: CHỮ KÝ SỐ CHUẨN CA PHỔ BIẾN NHẤT VIỆT NAM (VIETTEL-CA / VNPT-CA / FPT-CA) */}
      {showDigitalSignModal && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5 relative">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
                  <Stamp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Xác Nhận Ký Chữ Ký Số Điện Tử</span>
                  </h3>
                  <p className="text-xs text-amber-300 font-mono mt-0.5">Chứng Thư Số Chuẩn CA Doanh Nghiệp</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDigitalSignModal(false)}
                className="p-1 hover:bg-slate-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin chứng thư số */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-3 text-xs">
              <div className="flex justify-between items-center text-gray-300">
                <span className="text-gray-400">Đơn vị cấp chứng thực số:</span>
                <div className="flex gap-1.5">
                  {(['Viettel-CA', 'VNPT-CA', 'FPT-CA'] as const).map(ca => (
                    <button
                      key={ca}
                      type="button"
                      onClick={() => setSelectedCA(ca)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedCA === ca 
                          ? 'bg-amber-500 text-slate-950 font-black shadow' 
                          : 'bg-slate-900 text-gray-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {ca}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">Chủ thể chứng thư:</span>
                <span className="font-bold text-white text-right">{eligibleTitle} ({currentUser.name})</span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">Số Serial Token:</span>
                <span className="font-mono text-amber-300 font-bold">54:02:8B:E9:17:F2:A4:89</span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">Thuật toán bảo mật:</span>
                <span className="font-mono text-emerald-400">RSA 2048-bit / SHA-256</span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">Dấu thời gian TSA:</span>
                <span className="font-mono text-sky-300">{new Date().toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* Điều kiện thẩm định không sai sót */}
            <label className="flex items-start gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl cursor-pointer">
              <input 
                type="checkbox" 
                checked={isReviewedNoError}
                onChange={(e) => setIsReviewedNoError(e.target.checked)}
                className="mt-0.5 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-200 leading-relaxed">
                Tôi đã thẩm định chi tiết toàn bộ các điều khoản hợp đồng <strong>{currentProject.id}</strong>, xác nhận <strong>thông tin chuẩn xác, không có sai sót</strong> và đồng ý ký số điện tử để ban hành văn bản.
              </span>
            </label>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDigitalSignModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!isReviewedNoError || isSigning}
                onClick={() => {
                  setShowDigitalSignModal(false);
                  handleSignContract();
                }}
                className={`flex-1 py-2.5 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isReviewedNoError || isSigning
                    ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:opacity-95 shadow-amber-950/50'
                }`}
              >
                <Stamp className="w-4 h-4" />
                <span>Ký Chữ Ký Số Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
