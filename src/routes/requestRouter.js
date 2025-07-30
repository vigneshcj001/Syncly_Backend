const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middleware/auth");
const Swipe = require("../models/swipe");
const User = require("../models/user");

const requestRouter = express.Router();

// ------------------ CREATE SWIPE REQUEST ------------------
requestRouter.post(
  "/request/swipe/:connectionStatus/:recipientId",
  userAuth,
  async (req, res) => {
    try {
      const { connectionStatus, recipientId } = req.params;
      const initiatorId = req.user._id;

      const allowedStatus = ["Vibe", "Ghost"];

      if (
        !mongoose.Types.ObjectId.isValid(recipientId) ||
        initiatorId.equals(recipientId)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid recipient ID." });
      }

      if (!allowedStatus.includes(connectionStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid connection status. Allowed values: Vibe, Ghost.",
        });
      }

      const recipient = await User.findById(recipientId).lean();
      if (!recipient) {
        return res
          .status(404)
          .json({ success: false, message: "Recipient user not found." });
      }

      const existingSwipeRequest = await Swipe.findOne({
        $or: [
          { initiatorID: initiatorId, recipientID: recipientId },
          { initiatorID: recipientId, recipientID: initiatorId },
        ],
      }).lean();

      if (existingSwipeRequest) {
        return res.status(409).json({
          success: false,
          message: "A connection request already exists.",
        });
      }

      const newSwipeRequest = new Swipe({
        initiatorID: initiatorId,
        recipientID: recipientId,
        connectionStatus,
      });

      const data = await newSwipeRequest.save();
      return res.status(201).json({
        success: true,
        message: `Your '${connectionStatus}' status for ${recipient.userName} has been recorded.`,
        match: false,
        data,
      });
    } catch (err) {
      console.error("Swipe Request Error:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

// ------------------ REVIEW SWIPE REQUEST ------------------
requestRouter.put(
  "/request/review/:connectionStatus/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const { connectionStatus, requestId } = req.params;
      const loggedInUserId = req.user._id;

      const allowedStatus = ["Link", "Noped"];

      if (!allowedStatus.includes(connectionStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid connection status. Allowed values: Link, Noped.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid request ID." });
      }

      const reviewRequest = await Swipe.findOne({
        _id: requestId,
        recipientID: loggedInUserId,
        connectionStatus: "Vibe",
      });

      if (!reviewRequest) {
        return res.status(404).json({
          success: false,
          message: "Request not found or you're not authorized to act on it.",
        });
      }

      reviewRequest.connectionStatus = connectionStatus;
      const data = await reviewRequest.save();

      return res.status(200).json({
        success: true,
        message: `Connection request has been marked as '${connectionStatus}'.`,
        data,
      });
    } catch (err) {
      console.error("Review Request Error:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

module.exports = requestRouter;
