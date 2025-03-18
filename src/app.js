const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { scheduleEmailJob } = require("./utils/cronjob");
require("dotenv").config();

const app = express();

// Updated CORS to include both development and production domains
// Updated CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000", 
      "https://www.vibenweb.xyz",
      "https://vibenweb.xyz", // This was missing before
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    maxAge: 86400,
  })
);
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

// API routes with `/api` prefix
app.use("/api", authRouter);
app.use("/api", profileRouter);
app.use("/api", requestRouter);
app.use("/api", userRouter);

// Add health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Database Connection
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_SECRET);
    console.log("✅ Database connected successfully");

    // Schedule email job
    scheduleEmailJob(4);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
};

// Start Server
connectDb().then(() => {
  const PORT = process.env.PORT || 7777;
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
});

module.exports = app; // Export for testing purposes