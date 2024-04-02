import chatSocket from "./chatSocket";

global.users = {};
global.selectedChat = {};

const sockets = (io) => {
  io.on("connection", (socket) => {
    console.debug("User connected successfully via socket!", {
      socketId: socket.id,
    });

    socket.on("join", async ({ user_id }) => {
      // const bs_token = getTokenFromCookie(socket.handshake.headers);
      socket.join(user_id);
      global.users[socket.id] = user_id;

      console.debug("User joined successfully!", {
        socketId: socket.id,
        user_id,
      });
    });

    socket.on("disconnect", () => {
      const socketId = socket.id;
      const user_id = global.users[socketId];
      console.debug("User disconnected!", { socketId, user_id });
      delete global.users[socketId];
      delete global.selectedChat[user_id];
    });

    //socket handlers
    chatSocket(io, socket);
  });
};

export default sockets;
