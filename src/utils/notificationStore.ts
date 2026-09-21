import { User } from '../types';

export interface AdminNotification {
  id: string;
  senderName: string;
  senderEmail: string;
  senderRole?: string;
  senderTitle?: string;
  targetScope: 'all_members' | 'all_heads' | 'single_position' | 'single_head';
  targetDeptKey?: 'tech' | 'cs' | 'hr' | 'accounting' | string;
  targetPosition?: string; // e.g. "Fullstack Lead Dev", "Kỹ Sư Backend", "CSKH", "Kế Toán", "HR", "Lập trình viên", "Tất cả"
  targetDeptLabel?: string;
  targetHeadName?: string;
  targetHeadEmail?: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  readBy: string[]; // List of user emails who have marked this notification as read
}

export const DEPT_LABELS: Record<string, string> = {
  tech: 'Đội Ngũ Kỹ Thuật (Engineering)',
  cs: 'Chăm Sóc Khách Hàng (Customer Service)',
  hr: 'Quản Lý Nhân Sự (HR & Payroll)',
  accounting: 'Kế Toán & Tài Chính (Finance & Accounting)'
};

export const PRESET_POSITIONS = [
  'Fullstack Lead Dev (Trưởng Nhóm Lập Trình)',
  'AI & Machine Learning Specialist',
  'Backend Software Engineer',
  'Frontend UI/UX Developer',
  'Mobile App Developer (Flutter/RN)',
  'Chuyên Viên Tư Vấn CSKH & Support',
  'Quản Lý Nhân Sự & Thù Lao (HR)',
  'Chuyên Viên Kế Toán & Tài Chính',
  'Nhân Viên Kế Toán Cấp Dưới',
  'Kế Toán Viên Thu Chi & Hợp Đồng',
  'Kế Toán Viên Ngân Sách & Thù Lao',
  'Lập Trình Viên (Developer)',
  'Khách Hàng / Học Viên'
];

const INITIAL_NOTIFICATIONS: AdminNotification[] = [];

