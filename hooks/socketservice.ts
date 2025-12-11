// src/services/socketService.ts (Refactored)

import { io, Socket } from 'socket.io-client';
import { createClient } from '../utils/supabase/client'; // Your Supabase client utility

// Replace with your actual backend URL
const BACKEND_WS_URL = 'http://localhost:3000'; 

// This will be the globally accessible socket instance
export let socket: Socket | null = null;

// Function to establish and authenticate the socket connection
export const initializeSocket = async (boardId: string) => {
  if (socket && socket.connected) {
    // If already connected, ensure it's in the correct room (harmless to call again)
    socket.emit('joinBoard', boardId);
    return;
  }

  const supabase = createClient();
  
  try {
    // 1. Get the current Supabase session and token
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.error('Authentication required: No active session.');
      return;
    }

    // 2. Establish connection with JWT
    const newSocket = io(BACKEND_WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: session.access_token, // JWT for NestJS AuthGuard
      },
    });

    // 3. Set up listeners
    newSocket.on('connect', () => {
      console.log('Socket connected successfully.');
      // 4. Immediately join the specific board room upon connection
      newSocket.emit('joinBoard', boardId);
    });

    newSocket.on('disconnect', () => console.log('Socket disconnected.'));
    newSocket.on('error', (err) => console.error('Socket Error:', err));
    newSocket.on('exception', (data) => console.error('Socket Exception (from NestJS):', data));

    // Update the global instance
    socket = newSocket;

  } catch (error) {
    console.error('Failed to initialize socket:', error);
  }
};

/**
 * 💡 NEW EXPORT: Provides direct access to the active socket instance.
 */
export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};