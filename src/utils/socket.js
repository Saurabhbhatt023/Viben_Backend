// utils/socket.js
const socketIO = require("socket.io");

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173", // Adjust if needed for your frontend
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 New user connected:", socket.id);

    socket.on("joinChat", () => {
      console.log("User joined the chat");
      // Optionally: socket.join("roomId");
    });

    socket.on("sendMessage", (message) => {
      console.log("📩 Message received:", message);
      // Broadcasting message to all other clients
      socket.broadcast.emit("receiveMessage", message);
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
