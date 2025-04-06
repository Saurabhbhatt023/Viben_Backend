// app.js
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

const { scheduleEmailJob } = require("./utils/cronjob");
const initializeSocket = require("./utils/socket");

dotenv.config();

const app = express();
const server = http.createServer(app); // 👈 Must be created before initializing socket
initializeSocket(server); // 👈 Initialize socket.io with the server

// --- CORS setup ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://www.vibenweb.xyz",
  "https://vibenweb.xyz",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400,
  })
);

// --- Middleware ---
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

app.use("/api", authRouter);
app.use("/api", profileRouter);
app.use("/api", requestRouter);
app.use("/api", userRouter);

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    cors: {
      allowedOrigins,
      credentials: true,
    },
  });
});

// --- MongoDB connection and server start ---
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_SECRET, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Database connected successfully");

    // Optional: start your cronjob
    scheduleEmailJob(4);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
};

connectDb().then(() => {
  const PORT = process.env.PORT || 7777;
  server.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
});

module.exports = app;
