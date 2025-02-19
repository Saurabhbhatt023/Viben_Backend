// models/ConnectionRequest.js
const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["ignored", "interested", "accepted", "rejected"],
      default: "interested"
    },
  },
  { timestamps: true }
);

// Create compound index for efficient querying
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

// Pre-save middleware to validate self-connection attempts
connectionRequestSchema.pre("save", async function(next) {
  if (this.fromUserId.equals(this.toUserId)) {
    throw new Error("Cannot send connection request to yourself!");
  }
  next();
});

// Method to generate status message
connectionRequestSchema.methods.generateStatusMessage = async function() {
  const fromUser = await mongoose.model('User').findById(this.fromUserId);
  const toUser = await mongoose.model('User').findById(this.toUserId);
  
  return `${fromUser.firstName} ${this.status} the connection with ${toUser.firstName}`;
};

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);

module.exports = ConnectionRequest;