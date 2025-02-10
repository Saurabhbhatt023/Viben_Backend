const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");

const app = express();
app.use(express.json()); // To parse incoming JSON data

const connectDb = async () => {
  await mongoose.connect(
    "mongodb+srv://saurabhbhatt1211:8aMeDjuWoXHJl1kS@cluster023.k38ng.mongodb.net/Devtinder?tls=true"
  );
};

// Signup API
app.post("/signup", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    console.log("User saved:", user);
    res.send("User Added Successfully");
  } catch (error) {
    res.status(500).send("Error adding user: " + error.message);
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
    res.status(400).send("Something went wrong");
  }
});

// Delete User API
app.delete("/user", async (req, res) => {
  const userId = req.body.userId;
  try {
    await User.findByIdAndDelete(userId);
    res.send("User Deleted Successfully");
  } catch (err) {
    res.status(400).send("Something went wrong");
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
app.patch("/user", async (req, res) => {
  const userId = req.body.userId;
  const updateData = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.json(updatedUser);
  } catch (err) {
    res.status(400).send("Something went wrong");
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
    console.log("Database cannot be connected", err);
  });
