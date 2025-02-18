const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required.");
  }

  if (!validator.isEmail(emailId)) {
    throw new Error("Invalid Email Address.");
  }

  if (!validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })) {
    throw new Error("Password must be at least 8 characters long, with uppercase, lowercase, numbers, and special symbols.");
  }
};

const validateEditProfileData = (req) => {
  const allowedEditFields = ["firstName", "lastName", "Gender", "emailId"];
  const isEditAllowed = Object.keys(req.body).every(field => allowedEditFields.includes(field));
  
  // Fixed: Return the validation result
  return isEditAllowed;
};

module.exports = {
  validateSignUpData,
  validateEditProfileData,
};