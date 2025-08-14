const express = require("express");
const connectDB = require("./config/database");
const authRouter = require("./routes/authRoutes");
const profileRouter = require("./routes/profileRoutes");
const requestRouter = require("./routes/requestRouter");
const networkRouter = require("./routes/networkRouter");
const portfolioRouter = require("./routes/portfolioRouter");
const chatRouter = require("./routes/chatRoutes");
const cookieParser = require("cookie-parser");
const http = require("http");
const initializeSocket = require("./utils/socket");
require("dotenv").config();
require("./utils/cronjob");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRouter);
app.use("/api", profileRouter);
app.use("/api", requestRouter);
app.use("/api", networkRouter);
app.use("/api", portfolioRouter);
app.use("/api", chatRouter);

// Create HTTP server
const server = http.createServer(app);
initializeSocket(server);

// Start server after DB connection
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
