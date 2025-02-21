const express = require('express');
const { auth } = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require("../models/user");
const userRouter = express.Router();

// Get all connections and requests
userRouter.get("/user/connections", auth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Find all connections where user is either sender or receiver
    const allConnections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).populate('fromUserId toUserId', 'firstName lastName photoUrl about skills age gender');

    // Process and format the connections
    const formattedConnections = await Promise.all(allConnections.map(async (connection) => {
      // Determine if logged in user is sender or receiver
      const isSender = connection.fromUserId._id.toString() === loggedInUser._id.toString();
      const otherUser = isSender ? connection.toUserId : connection.fromUserId;

      // Get full user data
      const userData = await User.findById(otherUser._id)
        .select('firstName lastName photoUrl about skills age gender');

      return {
        _id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        photoUrl: userData.photoUrl || "https://geographyandyou.com/images/user-profile.png",
        about: userData.about || "This is a default about of the user!",
        skills: userData.skills || [],
        age: userData.age || null,
        gender: userData.gender || null,
        connectionId: connection._id,
        status: connection.status,
        isSender: isSender,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
      };
    }));

    // Separate connections by status
    const connections = {
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
    }).populate('fromUserId', 'firstName lastName photoUrl about skills age gender');

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

module.exports = userRouter;