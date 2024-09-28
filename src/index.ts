import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { runServer } from "./lib/db";
import Room from "./models/roomModel";
import { CustomSocket, joinRoom } from "../types";
import { prevSong } from "./handlers/prevSong";
import { nextSong } from "./handlers/nextSong";
import { handleJoinRoom } from "./handlers/handleJoinRoom";
import { handleDisconnect } from "./handlers/handleDisconnect";
import User from "./models/userModel";
import RoomUser from "./models/roomUsers";
import { Types } from "mongoose";
import addQueue from "./handlers/addQueue";
import { log } from "console";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.use(async (socket: CustomSocket, next) => {
  try {
    const token = socket.handshake.query.userId as string;
    const roomId =
      socket.handshake.query.roomId !== "null"
        ? (socket.handshake.query.roomId as string)
        : null;

    if (!Types.ObjectId.isValid(token)) {
      return next(new Error("Invalid user ID"));
    }

    if (roomId && !Types.ObjectId.isValid(roomId)) {
      return next(new Error("Invalid room ID"));
    }

    const isValidUser = await User.findById(token);
    if (!isValidUser) {
      return next(new Error("User not found"));
    }

    if (roomId) {
      const isValidRoom = await Room.findById(roomId);
      if (!isValidRoom) {
        return next(new Error("Invalid room"));
      }

      const getRole = await RoomUser.findOne({
        roomId,
        userId: token,
      });

      if (getRole) {
        socket.roomId = roomId;
        socket.role = getRole.role;
      }
    }
    socket.userId = token;
    next();
  } catch (error: any) {
    console.log(error);
    return next(new Error(error?.message || "Invalid token"));
  }
});

io.on("connection", (socket: CustomSocket) => {
  socket.on("joinRoom", (data: joinRoom) => {
    handleJoinRoom(socket, data);
  });
  socket.on("nextSong", (data) => {
    nextSong(socket, data);
  });
  socket.on("prevSong", (data) => {
    prevSong(socket, data);
  });
  socket.on("seek", (seek) => {
    const { roomId, role, userId } = socket;
    if (role === "admin" && roomId) {
      socket.to(roomId).emit("seek", { seek, role, userId });
    }
  });
  socket.on("queue", () => {
    addQueue(socket);
  });
  socket.on("update", () => {
    const { roomId } = socket;
    if (roomId) {
      socket.to(roomId).emit("update");
    }
  });
  socket.on("disconnect", () => {
    handleDisconnect(socket);
  });
});

runServer(server);
