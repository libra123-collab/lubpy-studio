import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  AdminNotification, 
  DEPT_LABELS, 
  PRESET_POSITIONS,
  getVisibleNotificationsForUser, 
  sendNewNotification, 
  updateNotification,
  deleteNotification, 
  markAsRead 
} from '../utils/notificationStore';
import { 
  Mail, X, Send, Trash2, Edit3, CheckCircle, AlertTriangle, Info, Bell, Shield, Users, Sparkles, Save, UserCheck, Search, Filter
} from 'lucide-react';

const ACCOUNTING_POSITIONS = [
  'Nhân Viên Kế Toán Cấp Dưới',
  'Kế Toán Viên Thu Chi & Hợp Đồng',
  'Kế Toán Viên Ngân Sách & Thù Lao',
  'Chuyên Viên Kiểm Sát Thu Chi Đồ Án'
];

const CS_POSITIONS = [
  'Nhân Viên Tư Vấn CSKH Cấp Dưới',
  'Chuyên Viên CSKH & Support Đồ Án',
  'Nhân Viên Tiếp Nhận Yêu Cầu & Ticket',
  'Hỗ Trợ Viên Cài Đặt Môi Trường'
];

interface NotificationMailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  orgHeads: Record<string, User>;
  onTriggerToast?: (msg: string) => void;
}

