const socket = require("socket.io");
const crypto = require("crypto");

const getSecretRoomId = (userID, targetUserID) => {
  return crypto
    .createHash("sha256")
    .update([String(userID), String(targetUserID)].sort().join("$"))
    .digest("hex");
};


const initializeSocket = (server)=>{
    const io = socket(server, {
      cors: {
        origin: "http://localhost:5173",
      },
    });

    io.on("connection",(socket)=>{
       socket.on("joinChat", ({ userName, avatar, userID, targetUserID }) => {
         const roomId = getSecretRoomId(userID, targetUserID);
         console.log(`${userName} joined room ${roomId}`);
         socket.join(roomId);
       });

       socket.on(
         "sendMessage",
         ({ userName, avatar, userID, targetUserID, text }) => {
           const roomId = getSecretRoomId(userID, targetUserID);
           console.log(`[${roomId}] ${userName}: ${text}`);
           io.to(roomId).emit("messageReceived", { userName, avatar, text });
         }
       );


        socket.on("disconnect", () => {});

    });

};
module.exports = initializeSocket;

