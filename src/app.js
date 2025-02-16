const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request body
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Allow frontend requests

// Database Connection
const connectDb = async () => {
  try {
    await mongoose.connect("mongodb+srv://saurabhbhatt1211:8aMeDjuWoXHJl1kS@cluster023.k38ng.mongodb.net/Devtinder?tls=true");
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
};

// Signup API
app.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);

    const { firstName, lastName, emailId, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    await user.save();
    console.log("User saved:", user);
    res.send("User Added Successfully");
  } catch (error) {
    res.status(400).send("Error adding user: " + error.message);
  }
});

// Login API
app.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send("Invalid credentials");
    }

    // Generate JWT Token with expiry
    const token = jwt.sign({ _id: user._id }, "Dev@Tinder", { expiresIn: "1h" });
    console.log("Generated Token:", token);

    // Set Cookie Properly
    res.cookie("token", token, {
      httpOnly: true,  // Prevents JavaScript access
      secure: false,   // Set to 'true' in production (HTTPS required)
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.json({ message: "Login Successful" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).send("Something went wrong");
  }
});


// Profile API - Read Cookie
app.get("/profile", async (req, res) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    // Verify the token
    const decodedMessage = jwt.verify(token, "Dev@Tinder");
    const { _id } = decodedMessage;

    console.log("Logged in user ID:", _id);

    // Fetch the user from the database
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});


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

// Delete User API
app.delete("/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    await User.findByIdAndDelete(userId);
    res.send("User Deleted Successfully");
  } catch (err) {
    res.status(500).send("Something went wrong");
  }
});

// Feed API (GET all users)
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).send("Error fetching users");
  }
});

// Update User API (PATCH)
app.patch("/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  const updateData = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.json(updatedUser);
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
