const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        
        if (!token) {
            return res.status(401).send("Please login");
        }
        
        try {
            const decodeObj = await jwt.verify(token, process.env.JWT_SECRET);
            const { _id } = decodeObj;
            const user = await User.findById(_id);
            
            if (!user) {
                return res.status(404).send("User not found");
            }
            
            req.user = user;
            next();
        } catch (jwtError) {
            return res.status(401).send("Invalid token");
        }
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
};

module.exports = { auth };