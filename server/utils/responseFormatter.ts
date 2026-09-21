/**
 * Standardized Response Formatter & Parallel Field Mappings
 * Ensures 100% compatibility across React Web SPA & Mobile Clients (Android/Flutter/React Native)
 */

export function successResponse<T>(data: T, message: string = 'Thao tác thành công', extraFields: Record<string, any> = {}) {
  return {
    success: true,
    data,
    message,
    ...extraFields,
  };
}

export function errorResponse(code: string, message: string, status: number = 400) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Format project object with parallel field names & parsed JSON arrays
 */
export function formatProjectResponse(p: any) {
  if (!p) return null;

  let techStackArr: string[] = [];
  let docsArr: any[] = [];
  let reportsArr: any[] = [];

  try {
    if (p.techStack) techStackArr = typeof p.techStack === 'string' ? JSON.parse(p.techStack) : p.techStack;
  } catch (e) {
    techStackArr = p.techStack ? [String(p.techStack)] : [];
  }

  try {
    if (p.documents) docsArr = typeof p.documents === 'string' ? JSON.parse(p.documents) : p.documents;
  } catch (e) {}

  try {
    if (p.reports) reportsArr = typeof p.reports === 'string' ? JSON.parse(p.reports) : p.reports;
  } catch (e) {}

  const priceNum = Number(p.priceVnd) || Number(p.price) || 0;
  const depositNum = Number(p.depositAmount) || Number(p.deposited) || 0;
  const remainingNum = Number(p.remainingAmount) || Math.max(0, priceNum - depositNum);

  const titleVal = p.title || p.projectName || p.name || 'Dự án Đồ Án CNTT';
  const descVal = p.description || p.details || '';
  const codeVal = p.projectCode || p.id || 'PRJ-2401';

  return {
    ...p,
    id: p.id || codeVal,
    projectCode: codeVal,
    code: codeVal,
    title: titleVal,
    projectName: titleVal,
    name: p.clientName || titleVal,
    description: descVal,
    details: descVal,
    priceVnd: priceNum,
    price: priceNum,
    totalAmount: priceNum,
    depositAmount: depositNum,
    deposited: depositNum,
    remainingAmount: remainingNum,
    remaining: remainingNum,
    status: p.status || 'PENDING',
    projectStatus: p.status || 'PENDING',
    clientName: p.clientName || 'Khách hàng',
    clientEmail: p.clientEmail || '',
    clientPhone: p.clientPhone || p.phone || '',
    phone: p.clientPhone || p.phone || '',
    email: p.clientEmail || '',
    thumbnailUrl: p.thumbnailUrl || p.image || null,
    imageUrl: p.thumbnailUrl || p.image || null,
    techStack: techStackArr,
    documents: docsArr,
    reports: reportsArr,
  };
}

/**
 * Format transaction object with parallel field names
 */
export function formatTransactionResponse(t: any) {
  if (!t) return null;

  const amount = Number(t.amountVnd) || Number(t.amount) || 0;
  const code = t.transactionCode || t.referenceCode || `TX-${t.id}`;
  const noteVal = t.note || t.description || '';

  return {
    ...t,
    id: t.id,
    transactionCode: code,
    referenceCode: code,
    code,
    amountVnd: amount,
    amount,
    type: t.type || 'PROJECT_DEPOSIT',
    txType: t.type || 'PROJECT_DEPOSIT',
    transactionType: t.type || 'PROJECT_DEPOSIT',
    status: t.status || 'completed',
    txStatus: t.status || 'completed',
    note: noteVal,
    description: noteVal,
    createdAt: t.createdAt,
    timestamp: t.createdAt,
  };
}

/**
 * Format ticket object with parallel field names & parsed messages
 */
export function formatTicketResponse(t: any) {
  if (!t) return null;

  let msgs: any[] = [];
  try {
    if (t.messages) msgs = typeof t.messages === 'string' ? JSON.parse(t.messages) : t.messages;
  } catch (e) {}

  const formattedMsgs = msgs.map((m: any) => {
    const contentVal = m.content || m.body || m.message || '';
    return {
      ...m,
      content: contentVal,
      body: contentVal,
      message: contentVal,
      sender: m.sender || 'Hệ thống',
      senderRole: m.senderRole || 'client',
      timestamp: m.timestamp || m.createdAt || new Date().toLocaleString('vi-VN'),
      createdAt: m.createdAt || m.timestamp || new Date().toISOString(),
    };
  });

  const code = t.ticketCode || t.id || 'TCK-1001';
  const subjectVal = t.subject || t.title || 'Hỗ trợ kỹ thuật';
  const descVal = t.description || t.content || t.body || '';

  return {
    ...t,
    id: t.id || code,
    ticketCode: code,
    code,
    subject: subjectVal,
    title: subjectVal,
    description: descVal,
    content: descVal,
    body: descVal,
    status: t.status || 'OPEN',
    priority: t.priority || 'MEDIUM',
    messages: formattedMsgs,
  };
}

/**
 * Format notification object with parallel field names
 */
export function formatNotificationResponse(n: any) {
  if (!n) return null;

  const titleVal = n.title || n.subject || 'Thông báo hệ thống';
  const contentVal = n.content || n.body || n.message || '';

  return {
    ...n,
    id: n.id,
    notifId: n.id,
    title: titleVal,
    subject: titleVal,
    content: contentVal,
    body: contentVal,
    message: contentVal,
    type: n.type || 'SYSTEM',
    notifType: n.type || 'SYSTEM',
    isRead: n.isRead === true || n.isRead === 'true',
  };
}

/**
 * Format chat message object with parallel field names
 */
export function formatChatMessageResponse(c: any) {
  if (!c) return null;

  const msgVal = c.message || c.content || c.body || '';

  return {
    ...c,
    id: c.id,
    sessionId: c.sessionId || 'default-session',
    message: msgVal,
    content: msgVal,
    body: msgVal,
    sender: c.sender || 'Khách hàng',
    senderId: c.senderId,
    senderRole: c.senderRole || 'client',
    createdAt: c.createdAt || new Date().toISOString(),
    timestamp: c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
  };
}

/**
 * Normalize project status from Mobile aliases to Canonical Database Enums
 */
export function normalizeProjectStatus(statusStr?: string): string | undefined {
  if (!statusStr) return undefined;
  const upper = statusStr.trim().toUpperCase();

  const mapping: Record<string, string> = {
    PLANNING: 'PENDING',
    IN_PROGRESS: 'CODING',
    COMPLETED: 'DELIVERED',
    ON_HOLD: 'PENDING',
    CONSULTING: 'CONSULTING',
    APPROVED: 'APPROVED',
    ASSIGNED: 'ASSIGNED',
    DEPOSIT_50: 'DEPOSIT_50',
    CODING: 'CODING',
    REVIEW: 'REVIEW',
    PAID_100: 'PAID_100',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
  };

  return mapping[upper] || upper;
}
