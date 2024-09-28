import { log } from "console";
import { CustomSocket, joinRoom } from "../../types";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";
import User from "../models/userModel";
import { errorHandler } from "./error";

export async function handleJoinRoom(socket: CustomSocket, data: joinRoom) {
  try {
    const { roomId } = data;
    const { userId } = socket;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    let room;

    // Handle existing room or create a new one
    if (roomId) {
      room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }
    } else {
      room = await Room.create({});
      if (!room) {
        throw new Error("Error creating Room");
      }
    }

    // Find the total number of documents for pagination metadata
    const totalUsers = await RoomUser.countDocuments({ roomId });
    console.log(
      totalUsers <= 1 ? "admin" : socket.role ? socket.role : "listener"
    );

    // Update or create room user entry
    const addedUser = await RoomUser.findOneAndUpdate(
      { userId, roomId: room._id },
      {
        active: true,
        socketid: socket.id,
        role:
          totalUsers <= 1 ? "admin" : socket.role ? socket.role : "listener",
      },
      { upsert: true, new: true }
    ).populate("userId");

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
  } catch (error: any) {
    console.log("JOIN ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
