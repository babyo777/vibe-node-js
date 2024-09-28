import { CustomSocket, nextSong } from "../../types";

export async function nextSong(socket: CustomSocket, data: nextSong) {
  const { role } = socket;

  if (role === "admin") {
    const { nextSong, roomId } = data;

    socket.to(roomId).emit("nextSong", nextSong);
  }
}
