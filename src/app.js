const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { scheduleEmailJob } = require("./utils/cronjob");
require("dotenv").config();

const app = express();

// ✅ FIXED CORS: Allows frontend (Netlify) & local dev
app.use(
  cors({
    origin: ["http://localhost:5173", "https://www.vibenweb.xyz"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Routes
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

// ✅ FIXED ROUTE PREFIXES (Now correctly uses `/api`)
app.use("/api", authRouter);
app.use("/api", profileRouter);
app.use("/api", requestRouter);
app.use("/api", userRouter);

// ✅ Database Connection
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_SECRET);
    console.log("✅ Database connected successfully");

    // ✅ Schedule the email job to run 4 minutes from now
    scheduleEmailJob(4);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
};

// ✅ Connect to Database and Start Server
connectDb().then(() => {
  const PORT = process.env.PORT || 7777;
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
});
