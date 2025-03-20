const express = require("express");
const User = require("../models/user");
const { auth } = require("../middlewares/auth")
const router = express.Router();

// Login route
router.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    
    if (!emailId || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ emailId });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = await user.getJWT();
    
    // FIXED: Proper cookie configuration for cross-origin requests
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Required for HTTPS
      sameSite: "None", // Critical for cross-origin requests
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/", // Ensure cookie is sent for all paths
    });

    // Return user data without sensitive information
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      photoUrl: user.photoUrl,
      // Include other non-sensitive fields as needed
    };

    return res.status(200).json({ 
      message: "Login successful", 
      data: userData 
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Additional routes...

module.exports = router;