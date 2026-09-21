import { User } from '../types';

export function checkRoleAuthority(
  user: User | null, 
  targetViewMode: string
): { allowed: boolean; errorMessage?: string } {
  if (!user) {
    return { 
      allowed: false, 
      errorMessage: "Vui lòng đăng nhập để thực hiện thao tác này!" 
    };
  }

  // System admin can access all views
  if (user.role === 'admin') {
    return { allowed: true };
  }

  const role = user.role; // 'tech', 'cs', 'accounting', 'hr', 'client'
  const view = targetViewMode.toLowerCase();

  const UNAUTHORIZED_MSG = "Tài khoản của bạn không thuộc thẩm quyền truy cập vào nghiệp vụ này. Vui lòng đăng nhập đúng tài khoản nghiệp vụ!";

  // Tech views
  if (view === 'tech' || view === 'tech-staff') {
    if (role === 'tech') return { allowed: true };
    return { allowed: false, errorMessage: UNAUTHORIZED_MSG };
  }

  // Customer Service views
  if (view === 'cs' || view === 'cs-staff') {
    if (role === 'cs') return { allowed: true };
    return { allowed: false, errorMessage: UNAUTHORIZED_MSG };
  }

  // Accounting views
  if (view === 'accounting' || view === 'accounting-staff') {
    if (role === 'accounting') return { allowed: true };
    return { allowed: false, errorMessage: UNAUTHORIZED_MSG };
  }

  // HR views
  if (view === 'hr' || view === 'hr-staff') {
    if (role === 'hr') return { allowed: true };
    return { allowed: false, errorMessage: UNAUTHORIZED_MSG };
  }

  // Admin / Fintrixity core dashboard
  if (view === 'admin') {
    if ((role as string) === 'admin') return { allowed: true };
    return { allowed: false, errorMessage: UNAUTHORIZED_MSG };
  }

  // Client view
  if (view === 'client') {
    if (role === 'client') return { allowed: true };
    return { allowed: false, errorMessage: UNAUTHORIZED_MSG };
  }

  // System tabs (projects, tickets, etc.) are allowed for internal staff
  if (view === 'system') {
    return { allowed: true };
  }

  return { allowed: true };
}
