import { CustomSocket } from "../../types";
import RoomUser from "../models/roomUsers";

export async function handleDisconnect(socket: CustomSocket) {
  try {
    const { userId, roomId } = socket;
    const data = await RoomUser.findOneAndUpdate(
      { userId, roomId },
      {
        active: false,
      }
    ).populate("userId");
    if (roomId && data?.userId) {
      socket.to(roomId).emit("userLeftRoom", data?.userId);
    }
  } catch (error) {
    console.log(error);
  }
}
