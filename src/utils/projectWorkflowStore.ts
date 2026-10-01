/**
 * Central Workflow & Support Collaboration Store for LUBPY STUDIO
 * Manages the complete 6-stage lifecycle:
 * 1. Client <-> Lubpy AI & CSKH (Support Chat)
 * 2. CSKH -> Tech Team (Handover & Task Assignment to subordinate devs)
 * 3. Tech Team <-> Accounting (Price consensus, deposit & remaining balance)
 * 4. Accounting -> CSKH (Official Invoice generation and dispatch)
 * 5. CSKH -> Client (Progress report, invoice payment gate, delivery, & Lubpy AI appreciation)
 * 6. Department Heads (CS Lead, Tech Lead, Accounting Lead, Super Admin) digital contract signing
 */

import { api } from './apiClient';

export interface WorkflowSupportMessage {
  id: string;
  senderName: string;
  senderRole: 'client' | 'lubpy_ai' | 'cs_staff' | 'tech' | 'accounting' | 'system';
  senderAvatar?: string;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  message: string;
  category?: string;
  timestamp: string;
  isAiResponse?: boolean;
  isHandedOverToCS?: boolean;
  metadata?: {
    suggestedService?: string;
    estimatedBudget?: number;
    urgency?: string;
    invoiceId?: string;
    projectId?: string;
  };
}

export interface WorkflowContractSignature {
  role: 'CS_HEAD' | 'TECH_HEAD' | 'ACCOUNTING_HEAD' | 'SUPER_ADMIN';
  title: string;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  signatureStamp: string; // Digital signature hash or visual seal
}

export interface WorkflowProject {
  id: string; // e.g. "PRJ-2401"
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectName: string;
  category: string;
  requirements: string;
  deadline: string;
  status: 
    | 'cs_intake'            // 1. CSKH & AI nhận yêu cầu ban đầu
    | 'tech_assigned'         // 2. Chuyển Kỹ thuật & Tech Lead đã phân công Dev
    | 'price_agreed'          // 3. Kỹ thuật & Kế toán thống nhất giá & tiền cọc
    | 'invoice_sent_to_cs'    // 4. Kế toán gửi hóa đơn lại cho CSKH
    | 'invoice_sent_to_client'// 5. CSKH gửi hóa đơn cho khách hàng
    | 'deposit_paid'          // Khách đã đặt cọc
    | 'fully_paid'            // Khách đã thanh toán 100%
    | 'delivered'             // CSKH đã bàn giao dự án sau khi thanh toán
    | 'client_satisfied';     // Khách hàng hoàn toàn hài lòng & Lubpy AI gửi lời triân

  // Assigned Staff
  assignedCS: string;
  assignedDev: string;
  assignedAccountant: string;

  // Financials
  totalAmountVnd: number;
  depositAmountVnd: number;
  remainingAmountVnd: number;
  invoiceId?: string;
  invoiceDate?: string;
  paymentStatus: 'unpaid' | 'deposit_paid' | 'paid_100';

  // Deliverables
  deliverables?: {
    sourceCodeUrl?: string;
    liveDemoUrl?: string;
    documentationUrl?: string;
    deliveredAt?: string;
  };

  // Client Satisfaction & Lubpy AI thank you note
  clientSatisfaction?: {
    isSatisfied: boolean;
    rating: number;
    feedback?: string;
    confirmedAt: string;
    lubpyAiThankYouMessage?: string;
  };

