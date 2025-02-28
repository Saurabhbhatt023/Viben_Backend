const express = require('express');
const { validateSignUpData } = require("../utils/validation");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const user = require('../models/user');

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
       
       const passwordHash = await bcrypt.hash(password, 10);

       // Create user with all available fields
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

authRouter.post("/login", async (req, res) => {
   try {
       const { emailId, password } = req.body;
       const user = await User.findOne({ emailId });

       if (!user) {
           return res.status(404).json({
               success: false,
               message: "User not found"
           });
       }

       const isPasswordValid = await user.validatePassword(password)
       if (!isPasswordValid) {
           return res.status(401).json({
               success: false,
               message: "Invalid credentials"
           });
       }

       const token = await user.getJWT();
       console.log("Generated Token:", token);

       res.cookie("token", token, {
           httpOnly: true,
           secure: false,
           sameSite: "Strict",
           maxAge: 60 * 60 * 1000
       });

       res.json({
           success: true, 
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

authRouter.post("/logout", async (req, res) => {
   try {
       res.cookie("token", "", {
           httpOnly: true,
           secure: false,
           expires: new Date(Date.now())
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