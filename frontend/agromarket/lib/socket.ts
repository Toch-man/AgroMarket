// lib/socket.ts
import { io, Socket } from "socket.io-client";

const BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

let socket: Socket | null = null;

export const connect_socket = (): Socket | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (!socket) {
    socket = io(BASE_URL, {
      auth: { token },
    });
  }

  return socket;
};

export const get_socket = (): Socket | null => socket;

export const disconnect_socket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
