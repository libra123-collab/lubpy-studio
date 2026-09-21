import { pgTable, serial, text, integer, bigint, timestamp, boolean } from 'drizzle-orm/pg-core';

// 1. USERS TABLE
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // e.g. 'usr_admin_01'
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('CLIENT'), // 'SUPER_ADMIN' | 'ADMIN' | 'TECH_LEAD' | 'DEVELOPER' | 'CS' | 'ACCOUNTING' | 'HR' | 'CLIENT'
  isDepartmentHead: boolean('is_department_head').default(false),
  department: text('department'),
  departmentTitle: text('department_title'),
  phone: text('phone'),
  dob: text('dob'),
  hometown: text('hometown'),
  avatar: text('avatar'),
  photoUrl: text('photo_url'),
  occupation: text('occupation'),
  workEnvironment: text('work_environment'),
  experience: text('experience'),
  competence: text('competence'),
  skills: text('skills'),
  careerGoals: text('career_goals'),
  status: text('status').notNull().default('active'), // 'active' | 'inactive' | 'suspended'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. PROJECTS TABLE
export const projects = pgTable('projects', {
  id: text('id').primaryKey(), // e.g. 'PRJ-2401'
  projectCode: text('project_code'),
  clientId: text('client_id'),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email'),
  clientPhone: text('client_phone'),
  title: text('title').notNull(),
  description: text('description'),
  projectType: text('project_type'),
  techStack: text('tech_stack'), // JSON array string e.g. "[\"React\", \"Node.js\"]"
  deadline: text('deadline'),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'ASSIGNED' | 'DEPOSIT_50' | 'CODING' | 'REVIEW' | 'PAID_100' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  progress: integer('progress').default(0),
  priceVnd: bigint('price_vnd', { mode: 'number' }).default(0),
  depositAmount: bigint('deposit_amount', { mode: 'number' }).default(0),
  remainingAmount: bigint('remaining_amount', { mode: 'number' }).default(0),
  devCommissionRate: integer('dev_commission_rate').default(65), // 65%
  assignedDevId: text('assigned_dev_id'),
  assignedDevName: text('assigned_dev_name'),
  assignedCsId: text('assigned_cs_id'),
  assignedCsName: text('assigned_cs_name'),
  thumbnailUrl: text('thumbnail_url'),
  feedback: text('feedback'),
  documents: text('documents'), // JSON array of { name, url, uploadedAt, isLocked }
  reports: text('reports'), // JSON array of { author, content, timestamp }
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  deliveredAt: timestamp('delivered_at'),
});

// 3. PROJECT ASSIGNMENTS TABLE
export const projectAssignments = pgTable('project_assignments', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  role: text('role').notNull(), // 'DEVELOPER' | 'TECH_LEAD' | 'CS'
  assignedBy: text('assigned_by').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
});

// 4. PROJECT STATUS HISTORY
export const projectStatusHistory = pgTable('project_status_history', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  oldStatus: text('old_status').notNull(),
  newStatus: text('new_status').notNull(),
  changedBy: text('changed_by').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. TRANSACTIONS TABLE
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  transactionCode: text('transaction_code'),
  projectId: text('project_id'),
  projectName: text('project_name'),
  type: text('type').notNull(), // 'PROJECT_DEPOSIT' | 'FINAL_PAYMENT' | 'DEVELOPER_PAYOUT' | 'REFUND' | 'EXPENSE'
  amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
  senderName: text('sender_name'),
  receiverName: text('receiver_name'),
  status: text('status').notNull().default('completed'), // 'completed' | 'pending' | 'failed' | 'refunded'
  note: text('note'),
  createdBy: text('created_by'),
  confirmedBy: text('confirmed_by'),
  createdAt: timestamp('created_at').defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
});

// 6. CSKH TICKETS & MESSAGES
export const tickets = pgTable('tickets', {
  id: text('id').primaryKey(), // e.g. 'TCK-701'
  ticketCode: text('ticket_code'),
  clientId: text('client_id'),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email'),
  clientPhone: text('client_phone'),
  projectId: text('project_id'),
  subject: text('subject').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('MEDIUM'), // 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: text('status').notNull().default('OPEN'), // 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'RESOLVED' | 'CLOSED'
  assignedCs: text('assigned_cs'),
  messages: text('messages'), // JSON array of messages
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// 7. LIVE CHATS TABLE
export const liveChats = pgTable('live_chats', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(), // e.g. 'chat-client-1'
  senderId: text('sender_id'),
  sender: text('sender').notNull(),
  senderRole: text('sender_role').notNull(), // 'client' | 'cskh' | 'system'
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. HR INTERVIEWS TABLE
export const interviews = pgTable('interviews', {
  id: text('id').primaryKey(), // e.g. 'int-1'
  candidateName: text('candidate_name').notNull(),
  candidateEmail: text('candidate_email'),
  candidatePhone: text('candidate_phone'),
  role: text('role').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  status: text('status').notNull().default('Confirmed'), // 'Confirmed' | 'Re-Scheduled' | 'Completed' | 'Cancelled'
  interviewer: text('interviewer'),
  notes: text('notes'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. PROJECT FILES & REPOSITORY
export const projectFiles = pgTable('project_files', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'), // 'source_code' | 'document' | 'database' | 'slide'
  fileSize: integer('file_size'),
  uploadedBy: text('uploaded_by'),
  isLocked: boolean('is_locked').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. NOTIFICATIONS TABLE
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  type: text('type').notNull().default('SYSTEM'), // 'SYSTEM' | 'PROJECT' | 'PAYMENT' | 'TICKET' | 'HR'
  title: text('title').notNull(),
  content: text('content').notNull(),
  targetDept: text('target_dept').notNull().default('ALL'), // 'ALL' | 'ACCOUNTING' | 'TECH' | 'HR' | 'CSKH' | 'CLIENT'
  targetUserId: text('target_user_id'),
  isRead: text('is_read').default('false'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. AUDIT LOGS TABLE
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(), // 'LOGIN' | 'LOGOUT' | 'CREATE_PROJECT' | 'UPDATE_PROJECT_STATUS' | 'CONFIRM_PAYMENT' | etc.
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  userId: text('user_id'),
  userName: text('user_name'),
  userRole: text('user_role'),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. SERVER LOGS
export const serverLogs = pgTable('server_logs', {
  id: serial('id').primaryKey(),
  serverName: text('server_name').notNull(),
  logLevel: text('log_level').notNull().default('INFO'), // 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM'
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. OTP CODES TABLE
export const otpCodes = pgTable('otp_codes', {
  id: serial('id').primaryKey(),
  target: text('target').notNull(), // email or phone
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
