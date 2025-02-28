const express = require('express');
const bcrypt = require('bcrypt');
const User = require("../models/user");
const { auth } = require("../middlewares/auth");
const { validatePasswordData, validateEditProfileData } = require("../utils/validation");

const profileRouter = express.Router();

// ✅ Get current user profile
profileRouter.get("/profile", auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error("Profile retrieval error:", error);
    res.status(500).json({ success: false, message: "Error retrieving profile" });
  }
});

// ✅ Get user profile by ID
profileRouter.get("/profile/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Profile retrieval error:", error);
    res.status(500).json({ success: false, message: "Error retrieving profile" });
  }
});

// ✅ Update user profile
profileRouter.patch("/profile/update", auth, async (req, res) => {
  try {
    const allowedFields = [
      "firstName", "lastName", "gender", "age", "photoUrl",
      "about", "skills", "location", "hobbies", "relationshipStatus"
    ];
    
    const updateFields = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = field === 'age' ? Number(req.body[field]) : req.body[field];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    console.log("Updating user profile with fields:", updateFields);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      { $set: updateFields }, 
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, message: "Error updating profile: " + error.message });
  }
});

// ✅ Password validation middleware
const validatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password do not match" });
    }

    if (typeof validatePasswordData === 'function' && !validatePasswordData(newPassword)) {
      return res.status(400).json({ message: "New password does not meet security requirements" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Password validation error" });
  }
};

// ✅ Change password route
profileRouter.post("/change-password", auth, validatePassword, async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!await bcrypt.compare(currentPassword, user.password)) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: "New password cannot be the same as the current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ message: "Error changing password" });
  }
});

module.exports = profileRouter;