export function getStoredNotifications(): AdminNotification[] {
  const saved = localStorage.getItem('lubpy_admin_notifications');
  if (saved) {
    try {
      const parsed: AdminNotification[] = JSON.parse(saved);
      // Filter out any leftover mock initial notifications if present
      const cleaned = parsed.filter(n => !n.id.startsWith('notif_tech_') && !n.id.startsWith('notif_cs_') && !n.id.startsWith('notif_hr_') && !n.id.startsWith('notif_accounting_') && !n.id.startsWith('notif_admin_') && !n.id.startsWith('notif_client_') && !['notif_001', 'notif_002', 'notif_003'].includes(n.id));
      return cleaned;
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function saveNotifications(notifications: AdminNotification[]): void {
  localStorage.setItem('lubpy_admin_notifications', JSON.stringify(notifications));
}

export function sendNewNotification(newNotif: Omit<AdminNotification, 'id' | 'createdAt' | 'readBy'>): AdminNotification {
  const currentNotifs = getStoredNotifications();
  const createdItem: AdminNotification = {
    ...newNotif,
    id: `notif_${Date.now()}`,
    createdAt: new Date().toLocaleString('vi-VN'),
    readBy: []
  };
  const updated = [createdItem, ...currentNotifs];
  saveNotifications(updated);
  return createdItem;
}

export function deleteNotification(id: string): void {
  const currentNotifs = getStoredNotifications();
  const updated = currentNotifs.filter(n => n.id !== id);
  saveNotifications(updated);
}

export function updateNotification(updatedNotif: AdminNotification): void {
  const currentNotifs = getStoredNotifications();
  const updated = currentNotifs.map(n => n.id === updatedNotif.id ? updatedNotif : n);
  saveNotifications(updated);
}

export function markAsRead(id: string, userEmail: string): void {
  const currentNotifs = getStoredNotifications();
  const updated = currentNotifs.map(n => {
    if (n.id === id) {
      const readSet = new Set(n.readBy || []);
      readSet.add(userEmail.toLowerCase());
      return { ...n, readBy: Array.from(readSet) };
    }
    return n;
  });
  saveNotifications(updated);
}

/**
 * Filter notifications visible to the logged-in user:
 * - Admin: sees ALL internal notifications
 * - Sender: ALWAYS sees notifications they sent themselves (for 'Sent' tab)
 * - Subordinate Staff (Tech, CS, HR, Accounting): ONLY receives notifications sent directly by THEIR Department Head (Trưởng Phòng / Lead) or Super Admin.
 */
export function syncNotificationSenderWithOrgHeads(
  notifications: AdminNotification[],
  orgHeads: Record<string, User>,
  currentUser?: User
): AdminNotification[] {
  if (!notifications || !Array.isArray(notifications)) return [];

  return notifications.map(n => {
    const roleKey = n.senderRole;
    if (roleKey && ['tech', 'cs', 'hr', 'accounting'].includes(roleKey)) {
      // Find active head from orgHeads or currentUser if currentUser is head of this department
      let head = orgHeads ? orgHeads[roleKey] : undefined;
      const userRoleStr = (currentUser?.role as string) || '';
      if (!head && currentUser && currentUser.isDepartmentHead && (userRoleStr === roleKey || (userRoleStr === 'tech_lead' && roleKey === 'tech'))) {
        head = currentUser;
      }

      if (head && head.name) {
        let updatedContent = n.content;
        if (n.senderName && n.senderName !== head.name && updatedContent.includes(n.senderName)) {
          updatedContent = updatedContent.replaceAll(n.senderName, head.name);
        }
        return {
          ...n,
          senderName: head.name,
          senderEmail: head.email || n.senderEmail,
          senderTitle: head.departmentTitle || (roleKey === 'tech' ? 'Trưởng Đội Ngũ Kỹ Thuật (Tech Lead)' : n.senderTitle),
          content: updatedContent
        };
      }
    }
    return n;
  });
}

export function getVisibleNotificationsForUser(user: User, orgHeads: Record<string, User>): {
  visibleNotifs: AdminNotification[];
  isHeadOrAdmin: boolean;
  userDeptKey?: string;
  userDeptTitle?: string;
  canCompose: boolean;
} {
  const rawNotifs = getStoredNotifications();
  const allNotifs = syncNotificationSenderWithOrgHeads(rawNotifs, orgHeads, user);
  const userEmailLower = (user.email || '').toLowerCase();

  // 1. Super Admin sees everything
  if (user.role === 'admin') {
    return {
      visibleNotifs: allNotifs,
      isHeadOrAdmin: true,
      userDeptTitle: 'Quản Trị Viên Tối Cao (Super Admin)',
      canCompose: true
    };
  }

  // 2. Determine if user is a Department Head or has a specific dept key
  let userDeptKey: string | undefined = undefined;
  let headObj: User | undefined = undefined;

  if (orgHeads) {
    for (const [deptKey, head] of Object.entries(orgHeads)) {
      if (head && head.email && head.email.toLowerCase() === userEmailLower) {
        userDeptKey = deptKey;
        headObj = head;
        break;
      }
    }
  }

  if (!userDeptKey) {
    if (user.role === 'tech') userDeptKey = 'tech';
    else if (user.role === 'cs') userDeptKey = 'cs';
    else if (user.role === 'hr') userDeptKey = 'hr';
    else if (user.role === 'accounting') userDeptKey = 'accounting';
  }

  const isHead = user.isDepartmentHead || Boolean(headObj);
  const userDeptTitle = user.departmentTitle || headObj?.departmentTitle || (userDeptKey ? DEPT_LABELS[userDeptKey] : 'Thành Viên Đội Ngũ');

  // 3. Subordinate staff filtering for Tech, CS, HR, Accounting
  const deptKey = userDeptKey || (user.role as string);

  // 3. Client User Filtering: Client ONLY receives notifications from Technical Staff assigned to/in charge of their projects
  if ((user.role as string) === 'client') {
    let clientProjects: any[] = [];
    try {
      const savedProjects = localStorage.getItem('lubpy_projects');
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          clientProjects = parsed.filter((p: any) => 
            (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
            (p.phone && user.phone && p.phone === user.phone) ||
            (p.clientName && user.name && p.clientName.toLowerCase() === user.name.toLowerCase())
          );
          if (clientProjects.length === 0 && (user.email.toLowerCase().includes('client') || user.email.toLowerCase().includes('khachhang'))) {
            clientProjects = parsed;
          }
        }
      }
    } catch (e) {}

    // Default fallback client projects if localStorage is empty or not initialized
    if (clientProjects.length === 0) {
      clientProjects = [
        {
          id: 'PRJ-2401',
          name: 'Xây dựng Website E-Commerce tích hợp AI Recommendation',
          assignedTech: 'Phan Quốc Bảo (Lead Dev)'
        },
        {
          id: 'PRJ-2402',
          name: 'Ứng dụng Di Động Quản Lý Chi Tiêu Quét Hóa Đơn OCR',
          assignedTech: 'Trần Hoàng Nam (Mobile Specialist)'
        }
      ];
    }

    // Extract assigned tech personnel names and project IDs for this client
    const assignedTechNamesSet = new Set<string>();
    const clientProjectIdsSet = new Set<string>();

    clientProjects.forEach((p: any) => {
      if (p.id) clientProjectIdsSet.add(p.id.toLowerCase());
      if (p.assignedTech) {
        const fullAssigned = p.assignedTech.toLowerCase();
        assignedTechNamesSet.add(fullAssigned);
        const cleanName = p.assignedTech.replace(/\(.*\)/, '').trim().toLowerCase();
        if (cleanName) assignedTechNamesSet.add(cleanName);
      }
    });

    const assignedTechNames = Array.from(assignedTechNamesSet);
    const clientProjectIds = Array.from(clientProjectIdsSet);

    const visibleNotifs = allNotifs.filter(n => {
      const senderEmailLower = (n.senderEmail || '').toLowerCase();
      const senderNameLower = (n.senderName || '').toLowerCase();
      const senderTitleLower = (n.senderTitle || '').toLowerCase();
      const titleLower = (n.title || '').toLowerCase();
      const contentLower = (n.content || '').toLowerCase();

      // Always show notifications sent by self if any
      if (senderEmailLower === userEmailLower) return true;

      // STRICT RULE FOR CLIENT: ONLY receive notifications from Technical Staff assigned to/in charge of their projects
      
      // 1. Technical Staff Sender Check:
      // Sender MUST be technical staff (senderRole === 'tech' or senderTitle/Email indicates Tech KTV)
      // Must NOT be CS, HR, Accounting, or Admin
      const isTechRole = n.senderRole === 'tech' || 
                         senderTitleLower.includes('ktv') || 
                         senderTitleLower.includes('kỹ thuật') || 
                         senderTitleLower.includes('tech') || 
                         senderTitleLower.includes('dev') ||
                         senderEmailLower.includes('tech');

      const isNonTechRole = n.senderRole === 'cs' || n.senderRole === 'hr' || n.senderRole === 'accounting' || n.senderRole === 'admin';

      if (!isTechRole || isNonTechRole) {
        return false;
      }

      // 2. Assignment & Relevance Check:
      // The tech staff member MUST match one of the assigned tech developers for this client's projects,
      // OR the notification MUST mention a project ID belonging to this client.
      const matchesAssignedTech = assignedTechNames.some(techName => 
        senderNameLower.includes(techName) || 
        techName.includes(senderNameLower) ||
        senderTitleLower.includes(techName)
      );

      const mentionsClientProject = clientProjectIds.some(prjId => 
        titleLower.includes(prjId) || 
        contentLower.includes(prjId)
      );

      const targetPosLower = (n.targetPosition || '').toLowerCase();
      const isClientTarget = targetPosLower.includes('khách hàng') || 
                             targetPosLower.includes('học viên') || 
                             targetPosLower.includes('tất cả') ||
                             mentionsClientProject;

      if (!isClientTarget) {
        return false;
      }

      if (assignedTechNames.length > 0 || clientProjectIds.length > 0) {
        return matchesAssignedTech || mentionsClientProject;
      }

      return true;
    });

    return {
      visibleNotifs,
      isHeadOrAdmin: false,
      userDeptKey: undefined,
      userDeptTitle: 'Khách Hàng / Học Viên',
      canCompose: false
    };
  }

  // If user is a subordinate staff member (not department head, not super admin)
  if (!isHead && (user.role as string) !== 'admin' && ['tech', 'cs', 'hr', 'accounting'].includes(deptKey)) {
    const headForDept = orgHeads ? orgHeads[deptKey] : undefined;
    const headEmailLower = (headForDept?.email || '').toLowerCase();
    const headNameLower = (headForDept?.name || '').toLowerCase();

    // Default fallback head emails for departments if orgHeads isn't customized yet
    const defaultHeadEmails: Record<string, string> = {
      tech: 'truetechengineer@lubpystudio.vn',
      cs: 'chudat@lubpystudio.vn',
      hr: 'hr.head@lubpystudio.vn',
      accounting: 'finance.head@lubpystudio.vn'
    };
    const defaultHeadEmail = defaultHeadEmails[deptKey] || '';

    const visibleNotifs = allNotifs.filter(n => {
      const senderEmailLower = (n.senderEmail || '').toLowerCase();
      const senderNameLower = (n.senderName || '').toLowerCase();
      const senderTitleLower = (n.senderTitle || '').toLowerCase();

      // 1. Always see messages sent by self (so staff can review their sent messages in 'Sent' tab)
      if (senderEmailLower === userEmailLower) return true;

      // 2. SENDER CHECK: MUST be Super Admin OR Department Head of THEIR specific department
      const isFromAdmin = n.senderRole === 'admin' || 
                          senderEmailLower.includes('admin') || 
                          senderNameLower.includes('admin');

      const isFromDeptHead = (headEmailLower && senderEmailLower === headEmailLower) ||
                             (defaultHeadEmail && senderEmailLower === defaultHeadEmail) ||
                             (headNameLower && senderNameLower.includes(headNameLower)) ||
                             (n.senderRole === deptKey && (senderTitleLower.includes('trưởng') || senderTitleLower.includes('lead') || senderTitleLower.includes('head') || senderTitleLower.includes('giám đốc') || senderTitleLower.includes('quản lý'))) ||
                             (n.targetDeptKey === deptKey && (senderTitleLower.includes('trưởng') || senderTitleLower.includes('lead') || senderTitleLower.includes('head') || senderTitleLower.includes('giám đốc')));

      // STRICT RULE: Reject any notification that was NOT sent by Super Admin or their Department Head
      if (!isFromAdmin && !isFromDeptHead) return false;

      // 3. TARGET SCOPE CHECK: Must be addressed to all_members, their department, or their position
      if (n.targetScope === 'all_members') return true;
      if (n.targetDeptKey === deptKey) return true;
      if (n.targetScope === 'single_head' && n.targetHeadEmail && n.targetHeadEmail.toLowerCase() === userEmailLower) return true;

      if (n.targetScope === 'single_position' && n.targetPosition) {
        const targetPosLower = n.targetPosition.toLowerCase();
        const userTitleLower = (user.departmentTitle || user.title || '').toLowerCase();

        if (userTitleLower.includes(targetPosLower) || targetPosLower.includes(userTitleLower)) return true;
        if (targetPosLower.includes('tất cả') || targetPosLower.includes('toàn bộ')) return true;
        if (deptKey === 'tech' && (targetPosLower.includes('kỹ thuật') || targetPosLower.includes('dev') || targetPosLower.includes('lập trình'))) return true;
        if (deptKey === 'cs' && (targetPosLower.includes('cskh') || targetPosLower.includes('tư vấn') || targetPosLower.includes('support'))) return true;
        if (deptKey === 'hr' && (targetPosLower.includes('hr') || targetPosLower.includes('nhân sự'))) return true;
        if (deptKey === 'accounting' && (targetPosLower.includes('kế toán') || targetPosLower.includes('tài chính'))) return true;
      }

      return false;
    });

    return {
      visibleNotifs,
      isHeadOrAdmin: false,
      userDeptKey: deptKey,
      userDeptTitle: userDeptTitle || DEPT_LABELS[deptKey] || 'Nhân Viên Nghiệp Vụ',
      canCompose: deptKey === 'tech'
    };
  }

  // Filter visible notifications for team members / heads / clients
  const visibleNotifs = allNotifs.filter(n => {
    // Always show if user is the sender
    if (n.senderEmail && n.senderEmail.toLowerCase() === userEmailLower) return true;

    // Show if sent to all members / system wide
    if (n.targetScope === 'all_members') return true;

    // Show if sent to all department heads and user is a head
    if (n.targetScope === 'all_heads' && isHead) return true;

    // Show if sent to a single head and matching department key or email
    if (n.targetScope === 'single_head') {
      if (userDeptKey && n.targetDeptKey === userDeptKey && isHead) return true;
      if (n.targetHeadEmail && n.targetHeadEmail.toLowerCase() === userEmailLower) return true;
    }

    // Show if sent to a specific position/title
    if (n.targetScope === 'single_position' && n.targetPosition) {
      const targetPosLower = n.targetPosition.toLowerCase();
      const userTitleLower = (user.departmentTitle || user.title || '').toLowerCase();
      const userRoleLower = (user.role || '').toLowerCase();

      if (userTitleLower.includes(targetPosLower) || targetPosLower.includes(userTitleLower)) return true;
      if (targetPosLower.includes('tất cả') || targetPosLower.includes('toàn bộ')) return true;
      if (userRoleLower === 'tech' && (targetPosLower.includes('kỹ thuật') || targetPosLower.includes('dev') || targetPosLower.includes('lập trình'))) return true;
      if (userRoleLower === 'cs' && (targetPosLower.includes('cskh') || targetPosLower.includes('tư vấn') || targetPosLower.includes('support'))) return true;
      if (userRoleLower === 'hr' && (targetPosLower.includes('hr') || targetPosLower.includes('nhân sự'))) return true;
      if (userRoleLower === 'accounting' && (targetPosLower.includes('kế toán') || targetPosLower.includes('tài chính'))) return true;
      if (userRoleLower === 'client' && (targetPosLower.includes('khách hàng') || targetPosLower.includes('học viên'))) return true;
    }

    return false;
  });

  return {
    visibleNotifs,
    isHeadOrAdmin: isHead || (user.role as string) === 'admin',
    userDeptKey,
    userDeptTitle,
    canCompose: isHead || (user.role as string) === 'admin'
  };
}
