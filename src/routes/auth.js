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

        // Generate JWT Token with expiry
        const token = await user.getJWT(); // Fixed: Changed from getJWT to getJWT()
        console.log("Generated Token:", token);

        // Set Cookie Properly
        res.cookie("token", token, {
            httpOnly: true,
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

module.exports = authRouter;