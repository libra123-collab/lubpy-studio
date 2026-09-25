/**
 * Socket.IO Real-time Synchronization Manager
 * For Web Frontend & Mobile Apps (Flutter / React Native)
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { storage } from '../../src/db/storage';

let ioInstance: SocketIOServer | null = null;

export function setupSocketIO(httpServer: HttpServer): SocketIOServer {
  const allowedOriginPatterns = [
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/.*\.run\.app$/,
    /^https:\/\/.*\.lubpystudio\.vn$/,
  ];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOriginPatterns.some(pattern => pattern.test(origin)) ||
          (process.env.APP_URL && origin === process.env.APP_URL);
        if (isAllowed) return callback(null, true);
        return callback(new Error(`Socket.IO CORS blocked: ${origin}`));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  io.use((socket: Socket, next) => {
    // Authenticate socket handshake if token is provided
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'LUBPY_STUDIO_ENTERPRISE_JWT_KEY_2026';
        const decoded = jwt.verify(token, secret);
        (socket as any).user = decoded;
      } catch (e) {
        // Allow connection as anonymous guest for public chat sessions
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    const socketId = socket.id;

    // Auto-join user-specific room if authenticated
    if (user?.uid) {
      socket.join(`user:${user.uid}`);
      if (user.role) {
        socket.join(`dept:${user.role.toUpperCase()}`);
      }
    }

    // Join custom room with strict authorization checks
    socket.on('join_room', async (roomName: string) => {
      if (typeof roomName !== 'string' || roomName.trim().length === 0) return;
      const cleanRoom = roomName.trim();
      const currentUser = (socket as any).user;

      // 1. Department rooms: e.g. dept:ADMIN, dept:ACCOUNTING, dept:DEV, dept:CS, dept:HR
      if (cleanRoom.startsWith('dept:')) {
        const targetDept = cleanRoom.split(':')[1]?.toUpperCase();
        const userRole = (currentUser?.role || '').toUpperCase();
        if (!currentUser || (userRole !== targetDept && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
          socket.emit('room_error', { room: cleanRoom, message: 'Bạn không có quyền truy cập kênh phòng ban này.' });
          return;
        }
      }

      // 2. Private User rooms: e.g. user:usr_123
      if (cleanRoom.startsWith('user:')) {
        const targetUid = cleanRoom.split(':')[1];
        const userRole = (currentUser?.role || '').toUpperCase();
        if (!currentUser || (currentUser.uid !== targetUid && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
          socket.emit('room_error', { room: cleanRoom, message: 'Bạn không có quyền truy cập kênh dữ liệu cá nhân này.' });
          return;
        }
      }

      // 3. Project rooms: e.g. project:PRJ-xxx
      if (cleanRoom.startsWith('project:')) {
        const projectId = cleanRoom.split(':')[1];
        if (!currentUser) {
          socket.emit('room_error', { room: cleanRoom, message: 'Vui lòng đăng nhập để tham gia kênh dự án.' });
          return;
        }
        const userRole = (currentUser.role || '').toUpperCase();
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
          try {
            const project = await storage.getProjectById(projectId);
            if (project) {
              const isOwner = (project.clientId && project.clientId === currentUser.uid) ||
                              (project.clientEmail && project.clientEmail.toLowerCase() === currentUser.email?.toLowerCase());
              const isDev = (project.assignedDevId && project.assignedDevId === currentUser.uid) ||
                            (project.assignedDevName && project.assignedDevName.toLowerCase() === currentUser.name?.toLowerCase());
              const isCs = (project.assignedCsId && project.assignedCsId === currentUser.uid) ||
                           (project.assignedCsName && project.assignedCsName.toLowerCase() === currentUser.name?.toLowerCase());
              if (!isOwner && !isDev && !isCs && !currentUser.isDepartmentHead) {
                socket.emit('room_error', { room: cleanRoom, message: 'Bạn không có quyền truy cập kênh dự án này.' });
                return;
              }
            }
          } catch (e) {}
        }
      }

      // 4. Ticket rooms: e.g. ticket:TCK-xxx
      if (cleanRoom.startsWith('ticket:')) {
        if (!currentUser) {
          socket.emit('room_error', { room: cleanRoom, message: 'Vui lòng đăng nhập để truy cập ticket.' });
          return;
        }
        const userRole = (currentUser.role || '').toUpperCase();
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'CS') {
          try {
            const ticket = await storage.getTicketById(cleanRoom.split(':')[1]);
            if (ticket) {
              const isOwner = (ticket.clientId && ticket.clientId === currentUser.uid) ||
                              (ticket.clientEmail && ticket.clientEmail.toLowerCase() === currentUser.email?.toLowerCase());
              if (!isOwner) {
                socket.emit('room_error', { room: cleanRoom, message: 'Bạn không có quyền xem ticket này.' });
                return;
              }
            }
          } catch (e) {}
        }
      }

      socket.join(cleanRoom);
      socket.emit('room_joined', { room: cleanRoom, status: 'success' });
    });

    // Leave custom room
    socket.on('leave_room', (roomName: string) => {
      if (typeof roomName === 'string') {
        socket.leave(roomName);
      }
    });

    // Live chat message broadcast in room
    socket.on('send_chat_message', (data: { room: string; sender: string; message: string; role?: string }) => {
      if (!data?.room || !data?.message) return;
      
      const payload = {
        sender: data.sender || user?.name || 'Khách hàng',
        senderRole: data.role || user?.role || 'client',
        message: data.message,
        createdAt: new Date().toISOString(),
      };

      io.to(data.room).emit('new_chat_message', payload);
    });

    // Client typing indicator
    socket.on('typing', (data: { room: string; isTyping: boolean; userName: string }) => {
      if (data?.room) {
        socket.to(data.room).emit('user_typing', data);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  ioInstance = io;
  console.log('⚡ Socket.IO Real-time Engine initialized and listening for Web & Mobile clients.');
  return io;
}

export const realtime = {
  getIO(): SocketIOServer | null {
    return ioInstance;
  },

  /**
   * Broadcast real-time project milestone update
   */
  emitProjectUpdate(projectId: string, payload: any) {
    if (!ioInstance) return;
    ioInstance.to(`project:${projectId}`).emit('project_updated', payload);
    ioInstance.to('dept:ADMIN').emit('project_updated', payload);
    ioInstance.to('dept:TECH_LEAD').emit('project_updated', payload);
  },

  /**
   * Broadcast real-time ticket update / status change
   */
  emitTicketUpdate(ticketId: string, payload: any) {
    if (!ioInstance) return;
    ioInstance.to(`ticket:${ticketId}`).emit('ticket_updated', payload);
    ioInstance.to('dept:CS').emit('ticket_updated', payload);
    ioInstance.to('dept:ADMIN').emit('ticket_updated', payload);
  },

  /**
   * Broadcast real-time ticket message update
   */
  emitTicketMessage(ticketId: string, message: any) {
    if (!ioInstance) return;
    ioInstance.to(`ticket:${ticketId}`).emit('new_ticket_message', message);
    ioInstance.to('dept:CS').emit('new_ticket_message', message);
    ioInstance.to('dept:ADMIN').emit('new_ticket_message', message);
  },

  /**
   * Broadcast notification to specific user or department
   */
  emitNotification(target: { userId?: string; dept?: string }, notification: any) {
    if (!ioInstance) return;
    if (target.userId) {
      ioInstance.to(`user:${target.userId}`).emit('notification_received', notification);
    }
    if (target.dept && target.dept !== 'ALL') {
      ioInstance.to(`dept:${target.dept.toUpperCase()}`).emit('notification_received', notification);
    } else {
      ioInstance.emit('notification_received', notification);
    }
  },

  /**
   * Broadcast transaction update to accounting & admin
   */
  emitTransactionUpdate(transaction: any) {
    if (!ioInstance) return;
    ioInstance.to('dept:ACCOUNTING').emit('transaction_updated', transaction);
    ioInstance.to('dept:ADMIN').emit('transaction_updated', transaction);
  },
};
