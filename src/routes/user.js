const express = require('express');
const { auth } = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require("../models/user");
const userRouter = express.Router();

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";

// Get all connections and requests
userRouter.get("/user/connections", auth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Find all connections where user is either sender or receiver
    const allConnectsions = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).populate('fromUserId toUserId', USER_SAFE_DATA);

    // Process and format the connections
    const formattedConnections = await Promise.all(allConnections.map(async (connection) => {
      // Determine if logged in user is sender or receiver
      const isSender = connection.fromUserId._id.toString() === loggedInUser._id.toString();
      const otherUser = isSender ? connection.toUserId : connection.fromUserId;

      return {
        _id: otherUser._id,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        photoUrl: otherUser.photoUrl || "https://geographyandyou.com/images/user-profile.png",
        about: otherUser.about || "This is a default about of the user!",
        skills: otherUser.skills || [],
        age: otherUser.age || null,
        gender: otherUser.gender || null,
        connectionId: connection._id,
        status: connection.status,
        isSender,
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

userRouter.get("/feed", auth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1;
    let  limit = parseInt(req.query.limit) || 10;
    limit  = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    // Fetch connection requests involving the logged-in user
    const connections = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }]
    }).select("fromUserId toUserId");

    // Create a set of users to hide from the feed
    const hideUserFromFeed = new Set();
    connections.forEach((req) => {
      hideUserFromFeed.add(req.fromUserId.toString());
      hideUserFromFeed.add(req.toUserId.toString());
    });

    // Exclude connected users and the logged-in user from the feed
    hideUserFromFeed.add(loggedInUser._id.toString());

    // Fetch users who are not in the connections list
    const users = await User.find({
      _id: { $nin: Array.from(hideUserFromFeed) }
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