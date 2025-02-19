const express = require('express');
const { validateSignUpData } = require("../utils/validation");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

authRouter.post("/signup", async (req, res) => {
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

authRouter.post("/login", async (req, res) => {
   try {
       const { emailId, password } = req.body;
       const user = await User.findOne({ emailId });

       if (!user) {
           return res.status(404).send("User not found");
       }

       const isPasswordValid = await user.validatePassword(password)
       if (!isPasswordValid) {
           return res.status(401).send("Invalid credentials");
       }

       const token = await user.getJWT();
       console.log("Generated Token:", token);

       res.cookie("token", token, {
           httpOnly: true,
           secure: false,
           sameSite: "Strict",
           maxAge: 60 * 60 * 1000
       });

       res.json({ message: "Login Successful" });
   } catch (error) {
       console.error("Login Error:", error);
       res.status(500).send("Something went wrong");
   }
});

authRouter.post("/logout", async (req, res) => {
   try {
       res.cookie("token", "", {
           httpOnly: true,
           secure: false,
           expires: new Date(Date.now())
       });
       res.send("Logout Successful!");
   } catch (error) {
       res.status(500).send("Logout failed");
   }
}); 

module.exports = authRouter;