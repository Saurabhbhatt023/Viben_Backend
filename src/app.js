const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const app = express();

app.use(express.json()); // To parse incoming JSON data

const connectDb = async () => {
  await mongoose.connect(
    "mongodb+srv://saurabhbhatt1211:8aMeDjuWoXHJl1kS@cluster023.k38ng.mongodb.net/Devtinder?tls=true"
  );
};

// Signup API
app.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req); // Validate input data

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

    res.cookie("token",  "skjdhfkjhdjkf");
    res.send("Login Successful");
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});

// Get User API (by emailId)
app.get("/user", async (req, res) => {
  const useremailId = req.query.emailId; // Use query params instead of body
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
connectDb()
  .then(() => {
    console.log("Database is established");
    app.listen(7777, () => {
      console.log(`Server is running on http://localhost:7777`);
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected: " + err);
  });
