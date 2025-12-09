// lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001', {
      auth: (cb) => {
        // We'll set the token later from session
        cb({ token: null });
      },
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
};

