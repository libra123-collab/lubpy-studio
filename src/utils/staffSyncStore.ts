import { User } from '../types';
import { HRDeveloper } from '../components/HRDashboard';

export interface CSSpecialist {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  level: string;
  status: 'free' | 'busy' | 'overloaded' | 'inactive' | 'online';
  rating: number;
  avatarUrl: string;
  skills: string[];
  zaloFanpageAssigned: string;
  ticketsHandledCount: number;
  slaResponseRate: string;
  csatScore: number;
}

export interface AccountantStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  level: string;
  status: 'free' | 'busy' | 'overloaded' | 'inactive' | 'online';
  rating: number;
  avatarUrl: string;
  skills: string[];
  reconciliationAssigned: string;
  invoicesProcessedCount: number;
  totalReconciledAmountVnd: number;
  assignedScope?: string;
  auditedInvoicesCount?: number;
  auditedAmountVND?: number;
}

export function getHRCSStaff(): CSSpecialist[] {
  const result: CSSpecialist[] = [];
  const seenEmails = new Set<string>();

  // 1. From lubpy_hr_developers
  try {
    const rawHRDevs = localStorage.getItem('lubpy_hr_developers');
    if (rawHRDevs) {
      const devs: HRDeveloper[] = JSON.parse(rawHRDevs);
      if (Array.isArray(devs)) {
        devs.forEach(d => {
          if (!d || typeof d !== 'object') return;
          const deptLower = (d.department || '').toLowerCase();
          const isCS = deptLower.includes('chăm sóc') || deptLower.includes('cs') || deptLower.includes('customer');
          if (isCS && typeof d.name === 'string' && typeof d.email === 'string' && d.name.trim() && d.email.trim()) {
            const cleanEmail = d.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: d.id || `CS-${Math.floor(10 + Math.random() * 90)}`,
                name: d.name.trim(),
                email: cleanEmail,
                phone: d.phone || '0900000000',
                title: d.title || 'Chuyên Viên CSKH & Tư Vấn Đồ Án',
                level: d.level || 'Nhân Viên / Chuyên Viên',
                status: (d.status as any) || 'free',
                rating: d.rating || 5.0,
                avatarUrl: d.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: d.skills || ['Tư Vấn Đồ Án', 'Zalo OA', 'Facebook Fanpage CRM'],
                zaloFanpageAssigned: 'Zalo OA LUBPY & Fanpage CSKH Hotline',
                ticketsHandledCount: d.projectCount || 12,
                slaResponseRate: '99.5%',
                csatScore: 4.9
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Error reading CS staff from lubpy_hr_developers:', e);
  }

  // 2. From fintrixity_org_members
  try {
    const rawOrgMembers = localStorage.getItem('fintrixity_org_members');
    if (rawOrgMembers) {
      const members: User[] = JSON.parse(rawOrgMembers);
      if (Array.isArray(members)) {
        members.forEach(u => {
          if (!u || typeof u !== 'object') return;
          const deptLower = (u.department || u.departmentTitle || '').toLowerCase();
          const isCS = u.role === 'cs' || deptLower.includes('chăm sóc') || deptLower.includes('customer');
          if (isCS && typeof u.name === 'string' && typeof u.email === 'string' && u.name.trim() && u.email.trim()) {
            const cleanEmail = u.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: u.uid || `CS-${Math.floor(10 + Math.random() * 90)}`,
                name: u.name.trim(),
                email: cleanEmail,
                phone: u.phone || '0988000111',
                title: u.departmentTitle || 'Chuyên Viên Tư Vấn CSKH',
                level: 'Nhân Viên / Chuyên Viên',
                status: 'free',
                rating: 5.0,
                avatarUrl: u.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: ['Tiếp Nhận Yêu Cầu', 'Zalo OA', 'Hotline Support', 'Phản Hồi SLA'],
                zaloFanpageAssigned: 'Kênh Zalo OA Official & Fanpage LUBPY STUDIO',
                ticketsHandledCount: 15,
                slaResponseRate: '99.8%',
                csatScore: 5.0
              });
            }
          }
        });
      }
    }
  } catch (e) {}

  // 3. From lubpy_users (where role === 'cs' and not department head)
  try {
    const rawUsers = localStorage.getItem('lubpy_users');
    if (rawUsers) {
      const users: User[] = JSON.parse(rawUsers);
      if (Array.isArray(users)) {
        users.forEach(u => {
          if (!u || typeof u !== 'object') return;
          const deptLower = (u.department || '').toLowerCase();
          const isCS = u.role === 'cs' || deptLower.includes('chăm sóc') || deptLower.includes('customer');
          if (isCS && typeof u.name === 'string' && typeof u.email === 'string' && u.name.trim() && u.email.trim() && !u.isDepartmentHead && u.role !== 'admin') {
            const cleanEmail = u.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: u.uid || `CS-${Math.floor(10 + Math.random() * 90)}`,
                name: u.name.trim(),
                email: cleanEmail,
                phone: u.phone || '0988000111',
                title: u.departmentTitle || 'Chuyên Viên Tư Vấn CSKH',
                level: 'Nhân Viên / Chuyên Viên',
                status: 'free',
                rating: 5.0,
                avatarUrl: u.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: ['Tiếp Nhận Yêu Cầu', 'Zalo OA', 'Hotline Support', 'Phản Hồi SLA'],
                zaloFanpageAssigned: 'Kênh Zalo OA Official & Fanpage LUBPY STUDIO',
                ticketsHandledCount: 15,
                slaResponseRate: '99.8%',
                csatScore: 5.0
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Error reading CS staff from lubpy_users:', e);
  }

  return result;
}

export interface TechSpecialist {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  level: string;
  status: 'free' | 'busy' | 'overloaded' | 'inactive' | 'online';
  rating: number;
  avatarUrl: string;
  skills: string[];
  specialty: string;
  activeProjectsCount: number;
  completedProjectsCount: number;
  totalEarningsVnd: number;
  avgProgress: number;
}

export interface HRSpecialist {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  level: string;
  status: 'free' | 'busy' | 'overloaded' | 'inactive' | 'online';
  rating: number;
  avatarUrl: string;
  skills: string[];
  assignedArea: string;
  candidatesProcessedCount: number;
}

export function getHRTechStaff(): TechSpecialist[] {
  const result: TechSpecialist[] = [];
  const seenEmails = new Set<string>();

  // 1. From lubpy_hr_developers
  try {
    const rawHRDevs = localStorage.getItem('lubpy_hr_developers');
    if (rawHRDevs) {
      const devs: HRDeveloper[] = JSON.parse(rawHRDevs);
      if (Array.isArray(devs)) {
        devs.forEach(d => {
          if (!d || typeof d !== 'object') return;
          const deptLower = (d.department || '').toLowerCase();
          const isTech = !deptLower || deptLower.includes('kỹ thuật') || deptLower.includes('tech') || deptLower.includes('dev') || deptLower.includes('lập trình');
          if (isTech && typeof d.name === 'string' && typeof d.email === 'string' && d.name.trim() && d.email.trim()) {
            const cleanEmail = d.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: d.id || `DEV-${Math.floor(10 + Math.random() * 90)}`,
                name: d.name.trim(),
                email: cleanEmail,
                phone: d.phone || '0912345678',
                title: d.title || 'Senior Fullstack Developer',
                level: d.level || 'Nhân Viên / Chuyên Viên',
                status: (d.status as any) || 'free',
                rating: d.rating || 5.0,
                avatarUrl: d.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: d.skills || ['React', 'Node.js', 'Python', 'AI/ML', 'PostgreSQL'],
                specialty: d.title || 'Web & AI Development',
                activeProjectsCount: d.projectCount || 2,
                completedProjectsCount: (d.projectsHistory || []).filter(p => p && p.status === 'completed').length || 8,
                totalEarningsVnd: d.totalPayoutEarned || 28000000,
                avgProgress: 78
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Error reading Tech staff from lubpy_hr_developers:', e);
  }

  // 2. From fintrixity_org_members
  try {
    const rawOrgMembers = localStorage.getItem('fintrixity_org_members');
    if (rawOrgMembers) {
      const members: User[] = JSON.parse(rawOrgMembers);
      if (Array.isArray(members)) {
        members.forEach(u => {
          if (!u || typeof u !== 'object') return;
          const deptLower = (u.department || u.departmentTitle || '').toLowerCase();
          const isTech = u.role === 'tech' || !deptLower || deptLower.includes('kỹ thuật') || deptLower.includes('tech') || deptLower.includes('dev');
          if (isTech && typeof u.name === 'string' && typeof u.email === 'string' && u.name.trim() && u.email.trim()) {
            const cleanEmail = u.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: u.uid || `DEV-${Math.floor(10 + Math.random() * 90)}`,
                name: u.name.trim(),
                email: cleanEmail,
                phone: u.phone || '0912345678',
                title: u.departmentTitle || 'Kỹ Sư Lập Trình Phần Mềm',
                level: 'Nhân Viên / Chuyên Viên',
                status: 'free',
                rating: 5.0,
                avatarUrl: u.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: ['React', 'Node.js', 'TypeScript', 'Docker'],
                specialty: 'Fullstack & Cloud',
                activeProjectsCount: 1,
                completedProjectsCount: 6,
                totalEarningsVnd: 25000000,
                avgProgress: 85
              });
            }
          }
        });
      }
    }
  } catch (e) {}

  // 3. From lubpy_admin_devs
  try {
    const rawAdminDevs = localStorage.getItem('lubpy_admin_devs');
    if (rawAdminDevs) {
      const adminDevs = JSON.parse(rawAdminDevs);
      if (Array.isArray(adminDevs)) {
        adminDevs.forEach((d: any) => {
          if (d && typeof d === 'object' && typeof d.name === 'string' && typeof d.email === 'string' && d.name.trim() && d.email.trim()) {
            const cleanEmail = d.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: d.id || `DEV-${Math.floor(10 + Math.random() * 90)}`,
                name: d.name.trim(),
                email: cleanEmail,
                phone: '0901888999',
                title: d.specialty || 'Kỹ Sư Lập Trình Phần Mềm',
                level: 'Kỹ sư chuyên trách',
                status: d.activeCount > 3 ? 'overloaded' : (d.status === 'Sẵn sàng' ? 'free' : 'busy'),
                rating: Number(d.rating) || 5.0,
                avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: d.skillTags || ['Fullstack', 'TypeScript', 'Docker'],
                specialty: d.specialty || 'Fullstack & Cloud',
                activeProjectsCount: Number(d.activeCount) || 1,
                completedProjectsCount: 5,
                totalEarningsVnd: 22000000,
                avgProgress: 85
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Error reading Tech staff from lubpy_admin_devs:', e);
  }

  return result;
}

export function getHRStaffMembers(): HRSpecialist[] {
  const result: HRSpecialist[] = [];
  const seenEmails = new Set<string>();

  // 1. From lubpy_hr_developers
  try {
    const rawHRDevs = localStorage.getItem('lubpy_hr_developers');
    if (rawHRDevs) {
      const devs: HRDeveloper[] = JSON.parse(rawHRDevs);
      if (Array.isArray(devs)) {
        devs.forEach(d => {
          if (!d || typeof d !== 'object') return;
          const deptLower = (d.department || '').toLowerCase();
          const isHR = deptLower.includes('nhân sự') || deptLower.includes('hr') || deptLower.includes('tuyển dụng');
          if (isHR && typeof d.name === 'string' && typeof d.email === 'string' && d.name.trim() && d.email.trim()) {
            const cleanEmail = d.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: d.id || `HR-${Math.floor(10 + Math.random() * 90)}`,
                name: d.name.trim(),
                email: cleanEmail,
                phone: d.phone || '0901999888',
                title: d.title || 'Chuyên Viên Tuyển Dụng & Đào Tạo KTV',
                level: d.level || 'Nhân Viên / Chuyên Viên',
                status: 'free',
                rating: d.rating || 5.0,
                avatarUrl: d.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: ['Phỏng Vấn Kỹ Thuật', 'Đánh Giá KPI Kỹ Sư', 'Hợp Đồng Lao Động'],
                assignedArea: 'Tuyển chọn & Đánh giá năng lực Kỹ thuật viên toàn quốc',
                candidatesProcessedCount: 16
              });
            }
          }
        });
      }
    }
  } catch (e) {}

  // 2. From fintrixity_org_members
  try {
    const rawOrgMembers = localStorage.getItem('fintrixity_org_members');
    if (rawOrgMembers) {
      const members: User[] = JSON.parse(rawOrgMembers);
      if (Array.isArray(members)) {
        members.forEach(u => {
          if (!u || typeof u !== 'object') return;
          const deptLower = (u.department || u.departmentTitle || '').toLowerCase();
          const isHR = u.role === 'hr' || deptLower.includes('nhân sự') || deptLower.includes('hr');
          if (isHR && typeof u.name === 'string' && typeof u.email === 'string' && u.name.trim() && u.email.trim()) {
            const cleanEmail = u.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: u.uid || `HR-${Math.floor(10 + Math.random() * 90)}`,
                name: u.name.trim(),
                email: cleanEmail,
                phone: u.phone || '0905667788',
                title: u.departmentTitle || 'Chuyên Viên Đánh Giá Năng Lực HR',
                level: 'Nhân Viên / Chuyên Viên',
                status: 'free',
                rating: 5.0,
                avatarUrl: u.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: ['Đánh Giá KPI', 'Phúc Lợi & Thù Lao', 'Đào Tạo Onboarding'],
                assignedArea: 'Quản lý hợp đồng CTV Kỹ thuật & Chính sách thù lao',
                candidatesProcessedCount: 12
              });
            }
          }
        });
      }
    }
  } catch (e) {}

  return result;
}

export function getHRAccountingStaff(): AccountantStaff[] {
  const result: AccountantStaff[] = [];
  const seenEmails = new Set<string>();

  // 1. From lubpy_hr_developers
  try {
    const rawHRDevs = localStorage.getItem('lubpy_hr_developers');
    if (rawHRDevs) {
      const devs: HRDeveloper[] = JSON.parse(rawHRDevs);
      if (Array.isArray(devs)) {
        devs.forEach(d => {
          if (!d || typeof d !== 'object') return;
          const deptLower = (d.department || '').toLowerCase();
          const isAcc = deptLower.includes('kế toán') || deptLower.includes('accounting') || deptLower.includes('tài chính');
          if (isAcc && typeof d.name === 'string' && typeof d.email === 'string' && d.name.trim() && d.email.trim()) {
            const cleanEmail = d.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: d.id || `ACC-${Math.floor(10 + Math.random() * 90)}`,
                name: d.name.trim(),
                email: cleanEmail,
                phone: d.phone || '0900000000',
                title: d.title || 'Chuyên Viên Kế Toán Hóa Đơn & Thu Chi',
                level: d.level || 'Nhân Viên / Chuyên Viên',
                status: (d.status as any) || 'free',
                rating: d.rating || 5.0,
                avatarUrl: d.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: d.skills || ['Đối Soát Thù Lao', 'Xuất Hóa Đơn VAT', 'MISA', 'Báo Cáo Thu Chi'],
                reconciliationAssigned: 'Đối soát thù lao Kỹ sư (65%) & Hóa đơn cọc/nghiệm thu đồ án',
                invoicesProcessedCount: d.projectCount || 18,
                totalReconciledAmountVnd: d.totalPayoutEarned || 45000000
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Error reading Accounting staff from lubpy_hr_developers:', e);
  }

  // 2. From fintrixity_org_members
  try {
    const rawOrgMembers = localStorage.getItem('fintrixity_org_members');
    if (rawOrgMembers) {
      const members: User[] = JSON.parse(rawOrgMembers);
      if (Array.isArray(members)) {
        members.forEach(u => {
          if (!u || typeof u !== 'object') return;
          const deptLower = (u.department || u.departmentTitle || '').toLowerCase();
          const isAcc = u.role === 'accounting' || deptLower.includes('kế toán') || deptLower.includes('finance') || deptLower.includes('accounting');
          if (isAcc && typeof u.name === 'string' && typeof u.email === 'string' && u.name.trim() && u.email.trim()) {
            const cleanEmail = u.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: u.uid || `ACC-${Math.floor(10 + Math.random() * 90)}`,
                name: u.name.trim(),
                email: cleanEmail,
                phone: u.phone || '0977000222',
                title: u.departmentTitle || 'Chuyên Viên Kế Toán Hóa Đơn',
                level: 'Nhân Viên / Chuyên Viên',
                status: 'free',
                rating: 5.0,
                avatarUrl: u.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: ['Quản Lý Hóa Đơn', 'Đối Soát Chi Trả Dev', 'Kiểm Soát Dòng Tiền', 'Xuất File Excel'],
                reconciliationAssigned: 'Phụ trách duyệt quyết toán đồ án & chi trả thù lao toàn hệ thống',
                invoicesProcessedCount: 24,
                totalReconciledAmountVnd: 85000000
              });
            }
          }
        });
      }
    }
  } catch (e) {}

  // 3. From lubpy_users
  try {
    const rawUsers = localStorage.getItem('lubpy_users');
    if (rawUsers) {
      const users: User[] = JSON.parse(rawUsers);
      if (Array.isArray(users)) {
        users.forEach(u => {
          if (!u || typeof u !== 'object') return;
          const deptLower = (u.department || '').toLowerCase();
          const isAcc = u.role === 'accounting' || deptLower.includes('kế toán') || deptLower.includes('finance') || deptLower.includes('accounting');
          if (isAcc && typeof u.name === 'string' && typeof u.email === 'string' && u.name.trim() && u.email.trim() && !u.isDepartmentHead && u.role !== 'admin') {
            const cleanEmail = u.email.toLowerCase().trim();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              result.push({
                id: u.uid || `ACC-${Math.floor(10 + Math.random() * 90)}`,
                name: u.name.trim(),
                email: cleanEmail,
                phone: u.phone || '0977000222',
                title: u.departmentTitle || 'Chuyên Viên Kế Toán Hóa Đơn',
                level: 'Nhân Viên / Chuyên Viên',
                status: 'free',
                rating: 5.0,
                avatarUrl: u.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=0f172a`,
                skills: ['Quản Lý Hóa Đơn', 'Đối Soát Chi Trả Dev', 'Kiểm Soát Dòng Tiền', 'Xuất File Excel'],
                reconciliationAssigned: 'Phụ trách duyệt quyết toán đồ án & chi trả thù lao toàn hệ thống',
                invoicesProcessedCount: 24,
                totalReconciledAmountVnd: 85000000
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Error reading Accounting staff from lubpy_users:', e);
  }

  return result;
}
