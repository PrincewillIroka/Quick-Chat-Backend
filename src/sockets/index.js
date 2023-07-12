import chatSocket from "./chatSocket";

global.users = {};

const sockets = (io) => {
  
  io.on("connection", (socket) => {
    console.log("User connected successfully via socket!");

    //socket handlers
    chatSocket(io, socket);
  });
};

export default sockets;
