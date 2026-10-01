import { io, Socket } from 'socket.io-client';

let clientSocket: Socket | null = null;
let isConnecting = false;

export interface SocketClientOptions {
  token?: string;
  autoConnect?: boolean;
}

/**
 * Initializes and returns the shared client-side Socket.IO instance.
 * Automatically handles WebSocket errors, connection drops, and iframe constraints gracefully.
 */
export function getClientSocket(options: SocketClientOptions = {}): Socket | null {
  if (typeof window === 'undefined') return null;

  if (clientSocket && clientSocket.connected) {
    return clientSocket;
  }

  if (clientSocket && !clientSocket.connected) {
    return clientSocket;
  }

  if (isConnecting) {
    return clientSocket;
  }

  try {
    isConnecting = true;
    const token = options.token || localStorage.getItem('token') || undefined;

    // Use current origin or relative path, preferring polling fallback if websocket is restricted
    clientSocket = io(window.location.origin, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'], // Start with polling to guarantee reliability in iframe
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2500,
      timeout: 10000,
      autoConnect: options.autoConnect ?? true,
      auth: token ? { token } : undefined,
    });

    // 1. Error event listener - absorb without throwing
    clientSocket.on('error', (err: any) => {
      // Soft logging, avoid Unhandled Rejection
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[Client Socket] Handled error:', err?.message || err);
      }
    });

    // 2. Connect error event listener (e.g. WebSocket handshake fails in iframe preview)
    clientSocket.on('connect_error', (err: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[Client Socket] Connection notice (auto-falling back):', err?.message || err);
      }
    });

    // 3. Close event listener
    clientSocket.on('close', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[Client Socket] Closed cleanly.');
      }
    });

    // 4. Disconnect event listener
    clientSocket.on('disconnect', (reason: string) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[Client Socket] Disconnected cleanly:', reason);
      }
      if (reason === 'io server disconnect') {
        // The server forcefully disconnected the socket, retry manually if needed
        clientSocket?.connect();
      }
    });

    isConnecting = false;
    return clientSocket;
  } catch (err: any) {
    isConnecting = false;
    console.debug('[Client Socket] Initialization notice:', err?.message || err);
    return null;
  }
}

/**
 * Safely disconnects the client socket
 */
export function disconnectClientSocket() {
  if (clientSocket) {
    try {
      clientSocket.removeAllListeners();
      clientSocket.disconnect();
    } catch {
      // Ignore cleanup error
    } finally {
      clientSocket = null;
      isConnecting = false;
    }
  }
}
