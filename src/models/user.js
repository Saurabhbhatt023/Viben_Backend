const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    emailId: {
      type: String,
      lowercase: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
    },
    photoUrl: {
      type: String,
      default:
        "https://example.com/default-user.png", // Replace with an actual default image URL
    },
    about: {
      type: String,
    },
  },
  { timestamps: true } // Enables createdAt and updatedAt timestamps
);

module.exports = mongoose.model("User", userSchema);
