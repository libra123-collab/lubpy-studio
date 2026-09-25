// Unified API Client for LUBPY Studio PostgreSQL Full-Stack Architecture
// Seamlessly compatible with standard { success: true, data: ..., message: ... } responses

const API_BASE = '/api';

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lubpy_auth_token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.error || data?.message || `Lỗi yêu cầu API (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // 1. Auth API
  auth: {
    login: (credentials: { email: string; password: string }) => 
      request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    
    register: (userData: any) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    
    adminLogin: (credentials: { email: string; password: string; adminSecurityKey?: string }) =>
      request('/auth/admin-login', { method: 'POST', body: JSON.stringify(credentials) }),
    
    syncAccount: (data: any) =>
      request('/auth/sync-account', { method: 'POST', body: JSON.stringify(data) }).catch(() => null),
    
    sendOtp: (target: string, type: 'email' | 'phone' = 'email') =>
      request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ target, type }) }),
    
    verifyOtp: (target: string, code: string) =>
      request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ target, code }) }),
    
    me: () => request('/auth/me'),
    profile: () => request('/auth/profile'),
    
    logout: () => request('/auth/logout', { method: 'POST' }),
  },

  // 2. Projects API
  projects: {
    list: () => request('/projects').then((res: any) => res?.data !== undefined ? res.data : res),
    get: (id: string) => request(`/projects/${encodeURIComponent(id)}`).then((res: any) => res?.data !== undefined ? res.data : res),
    create: (projectData: any) => request('/projects', { method: 'POST', body: JSON.stringify(projectData) }).then((res: any) => res?.data !== undefined ? res.data : res),
    update: (id: string, updateData: any) => request(`/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(updateData) }).then((res: any) => res?.data !== undefined ? res.data : res),
    generateThumbnail: (data: { title: string; projectType?: string; techStack?: string }) =>
      request('/projects/generate-thumbnail', { method: 'POST', body: JSON.stringify(data) }).then((res: any) => res?.data !== undefined ? res.data : res),
    assign: (id: string, assignment: { userId?: string; userName: string; role: string }) =>
      request(`/projects/${encodeURIComponent(id)}/assignments`, { method: 'POST', body: JSON.stringify(assignment) }).then((res: any) => res?.data !== undefined ? res.data : res),
  },

  // 3. Transactions & Financials & Wallet
  transactions: {
    list: () => request('/transactions').then((res: any) => res?.data !== undefined ? res.data : res),
    create: (txData: any) => request('/transactions', { method: 'POST', body: JSON.stringify(txData) }).then((res: any) => res?.data !== undefined ? res.data : res),
    confirm: (id: number | string) => request(`/transactions/${id}/confirm`, { method: 'PUT' }).then((res: any) => res?.data !== undefined ? res.data : res),
    summary: () => request('/transactions/summary').then((res: any) => res?.data !== undefined ? res.data : res),
    deposit: (depositData: any) => request('/wallet/deposit', { method: 'POST', body: JSON.stringify(depositData) }).then((res: any) => res?.data !== undefined ? res.data : res),
  },

  // 4. CSKH & Tickets
  tickets: {
    list: () => request('/tickets').then((res: any) => res?.data !== undefined ? res.data : res),
    get: (id: string) => request(`/tickets/${encodeURIComponent(id)}`).then((res: any) => res?.data !== undefined ? res.data : res),
    create: (ticketData: any) => request('/tickets', { method: 'POST', body: JSON.stringify(ticketData) }).then((res: any) => res?.data !== undefined ? res.data : res),
    update: (id: string, data: any) => request(`/tickets/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }).then((res: any) => res?.data !== undefined ? res.data : res),
    addMessage: (id: string, messageData: { sender: string; content: string }) =>
      request(`/tickets/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify(messageData) }).then((res: any) => res?.data !== undefined ? res.data : res),
    reply: (id: string, messageData: any) =>
      request(`/tickets/${encodeURIComponent(id)}/reply`, { method: 'POST', body: JSON.stringify(messageData) }).then((res: any) => res?.data !== undefined ? res.data : res),
    liveChats: (sessionId?: string) => request(`/chat/messages${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`).then((res: any) => res?.data !== undefined ? res.data : res),
    sendLiveChat: (chatData: any) => request('/chat/messages', { method: 'POST', body: JSON.stringify(chatData) }).then((res: any) => res?.data !== undefined ? res.data : res),
  },

  // 5. HR & Users
  users: {
    list: () => request('/users').then((res: any) => res?.data !== undefined ? res.data : res),
    create: (userData: any) => request('/users', { method: 'POST', body: JSON.stringify(userData) }).then((res: any) => res?.data !== undefined ? res.data : res),
    update: (id: number | string, userData: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }).then((res: any) => res?.data !== undefined ? res.data : res),
    saveFcmToken: (fcmToken: string, platform: string = 'web') =>
      request('/users/fcm-token', { method: 'POST', body: JSON.stringify({ fcmToken, platform }) }).then((res: any) => res?.data !== undefined ? res.data : res),
    interviews: () => request('/users/interviews').then((res: any) => res?.data !== undefined ? res.data : res),
    createInterview: (data: any) => request('/users/interviews', { method: 'POST', body: JSON.stringify(data) }).then((res: any) => res?.data !== undefined ? res.data : res),
  },

  // 6. Notifications & Audit Logs
  notifications: {
    list: () => request('/notifications').then((res: any) => res?.data !== undefined ? res.data : res),
    create: (notifData: any) => request('/notifications', { method: 'POST', body: JSON.stringify(notifData) }).then((res: any) => res?.data !== undefined ? res.data : res),
    markRead: (id: number | string) => request(`/notifications/${id}/read`, { method: 'PUT' }).then((res: any) => res?.data !== undefined ? res.data : res),
    auditLogs: () => request('/notifications/audit-logs').then((res: any) => res?.data !== undefined ? res.data : res),
  },

  // 7. Dashboards
  dashboard: {
    admin: () => request('/dashboard/admin').then((res: any) => res?.data !== undefined ? res.data : res),
    developer: () => request('/dashboard/developer').then((res: any) => res?.data !== undefined ? res.data : res),
    cs: () => request('/dashboard/cs').then((res: any) => res?.data !== undefined ? res.data : res),
    accounting: () => request('/dashboard/accounting').then((res: any) => res?.data !== undefined ? res.data : res),
    hr: () => request('/dashboard/hr').then((res: any) => res?.data !== undefined ? res.data : res),
  },
};

// Helper aliases for legacy backward-compatible calls
export const fetchProjectsFromDb = () => api.projects.list();
export const createProjectInDb = (data: any) => api.projects.create(data);
export const updateProjectInDb = (id: string, data: any) => api.projects.update(id, data);
export const fetchFinancialSummaryFromDb = () => api.transactions.summary();
export const fetchTransactionsFromDb = () => api.transactions.list();
export const createTransactionInDb = (data: any) => api.transactions.create(data);
export const fetchTicketsFromDb = () => api.tickets.list();
export const createTicketInDb = (data: any) => api.tickets.create(data);
export const fetchLiveChatsFromDb = () => api.tickets.liveChats();
export const sendLiveChatMessageInDb = (data: any) => api.tickets.sendLiveChat(data);
export const fetchInterviewsFromDb = () => api.users.interviews();
export const createInterviewInDb = (data: any) => api.users.createInterview(data);
export const fetchServerLogsFromDb = () => api.notifications.auditLogs();
export const createServerLogInDb = (data: any) => api.notifications.auditLogs();
