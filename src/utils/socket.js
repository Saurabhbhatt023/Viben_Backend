// utils/socket.js
const socketIO = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");

const getSecretRoomId = ({ userId, targetUserId }) => {
  const ids = [userId, targetUserId].sort();
  return crypto.createHash("sha256").update(ids.join("_")).digest("hex");
};

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 New connection:", socket.id);

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = [userId, targetUserId].sort().join("_");
      console.log(`User ${firstName} (${userId}) joining room: ${roomId}`);
      socket.join(roomId);
    });

    socket.on("sendMessage", async ({ firstName, userId, targetUserId, text }) => {
      console.log("📩 Message received:", text);
      const roomId = [userId, targetUserId].sort().join("_");

      io.to(roomId).emit("receiveMessage", {
        firstName,
        userId,
        targetUserId,
        text
      });

      // Save the message to the DB
      try {
        let chat = await Chat.findOne({
          participants: {
            $all: [userId, targetUserId]
          }
        });

        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUserId],
            messages: []
          });
        }

        chat.messages.push({
          senderId: userId,
          text,
        });

        await chat.save();
      } catch (err) {
        console.log("messageReceived error", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = initializeSocket;
