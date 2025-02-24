const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  origin: "http://localhost:5173", 
  credentials: true 
}));

// Routes
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');
const userRouter = require("./routes/user");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

// Database Connection
const connectDb = async () => {
  try {
    await mongoose.connect("mongodb+srv://saurabhbhatt1211:8aMeDjuWoXHJl1kS@cluster023.k38ng.mongodb.net/Devtinder?retryWrites=true&w=majority");
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
};

// Connect to Database and Start Server
connectDb().then(() => {
  app.listen(7777, () => {
    console.log("Server is running on http://localhost:7777");
  });
});