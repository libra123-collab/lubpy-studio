import { User, UserRole } from '../types';

export interface DepartmentHierarchy {
  role: UserRole;
  deptNameVi: string;
  deptNameEn: string;
  head: User;
  members: User[];
}

// Initial Admin Master Account
export const defaultAdminUser: User = {
  uid: 'admin_master_001',
  name: 'LUBPY Super Admin (Khởi Tạo Ban Đầu)',
  email: 'superadmin@lubpystudio.vn',
  photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin_master&backgroundColor=0f172a',
  role: 'admin',
  isDepartmentHead: true,
  departmentTitle: 'Tổng Giám Đốc / Quản Trị Viên Cao Cấp',
  createdByAdmin: true
};

// Preset Department Heads appointed by Admin (Empty by default for user configuration)
export const defaultDepartmentHeads: Record<string, User> = {};

// Sub-members managed by their respective Department Leads (Empty by default)
export const defaultDepartmentMembers: User[] = [];

export function getStoredOrganization() {
  let heads: Record<string, User> = { ...defaultDepartmentHeads };
  let members: User[] = [...defaultDepartmentMembers];

  try {
    const savedHeads = localStorage.getItem('fintrixity_org_heads');
    if (savedHeads) {
      const parsed = JSON.parse(savedHeads);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        heads = parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading fintrixity_org_heads:', e);
  }

  try {
    const savedMembers = localStorage.getItem('fintrixity_org_members');
    if (savedMembers) {
      const parsed = JSON.parse(savedMembers);
      if (Array.isArray(parsed)) {
        members = parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading fintrixity_org_members:', e);
  }

  // Clear demo seeded data if present
  if (heads && (heads.tech?.uid === 'head_tech_01' || heads.cs?.uid === 'head_cs_01')) {
    try {
      localStorage.removeItem('fintrixity_org_heads');
    } catch (e) {}
    heads = {};
  }
  if (Array.isArray(members) && members.some(m => m && m.uid === 'tech_sub_01')) {
    try {
      localStorage.removeItem('fintrixity_org_members');
    } catch (e) {}
    members = [];
  }

  return {
    admin: defaultAdminUser,
    heads: heads || {},
    members: members || []
  };
}

export function saveOrganization(heads: Record<string, User>, members: User[]) {
  localStorage.setItem('fintrixity_org_heads', JSON.stringify(heads));
  localStorage.setItem('fintrixity_org_members', JSON.stringify(members));
}

export function clearAllOrganizationStaff() {
  localStorage.setItem('fintrixity_org_heads', JSON.stringify({}));
  localStorage.setItem('fintrixity_org_members', JSON.stringify([]));
  localStorage.setItem('lubpy_admin_devs', JSON.stringify([]));
  localStorage.setItem('lubpy_hr_developers', JSON.stringify([]));
  localStorage.setItem('lubpy_staff_cleared', 'true');

  try {
    const rawSaved = localStorage.getItem('lubpy_saved_accounts_v2');
    if (rawSaved) {
      const savedList: any[] = JSON.parse(rawSaved);
      if (Array.isArray(savedList)) {
        // Keep only superadmin and registered clients
        const cleanSaved = savedList.filter(a => a && (a.role === 'admin' || a.role === 'client'));
        localStorage.setItem('lubpy_saved_accounts_v2', JSON.stringify(cleanSaved));
      }
    }
  } catch (e) {
    console.warn('Error cleaning lubpy_saved_accounts_v2:', e);
  }

  try {
    const rawUsers = localStorage.getItem('lubpy_users');
    if (rawUsers) {
      const users: User[] = JSON.parse(rawUsers);
      if (Array.isArray(users)) {
        // Retain only master admin / super admin accounts and clients
        const adminAndClientOnly = users.filter(u => u && (u.role === 'admin' || u.role === 'client' || u.uid === 'admin_master_001'));
        localStorage.setItem('lubpy_users', JSON.stringify(adminAndClientOnly));
      }
    }
  } catch (e) {
    console.warn('Error cleaning lubpy_users:', e);
  }

  // Dispatch custom and storage events so active components re-render immediately
  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('lubpy_staff_updated'));
    window.dispatchEvent(new CustomEvent('lubpy_saved_accounts_updated'));
    window.dispatchEvent(new CustomEvent('lubpy_users_updated'));
  } catch (e) {}

  return {
    admin: defaultAdminUser,
    heads: {},
    members: []
  };
}
