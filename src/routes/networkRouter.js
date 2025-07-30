const express = require("express");
const { userAuth } = require("../middleware/auth");
const Swipe = require("../models/swipe");
const Profile = require("../models/profile");

const networkRouter = express.Router();

const SAFE_PROFILE_FIELDS =
  "user userName emailID avatar bio skills interests location stack mentorshipRole";

// GET: Pending requests
networkRouter.get("/network/requests/pendings", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const pendingSwipes = await Swipe.find({
      recipientID: userId,
      connectionStatus: "interested",
    })
      .skip(skip)
      .limit(limit)
      .populate({ path: "initiatorID", select: "userName emailID" })
      .lean();

    if (!pendingSwipes.length) {
      return res.status(200).json({
        success: true,
        message: "No pending requests found.",
        data: [],
      });
    }

    const initiatorIDs = pendingSwipes.map((s) => s.initiatorID._id);
    const initiatorProfiles = await Profile.find({
      user: { $in: initiatorIDs },
    })
      .select(SAFE_PROFILE_FIELDS)
      .lean();

    const responseData = initiatorProfiles.map((profile) => {
      const swipe = pendingSwipes.find(
        (s) => s.initiatorID._id.toString() === profile.user.toString()
      );
      return { ...profile, swipeRequestId: swipe?._id };
    });

    return res.status(200).json({
      success: true,
      message: "Pending request profiles fetched successfully.",
      data: responseData,
      pagination: { page, limit, count: responseData.length },
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching pending requests.",
    });
  }
});

// GET: Mutual connections
networkRouter.get("/network/mutualConnections", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const mutualSwipes = await Swipe.find({
      $or: [{ initiatorID: userId }, { recipientID: userId }],
      connectionStatus: "connected",
      mutualMatch: true,
    })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!mutualSwipes.length) {
      return res.status(200).json({
        success: true,
        message: "No mutual connections found.",
        data: [],
      });
    }

    const mutualIDs = mutualSwipes.map((s) =>
      s.initiatorID.equals(userId) ? s.recipientID : s.initiatorID
    );

    const mutualProfiles = await Profile.find({ user: { $in: mutualIDs } })
      .select(SAFE_PROFILE_FIELDS)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Mutual connections fetched successfully.",
      data: mutualProfiles,
      pagination: { page, limit, count: mutualProfiles.length },
    });
  } catch (error) {
    console.error("Error fetching mutual connections:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching mutual connections.",
    });
  }
});

module.exports = networkRouter;
