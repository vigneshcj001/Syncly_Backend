const express = require("express");
const { userAuth } = require("../middleware/auth");
const Swipe = require("../models/swipe");
const Profile = require("../models/profile");

const networkRouter = express.Router();

const SAFE_PROFILE_FIELDS =
  "user userName emailID avatar bio skills interests location stack mentorshipRole";

// ------------------- GET PENDING SWIPES SENT BY USER -------------------
networkRouter.get("/network/requests/pendings", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const pendingSwipes = await Swipe.find({
      initiatorID: loggedInUserId,
      connectionStatus: "Vibe",
    })
      .populate({ path: "recipientID", select: "userName emailID" })
      .lean();

    if (!pendingSwipes.length) {
      return res.status(200).json({
        success: true,
        message: "No pending requests found.",
        data: [],
      });
    }

    const recipientIDs = pendingSwipes.map((s) => s.recipientID._id);
    const recipientProfiles = await Profile.find({
      user: { $in: recipientIDs },
    })
      .select(SAFE_PROFILE_FIELDS)
      .lean();

    const responseData = recipientProfiles.map((profile) => {
      const swipe = pendingSwipes.find(
        (s) => s.recipientID._id.toString() === profile.user.toString()
      );
      return { ...profile, swipeRequestId: swipe?._id };
    });

    return res.status(200).json({
      success: true,
      message: "Pending request profiles fetched successfully.",
      data: responseData,
      count: responseData.length,
    });
  } catch (err) {
    console.error("Pending swipe fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching pending requests.",
    });
  }
});

// ------------------- GET MUTUAL "LINK" SWIPES -------------------
networkRouter.get("/network/mutualVibes", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all swipes where the user is either initiator or recipient
    const mutualSwipes = await Swipe.find({
      $or: [
        { initiatorID: loggedInUserId, connectionStatus: "Link" },
        { recipientID: loggedInUserId, connectionStatus: "Link" },
      ],
      //mutualMatch: true,
    }).lean();

    if (!mutualSwipes.length) {
      return res.status(200).json({
        success: true,
        message: "No mutual connections found.",
        data: [],
      });
    }

    // Extract mutual user IDs
    const mutualIDs = mutualSwipes.map((s) =>
      s.initiatorID.toString() === loggedInUserId.toString()
        ? s.recipientID
        : s.initiatorID
    );

    // Fetch profiles of those users
    const mutualProfiles = await Profile.find({ user: { $in: mutualIDs } })
      .select(SAFE_PROFILE_FIELDS)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Mutual connections fetched successfully.",
      data: mutualProfiles,
      count: mutualProfiles.length,
    });
  } catch (err) {
    console.error("Mutual vibes error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching mutual connections.",
    });
  }
});

module.exports = networkRouter;

