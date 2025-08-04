const validator = require("validator");

//  Used for signup validation
const validateSignUp = ({ userName, emailID, password }) => {
  const errors = {};

  if (!userName || !validator.isLength(userName.trim(), { min: 3, max: 50 })) {
    errors.userName = "Username must be between 3 and 50 characters.";
  } else if (!/^[a-zA-Z0-9_]+$/.test(userName)) {
    errors.userName =
      "Username can only contain letters, numbers, and underscores.";
  }

  if (!emailID || !validator.isEmail(emailID)) {
    errors.emailID = "A valid email is required.";
  }

  if (
    !password ||
    !validator.isStrongPassword(password, {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    errors.password =
      "Password must be at least 6 characters long and contain one uppercase, one lowercase, one number, and one symbol.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Fields that can be updated via profile edit
const allowedEditableFields = [
  "userName",
  "avatar",
  "bio",
  "domain",
  "stack",
  "skills",
  "interests",
  "location",
  "mentorshipRole",
  "socialLinks",
];

// Profile update validator
const validateProfileUpdate = (body) => {
  const updates = {};
  const invalidFields = [];

  for (const key in body) {
    if (allowedEditableFields.includes(key)) {
      if (key === "socialLinks" && typeof body[key] === "object") {
        const validLinks = ["portfolio", "github", "X", "linkedin", "youtube"];
        updates[key] = {};
        for (const subKey in body[key]) {
          if (validLinks.includes(subKey)) {
            updates[key][subKey] = body[key][subKey];
          } else {
            invalidFields.push(`socialLinks.${subKey}`);
          }
        }
      } else {
        updates[key] = body[key];
      }
    } else {
      invalidFields.push(key);
    }
  }

  return {
    isValid: invalidFields.length === 0 && Object.keys(updates).length > 0,
    updates,
    invalidFields,
  };
};

module.exports = {
  validateSignUp,
  validateProfileUpdate,
};
