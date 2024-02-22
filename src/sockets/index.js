import chatSocket from "./chatSocket";

global.users = {};
global.selectedChat = {};

const sockets = (io) => {
  
  io.on("connection", (socket) => {
    console.log("User connected successfully via socket!");

    //socket handlers
    chatSocket(io, socket);
  });
};

export default sockets;
