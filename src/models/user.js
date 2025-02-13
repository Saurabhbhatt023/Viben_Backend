const mongoose = require('mongoose');
const validator = require('validator');

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
      required: true, 
      lowercase: true,
      validate: {
        validator: function (value) {
          return validator.isEmail(value); // Fixed email validation using validator.js
        },
        message: (props) => `Invalid Email Address: ${props.value}`,
      }
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return validator.isStrongPassword(value, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          });
        },
        message: "Password is not strong enough. It must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.",
      }
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
    },
    photoUrl: {
      type: String,
      default: "https://example.com/default-user.png",
      validate: {
        validator: function (value) {
          return validator.isURL(value); // Fixed URL validation using validator.js
        },
        message: (props) => `Invalid URL: ${props.value}`,
      },
    },
    about: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
