import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderKanban, MessageSquare, CheckCircle, Clock, Send, UploadCloud, 
  UserCheck, PlusCircle, ArrowRight, Shield, Award, Users, BarChart3, 
  FileText, Code2, HeartHandshake, Settings, DollarSign, BookOpen, AlertCircle, Trash2,
  Camera
} from 'lucide-react';
import { User, ProjectRequest, SupportTicket, UserRole } from '../types';
import AdminFintrixityDashboard from './AdminFintrixityDashboard';
import TechDeveloperDashboard from './TechDeveloperDashboard';
import CustomerSupportDashboard from './CustomerSupportDashboard';
import ClientPlayerDashboard from './ClientPlayerDashboard';
import HRDashboard from './HRDashboard';
import AccountingDashboard from './AccountingDashboard';
import CSTeamStaffDashboard from './staff/CSTeamStaffDashboard';
import AccountingStaffDashboard from './staff/AccountingStaffDashboard';
import TechStaffDashboard from './staff/TechStaffDashboard';
import HRStaffDashboard from './staff/HRStaffDashboard';
import CameraAvatarModal from './CameraAvatarModal';
import WorkspaceNotificationBell from './WorkspaceNotificationBell';
import { getSavedAccounts, saveAccountToStorage } from '../utils/savedAccounts';
import { saveUserSession } from '../utils/session';
import { getStoredOrganization, saveOrganization } from '../utils/organizationStore';
import { checkRoleAuthority } from '../utils/authGuards';

interface WorkspaceDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onOpenRequestModal: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

// Initial project requests & tickets (Empty by default)
const INITIAL_PROJECTS: ProjectRequest[] = [];

const INITIAL_TICKETS: SupportTicket[] = [];

const INITIAL_USERS: User[] = [];

function deduplicateUsers(userList: User[]): User[] {
  const seenEmails = new Set<string>();
  const seenUids = new Set<string>();
  const result: User[] = [];
  userList.forEach(u => {
    if (!u || !u.email) return;
    const cleanEmail = u.email.toLowerCase().trim();
    if (!seenEmails.has(cleanEmail)) {
      seenEmails.add(cleanEmail);
      let uid = u.uid || `user_${Math.random().toString(36).substring(2, 9)}`;
      if (seenUids.has(uid)) {
        uid = `${uid}_${Math.random().toString(36).substring(2, 6)}`;
      }
      seenUids.add(uid);
      result.push({ ...u, uid });
    }
  });
  return result;
}

