import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Headset, Search, Bell, Settings, Filter, ArrowUpRight, 
  Clock, CheckCircle2, AlertCircle, Send, Star, User as UserIcon, Mail, 
  LogOut, Zap, Edit2, Shield, Eye, Users, ChevronRight, Phone, RefreshCw,
  FileText, LifeBuoy, ThumbsUp, ShoppingBag, CornerDownLeft, Circle, Check, Plus, X, DollarSign
} from 'lucide-react';
import { User } from '../../types';
import { getStoredOrganization } from '../../utils/organizationStore';
import { getVisibleNotificationsForUser } from '../../utils/notificationStore';
import NotificationMailboxModal from '../NotificationMailboxModal';
import UserProfileModal from '../UserProfileModal';
import { fetchTicketsFromDb, createTicketInDb, fetchLiveChatsFromDb, sendLiveChatMessageInDb } from '../../utils/apiClient';

interface CSTeamStaffDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onSwitchToManagerView?: () => void;
  onSwitchToSystemManager?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

const DEFAULT_MOCK_TICKETS = [
  {
    id: '#TCK-9021',
    customerName: 'Nguyễn Văn Minh',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    issueType: 'Thanh toán đồ án React Native',
    orderId: '#ORD-37284',
    status: 'Đang xử lý',
    assignTo: 'Chu Phiêu Dật (Lead)',
    created: '10/08/2026 08:30'
  },
  {
    id: '#TCK-8842',
    customerName: 'Trần Thị Thu Hà',
    customerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    issueType: 'Gia hạn server VPS Backend',
    orderId: '#ORD-48291',
    status: 'Đang chờ',
    assignTo: 'Nguyễn Thị Hoa',
    created: '10/08/2026 09:15'
  },
  {
    id: '#TCK-8719',
    customerName: 'Lê Hoàng Nam',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    issueType: 'Lỗi xác thực OTP học viên',
    orderId: '#ORD-59201',
    status: 'Đã giải quyết',
    assignTo: 'Trần Văn Bình',
    created: '10/08/2026 09:45'
  },
  {
    id: '#TCK-8503',
    customerName: 'Phạm Phương Thảo',
    customerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    issueType: 'Yêu cầu xuất hóa đơn VAT',
    orderId: '#ORD-61294',
    status: 'Đang xử lý',
    assignTo: 'Lê Thu Trang',
    created: '10/08/2026 10:10'
  },
  {
    id: '#TCK-8411',
    customerName: 'Vũ Đức Anh',
    customerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
    issueType: 'Đổi giảng viên hướng dẫn đồ án',
    orderId: '#ORD-77210',
    status: 'Đã giải quyết',
    assignTo: 'Phạm Hoàng Nam',
    created: '10/08/2026 10:30'
  }
];

const MOCK_ORDERS = [
  {
    id: '#ORD-37284',
    customerName: 'Nguyễn Văn Minh',
    projectName: 'Website E-commerce React Native & Node.js',
    amount: '15.000.000 VNĐ',
    progress: 85,
    techLead: 'Phan Quốc Bảo (Tech Lead)',
    status: 'Đang thực hiện',
    created: '01/08/2026'
  },
  {
    id: '#ORD-48291',
    customerName: 'Trần Thị Thu Hà',
    projectName: 'Hệ thống Microservices Backend Python',
    amount: '22.000.000 VNĐ',
    progress: 60,
    techLead: 'Phan Quốc Bảo (Tech Lead)',
    status: 'Đang chờ VPS',
    created: '03/08/2026'
  },
  {
    id: '#ORD-59201',
    customerName: 'Lê Hoàng Nam',
    projectName: 'Ứng dụng Di Động Flutter & Firebase',
    amount: '18.500.000 VNĐ',
    progress: 100,
    techLead: 'Phan Quốc Bảo (Tech Lead)',
    status: 'Hoàn thành',
    created: '25/07/2026'
  },
  {
    id: '#ORD-61294',
    customerName: 'Phạm Phương Thảo',
    projectName: 'Hệ thống AI Chatbot RAG & Vector DB',
    amount: '30.000.000 VNĐ',
    progress: 40,
    techLead: 'Phan Quốc Bảo (Tech Lead)',
    status: 'Đang thực hiện',
    created: '05/08/2026'
  },
  {
    id: '#ORD-77210',
    customerName: 'Vũ Đức Anh',
    projectName: 'Đồ án IoT Smart Home ESP32 & MQTT',
    amount: '12.000.000 VNĐ',
    progress: 100,
    techLead: 'Phan Quốc Bảo (Tech Lead)',
    status: 'Hoàn thành',
    created: '20/07/2026'
  }
];

const MOCK_REFUNDS = [
  {
    id: '#RF-102',
    orderId: '#ORD-48291',
    customerName: 'Trần Thị Thu Hà',
    amount: '2.200.000 VNĐ',
    reason: 'Chuyển gói VPS cao cấp hơn',
    status: 'Chờ CS Lead duyệt',
    created: '09/08/2026'
  },
  {
    id: '#RF-099',
    orderId: '#ORD-37284',
    customerName: 'Nguyễn Văn Minh',
    amount: '1.500.000 VNĐ',
    reason: 'Thanh toán trùng 2 lần qua VNPay',
    status: 'Đã hoàn tiền',
    created: '08/08/2026'
  },
  {
    id: '#RF-087',
    orderId: '#ORD-59201',
    customerName: 'Lê Hoàng Nam',
    amount: '500.000 VNĐ',
    reason: 'Áp dụng mã giảm giá sinh viên bổ sung',
    status: 'Từ chối',
    created: '05/08/2026'
  }
];

