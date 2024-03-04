import chatSocket from "./chatSocket";

global.users = {};
global.selectedChat = {};

const sockets = (io) => {
  io.on("connection", (socket) => {
    console.debug("User connected successfully via socket!", {
      socketId: socket.id,
    });

    //socket handlers
    chatSocket(io, socket);
  });
};

export default sockets;
