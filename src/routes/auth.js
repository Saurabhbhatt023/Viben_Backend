const express = require("express");
const User = require("../models/user");
const { auth } = require("../middlewares/auth");
const router = express.Router();

// Login route with enhanced debugging
router.post("/login", async (req, res) => {
  try {
    console.log("⭐ Login attempt received:", req.body.emailId);
    const { emailId, password } = req.body;
    
    // Validate required fields
    if (!emailId || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }
    
    // Find user by email
    console.log("🔍 Searching for user:", emailId);
    const user = await User.findOne({ emailId });
    if (!user) {
      console.log("❌ User not found:", emailId);
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }
    
    console.log("✅ User found:", user._id);
    
    // Verify password
    console.log("🔐 Verifying password...");
    
    // Check if method exists
    if (typeof user.comparePassword !== 'function') {
      console.error("❌ comparePassword method not found on user model!");
      return res.status(500).json({ 
        message: "Internal server error - auth method missing" 
      });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("❌ Invalid password for user:", emailId);
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }
    
    console.log("✅ Password valid");
    
    // Generate JWT token
    console.log("🔑 Generating JWT token...");
    
    // Check if method exists
    if (typeof user.getJWT !== 'function') {
      console.error("❌ getJWT method not found on user model!");
      return res.status(500).json({ 
        message: "Internal server error - auth method missing" 
      });
    }
    
    const token = await user.getJWT();
    console.log("✅ Token generated:", token ? "Success" : "Failed");
    
    // Set cookie - updated for local development
    console.log("🍪 Setting auth cookie...");
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // False for local development
      sameSite: process.env.NODE_ENV === 'production' ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/"
    });
    
    // Return user data without sensitive information
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      photoUrl: user.photoUrl
    };
    
    console.log("✅ Login successful for:", emailId);
    
    return res.status(200).json({
      message: "Login successful",
      data: userData
    });
    
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// Signup route with enhanced debugging
router.post("/signup", async (req, res) => {
  try {
    console.log("⭐ Signup attempt received:", req.body.emailId);
    const { firstName, lastName, emailId, password } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !emailId || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }
    
    // Check if user already exists
    console.log("🔍 Checking if user exists:", emailId);
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      console.log("❌ User already exists:", emailId);
      return res.status(409).json({ 
        message: "User already exists with this email" 
      });
    }
    
    // Create new user
    console.log("👤 Creating new user:", emailId);
    const newUser = new User({
      firstName,
      lastName,
      emailId,
      password // Will be hashed by the pre-save hook
    });
    
    // Save user to database
    console.log("💾 Saving user to database...");
    await newUser.save();
    console.log("✅ User saved to database");
    
    // Generate JWT token
    console.log("🔑 Generating JWT token...");
    const token = await newUser.getJWT();
    console.log("✅ Token generated");
    
    // Set cookie - updated for local development
    console.log("🍪 Setting auth cookie...");
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // False for local development
      sameSite: process.env.NODE_ENV === 'production' ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/"
    });
    
    // Return user data without sensitive information
    const userData = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      emailId: newUser.emailId,
      photoUrl: newUser.photoUrl
    };
    
    console.log("✅ Signup successful for:", emailId);
    
    return res.status(201).json({
      success: true,
      message: "Signup successful",
      data: userData
    });
    
  } catch (err) {
    console.error("❌ Signup error:", err);
    return res.status(500).json({ message: "Signup failed. Please try again." });
  }
});

// Test route to check auth middleware
router.get("/test-auth", auth, (req, res) => {
  res.json({ 
    message: "Authentication successful", 
    user: {
      id: req.user._id,
      email: req.user.emailId
    }
  });
});

module.exports = router;