const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        
        if (!token) {
            console.log("No token found in cookies");
            return res.status(401).json({ message: "Authentication required" });
        }
        
        try {
            const decodeObj = jwt.verify(token, process.env.JWT_SECRET);
            const { _id } = decodeObj;
            
            const user = await User.findById(_id);
            
            if (!user) {
                console.log("User not found with id:", _id);
                return res.status(404).json({ message: "User not found" });
            }
            
            // Add user to request object
            req.user = user;
            next();
        } catch (jwtError) {
            console.log("JWT verification failed:", jwtError.message);
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    } catch (err) {
        console.error("Auth middleware error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { auth };