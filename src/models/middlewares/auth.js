// const jwt = require('jsonwebtoken');
// const User = require('../models/user');

// const auth = async (req, res, next) => {
//   try {
//     // Get token from cookie
//     const token = req.cookies.token;
    
//     // If no token found, return error
//     if (!token) {
//       return res.status(401).json({ message: "Authentication required" });
//     }
    
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Add timestamp validation
//     const now = Math.floor(Date.now() / 1000);
//     if (decoded.exp && decoded.exp < now) {
//       return res.status(401).json({ message: "Token expired" });
//     }
    
//     // Find user by id - handle both id and _id formats that might be used in the token
//     const userId = decoded.id || decoded._id;
    
//     if (!userId) {
//       return res.status(401).json({ message: "Invalid token format" });
//     }
    
//     const user = await User.findById(userId).select('-password');
    
//     // If no user found, return error
//     if (!user) {
//       return res.status(401).json({ message: "Authentication failed: User not found" });
//     }
    
//     // Add user to request
//     req.user = user;
//     next();
//   } catch (err) {
//     console.error("Auth middleware error:", err);
//     return res.status(401).json({ message: "Authentication failed" });
//   }
// };

// module.exports = { auth };