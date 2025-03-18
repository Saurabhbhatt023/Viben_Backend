const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");

const authRouter = express.Router();

// ✅ Add CORS Headers for Netlify Frontend
authRouter.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://www.vibenweb.xyz"); // ✅ Allow Netlify
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// ✅ SIGNUP ROUTE: Registers a new user
authRouter.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);

    const {
      firstName,
      lastName,
      emailId,
      password,
      age,
      gender,
      photoUrl,
      about,
      skills,
      location,
      relationshipStatus,
      hobbies,
      phoneNumber,
      socialLinks
    } = req.body;

    // ✅ Hash Password Before Saving
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
      photoUrl,
      about,
      skills: skills || [],
      location,
      relationshipStatus,
      hobbies: hobbies || [],
      phoneNumber,
      socialLinks: socialLinks || []
    });

    await user.save();
    console.log("User saved:", user);

    res.status(201).json({
      success: true,
      message: "User Added Successfully",
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({
      success: false,
      message: "Error adding user: " + error.message
    });
  }
});

// ✅ LOGIN ROUTE: Logs in a user
authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Fix Password Validation
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // ✅ Send Secure Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({
      success: true,
      message: "Login successful",
      data: user
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
});

// ✅ LOGOUT ROUTE: Clears the token
authRouter.post("/logout", async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0)
    });

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
});

module.exports = authRouter;
