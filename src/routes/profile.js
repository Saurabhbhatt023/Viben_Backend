const express = require('express');
const bcrypt = require('bcrypt');
const User = require("../models/user");
const { auth } = require("../middlewares/auth");
const { validatePasswordData, validateEditProfileData } = require("../utils/validation");
const profileRouter = express.Router();

// Get current user profile
profileRouter.get("/profile", auth, async (req, res) => {
  try {
    // req.user is already populated by the auth middleware
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error("Profile retrieval error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving profile" 
    });
  }
});

// Get user profile by ID
profileRouter.get("/profile/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Profile retrieval error:", error);
    res.status(500).json({
      success: false, 
      message: "Error retrieving profile"
    });
  }
});

// Update user profile
profileRouter.patch("/profile/update", auth, async (req, res) => {
  try {
    const updateFields = {};
    const allowedFields = ["firstName", "lastName", "gender", "age", "photoUrl", "about"];
    
    // Filter only allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });
    
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update"
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      updateFields,
      { new: true, runValidators: true }
    ).select("-password");
    
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile: " + error.message
    });
  }
});

// Password validation middleware
const validatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Check if all required fields are present
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        message: "Current password, new password and confirm password are required" 
      });
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        message: "New password and confirm password do not match" 
      });
    }

    // Validate new password requirements
    try {
      // This assumes validatePasswordData function exists and works correctly
      if (typeof validatePasswordData === 'function' && !validatePasswordData(newPassword)) {
        return res.status(400).json({ 
          message: "New password does not meet security requirements" 
        });
      }
    } catch (err) {
      // If validatePasswordData doesn't exist or has issues, use validator directly
      const validator = require('validator');
      if (!validator.isStrongPassword(newPassword, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })) {
        return res.status(400).json({
          message: "Password must be at least 8 characters long, with uppercase, lowercase, numbers, and special symbols."
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Password validation error" });
  }
};

// Change password route
profileRouter.post("/change-password", auth, validatePassword, async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: "New password cannot be same as current password" 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ message: "Error changing password" });
  }
});

module.exports = profileRouter;