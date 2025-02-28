const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password, photoUrl, phoneNumber, socialLinks } = req.body;

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

  // Validate photoUrl if provided
  if (photoUrl && !validator.isURL(photoUrl)) {
    throw new Error("Invalid photo URL format.");
  }

  // Validate phoneNumber if provided
  if (phoneNumber && !validator.isMobilePhone(phoneNumber, "any", { strictMode: false })) {
    throw new Error("Invalid phone number format.");
  }

  // Validate socialLinks if provided
  if (socialLinks && Array.isArray(socialLinks)) {
    for (const link of socialLinks) {
      if (!validator.isURL(link)) {
        throw new Error("One or more social links are invalid.");
      }
    }
  }
};

const validatePasswordData = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });
};

const validateEditProfileData = (req) => {
  const allowedEditFields = [
    "firstName", "lastName", "gender", "age", 
    "photoUrl", "about", "skills", "location",
    "relationshipStatus", "hobbies", "phoneNumber", "socialLinks"
  ];
  
  const isEditAllowed = Object.keys(req.body).every(field => allowedEditFields.includes(field));
  return isEditAllowed;
};

module.exports = {
  validateSignUpData,
  validateEditProfileData,
  validatePasswordData
};