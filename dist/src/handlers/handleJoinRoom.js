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
exports.handleJoinRoom = handleJoinRoom;
const roomModel_1 = __importDefault(require("../models/roomModel"));
const roomUsers_1 = __importDefault(require("../models/roomUsers"));
const userModel_1 = __importDefault(require("../models/userModel"));
const error_1 = require("./error");
function handleJoinRoom(socket, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomId } = data;
            const { userId } = socket;
            // Find the user
            const user = yield userModel_1.default.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            let room;
            // Handle existing room or create a new one
            if (roomId) {
                room = yield roomModel_1.default.findById(roomId);
                if (!room) {
                    throw new Error("Room not found");
                }
            }
            else {
                room = yield roomModel_1.default.create({});
                if (!room) {
                    throw new Error("Error creating Room");
                }
            }
            // Find the total number of documents for pagination metadata
            const totalUsers = yield roomUsers_1.default.countDocuments({ roomId });
            console.log(totalUsers <= 1 ? "admin" : socket.role ? socket.role : "listener");
            // Update or create room user entry
            const addedUser = yield roomUsers_1.default.findOneAndUpdate({ userId, roomId: room._id }, {
                active: true,
                socketid: socket.id,
                role: totalUsers <= 1 ? "admin" : socket.role ? socket.role : "listener",
            }, { upsert: true, new: true }).populate("userId");
            if (!addedUser) {
                throw new Error("Unable to join room");
            }
            // Emit room join events
            socket.roomId = room._id.toString();
            socket.join(room._id.toString());
            socket.emit("joinedRoom", {
                roomId: room._id.toString(),
                user: {
                    _id: addedUser.userId._id,
                    //@ts-expect-error:ex
                    username: addedUser.userId.username,
                    //@ts-expect-error:ex
                    imageUrl: addedUser.userId.imageUrl,
                    role: addedUser.role,
                },
            });
            socket.to(room._id.toString()).emit("userJoinedRoom", {
                user,
            });
        }
        catch (error) {
            console.log("JOIN ERROR:", error.message);
            (0, error_1.errorHandler)(socket, error.message || "An unexpected error occurred");
        }
    });
}
