const socket = require("socket.io");
const crypto = require("crypto");

const getSecretRoomID = (userID, targetUserID) => {
  return crypto
    .createHash("sha256")
    .update([userID, targetUserID].sort().join("_#$@"))
    .digest("hex");
};
const initializeSocket = (server) => {
  const io = socket(server, {
    cors: { origin: "http://localhost:5173" },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("joinChat", ({ userName, avatar, userID, targetUserID }) => {
      const roomId = getSecretRoomID(userID, targetUserID);
      console.log(`${userName} joined room ${roomId}`);
      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      ({ userName, avatar, userID, targetUserID, text }) => {
        const roomId = getSecretRoomID(userID,targetUserID);
        console.log(`${userName}: ${text}`);
        io.to(roomId).emit("messageReceived", { userName, avatar, text });
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
