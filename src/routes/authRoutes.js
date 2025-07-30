const express = require("express");
const User = require("../models/user");
const Profile = require("../models/profile");
const { validateSignUp } = require("../utils/validation");

const authRouter = express.Router();

// ---------- SIGNUP ----------
authRouter.post("/signup", async (req, res) => {
  try {
    const { userName, emailID, password } = req.body;

    const { isValid, errors } = validateSignUp({ userName, emailID, password });
    if (!isValid) return res.status(400).json({ success: false, errors });

    const existingUser = await User.findOne({
      $or: [{ emailID }, { userName }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or username already exists",
      });
    }

    const newUser = new User({ userName, emailID, password });
    await newUser.save();

    await Profile.create({
      user: newUser._id,
      userName: newUser.userName,
      emailID: newUser.emailID,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: newUser._id,
        userName: newUser.userName,
        emailID: newUser.emailID,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// ---------- LOGIN ----------
authRouter.post("/login", async (req, res) => {
  try {
    const { emailID, password } = req.body;

    if (!emailID || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ emailID }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.compareUserEnteredPasswordAndHashPassword(
      password
    );
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = user.getJWTToken();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,// 1 day
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        userName: user.userName,
        emailID: user.emailID,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// ---------- LOGOUT ----------
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ success: true, message: "Logged out" });
});

module.exports = authRouter;
