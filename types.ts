import { Schema } from "mongoose";
import { Socket } from "socket.io";

export interface CustomSocket extends Socket {
  userId?: string; // Optional property
  roomId?: string; // Optional property
  role?: "admin" | "listener";
}

export interface prevSong {
  prevSong: {};
  roomId: string;
}

export interface nextSong {
  nextSong: {};
  roomId: string;
}

export interface joinRoom {
  userId: string;
  roomId: string | null;
}