  // Contract & Digital Signatures (4 Heads)
  contract: {
    contractNumber: string;
    createdAt: string;
    termsSummary: string;
    signatures: WorkflowContractSignature[];
  };

  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_WORKFLOW_PROJECTS = 'lubpy_workflow_projects';
const STORAGE_KEY_WORKFLOW_CHAT = 'lubpy_workflow_chat_messages';

// Empty default: PostgreSQL is the single source of truth
export const INITIAL_WORKFLOW_PROJECTS: WorkflowProject[] = [];

// Helper to map DB project to Workflow project
function mapDbProjectToWorkflow(p: any): WorkflowProject {
  const statusMapping: Record<string, WorkflowProject['status']> = {
    PENDING: 'cs_intake',
    ASSIGNED: 'tech_assigned',
    DEPOSIT_50: 'deposit_paid',
    CODING: 'tech_assigned',
    REVIEW: 'tech_assigned',
    PAID_100: 'fully_paid',
    DELIVERED: 'delivered',
    COMPLETED: 'client_satisfied',
  };

  const currentStatus = statusMapping[p.status] || 'cs_intake';
  const price = Number(p.priceVnd) || 15000000;
  const deposit = Number(p.depositAmount) || 0;
  const remaining = Number(p.remainingAmount) !== undefined ? Number(p.remainingAmount) : Math.max(0, price - deposit);

  let signatures: WorkflowContractSignature[] = [];
  if (p.reports) {
    try {
      const parsedReports = typeof p.reports === 'string' ? JSON.parse(p.reports) : p.reports;
      if (Array.isArray(parsedReports)) {
        signatures = parsedReports.filter((r: any) => r.isSignature);
      }
    } catch (e) {}
  }

  return {
    id: p.id,
    clientName: p.clientName || 'Khách Hàng',
    clientEmail: p.clientEmail || 'client@gmail.com',
    clientPhone: p.clientPhone || '0901234567',
    projectName: p.title || p.projectName || 'Dự án LUBPY Studio',
    category: p.projectType || 'Đồ án tốt nghiệp CNTT',
    requirements: p.description || '',
    deadline: p.deadline || '2026-10-30',
    status: currentStatus,
    assignedCS: p.assignedCsName || 'Đặng Ngọc Mai (Trưởng CSKH)',
    assignedDev: p.assignedDevName || 'Trần Hoàng Nam (Senior Dev)',
    assignedAccountant: 'Nguyễn Văn Minh (Kế Toán Trưởng)',
    totalAmountVnd: price,
    depositAmountVnd: deposit,
    remainingAmountVnd: remaining,
    invoiceId: `HD-${p.id}`,
    invoiceDate: p.updatedAt ? String(p.updatedAt).slice(0, 10) : '2026-09-20',
    paymentStatus: deposit > 0 ? (remaining <= 0 ? 'paid_100' : 'deposit_paid') : 'unpaid',
    deliverables: {
      sourceCodeUrl: 'https://github.com/lubpystudio/release',
      liveDemoUrl: 'https://demo.lubpystudio.vn',
      documentationUrl: 'https://docs.lubpystudio.vn',
      deliveredAt: p.deliveredAt ? String(p.deliveredAt) : undefined,
    },
    contract: {
      contractNumber: `HD-LUBPY-${p.id}`,
      createdAt: p.createdAt ? String(p.createdAt).slice(0, 10) : '2026-09-15',
      termsSummary: `Hợp đồng dịch vụ triển khai ${p.title} cho khách hàng ${p.clientName}. Cam kết hoàn thiện đúng tiến độ và bảo hành trọn đời.`,
      signatures,
    },
    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
  };
}

export function getWorkflowProjects(): WorkflowProject[] {
  const raw = localStorage.getItem(STORAGE_KEY_WORKFLOW_PROJECTS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing workflow projects:', e);
    }
  }
  return [];
}

// Pull directly from PostgreSQL table 'projects' and update local cache
export async function syncWorkflowProjectsFromDb(): Promise<WorkflowProject[]> {
  try {
    const dbProjects = await api.projects.list();
    if (Array.isArray(dbProjects)) {
      const mapped = dbProjects.map(mapDbProjectToWorkflow);
      localStorage.setItem(STORAGE_KEY_WORKFLOW_PROJECTS, JSON.stringify(mapped));
      window.dispatchEvent(new CustomEvent('lubpy_workflow_projects_updated', { detail: mapped }));
      return mapped;
    }
  } catch (err) {
    console.error('Failed to sync workflow projects from PostgreSQL:', err);
  }
  return getWorkflowProjects();
}

// Auto-sync on client load
if (typeof window !== 'undefined') {
  syncWorkflowProjectsFromDb().catch(() => {});
}

export function saveWorkflowProjects(projects: WorkflowProject[]): void {
  localStorage.setItem(STORAGE_KEY_WORKFLOW_PROJECTS, JSON.stringify(projects));
  window.dispatchEvent(new CustomEvent('lubpy_workflow_projects_updated', { detail: projects }));
}

export function getWorkflowChatMessages(clientEmail?: string): WorkflowSupportMessage[] {
  const raw = localStorage.getItem(STORAGE_KEY_WORKFLOW_CHAT);
  let all: WorkflowSupportMessage[] = [];
  if (raw) {
    try {
      all = JSON.parse(raw);
    } catch (e) {
      all = [];
    }
  }

  if (clientEmail && clientEmail.trim()) {
    const clean = clientEmail.trim().toLowerCase();
    return all.filter(m => m.clientEmail.toLowerCase() === clean || m.senderRole === 'lubpy_ai' || m.senderRole === 'system');
  }
  return all;
}

