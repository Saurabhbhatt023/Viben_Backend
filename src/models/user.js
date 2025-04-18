const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

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
      unique: true,
      validate: {
        validator: function (value) {
          return validator.isEmail(value);
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
      min: 18, // Ensuring users are at least 18 years old
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"], // Restricting to predefined values
    },
    photoUrl: {
      type: String,
      // Removed default value so it doesn't override user-set values
      validate: {
        validator: function (value) {
          return validator.isURL(value);
        },
        message: (props) => `Invalid URL: ${props.value}`,
      },
    },
    about: {
      type: String,
      maxlength: 500, // Limiting bio length
    },
    // Rest of the schema remains the same
    skills: {
      type: [String],
      default: []
    },
    location: {
      type: String,
    },
    relationshipStatus: {
      type: String,
      enum: ["Single", "In a Relationship", "Married", "Divorced", "Complicated"],
    },
    hobbies: {
      type: [String],
      default: [],
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: function (value) {
          return validator.isMobilePhone(value, "any", { strictMode: false });
        },
        message: (props) => `Invalid Phone Number: ${props.value}`,
      },
    },
    socialLinks: {
      type: [String],
      validate: {
        validator: function (links) {
          return links.every(link => validator.isURL(link));
        },
        message: "One or more social links are invalid.",
      },
      default: [],
    },
    likes: {
      type: Number,
      default: 0, // Tracking likes on user profile
    },
    matches: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [], // Storing user IDs of matches
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  const user = this;
  
  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the new salt
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// JWT token generation - updated to use consistent id field
userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  return token;
};

// Password validation method
userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;
  const isPasswordValid = await bcrypt.compare(passwordInputByUser, passwordHash);
  return isPasswordValid;
};

// Alias for validatePassword for compatibility
userSchema.methods.comparePassword = async function (passwordInputByUser) {
  return this.validatePassword(passwordInputByUser);
};

module.exports = mongoose.model("User", userSchema);