import bcrypt from 'bcryptjs';
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
  projectFiles,
  notifications,
  auditLogs,
  otpCodes,
} from './schema.ts';
import { eq, desc, and, or, sql } from 'drizzle-orm';

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

export interface ProjectAssignmentRecord {
  id: number;
  projectId: string;
  userId: string;
  userName: string;
  role: string;
  assignedBy: string;
  assignedAt: Date;
}

export interface ProjectStatusHistoryRecord {
  id: number;
  projectId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  reason?: string;
  createdAt: Date;
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

export interface ProjectFileRecord {
  id: number;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  uploadedBy?: string;
  isLocked: boolean;
  createdAt: Date;
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

export interface InterviewRecord {
  id: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  role: string;
  date: string;
  time: string;
  status: string;
  interviewer?: string;
  notes?: string;
  avatar?: string;
  createdAt: Date;
}

export class DatabaseError extends Error {
  constructor(operation: string, originalError?: any) {
    const details = originalError?.message || String(originalError || 'Unknown error');
    super(`DATABASE_ERROR [${operation}]: ${details}`);
    this.name = 'DatabaseError';
  }
}

class StorageEngine {
  private isPostgresAvailable = true;

  public setPostgresStatus(available: boolean) {
    this.isPostgresAvailable = available;
  }

  public getPostgresStatus(): boolean {
    return this.isPostgresAvailable;
  }

  private ensurePostgres(operation: string) {
    if (!this.isPostgresAvailable) {
      throw new Error(`DATABASE_UNAVAILABLE: PostgreSQL is the single source of truth for [${operation}]. Check PostgreSQL connection.`);
    }
  }

  // =========================================================================
  // 1. USERS CRUD
  // =========================================================================
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const clean = email.trim().toLowerCase();
    this.ensurePostgres('findUserByEmail');
    try {
      const rows = await db.select().from(users).where(eq(users.email, clean)).limit(1);
      return (rows[0] as unknown as UserRecord) || null;
    } catch (err: any) {
      console.error(`findUserByEmail error (${clean}):`, err.message);
      throw new DatabaseError('findUserByEmail', err);
    }
  }

  async findUserById(id: number): Promise<UserRecord | null> {
    this.ensurePostgres('findUserById');
    try {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return (rows[0] as unknown as UserRecord) || null;
    } catch (err: any) {
      console.error(`findUserById error (${id}):`, err.message);
      throw new DatabaseError('findUserById', err);
    }
  }

  async getAllUsers(): Promise<UserRecord[]> {
    this.ensurePostgres('getAllUsers');
    try {
      const rows = await db.select().from(users).orderBy(desc(users.createdAt));
      return rows as unknown as UserRecord[];
    } catch (err: any) {
      console.error('getAllUsers error:', err.message);
      throw new DatabaseError('getAllUsers', err);
    }
  }

  async createUser(data: Partial<UserRecord>): Promise<UserRecord> {
    this.ensurePostgres('createUser');
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const uid = data.uid || `usr_${Date.now()}`;
    const name = (data.name || 'Người dùng').trim();
    const avatar = data.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

    try {
      const inserted = await db.insert(users).values({
        uid,
        name,
        email: cleanEmail,
        passwordHash: data.passwordHash,
        role: data.role || 'CLIENT',
        isDepartmentHead: !!data.isDepartmentHead,
        department: data.department || null,
        departmentTitle: data.departmentTitle || null,
        phone: data.phone || null,
        dob: data.dob || null,
        hometown: data.hometown || null,
        avatar,
        photoUrl: data.photoUrl || avatar,
        occupation: data.occupation || null,
        workEnvironment: data.workEnvironment || null,
        experience: data.experience || null,
        competence: data.competence || null,
        skills: data.skills || null,
        careerGoals: data.careerGoals || null,
        status: data.status || 'active',
      } as any).returning();

      return inserted[0] as unknown as UserRecord;
    } catch (err: any) {
      console.error('createUser error:', err.message);
      throw new DatabaseError('createUser', err);
    }
  }

