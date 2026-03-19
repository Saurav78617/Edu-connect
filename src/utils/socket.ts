import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  if (!socket) {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // In dev, Vite proxies / to the same server, but for pure websocket we might want window.location.origin
    // Though io('/') usually works fine.
    socket = io(window.location.origin, {
      auth: { token }
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
