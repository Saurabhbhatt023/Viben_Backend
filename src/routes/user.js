const express = require('express');
const { auth } = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require("../models/user");
const userRouter = express.Router();

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";

// Get all connections and requests
// In user.js - Let's modify this function
// Modify user.js - `/user/connections` route
// In user.js - Improve the connections formatting logic
userRouter.get("/user/connections", auth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Find all connections where user is either sender or receiver
    const allConnections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).populate('fromUserId toUserId', USER_SAFE_DATA);

    console.log("All connections found:", allConnections.length);

    // Add defensive checks
    const formattedConnections = [];
    
    for (const connection of allConnections) {
      try {
        // Check if both users are populated correctly
        if (!connection.fromUserId || !connection.toUserId) {
          console.log("Skipping connection with missing user:", connection._id);
          continue;
        }
        
        // Determine if logged-in user is the sender
        const isSender = connection.fromUserId._id.toString() === loggedInUser._id.toString();
        
        // Get the other user (the one who is not the logged-in user)
        const otherUser = isSender ? connection.toUserId : connection.fromUserId;
        
        if (!otherUser || !otherUser._id) {
          console.log("Other user not found for connection:", connection._id);
          continue;
        }

        // Only add the connection if it has the relevant status
        formattedConnections.push({
          _id: otherUser._id,
          firstName: otherUser.firstName || "Unknown",
          lastName: otherUser.lastName || "User",
          photoUrl: otherUser.photoUrl || "/default-avatar.png",
          about: otherUser.about || "This is a default about of the user!",
          skills: otherUser.skills || [],
          age: otherUser.age || null,
          gender: otherUser.gender || null,
          connectionId: connection._id,
          status: connection.status,
          isSender,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt
        });
      } catch (err) {
        console.error("Error processing connection:", err, connection);
      }
    }

    // Filter connections by status
    const connections = {
      // Only include connections that are accepted
      accepted: formattedConnections.filter(conn => conn.status === "accepted"),
      interested: formattedConnections.filter(conn => conn.status === "interested"),
      ignored: formattedConnections.filter(conn => conn.status === "ignored"),
      rejected: formattedConnections.filter(conn => conn.status === "rejected")
    };

    res.json({
      success: true,
      data: connections
    });

  } catch (err) {
    console.error('Error in getting connections:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
// Get received requests
userRouter.get("/user/requests/received", auth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    
    const requests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested"  // Only show pending requests
    }).populate('fromUserId', USER_SAFE_DATA);

    const formattedRequests = requests.map(request => ({
      _id: request._id,
      fromUser: {
        _id: request.fromUserId._id,
        firstName: request.fromUserId.firstName,
        lastName: request.fromUserId.lastName,
        photoUrl: request.fromUserId.photoUrl || "https://geographyandyou.com/images/user-profile.png",
        about: request.fromUserId.about || "This is a default about of the user!",
        skills: request.fromUserId.skills || [],
        age: request.fromUserId.age,
        gender: request.fromUserId.gender
      },
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    }));

    res.json({
      success: true,
      data: formattedRequests
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// In user.js - Fix the feed endpoint
userRouter.get("/feed", auth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    // Fetch ALL connection requests involving the logged-in user
    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).select("fromUserId toUserId status");

    // Create a set of users to exclude from the feed
    const hideUserIds = new Set();
    
    // Add the logged-in user to the exclusion list
    hideUserIds.add(loggedInUser._id.toString());
    
    // For each connection, add the other user to the exclusion list
    connections.forEach((connection) => {
      if (connection.fromUserId.toString() === loggedInUser._id.toString()) {
        // The logged-in user sent this request - exclude the recipient
        hideUserIds.add(connection.toUserId.toString());
      } else {
        // The logged-in user received this request - exclude the sender
        hideUserIds.add(connection.fromUserId.toString());
      }
    });

    // Fetch users who aren't in the exclusion list
    const users = await User.find({
      _id: { $nin: Array.from(hideUserIds) }
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = userRouter;