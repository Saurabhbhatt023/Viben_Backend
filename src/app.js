const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  origin: "http://localhost:3000", 
  credentials: true 
}));

// Routes
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);

// Database Connection
const connectDb = async () => {
  try {
    await mongoose.connect("mongodb+srv://saurabhbhatt1211:8aMeDjuWoXHJl1kS@cluster023.k38ng.mongodb.net/Devtinder?tls=true");
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
};

// Get User API (by emailId)
app.get("/user", async (req, res) => {
  const useremailId = req.query.emailId;
  try {
    const user = await User.find({ emailId: useremailId });
    if (user.length === 0) {
      return res.status(404).send("User not found");
    }
    res.json(user);
  } catch (err) {
    res.status(500).send("Something went wrong");
  }
});

// Connect to Database and Start Server
connectDb().then(() => {
  app.listen(7777, () => {
    console.log("Server is running on http://localhost:7777");
  });
});