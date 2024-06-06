/**
 * Socket client, acts as a client
 */
const { io } = require("socket.io-client");
require("dotenv").config();

const socketEndpoint = process.env.SOCKET_ENDPOINT || "http://localhost:3001";

const socket = io(socketEndpoint);

const dataid = ["ns=2;s={60327ECD-4EAC-4C32-8671-368665DF2FBE}"];

socket.on("connect", () => {
  console.log("connected");
  socket.emit("join", dataid);
});

socket.on("data", (data) => {
  console.log(data);
});
