const express = require("express");
const { userAuth } = require("../Middleware/auth");
const Chat = require("../models/chat");
const Profile = require("../models/profile");

const chatRouter = express.Router();

/**
 * Get chat history with a target user + the target user's profile.
 * This is the single endpoint needed to initialize the chatroom.
 */
chatRouter.get("/chat/:targetUserID", userAuth, async (req, res) => {
  const { targetUserID } = req.params;
  const userID = String(req.user._id);

  try {
    // Find the chat history between the two users
    const chat = await Chat.findOne({
      participants: { $all: [userID, String(targetUserID)] },
    }).lean();

    // Find the profile of the user being chatted with
    const targetProfile = await Profile.findOne({ user: targetUserID }).lean();

    // If no profile exists for that user ID, it's a critical error
    if (!targetProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Target user profile not found." });
    }

    // Return both pieces of data in a single, efficient response
    res.status(200).json({
      success: true,
      messages: chat ? chat.messages : [],
      targetProfile,
    });
  } catch (error) {
    console.error("Error fetching chat data:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching chat data." });
  }
});

module.exports = chatRouter;
