const express = require("express");
const requestRouter = express.Router();
const { auth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

// Send connection request with status parameter
requestRouter.post("/request/send/:status/:toUserId", auth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status.toLowerCase();

    // Validate status
    if (!["interested", "ignored"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'interested' or 'ignored'"
      });
    }

    // Check if target user exists
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if sender and receiver are the same
    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a request to yourself"
      });
    }

    // Check if request already exists
    const existingRequest = await ConnectionRequest.findOne({
      fromUserId,
      toUserId
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You have already sent a request to this user"
      });
    }

    // Create new request
    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status
    });

    await connectionRequest.save();

    res.status(201).json({
      success: true,
      message: `Request sent successfully with status: ${status}`,
      data: connectionRequest
    });

  } catch (err) {
    console.error('Error in sending request:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Review (accept/reject) a received request
requestRouter.post("/request/review/:status/:requestId", auth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { status, requestId } = req.params;

    // Validate status
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'accepted' or 'rejected'"
      });
    }

    // Find the request
    const request = await ConnectionRequest.findOne({
      _id: requestId,
      toUserId: loggedInUser._id,
      status: "interested"  // Only update pending requests
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or already processed"
      });
    }

    // Update request status
    request.status = status;
    await request.save();

    // If accepted, populate user details for response
    if (status === "accepted") {
      await request.populate('fromUserId', 'firstName lastName photoUrl about skills age gender');
    }

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: request
    });

  } catch (err) {
    console.error('Error in reviewing request:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = requestRouter;