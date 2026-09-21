import { z } from 'zod';

// 1. Auth Schemas
export const registerClientSchema = z.object({
  name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự').max(100),
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
  phone: z.string().optional(),
  dob: z.string().optional(),
  hometown: z.string().optional(),
  occupation: z.string().optional(),
  workEnvironment: z.string().optional(),
  skills: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu quản trị'),
  adminSecurityKey: z.string().optional(),
});

export const sendOtpSchema = z.object({
  target: z.string().min(3, 'Vui lòng nhập Email hoặc Số điện thoại'),
  type: z.enum(['email', 'phone']).default('email'),
});

export const verifyOtpSchema = z.object({
  target: z.string().min(3, 'Đích nhận OTP không hợp lệ'),
  code: z.string().length(6, 'Mã OTP phải có đúng 6 chữ số'),
});

// 2. Project Schemas & Status Mapping
export const PROJECT_STATUS_ENUM = [
  'PENDING', 'CONSULTING', 'APPROVED', 'ASSIGNED', 'DEPOSIT_50',
  'CODING', 'REVIEW', 'PAID_100', 'DELIVERED', 'CANCELLED', 'REFUNDED',
  // Mobile / Client aliases
  'PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD',
  // Lowercase variants
  'pending', 'consulting', 'approved', 'assigned', 'deposit_50',
  'coding', 'review', 'paid_100', 'delivered', 'cancelled', 'refunded',
  'planning', 'in_progress', 'completed', 'on_hold'
] as const;

export const createProjectSchema = z.object({
  id: z.string().optional(),
  projectCode: z.string().optional(),
  title: z.string().min(2, 'Tiêu đề đồ án phải có ít nhất 2 ký tự').optional(),
  name: z.string().optional(),
  projectName: z.string().optional(),
  description: z.string().optional(),
  details: z.string().optional(),
  projectType: z.string().optional().default('Đồ án tốt nghiệp'),
  deadline: z.string().optional(),
  priceVnd: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional().default(0),
  devCommissionRate: z.number().min(0).max(100).optional().default(65),
  techStack: z.union([z.array(z.string()), z.string()]).optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  phone: z.string().optional(),
  assignedDevName: z.string().optional(),
  assignedCsName: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const updateProjectSchema = z.object({
  status: z.enum(PROJECT_STATUS_ENUM).optional(),
  projectStatus: z.enum(PROJECT_STATUS_ENUM).optional(),
  progress: z.number().min(0).max(100).optional(),
  priceVnd: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional(),
  deposited: z.number().min(0).optional(),
  remainingAmount: z.number().min(0).optional(),
  devCommissionRate: z.number().min(0).max(100).optional(),
  assignedDevName: z.string().optional(),
  assignedDevId: z.string().optional(),
  assignedCsName: z.string().optional(),
  assignedCsId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  feedback: z.string().optional(),
  description: z.string().optional(),
  documents: z.union([z.array(z.any()), z.string()]).optional(),
  reports: z.union([z.array(z.any()), z.string()]).optional(),
});

export const assignProjectSchema = z.object({
  userName: z.string().min(1, 'Tên nhân sự được phân công không được để trống'),
  userId: z.string().optional(),
  role: z.enum(['DEVELOPER', 'TECH_LEAD', 'CS', 'tech', 'cs', 'developer', 'tech_lead']),
});

// 3. Transaction Schemas & Wallet Deposit
export const createTransactionSchema = z.object({
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  type: z.enum([
    'PROJECT_DEPOSIT', 'FINAL_PAYMENT', 'DEVELOPER_PAYOUT', 'REFUND', 'EXPENSE', 'WALLET_DEPOSIT',
    'deposit', 'payment', 'payout', 'refund', 'wallet_deposit'
  ]).optional().default('PROJECT_DEPOSIT'),
  txType: z.string().optional(),
  transactionType: z.string().optional(),
  amountVnd: z.number().positive('Số tiền giao dịch phải lớn hơn 0').optional(),
  amount: z.number().positive('Số tiền giao dịch phải lớn hơn 0').optional(),
  senderName: z.string().optional(),
  receiverName: z.string().optional(),
  note: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional().default('pending'),
});

export const walletDepositSchema = z.object({
  amount: z.number().positive('Số tiền nạp phải lớn hơn 0').optional(),
  amountVnd: z.number().positive('Số tiền nạp phải lớn hơn 0').optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  note: z.string().optional(),
  senderName: z.string().optional(),
  paymentMethod: z.string().optional().default('VIETQR'),
  method: z.string().optional().default('VIETQR'),
});

// 4. Ticket Schemas & Messages
export const createTicketSchema = z.object({
  projectId: z.string().optional(),
  subject: z.string().min(2, 'Tiêu đề ticket phải có ít nhất 2 ký tự').optional(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  body: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'low', 'medium', 'high', 'urgent']).optional().default('MEDIUM'),
  initialMessage: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
});

export const addTicketMessageSchema = z.object({
  content: z.string().optional(),
  message: z.string().optional(),
  body: z.string().optional(),
  sender: z.string().optional(),
  senderRole: z.string().optional(),
});

export const sendLiveChatSchema = z.object({
  sessionId: z.string().optional().default('default-session'),
  sender: z.string().optional(),
  senderRole: z.enum(['client', 'cskh', 'system', 'admin', 'tech']).optional().default('client'),
  message: z.string().optional(),
  content: z.string().optional(),
  body: z.string().optional(),
});

// 5. User & FCM Push Notification Token
export const fcmTokenSchema = z.object({
  fcmToken: z.string().min(5, 'FCM Token không hợp lệ').optional(),
  token: z.string().min(5).optional(),
  deviceToken: z.string().min(5).optional(),
  platform: z.string().optional().default('android'),
  deviceInfo: z.string().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TECH_LEAD', 'DEVELOPER', 'CS', 'ACCOUNTING', 'HR', 'CLIENT', 'admin', 'tech', 'cs', 'accounting', 'hr', 'client']),
  department: z.string().optional(),
  departmentTitle: z.string().optional(),
  isDepartmentHead: z.boolean().optional().default(false),
  phone: z.string().optional(),
  skills: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  departmentTitle: z.string().optional(),
  isDepartmentHead: z.boolean().optional(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  hometown: z.string().optional(),
  occupation: z.string().optional(),
  workEnvironment: z.string().optional(),
  skills: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  photoUrl: z.string().optional(),
  avatar: z.string().optional(),
});

export const createInterviewSchema = z.object({
  candidateName: z.string().min(2, 'Tên ứng viên không được để trống'),
  candidateEmail: z.string().email().optional(),
  candidatePhone: z.string().optional(),
  role: z.string().min(2, 'Vị trí ứng tuyển không được để trống'),
  date: z.string().min(1, 'Ngày phỏng vấn không được để trống'),
  time: z.string().min(1, 'Thời gian phỏng vấn không được để trống'),
  interviewer: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Confirmed', 'Re-Scheduled', 'Completed', 'Cancelled']).optional().default('Confirmed'),
});

// 6. Notification Schema
export const createNotificationSchema = z.object({
  type: z.enum(['SYSTEM', 'PROJECT', 'PAYMENT', 'TICKET', 'HR']).default('SYSTEM'),
  title: z.string().min(2),
  subject: z.string().optional(),
  content: z.string().optional(),
  body: z.string().optional(),
  message: z.string().optional(),
  targetDept: z.enum(['ALL', 'ACCOUNTING', 'TECH', 'HR', 'CSKH', 'CLIENT', 'CS']).default('ALL'),
  targetUserId: z.string().optional(),
});
