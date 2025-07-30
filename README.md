# Syncly
- In authRouter i want to add
const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/user");
const Profile = require("../models/profile");
const { validateSignUp } = require("../utils/validation");

const authRouter = express.Router();

// ---------- Rate Limiting ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 login attempts
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------- Email Transporter ----------
const transporter = nodemailer.createTransport({
  service: "gmail", // or "SendGrid", "Mailgun", etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------- SIGNUP ----------
authRouter.post("/signup", async (req, res) => {
  try {
    const { userName, emailID, password, captchaToken } = req.body;

    // Optional: CAPTCHA validation stub (replace with real verification call)
    if (!captchaToken || captchaToken !== "valid-captcha-token") {
      return res.status(400).json({ success: false, message: "CAPTCHA verification failed" });
    }

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

    const newUser = await User.create({ userName, emailID, password });

    await Profile.create({
      user: newUser._id,
      userName,
      emailID,
    });

    // Generate email verification token
    const emailToken = jwt.sign(
      { userID: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailID,
      subject: "Verify Your Email",
      html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
    });

    return res.status(201).json({
      success: true,
      message: "User created. Verification email sent.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ---------- LOGIN ----------
authRouter.post("/login", loginLimiter, async (req, res) => {
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

    // Optional: check if user is verified
    // if (!user.isVerified) {
    //   return res.status(403).json({ success: false, message: "Please verify your email first." });
    // }

    const isMatch = await user.compareUserEnteredPasswordAndHashPassword(password);
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
      maxAge: 24 * 60 * 60 * 1000,
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
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ---------- LOGOUT ----------
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ success: true, message: "Logged out" });
});

// ---------- VERIFY EMAIL ----------
authRouter.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userID);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
});

module.exports = authRouter;

-----------------


-
