"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = require("./lib/db");
const roomModel_1 = __importDefault(require("./models/roomModel"));
const prevSong_1 = require("./handlers/prevSong");
const nextSong_1 = require("./handlers/nextSong");
const handleJoinRoom_1 = require("./handlers/handleJoinRoom");
const handleDisconnect_1 = require("./handlers/handleDisconnect");
const userModel_1 = __importDefault(require("./models/userModel"));
const roomUsers_1 = __importDefault(require("./models/roomUsers"));
const mongoose_1 = require("mongoose");
const addQueue_1 = __importDefault(require("./handlers/addQueue"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000",
    },
});
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = socket.handshake.query.userId;
        const roomId = socket.handshake.query.roomId !== "null"
            ? socket.handshake.query.roomId
            : null;
        if (!mongoose_1.Types.ObjectId.isValid(token)) {
            return next(new Error("Invalid user ID"));
        }
        if (roomId && !mongoose_1.Types.ObjectId.isValid(roomId)) {
            return next(new Error("Invalid room ID"));
        }
        const isValidUser = yield userModel_1.default.findById(token);
        if (!isValidUser) {
            return next(new Error("User not found"));
        }
        if (roomId) {
            const isValidRoom = yield roomModel_1.default.findById(roomId);
            if (!isValidRoom) {
                return next(new Error("Invalid room"));
            }
            const getRole = yield roomUsers_1.default.findOne({
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
    }
    catch (error) {
        console.log(error);
        return next(new Error((error === null || error === void 0 ? void 0 : error.message) || "Invalid token"));
    }
}));
io.on("connection", (socket) => {
    socket.on("joinRoom", (data) => {
        (0, handleJoinRoom_1.handleJoinRoom)(socket, data);
    });
    socket.on("nextSong", (data) => {
        (0, nextSong_1.nextSong)(socket, data);
    });
    socket.on("prevSong", (data) => {
        (0, prevSong_1.prevSong)(socket, data);
    });
    socket.on("seek", (seek) => {
        const { roomId, role, userId } = socket;
        if (role === "admin" && roomId) {
            socket.to(roomId).emit("seek", { seek, role, userId });
        }
    });
    socket.on("queue", () => {
        (0, addQueue_1.default)(socket);
    });
    socket.on("update", () => {
        const { roomId } = socket;
        if (roomId) {
            socket.to(roomId).emit("update");
        }
    });
    socket.on("disconnect", () => {
        (0, handleDisconnect_1.handleDisconnect)(socket);
    });
});
(0, db_1.runServer)(server);
