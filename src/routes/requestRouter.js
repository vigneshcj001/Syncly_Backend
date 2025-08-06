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
          message: `Invalid connection status. Allowed: ${allowedStatus.join(
            ", "
          )}.`,
        });
      }

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request ID.",
        });
      }

      const reviewRequest = await Swipe.findById(requestId);
      if (!reviewRequest) {
        return res.status(404).json({
          success: false,
          message:
            "Request not found. It may have been withdrawn or you're not authorized to act on it.",
        });
      }

      if (!reviewRequest.recipientID.equals(loggedInUserId)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to review this request.",
        });
      }

      // Update the original swipe's status
      reviewRequest.connectionStatus = connectionStatus;
      await reviewRequest.save();

      // 🔁 Auto-create reciprocal Link swipe if mutual
      if (connectionStatus === "Link") {
        const initiatorId = reviewRequest.initiatorID;

        const existingReciprocal = await Swipe.findOne({
          initiatorID: loggedInUserId,
          recipientID: initiatorId,
        });

        if (!existingReciprocal) {
          const reverseSwipe = new Swipe({
            initiatorID: loggedInUserId,
            recipientID: initiatorId,
            connectionStatus: "Link",
          });

          await reverseSwipe.save();
        }
      }

      return res.status(200).json({
        success: true,
        message: "Request reviewed successfully.",
        data: reviewRequest,
      });
    } catch (err) {
      console.error("Error reviewing swipe:", err);
      return res.status(500).json({
        success: false,
        message: "Server error while reviewing the request.",
      });
    }
  }
);

module.exports = requestRouter;