  async updateUser(id: number, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    this.ensurePostgres('updateUser');
    try {
      const updatePayload: any = { ...updates, updatedAt: new Date() };
      delete updatePayload.id; // Prevent updating primary key

      const rows = await db.update(users).set(updatePayload).where(eq(users.id, id)).returning();
      return (rows[0] as unknown as UserRecord) || null;
    } catch (err: any) {
      console.error(`updateUser error (${id}):`, err.message);
      throw new DatabaseError('updateUser', err);
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    this.ensurePostgres('deleteUser');
    try {
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (err: any) {
      console.error(`deleteUser error (${id}):`, err.message);
      throw new DatabaseError('deleteUser', err);
    }
  }

  // =========================================================================
  // 2. PROJECTS CRUD
  // =========================================================================
  async getAllProjects(filterUser?: { role?: string; uid?: string; email?: string }): Promise<ProjectRecord[]> {
    this.ensurePostgres('getAllProjects');
    try {
      const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
      let list = rows as unknown as ProjectRecord[];

      if (filterUser && (filterUser.role?.toUpperCase() === 'CLIENT' || filterUser.role?.toLowerCase() === 'client')) {
        list = list.filter(p =>
          (filterUser.uid && p.clientId === filterUser.uid) ||
          (filterUser.email && p.clientEmail?.toLowerCase() === filterUser.email.toLowerCase())
        );
      }

      return list;
    } catch (err: any) {
      console.error('getAllProjects error:', err.message);
      throw new DatabaseError('getAllProjects', err);
    }
  }

  async getProjectById(id: string): Promise<ProjectRecord | null> {
    this.ensurePostgres('getProjectById');
    try {
      const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      return (rows[0] as unknown as ProjectRecord) || null;
    } catch (err: any) {
      console.error(`getProjectById error (${id}):`, err.message);
      throw new DatabaseError('getProjectById', err);
    }
  }

  async createProject(data: Partial<ProjectRecord>): Promise<ProjectRecord> {
    this.ensurePostgres('createProject');
    const id = data.id || `PRJ-${Math.floor(2400 + Math.random() * 7500)}`;
    const priceVnd = Number(data.priceVnd) || 12000000;
    const depositAmount = Number(data.depositAmount) || 0;
    const remainingAmount = priceVnd - depositAmount;

    const newPrj: any = {
      id,
      projectCode: data.projectCode || id,
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
      progress: data.progress || 0,
      priceVnd,
      depositAmount,
      remainingAmount,
      devCommissionRate: data.devCommissionRate || 65,
      assignedDevId: data.assignedDevId || null,
      assignedDevName: data.assignedDevName || 'Chưa phân công',
      assignedCsId: data.assignedCsId || null,
      assignedCsName: data.assignedCsName || 'Đặng Ngọc Mai (Consultant)',
      thumbnailUrl: data.thumbnailUrl || null,
      feedback: data.feedback || null,
      documents: data.documents || '[]',
      reports: data.reports || JSON.stringify([
        {
          author: 'LUBPY System Automation',
          content: 'Yêu cầu dự án đã được tiếp nhận thành công trên hệ thống LUBPY Studio.',
          timestamp: new Date().toLocaleString('vi-VN'),
        },
      ]),
      createdBy: data.createdBy || data.clientName || 'Khách Hàng',
    };

    try {
      const inserted = await db.insert(projects).values(newPrj).returning();
      return inserted[0] as unknown as ProjectRecord;
    } catch (err: any) {
      console.error('createProject error:', err.message);
      throw new DatabaseError('createProject', err);
    }
  }

  async updateProject(id: string, updates: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    this.ensurePostgres('updateProject');
    try {
      const payload: any = { ...updates, updatedAt: new Date() };
      delete payload.id;

      const rows = await db.update(projects).set(payload).where(eq(projects.id, id)).returning();
      return (rows[0] as unknown as ProjectRecord) || null;
    } catch (err: any) {
      console.error(`updateProject error (${id}):`, err.message);
      throw new DatabaseError('updateProject', err);
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    this.ensurePostgres('deleteProject');
    try {
      const res = await db.delete(projects).where(eq(projects.id, id)).returning();
      return res.length > 0;
    } catch (err: any) {
      console.error(`deleteProject error (${id}):`, err.message);
      throw new DatabaseError('deleteProject', err);
    }
  }

  // =========================================================================
  // 3. PROJECT ASSIGNMENTS
  // =========================================================================
  async getAssignmentsByProjectId(projectId: string): Promise<ProjectAssignmentRecord[]> {
    this.ensurePostgres('getAssignmentsByProjectId');
    try {
      const rows = await db
        .select()
        .from(projectAssignments)
        .where(eq(projectAssignments.projectId, projectId))
        .orderBy(desc(projectAssignments.assignedAt));
      return rows as unknown as ProjectAssignmentRecord[];
    } catch (err: any) {
      console.error(`getAssignmentsByProjectId error (${projectId}):`, err.message);
      throw new DatabaseError('getAssignmentsByProjectId', err);
    }
  }

  async createAssignment(data: Omit<ProjectAssignmentRecord, 'id' | 'assignedAt'>): Promise<ProjectAssignmentRecord> {
    this.ensurePostgres('createAssignment');
    try {
      const inserted = await db.insert(projectAssignments).values({
        projectId: data.projectId,
        userId: data.userId,
        userName: data.userName,
        role: data.role,
        assignedBy: data.assignedBy,
      } as any).returning();
      return inserted[0] as unknown as ProjectAssignmentRecord;
    } catch (err: any) {
      console.error('createAssignment error:', err.message);
      throw new DatabaseError('createAssignment', err);
    }
  }

  async deleteAssignment(id: number): Promise<boolean> {
    this.ensurePostgres('deleteAssignment');
    try {
      const res = await db.delete(projectAssignments).where(eq(projectAssignments.id, id)).returning();
      return res.length > 0;
    } catch (err: any) {
      console.error(`deleteAssignment error (${id}):`, err.message);
      throw new DatabaseError('deleteAssignment', err);
    }
  }

  // =========================================================================
  // 4. PROJECT STATUS HISTORY
  // =========================================================================
  async getStatusHistoryByProjectId(projectId: string): Promise<ProjectStatusHistoryRecord[]> {
    this.ensurePostgres('getStatusHistoryByProjectId');
    try {
      const rows = await db
        .select()
        .from(projectStatusHistory)
        .where(eq(projectStatusHistory.projectId, projectId))
        .orderBy(desc(projectStatusHistory.createdAt));
      return rows as unknown as ProjectStatusHistoryRecord[];
    } catch (err: any) {
      console.error(`getStatusHistoryByProjectId error (${projectId}):`, err.message);
      throw new DatabaseError('getStatusHistoryByProjectId', err);
    }
  }

  async addStatusHistory(data: Omit<ProjectStatusHistoryRecord, 'id' | 'createdAt'>): Promise<ProjectStatusHistoryRecord> {
    this.ensurePostgres('addStatusHistory');
    try {
      const inserted = await db.insert(projectStatusHistory).values({
        projectId: data.projectId,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        changedBy: data.changedBy,
        reason: data.reason || null,
      } as any).returning();
      return inserted[0] as unknown as ProjectStatusHistoryRecord;
    } catch (err: any) {
      console.error('addStatusHistory error:', err.message);
      throw new DatabaseError('addStatusHistory', err);
    }
  }

  // =========================================================================
  // 5. TRANSACTIONS CRUD & FINANCIAL SUMMARY
  // =========================================================================
  async getAllTransactions(): Promise<TransactionRecord[]> {
    this.ensurePostgres('getAllTransactions');
    try {
      const rows = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      return rows as unknown as TransactionRecord[];
    } catch (err: any) {
      console.error('getAllTransactions error:', err.message);
      throw new DatabaseError('getAllTransactions', err);
    }
  }

  async findTransactionById(id: number): Promise<TransactionRecord | null> {
    this.ensurePostgres('findTransactionById');
    try {
      const rows = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
      return (rows[0] as unknown as TransactionRecord) || null;
    } catch (err: any) {
      console.error(`findTransactionById error (${id}):`, err.message);
      throw new DatabaseError('findTransactionById', err);
    }
  }

  async createTransaction(data: Partial<TransactionRecord>): Promise<TransactionRecord> {
    this.ensurePostgres('createTransaction');
    const amount = Number(data.amountVnd) || 0;
    const txCode = data.transactionCode || `TX-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: any = {
      transactionCode: txCode,
      projectId: data.projectId || null,
      projectName: data.projectName || 'Dịch vụ Đồ Án LUBPY',
      type: data.type || 'PROJECT_DEPOSIT',
      amountVnd: amount,
      senderName: data.senderName || 'Khách hàng',
      receiverName: data.receiverName || 'LUBPY Studio',
      status: data.status || 'completed',
      note: data.note || '',
      createdBy: data.createdBy || 'Hệ thống',
      confirmedBy: data.confirmedBy || (data.status === 'completed' ? 'Kế toán LUBPY' : null),
      confirmedAt: data.status === 'completed' ? new Date() : null,
    };

    try {
      const inserted = await db.insert(transactions).values(newTx).returning();
      return inserted[0] as unknown as TransactionRecord;
    } catch (err: any) {
      console.error('createTransaction error:', err.message);
      throw new DatabaseError('createTransaction', err);
    }
  }

  async updateTransaction(id: number, updates: Partial<TransactionRecord>): Promise<TransactionRecord | null> {
    this.ensurePostgres('updateTransaction');
    try {
      const payload: any = { ...updates };
      delete payload.id;

      const rows = await db.update(transactions).set(payload).where(eq(transactions.id, id)).returning();
      return (rows[0] as unknown as TransactionRecord) || null;
    } catch (err: any) {
      console.error(`updateTransaction error (${id}):`, err.message);
      throw new DatabaseError('updateTransaction', err);
    }
  }

  async confirmTransaction(id: number, confirmedBy: string): Promise<TransactionRecord | null> {
    this.ensurePostgres('confirmTransaction');
    try {
      const rows = await db
        .update(transactions)
        .set({
          status: 'completed',
          confirmedBy,
          confirmedAt: new Date(),
        })
        .where(eq(transactions.id, id))
        .returning();
      return (rows[0] as unknown as TransactionRecord) || null;
    } catch (err: any) {
      console.error(`confirmTransaction error (${id}):`, err.message);
      throw new DatabaseError('confirmTransaction', err);
    }
  }

  async getFinancialSummary() {
    this.ensurePostgres('getFinancialSummary');
    try {
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
        .filter(t => (t.type || '').toLowerCase().includes('deposit') && t.status === 'completed')
        .reduce((sum, t) => sum + (Number(t.amountVnd) || 0), 0);

      const finalPaymentRevenue = txs
        .filter(t => (t.type || '').toLowerCase().includes('final') && t.status === 'completed')
        .reduce((sum, t) => sum + (Number(t.amountVnd) || 0), 0);

      const developerPayout = txs
        .filter(t => (t.type || '').toLowerCase().includes('payout') && t.status === 'completed')
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
    } catch (err: any) {
      console.error('getFinancialSummary error:', err.message);
      throw new DatabaseError('getFinancialSummary', err);
    }
  }

  // =========================================================================
  // 6. TICKETS CRUD
  // =========================================================================
  async getAllTickets(): Promise<TicketRecord[]> {
    this.ensurePostgres('getAllTickets');
    try {
      const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
      return rows as unknown as TicketRecord[];
    } catch (err: any) {
      console.error('getAllTickets error:', err.message);
      throw new DatabaseError('getAllTickets', err);
    }
  }

  async getTicketById(id: string): Promise<TicketRecord | null> {
    this.ensurePostgres('getTicketById');
    try {
      const rows = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
      return (rows[0] as unknown as TicketRecord) || null;
    } catch (err: any) {
      console.error(`getTicketById error (${id}):`, err.message);
      throw new DatabaseError('getTicketById', err);
    }
  }

  async createTicket(data: Partial<TicketRecord>): Promise<TicketRecord> {
    this.ensurePostgres('createTicket');
    const id = data.id || `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialMessages = data.messages || JSON.stringify([
      {
        sender: data.clientName || 'Client',
        content: data.description || data.subject || 'Cần hỗ trợ tư vấn đồ án.',
        timestamp: new Date().toLocaleString('vi-VN'),
      },
    ]);

    const newTicket: any = {
      id,
      ticketCode: data.ticketCode || id,
      clientId: data.clientId || `client_${Date.now()}`,
      clientName: data.clientName || 'Khách hàng',
      clientEmail: data.clientEmail || null,
      clientPhone: data.clientPhone || null,
      projectId: data.projectId || null,
      subject: data.subject || 'Yêu cầu hỗ trợ kỹ thuật',
      description: data.description || '',
      priority: data.priority || 'MEDIUM',
      status: data.status || 'OPEN',
      assignedCs: data.assignedCs || 'Đặng Ngọc Mai (Consultant)',
      messages: initialMessages,
    };

    try {
      const inserted = await db.insert(tickets).values(newTicket).returning();
      return inserted[0] as unknown as TicketRecord;
    } catch (err: any) {
      console.error('createTicket error:', err.message);
      throw new DatabaseError('createTicket', err);
    }
  }

  async updateTicket(id: string, updates: Partial<TicketRecord>): Promise<TicketRecord | null> {
    this.ensurePostgres('updateTicket');
    try {
      const payload: any = { ...updates, updatedAt: new Date() };
      delete payload.id;

      const rows = await db.update(tickets).set(payload).where(eq(tickets.id, id)).returning();
      return (rows[0] as unknown as TicketRecord) || null;
    } catch (err: any) {
      console.error(`updateTicket error (${id}):`, err.message);
      throw new DatabaseError('updateTicket', err);
    }
  }

  async addTicketMessage(id: string, message: { sender: string; senderRole?: string; content: string; timestamp?: string }): Promise<TicketRecord | null> {
    this.ensurePostgres('addTicketMessage');
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

    return await this.updateTicket(id, {
      messages: JSON.stringify(msgs),
      status: current.status === 'CLOSED' ? 'OPEN' : current.status,
    });
  }

  async deleteTicket(id: string): Promise<boolean> {
    this.ensurePostgres('deleteTicket');
    try {
      const res = await db.delete(tickets).where(eq(tickets.id, id)).returning();
      return res.length > 0;
    } catch (err: any) {
      console.error(`deleteTicket error (${id}):`, err.message);
      throw new DatabaseError('deleteTicket', err);
    }
  }

  // =========================================================================
  // 7. LIVE CHATS CRUD
  // =========================================================================
  async getLiveChats(sessionId?: string): Promise<any[]> {
    this.ensurePostgres('getLiveChats');
    try {
      if (sessionId) {
        return await db
          .select()
          .from(liveChats)
          .where(eq(liveChats.sessionId, sessionId))
          .orderBy(liveChats.createdAt);
      }
      return await db.select().from(liveChats).orderBy(desc(liveChats.createdAt)).limit(100);
    } catch (err: any) {
      console.error('getLiveChats error:', err.message);
      throw new DatabaseError('getLiveChats', err);
    }
  }

  async createLiveChat(data: { sessionId?: string; senderId?: string; sender?: string; senderRole?: string; message: string }): Promise<any> {
    this.ensurePostgres('createLiveChat');
    try {
      const inserted = await db.insert(liveChats).values({
        sessionId: data.sessionId || 'chat-default',
        senderId: data.senderId || null,
        sender: data.sender || 'Khách hàng',
        senderRole: data.senderRole || 'client',
        message: data.message || '',
      } as any).returning();
      return inserted[0];
    } catch (err: any) {
      console.error('createLiveChat error:', err.message);
      throw new DatabaseError('createLiveChat', err);
    }
  }

  // =========================================================================
  // 8. INTERVIEWS CRUD
  // =========================================================================
  async getInterviews(): Promise<InterviewRecord[]> {
    return this.getAllInterviews();
  }

  async getAllInterviews(): Promise<InterviewRecord[]> {
    this.ensurePostgres('getAllInterviews');
    try {
      const rows = await db.select().from(interviews).orderBy(desc(interviews.createdAt));
      return rows as unknown as InterviewRecord[];
    } catch (err: any) {
      console.error('getAllInterviews error:', err.message);
      throw new DatabaseError('getAllInterviews', err);
    }
  }

  async getInterviewById(id: string): Promise<InterviewRecord | null> {
    this.ensurePostgres('getInterviewById');
    try {
      const rows = await db.select().from(interviews).where(eq(interviews.id, id)).limit(1);
      return (rows[0] as unknown as InterviewRecord) || null;
    } catch (err: any) {
      console.error(`getInterviewById error (${id}):`, err.message);
      throw new DatabaseError('getInterviewById', err);
    }
  }

  async createInterview(data: Partial<InterviewRecord>): Promise<InterviewRecord> {
    this.ensurePostgres('createInterview');
    const id = data.id || `int-${Date.now()}`;
    const avatar = data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.candidateName || 'cand')}`;

    try {
      const inserted = await db.insert(interviews).values({
        id,
        candidateName: data.candidateName || 'Ứng viên',
        candidateEmail: data.candidateEmail || '',
        candidatePhone: data.candidatePhone || '',
        role: data.role || 'Fullstack Developer',
        date: data.date || '15/08/2026',
        time: data.time || '14:00',
        status: data.status || 'Confirmed',
        interviewer: data.interviewer || 'Lê Thị Thanh Hương (HR Manager)',
        notes: data.notes || '',
        avatar,
      } as any).returning();

      return inserted[0] as unknown as InterviewRecord;
    } catch (err: any) {
      console.error('createInterview error:', err.message);
      throw new DatabaseError('createInterview', err);
    }
  }

  async updateInterview(id: string, updates: Partial<InterviewRecord>): Promise<InterviewRecord | null> {
    this.ensurePostgres('updateInterview');
    try {
      const payload: any = { ...updates };
      delete payload.id;

      const rows = await db.update(interviews).set(payload).where(eq(interviews.id, id)).returning();
      return (rows[0] as unknown as InterviewRecord) || null;
    } catch (err: any) {
      console.error(`updateInterview error (${id}):`, err.message);
      throw new DatabaseError('updateInterview', err);
    }
  }

  async deleteInterview(id: string): Promise<boolean> {
    this.ensurePostgres('deleteInterview');
    try {
      const res = await db.delete(interviews).where(eq(interviews.id, id)).returning();
      return res.length > 0;
    } catch (err: any) {
      console.error(`deleteInterview error (${id}):`, err.message);
      throw new DatabaseError('deleteInterview', err);
    }
  }

  // =========================================================================
  // 9. PROJECT FILES CRUD
  // =========================================================================
  async getFilesByProjectId(projectId: string): Promise<ProjectFileRecord[]> {
    this.ensurePostgres('getFilesByProjectId');
    try {
      const rows = await db
        .select()
        .from(projectFiles)
        .where(eq(projectFiles.projectId, projectId))
        .orderBy(desc(projectFiles.createdAt));
      return rows as unknown as ProjectFileRecord[];
    } catch (err: any) {
      console.error(`getFilesByProjectId error (${projectId}):`, err.message);
      throw new DatabaseError('getFilesByProjectId', err);
    }
  }

  async createFileRecord(data: Omit<ProjectFileRecord, 'id' | 'createdAt'>): Promise<ProjectFileRecord> {
    this.ensurePostgres('createFileRecord');
    try {
      const inserted = await db.insert(projectFiles).values({
        projectId: data.projectId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType || 'document',
        fileSize: data.fileSize || 0,
        uploadedBy: data.uploadedBy || 'Hệ thống',
        isLocked: !!data.isLocked,
      } as any).returning();
      return inserted[0] as unknown as ProjectFileRecord;
    } catch (err: any) {
      console.error('createFileRecord error:', err.message);
      throw new DatabaseError('createFileRecord', err);
    }
  }

  async lockFileRecord(id: number, isLocked: boolean): Promise<ProjectFileRecord | null> {
    this.ensurePostgres('lockFileRecord');
    try {
      const rows = await db.update(projectFiles).set({ isLocked }).where(eq(projectFiles.id, id)).returning();
      return (rows[0] as unknown as ProjectFileRecord) || null;
    } catch (err: any) {
      console.error(`lockFileRecord error (${id}):`, err.message);
      throw new DatabaseError('lockFileRecord', err);
    }
  }

  async deleteFileRecord(id: number): Promise<boolean> {
    this.ensurePostgres('deleteFileRecord');
    try {
      const res = await db.delete(projectFiles).where(eq(projectFiles.id, id)).returning();
      return res.length > 0;
    } catch (err: any) {
      console.error(`deleteFileRecord error (${id}):`, err.message);
      throw new DatabaseError('deleteFileRecord', err);
    }
  }

  // =========================================================================
  // 10. NOTIFICATIONS CRUD
  // =========================================================================
  async getAllNotifications(): Promise<NotificationRecord[]> {
    this.ensurePostgres('getAllNotifications');
    try {
      const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
      return rows as unknown as NotificationRecord[];
    } catch (err: any) {
      console.error('getAllNotifications error:', err.message);
      throw new DatabaseError('getAllNotifications', err);
    }
  }

  async getNotificationsByTarget(dept?: string, userId?: string): Promise<NotificationRecord[]> {
    this.ensurePostgres('getNotificationsByTarget');
    try {
      const all = await this.getAllNotifications();
      return all.filter(n => {
        if (n.targetDept === 'ALL') return true;
        if (dept && n.targetDept.toUpperCase() === dept.toUpperCase()) return true;
        if (userId && n.targetUserId === userId) return true;
        return false;
      });
    } catch (err: any) {
      console.error('getNotificationsByTarget error:', err.message);
      throw new DatabaseError('getNotificationsByTarget', err);
    }
  }

  async createNotification(data: Partial<NotificationRecord>): Promise<NotificationRecord> {
    this.ensurePostgres('createNotification');
    try {
      const inserted = await db.insert(notifications).values({
        type: data.type || 'SYSTEM',
        title: data.title || 'Thông báo mới',
        content: data.content || '',
        targetDept: data.targetDept || 'ALL',
        targetUserId: data.targetUserId || null,
        isRead: 'false',
      } as any).returning();
      return inserted[0] as unknown as NotificationRecord;
    } catch (err: any) {
      console.error('createNotification error:', err.message);
      throw new DatabaseError('createNotification', err);
    }
  }

  async markNotificationRead(id: number): Promise<boolean> {
    this.ensurePostgres('markNotificationRead');
    try {
      const res = await db.update(notifications).set({ isRead: 'true' }).where(eq(notifications.id, id)).returning();
      return res.length > 0;
    } catch (err: any) {
      console.error(`markNotificationRead error (${id}):`, err.message);
      throw new DatabaseError('markNotificationRead', err);
    }
  }

  // =========================================================================
  // 11. AUDIT LOGS CRUD
  // =========================================================================
  async getAllAuditLogs(): Promise<AuditLogRecord[]> {
    this.ensurePostgres('getAllAuditLogs');
    try {
      const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
      return rows as unknown as AuditLogRecord[];
    } catch (err: any) {
      console.error('getAllAuditLogs error:', err.message);
      throw new DatabaseError('getAllAuditLogs', err);
    }
  }

  async createAuditLog(data: Partial<AuditLogRecord>): Promise<AuditLogRecord> {
    this.ensurePostgres('createAuditLog');
    try {
      const inserted = await db.insert(auditLogs).values({
        action: data.action || 'ACTION',
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        userId: data.userId || null,
        userName: data.userName || null,
        userRole: data.userRole || null,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
      } as any).returning();
      return inserted[0] as unknown as AuditLogRecord;
    } catch (err: any) {
      console.error('createAuditLog error:', err.message);
      // Soft fail for audit logs to not block business operations, but log error
      return {
        id: 0,
        action: data.action || 'ACTION',
        createdAt: new Date(),
      };
    }
  }

  // =========================================================================
  // 12. OTP CODES (SECURE - NO HARDCODED BYPASS)
  // =========================================================================
  async createOtp(target: string, code: string, expiresAt: Date): Promise<OtpRecord> {
    this.ensurePostgres('createOtp');
    const cleanTarget = target.trim().toLowerCase();
    const cleanCode = code.trim();

    try {
      const inserted = await db.insert(otpCodes).values({
        target: cleanTarget,
        code: cleanCode,
        expiresAt,
        verified: false,
      } as any).returning();
      return inserted[0] as unknown as OtpRecord;
    } catch (err: any) {
      console.error('createOtp error:', err.message);
      throw new DatabaseError('createOtp', err);
    }
  }

  async verifyOtp(target: string, code: string): Promise<boolean> {
    this.ensurePostgres('verifyOtp');
    const cleanTarget = target.trim().toLowerCase();
    const cleanCode = code.trim();

    try {
      const rows = await db
        .select()
        .from(otpCodes)
        .where(
          and(
            eq(otpCodes.target, cleanTarget),
            eq(otpCodes.code, cleanCode),
            eq(otpCodes.verified, false)
          )
        )
        .orderBy(desc(otpCodes.createdAt));

      const now = new Date();
      const validRecord = rows.find(r => new Date(r.expiresAt).getTime() > now.getTime());

      if (validRecord) {
        await db.update(otpCodes).set({ verified: true }).where(eq(otpCodes.id, validRecord.id));
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('verifyOtp error:', err.message);
      throw new DatabaseError('verifyOtp', err);
    }
  }
}

export const storage = new StorageEngine();