export function saveWorkflowChatMessage(msg: Omit<WorkflowSupportMessage, 'id' | 'timestamp'>): WorkflowSupportMessage {
  const current = getWorkflowChatMessages();
  const newMsg: WorkflowSupportMessage = {
    ...msg,
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const updated = [...current, newMsg];
  localStorage.setItem(STORAGE_KEY_WORKFLOW_CHAT, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('lubpy_workflow_chat_updated', { detail: newMsg }));

  // Persist directly into PostgreSQL table 'live_chats'
  api.tickets.sendLiveChat({
    sessionId: msg.clientEmail || 'client-chat',
    sender: msg.senderName,
    senderRole: msg.senderRole === 'client' ? 'client' : (msg.senderRole === 'cs_staff' ? 'cskh' : 'system'),
    message: msg.message,
  }).catch(err => {
    console.warn('Notice saving live chat to PostgreSQL:', err.message);
  });

  return newMsg;
}

// ----------------------------------------------------
// 1. CLIENT & LUBPY AI GREETING & REQUEST CREATION
// ----------------------------------------------------
export function createProjectFromSupportRequest({
  clientName,
  clientEmail,
  clientPhone,
  projectName,
  category = 'Đồ án tốt nghiệp CNTT',
  requirements,
  estimatedBudget = 10000000,
  assignedCS = 'Đặng Ngọc Mai (Trưởng CSKH)'
}: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectName: string;
  category?: string;
  requirements: string;
  estimatedBudget?: number;
  assignedCS?: string;
}): WorkflowProject {
  const projects = getWorkflowProjects();
  const nextNum = (projects.length + 1).toString().padStart(3, '0');
  const id = `PRJ-2026-${nextNum}`;
  const nowStr = new Date().toLocaleString('vi-VN');

  const newProject: WorkflowProject = {
    id,
    clientName: clientName.trim(),
    clientEmail: clientEmail.trim(),
    clientPhone: clientPhone.trim() || '0900000000',
    projectName: projectName.trim(),
    category,
    requirements: requirements.trim(),
    deadline: '2026-10-30',
    status: 'cs_intake',
    assignedCS,
    assignedDev: 'Chờ Tech Lead phân công',
    assignedAccountant: 'Nguyễn Văn Minh (Kế Toán Trưởng)',
    totalAmountVnd: estimatedBudget,
    depositAmountVnd: Math.round(estimatedBudget * 0.5),
    remainingAmountVnd: Math.round(estimatedBudget * 0.5),
    paymentStatus: 'unpaid',
    contract: {
      contractNumber: `HD-LUBPY-2026-${nextNum}`,
      createdAt: nowStr,
      termsSummary: `Hợp đồng dịch vụ triển khai phần mềm cho khách hàng ${clientName}. Cam kết hoàn thiện đúng yêu cầu, bảo mật dữ liệu và hỗ trợ kỹ thuật tận tâm.`,
      signatures: []
    },
    createdAt: nowStr,
    updatedAt: nowStr
  };

  saveWorkflowProjects([newProject, ...projects]);

  // Persist directly into PostgreSQL table 'projects'
  api.projects.create({
    id,
    projectCode: id,
    clientName: newProject.clientName,
    clientEmail: newProject.clientEmail,
    clientPhone: newProject.clientPhone,
    title: newProject.projectName,
    description: newProject.requirements,
    projectType: newProject.category,
    deadline: newProject.deadline,
    priceVnd: newProject.totalAmountVnd,
    depositAmount: newProject.depositAmountVnd,
    remainingAmount: newProject.remainingAmountVnd,
    assignedCsName: newProject.assignedCS,
    assignedDevName: newProject.assignedDev,
  }).catch(err => {
    console.warn('Notice persisting project to PostgreSQL:', err.message);
  });

  return newProject;
}

// ----------------------------------------------------
// 2. CSKH HANDOVER TO TECH TEAM
// ----------------------------------------------------
export function csHandoverToTechTeam(projectId: string, notes?: string): WorkflowProject | null {
  const projects = getWorkflowProjects();
  const target = projects.find(p => p.id === projectId);
  if (!target) return null;

  target.status = 'tech_assigned';
  target.updatedAt = new Date().toLocaleString('vi-VN');
  if (notes) {
    target.requirements += `\n[Ghi chú từ CSKH]: ${notes}`;
  }

  saveWorkflowProjects(projects);
  return target;
}