export default function NotificationMailboxModal({
  isOpen,
  onClose,
  user,
  orgHeads,
  onTriggerToast
}: NotificationMailboxModalProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'all'>('inbox');

  const isCSUser = user.role === 'cs';
  const isAccountingUser = user.role === 'accounting';
  const isAdmin = user.role === 'admin';

  // Form State for Compose
  const [targetScope, setTargetScope] = useState<'all_members' | 'single_position' | 'all_heads' | 'single_head'>(
    (isCSUser || isAccountingUser || !isAdmin) ? 'single_position' : 'all_members'
  );
  const [targetPosition, setTargetPosition] = useState<string>(
    isCSUser ? CS_POSITIONS[0] : isAccountingUser ? ACCOUNTING_POSITIONS[0] : PRESET_POSITIONS[0]
  );
  const [customPosition, setCustomPosition] = useState<string>('');
  const [targetDeptKey, setTargetDeptKey] = useState<string>(
    isCSUser ? 'cs' : isAccountingUser ? 'accounting' : 'tech'
  );
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('important');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isCSUser) {
      setTargetScope('single_position');
      setTargetPosition(CS_POSITIONS[0]);
      setTargetDeptKey('cs');
    } else if (isAccountingUser) {
      setTargetScope('single_position');
      setTargetPosition('Nhân Viên Kế Toán Cấp Dưới');
      setTargetDeptKey('accounting');
    } else if (!isAdmin) {
      setTargetScope('single_position');
      setTargetPosition(PRESET_POSITIONS[0]);
    }
  }, [user.role, showCompose]);

  // Edit Notification State
  const [editingNotif, setEditingNotif] = useState<AdminNotification | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<'normal' | 'important' | 'urgent'>('important');
  const [editScope, setEditScope] = useState<'all_members' | 'single_position' | 'all_heads' | 'single_head'>('all_members');
  const [editPosition, setEditPosition] = useState<string>(PRESET_POSITIONS[0]);
  const [editDeptKey, setEditDeptKey] = useState<string>('tech');

  const { visibleNotifs, userDeptTitle, canCompose, isHeadOrAdmin, userDeptKey } = getVisibleNotificationsForUser(user, orgHeads);

  // Filter list based on selected Tab
  const userEmailLower = (user?.email || '').toLowerCase().trim();
  const filteredNotifs = visibleNotifs.filter(n => {
    const senderLower = (n.senderEmail || '').toLowerCase().trim();
    if (activeTab === 'sent') {
      return senderLower === userEmailLower;
    }
    if (activeTab === 'inbox') {
      return senderLower !== userEmailLower;
    }
    return true; // 'all'
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!');
      return;
    }

    let targetDeptLabel = 'Toàn Bộ Hệ Thống (Tất Cả Thành Viên)';
    let targetHeadName = '';
    let targetHeadEmail = '';
    let selectedPos = targetPosition === 'Khác (Tự nhập chức danh)' ? customPosition.trim() : targetPosition;

    if (targetScope === 'single_position') {
      targetDeptLabel = `Chức danh: ${selectedPos || 'Vị trí cụ thể'}`;
    } else if (targetScope === 'all_heads') {
      targetDeptLabel = 'Tất Cả Trưởng Nghiệp Vụ';
    } else if (targetScope === 'single_head') {
      targetDeptLabel = DEPT_LABELS[targetDeptKey] || targetDeptKey;
      const head = orgHeads[targetDeptKey];
      if (head) {
        targetHeadName = head.name;
        targetHeadEmail = head.email;
      }
    }

    sendNewNotification({
      senderName: user.name || 'Thành Viên LUBPY',
      senderEmail: user.email,
      senderRole: user.role,
      senderTitle: userDeptTitle,
      targetScope,
      targetPosition: targetScope === 'single_position' ? selectedPos : undefined,
      targetDeptKey: targetScope === 'single_head' ? targetDeptKey : undefined,
      targetDeptLabel,
      targetHeadName,
      targetHeadEmail,
      title: title.trim(),
      content: content.trim(),
      priority
    });

    if (onTriggerToast) {
      onTriggerToast(`🚀 Đã phát thông báo thành công cho [${targetDeptLabel}]!`);
    }

    setTitle('');
    setContent('');
    setShowCompose(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleStartEdit = (notif: AdminNotification) => {
    setEditingNotif(notif);
    setEditTitle(notif.title);
    setEditContent(notif.content);
    setEditPriority(notif.priority);
    setEditScope(notif.targetScope);
    setEditPosition(notif.targetPosition || PRESET_POSITIONS[0]);
    setEditDeptKey(notif.targetDeptKey || 'tech');
    setShowCompose(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotif) return;
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!');
      return;
    }

    let targetDeptLabel = 'Toàn Bộ Hệ Thống (Tất Cả Thành Viên)';
    let targetHeadName = '';
    let targetHeadEmail = '';

    if (editScope === 'single_position') {
      targetDeptLabel = `Chức danh: ${editPosition}`;
    } else if (editScope === 'all_heads') {
      targetDeptLabel = 'Tất Cả Trưởng Nghiệp Vụ';
    } else if (editScope === 'single_head') {
      targetDeptLabel = DEPT_LABELS[editDeptKey] || editDeptKey;
      const head = orgHeads[editDeptKey];
      if (head) {
        targetHeadName = head.name;
        targetHeadEmail = head.email;
      }
    }

    const updated: AdminNotification = {
      ...editingNotif,
      targetScope: editScope,
      targetPosition: editScope === 'single_position' ? editPosition : undefined,
      targetDeptKey: editScope === 'single_head' ? editDeptKey : undefined,
      targetDeptLabel,
      targetHeadName,
      targetHeadEmail,
      title: editTitle.trim(),
      content: editContent.trim(),
      priority: editPriority
    };

    updateNotification(updated);

    if (onTriggerToast) {
      onTriggerToast('✏️ Đã chỉnh sửa và cập nhật thông báo thành công!');
    }

    setEditingNotif(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thông báo này khỏi hệ thống?')) {
      deleteNotification(id);
      if (editingNotif?.id === id) setEditingNotif(null);
      if (onTriggerToast) onTriggerToast('🗑️ Đã xóa thông báo thành công.');
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleMarkRead = (id: string) => {
    markAsRead(id, user.email);
    setRefreshKey(prev => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Hộp Thư Thông Báo &amp; Chỉ Đạo Nội Bộ</h3>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                  LUBPY STUDIO
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Kênh truyền tin thông báo &amp; chỉ đạo phân quyền tới các vị trí, chức danh &amp; toàn thể nhân sự
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity & Info Bar */}
        <div className="px-6 py-3 bg-slate-950 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-gray-300">Tài khoản:</span>
            <span className="text-xs font-black text-white">{user.name}</span>
            <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/20">
              {userDeptTitle}
            </span>
          </div>

          {canCompose && (
            <button
              onClick={() => setShowCompose(!showCompose)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{showCompose ? 'Đóng Form Soạn' : '+ Soạn Thông Báo Mới'}</span>
            </button>
          )}
        </div>

        {/* Subordinate Staff Filter Banner for All Departments */}
        {!isHeadOrAdmin && userDeptKey && ['tech', 'cs', 'hr', 'accounting'].includes(userDeptKey) && (
          <div className="px-6 py-2.5 bg-sky-950/60 border-b border-sky-500/20 text-sky-300 text-xs flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong>Hộp thư nghiệp vụ {userDeptTitle}:</strong> Hệ thống đã kích hoạt phân quyền. Bạn ở vị trí nhân viên cấp dưới nên <strong>chỉ nhận thông báo &amp; chỉ đạo trực tiếp</strong> từ <strong>Trưởng Phòng ({orgHeads?.[userDeptKey]?.name || (userDeptKey === 'tech' ? 'Phan Quốc Bảo - Tech Lead' : userDeptKey === 'cs' ? 'Chu Phiêu Dật - CSKH Lead' : userDeptKey === 'hr' ? 'Lê Hoàng Nam - HR Lead' : 'Nguyễn Văn An - Kế Toán Trưởng')})</strong> và <strong>Super Admin</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Client Dedicated Banner */}
        {user.role === 'client' && (
          <div className="px-6 py-3 bg-sky-950/80 border-b border-sky-500/30 text-sky-200 text-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong>👨‍💻 Hộp thư Kỹ Thuật Viên Phụ Trách:</strong> Dưới đây là các thông báo tiến độ, báo cáo kỹ thuật và chỉ dẫn trực tiếp từ <strong>Kỹ Thuật Viên &amp; CSKH</strong> phụ trách dự án của quý khách.
              </span>
            </div>
          </div>
        )}

        {/* Compose Form Modal */}
        {showCompose && (
          <form onSubmit={handleSend} className="p-5 bg-slate-950/90 border-b border-amber-500/20 space-y-4 animate-slideDown">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Gửi Thông Báo Theo Phạm Vi / Chức Danh Vị Trí</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                  1. Chọn Phạm Vi Nhận Thông Báo:
                </label>
                <select 
                  value={targetScope}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setTargetScope(val);
                    if (isCSUser) {
                      if (val === 'single_position') {
                        setTargetPosition(CS_POSITIONS[0]);
                      } else if (val === 'single_head') {
                        setTargetDeptKey('cs');
                      }
                    } else if (isAccountingUser) {
                      if (val === 'single_position') {
                        setTargetPosition('Nhân Viên Kế Toán Cấp Dưới');
                      } else if (val === 'single_head') {
                        setTargetDeptKey('accounting');
                      }
                    }
                  }}
                  className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2.5 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
                >
                  {isAdmin ? (
                    <>
                      <option value="all_members">🌐 Toàn Bộ Hệ Thống (Tất Cả Thành Viên &amp; Vị Trí)</option>
                      <option value="single_position">🎯 Theo Chức Danh / Vị Trí Cụ Thể</option>
                      <option value="all_heads">👥 Tất Cả Trưởng Nghiệp Vụ (Heads Only)</option>
                      <option value="single_head">🏢 Cho 1 Trưởng Phòng / Bộ Phận Cụ Thể</option>
                    </>
                  ) : isCSUser ? (
                    <>
                      <option value="single_position">🎯 Nhân Viên CSKH Cấp Dưới (Theo Chức Danh Cụ Thể)</option>
                      <option value="single_head">🏢 Toàn Bộ Nhân Viên Bộ Phận CSKH &amp; Support</option>
                    </>
                  ) : isAccountingUser ? (
                    <>
                      <option value="single_position">🎯 Nhân Viên Kế Toán Cấp Dưới (Theo Chức Danh Cụ Thể)</option>
                      <option value="single_head">🧮 Toàn Bộ Nhân Viên Bộ Phận Kế Toán &amp; Tài Chính</option>
                    </>
                  ) : (
                    <>
                      <option value="single_position">🎯 Chỉ Thông Báo Cho Nhân Viên Cấp Dưới</option>
                      <option value="single_head">🏢 Toàn Bộ Nhân Viên Bộ Phận Cấp Dưới</option>
                    </>
                  )}
                </select>
              </div>

              {targetScope === 'single_position' ? (
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                    2. Chọn Chức Danh / Vị Trí Cấp Dưới Nhận:
                  </label>
                  <select 
                    value={targetPosition}
                    onChange={(e) => setTargetPosition(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2.5 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
                  >
                    {(isCSUser ? CS_POSITIONS : isAccountingUser ? ACCOUNTING_POSITIONS : PRESET_POSITIONS).map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                    <option value="Khác (Tự nhập chức danh)">✍️ Khác (Tự nhập chức danh cụ thể)...</option>
                  </select>

                  {targetPosition === 'Khác (Tự nhập chức danh)' && (
                    <input 
                      type="text"
                      required
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      placeholder="Nhập tên chức danh/vị trí (VD: AI Researcher, QA Lead)..."
                      className="w-full mt-2 bg-slate-900 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500"
                    />
                  )}
                </div>
              ) : targetScope === 'single_head' ? (
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                    2. Chọn Bộ Phận Nghiệp Vụ:
                  </label>
                  <select 
                    value={targetDeptKey}
                    onChange={(e) => setTargetDeptKey(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2.5 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
                  >
                    {isCSUser ? (
                      <option value="cs">🤝 CSKH (Customer Service &amp; Support)</option>
                    ) : isAccountingUser ? (
                      <option value="accounting">🧮 Kế Toán &amp; Tài Chính</option>
                    ) : !isAdmin ? (
                      <option value={user.role || 'tech'}>🏢 Bộ Phận Cấp Dưới</option>
                    ) : (
                      <>
                        <option value="tech">💻 Kỹ Thuật (Tech)</option>
                        <option value="cs">🤝 CSKH (Customer Service)</option>
                        <option value="hr">💼 Nhân Sự (HR &amp; Payroll)</option>
                        <option value="accounting">🧮 Kế Toán &amp; Tài Chính</option>
                      </>
                    )}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                    2. Mức Độ Ưu Tiên:
                  </label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2.5 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
                  >
                    <option value="urgent">🚨 Khẩn Cấp (Urgent Action)</option>
                    <option value="important">⭐ Quan Trọng (Important Notice)</option>
                    <option value="normal">ℹ️ Thông Báo Thường (Normal Update)</option>
                  </select>
                </div>
              )}
            </div>

            {(targetScope === 'single_position' || targetScope === 'single_head') && (
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                  Mức Độ Ưu Tiên:
                </label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2.5 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
                >
                  <option value="urgent">🚨 Khẩn Cấp (Urgent Action)</option>
                  <option value="important">⭐ Quan Trọng (Important Notice)</option>
                  <option value="normal">ℹ️ Thông Báo Thường (Normal Update)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                Tiêu Đề Thông Báo:
              </label>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Cập nhật lịch họp toàn bộ Lead Dev tuần tới..."
                className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                Nội Dung Chi Tiết:
              </label>
              <textarea 
                rows={3}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung chi tiết công việc, quy trình hoặc lưu ý..."
                className="w-full bg-slate-900 border border-white/10 text-xs text-white p-3 rounded-xl focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button 
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Thông Báo Ngay</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab Switcher: Inbox vs Sent vs All */}
        <div className="px-6 py-2 bg-slate-950 border-b border-white/5 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inbox' 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Thông Báo Đến ({visibleNotifs.filter(n => n.senderEmail.toLowerCase() !== userEmailLower).length})</span>
          </button>

          {canCompose && (
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sent' 
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Đã Gửi ({visibleNotifs.filter(n => n.senderEmail.toLowerCase() === userEmailLower).length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all' 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Tất Cả ({visibleNotifs.length})</span>
          </button>
        </div>

        {/* Notification List Container */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredNotifs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 border border-dashed border-white/10 rounded-2xl space-y-3">
              <Bell className="w-8 h-8 text-gray-500 mx-auto opacity-50" />
              <p className="text-xs font-bold text-gray-300">Chưa có thông báo nào trong danh mục này.</p>
              <p className="text-[11px] text-gray-500">
                {canCompose 
                  ? 'Bấm nút "+ Soạn Thông Báo Mới" ở trên để gửi tin nhắn/chỉ đạo mới.' 
                  : 'Các thông báo & chỉ đạo trực tiếp từ Trưởng Phòng và Super Admin sẽ tự động hiển thị tại đây.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifs.map((notif) => {
                const isRead = notif.readBy && notif.readBy.some(e => (e || '').toLowerCase() === userEmailLower);
                const isEditingThis = editingNotif?.id === notif.id;
                const isMyMessage = (notif.senderEmail || '').toLowerCase().trim() === userEmailLower;

                if (isEditingThis) {
                  return (
                    <form 
                      key={notif.id}
                      onSubmit={handleSaveEdit}
                      className="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/80 shadow-2xl space-y-3 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                        <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase">
                          <Edit3 className="w-4 h-4" />
                          <span>Chỉnh Sửa Thông Báo</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">{notif.id}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Phạm Vi Nhận:
                          </label>
                          <select 
                            value={editScope}
                            onChange={(e) => setEditScope(e.target.value as any)}
                            className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
                          >
                            <option value="all_members">🌐 Toàn Bộ Hệ Thống</option>
                            <option value="single_position">🎯 Theo Vị Trí / Chức Danh</option>
                            <option value="all_heads">👥 Tất Cả Trưởng Phòng</option>
                            <option value="single_head">🏢 1 Trưởng Phòng Cụ Thể</option>
                          </select>
                        </div>

                        {editScope === 'single_position' ? (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Chọn Chức Danh / Vị Trí:
                            </label>
                            <select 
                              value={editPosition}
                              onChange={(e) => setEditPosition(e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
                            >
                              {PRESET_POSITIONS.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                              ))}
                            </select>
                          </div>
                        ) : editScope === 'single_head' ? (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Bộ Phận:
                            </label>
                            <select 
                              value={editDeptKey}
                              onChange={(e) => setEditDeptKey(e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
                            >
                              <option value="tech">Kỹ Thuật</option>
                              <option value="cs">CSKH</option>
                              <option value="hr">HR &amp; Payroll</option>
                              <option value="accounting">Kế Toán &amp; Tài Chính</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Mức Độ Ưu Tiên:
                            </label>
                            <select 
                              value={editPriority}
                              onChange={(e) => setEditPriority(e.target.value as any)}
                              className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
                            >
                              <option value="urgent">🚨 Khẩn Cấp</option>
                              <option value="important">⭐ Quan Trọng</option>
                              <option value="normal">ℹ️ Thường</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Tiêu Đề:
                        </label>
                        <input 
                          type="text"
                          required
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Nội Dung:
                        </label>
                        <textarea 
                          rows={3}
                          required
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 text-xs text-white p-2.5 rounded-xl focus:border-amber-500 resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(notif.id)}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa Thông Báo</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => setEditingNotif(null)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button 
                            type="submit"
                            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer flex items-center gap-1.5 shadow"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Lưu Cập Nhật</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  );
                }

                return (
                  <div 
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      !isRead && !isMyMessage
                        ? 'bg-slate-950/90 border-amber-500/40 shadow-lg' 
                        : 'bg-slate-900/60 border-white/10 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        {notif.priority === 'urgent' && (
                          <span className="px-2.5 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>🚨 Khẩn Cấp</span>
                          </span>
                        )}
                        {notif.priority === 'important' && (
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                            ⭐ Quan Trọng
                          </span>
                        )}
                        {notif.priority === 'normal' && (
                          <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                            ℹ️ Thông Báo
                          </span>
                        )}

                        {/* Target Scope Badge */}
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-gray-300 border border-white/10 text-[10px] font-bold flex items-center gap-1">
                          <Users className="w-3 h-3 text-sky-400" />
                          <span>Phạm vi: {notif.targetDeptLabel || 'Toàn bộ'}</span>
                        </span>

                        {isMyMessage && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold rounded uppercase">
                            Tin bạn gửi
                          </span>
                        )}

                        {!isRead && !isMyMessage && (
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded uppercase">
                            Mới
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-gray-400 font-mono shrink-0">
                        {notif.createdAt}
                      </div>
                    </div>

                    <h4 className="text-sm font-black text-white mb-1.5">{notif.title}</h4>
                    <p className="text-xs text-gray-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5 font-sans whitespace-pre-wrap">
                      {notif.content}
                    </p>

                    {/* Client-Specific Explicit Transparency Banner: Assigned KTV & Project ID */}
                    {user.role === 'client' && (
                      <div className="mt-3.5 p-2.5 rounded-xl bg-gradient-to-r from-slate-950 via-sky-950/40 to-slate-950 border border-sky-500/30 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans">
                        <div className="flex items-center gap-1.5 text-sky-300 font-extrabold">
                          <span className="text-sky-400">💻 Đồ Án / Dự Án:</span>
                          <span className="px-2 py-0.5 bg-sky-500/20 text-sky-200 border border-sky-400/40 rounded-lg font-mono font-bold tracking-wide">
                            {notif.title.match(/PRJ-\d+/i) ? notif.title.match(/PRJ-\d+/i)![0] : notif.content.match(/PRJ-\d+/i) ? notif.content.match(/PRJ-\d+/i)![0] : 'PRJ-2401 (Hệ Thống CNTT Trọn Gói)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-300 font-extrabold">
                          <span className="text-emerald-400">👨‍💻 KTV Phụ Trách:</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 rounded-lg font-bold">
                            {notif.senderRole === 'tech' ? notif.senderName : 'Phan Quốc Bảo (Lead Dev)'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/5 text-[11px] text-gray-400 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>Người gửi:</span>
                        {notif.senderRole === 'tech' && (
                          <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[10px] font-black flex items-center gap-1">
                            👨‍💻 KTV Phụ Trách
                          </span>
                        )}
                        {notif.senderRole === 'cs' && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-black flex items-center gap-1">
                            🤝 CSKH Support
                          </span>
                        )}
                        <strong className="text-white font-extrabold">{notif.senderName}</strong>
                        {notif.senderTitle && (
                          <span className="text-[10px] text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-sky-500/20 font-mono font-medium">
                            {notif.senderTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isRead && !isMyMessage && (
                          <button 
                            onClick={() => handleMarkRead(notif.id)}
                            className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Đánh dấu đã đọc</span>
                          </button>
                        )}

                        {(isMyMessage || isAdmin) && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleStartEdit(notif)}
                              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                              title="Chỉnh sửa nội dung"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa</span>
                            </button>

                            <button 
                              onClick={() => handleDelete(notif.id)}
                              className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                              title="Xóa thông báo này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {canCompose 
                ? 'Thông báo có thể gửi đến toàn thể nhân sự hoặc theo từng vị trí chức danh cụ thể.' 
                : 'Chế độ nhân viên cấp dưới: Bạn chỉ nhận thông báo & chỉ đạo trực tiếp từ Trưởng Phòng / Super Admin.'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold rounded-xl cursor-pointer"
          >
            Đóng Hộp Thư
          </button>
        </div>

      </div>
    </div>
  );
}

