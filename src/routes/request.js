// routes/request.js
const express = require("express");
const requestRouter = express.Router();
const { auth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/ConnectionRequest"); // Add this import

// Send connection request
requestRouter.post("/request/send/:status/:toUserId", auth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status;

    // Check if request already exists
    const existingRequest = await ConnectionRequest.findOne({
      fromUserId,
      toUserId
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Connection request already exists"
      });
    }

    // Create new connection request
    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });

    const savedRequest = await connectionRequest.save();
    
    res.status(201).json({
      success: true,
      message: "Connection request sent successfully",
      data: savedRequest
    });

  } catch (err) {
    console.error("Send request error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get received requests
requestRouter.get("/requests/received", auth, async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({ toUserId: req.user._id })
      .populate("fromUserId", "firstName lastName photoUrl")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Update request status
requestRouter.patch("/request/:requestId", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await ConnectionRequest.findByIdAndUpdate(
      req.params.requestId,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    res.json({
      success: true,
      message: "Request status updated",
      data: request
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = requestRouter;