// ----------------------------------------------------
// 2B. TECH LEAD ASSIGNS DEVELOPER SUBORDINATE
// ----------------------------------------------------
export function techLeadAssignDeveloper(projectId: string, developerName: string, deadline?: string): WorkflowProject | null {
  const projects = getWorkflowProjects();
  const target = projects.find(p => p.id === projectId);
  if (!target) return null;

  target.assignedDev = developerName;
  if (deadline) target.deadline = deadline;
  target.updatedAt = new Date().toLocaleString('vi-VN');

  saveWorkflowProjects(projects);
  return target;
}

// ----------------------------------------------------
// 3. TECH TEAM & ACCOUNTING PRICE CONSENSUS
// ----------------------------------------------------
export function techSubmitPricingToAccounting(
  projectId: string, 
  totalAmount: number, 
  depositAmount: number, 
  costBreakdownNotes?: string
): WorkflowProject | null {
  const projects = getWorkflowProjects();
  const target = projects.find(p => p.id === projectId);
  if (!target) return null;

  target.totalAmountVnd = totalAmount;
  target.depositAmountVnd = depositAmount;
  target.remainingAmountVnd = Math.max(0, totalAmount - depositAmount);
  target.status = 'price_agreed';
  target.updatedAt = new Date().toLocaleString('vi-VN');
  if (costBreakdownNotes) {
    target.requirements += `\n[Thống nhất giá Kỹ Thuật - Kế Toán]: ${costBreakdownNotes}`;
  }

  saveWorkflowProjects(projects);
  return target;
}

// ----------------------------------------------------
// 4. ACCOUNTING FINALIZES INVOICE & DISPATCHES TO CSKH
// ----------------------------------------------------
export function accountingSendInvoiceToCS(projectId: string, invoiceId?: string): WorkflowProject | null {
  const projects = getWorkflowProjects();
  const target = projects.find(p => p.id === projectId);
  if (!target) return null;

  const invNum = invoiceId || `HD-2026-${Math.floor(100 + Math.random() * 900)}`;
  target.invoiceId = invNum;
  target.invoiceDate = new Date().toISOString().split('T')[0];
  target.status = 'invoice_sent_to_cs';
  target.updatedAt = new Date().toLocaleString('vi-VN');

  saveWorkflowProjects(projects);
  return target;
}

// ----------------------------------------------------
// 5. CSKH SENDS INVOICE TO CLIENT
// ----------------------------------------------------
export function csSendInvoiceToClient(projectId: string): WorkflowProject | null {
  const projects = getWorkflowProjects();
  const target = projects.find(p => p.id === projectId);
  if (!target) return null;

  target.status = 'invoice_sent_to_client';
  target.updatedAt = new Date().toLocaleString('vi-VN');

  saveWorkflowProjects(projects);
  return target;
}

// ----------------------------------------------------
// 5B. CLIENT PAYS INVOICE (Deposit or Full Payment)
// ----------------------------------------------------
export function clientPayInvoice(projectId: string, isFullPayment = true): WorkflowProject | null {
  const projects = getWorkflowProjects();
  const target = projects.find(p => p.id === projectId);
  if (!target) return null;

  if (isFullPayment) {
    target.paymentStatus = 'paid_100';
    target.status = 'fully_paid';
  } else {
    target.paymentStatus = 'deposit_paid';
    target.status = 'deposit_paid';
  }
  target.updatedAt = new Date().toLocaleString('vi-VN');

  saveWorkflowProjects(projects);
  return target;
}

// ----------------------------------------------------
// 5C. CSKH DELIVERS PROJECT TO CLIENT (ONLY AFTER FULL PAYMENT)
// ----------------------------------------------------
export function csDeliverProjectToClient(
  projectId: string,
  deliverables: { sourceCodeUrl: string; liveDemoUrl: string; documentationUrl: string }
): { success: boolean; project?: WorkflowProject; error?: string } {
  const projects = getWorkflowProjects();
  const target = projects.find(p => p.id === projectId);
  if (!target) {
    return { success: false, error: 'Không tìm thấy dự án.' };
  }

  if (target.paymentStatus !== 'paid_100') {
    return {
      success: false,
      error: 'Khách hàng chưa thanh toán 100% hợp đồng! Quy định bảo mật LUBPY: Phải thanh toán đủ mới được phép bàn giao.'
    };
  }

  target.status = 'delivered';
  target.deliverables = {
    ...deliverables,
    deliveredAt: new Date().toLocaleString('vi-VN')
  };
  target.updatedAt = new Date().toLocaleString('vi-VN');

  saveWorkflowProjects(projects);
  return { success: true, project: target };
}

