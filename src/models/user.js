const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    emailID: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Keep password hidden by default on queries
    },
  },
  {
    timestamps: true,
  }
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// JWT token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Method to compare entered password with the hashed password
userSchema.methods.compareUserEnteredPasswordAndHashPassword = async function (
  UserEnteredPassword
) {
  const passwordHash = this.password;
  return await bcrypt.compare(UserEnteredPassword, passwordHash);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
