/**
 * Socket server, distributing data to clients
 */

const { Server } = require("socket.io");
require("dotenv").config();

const port = process.env.SOCKET_SERVER_PORT || 3001;

const io = new Server(port, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join", (room) => {
    console.log("joining room", room);
    socket.join(room);
  });

  socket.on("data", (data) => {
    io.to(data.dataid).emit("data", data);
  });
});

console.log(`Socket server is running on port ${port}`);
