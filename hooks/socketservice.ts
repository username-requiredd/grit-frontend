// hooks/socketService.ts - Refactored to remove global singleton

import { io, Socket } from 'socket.io-client';

const BACKEND_WS_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'; 
const isDev = process.env.NODE_ENV === 'development';

/**
 * Creates a new authenticated socket connection for a specific board.
 * Each board gets its own socket instance to prevent conflicts.
 */
// 🛠️ FIX: Added token to the parameter list
export const createBoardSocket = async (boardId: string, token: string): Promise<Socket | null> => {
  try {
    // 🛠️ FIX: Fail fast if no token is provided
    if (!token) {
      console.error('[Socket] Authentication required: No token provided');
      return null;
    }

    if (isDev) {
      console.log(`[Socket] Creating connection for board ${boardId}`);
    }

    const socket = io(BACKEND_WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        // 🛠️ FIX: Pass the JWT token explicitly as 'token' to satisfy WsAuthGuard
        token: token,
      },
    });

    // Wait for connection with timeout
    const connected = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        socket.off('connect');
        socket.off('connect_error');
        resolve(false);
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        resolve(true);
      });

      // Added error logging here to catch any future AuthGuard rejections
      socket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
        clearTimeout(timeout);
        resolve(false);
      });
    });

    if (!connected) {
      console.error('[Socket] Connection timeout or rejected');
      socket.disconnect();
      return null;
    }

    if (isDev) {
      console.log(`[Socket] Connected with ID: ${socket.id}`);
    }

    return socket;
  } catch (error) {
    console.error('[Socket] Failed to create socket:', error);
    return null;
  }
};

/**
 * Safely disconnects a socket instance
 */
export const disconnectSocket = (socket: Socket | null): void => {
  if (socket?.connected) {
    socket.disconnect();
    if (isDev) {
      console.log('[Socket] Disconnected');
    }
  }
};