// ----------------------------------------------------
// 5D. CLIENT SATISFACTION CONFIRMATION & LUBPY AI APPRECIATION AUTO-GENERATION
// ----------------------------------------------------
export function clientConfirmSatisfaction(
  projectId: string,
  feedback?: string,
  rating: number = 5
): WorkflowProject | null {
  const projects = getWorkflowProjects();
  const target = projects.find(p => p.id === projectId);
  if (!target) return null;

  const clientName = target.clientName || 'Quý khách';
  const projectName = target.projectName || 'Dự án';

  const aiAppreciationMessage = `🤖 LUBPY AI trân trọng gửi lời cảm ơn sâu sắc nhất đến bạn ${clientName}!
Chúng tôi vô cùng vui mừng và hạnh phúc khi bạn hoàn toàn hài lòng với kết quả của dự án "${projectName}". 
Sự hài lòng và thành công của bạn chính là niềm tự hào lớn nhất của toàn thể Đội ngũ Kỹ Sư & Chuyên Viên LUBPY STUDIO!
✨ Quyền lợi thành viên của bạn đã được kích hoạt:
1. 🛡️ Cam kết bảo hành & hỗ trợ giải đáp kỹ thuật source code trọn đời.
2. 🎓 Miễn phí 1 buổi hướng dẫn demo 1-1 trước kỳ bảo vệ.
3. 🎁 Tặng mã giảm giá LUBPY_VIP20 (20%) cho dự án tiếp theo.
Chúc bạn gặt hái thật nhiều điểm số xuất sắc và thành công rực rỡ trên con đường sự nghiệp! 🚀`;

  target.status = 'client_satisfied';
  target.clientSatisfaction = {
    isSatisfied: true,
    rating,
    feedback: feedback || 'Dự án bàn giao xuất sắc, giao diện đẹp và code chuẩn chỉnh!',
    confirmedAt: new Date().toLocaleString('vi-VN'),
    lubpyAiThankYouMessage: aiAppreciationMessage
  };
  target.updatedAt = new Date().toLocaleString('vi-VN');

  // Also push a live chat message from Lubpy AI into the client's support thread
  saveWorkflowChatMessage({
    senderName: 'LUBPY AI (Trợ Lý Tri Ân)',
    senderRole: 'lubpy_ai',
    clientEmail: target.clientEmail,
    clientName: target.clientName,
    clientPhone: target.clientPhone,
    message: aiAppreciationMessage,
    category: 'Tri ân & Bàn giao thành công',
    isAiResponse: true,
    metadata: {
      projectId: target.id
    }
  });

  saveWorkflowProjects(projects);
  return target;
}

// ----------------------------------------------------
// 6. DEPARTMENT HEADS DIGITAL CONTRACT SIGNING
// ----------------------------------------------------
export function signProjectContract(
  projectId: string,
  signer: {
    role: 'CS_HEAD' | 'TECH_HEAD' | 'ACCOUNTING_HEAD' | 'SUPER_ADMIN';
    title: string;
    signerName: string;
    signerEmail: string;
  }
): { success: boolean; project?: WorkflowProject; message?: string } {
  const projects = getWorkflowProjects();
  const target = projects.find(p => p.id === projectId);
  if (!target) {
    return { success: false, message: 'Dự án không tồn tại.' };
  }

  const existing = target.contract.signatures.find(s => s.role === signer.role);
  if (existing) {
    return { success: false, message: `Hợp đồng này đã được ${signer.title} (${existing.signerName}) ký trước đó vào lúc ${existing.signedAt}.` };
  }

  const stamp = `SIG_${signer.role}_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const newSignature: WorkflowContractSignature = {
    role: signer.role,
    title: signer.title,
    signerName: signer.signerName,
    signerEmail: signer.signerEmail,
    signedAt: new Date().toLocaleString('vi-VN'),
    signatureStamp: stamp
  };

  target.contract.signatures.push(newSignature);
  target.updatedAt = new Date().toLocaleString('vi-VN');

  saveWorkflowProjects(projects);
  return {
    success: true,
    project: target,
    message: `Đã ký duyệt thành công hợp đồng dự án ${target.id} với tư cách ${signer.title}!`
  };
}

export function formatVNDCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}