const MOCK_CUSTOMERS = [
  {
    id: 'CUST-001',
    name: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@gmail.com',
    phone: '0988 123 456',
    role: 'Học viên VIP',
    ordersCount: 3,
    totalSpent: '45.000.000 VNĐ',
    status: 'Đang hoạt động',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'CUST-002',
    name: 'Trần Thị Thu Hà',
    email: 'thuha.tran@gmail.com',
    phone: '0977 234 567',
    role: 'Doanh nghiệp',
    ordersCount: 2,
    totalSpent: '37.000.000 VNĐ',
    status: 'Đang hoạt động',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'CUST-003',
    name: 'Lê Hoàng Nam',
    email: 'nam.le@gmail.com',
    phone: '0912 345 678',
    role: 'Học viên',
    ordersCount: 1,
    totalSpent: '18.500.000 VNĐ',
    status: 'Đang hoạt động',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'CUST-004',
    name: 'Phạm Phương Thảo',
    email: 'thao.pham@gmail.com',
    phone: '0933 456 789',
    role: 'Doanh nghiệp VIP',
    ordersCount: 4,
    totalSpent: '82.000.000 VNĐ',
    status: 'Đang hoạt động',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'CUST-005',
    name: 'Vũ Đức Anh',
    email: 'ducanh.vu@gmail.com',
    phone: '0909 888 999',
    role: 'Học viên',
    ordersCount: 2,
    totalSpent: '24.000.000 VNĐ',
    status: 'Đang hoạt động',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80'
  }
];

const INITIAL_CHAT_SESSIONS = [
  {
    id: 'session-1',
    customerName: 'Sara Johnson',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    orderId: '#ORD-37284',
    status: 'Trực tuyến',
    unread: 2,
    messages: [
      { sender: 'client', name: 'Sara Johnson', text: 'Chào đội ngũ hỗ trợ! Kiểm tra giúp tôi tiến độ đồ án #ORD-37284 nhé!', time: '10:12' },
      { sender: 'cskh', name: 'Chu Phiêu Dật', text: 'Chào chị Sara, Lubpy Studio đã tiếp nhận thông tin và đang đôn đốc Kỹ thuật viên xử lý.', time: '10:14' },
      { sender: 'client', name: 'Sara Johnson', text: 'Cảm ơn em, khoảng bao giờ thì xong phần thanh toán VNPay vậy?', time: '10:15' }
    ]
  },
  {
    id: 'session-2',
    customerName: 'Nguyễn Văn Minh',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    orderId: '#ORD-59201',
    status: 'Trực tuyến',
    unread: 0,
    messages: [
      { sender: 'client', name: 'Nguyễn Văn Minh', text: 'Em ơi hướng dẫn giúp anh xuất hóa đơn VAT cho công ty nhé.', time: '09:40' },
      { sender: 'cskh', name: 'Nguyễn Thị Hoa', text: 'Dạ anh gửi mã số thuế và email nhận hóa đơn qua đây giúp em ạ!', time: '09:42' }
    ]
  },
  {
    id: 'session-3',
    customerName: 'Trần Thị Thu Hà',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    orderId: '#ORD-48291',
    status: 'Vắng mặt',
    unread: 1,
    messages: [
      { sender: 'client', name: 'Trần Thị Thu Hà', text: 'Server VPS gói Backend hiện tại dung lượng còn bao nhiêu GB em?', time: '08:30' }
    ]
  }
];

