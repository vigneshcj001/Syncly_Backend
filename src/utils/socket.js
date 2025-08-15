// socket.js
const socket = require("socket.io");
const crypto = require("crypto");
const Chat = require("../models/chat");

const getSecretRoomId = (userID, targetUserID) => {
  return crypto
    .createHash("sha256")
    .update([String(userID), String(targetUserID)].sort().join("$"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ userName, avatar, userID, targetUserID }) => {
      const roomId = getSecretRoomId(userID, targetUserID);
      //console.log(`${userName} joined room ${roomId}`);
      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      async ({ userName, avatar, userID, targetUserID, text }) => {
        const roomId = getSecretRoomId(userID, targetUserID);
        //console.log(`[${roomId}] ${userName}: ${text}`);

        try {
          // Find or create chat between participants
          let chat = await Chat.findOne({
            participants: { $all: [userID, targetUserID] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [userID, targetUserID],
              messages: [],
            });
          }

          // Add new message
          chat.messages.push({
            senderId: userID,
            text,
          });

          await chat.save();

          // Emit to both clients
          io.to(roomId).emit("messageReceived", { userName, avatar, text });
        } catch (err) {
          console.error("Error saving message:", err);
        }
      }
    );

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
