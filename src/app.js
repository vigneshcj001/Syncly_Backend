const express = require("express");
const connectDB = require("./config/database");
const authRouter = require("./routes/authRoutes");
const profileRouter = require("./routes/profileRoutes");
const requestRouter = require("./routes/requestRouter");
const networkRouter = require("./routes/networkRouter");
const portfolioRouter =require("./routes/portfolioRouter")
const cookieParser = require("cookie-parser");
require("dotenv").config();

const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Your React app's address
    credentials: true, // To allow cookies
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


// Connect to MongoDB and start the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
