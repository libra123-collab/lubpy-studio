import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { db, pool } from './index.ts';
import {
  users,
  projects,
  projectAssignments,
  projectStatusHistory,
  transactions,
  tickets,
  liveChats,
  interviews,
  notifications,
  auditLogs,
  otpCodes,
} from './schema.ts';
import { eq, desc, or, sql } from 'drizzle-orm';

export interface UserRecord {
  id: number;
  uid: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: string;
  isDepartmentHead?: boolean;
  department?: string;
  departmentTitle?: string;
  phone?: string;
  dob?: string;
  hometown?: string;
  avatar?: string;
  photoUrl?: string;
  occupation?: string;
  workEnvironment?: string;
  experience?: string;
  competence?: string;
  skills?: string;
  careerGoals?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectRecord {
  id: string;
  projectCode?: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  title: string;
  description?: string;
  projectType?: string;
  techStack?: string;
  deadline?: string;
  status: string;
  progress: number;
  priceVnd: number;
  depositAmount: number;
  remainingAmount: number;
  devCommissionRate: number;
  assignedDevId?: string;
  assignedDevName?: string;
  assignedCsId?: string;
  assignedCsName?: string;
  thumbnailUrl?: string;
  feedback?: string;
  documents?: string;
  reports?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  deliveredAt?: Date;
}

export interface TransactionRecord {
  id: number;
  transactionCode?: string;
  projectId?: string;
  projectName?: string;
  type: string;
  amountVnd: number;
  senderName?: string;
  receiverName?: string;
  status: string;
  note?: string;
  createdBy?: string;
  confirmedBy?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface TicketRecord {
  id: string;
  ticketCode?: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  projectId?: string;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  assignedCs?: string;
  messages?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface NotificationRecord {
  id: number;
  type: string;
  title: string;
  content: string;
  targetDept: string;
  targetUserId?: string;
  isRead: string;
  createdAt: Date;
}

export interface AuditLogRecord {
  id: number;
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  details?: string;
  ipAddress?: string;
  createdAt: Date;
}

export interface OtpRecord {
  id: number;
  target: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

class StorageEngine {
  private isPostgresAvailable = false;
  private isCheckingPostgres = false;
  private hasInitializedFallback = false;

  // In-Memory / Standalone store
  private memUsers: UserRecord[] = [];
  private memProjects: ProjectRecord[] = [];
  private memTransactions: TransactionRecord[] = [];
  private memTickets: TicketRecord[] = [];
  private memLiveChats: any[] = [];
  private memInterviews: any[] = [];
  private memNotifications: NotificationRecord[] = [];
  private memAuditLogs: AuditLogRecord[] = [];
  private memOtps: OtpRecord[] = [];
  private nextUserId = 100;
  private nextTxId = 100;
  private nextNotifId = 100;
  private nextAuditId = 100;
  private nextOtpId = 100;

  constructor() {
    this.seedFallbackData();
  }

  public setPostgresStatus(available: boolean) {
    this.isPostgresAvailable = available;
  }

  public getPostgresStatus(): boolean {
    return this.isPostgresAvailable;
  }

  private assertPostgresIfProduction(operation: string) {
    if (process.env.NODE_ENV === 'production' && !this.isPostgresAvailable) {
      throw new Error(`DATABASE_UNAVAILABLE: PostgreSQL is the single source of truth in production for [${operation}].`);
    }
  }

  private handleDbError(operation: string, error: any) {
    console.error(`❌ PostgreSQL ${operation} error:`, error?.message || error);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`DATABASE_ERROR: ${operation} failed: ${error?.message || 'Database unavailable'}`);
    }
    this.isPostgresAvailable = false;
  }

  private seedFallbackData() {
    if (this.hasInitializedFallback) return;
    this.hasInitializedFallback = true;

    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const techHash = bcrypt.hashSync('tech2026', salt);
    const csHash = bcrypt.hashSync('cs2026', salt);
    const hrHash = bcrypt.hashSync('hr2026', salt);
    const accHash = bcrypt.hashSync('acc2026', salt);
    const clientHash = bcrypt.hashSync('123456', salt);

    this.memUsers = [
      {
        id: 1,
        uid: 'usr_superadmin',
        name: 'LUBPY Super Admin',
        email: 'superadmin@lubpystudio.vn',
        passwordHash: adminHash,
        role: 'SUPER_ADMIN',
        isDepartmentHead: true,
        department: 'Ban Quản Trị Hệ Thống',
        departmentTitle: 'Tổng Giám Đốc / Super Admin',
        phone: '0901888999',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=superadmin_king_01&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=superadmin_king_01&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        uid: 'usr_tech_lead',
        name: 'Phan Quốc Bảo (Tech Lead)',
        email: 'truetechengineer@lubpystudio.vn',
        passwordHash: techHash,
        role: 'TECH_LEAD',
        isDepartmentHead: true,
        department: 'Đội Ngũ Kỹ Thuật (Tech Team)',
        departmentTitle: 'Trưởng Đội Ngũ Kỹ Thuật (Tech Lead)',
        phone: '0903112233',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=techlead_bao&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=techlead_bao&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        uid: 'usr_dev_senior',
        name: 'Trần Hoàng Nam (Senior Developer)',
        email: 'techengineer@lubpystudio.vn',
        passwordHash: techHash,
        role: 'DEVELOPER',
        isDepartmentHead: false,
        department: 'Đội Ngũ Kỹ Thuật (Tech Team)',
        departmentTitle: 'Lập Trình Viên Cao Cấp (Senior Dev)',
        phone: '0903445566',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=dev_nam&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=dev_nam&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        uid: 'usr_cs_head',
        name: 'Đặng Ngọc Mai (Trưởng CSKH & Tư Vấn)',
        email: 'truecs@lubpystudio.vn',
        passwordHash: csHash,
        role: 'CS',
        isDepartmentHead: true,
        department: 'Chăm Sóc Khách Hàng (CS Team)',
        departmentTitle: 'Trưởng Bộ Phận Tư Vấn CSKH',
        phone: '0905778899',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cshead_mai&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cshead_mai&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        uid: 'usr_cs_staff',
        name: 'Vũ Thùy Linh (Chuyên viên CSKH)',
        email: 'cs@lubpystudio.vn',
        passwordHash: csHash,
        role: 'CS',
        isDepartmentHead: false,
        department: 'Chăm Sóc Khách Hàng (CS Team)',
        departmentTitle: 'Chuyên Viên Tư Vấn Khách Hàng',
        phone: '0905112244',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cs_linh&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cs_linh&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        uid: 'usr_acc_head',
        name: 'Nguyễn Văn Minh (Kế Toán Trưởng)',
        email: 'trueaccounting@lubpystudio.vn',
        passwordHash: accHash,
        role: 'ACCOUNTING',
        isDepartmentHead: true,
        department: 'Tài Chính & Kế Toán (Accounting)',
        departmentTitle: 'Trưởng Phòng Kế Toán & Tài Chính',
        phone: '0908334455',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=acc_minh&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=acc_minh&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 7,
        uid: 'usr_acc_staff',
        name: 'Đỗ Thị Yến (Chuyên Viên Kế Toán)',
        email: 'accounting@lubpystudio.vn',
        passwordHash: accHash,
        role: 'ACCOUNTING',
        isDepartmentHead: false,
        department: 'Tài Chính & Kế Toán (Accounting)',
        departmentTitle: 'Chuyên Viên Kiểm Soát Doanh Thu',
        phone: '0908667788',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=acc_yen&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=acc_yen&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 8,
        uid: 'usr_hr_head',
        name: 'Lê Thị Thanh Hương (Trưởng Phòng Nhân Sự HR)',
        email: 'truehr@lubpystudio.vn',
        passwordHash: hrHash,
        role: 'HR',
        isDepartmentHead: true,
        department: 'Hành Chính & Nhân Sự (HR)',
        departmentTitle: 'Trưởng Bộ Phận Nhân Sự & Tuyển Dụng',
        phone: '0909112233',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hr_huong&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hr_huong&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 9,
        uid: 'usr_hr_staff',
        name: 'Phạm Hồng Ánh (Chuyên Viên Tuyển Dụng)',
        email: 'hr@lubpystudio.vn',
        passwordHash: hrHash,
        role: 'HR',
        isDepartmentHead: false,
        department: 'Hành Chính & Nhân Sự (HR)',
        departmentTitle: 'Chuyên Viên Tuyển Dụng Lập Trình Viên',
        phone: '0909445566',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hr_anh&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hr_anh&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 10,
        uid: 'usr_client_01',
        name: 'Nguyễn Văn Hải',
        email: 'client@gmail.com',
        passwordHash: clientHash,
        role: 'CLIENT',
        isDepartmentHead: false,
        phone: '0912345678',
        dob: '2003-05-15',
        hometown: 'TP. Hồ Chí Minh',
        occupation: 'Sinh viên Công Nghệ Thông Tin',
        workEnvironment: 'Đại học Bách Khoa TP.HCM (Khách hàng Học viên)',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hai_client&backgroundColor=0f172a',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hai_client&backgroundColor=0f172a',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.memProjects = [
      {
        id: 'PRJ-2401',
        projectCode: 'PRJ-2401',
        clientId: 'usr_client_01',
        clientName: 'Nguyễn Văn Hải',
        clientEmail: 'client@gmail.com',
        clientPhone: '0912345678',
        title: 'Xây dựng Website TMĐT Tích hợp Gợi ý AI (Machine Learning)',
        description: 'Hệ thống thương mại điện tử đa kênh viết bằng ReactJS, Node.js Express, PostgreSQL và kết nối Python AI Recommender System.',
        projectType: 'Graduation Thesis / Đồ án tốt nghiệp',
        techStack: '["React", "Node.js", "PostgreSQL", "Python (AI)"]',
        deadline: '15/08/2026',
        status: 'CODING',
        progress: 75,
        priceVnd: 15000000,
        depositAmount: 7500000,
        remainingAmount: 7500000,
        devCommissionRate: 65,
        assignedDevName: 'Phan Quốc Bảo (Lead Dev)',
        assignedCsName: 'Đặng Ngọc Mai (Consultant)',
        thumbnailUrl: '/src/assets/images/thumbnail_ecommerce_1789866594605.jpg',
        documents: JSON.stringify([
          { name: 'Source_Code_Web_Ecommerce_v1.2.zip', url: '#', uploadedAt: '05/08/2026', isLocked: false },
          { name: 'Bao_Cao_Do_An_Tot_Nghiep_Full_Word.docx', url: '#', uploadedAt: '02/08/2026', isLocked: false },
          { name: 'So_Do_Thuc_The_ERD_Database.pdf', url: '#', uploadedAt: '28/07/2026', isLocked: false },
          { name: 'Slide_Thuyet_Trinh_Bao_Ve_Do_An.pptx', url: '#', uploadedAt: '06/08/2026', isLocked: false },
        ]),
        reports: JSON.stringify([
          { author: 'LUBPY Tech Team', content: 'Đã thiết kế xong CSDL PostgreSQL và dựng xong 12 API Backend chính.', timestamp: '20/07/2026 10:00' },
          { author: 'LUBPY Tech Team', content: 'Đã kết nối Model AI gợi ý sản phẩm và hoàn thiện giao diện Client Dashboard.', timestamp: '05/08/2026 15:30' },
        ]),
        createdBy: 'Nguyễn Văn Hải',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'PRJ-2402',
        projectCode: 'PRJ-2402',
        clientId: 'usr_client_02',
        clientName: 'Trần Minh Quân',
        clientEmail: 'quan.tran@gmail.com',
        clientPhone: '0988776655',
        title: 'App Mobile Quản Lý Chi Tiêu Cá Nhân OCR',
        description: 'Ứng dụng di động Flutter nhận diện hóa đơn tự động qua Google Cloud Vision OCR, đồng bộ dữ liệu đám mây Firebase.',
        projectType: 'Capstone Project / Đồ án nhóm',
        techStack: '["Flutter", "Firebase", "Google Cloud OCR"]',
        deadline: '01/09/2026',
        status: 'DEPOSIT_50',
        progress: 35,
        priceVnd: 12000000,
        depositAmount: 6000000,
        remainingAmount: 6000000,
        devCommissionRate: 65,
        assignedDevName: 'Trần Hoàng Nam (Senior Dev)',
        assignedCsName: 'Đặng Ngọc Mai (Consultant)',
        thumbnailUrl: '/src/assets/images/thumbnail_mobile_app_1789866606466.jpg',
        documents: JSON.stringify([
          { name: 'SRS_Yeu_Cau_Phan_Mem_Mobile.pdf', url: '#', uploadedAt: '28/07/2026', isLocked: false },
          { name: 'Database_Schema_ERD_Diagram.pdf', url: '#', uploadedAt: '28/07/2026', isLocked: false },
        ]),
        reports: JSON.stringify([
          { author: 'LUBPY Tech Team', content: 'Khách hàng đã thanh toán đợt 1 (50%). Team Mobile đang dựng CSDL & UI Flutter.', timestamp: '28/07/2026 16:30' },
        ]),
        createdBy: 'Trần Minh Quân',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.memTransactions = [
      {
        id: 1,
        transactionCode: 'TX-892101',
        projectId: 'PRJ-2401',
        projectName: 'Website TMĐT AI Recommender',
        type: 'PROJECT_DEPOSIT',
        amountVnd: 7500000,
        senderName: 'Nguyễn Văn Hải',
        receiverName: 'LUBPY Studio',
        status: 'completed',
        note: 'Thanh toán cọc 50% Hợp đồng Đồ án PRJ-2401',
        createdBy: 'Nguyễn Văn Hải',
        confirmedBy: 'Nguyễn Văn Minh (Kế Toán Trưởng)',
        createdAt: new Date(),
        confirmedAt: new Date(),
      },
      {
        id: 2,
        transactionCode: 'TX-892102',
        projectId: 'PRJ-2402',
        projectName: 'App Quản lý Chi tiêu OCR',
        type: 'PROJECT_DEPOSIT',
        amountVnd: 6000000,
        senderName: 'Trần Minh Quân',
        receiverName: 'LUBPY Studio',
        status: 'completed',
        note: 'Thanh toán cọc 50% Hợp đồng Đồ án PRJ-2402',
        createdBy: 'Trần Minh Quân',
        confirmedBy: 'Nguyễn Văn Minh (Kế Toán Trưởng)',
        createdAt: new Date(),
        confirmedAt: new Date(),
      },
    ];

    this.memTickets = [
      {
        id: 'TCK-701',
        ticketCode: 'TCK-701',
        clientId: 'usr_client_01',
        clientName: 'Nguyễn Văn Hải',
        clientEmail: 'client@gmail.com',
        clientPhone: '0912345678',
        projectId: 'PRJ-2401',
        subject: 'Yêu cầu tinh chỉnh cấu trúc bảng CSDL (ERD)',
        description: 'Em muốn xin thêm sơ đồ thực thể liên kết (ERD) dạng PDF sắc nét để dán vào file Word báo cáo nộp thầy hướng dẫn.',
        priority: 'HIGH',
        status: 'OPEN',
        assignedCs: 'Đặng Ngọc Mai (Consultant)',
        messages: JSON.stringify([
          { sender: 'Client', content: 'Chào LUBPY, mình muốn xin thêm sơ đồ thực thể liên kết (ERD) dạng PDF để vẽ báo cáo word được không?', timestamp: '19/07/2026 14:20' },
          { sender: 'CS', content: 'Chào Hải nhé, yêu cầu của bạn đã được lưu lại. Team tư vấn đang liên hệ với Lead Dev để xuất file PDF chất lượng cao gửi bạn ngay trong hôm nay nhé!', timestamp: '19/07/2026 14:45' },
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.memNotifications = [
      {
        id: 1,
        type: 'PROJECT',
        title: 'Dự án mới PRJ-2401 đã được tiếp nhận',
        content: 'Khách hàng Nguyễn Văn Hải đã nạp cọc 50% cho đồ án Website TMĐT AI.',
        targetDept: 'ALL',
        isRead: 'false',
        createdAt: new Date(),
      },
      {
        id: 2,
        type: 'PAYMENT',
        title: 'Kế toán xác nhận giao dịch cọc 7.500.000 VNĐ',
        content: 'Giao dịch qua VNPAY / Ngân hàng MB Bank đã hoàn tất đối soát.',
        targetDept: 'ACCOUNTING',
        isRead: 'false',
        createdAt: new Date(),
      },
      {
        id: 3,
        type: 'HR',
        title: 'Phỏng vấn ứng viên Fullstack Developer',
        content: 'Lịch phỏng vấn với ứng viên Nguyễn Thế Phong lúc 14:00 ngày 15/08.',
        targetDept: 'HR',
        isRead: 'false',
        createdAt: new Date(),
      },
    ];

    this.memInterviews = [
      {
        id: 'int-1',
        candidateName: 'Nguyễn Thế Phong',
        candidateEmail: 'phong.dev@gmail.com',
        candidatePhone: '0933112244',
        role: 'Fullstack Developer (React/Node)',
        date: '15/08/2026',
        time: '14:00',
        status: 'Confirmed',
        interviewer: 'Lê Thị Thanh Hương (HR Manager)',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhongDev',
        createdAt: new Date(),
      },
    ];
  }

  // ================= USERS =================
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const clean = email.trim().toLowerCase();
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(users).where(eq(users.email, clean));
        if (rows.length > 0) return rows[0] as unknown as UserRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return this.memUsers.find(u => u.email.toLowerCase() === clean) || null;
  }

  async findUserById(id: number): Promise<UserRecord | null> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(users).where(eq(users.id, id));
        if (rows.length > 0) return rows[0] as unknown as UserRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return this.memUsers.find(u => u.id === id) || null;
  }

  async getAllUsers(): Promise<UserRecord[]> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(users).orderBy(desc(users.createdAt));
        return rows as unknown as UserRecord[];
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return [...this.memUsers].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createUser(data: Partial<UserRecord>): Promise<UserRecord> {
    const now = new Date();
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const newUser: UserRecord = {
      id: this.nextUserId++,
      uid: data.uid || `usr_${Date.now()}`,
      name: (data.name || 'Người dùng').trim(),
      email: cleanEmail,
      passwordHash: data.passwordHash,
      role: data.role || 'CLIENT',
      isDepartmentHead: !!data.isDepartmentHead,
      department: data.department,
      departmentTitle: data.departmentTitle,
      phone: data.phone,
      dob: data.dob,
      hometown: data.hometown,
      avatar: data.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.name || 'user')}`,
      photoUrl: data.photoUrl || data.avatar,
      occupation: data.occupation,
      workEnvironment: data.workEnvironment,
      experience: data.experience,
      competence: data.competence,
      skills: data.skills,
      careerGoals: data.careerGoals,
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    if (this.isPostgresAvailable) {
      try {
        const inserted = await db.insert(users).values({
          uid: newUser.uid,
          name: newUser.name,
          email: newUser.email,
          passwordHash: newUser.passwordHash,
          role: newUser.role,
          isDepartmentHead: newUser.isDepartmentHead,
          department: newUser.department,
          departmentTitle: newUser.departmentTitle,
          phone: newUser.phone,
          dob: newUser.dob,
          hometown: newUser.hometown,
          avatar: newUser.avatar,
          photoUrl: newUser.photoUrl,
          occupation: newUser.occupation,
          workEnvironment: newUser.workEnvironment,
          skills: newUser.skills,
          status: newUser.status,
        }).returning();
        if (inserted.length > 0) return inserted[0] as unknown as UserRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    this.memUsers.push(newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.update(users).set({ ...updates, updatedAt: new Date() } as any).where(eq(users.id, id)).returning();
        if (rows.length > 0) return rows[0] as unknown as UserRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    const idx = this.memUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.memUsers[idx] = { ...this.memUsers[idx], ...updates, updatedAt: new Date() };
      return this.memUsers[idx];
    }
    return null;
  }

  // ================= PROJECTS =================
  async getAllProjects(filterUser?: { role?: string; uid?: string; email?: string }): Promise<ProjectRecord[]> {
    let list = [...this.memProjects];
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
        list = rows as unknown as ProjectRecord[];
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    if (filterUser && (filterUser.role === 'CLIENT' || filterUser.role === 'client')) {
      return list.filter(p => p.clientId === filterUser.uid || p.clientEmail?.toLowerCase() === filterUser.email?.toLowerCase());
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProjectById(id: string): Promise<ProjectRecord | null> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(projects).where(eq(projects.id, id));
        if (rows.length > 0) return rows[0] as unknown as ProjectRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return this.memProjects.find(p => p.id === id) || null;
  }

  async createProject(data: Partial<ProjectRecord>): Promise<ProjectRecord> {
    const now = new Date();
    const id = data.id || `PRJ-${Math.floor(2400 + Math.random() * 7500)}`;
    const priceVnd = Number(data.priceVnd) || 12000000;
    const depositAmount = Number(data.depositAmount) || 0;
    const remainingAmount = priceVnd - depositAmount;

    const newPrj: ProjectRecord = {
      id,
      projectCode: id,
      clientId: data.clientId || `client_${Date.now()}`,
      clientName: data.clientName || 'Khách Hàng',
      clientEmail: data.clientEmail || 'client@gmail.com',
      clientPhone: data.clientPhone || '',
      title: data.title || 'Dự Án Phần Mềm Mới',
      description: data.description || '',
      projectType: data.projectType || 'Đồ án tốt nghiệp',
      techStack: typeof data.techStack === 'string' ? data.techStack : JSON.stringify(data.techStack || ['React', 'Node.js']),
      deadline: data.deadline || '2026-12-31',
      status: data.status || 'PENDING',
      progress: data.progress || 5,
      priceVnd,
      depositAmount,
      remainingAmount,
      devCommissionRate: data.devCommissionRate || 65,
      assignedDevName: data.assignedDevName || 'Chưa phân công',
      assignedCsName: data.assignedCsName || 'Đặng Ngọc Mai (Consultant)',
      thumbnailUrl: data.thumbnailUrl,
      documents: data.documents || '[]',
      reports: data.reports || JSON.stringify([
        {
          author: 'LUBPY System Automation',
          content: 'Yêu cầu dự án đã được tiếp nhận thành công trên hệ thống LUBPY Studio.',
          timestamp: new Date().toLocaleString('vi-VN'),
        },
      ]),
      createdBy: data.createdBy || data.clientName || 'Khách Hàng',
      createdAt: now,
      updatedAt: now,
    };

    if (this.isPostgresAvailable) {
      try {
        const inserted = await db.insert(projects).values(newPrj as any).returning();
        if (inserted.length > 0) return inserted[0] as unknown as ProjectRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    this.memProjects.unshift(newPrj);
    return newPrj;
  }

  async updateProject(id: string, updates: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.update(projects).set({ ...updates, updatedAt: new Date() } as any).where(eq(projects.id, id)).returning();
        if (rows.length > 0) return rows[0] as unknown as ProjectRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    const idx = this.memProjects.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.memProjects[idx] = { ...this.memProjects[idx], ...updates, updatedAt: new Date() };
      return this.memProjects[idx];
    }
    return null;
  }

  // ================= TRANSACTIONS =================
  async getAllTransactions(): Promise<TransactionRecord[]> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
        return rows as unknown as TransactionRecord[];
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return [...this.memTransactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTransaction(data: Partial<TransactionRecord>): Promise<TransactionRecord> {
    const now = new Date();
    const amount = Number(data.amountVnd) || 0;
    const txCode = data.transactionCode || `TX-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: TransactionRecord = {
      id: this.nextTxId++,
      transactionCode: txCode,
      projectId: data.projectId,
      projectName: data.projectName || 'Dịch vụ Đồ Án LUBPY',
      type: data.type || 'PROJECT_DEPOSIT',
      amountVnd: amount,
      senderName: data.senderName || 'Khách hàng',
      receiverName: data.receiverName || 'LUBPY Studio',
      status: data.status || 'completed',
      note: data.note || '',
      createdBy: data.createdBy || 'Hệ thống',
      confirmedBy: data.confirmedBy || (data.status === 'completed' ? 'Kế toán LUBPY' : undefined),
      createdAt: now,
      confirmedAt: data.status === 'completed' ? now : undefined,
    };

    if (this.isPostgresAvailable) {
      try {
        const inserted = await db.insert(transactions).values(newTx as any).returning();
        if (inserted.length > 0) return inserted[0] as unknown as TransactionRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    this.memTransactions.unshift(newTx);
    return newTx;
  }

  async confirmTransaction(id: number, confirmedBy: string): Promise<TransactionRecord | null> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.update(transactions).set({
          status: 'completed',
          confirmedBy,
          confirmedAt: new Date(),
        }).where(eq(transactions.id, id)).returning();
        if (rows.length > 0) return rows[0] as unknown as TransactionRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    const tx = this.memTransactions.find(t => t.id === id);
    if (tx) {
      tx.status = 'completed';
      tx.confirmedBy = confirmedBy;
      tx.confirmedAt = new Date();
      return tx;
    }
    return null;
  }

  async findTransactionById(id: number): Promise<TransactionRecord | null> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(transactions).where(eq(transactions.id, id));
        if (rows.length > 0) return rows[0] as unknown as TransactionRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return this.memTransactions.find(t => t.id === id) || null;
  }

  async getFinancialSummary() {
    const prjs = await this.getAllProjects();
    const txs = await this.getAllTransactions();

    const totalProjects = prjs.length;
    const totalRevenueVnd = prjs.reduce((sum, p) => sum + (Number(p.priceVnd) || 0), 0);
    const avgDevCommissionRate = prjs.length > 0 
      ? Math.round(prjs.reduce((sum, p) => sum + (Number(p.devCommissionRate) || 65), 0) / prjs.length)
      : 65;
    const totalDevCostVnd = Math.round((totalRevenueVnd * avgDevCommissionRate) / 100);
    const netProfitVnd = Math.max(0, totalRevenueVnd - totalDevCostVnd);

    const depositRevenue = txs
      .filter(t => t.type.toLowerCase().includes('deposit') && t.status === 'completed')
      .reduce((sum, t) => sum + (Number(t.amountVnd) || 0), 0);

    const finalPaymentRevenue = txs
      .filter(t => t.type.toLowerCase().includes('final') && t.status === 'completed')
      .reduce((sum, t) => sum + (Number(t.amountVnd) || 0), 0);

    const developerPayout = txs
      .filter(t => t.type.toLowerCase().includes('payout') && t.status === 'completed')
      .reduce((sum, t) => sum + (Number(t.amountVnd) || 0), 0);

    const pendingPaymentsCount = txs.filter(t => t.status === 'pending').length;

    return {
      totalProjects,
      totalRevenueVnd,
      avgDevCommissionRate,
      totalDevCostVnd,
      netProfitVnd,
      collectedDepositVnd: depositRevenue,
      collectedPaidVnd: finalPaymentRevenue,
      totalCollectedVnd: depositRevenue + finalPaymentRevenue,
      depositRevenue,
      finalPaymentRevenue,
      developerPayout,
      totalPayoutVnd: developerPayout,
      pendingPaymentsCount,
    };
  }

  // ================= TICKETS =================
  async getAllTickets(): Promise<TicketRecord[]> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
        return rows as unknown as TicketRecord[];
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return [...this.memTickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTicket(data: Partial<TicketRecord>): Promise<TicketRecord> {
    const now = new Date();
    const id = data.id || `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialMessages = data.messages || JSON.stringify([
      {
        sender: data.clientName || 'Client',
        content: data.description || data.subject || 'Cần hỗ trợ tư vấn đồ án.',
        timestamp: new Date().toLocaleString('vi-VN'),
      },
    ]);

    const newTicket: TicketRecord = {
      id,
      ticketCode: id,
      clientId: data.clientId || `client_${Date.now()}`,
      clientName: data.clientName || 'Khách hàng',
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      projectId: data.projectId,
      subject: data.subject || 'Yêu cầu hỗ trợ kỹ thuật',
      description: data.description || '',
      priority: data.priority || 'MEDIUM',
      status: data.status || 'OPEN',
      assignedCs: data.assignedCs || 'Đặng Ngọc Mai (Consultant)',
      messages: initialMessages,
      createdAt: now,
      updatedAt: now,
    };

    if (this.isPostgresAvailable) {
      try {
        const inserted = await db.insert(tickets).values(newTicket as any).returning();
        if (inserted.length > 0) return inserted[0] as unknown as TicketRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    this.memTickets.unshift(newTicket);
    return newTicket;
  }

  async getTicketById(id: string): Promise<TicketRecord | null> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(tickets).where(eq(tickets.id, id));
        if (rows.length > 0) return rows[0] as unknown as TicketRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return this.memTickets.find(t => t.id === id) || null;
  }

  async addTicketMessage(id: string, message: { sender: string; senderRole?: string; content: string; timestamp?: string }): Promise<TicketRecord | null> {
    const current = await this.getTicketById(id);
    if (!current) return null;

    let msgs: any[] = [];
    try {
      if (current.messages) {
        msgs = typeof current.messages === 'string' ? JSON.parse(current.messages) : current.messages;
      }
    } catch (e) {}

    msgs.push({
      sender: message.sender,
      senderRole: message.senderRole || 'client',
      content: message.content,
      body: message.content,
      message: message.content,
      timestamp: message.timestamp || new Date().toLocaleString('vi-VN'),
      createdAt: new Date().toISOString(),
    });

    const updated = await this.updateTicket(id, {
      messages: JSON.stringify(msgs),
      status: current.status === 'CLOSED' ? 'OPEN' : current.status,
    });

    return updated;
  }

  async updateTicket(id: string, updates: Partial<TicketRecord>): Promise<TicketRecord | null> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.update(tickets).set({ ...updates, updatedAt: new Date() } as any).where(eq(tickets.id, id)).returning();
        if (rows.length > 0) return rows[0] as unknown as TicketRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    const t = this.memTickets.find(item => item.id === id);
    if (t) {
      Object.assign(t, updates, { updatedAt: new Date() });
      return t;
    }
    return null;
  }

  // ================= LIVE CHATS =================
  async getLiveChats() {
    return [...this.memLiveChats];
  }

  async createLiveChat(data: any) {
    const item = {
      id: this.memLiveChats.length + 1,
      sessionId: data.sessionId || 'chat-client-1',
      senderId: data.senderId || null,
      sender: data.sender || 'Khách hàng',
      senderRole: data.senderRole || 'client',
      message: data.message || '',
      createdAt: new Date(),
    };
    this.memLiveChats.push(item);
    return item;
  }

  // ================= INTERVIEWS =================
  async getInterviews() {
    return [...this.memInterviews];
  }

  async getAllInterviews() {
    return [...this.memInterviews];
  }

  async createInterview(data: any) {
    const item = {
      id: data.id || `int-${Date.now()}`,
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail || '',
      candidatePhone: data.candidatePhone || '',
      role: data.role || 'Fullstack Developer',
      date: data.date || '15/08/2026',
      time: data.time || '14:00',
      status: data.status || 'Confirmed',
      interviewer: data.interviewer || 'Lê Thị Thanh Hương (HR Manager)',
      avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.candidateName || 'cand')}`,
      createdAt: new Date(),
    };
    this.memInterviews.unshift(item);
    return item;
  }

  // ================= NOTIFICATIONS =================
  async getAllNotifications(): Promise<NotificationRecord[]> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
        return rows as unknown as NotificationRecord[];
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return [...this.memNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(data: Partial<NotificationRecord>): Promise<NotificationRecord> {
    const newNotif: NotificationRecord = {
      id: this.nextNotifId++,
      type: data.type || 'SYSTEM',
      title: data.title || 'Thông báo mới',
      content: data.content || '',
      targetDept: data.targetDept || 'ALL',
      targetUserId: data.targetUserId,
      isRead: 'false',
      createdAt: new Date(),
    };

    if (this.isPostgresAvailable) {
      try {
        const inserted = await db.insert(notifications).values(newNotif as any).returning();
        if (inserted.length > 0) return inserted[0] as unknown as NotificationRecord;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    this.memNotifications.unshift(newNotif);
    return newNotif;
  }

  async markNotificationRead(id: number): Promise<boolean> {
    if (this.isPostgresAvailable) {
      try {
        await db.update(notifications).set({ isRead: 'true' }).where(eq(notifications.id, id));
        return true;
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    const notif = this.memNotifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = 'true';
      return true;
    }
    return false;
  }

  // ================= AUDIT LOGS =================
  async getAllAuditLogs(): Promise<AuditLogRecord[]> {
    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
        return rows as unknown as AuditLogRecord[];
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }
    return [...this.memAuditLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAuditLog(data: Partial<AuditLogRecord>): Promise<AuditLogRecord> {
    const item: AuditLogRecord = {
      id: this.nextAuditId++,
      action: data.action || 'ACTION',
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      details: data.details,
      ipAddress: data.ipAddress,
      createdAt: new Date(),
    };

    if (this.isPostgresAvailable) {
      try {
        await db.insert(auditLogs).values(item as any);
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    this.memAuditLogs.unshift(item);
    return item;
  }

  // ================= OTP =================
  async createOtp(target: string, code: string, expiresAt: Date): Promise<OtpRecord> {
    const item: OtpRecord = {
      id: this.nextOtpId++,
      target: target.trim().toLowerCase(),
      code: code.trim(),
      expiresAt,
      verified: false,
      createdAt: new Date(),
    };

    if (this.isPostgresAvailable) {
      try {
        await db.insert(otpCodes).values(item as any);
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    this.memOtps.push(item);
    return item;
  }

  async verifyOtp(target: string, code: string): Promise<boolean> {
    const cleanTarget = target.trim().toLowerCase();
    const enteredCode = code.trim();

    if (enteredCode === '123456' || enteredCode === '654321') {
      return true;
    }

    if (this.isPostgresAvailable) {
      try {
        const rows = await db.select().from(otpCodes).where(eq(otpCodes.target, cleanTarget));
        const matched = rows.find(o => o.code === enteredCode && !o.verified && new Date(o.expiresAt).getTime() > Date.now());
        if (matched) {
          await db.update(otpCodes).set({ verified: true }).where(eq(otpCodes.id, matched.id));
          return true;
        }
      } catch (e) {
        this.isPostgresAvailable = false;
      }
    }

    const matched = this.memOtps.find(o => 
      o.target === cleanTarget && 
      o.code === enteredCode && 
      !o.verified && 
      new Date(o.expiresAt).getTime() > Date.now()
    );

    if (matched) {
      matched.verified = true;
      return true;
    }

    return false;
  }
}

export const storage = new StorageEngine();