export default function WorkspaceDashboard({ user, onLogout, language, onOpenRequestModal, onUpdateUser }: WorkspaceDashboardProps) {
  // Sync core data using localStorage to represent a simulated server persistence
  const [projects, setProjects] = useState<ProjectRequest[]>(() => {
    const saved = localStorage.getItem('lubpy_projects');
    if (saved) {
      try {
        const parsed: ProjectRequest[] = JSON.parse(saved);
        return parsed.filter(p => !['PRJ-2401', 'PRJ-2402'].includes(p.id));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('lubpy_tickets');
    if (saved) {
      try {
        const parsed: SupportTicket[] = JSON.parse(saved);
        return parsed.filter(t => !['TCK-701'].includes(t.id));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('lubpy_users');
    let list: User[] = [user];
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      } catch (e) {}
    }
    const userEmailLower = (user?.email || '').toLowerCase().trim();
    const cleaned = list.filter(u => 
      u && u.email && 
      u.email.toLowerCase() !== 'client@gmail.com' && 
      u.email.toLowerCase() !== 'bao.tech@gmail.com' && 
      u.email.toLowerCase() !== 'mai.cs@gmail.com'
    );
    const exists = userEmailLower ? cleaned.some(u => u && u.email && u.email.toLowerCase().trim() === userEmailLower) : true;
    const combined = exists || !user ? cleaned : [...cleaned, user];
    return deduplicateUsers(combined);
  });

  // Ensure current logged in user is in the system users table and filter out dummy roles
  useEffect(() => {
    if (!user || !user.email) return;
    const userEmailLower = user.email.toLowerCase().trim();
    const cleaned = users.filter(u => 
      u && u.email &&
      u.email.toLowerCase() !== 'client@gmail.com' && 
      u.email.toLowerCase() !== 'bao.tech@gmail.com' && 
      u.email.toLowerCase() !== 'mai.cs@gmail.com'
    );
    const exists = cleaned.some(u => u && u.email && u.email.toLowerCase().trim() === userEmailLower);
    const combined = exists ? cleaned : [...cleaned, user];
    const updated = deduplicateUsers(combined);

    if (updated.length !== users.length || !exists) {
      setUsers(updated);
      localStorage.setItem('lubpy_users', JSON.stringify(updated));
    }
  }, [user]);

  // Save changes to localStorage on states update
  useEffect(() => {
    localStorage.setItem('lubpy_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('lubpy_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('lubpy_users', JSON.stringify(users));
  }, [users]);

  // Synchronize master tables in real time when requests are submitted from the modal form
  useEffect(() => {
    const handleReload = () => {
      const savedProjs = localStorage.getItem('lubpy_projects');
      if (savedProjs) {
        try {
          setProjects(JSON.parse(savedProjs));
        } catch (e) {}
      }
      const savedTcks = localStorage.getItem('lubpy_tickets');
      if (savedTcks) {
        try {
          setTickets(JSON.parse(savedTcks));
        } catch (e) {}
      }
      const savedUsers = localStorage.getItem('lubpy_users');
      if (savedUsers) {
        try {
          setUsers(JSON.parse(savedUsers));
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleReload);
    window.addEventListener('lubpy_new_project' as any, handleReload);
    window.addEventListener('lubpy_users_updated' as any, handleReload);
    return () => {
      window.removeEventListener('storage', handleReload);
      window.removeEventListener('lubpy_new_project' as any, handleReload);
      window.removeEventListener('lubpy_users_updated' as any, handleReload);
    };
  }, []);

  // UI Navigation states
  const [activeTab, setActiveTab] = useState<'projects' | 'tickets' | 'users' | 'revenue'>('projects');
  const [selectedProject, setSelectedProject] = useState<ProjectRequest | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [viewMode, setViewModeState] = useState<'fintrixity' | 'admin' | 'tech' | 'tech-staff' | 'cs' | 'cs-staff' | 'hr' | 'hr-staff' | 'accounting' | 'accounting-staff' | 'client' | 'system'>('fintrixity');

  const setViewMode = (newMode: typeof viewMode) => {
    const authResult = checkRoleAuthority(user, newMode);
    if (!authResult.allowed) {
      alert(authResult.errorMessage || "Tài khoản của bạn không thuộc thẩm quyền truy cập vào nghiệp vụ này. Vui lòng đăng nhập đúng tài khoản nghiệp vụ!");
      return;
    }
    setViewModeState(newMode);
  };

  useEffect(() => {
    if (viewMode !== 'fintrixity') {
      const authResult = checkRoleAuthority(user, viewMode);
      if (!authResult.allowed) {
        alert(authResult.errorMessage || "Tài khoản của bạn không thuộc thẩm quyền truy cập vào nghiệp vụ này. Vui lòng đăng nhập đúng tài khoản nghiệp vụ!");
        setViewModeState('fintrixity');
      }
    }
  }, [user, viewMode]);

  // Form states for inputs
  const [feedbackText, setFeedbackText] = useState('');
  const [reportText, setReportText] = useState('');
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  
  // CS/Admin editing/assigning states
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedCS, setSelectedCS] = useState('');
  const [newStatus, setNewStatus] = useState<ProjectRequest['status']>('pending');
  const [newProgress, setNewProgress] = useState(0);

  // File drag-and-drop state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Camera Avatar Modal state
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Translations
  const t = {
    vi: {
      sectionTitle: 'Hệ Thống Quản Lý Dự Án LUBPY',
      roleSubtitle: 'Cổng thông tin phân quyền & cộng tác dự án trực tiếp',
      tabs: {
        projects: 'Hồ sơ dự án',
        tickets: 'Hỗ trợ 24/7',
        users: 'Quản lý tài khoản',
        revenue: 'Báo cáo doanh thu'
      },
      headers: {
        projectId: 'Mã Dự Án',
        clientName: 'Khách Hàng',
        projectType: 'Phân Loại',
        progress: 'Tiến Độ',
        status: 'Trạng Thái',
        assignedTo: 'Phân Nhiệm',
        action: 'Hành Động'
      },
      statusList: {
        pending: 'Chờ tiếp nhận',
        consulting: 'Đang tư vấn',
        approved: 'Đã đặt cọc',
        coding: 'Đang lập trình',
        review: 'Nghiệm thu (Demo)',
        delivered: 'Bàn giao trọn gói'
      },
      clientDashboard: {
        title: 'Bảng Điều Khiển Khách Hàng',
        welcome: 'Chào mừng bạn đến với Không gian cộng tác LUBPY!',
        noProject: 'Bạn chưa có dự án nào đang chạy trong tài khoản này.',
        startBtn: 'Gửi yêu cầu dự án ngay',
        details: 'Chi tiết tiến độ dự án',
        techSupport: 'Hỗ trợ kỹ thuật & Đánh giá',
        feedbackPlaceholder: 'Nhập ý kiến đánh giá hoặc thắc mắc của bạn về sản phẩm...',
        sendFeedback: 'Gửi đánh giá',
        demoCode: 'Xem mã nguồn & Tài liệu bàn giao',
        demoCodeNote: 'Tải các tài liệu, hướng dẫn, slide thuyết trình và mã nguồn của bạn bên dưới:',
        downloadBtn: 'Tải xuống',
        createTicket: 'Gửi ticket thắc mắc mới',
        ticketSubject: 'Chủ đề thắc mắc',
        ticketMsg: 'Nội dung chi tiết câu hỏi',
        ticketBtn: 'Gửi Ticket'
      },
      techDashboard: {
        title: 'Không Gian Lập Trình Viên',
        welcome: 'Hệ thống cập nhật tiến độ lập trình & đóng gói bàn giao',
        uploadTitle: 'Kéo & Thả hoặc Click để tải lên Source Code / Báo cáo (.zip, .pdf, .docx)',
        uploadSuccess: 'Tải lên thành công!',
        writeReport: 'Viết báo cáo tiến độ trực tiếp cho Admin & Khách hàng',
        reportPlaceholder: 'Mô tả chi tiết các tính năng vừa code xong hoặc kế hoạch tiếp theo...',
        reportBtn: 'Đăng báo cáo',
        updateStatus: 'Cập nhật nhanh Milestone dự án',
        percent: 'Phần trăm hoàn thành'
      },
      csDashboard: {
        title: 'Bàn Làm Việc Tư Vấn & CSKH',
        welcome: 'Tiếp nhận yêu cầu, cập nhật báo giá và phản hồi thắc mắc của người học',
        allRequests: 'Tất cả yêu cầu dự án từ khách hàng',
        changeStatus: 'Đổi trạng thái tư vấn',
        ticketsTitle: 'Danh sách các ticket thắc mắc cần giải đáp'
      },
      adminDashboard: {
        title: 'Hệ Thống Tổng Quản Trị (Admin)',
        welcome: 'Toàn quyền kiểm soát hệ thống, phê duyệt tài khoản và quản trị doanh thu',
        stats: {
          totalUsers: 'Tổng thành viên',
          activeProjects: 'Dự án đang làm',
          pendingRequests: 'Yêu cầu mới',
          revenue: 'Doanh thu LUBPY'
        },
        assignTitle: 'Phân công nhân sự phụ trách',
        assignTech: 'Chọn Dev kỹ thuật',
        assignCS: 'Chọn CS tư vấn',
        assignBtn: 'Cập nhật phân công',
        userManagement: 'Quản lý thành viên & Phân quyền trực quan',
        changeRole: 'Thay đổi vai trò',
        chartTitle: 'Phân tích tài chính & Khối lượng công việc (Tháng này)'
      },
      common: {
        logout: 'Đăng xuất',
        roleBadge: 'Vai trò',
        chatPlaceholder: 'Nhập nội dung phản hồi của bạn...',
        send: 'Gửi tin nhắn',
        emptyTickets: 'Chưa có ticket hỗ trợ nào.',
        status: 'Trạng thái',
        successAlert: 'Cập nhật dữ liệu thành công!',
        deleteBtn: 'Xóa'
      }
    },
    en: {
      sectionTitle: 'LUBPY Project Management System',
      roleSubtitle: 'Role-based authorization workspace & direct collaboration hub',
      tabs: {
        projects: 'Project Records',
        tickets: '24/7 Support',
        users: 'User Roles',
        revenue: 'Revenue Report'
      },
      headers: {
        projectId: 'Project ID',
        clientName: 'Client Name',
        projectType: 'Classification',
        progress: 'Progress',
        status: 'Status',
        assignedTo: 'Assignments',
        action: 'Actions'
      },
      statusList: {
        pending: 'Pending Intake',
        consulting: 'Consulting',
        approved: 'Deposit Paid',
        coding: 'Development',
        review: 'UAT / Demo',
        delivered: 'Fully Delivered'
      },
      clientDashboard: {
        title: 'Client Dashboard Workspace',
        welcome: 'Welcome to your collaborative LUBPY Workspace!',
        noProject: 'You do not have any active project requests on this account yet.',
        startBtn: 'Submit Project Request Now',
        details: 'Project Progress Details',
        techSupport: 'Tech Support & Feedback',
        feedbackPlaceholder: 'Type your suggestions, change requests, or questions here...',
        sendFeedback: 'Submit Review',
        demoCode: 'Browse Code & Deliverables',
        demoCodeNote: 'Download files, slide decks, diagrams, and code snippets below:',
        downloadBtn: 'Download',
        createTicket: 'Create Support Ticket',
        ticketSubject: 'Subject',
        ticketMsg: 'Detailed Question',
        ticketBtn: 'Submit Ticket'
      },
      techDashboard: {
        title: 'Developer Workspace',
        welcome: 'Log active commits, progress milestones, and drop source code deliverables',
        uploadTitle: 'Drag & Drop or Click to upload deliverables (.zip, .pdf, .docx)',
        uploadSuccess: 'Upload successful!',
        writeReport: 'Post development progress report to Admin & Client',
        reportPlaceholder: 'Describe completed tasks, active feature lists, or blocking issues...',
        reportBtn: 'Publish Report',
        updateStatus: 'Modify Project Milestones',
        percent: 'Completion Percentage'
      },
      csDashboard: {
        title: 'Customer Support Portal',
        welcome: 'Acknowledge intakes, negotiate pricing, and support client queries',
        allRequests: 'All Client Project Intakes',
        changeStatus: 'Update Consulting State',
        ticketsTitle: 'Active client query tickets'
      },
      adminDashboard: {
        title: 'Super Admin Console',
        welcome: 'Full operational access. Approve accounts, distribute tasks, and track financial charts',
        stats: {
          totalUsers: 'Total Members',
          activeProjects: 'Active Projects',
          pendingRequests: 'New Inquiries',
          revenue: 'Total Revenue'
        },
        assignTitle: 'Delegate Team Members',
        assignTech: 'Assign Lead Developer',
        assignCS: 'Assign Account Specialist',
        assignBtn: 'Update Assignments',
        userManagement: 'Registered Members & Role Assignment',
        changeRole: 'Change Role',
        chartTitle: 'Financial Insights & Project Volume'
      },
      common: {
        logout: 'Log Out',
        roleBadge: 'Role',
        chatPlaceholder: 'Type message...',
        send: 'Send',
        emptyTickets: 'No active tickets.',
        status: 'Status',
        successAlert: 'Data updated successfully!',
        deleteBtn: 'Delete'
      }
    }
  }[language];

  // Auto-select first item when a role loads to avoid empty panel clicks
  useEffect(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    if (user.role === 'client' && userEmail) {
      const myPrj = projects.find(p => p && p.email && p.email.toLowerCase().trim() === userEmail);
      if (myPrj) setSelectedProject(myPrj);
      
      const myTck = tickets.find(t => t && t.clientEmail && t.clientEmail.toLowerCase().trim() === userEmail);
      if (myTck) setSelectedTicket(myTck);
    } else {
      if (projects.length > 0) setSelectedProject(projects[0]);
      if (tickets.length > 0) setSelectedTicket(tickets[0]);
    }
  }, [user, projects, tickets]);

  const showToast = (msg: string) => {
    alert(msg); // Elegant default fallback browser alert styled clearly as a notification
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArr = Array.from(e.dataTransfer.files).map((f: any) => f.name);
      setUploadedFiles(prev => [...prev, ...filesArr]);
      
      if (selectedProject) {
        const newDoc = {
          name: e.dataTransfer.files[0].name,
          url: '#',
          uploadedAt: new Date().toISOString().split('T')[0]
        };
        const updatedProjects = projects.map(p => {
          if (p.id === selectedProject.id) {
            return {
              ...p,
              documents: [...(p.documents || []), newDoc]
            };
          }
          return p;
        });
        setProjects(updatedProjects);
        showToast(t.techDashboard.uploadSuccess);
      }
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesArr = Array.from(e.target.files).map((f: any) => f.name);
      setUploadedFiles(prev => [...prev, ...filesArr]);

      if (selectedProject) {
        const newDoc = {
          name: e.target.files[0].name,
          url: '#',
          uploadedAt: new Date().toISOString().split('T')[0]
        };
        const updatedProjects = projects.map(p => {
          if (p.id === selectedProject.id) {
            return {
              ...p,
              documents: [...(p.documents || []), newDoc]
            };
          }
          return p;
        });
        setProjects(updatedProjects);
        showToast(t.techDashboard.uploadSuccess);
      }
    }
  };

  // Core Actions
  const handleClientFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || !selectedProject) return;

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, feedback: feedbackText };
      }
      return p;
    });
    setProjects(updatedProjects);
    setFeedbackText('');
    showToast(t.common.successAlert);
  };

  const handleTechReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim() || !selectedProject) return;

    const newReport = {
      author: `Technical Team (${user.name})`,
      content: reportText,
      timestamp: new Date().toLocaleString()
    };

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          reports: [newReport, ...(p.reports || [])]
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    setReportText('');
    showToast(t.common.successAlert);
  };

  const handleTechUpdateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, status: newStatus, progress: newProgress };
      }
      return p;
    });
    setProjects(updatedProjects);
    showToast(t.common.successAlert);
  };

  const handleCSUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, status: newStatus };
      }
      return p;
    });
    setProjects(updatedProjects);
    showToast(t.common.successAlert);
  };

  const handleAdminAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          assignedTech: selectedTech || p.assignedTech,
          assignedCS: selectedCS || p.assignedCS
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    showToast(t.common.successAlert);
  };

  const handleUserRoleChange = (email: string, role: UserRole) => {
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim();
    const updatedUsers = users.map(u => {
      if (u && u.email && u.email.toLowerCase().trim() === cleanEmail) {
        return { ...u, role };
      }
      return u;
    });
    setUsers(updatedUsers);
    showToast(t.common.successAlert);
  };

  const handleDeleteUserAccount = (targetUidOrUser: string | User, targetEmailInput?: string) => {
    const targetEmail = typeof targetUidOrUser === 'object' ? targetUidOrUser?.email : (targetEmailInput || '');
    const targetUid = typeof targetUidOrUser === 'object' ? targetUidOrUser?.uid : targetUidOrUser;

    if (!targetEmail) return;
    const cleanTargetEmail = targetEmail.toLowerCase().trim();
    const currentUserEmail = (user?.email || '').toLowerCase().trim();

    if (currentUserEmail && cleanTargetEmail === currentUserEmail) {
      alert('⚠️ Không thể xóa tài khoản Admin đang đăng nhập hiện tại!');
      return;
    }

    const updatedUsers = users.filter(u => u && u.uid !== targetUid && (!u.email || u.email.toLowerCase().trim() !== cleanTargetEmail));
    setUsers(updatedUsers);
    localStorage.setItem('lubpy_users', JSON.stringify(updatedUsers));

    // Clean up from saved accounts storage
    try {
      const savedAccs = getSavedAccounts().filter(a => a && a.email && a.email.toLowerCase().trim() !== cleanTargetEmail);
      localStorage.setItem('lubpy_saved_accounts_v2', JSON.stringify(savedAccs));
    } catch (e) {}

    // Clean up from organization store if present
    try {
      const org = getStoredOrganization();
      let headsChanged = false;
      const newHeads = { ...org.heads };
      Object.keys(newHeads).forEach(deptKey => {
        if (newHeads[deptKey]?.email?.toLowerCase().trim() === cleanTargetEmail) {
          delete newHeads[deptKey];
          headsChanged = true;
        }
      });
      const newMembers = (org.members || []).filter(m => m && m.email && m.email.toLowerCase().trim() !== cleanTargetEmail);
      if (headsChanged || newMembers.length !== (org.members || []).length) {
        saveOrganization(newHeads, newMembers);
      }
    } catch (e) {}

    showToast(`🗑️ Đã xóa vĩnh viễn tài khoản (${targetEmail}) thành công!`);
    setUserToDelete(null);
    window.dispatchEvent(new Event('lubpy_users_updated'));
  };

  const handlePhotoCaptured = (photoDataUrl: string) => {
    const updatedUser: User = {
      ...user,
      photoUrl: photoDataUrl
    };

    // 1. Trigger parent onUpdateUser callback
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    // 2. Update local users state array and storage
    const userEmail = (user?.email || '').toLowerCase().trim();
    const updatedUsers = users.map(u => {
      if (u && u.email && u.email.toLowerCase().trim() === userEmail) {
        return { ...u, photoUrl: photoDataUrl };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('lubpy_users', JSON.stringify(updatedUsers));

    // 3. Persist session
    saveUserSession(updatedUser);

    // 4. Update saved quick-switch accounts
    try {
      saveAccountToStorage({
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isDepartmentHead: updatedUser.isDepartmentHead,
        department: updatedUser.department,
        departmentTitle: updatedUser.departmentTitle,
        photoUrl: photoDataUrl,
        password: updatedUser.password
      });
    } catch (e) {}

    window.dispatchEvent(new Event('lubpy_users_updated'));
    showToast(language === 'vi' ? '📸 Đã cập nhật ảnh đại diện từ Camera thành công!' : '📸 Profile avatar updated successfully from camera!');
  };

  const handleClientCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;

    const newTck: SupportTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      clientName: user.name,
      clientEmail: user.email,
      subject: newTicketSubject,
      status: 'open',
      messages: [
        { sender: 'Client', content: newTicketMessage, timestamp: new Date().toLocaleString() }
      ]
    };

    const updatedTickets = [newTck, ...tickets];
    setTickets(updatedTickets);
    setNewTicketSubject('');
    setNewTicketMessage('');
    setSelectedTicket(newTck);
    showToast(t.common.successAlert);
  };

  const handleTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReplyText.trim() || !selectedTicket) return;

    const updatedTickets = tickets.map(tck => {
      if (tck.id === selectedTicket.id) {
        return {
          ...tck,
          messages: [
            ...tck.messages,
            {
              sender: user.role === 'client' ? 'Client' : 'CS',
              content: ticketReplyText,
              timestamp: new Date().toLocaleString()
            }
          ]
        };
      }
      return tck;
    });
    setTickets(updatedTickets);
    
    // Instantly reflect message update in details panel
    const tckFound = updatedTickets.find(t => t.id === selectedTicket.id);
    if (tckFound) setSelectedTicket(tckFound);

    setTicketReplyText('');
  };

  // Filter project lists by role access
  const visibleProjects = projects.filter(p => {
    if (user.role === 'client') {
      const userEmail = (user?.email || '').toLowerCase().trim();
      return p && p.email && p.email.toLowerCase().trim() === userEmail;
    }
    // Tech leads only see projects assigned to them (or all if none assigned yet for testing)
    if (user.role === 'tech') {
      const isAssigned = p.assignedTech && p.assignedTech.includes(user.name);
      return isAssigned || !p.assignedTech; // show if assigned to them, or not assigned to anyone yet so they can inspect
    }
    // CS & Admin see all projects
    return true;
  });

  const visibleTickets = tickets.filter(t => {
    if (user.role === 'client') {
      const userEmail = (user?.email || '').toLowerCase().trim();
      return t && t.clientEmail && t.clientEmail.toLowerCase().trim() === userEmail;
    }
    return true;
  });

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'client': return language === 'vi' ? 'Khách Hàng' : 'Client';
      case 'tech': return language === 'vi' ? 'Kỹ Thuật' : 'Developer';
      case 'cs': return language === 'vi' ? 'Hỗ Trợ CS' : 'Support';
      case 'admin': return language === 'vi' ? 'Quản Trị Viên' : 'Super Admin';
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'client': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'tech': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'cs': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'admin': return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
    }
  };

  // Render SVG charts
  const renderRevenueChart = () => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug (Forecast)'];
    const values = [4200, 5800, 7100, 9300, 12500, 15000];
    const maxVal = 16000;

    return (
      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-6 space-y-6" id="revenue-chart-panel">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#38bdf8]" />
              <span>{t.adminDashboard.chartTitle}</span>
            </h4>
            <p className="text-xs text-gray-400 font-light">Doanh số tăng trưởng đều qua các quý của LUBPY STUDIO</p>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gradient-to-t from-sky-600 to-sky-400" />
              <span className="text-gray-300">Revenue (USD)</span>
            </div>
          </div>
        </div>

        {/* Handcrafted Animated Responsive SVG Chart */}
        <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 pt-4 border-b border-white/10 px-2" id="chart-stage">
          {months.map((m, idx) => {
            const hPercent = (values[idx] / maxVal) * 100;
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                {/* Tooltip value */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950 border border-white/10 text-[10px] font-mono px-2 py-1 rounded text-white mb-1 shadow-xl">
                  ${values[idx].toLocaleString()}
                </div>
                {/* Bar */}
                <div 
                  style={{ height: `${hPercent}%` }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-sky-600/60 to-[#38bdf8] border-t border-sky-400/40 hover:scale-x-105 hover:from-sky-500 hover:to-sky-300 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.15)] flex items-end justify-center pb-2"
                >
                  <span className="text-[9px] font-black tracking-tighter text-white rotate-270 hidden sm:block">
                    ${((values[idx] ?? 0) / 1000).toFixed(1)}k
                  </span>
                </div>
                {/* X Axis label */}
                <span className="text-[10px] font-bold font-mono text-gray-400 group-hover:text-white transition-colors">
                  {m}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Handle role-based or explicit view mode rendering with fluid entrance animations
  const renderActiveView = () => {
    if (viewMode === 'tech-staff' || (viewMode === 'fintrixity' && user.role === 'tech' && user.isDepartmentHead === false)) {
      return (
        <motion.div
          key="view-tech-staff"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <TechStaffDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onSwitchToManagerView={() => setViewMode('tech')}
            onSwitchToSystemManager={() => setViewMode('system')}
            onUpdateUser={onUpdateUser}
          />
        </motion.div>
      );
    }

    if (viewMode === 'tech' || (viewMode === 'fintrixity' && user.role === 'tech')) {
      return (
        <motion.div
          key="view-tech-lead"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <TechDeveloperDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onSwitchToSystemManager={() => setViewMode('system')}
            onUpdateUser={onUpdateUser}
          />
        </motion.div>
      );
    }

    if (viewMode === 'cs-staff' || (viewMode === 'fintrixity' && user.role === 'cs' && user.isDepartmentHead === false)) {
      return (
        <motion.div
          key="view-cs-staff"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <CSTeamStaffDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onSwitchToManagerView={() => setViewMode('cs')}
            onSwitchToSystemManager={() => setViewMode('system')}
            onUpdateUser={onUpdateUser}
          />
        </motion.div>
      );
    }

    if (viewMode === 'cs' || (viewMode === 'fintrixity' && user.role === 'cs')) {
      return (
        <motion.div
          key="view-cs-lead"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <CustomerSupportDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onSwitchToSystemManager={() => setViewMode('system')}
            onUpdateUser={onUpdateUser}
          />
        </motion.div>
      );
    }

    if (viewMode === 'client' || (viewMode === 'fintrixity' && user.role === 'client')) {
      return (
        <motion.div
          key="view-client"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <ClientPlayerDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onOpenRequestModal={onOpenRequestModal}
            onSwitchToSystemManager={() => setViewMode('system')}
            onTakePhoto={() => setShowCameraModal(true)}
          />
        </motion.div>
      );
    }

    if (viewMode === 'hr-staff' || (viewMode === 'fintrixity' && user.role === 'hr' && user.isDepartmentHead === false)) {
      return (
        <motion.div
          key="view-hr-staff"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <HRStaffDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onSwitchToManagerView={() => setViewMode('hr')}
            onSwitchToSystemManager={() => setViewMode('system')}
            onUpdateUser={onUpdateUser}
          />
        </motion.div>
      );
    }

    if (viewMode === 'hr' || (viewMode === 'fintrixity' && user.role === 'hr')) {
      return (
        <motion.div
          key="view-hr-lead"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <HRDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onSwitchToSystemManager={() => setViewMode('system')}
            onUpdateUser={onUpdateUser}
          />
        </motion.div>
      );
    }

    if (viewMode === 'accounting-staff' || (viewMode === 'fintrixity' && user.role === 'accounting' && user.isDepartmentHead === false)) {
      return (
        <motion.div
          key="view-accounting-staff"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <AccountingStaffDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onSwitchToManagerView={() => setViewMode('accounting')}
            onSwitchToSystemManager={() => setViewMode('system')}
            onUpdateUser={onUpdateUser}
          />
        </motion.div>
      );
    }

    if (viewMode === 'accounting' || (viewMode === 'fintrixity' && user.role === 'accounting')) {
      return (
        <motion.div
          key="view-accounting-lead"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <AccountingDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onSwitchToSystemManager={() => setViewMode('system')}
            onUpdateUser={onUpdateUser}
          />
        </motion.div>
      );
    }

    if (viewMode === 'admin' || (viewMode === 'fintrixity' && user.role === 'admin')) {
      return (
        <motion.div
          key="view-admin"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <AdminFintrixityDashboard 
            user={user}
            onLogout={onLogout}
            language={language}
            onSwitchToSystemManager={() => setViewMode('system')}
            onUpdateUser={onUpdateUser}
          />
        </motion.div>
      );
    }

    return (
      <motion.div
        key="view-system"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="workspace-layout">
      {/* Upper Profile Welcome Banner Header */}
      <header 
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md mb-10" 
        id="profile-banner"
      >
        <div className="flex items-center gap-4 sm:gap-5" id="user-info-group">
          <div className="relative group shrink-0">
            <img 
              src={user.photoUrl} 
              alt={user.name} 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#38bdf8]/40 shadow-lg object-cover bg-slate-950 transition-all group-hover:border-[#38bdf8]"
              referrerPolicy="no-referrer"
              id="user-profile-avatar"
            />
            <button
              type="button"
              onClick={() => setShowCameraModal(true)}
              className="absolute -bottom-1 -right-1 p-1.5 sm:p-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-full shadow-lg border-2 border-slate-900 transition-all active:scale-90 cursor-pointer group-hover:scale-110"
              title={language === 'vi' ? 'Chụp ảnh đại diện bằng Camera' : 'Take photo with camera'}
              id="avatar-camera-overlay-btn"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-white">{user.name}</h3>
              <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${getRoleBadgeStyle(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-light flex items-center gap-1.5">
              <span className="font-mono">{user.email}</span>
              <span className="text-gray-600">|</span>
              <span>{language === 'vi' ? 'Đã kết nối Google' : 'Google Connected'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto" id="profile-actions-group">
          {/* Workspace Notification Bell with Dropdown of Updates/Messages from backend */}
          <WorkspaceNotificationBell
            user={user}
            language={language}
            onSelectProject={(projectId) => {
              setActiveTab('projects');
            }}
            onSelectTicket={(ticketId) => {
              setActiveTab('tickets');
            }}
          />

          <button 
            type="button"
            onClick={() => setShowCameraModal(true)}
            className="flex-1 md:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 bg-sky-500/15 hover:bg-sky-500/25 text-[#38bdf8] border border-sky-500/30 hover:border-sky-500/60 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            id="profile-camera-btn"
          >
            <Camera className="w-4 h-4 text-[#38bdf8]" />
            <span>{language === 'vi' ? 'Chụp Ảnh Camera' : 'Take Camera Photo'}</span>
          </button>

          <button 
            onClick={onLogout}
            className="flex-1 md:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
            id="logout-btn"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>{t.common.logout}</span>
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="space-y-6" id="dashboard-main-grid">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
            {t.sectionTitle}
          </h2>
          <p className="text-sm text-gray-400 font-light">{t.roleSubtitle}</p>
        </div>

        {/* INTERNAL ROLES TABS SWITCHER (ADMIN, TECH, CS, HR, ACCOUNTING) */}
        {user.role !== 'client' && (
          <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4" id="role-nav-tabs">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'projects' 
                  ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              id="tab-projects-btn"
            >
              <FolderKanban className="w-4 h-4" />
              <span>{t.tabs.projects}</span>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'tickets' 
                  ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              id="tab-tickets-btn"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.tabs.tickets}</span>
            </button>
            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'users' 
                      ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  id="tab-users-btn"
                >
                  <Users className="w-4 h-4" />
                  <span>{t.tabs.users}</span>
                </button>
                <button
                  onClick={() => setActiveTab('revenue')}
                  className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'revenue' 
                      ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  id="tab-revenue-btn"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{t.tabs.revenue}</span>
                </button>
                <button
                  onClick={() => setViewMode('admin')}
                  className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white shadow-md hover:from-sky-500 hover:to-indigo-500 active:scale-95 sm:ml-auto"
                  id="tab-fintrixity-btn"
                >
                  <span>🚀 LUBPY ADMIN Overview</span>
                </button>
              </>
            )}
            {user.role === 'tech' && (
              <button
                onClick={() => setViewMode(user.isDepartmentHead === false ? 'tech-staff' : 'tech')}
                className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 active:scale-95 sm:ml-auto"
                id="tab-tech-overview-btn"
              >
                <span>🚀 Quay Lại Portal Kỹ Thuật (Overview)</span>
              </button>
            )}
            {user.role === 'cs' && (
              <button
                onClick={() => setViewMode(user.isDepartmentHead === false ? 'cs-staff' : 'cs')}
                className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md hover:from-amber-500 hover:to-orange-500 active:scale-95 sm:ml-auto"
                id="tab-cs-overview-btn"
              >
                <span>🚀 Quay Lại Portal CSKH (Overview)</span>
              </button>
            )}
            {user.role === 'hr' && (
              <button
                onClick={() => setViewMode(user.isDepartmentHead === false ? 'hr-staff' : 'hr')}
                className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-500 hover:to-indigo-500 active:scale-95 sm:ml-auto"
                id="tab-hr-overview-btn"
              >
                <span>🚀 Quay Lại Portal HR (Overview)</span>
              </button>
            )}
            {user.role === 'accounting' && (
              <button
                onClick={() => setViewMode(user.isDepartmentHead === false ? 'accounting-staff' : 'accounting')}
                className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md hover:from-blue-500 hover:to-cyan-500 active:scale-95 sm:ml-auto"
                id="tab-acc-overview-btn"
              >
                <span>🚀 Quay Lại Portal Kế Toán (Overview)</span>
              </button>
            )}
          </div>
        )}

        {/* CLIENT TABS SWITCHER */}
        {user.role === 'client' && (
          <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4" id="client-nav-tabs">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'projects' 
                  ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>{t.tabs.projects}</span>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'tickets' 
                  ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.tabs.tickets}</span>
            </button>
          </div>
        )}

        {/* --- TABS WITH FLUID ENTRANCE ANIMATIONS --- */}
        <AnimatePresence mode="wait">
          {activeTab === 'projects' && (
            <motion.div
              key="projects-tab"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              id="projects-tab-content"
            >
            
            {/* Project List Sidebar */}
            <div className="lg:col-span-5 space-y-4" id="project-sidebar">
              <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 sm:p-5" id="projects-selector-box">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                    {user.role === 'client' ? t.clientDashboard.details : t.csDashboard.allRequests} ({visibleProjects.length})
                  </h4>
                  {user.role === 'client' && (
                    <button 
                      onClick={onOpenRequestModal}
                      className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-sky-400 text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded-lg active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{t.clientDashboard.startBtn}</span>
                    </button>
                  )}
                </div>

                {visibleProjects.length === 0 ? (
                  <div className="text-center py-10 space-y-3" id="no-projects-view">
                    <AlertCircle className="w-10 h-10 text-gray-600 mx-auto" />
                    <p className="text-xs text-gray-500 leading-relaxed font-light">{t.clientDashboard.noProject}</p>
                    {user.role === 'client' && (
                      <button 
                        onClick={onOpenRequestModal}
                        className="mx-auto px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-400 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all cursor-pointer"
                      >
                        {t.clientDashboard.startBtn}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3" id="project-items-list">
                    {visibleProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProject(p);
                          setSelectedTech(p.assignedTech || '');
                          setSelectedCS(p.assignedCS || '');
                          setNewStatus(p.status);
                          setNewProgress(p.progress);
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                          selectedProject?.id === p.id 
                            ? 'bg-slate-800/80 border-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.1)]' 
                            : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-800/10'
                        }`}
                        id={`project-item-${p.id}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-mono font-black text-[#38bdf8] bg-[#38bdf8]/5 px-2 py-0.5 rounded border border-[#38bdf8]/10">
                            {p.id}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            {p.createdAt}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-white mt-2 truncate">{p.projectType}</h5>
                        {p.thumbnailUrl && (
                          <div className="w-full h-24 rounded-lg overflow-hidden my-2 bg-slate-950 border border-white/10 relative">
                            <img 
                              src={p.thumbnailUrl} 
                              alt={p.projectType || p.description}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                          </div>
                        )}
                        <p className="text-xs text-gray-400 line-clamp-1 mt-1 font-light leading-relaxed">{p.description}</p>
                        
                        {/* Progress and status */}
                        <div className="mt-3 flex items-center justify-between gap-4 text-[10px] font-bold">
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Clock className="w-3 h-3 text-sky-400" />
                            <span>{t.statusList[p.status]}</span>
                          </div>
                          <span className="text-sky-400 font-mono">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-sky-600 to-sky-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Project Detailed Information Panel */}
            <div className="lg:col-span-7" id="project-detail-panel">
              <AnimatePresence mode="wait">
                {selectedProject ? (
                  <motion.div 
                    key={selectedProject.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-slate-900/60 border border-white/10 rounded-xl p-5 sm:p-6 space-y-6" 
                    id="project-detail-card"
                  >
                  
                  {/* Title Bar */}
                  <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                          {selectedProject.id}
                        </span>
                        <span className="text-xs text-gray-400">{selectedProject.createdAt}</span>
                      </div>
                      <h4 className="text-lg font-black text-white">{selectedProject.projectType}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#38bdf8] block">{selectedProject.progress}% Bàn giao</span>
                      <span className="text-[10px] text-gray-400 font-mono">Deadline: {selectedProject.deadline}</span>
                    </div>
                  </div>

                  {/* Project Thumbnail Visual */}
                  {selectedProject.thumbnailUrl && (
                    <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-white/10 bg-slate-950 group">
                      <img 
                        src={selectedProject.thumbnailUrl} 
                        alt={selectedProject.projectType}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-mono font-bold backdrop-blur-md">
                          🎨 AI Generated Project Thumbnail
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Desc */}
                  <div className="space-y-2">
                    <h5 className="text-xs uppercase font-black tracking-wider text-gray-300">Nội dung yêu cầu chi tiết</h5>
                    <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
                      <p>{selectedProject.description}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {selectedProject.techStack.map(tk => (
                          <span key={tk} className="text-[10px] font-mono font-bold bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded">
                            {tk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Assignments view */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/20 border border-white/5 rounded-xl p-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-gray-500 block">Kỹ thuật viên phụ trách (Lead Dev):</span>
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{selectedProject.assignedTech || 'Hệ thống tự động phân phối'}</span>
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 block">Chuyên viên hỗ trợ trực tiếp (CS):</span>
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                        <span>{selectedProject.assignedCS || 'Hệ thống tự động phân phối'}</span>
                      </span>
                    </div>
                  </div>

                  {/* PROGRESS REPORTS LOG FEED */}
                  <div className="space-y-3">
                    <h5 className="text-xs uppercase font-black tracking-wider text-gray-300">Báo cáo cập nhật tiến độ từ Kỹ Thuật</h5>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1" id="project-reports-log">
                      {!selectedProject.reports || selectedProject.reports.length === 0 ? (
                        <p className="text-xs text-gray-500 font-light italic">Chưa có nhật ký cập nhật tiến độ lập trình.</p>
                      ) : (
                        selectedProject.reports.map((rpt, rIdx) => (
                          <div key={rIdx} className="bg-slate-950/40 border-l-2 border-sky-400 p-3 rounded-r-xl space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-[#38bdf8]">{rpt.author}</span>
                              <span className="text-gray-500 font-mono">{rpt.timestamp}</span>
                            </div>
                            <p className="text-xs text-gray-300 font-light leading-relaxed">{rpt.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* USER ROLE CUSTOM FUNCTIONALITIES */}

                  {/* Client Role Option: Submit feedback / download source code */}
                  {user.role === 'client' && (
                    <div className="space-y-6 pt-4 border-t border-white/5" id="client-project-actions">
                      {/* Download Section if in review or delivered */}
                      <div className="space-y-3">
                        <h5 className="text-xs uppercase font-black tracking-wider text-gray-300 flex items-center gap-1.5">
                          <Code2 className="w-4 h-4 text-emerald-400" />
                          <span>{t.clientDashboard.demoCode}</span>
                        </h5>
                        <p className="text-xs text-gray-400 font-light">{t.clientDashboard.demoCodeNote}</p>
                        
                        <div className="space-y-2" id="client-deliverables-list">
                          {!selectedProject.documents || selectedProject.documents.length === 0 ? (
                            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3 text-center">
                              <p className="text-xs text-gray-500 font-light">Tài liệu, slides và mã nguồn bàn giao sẽ hiển thị ở đây khi lập trình viên cập nhật.</p>
                            </div>
                          ) : (
                            selectedProject.documents.map((doc, dIdx) => (
                              <div key={dIdx} className="flex justify-between items-center bg-slate-950/60 border border-white/5 p-3 rounded-xl hover:bg-slate-950 transition-colors" id={`deliverable-${dIdx}`}>
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-sky-400" />
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-white block truncate max-w-[200px] sm:max-w-[300px]">{doc.name}</span>
                                    <span className="text-[10px] text-gray-500 font-mono">Bàn giao: {doc.uploadedAt}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => showToast(`Simulating secure download for file: ${doc.name}`)}
                                  className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-[#38bdf8] border border-sky-500/20 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                                >
                                  {t.clientDashboard.downloadBtn}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Feedback Form */}
                      <form onSubmit={handleClientFeedback} className="space-y-3" id="client-feedback-form">
                        <h5 className="text-xs uppercase font-black tracking-wider text-gray-300">{t.clientDashboard.techSupport}</h5>
                        <textarea
                          rows={3}
                          placeholder={t.clientDashboard.feedbackPlaceholder}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#0082c3] hover:bg-[#0071a8] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-[#0082c3]/10"
                        >
                          {t.clientDashboard.sendFeedback}
                        </button>
                      </form>

                      {/* Previous feedback display */}
                      {selectedProject.feedback && (
                        <div className="bg-sky-950/30 border border-sky-500/20 p-3.5 rounded-xl space-y-1 text-xs">
                          <span className="font-bold text-sky-400 block">Ý kiến đánh giá đã gửi trước đó:</span>
                          <p className="text-gray-300 leading-relaxed font-light">{selectedProject.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tech Lead Role Option: Update milestones / reports / deliverables upload */}
                  {user.role === 'tech' && (
                    <div className="space-y-6 pt-4 border-t border-white/5" id="tech-project-actions">
                      
                      {/* Milestone rapid modifier */}
                      <form onSubmit={handleTechUpdateMilestone} className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-950/60 border border-white/5 p-4 rounded-xl" id="tech-update-milestone-form">
                        <div className="sm:col-span-12">
                          <h5 className="text-xs uppercase font-black tracking-wider text-[#38bdf8] mb-1">{t.techDashboard.updateStatus}</h5>
                        </div>
                        <div className="sm:col-span-5 space-y-1 text-xs">
                          <label className="text-gray-400">Milestone</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as ProjectRequest['status'])}
                            className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                          >
                            <option value="pending">{t.statusList.pending}</option>
                            <option value="consulting">{t.statusList.consulting}</option>
                            <option value="approved">{t.statusList.approved}</option>
                            <option value="coding">{t.statusList.coding}</option>
                            <option value="review">{t.statusList.review}</option>
                            <option value="delivered">{t.statusList.delivered}</option>
                          </select>
                        </div>
                        <div className="sm:col-span-4 space-y-1 text-xs">
                          <label className="text-gray-400">{t.techDashboard.percent} ({newProgress}%)</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={newProgress}
                            onChange={(e) => setNewProgress(Number(e.target.value))}
                            className="w-full h-8 bg-transparent accent-sky-400 cursor-pointer"
                          />
                        </div>
                        <div className="sm:col-span-3 flex items-end">
                          <button
                            type="submit"
                            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-sans font-black uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
                          >
                            Lưu thay đổi
                          </button>
                        </div>
                      </form>

                      {/* File Drag and Drop deliverables box */}
                      <div className="space-y-3">
                        <h5 className="text-xs uppercase font-black tracking-wider text-gray-300">Tải lên tài liệu hoặc mã nguồn (.zip, .pdf)</h5>
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                            dragActive 
                              ? 'border-[#38bdf8] bg-sky-950/20' 
                              : 'border-white/10 bg-slate-950/40 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="file"
                            id="manual-file-input"
                            multiple={false}
                            onChange={handleManualUpload}
                            className="hidden"
                          />
                          <label htmlFor="manual-file-input" className="cursor-pointer space-y-2 block">
                            <UploadCloud className="w-8 h-8 text-sky-400 mx-auto" />
                            <p className="text-xs text-gray-300 leading-relaxed font-light">{t.techDashboard.uploadTitle}</p>
                          </label>
                        </div>
                      </div>

                      {/* Progress reporting text area */}
                      <form onSubmit={handleTechReport} className="space-y-3" id="tech-report-form">
                        <h5 className="text-xs uppercase font-black tracking-wider text-gray-300">{t.techDashboard.writeReport}</h5>
                        <textarea
                          rows={3}
                          placeholder={t.techDashboard.reportPlaceholder}
                          value={reportText}
                          onChange={(e) => setReportText(e.target.value)}
                          className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#0082c3] hover:bg-[#0071a8] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-[#0082c3]/10"
                        >
                          {t.techDashboard.reportBtn}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* CS Support Role Options: Update consulting status */}
                  {user.role === 'cs' && (
                    <div className="space-y-4 pt-4 border-t border-white/5" id="cs-project-actions">
                      <form onSubmit={handleCSUpdateStatus} className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-950/60 border border-white/5 p-4 rounded-xl" id="cs-status-form">
                        <div className="sm:col-span-12">
                          <h5 className="text-xs uppercase font-black tracking-wider text-amber-400 mb-1">{t.csDashboard.changeStatus}</h5>
                        </div>
                        <div className="sm:col-span-8 space-y-1 text-xs">
                          <label className="text-gray-400">Trạng thái tư vấn & báo giá</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as ProjectRequest['status'])}
                            className="w-full bg-slate-900 border border-white/15 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                          >
                            <option value="pending">{t.statusList.pending}</option>
                            <option value="consulting">{t.statusList.consulting}</option>
                            <option value="approved">{t.statusList.approved}</option>
                            <option value="coding">{t.statusList.coding}</option>
                            <option value="review">{t.statusList.review}</option>
                            <option value="delivered">{t.statusList.delivered}</option>
                          </select>
                        </div>
                        <div className="sm:col-span-4 flex items-end">
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-sans font-black uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer"
                          >
                            Lưu thay đổi
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Admin Role Options: Staff Assignment Controls */}
                  {user.role === 'admin' && (
                    <div className="space-y-4 pt-4 border-t border-white/5 animate-fadeIn" id="admin-project-actions">
                      <form onSubmit={handleAdminAssign} className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-950/60 border border-white/5 p-4 rounded-xl" id="admin-assign-form">
                        <div className="sm:col-span-12">
                          <h5 className="text-xs uppercase font-black tracking-wider text-pink-400 mb-1">{t.adminDashboard.assignTitle}</h5>
                        </div>
                        <div className="sm:col-span-5 space-y-1 text-xs">
                          <label className="text-gray-400">{t.adminDashboard.assignTech}</label>
                          <select
                            value={selectedTech}
                            onChange={(e) => setSelectedTech(e.target.value)}
                            className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-white text-xs focus:outline-none"
                          >
                            <option value="">-- {t.adminDashboard.assignTech} --</option>
                            {users.filter(u => u.role === 'tech').map(u => (
                              <option key={u.uid} value={`${u.name} (Lead Dev)`}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-5 space-y-1 text-xs">
                          <label className="text-gray-400">{t.adminDashboard.assignCS}</label>
                          <select
                            value={selectedCS}
                            onChange={(e) => setSelectedCS(e.target.value)}
                            className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-white text-xs focus:outline-none"
                          >
                            <option value="">-- {t.adminDashboard.assignCS} --</option>
                            {users.filter(u => u.role === 'cs').map(u => (
                              <option key={u.uid} value={`${u.name} (CS Support)`}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2 flex items-end">
                          <button
                            type="submit"
                            className="w-full py-2 bg-gradient-to-r from-pink-600 to-pink-500 text-white font-sans font-black uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer"
                          >
                            {t.adminDashboard.assignBtn}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-selected-project"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-slate-900/60 border border-white/10 rounded-xl p-10 text-center flex flex-col items-center justify-center h-full min-h-[300px]" 
                    id="no-selected-project"
                  >
                    <FolderKanban className="w-12 h-12 text-gray-600 animate-pulse mb-3" />
                    <p className="text-xs text-gray-400">Vui lòng chọn 1 hồ sơ dự án từ danh mục bên trái để xem tiến độ chi tiết</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        )}

        {/* --- TAB 2: SUPPORT TICKETS 24/7 (ALL ROLES) --- */}
        {activeTab === 'tickets' && (
          <motion.div 
            key="tickets-tab"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8" 
            id="tickets-tab-content"
          >
            
            {/* Tickets selector column */}
            <div className="lg:col-span-5 space-y-4" id="ticket-sidebar">
              
              {/* Customer Client form to submit a new Ticket */}
              {user.role === 'client' && (
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 sm:p-5 space-y-4" id="create-ticket-box">
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">{t.clientDashboard.createTicket}</h4>
                  <form onSubmit={handleClientCreateTicket} className="space-y-3" id="create-ticket-form">
                    <div className="space-y-1 text-xs">
                      <label className="text-gray-400">{t.clientDashboard.ticketSubject}</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Lỗi font chữ ở mục báo cáo..."
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <label className="text-gray-400">{t.clientDashboard.ticketMsg}</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Nêu cụ thể yêu cầu của bạn để đội kỹ thuật giải quyết nhanh nhất..."
                        value={newTicketMessage}
                        onChange={(e) => setNewTicketMessage(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-[#005c8a] to-[#0082c3] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{t.clientDashboard.ticketBtn}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Tickets List */}
              <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 sm:p-5" id="tickets-list-box">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">
                  {user.role === 'client' ? 'Ticket của bạn' : t.csDashboard.ticketsTitle} ({visibleTickets.length})
                </h4>

                {visibleTickets.length === 0 ? (
                  <p className="text-xs text-gray-500 font-light italic text-center py-6">{t.common.emptyTickets}</p>
                ) : (
                  <div className="space-y-3" id="ticket-items-list">
                    {visibleTickets.map(tck => (
                      <button
                        key={tck.id}
                        onClick={() => setSelectedTicket(tck)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                          selectedTicket?.id === tck.id
                            ? 'bg-slate-800/80 border-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.1)]'
                            : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-800/10'
                        }`}
                        id={`ticket-item-${tck.id}`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-sky-400 font-mono">{tck.id}</span>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest text-[8px]">
                            {tck.status}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-white mt-2 truncate">{tck.subject}</h5>
                        <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-gray-400">
                          <span className="truncate max-w-[120px] font-mono">{tck.clientEmail}</span>
                          <span className="font-bold">{tck.messages.length} SMS</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Ticket Conversation Panel */}
            <div className="lg:col-span-7" id="ticket-detail-panel">
              <AnimatePresence mode="wait">
                {selectedTicket ? (
                  <motion.div 
                    key={selectedTicket.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-slate-900/60 border border-white/10 rounded-xl p-5 sm:p-6 flex flex-col h-[500px]" 
                    id="ticket-conversation-card"
                  >
                    
                    {/* Subject Header */}
                    <div className="border-b border-white/5 pb-3 mb-4 flex justify-between items-center gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                            {selectedTicket.id}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">{selectedTicket.clientEmail}</span>
                        </div>
                        <h4 className="text-base font-bold text-white truncate max-w-[250px] sm:max-w-[400px]">{selectedTicket.subject}</h4>
                      </div>
                      <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-black uppercase tracking-widest">
                        {selectedTicket.status}
                      </span>
                    </div>

                    {/* Message Bubble list */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 flex flex-col" id="ticket-chat-scroll">
                      {selectedTicket.messages.map((msg, mIdx) => {
                        const isMe = (user.role === 'client' && msg.sender === 'Client') || 
                                     (user.role !== 'client' && msg.sender === 'CS');

                        return (
                          <div 
                            key={mIdx} 
                            className={`flex flex-col max-w-[80%] ${
                              isMe ? 'self-end items-end' : 'self-start items-start'
                            }`}
                            id={`chat-bubble-${mIdx}`}
                          >
                            <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                              isMe 
                                ? 'bg-gradient-to-r from-sky-600 to-[#0082c3] text-white rounded-tr-none' 
                                : 'bg-slate-950 border border-white/5 text-slate-200 rounded-tl-none'
                            }`}>
                              <p>{msg.content}</p>
                            </div>
                            <span className="text-[9px] text-gray-500 mt-1.5 font-mono px-1">
                              {msg.sender === 'Client' ? selectedTicket.clientName : 'LUBPY Support'} ({msg.timestamp})
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply Input Box */}
                    <form onSubmit={handleTicketReply} className="flex gap-2 border-t border-white/5 pt-4" id="ticket-chat-input-form">
                      <input
                        type="text"
                        required
                        placeholder={t.common.chatPlaceholder}
                        value={ticketReplyText}
                        onChange={(e) => setTicketReplyText(e.target.value)}
                        className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                      <button
                        type="submit"
                        className="px-5 bg-gradient-to-r from-sky-600 to-sky-400 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                        id="ticket-reply-submit"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-selected-ticket"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-slate-900/60 border border-white/10 rounded-xl p-10 text-center flex flex-col items-center justify-center h-full min-h-[300px]" 
                    id="no-selected-ticket"
                  >
                    <MessageSquare className="w-12 h-12 text-gray-600 animate-pulse mb-3" />
                    <p className="text-xs text-gray-400">Vui lòng chọn 1 phiên Ticket hỗ trợ từ bên trái để trò chuyện giải đáp trực tiếp</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        )}

        {/* --- TAB 3: USER MANAGEMENT & ROLE CHANGER (ADMIN ONLY) --- */}
        {activeTab === 'users' && user.role === 'admin' && (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="bg-slate-900/60 border border-white/10 rounded-xl p-5 sm:p-6 space-y-6" 
            id="users-tab-content"
          >
            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">{t.adminDashboard.userManagement}</h4>
              <p className="text-xs text-gray-400 font-light">Thử thay đổi vai trò (Role) của một tài khoản để kiểm tra các giao diện Dashboard phân quyền khác nhau.</p>
            </div>

            <div className="overflow-x-auto" id="users-table-container">
              <table className="w-full text-left border-collapse text-xs sm:text-sm" id="users-rbac-table">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Hình ảnh</th>
                    <th className="py-3 px-4">Tên người dùng</th>
                    <th className="py-3 px-4">Email Google</th>
                    <th className="py-3 px-4">Vai trò hiện tại</th>
                    <th className="py-3 px-4 text-right">Điều khiển phân quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200" id="users-rbac-list">
                  {users.map((u, idx) => (
                    <tr key={`${u.uid || u.email}_${idx}`} className="hover:bg-white/5 transition-colors" id={`user-row-${u.uid}`}>
                      <td className="py-3 px-4">
                        <img 
                          src={u.photoUrl} 
                          alt={u.name} 
                          className="w-8 h-8 rounded-full border border-white/10 bg-slate-950"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                      <td className="py-3 px-4 font-mono text-gray-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border ${getRoleBadgeStyle(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-2 justify-end" id={`role-changers-${u.uid}`}>
                          <div className="flex gap-1 justify-end">
                            {(['client', 'tech', 'cs', 'admin'] as UserRole[]).map((r) => (
                              <button
                                key={r}
                                disabled={u.uid === user.uid && r !== 'admin'} // Admin cannot accidentally lock themselves out
                                onClick={() => handleUserRoleChange(u.email, r)}
                                className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
                                  u.role === r 
                                    ? 'bg-white/10 text-white border-white/20' 
                                    : 'text-gray-500 border-white/5 hover:text-white hover:border-white/10'
                                }`}
                                title={`Set as ${r}`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>

                          {/* Delete Account Button */}
                          {(!u.email || (user?.email && u.email.toLowerCase().trim() !== user.email.toLowerCase().trim())) && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 shrink-0"
                              title="Xóa vĩnh viễn tài khoản này khỏi hệ thống"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Xóa Tài Khoản</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* --- TAB 4: REVENUE REPORT (ADMIN ONLY) --- */}
        {activeTab === 'revenue' && user.role === 'admin' && (
          <motion.div 
            key="revenue-tab"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6" 
            id="revenue-tab-content"
          >
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="revenue-bento-grid">
              
              <div className="bg-slate-900/60 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">{t.adminDashboard.stats.totalUsers}</span>
                  <span className="text-xl font-black text-white font-mono">{users.length}</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">{t.adminDashboard.stats.activeProjects}</span>
                  <span className="text-xl font-black text-white font-mono">
                    {projects.filter(p => p.status === 'coding' || p.status === 'review').length}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">{t.adminDashboard.stats.pendingRequests}</span>
                  <span className="text-xl font-black text-white font-mono">
                    {projects.filter(p => p.status === 'pending' || p.status === 'consulting').length}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">{t.adminDashboard.stats.revenue}</span>
                  <span className="text-xl font-black text-white font-mono">$38,900</span>
                </div>
              </div>

            </div>

            {/* Custom Interactive Revenue chart */}
            {renderRevenueChart()}
          </motion.div>
        )}
        </AnimatePresence>

        {/* Delete User Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" id="delete-user-modal-overlay">
            <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative" id="delete-user-modal-content">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Xác Nhận Xóa Tài Khoản</h3>
                  <p className="text-xs text-red-300">Hành động này không thể hoàn tác</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl flex items-center gap-3">
                <img 
                  src={userToDelete.photoUrl} 
                  alt={userToDelete.name} 
                  className="w-10 h-10 rounded-full border border-white/20 bg-slate-900 shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{userToDelete.name}</p>
                  <p className="text-xs font-mono text-gray-400 truncate">{userToDelete.email}</p>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong className="text-red-400 font-bold">{userToDelete.email}</strong> khỏi hệ thống LUBPY STUDIO? Tài khoản này sẽ bị gỡ khỏi danh sách người dùng và không thể đăng nhập lại.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/10"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={() => handleDeleteUserAccount(userToDelete)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-900/30 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xác Nhận Xóa</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
      </motion.div>
    );
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {renderActiveView()}
      </AnimatePresence>

      <CameraAvatarModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        currentPhotoUrl={user.photoUrl}
        onPhotoCaptured={handlePhotoCaptured}
        userName={user.name}
        language={language}
      />
    </>
  );
}
