import { CustomSocket } from "../../types";

export default async function addQueue(socket: CustomSocket) {
  const { roomId } = socket;
  if (roomId) {
    socket.emit("songQueue");
    socket.to(roomId).emit("songQueue");
  }
}
