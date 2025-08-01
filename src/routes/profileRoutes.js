const express = require("express");
const Profile = require("../models/profile");
const { validateProfileUpdate } = require("../utils/validation");
const { userAuth } = require("../middleware/auth");

const profileRouter = express.Router();

// GET Profile of logged-in user
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ✅ UPDATE Profile of logged-in user
profileRouter.put("/profile/edit", userAuth, async (req, res) => {
  try {
    const { isValid, updates, invalidFields } = validateProfileUpdate(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: invalidFields.length
          ? `Invalid fields: ${invalidFields.join(", ")}`
          : "No valid fields provided for update",
      });
    }

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

module.exports = profileRouter;