export default function CSTeamStaffDashboard({
  user,
  onLogout,
  language,
  onSwitchToManagerView,
  onSwitchToSystemManager,
  onUpdateUser
}: CSTeamStaffDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'livechat' | 'orders' | 'refunds' | 'customers' | 'feedback'>('overview');
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter state
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Interactive Live Chat State
  const [chatSessions, setChatSessions] = useState(INITIAL_CHAT_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState('session-1');
  const [chatReply, setChatReply] = useState('');

  // Feedback State
  const [feedbackReply, setFeedbackReply] = useState('');
  const [submittedReplyMessage, setSubmittedReplyMessage] = useState<string | null>(null);

  // Tickets & Orders Data
  const [tickets, setTickets] = useState<any[]>(DEFAULT_MOCK_TICKETS);
  const [orders, setOrders] = useState<any[]>(MOCK_ORDERS);
  const [refunds, setRefunds] = useState<any[]>(MOCK_REFUNDS);
  const [customers, setCustomers] = useState<any[]>(MOCK_CUSTOMERS);

  // New Ticket Form State
  const [newTicketForm, setNewTicketForm] = useState({
    customerName: '',
    issueType: 'Thanh toán đồ án',
    orderId: '',
    assignTo: 'Nguyễn Thị Hoa',
    notes: ''
  });

  const orgData = getStoredOrganization();
  const csHead = orgData.heads.cs;

  // Permissions check: Hide manager buttons for normal CS staff
  const isLeadOrAdmin = currentUser.role === 'admin' || currentUser.role === 'cs' || currentUser.isDepartmentHead;
  const isAdmin = currentUser.role === 'admin';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadCsDataFromDb = async () => {
    try {
      const dbTickets = await fetchTicketsFromDb();
      if (Array.isArray(dbTickets) && dbTickets.length > 0) {
        const mapped = dbTickets.map((t: any, idx: number) => ({
          id: t.id ? (String(t.id).startsWith('#') ? String(t.id) : `#${t.id}`) : `#TCK-${9000 - idx * 110}`,
          customerName: t.clientName || t.customerName || ['Nguyễn Văn Minh', 'Trần Thị Thu Hà', 'Lê Hoàng Nam', 'Phạm Phương Thảo', 'Vũ Đức Anh'][idx % 5],
          customerAvatar: t.customerAvatar || [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80'
          ][idx % 5],
          issueType: t.subject || t.issueType || ['Thanh toán đồ án React Native', 'Gia hạn server VPS Backend', 'Lỗi xác thực OTP học viên', 'Yêu cầu xuất hóa đơn VAT', 'Đổi giảng viên hướng dẫn đồ án'][idx % 5],
          orderId: t.orderId || t.projectId || [`#ORD-37284`, `#ORD-48291`, `#ORD-59201`, `#ORD-61294`, `#ORD-77210`][idx % 5],
          status: t.status === 'open' || t.status === 'Đang chờ' ? 'Đang chờ' : t.status === 'resolved' || t.status === 'Resolved' || t.status === 'Đã giải quyết' ? 'Đã giải quyết' : 'Đang xử lý',
          assignTo: t.assignedCs || t.assignTo || ['Chu Phiêu Dật (Lead)', 'Nguyễn Thị Hoa', 'Trần Văn Bình', 'Lê Thu Trang', 'Phạm Hoàng Nam'][idx % 5],
          created: t.createdAt ? (typeof t.createdAt === 'string' && t.createdAt.includes('/') ? t.createdAt : new Date(t.createdAt).toLocaleString('vi-VN')) : `10/08/2026 0${8 + (idx % 3)}:30`
        }));
        setTickets(mapped);
      } else {
        setTickets(DEFAULT_MOCK_TICKETS);
      }

      const dbChats = await fetchLiveChatsFromDb();
      if (Array.isArray(dbChats) && dbChats.length > 0) {
        // Option to merge dbChats
      }
    } catch (err) {
      console.error('Failed to fetch CSKH data from DB:', err);
      setTickets(DEFAULT_MOCK_TICKETS);
    }
  };

  useEffect(() => {
    loadCsDataFromDb();
  }, []);

  // Send message in Live Chat
  const handleSendLiveChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReply.trim()) return;

    const replyText = chatReply.trim();
    setChatReply('');

    // Append to active session locally
    setChatSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: [
            ...s.messages,
            { sender: 'cskh', name: currentUser.name, text: replyText, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
          ]
        };
      }
      return s;
    }));

    try {
      await sendLiveChatMessageInDb({
        sessionId: activeSessionId,
        sender: currentUser.name,
        senderRole: 'cskh',
        message: replyText,
      });
      triggerToast('💬 Đã gửi tin nhắn tư vấn khách hàng thành công!');
    } catch (err: any) {
      triggerToast('💬 Đã ghi nhận tin nhắn nội bộ CSKH!');
    }
  };

  const handleToggleTicketStatus = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        let nextStatus = 'Đang xử lý';
        if (t.status === 'Đang xử lý') nextStatus = 'Đã giải quyết';
        else if (t.status === 'Đã giải quyết') nextStatus = 'Đang chờ';

        triggerToast(`🎉 Cập nhật trạng thái ${t.id} thành "${nextStatus}"`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleCreateNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.customerName.trim()) {
      triggerToast('⚠️ Vui lòng nhập tên khách hàng!');
      return;
    }

    const newTicketObj = {
      id: `#TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newTicketForm.customerName,
      customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      issueType: newTicketForm.issueType,
      orderId: newTicketForm.orderId || '#ORD-88888',
      status: 'Đang xử lý',
      assignTo: newTicketForm.assignTo,
      created: new Date().toLocaleString('vi-VN')
    };

    setTickets(prev => [newTicketObj, ...prev]);
    setShowNewTicketModal(false);
    setNewTicketForm({
      customerName: '',
      issueType: 'Thanh toán đồ án',
      orderId: '',
      assignTo: 'Nguyễn Thị Hoa',
      notes: ''
    });

    try {
      await createTicketInDb({
        clientName: newTicketObj.customerName,
        subject: newTicketObj.issueType,
        orderId: newTicketObj.orderId,
        assignedCs: newTicketObj.assignTo,
        status: 'open'
      });
      triggerToast('🚀 Tạo mới Yêu cầu (Ticket) thành công!');
    } catch (err) {
      triggerToast('🚀 Đã lưu Yêu cầu (Ticket) vào hệ thống!');
    }
  };

  const handleApproveRefund = (refundId: string) => {
    setRefunds(prev => prev.map(r => {
      if (r.id === refundId) {
        triggerToast(`✅ Đã duyệt chuyển CS Lead hoàn tiền cho ${r.id}`);
        return { ...r, status: 'Đã hoàn tiền' };
      }
      return r;
    }));
  };

  const filteredTickets = tickets.filter(t => {
    const idStr = String(t.id || '');
    const clientStr = String(t.customerName || t.clientName || '');
    const subjectStr = String(t.issueType || t.subject || '');
    const orderStr = String(t.orderId || '');
    const matchSearch = idStr.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                        clientStr.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                        subjectStr.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                        orderStr.toLowerCase().includes(ticketSearch.toLowerCase());
    const matchStatus = ticketFilterStatus === 'all' || 
                        String(t.status || '').toLowerCase().replace(/\s/g, '') === ticketFilterStatus.toLowerCase().replace(/\s/g, '');
    return matchSearch && matchStatus;
  });

  const filteredOrders = orders.filter(o => {
    const idStr = String(o.id || '');
    const clientStr = String(o.customerName || '');
    const projStr = String(o.projectName || '');
    return idStr.toLowerCase().includes(orderSearch.toLowerCase()) ||
           clientStr.toLowerCase().includes(orderSearch.toLowerCase()) ||
           projStr.toLowerCase().includes(orderSearch.toLowerCase());
  });

  const filteredCustomers = customers.filter(c => {
    const nameStr = String(c.name || '');
    const emailStr = String(c.email || '');
    const phoneStr = String(c.phone || '');
    return nameStr.toLowerCase().includes(customerSearch.toLowerCase()) ||
           emailStr.toLowerCase().includes(customerSearch.toLowerCase()) ||
           phoneStr.toLowerCase().includes(customerSearch.toLowerCase());
  });

  const activeChat = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0];

  const handleSendFeedbackReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackReply.trim()) return;
    setSubmittedReplyMessage(`Đã phản hồi khách hàng: "${feedbackReply}"`);
    setFeedbackReply('');
    triggerToast('💬 Phản hồi đánh giá khách hàng thành công!');
  };

  const { visibleNotifs } = getVisibleNotificationsForUser(currentUser, orgData.heads);
  const unreadCount = visibleNotifs.filter(n => !n.readBy || !n.readBy.includes(currentUser.email.toLowerCase())).length;

  return (
    <div className="min-h-screen bg-[#0a1017] text-gray-100 font-sans flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500/90 text-slate-950 font-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR - Lubpy Studio Brand */}
      <aside className="w-full lg:w-64 bg-[#0d1620] border-r border-[#1a2736] p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand: Lubpy Studio */}
          <div className="flex items-center justify-between mb-8 px-2 pt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-500/20">
                <Headset className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight">Lubpy Studio</span>
                <span className="block text-[9px] font-mono text-cyan-400 tracking-wider uppercase">CS Support Staff</span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#182838] text-cyan-400 border border-cyan-500/30 shadow-inner'
                  : 'text-gray-400 hover:text-white hover:bg-[#121e2b]'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Tổng Quan</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tickets'
                  ? 'bg-[#182838] text-cyan-400 border border-cyan-500/30 shadow-inner'
                  : 'text-gray-400 hover:text-white hover:bg-[#121e2b]'
              }`}
            >
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              <span>Yêu Cầu (Tickets)</span>
              <span className="ml-auto px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-[10px] rounded-full font-mono">{tickets.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('livechat')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'livechat'
                  ? 'bg-[#182838] text-cyan-400 border border-cyan-500/30 shadow-inner'
                  : 'text-gray-400 hover:text-white hover:bg-[#121e2b]'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Trò Chuyện Trực Tiếp</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#182838] text-cyan-400 border border-cyan-500/30 shadow-inner'
                  : 'text-gray-400 hover:text-white hover:bg-[#121e2b]'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Đơn Hàng &amp; Đồ Án</span>
            </button>

            <button
              onClick={() => setActiveTab('refunds')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'refunds'
                  ? 'bg-[#182838] text-cyan-400 border border-cyan-500/30 shadow-inner'
                  : 'text-gray-400 hover:text-white hover:bg-[#121e2b]'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-rose-400" />
              <span>Hoàn Tiền &amp; Đổi Trả</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'customers'
                  ? 'bg-[#182838] text-cyan-400 border border-cyan-500/30 shadow-inner'
                  : 'text-gray-400 hover:text-white hover:bg-[#121e2b]'
              }`}
            >
              <UserIcon className="w-4 h-4 text-purple-400" />
              <span>Khách Hàng &amp; Học Viên</span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'feedback'
                  ? 'bg-[#182838] text-cyan-400 border border-cyan-500/30 shadow-inner'
                  : 'text-gray-400 hover:text-white hover:bg-[#121e2b]'
              }`}
            >
              <ThumbsUp className="w-4 h-4 text-amber-300" />
              <span>Đánh Giá &amp; Phản Hồi</span>
            </button>
          </nav>
        </div>

        {/* Head Info Card & Switchers */}
        <div className="pt-4 border-t border-[#1a2736] space-y-3">
          {/* TRƯỜNG BỘ PHẬN CHỈ ĐẠO CARD */}
          <div className="p-3 bg-[#111a24] rounded-xl border border-[#1e2f42]">
            <div className="text-[10px] text-gray-400 font-mono uppercase mb-1">TRƯỜNG BỘ PHẬN CHỈ ĐẠO:</div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                {(csHead?.name || 'Chu Phiêu Dật').charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{csHead?.name || 'Chu Phiêu Dật'}</div>
                <div className="text-[10px] text-emerald-400 truncate font-mono">{csHead?.email || 'chudat@lubpystudio.vn'}</div>
              </div>
            </div>
          </div>

          {/* View Switcher buttons (ONLY visible for Lead or Admin) */}
          {isLeadOrAdmin && onSwitchToManagerView && (
            <button
              onClick={onSwitchToManagerView}
              className="w-full py-2 bg-[#182838] hover:bg-[#20344a] text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chuyển sang CS Lead View</span>
            </button>
          )}

          {isAdmin && onSwitchToSystemManager && (
            <button
              onClick={onSwitchToSystemManager}
              className="w-full py-2 bg-[#121d28] hover:bg-[#1a2938] text-gray-300 border border-[#22354a] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-gray-400" />
              <span>System Manager View</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1a2736]">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>
                {activeTab === 'overview' && 'Tổng Quan Nghiệp Vụ CSKH'}
                {activeTab === 'tickets' && 'Quản Lý Yêu Cầu & Ticket CSKH'}
                {activeTab === 'livechat' && 'Trung Tâm Trò Chuyện Trực Tiếp'}
                {activeTab === 'orders' && 'Danh Sách Đơn Hàng & Đồ Án'}
                {activeTab === 'refunds' && 'Xử Lý Hoàn Tiền & Đổi Trả'}
                {activeTab === 'customers' && 'Quản Lý Khách Hàng & Học Viên'}
                {activeTab === 'feedback' && 'Đánh Giá & Chất Lượng CSAT'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Lubpy Studio CSKH
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Hệ thống quản lý dịch vụ khách hàng Lubpy Studio • Trưởng Phòng: Chu Phiêu Dật (chudat@lubpystudio.vn)
            </p>
          </div>

          {/* Top Actions: Search, Mailbox, Profile */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Search bar */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Tìm kiếm thông tin..." 
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="bg-[#111c28] border border-[#1e2f42] text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-cyan-500 focus:outline-none w-64"
              />
            </div>

            {/* Notification Mailbox Button */}
            <button 
              onClick={() => setShowNotifModal(true)}
              className="p-2.5 bg-[#111c28] hover:bg-[#1a2a3c] text-gray-300 hover:text-white rounded-xl transition-all relative group border border-[#1e2f42]"
              title="Hộp thư thông báo chỉ đạo từ CS Lead (Chu Phiêu Dật) & Super Admin"
            >
              <Mail className="w-4.5 h-4.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full shadow animate-pulse">
                  {unreadCount}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full" />
              )}
            </button>

            {/* User Profile Trigger Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#111c28] hover:bg-[#1a2a3c] border border-[#1e2f42] hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center overflow-hidden shrink-0 shadow">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <Edit2 className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {currentUser.departmentTitle || 'Nhân Viên CSKH'}
                </div>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all"
              title="Đăng xuất"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#101a26] border border-[#1c2d3e] p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <LifeBuoy className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400 cursor-pointer">•••</span>
                </div>
                <div className="text-xs font-medium text-gray-400">Yêu cầu hôm nay</div>
                <div className="text-3xl font-black text-white mt-1 tracking-tight">248</div>
                <div className="flex items-center justify-between mt-3 text-[11px]">
                  <span className="text-gray-400">So với tháng trước</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                    +25% ↗
                  </span>
                </div>
              </div>

              <div className="bg-[#101a26] border border-[#1c2d3e] p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400 cursor-pointer">•••</span>
                </div>
                <div className="text-xs font-medium text-gray-400">Đã giải quyết</div>
                <div className="text-3xl font-black text-white mt-1 tracking-tight">212</div>
                <div className="flex items-center justify-between mt-3 text-[11px]">
                  <span className="text-gray-400">So với tháng trước</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                    +25% ↗
                  </span>
                </div>
              </div>

              <div className="bg-[#101a26] border border-[#1c2d3e] p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400 cursor-pointer">•••</span>
                </div>
                <div className="text-xs font-medium text-gray-400">Đang chờ xử lý</div>
                <div className="text-3xl font-black text-white mt-1 tracking-tight">36</div>
                <div className="flex items-center justify-between mt-3 text-[11px]">
                  <span className="text-gray-400">So với tháng trước</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono">
                    +25% ↗
                  </span>
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Tickets Table (2 cols) */}
              <div className="lg:col-span-2 bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Yêu cầu cần xử lý gần đây</h3>
                    <p className="text-xs text-gray-400">Tổng số {filteredTickets.length} yêu cầu cần hỗ trợ &amp; theo dõi</p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button 
                      onClick={() => setTicketFilterStatus('all')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        ticketFilterStatus === 'all'
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'bg-[#182838] text-gray-300 hover:text-white border border-[#22354a]'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button 
                      onClick={() => setTicketFilterStatus('Đang xử lý')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        ticketFilterStatus === 'Đang xử lý'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-[#182838] text-gray-300 hover:text-white border border-[#22354a]'
                      }`}
                    >
                      Đang xử lý
                    </button>
                    <button 
                      onClick={() => setTicketFilterStatus('Đang chờ')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        ticketFilterStatus === 'Đang chờ'
                          ? 'bg-sky-500 text-slate-950 shadow'
                          : 'bg-[#182838] text-gray-300 hover:text-white border border-[#22354a]'
                      }`}
                    >
                      Đang chờ
                    </button>
                    <button 
                      onClick={() => setTicketFilterStatus('Đã giải quyết')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        ticketFilterStatus === 'Đã giải quyết'
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-[#182838] text-gray-300 hover:text-white border border-[#22354a]'
                      }`}
                    >
                      Đã giải quyết
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1c2d3e] text-gray-400 font-mono text-[11px] bg-[#0c141e]">
                        <th className="py-2.5 px-3">Mã Ticket</th>
                        <th className="py-2.5 px-3">Khách Hàng</th>
                        <th className="py-2.5 px-3">Loại Sự Cố</th>
                        <th className="py-2.5 px-3">Mã Đơn Hàng</th>
                        <th className="py-2.5 px-3">Trạng Thái</th>
                        <th className="py-2.5 px-3">Người Xử Lý</th>
                        <th className="py-2.5 px-3">Ngày Tạo</th>
                        <th className="py-2.5 px-3 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182636]">
                      {filteredTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-[#152332] transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">{t.id}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2 min-w-[130px]">
                              <img src={t.customerAvatar} alt={t.customerName} className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10" />
                              <span className="font-bold text-white truncate">{t.customerName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-300 min-w-[180px]">{t.issueType}</td>
                          <td className="py-3 px-3 font-mono text-cyan-300 whitespace-nowrap">{t.orderId}</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'Đang xử lý' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                : t.status === 'Đã giải quyết'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-300 font-medium whitespace-nowrap">{t.assignTo}</td>
                          <td className="py-3 px-3 text-gray-400 font-mono whitespace-nowrap">{t.created}</td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleTicketStatus(t.id)}
                              className="px-2.5 py-1 bg-[#182838] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Click để chuyển trạng thái ticket"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Chuyển Hướng</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 text-center">
                  <button onClick={() => setActiveTab('tickets')} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1">
                    <span>Xem tất cả yêu cầu (Tickets)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live Chat Side Widget (1 col) */}
              <div className="bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Trò chuyện trực tiếp</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </h3>
                      <p className="text-xs text-gray-400">44 cuộc hội thoại đang hoạt động</p>
                    </div>
                    <button onClick={() => setActiveTab('livechat')} className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1">
                      <span>Xem chi tiết</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Active Conversation Box */}
                  <div className="bg-[#152332] border border-[#1e3146] p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={activeChat.avatar} 
                          alt={activeChat.customerName} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#152332]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{activeChat.customerName}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded-full">
                            {activeChat.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-cyan-400" />
                            <span>{activeChat.messages.length} tin nhắn</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{activeChat.orderId}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0e1722] p-2.5 rounded-lg text-xs text-gray-300 italic border border-white/5">
                      "{activeChat.messages[activeChat.messages.length - 1]?.text || 'Cần hỗ trợ đồ án'}"
                    </div>

                    <form onSubmit={handleSendLiveChat} className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Nhập tin nhắn tư vấn..."
                        value={chatReply}
                        onChange={(e) => setChatReply(e.target.value)}
                        className="flex-1 bg-[#0b141f] border border-[#1e3146] text-xs text-white px-2.5 py-1.5 rounded-lg focus:border-cyan-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-bold text-xs transition-all flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM BLOCKS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-5 space-y-3 shadow-xl">
                <h3 className="text-base font-bold text-white">Phân loại sự cố đơn hàng</h3>
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Chậm tiến độ bàn giao</span>
                      <span className="font-mono font-bold text-cyan-400">40%</span>
                    </div>
                    <div className="w-full bg-[#162534] h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Lỗi giao dịch thanh toán</span>
                      <span className="font-mono font-bold text-sky-400">25%</span>
                    </div>
                    <div className="w-full bg-[#162534] h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-400 h-full rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Yêu cầu hoàn tiền / hủy</span>
                      <span className="font-mono font-bold text-amber-400">15%</span>
                    </div>
                    <div className="w-full bg-[#162534] h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: '15%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-5 space-y-3 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white">Đánh giá từ khách hàng</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
                      4.8/5 ⭐
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed bg-[#152332] p-3 rounded-xl border border-white/5">
                    "Rất hài lòng với tốc độ hỗ trợ nhiệt tình của CSKH Lubpy Studio. Giải quyết vướng mắc nhanh chóng!"
                  </p>

                  {submittedReplyMessage && (
                    <div className="mt-2 text-[11px] text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
                      {submittedReplyMessage}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendFeedbackReply} className="flex gap-2 pt-2">
                  <input 
                    type="text"
                    placeholder="Nhập phản hồi khách hàng..."
                    value={feedbackReply}
                    onChange={(e) => setFeedbackReply(e.target.value)}
                    className="flex-1 bg-[#152332] border border-[#1e3146] text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none"
                  />
                  <button 
                    type="submit"
                    className="p-2 bg-cyan-500 text-slate-950 rounded-xl hover:bg-cyan-400 font-bold transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-5 space-y-3 shadow-xl">
                <h3 className="text-base font-bold text-white">Hiệu suất nhân viên</h3>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs p-2.5 bg-[#152332] rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Nguyễn Thị Hoa" className="w-7 h-7 rounded-full object-cover" />
                      <span className="font-bold text-white">Nguyễn Thị Hoa</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cyan-400">48 Đã xử lý</div>
                      <div className="text-[10px] text-gray-400 font-mono">Thời gian phản hồi TB: 15m</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2.5 bg-[#152332] rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80" alt="Trần Văn Bình" className="w-7 h-7 rounded-full object-cover" />
                      <span className="font-bold text-white">Trần Văn Bình</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">42 Đã xử lý</div>
                      <div className="text-[10px] text-gray-400 font-mono">Thời gian phản hồi TB: 18m</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TICKETS */}
        {/* ========================================================= */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 bg-[#101a26] p-5 rounded-2xl border border-[#1c2d3e]">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-emerald-400" />
                  <span>Quản Lý Yêu Cầu Hỗ Trợ (Tickets)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Danh sách đầy đủ tất cả các yêu cầu từ khách hàng &amp; học viên Lubpy Studio
                </p>
              </div>

              <button
                onClick={() => setShowNewTicketModal(true)}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Ticket Mới</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#101a26] p-4 rounded-2xl border border-[#1c2d3e]">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm mã ticket, khách hàng, loại sự cố..." 
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full bg-[#152332] border border-[#1e3146] text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button 
                  onClick={() => setTicketFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    ticketFilterStatus === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-[#182838] text-gray-300 hover:text-white'
                  }`}
                >
                  Tất cả ({tickets.length})
                </button>
                <button 
                  onClick={() => setTicketFilterStatus('Đang xử lý')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    ticketFilterStatus === 'Đang xử lý' ? 'bg-amber-500 text-slate-950' : 'bg-[#182838] text-gray-300 hover:text-white'
                  }`}
                >
                  Đang xử lý ({tickets.filter(t => t.status === 'Đang xử lý').length})
                </button>
                <button 
                  onClick={() => setTicketFilterStatus('Đang chờ')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    ticketFilterStatus === 'Đang chờ' ? 'bg-sky-500 text-slate-950' : 'bg-[#182838] text-gray-300 hover:text-white'
                  }`}
                >
                  Đang chờ ({tickets.filter(t => t.status === 'Đang chờ').length})
                </button>
                <button 
                  onClick={() => setTicketFilterStatus('Đã giải quyết')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    ticketFilterStatus === 'Đã giải quyết' ? 'bg-emerald-500 text-slate-950' : 'bg-[#182838] text-gray-300 hover:text-white'
                  }`}
                >
                  Đã giải quyết ({tickets.filter(t => t.status === 'Đã giải quyết').length})
                </button>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-5 shadow-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1c2d3e] text-gray-400 font-mono text-[11px] bg-[#0c141e]">
                    <th className="py-3 px-3">Mã Ticket</th>
                    <th className="py-3 px-3">Khách Hàng</th>
                    <th className="py-3 px-3">Loại Sự Cố</th>
                    <th className="py-3 px-3">Mã Đơn Hàng</th>
                    <th className="py-3 px-3">Trạng Thái</th>
                    <th className="py-3 px-3">Người Xử Lý</th>
                    <th className="py-3 px-3">Ngày Tạo</th>
                    <th className="py-3 px-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182636]">
                  {filteredTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-[#152332] transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-cyan-400">{t.id}</td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img src={t.customerAvatar} alt={t.customerName} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />
                          <span className="font-bold text-white">{t.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-gray-200 font-medium">{t.issueType}</td>
                      <td className="py-3.5 px-3 font-mono text-cyan-300">{t.orderId}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          t.status === 'Đang xử lý' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : t.status === 'Đã giải quyết'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-300 font-medium">{t.assignTo}</td>
                      <td className="py-3.5 px-3 text-gray-400 font-mono">{t.created}</td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleTicketStatus(t.id)}
                          className="px-3 py-1.5 bg-[#182838] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Đổi Trạng Thái</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LIVE CHAT */}
        {/* ========================================================= */}
        {activeTab === 'livechat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] min-h-[550px]">
            {/* Chat List (1 col) */}
            <div className="bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Hội thoại đang hoạt động</span>
                </h2>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {chatSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                      activeSessionId === session.id
                        ? 'bg-[#182838] border-cyan-500/50 shadow-md'
                        : 'bg-[#152332] border-[#1e3146] hover:bg-[#1a2b3d]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={session.avatar} alt={session.customerName} className="w-10 h-10 rounded-full object-cover" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#152332] ${
                        session.status === 'Trực tuyến' ? 'bg-emerald-400' : 'bg-gray-500'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{session.customerName}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{session.orderId}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {session.messages[session.messages.length - 1]?.text}
                      </p>
                    </div>

                    {session.unread > 0 && (
                      <span className="w-4 h-4 bg-cyan-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shrink-0">
                        {session.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Box (2 cols) */}
            <div className="lg:col-span-2 bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-5 flex flex-col justify-between">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#1c2d3e]">
                <div className="flex items-center gap-3">
                  <img src={activeChat.avatar} alt={activeChat.customerName} className="w-10 h-10 rounded-full object-cover border border-cyan-500/30" />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{activeChat.customerName}</span>
                      <span className="px-2 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full">
                        {activeChat.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      Đơn hàng liên quan: <strong className="text-cyan-400">{activeChat.orderId}</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-mono">Kênh CSKH Lubpy Studio</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 my-4 space-y-3 overflow-y-auto p-2 bg-[#0b141f] rounded-xl border border-[#182636]">
                {activeChat.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === 'cskh' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-gray-400 mb-0.5 px-1 font-mono">
                      {m.name} • {m.time}
                    </div>
                    <div className={`p-3 rounded-2xl text-xs max-w-md leading-relaxed ${
                      m.sender === 'cskh'
                        ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none shadow'
                        : 'bg-[#182838] text-white border border-[#22354a] rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Reply Suggestions */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 text-[11px]">
                <span className="text-gray-400 shrink-0">Mẫu nhanh:</span>
                <button
                  onClick={() => setChatReply("Lubpy Studio xin chào! Em có thể hỗ trợ gì cho anh/chị ạ?")}
                  className="px-2.5 py-1 bg-[#182838] hover:bg-[#20344a] text-cyan-300 border border-cyan-500/30 rounded-lg shrink-0"
                >
                  "Lubpy Studio xin chào..."
                </button>
                <button
                  onClick={() => setChatReply("Đã tiếp nhận yêu cầu, kỹ thuật viên đang xử lý ngay ạ!")}
                  className="px-2.5 py-1 bg-[#182838] hover:bg-[#20344a] text-cyan-300 border border-cyan-500/30 rounded-lg shrink-0"
                >
                  "Kỹ thuật đang xử lý..."
                </button>
                <button
                  onClick={() => setChatReply("Hóa đơn VAT và chứng từ đã được gửi qua email quý khách.")}
                  className="px-2.5 py-1 bg-[#182838] hover:bg-[#20344a] text-cyan-300 border border-cyan-500/30 rounded-lg shrink-0"
                >
                  "Hóa đơn đã gửi email..."
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendLiveChat} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập nội dung phản hồi tư vấn khách hàng..."
                  value={chatReply}
                  onChange={(e) => setChatReply(e.target.value)}
                  className="flex-1 bg-[#152332] border border-[#1e3146] text-xs text-white px-4 py-2.5 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ORDERS */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 bg-[#101a26] p-5 rounded-2xl border border-[#1c2d3e]">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <span>Quản Lý Đơn Hàng &amp; Đồ Án Kỹ Thuật</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Theo dõi tiến độ bàn giao đồ án, giá trị đơn hàng &amp; Trưởng nhóm Kỹ thuật chịu trách nhiệm
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Tìm đơn hàng, đồ án, khách..." 
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-[#152332] border border-[#1e3146] text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(o => (
                <div key={o.id} className="bg-[#101a26] border border-[#1c2d3e] p-5 rounded-2xl shadow-xl space-y-3 hover:border-cyan-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400 text-sm">{o.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      o.status === 'Hoàn thành' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {o.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{o.projectName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Khách hàng: <strong className="text-gray-200">{o.customerName}</strong></p>
                  </div>

                  <div className="bg-[#152332] p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Giá trị đơn:</span>
                      <span className="font-mono font-bold text-emerald-400">{o.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Kỹ thuật phụ trách:</span>
                      <span className="text-cyan-300 font-medium">{o.techLead}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Tiến độ bàn giao</span>
                        <span className="font-mono font-bold text-cyan-400">{o.progress}%</span>
                      </div>
                      <div className="w-full bg-[#0d1620] h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full" style={{ width: `${o.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => triggerToast(`🔔 Đã gửi nhắc nhở tiến độ cho ${o.techLead}`)}
                      className="flex-1 py-1.5 bg-[#182838] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all text-center"
                    >
                      Nhắc Tiến Độ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: REFUNDS */}
        {/* ========================================================= */}
        {activeTab === 'refunds' && (
          <div className="space-y-6">
            <div className="bg-[#101a26] p-5 rounded-2xl border border-[#1c2d3e]">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-rose-400" />
                <span>Xử Lý Hoàn Tiền &amp; Đổi Trả Đơn Hàng</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Tiếp nhận yêu cầu hoàn tiền, rà soát lý do &amp; trình CS Lead (Chu Phiêu Dật) duyệt chi
              </p>
            </div>

            <div className="bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-5 shadow-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1c2d3e] text-gray-400 font-mono text-[11px] bg-[#0c141e]">
                    <th className="py-3 px-3">Mã Yêu Cầu</th>
                    <th className="py-3 px-3">Mã Đơn Hàng</th>
                    <th className="py-3 px-3">Khách Hàng</th>
                    <th className="py-3 px-3">Số Tiền Hoàn</th>
                    <th className="py-3 px-3">Lý Do Hoàn Tiền</th>
                    <th className="py-3 px-3">Trạng Thái Duyệt</th>
                    <th className="py-3 px-3 text-center">Thao Tác CSKH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182636]">
                  {refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-[#152332] transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-rose-400">{r.id}</td>
                      <td className="py-3.5 px-3 font-mono text-cyan-300">{r.orderId}</td>
                      <td className="py-3.5 px-3 font-bold text-white">{r.customerName}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">{r.amount}</td>
                      <td className="py-3.5 px-3 text-gray-300 max-w-xs">{r.reason}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          r.status === 'Đã hoàn tiền' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : r.status === 'Từ chối'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {r.status === 'Chờ CS Lead duyệt' ? (
                          <button
                            onClick={() => handleApproveRefund(r.id)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow"
                          >
                            Xác Nhận &amp; Chuyển Lead
                          </button>
                        ) : (
                          <span className="text-gray-500 font-mono text-[10px]">Đã đóng hồ sơ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: CUSTOMERS */}
        {/* ========================================================= */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 bg-[#101a26] p-5 rounded-2xl border border-[#1c2d3e]">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-purple-400" />
                  <span>Danh Sách Khách Hàng &amp; Học Viên</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Cơ sở dữ liệu khách hàng sử dụng dịch vụ Lubpy Studio
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Tìm tên, email, SĐT..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-[#152332] border border-[#1e3146] text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map(c => (
                <div key={c.id} className="bg-[#101a26] border border-[#1c2d3e] p-5 rounded-2xl shadow-xl space-y-3 hover:border-purple-500/40 transition-all">
                  <div className="flex items-center gap-3">
                    <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30" />
                    <div>
                      <h3 className="text-sm font-bold text-white">{c.name}</h3>
                      <span className="px-2 py-0.2 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full">
                        {c.role}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#152332] p-3 rounded-xl border border-white/5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-gray-300">
                      <span>Email:</span>
                      <span className="text-cyan-300">{c.email}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>SĐT/Zalo:</span>
                      <span className="text-emerald-400">{c.phone}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Số đồ án đã đặt:</span>
                      <span className="text-amber-400 font-bold">{c.ordersCount} đồ án</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Tổng chi tiêu:</span>
                      <span className="text-emerald-300 font-bold">{c.totalSpent}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewTicketForm(prev => ({ ...prev, customerName: c.name }));
                      setShowNewTicketModal(true);
                    }}
                    className="w-full py-2 bg-[#182838] hover:bg-purple-500 hover:text-white text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo Ticket Hỗ Trợ Cho Khách</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: FEEDBACK */}
        {/* ========================================================= */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="bg-[#101a26] p-5 rounded-2xl border border-[#1c2d3e] flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-amber-300" />
                  <span>Đánh Giá Khách Hàng &amp; Chỉ Số Hài Lòng CSAT</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Đánh giá trực tiếp từ học viên &amp; đối tác sau khi được hỗ trợ ticket
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-mono font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Chỉ Số CSAT Trung Bình: 4.85 / 5.0</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#101a26] border border-[#1c2d3e] p-5 rounded-2xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Emily Clark" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold text-white">Emily Clark (Khách Hàng)</div>
                      <div className="text-[10px] text-gray-400 font-mono">Đơn hàng #ORD-57284</div>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed bg-[#152332] p-3 rounded-xl border border-white/5">
                  "Rất hài lòng với tốc độ hỗ trợ nhiệt tình của CSKH Lubpy Studio. Đã giải quyết vướng mắc thanh toán cực kỳ nhanh!"
                </p>
              </div>

              <div className="bg-[#101a26] border border-[#1c2d3e] p-5 rounded-2xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Nguyễn Văn Minh" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold text-white">Nguyễn Văn Minh (Học Viên)</div>
                      <div className="text-[10px] text-gray-400 font-mono">Đơn hàng #ORD-37284</div>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed bg-[#152332] p-3 rounded-xl border border-white/5">
                  "Giao diện mượt mà, hỗ trợ kỹ thuật tận tâm. Sẽ tiếp tục đồng hành cùng Lubpy Studio cho các đồ án tiếp theo!"
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: TẠO TICKET MỚI */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101a26] border border-[#1c2d3e] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2d3e]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-cyan-400" />
                <span>Tạo Mới Yêu Cầu (Ticket) CSKH</span>
              </h3>
              <button 
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 hover:bg-[#1c2d3e] rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Tên Khách Hàng / Học Viên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên khách hàng..."
                  value={newTicketForm.customerName}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full bg-[#152332] border border-[#1e3146] text-white p-2.5 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Loại Sự Cố / Yêu Cầu *</label>
                <select
                  value={newTicketForm.issueType}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, issueType: e.target.value }))}
                  className="w-full bg-[#152332] border border-[#1e3146] text-white p-2.5 rounded-xl focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Thanh toán đồ án">Thanh toán đồ án</option>
                  <option value="Gia hạn server VPS">Gia hạn server VPS</option>
                  <option value="Lỗi xác thực tài khoản">Lỗi xác thực tài khoản</option>
                  <option value="Yêu cầu xuất hóa đơn VAT">Yêu cầu xuất hóa đơn VAT</option>
                  <option value="Đổi giảng viên / Kỹ thuật viên">Đổi giảng viên / Kỹ thuật viên</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Mã Đơn Hàng Liên Quan</label>
                <input
                  type="text"
                  placeholder="Ví dụ: #ORD-37284"
                  value={newTicketForm.orderId}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, orderId: e.target.value }))}
                  className="w-full bg-[#152332] border border-[#1e3146] text-white p-2.5 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Phân Công Nhân Viên Xử Lý</label>
                <select
                  value={newTicketForm.assignTo}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, assignTo: e.target.value }))}
                  className="w-full bg-[#152332] border border-[#1e3146] text-white p-2.5 rounded-xl focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Chu Phiêu Dật (Lead)">Chu Phiêu Dật (Lead)</option>
                  <option value="Nguyễn Thị Hoa">Nguyễn Thị Hoa</option>
                  <option value="Trần Văn Bình">Trần Văn Bình</option>
                  <option value="Lê Thu Trang">Lê Thu Trang</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 bg-[#182838] hover:bg-[#20344a] text-gray-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl shadow"
                >
                  Tạo Ticket
                </button>
              </div>
            </form>
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
          triggerToast('🎉 Cập nhật hồ sơ thành công!');
        }}
        onTriggerToast={triggerToast}
      />
    </div>
  );
}
