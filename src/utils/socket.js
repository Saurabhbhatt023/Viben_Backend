// utils/socket.js
const socketIO = require("socket.io");
const crypto = require("crypto");

const getSecretRoomId = ({userId, targetUserId}) => {
  // Sort and join the IDs to ensure consistent room naming regardless of who initiates
  const ids = [userId, targetUserId].sort();
  return crypto.createHash("sha256").update(ids.join("_")).digest("hex");
};

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173", // Adjust if needed for your frontend
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 New connection:", socket.id);
    
    socket.on("joinChat", ({firstName, userId, targetUserId}) => {
      // Create a consistent room ID for the chat between these two users
      const roomId = [userId, targetUserId].sort().join("_");
      console.log(`User ${firstName} (${userId}) joining room: ${roomId}`);
      socket.join(roomId);
    });

    socket.on("sendMessage", ({firstName, userId, targetUserId, text}) => {
      console.log("📩 Message received:", text);
      // Get the room ID for these users
      const roomId = [userId, targetUserId].sort().join("_");
      // Emit the message to everyone in the room
      io.to(roomId).emit("receiveMessage", {
        firstName,
        userId,
        targetUserId,
        text
      });
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = initializeSocket;