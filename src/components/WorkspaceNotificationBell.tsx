import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Check, RefreshCw, FolderKanban, MessageSquare, 
  FileText, Clock, AlertCircle, ChevronRight, CheckCircle2,
  ExternalLink, Sparkles
} from 'lucide-react';
import { User } from '../types';

export interface BackendUpdateItem {
  id: string;
  type: 'project_report' | 'project_status' | 'notification' | 'ticket_message';
  category: 'project' | 'message';
  title: string;
  summary: string;
  timestamp: string;
  author?: string;
  projectId?: string;
  ticketId?: string;
  statusBadge?: string;
  isRead: boolean;
  priority?: 'normal' | 'important' | 'urgent';
}

interface WorkspaceNotificationBellProps {
  user?: User;
  language?: 'en' | 'vi';
  onSelectProject?: (projectId: string) => void;
  onSelectTicket?: (ticketId: string) => void;
  className?: string;
}

export default function WorkspaceNotificationBell({
  user,
  language = 'vi',
  onSelectProject,
  onSelectTicket,
  className = ''
}: WorkspaceNotificationBellProps) {
  const isVi = language === 'vi';
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState<BackendUpdateItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'project' | 'message'>('all');
  const [readItemIds, setReadItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lubpy_bell_read_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch recent updates and messages from the simulated backend
  const fetchBackendUpdates = async () => {
    setLoading(true);
    try {
      const items: BackendUpdateItem[] = [];

      // 1. Fetch Projects & Milestone Reports from simulated backend (/api/projects)
      try {
        const projRes = await fetch('/api/projects');
        if (projRes.ok) {
          const projJson = await projRes.json();
          const projectList = Array.isArray(projJson.data) 
            ? projJson.data 
            : (Array.isArray(projJson) ? projJson : []);

          projectList.forEach((p: any) => {
            const projId = p.id || p.code || p.projectCode || 'PRJ';
            const projTitle = p.title || p.projectName || p.name || 'Dự án mới';

            // Reports / Daily Milestones
            if (p.reports && Array.isArray(p.reports)) {
              p.reports.forEach((rep: any, idx: number) => {
                const repId = `rep_${projId}_${idx}`;
                items.push({
                  id: repId,
                  type: 'project_report',
                  category: 'project',
                  title: `${projTitle} • Tiến độ`,
                  summary: rep.content || rep.message || 'Cập nhật tiến độ dự án mới.',
                  timestamp: rep.timestamp || 'Gần đây',
                  author: rep.author || p.assignedDevName || 'Tech Team',
                  projectId: projId,
                  statusBadge: `${p.progress || 0}%`,
                  isRead: readItemIds.includes(repId),
                });
              });
            }

            // High-level project state item
            const statusItemId = `proj_${projId}`;
            items.push({
              id: statusItemId,
              type: 'project_status',
              category: 'project',
              title: `[${projId}] ${projTitle}`,
              summary: `${isVi ? 'Tiến độ' : 'Progress'}: ${p.progress || 0}% • ${isVi ? 'Trạng thái' : 'Status'}: ${p.status || p.projectStatus || 'CODING'}${p.assignedDevName ? ` • Dev: ${p.assignedDevName}` : ''}`,
              timestamp: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : (isVi ? 'Hôm nay' : 'Today'),
              author: p.clientName || 'LUBPY System',
              projectId: projId,
              statusBadge: p.status || p.projectStatus || 'ACTIVE',
              isRead: readItemIds.includes(statusItemId),
            });
          });
        }
      } catch (err) {
        console.warn('[Bell] Failed to fetch /api/projects:', err);
      }

      // 2. Fetch Notifications from simulated backend (/api/notifications)
      try {
        const notifRes = await fetch('/api/notifications');
        if (notifRes.ok) {
          const notifJson = await notifRes.json();
          const notifList = Array.isArray(notifJson.data) 
            ? notifJson.data 
            : (Array.isArray(notifJson) ? notifJson : []);

          notifList.forEach((n: any) => {
            const notifId = `notif_${n.id || n.notifId}`;
            items.push({
              id: notifId,
              type: 'notification',
              category: n.type === 'PROJECT' ? 'project' : 'message',
              title: n.title || n.subject || (isVi ? 'Thông báo hệ thống' : 'System Notification'),
              summary: n.content || n.body || n.message || '',
              timestamp: n.createdAt 
                ? new Date(n.createdAt).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                : (isVi ? 'Vừa xong' : 'Just now'),
              author: n.targetDept ? `${isVi ? 'Bộ phận' : 'Dept'}: ${n.targetDept}` : 'Admin',
              statusBadge: n.type || 'INFO',
              isRead: Boolean(n.isRead) || readItemIds.includes(notifId),
              priority: n.priority || 'normal',
            });
          });
        }
      } catch (err) {
        console.warn('[Bell] Failed to fetch /api/notifications:', err);
      }

      // 3. Fetch Support Tickets & Messages from simulated backend (/api/tickets)
      try {
        const tckRes = await fetch('/api/tickets');
        if (tckRes.ok) {
          const tckJson = await tckRes.json();
          const tckList = Array.isArray(tckJson.data) 
            ? tckJson.data 
            : (Array.isArray(tckJson) ? tckJson : []);

          tckList.forEach((t: any) => {
            const tckId = t.id || t.code || 'TCK';
            if (t.messages && Array.isArray(t.messages)) {
              t.messages.forEach((msg: any, mIdx: number) => {
                const msgId = `tck_msg_${tckId}_${mIdx}`;
                items.push({
                  id: msgId,
                  type: 'ticket_message',
                  category: 'message',
                  title: `[${tckId}] ${t.subject || t.title || (isVi ? 'Hỗ trợ' : 'Support Ticket')}`,
                  summary: `${msg.sender}: "${msg.content || msg.message || ''}"`,
                  timestamp: msg.timestamp || (isVi ? 'Hôm nay' : 'Today'),
                  author: msg.sender || t.clientName || 'Khách hàng',
                  ticketId: tckId,
                  statusBadge: t.status || 'OPEN',
                  isRead: readItemIds.includes(msgId),
                });
              });
            }
          });
        }
      } catch (err) {
        console.warn('[Bell] Failed to fetch /api/tickets:', err);
      }

      // Fallback: If simulated backend APIs returned empty, check local storage
      if (items.length === 0) {
        try {
          const localProjects = JSON.parse(localStorage.getItem('lubpy_projects') || '[]');
          localProjects.forEach((p: any) => {
            const pid = p.id || 'PRJ';
            items.push({
              id: `local_p_${pid}`,
              type: 'project_status',
              category: 'project',
              title: `[${pid}] ${p.name || p.title || 'Dự án'}`,
              summary: `${isVi ? 'Tiến độ' : 'Progress'}: ${p.progress || 0}% • ${p.status || 'Active'}`,
              timestamp: p.date || (isVi ? 'Gần đây' : 'Recent'),
              author: p.clientName || 'LUBPY',
              projectId: pid,
              statusBadge: p.status,
              isRead: readItemIds.includes(`local_p_${pid}`),
            });
          });

          const localNotifs = JSON.parse(localStorage.getItem('lubpy_admin_notifications') || '[]');
          localNotifs.forEach((n: any) => {
            items.push({
              id: `local_n_${n.id}`,
              type: 'notification',
              category: 'message',
              title: n.title,
              summary: n.content,
              timestamp: n.createdAt || (isVi ? 'Vừa xong' : 'Just now'),
              author: n.senderName || 'Admin',
              isRead: readItemIds.includes(`local_n_${n.id}`),
            });
          });
        } catch {
          // ignore
        }
      }

      setUpdates(items);
    } catch (err) {
      console.error('[Bell] Global error fetching backend updates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchBackendUpdates();
  }, []);

  // Sync read status with storage
  const markItemAsRead = (id: string) => {
    if (!readItemIds.includes(id)) {
      const updated = [...readItemIds, id];
      setReadItemIds(updated);
      localStorage.setItem('lubpy_bell_read_items', JSON.stringify(updated));
      setUpdates(prev => prev.map(u => u.id === id ? { ...u, isRead: true } : u));
    }
  };

  const markAllAsRead = () => {
    const allIds = updates.map(u => u.id);
    const combined = Array.from(new Set([...readItemIds, ...allIds]));
    setReadItemIds(combined);
    localStorage.setItem('lubpy_bell_read_items', JSON.stringify(combined));
    setUpdates(prev => prev.map(u => ({ ...u, isRead: true })));
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Compute unread count
  const unreadCount = updates.filter(item => !item.isRead).length;

  // Filter items based on active tab
  const filteredUpdates = updates.filter(item => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  const handleItemClick = (item: BackendUpdateItem) => {
    markItemAsRead(item.id);
    if (item.projectId && onSelectProject) {
      onSelectProject(item.projectId);
      setIsOpen(false);
    } else if (item.ticketId && onSelectTicket) {
      onSelectTicket(item.ticketId);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} id="workspace-notification-bell-container">
      {/* The Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(prev => !prev);
          if (!isOpen) {
            fetchBackendUpdates();
          }
        }}
        className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-sky-500/20 text-[#38bdf8] border-sky-500/40 shadow-lg shadow-sky-950/40'
            : 'bg-slate-900/60 hover:bg-slate-800 text-gray-300 hover:text-white border-white/10 hover:border-white/20'
        }`}
        title={isVi ? 'Thông báo cập nhật dự án & tin nhắn' : 'Project updates & messages'}
        id="workspace-bell-icon-btn"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-105" />
        
        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0d0e10] shadow-md animate-pulse"
            id="workspace-bell-badge"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2.5 w-[340px] sm:w-[420px] max-w-[calc(100vw-2rem)] bg-[#12141a] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden flex flex-col"
            id="workspace-bell-dropdown"
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-white/10 bg-slate-900/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{isVi ? 'Cập Nhật & Tin Nhắn' : 'Updates & Messages'}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      Backend Live
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    {unreadCount > 0 
                      ? (isVi ? `${unreadCount} cập nhật chưa đọc` : `${unreadCount} unread updates`)
                      : (isVi ? 'Tất cả đã đọc' : 'All caught up')}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={fetchBackendUpdates}
                  disabled={loading}
                  className="p-1.5 text-gray-400 hover:text-sky-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title={isVi ? 'Làm mới từ máy chủ' : 'Refresh from backend'}
                  id="bell-refresh-btn"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="p-1.5 text-xs text-sky-400 hover:text-sky-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title={isVi ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}
                    id="bell-mark-read-btn"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[10px] font-bold">{isVi ? 'Đã đọc' : 'Read'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-3 py-2 border-b border-white/5 bg-slate-950/30 flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {isVi ? 'Tất cả' : 'All'} ({updates.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('project')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'project'
                    ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <FolderKanban className="w-3 h-3" />
                <span>{isVi ? 'Dự án' : 'Projects'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('message')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'message'
                    ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>{isVi ? 'Tin nhắn & Thông báo' : 'Messages'}</span>
              </button>
            </div>

            {/* Notification & Update Item List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5" id="workspace-bell-list">
              {loading && updates.length === 0 ? (
                <div className="p-8 text-center text-gray-400 space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-400" />
                  <p className="text-xs">{isVi ? 'Đang tải cập nhật từ máy chủ mô phỏng...' : 'Fetching backend updates...'}</p>
                </div>
              ) : filteredUpdates.length === 0 ? (
                <div className="p-8 text-center text-gray-500 space-y-2">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-gray-600" />
                  <p className="text-xs">
                    {isVi ? 'Không có cập nhật hoặc tin nhắn mới.' : 'No recent updates or messages.'}
                  </p>
                </div>
              ) : (
                filteredUpdates.map((item) => {
                  const isProject = item.category === 'project';
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3.5 transition-colors cursor-pointer group flex items-start gap-3 relative ${
                        item.isRead 
                          ? 'bg-transparent hover:bg-white/[0.03]' 
                          : 'bg-sky-500/[0.04] hover:bg-sky-500/[0.08]'
                      }`}
                    >
                      {/* Unread Accent Dot */}
                      {!item.isRead && (
                        <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-sky-400" />
                      )}

                      {/* Item Icon */}
                      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border mt-0.5 ${
                        isProject 
                          ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' 
                          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      }`}>
                        {item.type === 'project_report' ? (
                          <FileText className="w-4 h-4" />
                        ) : isProject ? (
                          <FolderKanban className="w-4 h-4" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className={`text-xs font-bold truncate ${
                            item.isRead ? 'text-gray-300' : 'text-white font-black'
                          }`}>
                            {item.title}
                          </h5>
                          {item.statusBadge && (
                            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-white/5 border border-white/10 text-gray-300">
                              {item.statusBadge}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5 font-mono">
                          <span className="truncate">{item.author}</span>
                          <span className="shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-950/60 border-t border-white/5 text-center">
              <span className="text-[10px] text-gray-500">
                {isVi 
                  ? 'Đồng bộ trực tiếp với simulated API /api/projects & /api/notifications'
                  : 'Synced with simulated API /api/projects & /api/notifications'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
