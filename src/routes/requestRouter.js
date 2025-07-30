const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middleware/auth");
const Swipe = require("../models/swipe");
const User = require("../models/user");

const requestRouter = express.Router();

const SWIPE_STATUSES = {
  SWIPE: ["interested", "dismissed"],
  REVIEW: ["connected", "declined"],
};

// POST: Swipe action - "interested" or "dismissed"
requestRouter.post(
  "/request/swipe/:connectionStatus/:recipientId",
  userAuth,
  async (req, res) => {
    try {
      const { connectionStatus, recipientId } = req.params;
      const initiatorId = req.user._id;

      if (
        !mongoose.Types.ObjectId.isValid(recipientId) ||
        initiatorId.equals(recipientId)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid recipient ID." });
      }

      if (!SWIPE_STATUSES.SWIPE.includes(connectionStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid connection status. Allowed: ${SWIPE_STATUSES.SWIPE.join(
            ", "
          )}.`,
        });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res
          .status(404)
          .json({ success: false, message: "Recipient user not found." });
      }

      const existingSwipe = await Swipe.findOne({
        $or: [
          { initiatorID: initiatorId, recipientID: recipientId },
          { initiatorID: recipientId, recipientID: initiatorId },
        ],
      });

      if (existingSwipe) {
        return res.status(409).json({
          success: false,
          message: "A connection request already exists.",
        });
      }

      const newSwipe = await Swipe.create({
        initiatorID: initiatorId,
        recipientID: recipientId,
        connectionStatus,
      });

      return res.status(201).json({
        success: true,
        message: `Your '${connectionStatus}' status for ${recipient.userName} has been recorded.`,
        match: false,
        data: newSwipe,
      });
    } catch (error) {
      console.error("Swipe Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

// PUT: Review a pending request
requestRouter.put(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const { status, requestId } = req.params;
      const userId = req.user._id;

      if (!SWIPE_STATUSES.REVIEW.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${SWIPE_STATUSES.REVIEW.join(
            ", "
          )}.`,
        });
      }

      const request = await Swipe.findOne({
        _id: requestId,
        recipientID: userId,
        connectionStatus: "interested",
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found or not authorized to act on it.",
        });
      }

      request.connectionStatus = status;
      request.mutualMatch = status === "connected";
      await request.save();

      return res.status(200).json({
        success: true,
        message: `Request has been ${status} successfully.`,
        data: request,
      });
    } catch (error) {
      console.error("Review Request Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

module.exports = requestRouter;
