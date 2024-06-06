/**
 * Socket client, acts as a client
 */
const { io } = require("socket.io-client");
require("dotenv").config();

const socketEndpoint = process.env.SOCKET_ENDPOINT || "http://localhost:3001";

const socket = io(socketEndpoint);

const dataid = [
  "ns=2;s={60327ECD-4EAC-4C32-8671-368665DF2FBE}",
  "ns=2;s={6138CE1D-ABF1-4635-B8E1-2C3FCC4992F6}",
  "ns=2;s={998AD6B2-9FC2-4439-BA26-13F76009AC6E}",
  "ns=2;s={A6D7DDEE-D95E-4E69-8F27-6CE98E22B261}",
  "ns=2;s={E15A467D-0591-4674-8489-089CC15E3E22}",
  "ns=2;s={3732841C-E846-438A-93EC-D73F986174D4}",
  "ns=2;s={CC07B88F-DD99-4C1F-99AB-A867B6393308}",
];

socket.on("connect", () => {
  console.log("connected");
  dataid.forEach((id) => {
    socket.emit("join", id);
  });
});

socket.on("data", (data) => {
  console.log(data);
});
