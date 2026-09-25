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
  id: string; // e.g. "PRJ-2026-088"
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
    | 'client_satisfied';     // Khách hàng hoàn toàn hài lòng & Lubpy AI gửi lời tri ân

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

// Standard Initial Projects for seamless experience
export const INITIAL_WORKFLOW_PROJECTS: WorkflowProject[] = [
  {
    id: 'PRJ-2026-001',
    clientName: 'Nguyễn Văn Hải',
    clientEmail: 'client@gmail.com',
    clientPhone: '0912345678',
    projectName: 'Hệ thống Quản lý Bệnh án Điện tử & Đặt lịch Khám E-Hospital (React + NodeJS)',
    category: 'Đồ án tốt nghiệp CNTT',
    requirements: 'Xây dựng Web App đặt lịch khám bệnh, tích hợp thanh toán VNPay, phân quyền Bác sĩ / Bệnh nhân / Quản trị viên, xuất PDF phiếu khám.',
    deadline: '2026-10-15',
    status: 'delivered',
    assignedCS: 'Đặng Ngọc Mai (Trưởng CSKH)',
    assignedDev: 'Trần Hoàng Nam (Senior Dev)',
    assignedAccountant: 'Nguyễn Văn Minh (Kế Toán Trưởng)',
    totalAmountVnd: 12000000,
    depositAmountVnd: 6000000,
    remainingAmountVnd: 6000000,
    invoiceId: 'HD-2026-001',
    invoiceDate: '2026-09-18',
    paymentStatus: 'paid_100',
    deliverables: {
      sourceCodeUrl: 'https://github.com/lubpystudio/e-hospital-ehr-system-release',
      liveDemoUrl: 'https://demo-ehospital.lubpystudio.vn',
      documentationUrl: 'https://docs.lubpystudio.vn/ehospital-report-full.pdf',
      deliveredAt: '2026-09-21 14:30'
    },
    clientSatisfaction: {
      isSatisfied: true,
      rating: 5,
      feedback: 'Dự án chạy rất mượt, giao diện chuẩn y tế và thầy cô hướng dẫn khen rất nhiều. Cảm ơn Lubpy Studio!',
      confirmedAt: '2026-09-22 09:15',
      lubpyAiThankYouMessage: '🤖 LUBPY AI xin chân thành cảm ơn bạn Nguyễn Văn Hải đã tin tưởng đồng hành cùng LUBPY STUDIO! Chúng tôi vô cùng vinh hạnh khi dự án "E-Hospital" đạt kết quả xuất sắc. Chúc bạn có buổi bảo vệ đồ án thành công rực rỡ và phát triển sự nghiệp công nghệ vững chắc! Hệ thống đã kích hoạt bảo hành Source Code trọn đời & tặng bạn voucher 20% cho các dịch vụ tiếp theo.'
    },
    contract: {
      contractNumber: 'HD-LUBPY-2026-001',
      createdAt: '2026-09-15',
      termsSummary: 'Hợp đồng phát triển phần mềm ứng dụng quản lý bệnh án điện tử, cam kết bảo hành 12 tháng, hỗ trợ cài đặt môi trường và hướng dẫn bảo vệ đồ án.',
      signatures: [
        {
          role: 'CS_HEAD',
          title: 'Trưởng Phòng CSKH & Tư Vấn',
          signerName: 'Đặng Ngọc Mai',
          signerEmail: 'truecs@lubpystudio.vn',
          signedAt: '2026-09-15 10:30',
          signatureStamp: 'SIG_CS_MAI_9847289'
        },
        {
          role: 'TECH_HEAD',
          title: 'Trưởng Đội Ngũ Kỹ Thuật (Tech Lead)',
          signerName: 'Phan Quốc Bảo',
          signerEmail: 'truetechengineer@lubpystudio.vn',
          signedAt: '2026-09-15 11:15',
          signatureStamp: 'SIG_TECH_BAO_2938491'
        },
        {
          role: 'ACCOUNTING_HEAD',
          title: 'Trưởng Phòng Kế Toán & Tài Chính',
          signerName: 'Nguyễn Văn Minh',
          signerEmail: 'trueaccounting@lubpystudio.vn',
          signedAt: '2026-09-15 14:00',
          signatureStamp: 'SIG_ACC_MINH_3847291'
        },
        {
          role: 'SUPER_ADMIN',
          title: 'Tổng Giám Đốc / Super Admin',
          signerName: 'LUBPY Super Admin',
          signerEmail: 'superadmin@lubpystudio.vn',
          signedAt: '2026-09-15 15:45',
          signatureStamp: 'SIG_ADMIN_SUPER_8392019'
        }
      ]
    },
    createdAt: '2026-09-15 09:00',
    updatedAt: '2026-09-22 09:15'
  }
];

export function getWorkflowProjects(): WorkflowProject[] {
  const raw = localStorage.getItem(STORAGE_KEY_WORKFLOW_PROJECTS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing workflow projects:', e);
    }
  }
  // Initialize with seed project
  localStorage.setItem(STORAGE_KEY_WORKFLOW_PROJECTS, JSON.stringify(INITIAL_WORKFLOW_PROJECTS));
  return INITIAL_WORKFLOW_PROJECTS;
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

