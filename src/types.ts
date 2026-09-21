export interface TechItem {
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'Mobile & AI';
  icon: string;
}

export interface PortfolioItem {
  title: string;
  category: string;
  tech: string[];
  description: string;
  image: string;
}

export interface ProcessStage {
  step: string;
  title: string;
  desc: string;
  icon: string;
}

export interface PricingTier {
  name: string;
  price: string;
  subtitle: string;
  features: string[];
  isPopular?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export type ProjectLifecycleStatus = 
  | 'pending'       // Mới tiếp nhận
  | 'assigned'      // Đã phân công Dev
  | 'coding'        // Đang triển khai
  | 'deposit_50'    // Đã cọc (50%)
  | 'review'        // Đã Demo/Review
  | 'paid_100'      // Thanh toán đủ (100%)
  | 'delivered';    // Hoàn tất & Bàn giao

export const PROJECT_STATUS_LABELS: Record<ProjectLifecycleStatus, string> = {
  pending: 'Mới tiếp nhận',
  assigned: 'Đã phân công Dev',
  coding: 'Đang triển khai',
  deposit_50: 'Đã cọc (50%)',
  review: 'Đã Demo/Review',
  paid_100: 'Thanh toán đủ (100%)',
  delivered: 'Hoàn tất & Bàn giao'
};

export interface ProjectRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectType: string;
  description: string;
  deadline: string;
  techStack: string[];
  status: ProjectLifecycleStatus | 'consulting' | 'approved';
  progress: number;
  priceVnd?: number;
  devCommissionRate?: number; // 40% - 80%, default 65%
  assignedTech?: string;
  assignedCS?: string;
  feedback?: string;
  thumbnailUrl?: string;
  documents?: Array<{ name: string; url: string; uploadedAt: string }>;
  reports?: Array<{ author: string; content: string; timestamp: string }>;
  createdAt: string;
}

export type UserRole = 'client' | 'tech' | 'cs' | 'hr' | 'accounting' | 'admin';

export interface User {
  uid: string;
  id?: string;
  name: string;
  email: string;
  photoUrl: string;
  role: UserRole;
  isDepartmentHead?: boolean; // Cho biết đây có phải người chính/Trưởng nghiệp vụ quản lý bộ phận không
  department?: string; // Tên phòng ban / nghiệp vụ
  departmentTitle?: string; // Ví dụ: 'Trưởng Đội Ngũ Kỹ Thuật (Tech Lead)', 'Lập trình viên', v.v.
  title?: string;
  managedByHeadId?: string; // UID của Trưởng nghiệp vụ quản lý
  createdByAdmin?: boolean; // Khởi tạo từ Admin
  dob?: string; // Ngày tháng năm sinh
  hometown?: string; // Quê quán
  phone?: string; // Số điện thoại
  password?: string; // Mật khẩu tài khoản
  occupation?: string; // Nghề nghiệp (cho Khách hàng)
  workEnvironment?: string; // Môi trường làm việc (Trường học, Doanh nghiệp, Freelance...)
  experience?: string; // Kinh nghiệm làm việc (cho Nghiệp vụ)
  competence?: string; // Năng lực chuyên môn (cho Nghiệp vụ)
  skills?: string; // Các kỹ năng làm việc (cho Nghiệp vụ)
  careerGoals?: string; // Định hướng mục tiêu nghề nghiệp (cho Nghiệp vụ)
  rating?: number; // Đánh giá hiệu suất / KPI (e.g. 5.0)
}

export interface SupportTicket {
  id: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  messages: Array<{ sender: string; content: string; timestamp: string }>;
  status: 'open' | 'resolved';
}
