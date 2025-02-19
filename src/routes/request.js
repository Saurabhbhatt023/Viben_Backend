// routes/request.js
const express = require("express");
const requestRouter = express.Router();
const { auth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/ConnectionRequest");
const User = require("../models/user");

// Send connection request
requestRouter.post("/request/send/:status/:toUserId", auth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status.toLowerCase();

    // Validate status
    const allowedStatuses = ["ignored", "interested"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status type: ${status}. Allowed values are: ${allowedStatuses.join(", ")}`
      });
    }

    // Check if target user exists
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    // Check for existing request using compound index
    const existingRequest = await ConnectionRequest.findOne({
      fromUserId,
      toUserId
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: `Connection request already exists with status: ${existingRequest.status}`
      });
    }

    // Create new connection request
    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });

    const savedRequest = await connectionRequest.save();
    const statusMessage = await savedRequest.generateStatusMessage();

    res.status(201).json({
      success: true,
      message: statusMessage,
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

// Get received requests with pagination and filtering
requestRouter.get("/requests/received", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    // Build query
    const query = { toUserId: req.user._id };
    if (status) {
      query.status = status;
    }

    const requests = await ConnectionRequest.find(query)
      .populate("fromUserId", "firstName lastName photoUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ConnectionRequest.countDocuments(query);

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRequests: total
      }
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
    const requestId = req.params.requestId;

    // Validate status
    const allowedStatuses = ["accepted", "rejected", "ignored"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(", ")}`
      });
    }

    // Find and update request
    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    // Verify request belongs to current user
    if (!request.toUserId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this request"
      });
    }

    request.status = status;
    await request.save();

    // Generate status message
    const statusMessage = await request.generateStatusMessage();

    res.json({
      success: true,
      message: statusMessage,
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