import { CustomSocket, prevSong } from "../../types";

export async function prevSong(socket: CustomSocket, data: prevSong) {
  const { role } = socket;
  if (role === "admin") {
    const { prevSong, roomId } = data;

    socket.to(roomId).emit("prevSong", prevSong);
  }
}
