const express = require("express");
const { userAuth } = require("../middleware/auth");
const Swipe = require("../models/swipe");
const Profile = require("../models/profile");

const networkRouter = express.Router();

const PROFILE_POPULATE = {
  path: "user",
  select: "-userName -emailID -password -createdAt -updatedAt -__v",
};
const PROFILE_SELECT = "-slug -createdAt -updatedAt -__v";

// ------------------- GET FEED (UNSEEN PROFILES) -------------------
networkRouter.get("/network/feed", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    

    const swipes = await Swipe.find({
      $or: [{ initiatorID: userId }, { recipientID: userId }],
    }).select("initiatorID recipientID");

    const hideUserIds = new Set([userId.toString()]);
    swipes.forEach((s) => {
      hideUserIds.add(s.initiatorID.toString());
      hideUserIds.add(s.recipientID.toString());
    });

    const profiles = await Profile.find({
      user: { $nin: Array.from(hideUserIds) },
    })
      .populate(PROFILE_POPULATE)
      .select(PROFILE_SELECT)
      .lean();

    return res.status(200).json({
      success: true,
      message: profiles.length
        ? "Feed fetched successfully."
        : "No new profiles to show right now.",
      totalResults: profiles.length,
      feed: profiles,
    });
  } catch (err) {
    console.error("Error in /network/feed:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching the feed.",
    });
  }
});

// ------------------- GET PENDING SWIPES SENT BY USER -------------------
networkRouter.get("/network/requests/pendings", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;


    const pendingSwipes = await Swipe.find({
      initiatorID: userId,
      connectionStatus: "Vibe",
    })
      .populate({ path: "recipientID", select: "_id" })
      .lean();

    if (!pendingSwipes.length) {
      return res.status(200).json({
        success: true,
        message: "No pending requests found.",
        data: [],
      });
    }

    const recipientIds = pendingSwipes.map((s) => s.recipientID._id);
    const profiles = await Profile.find({ user: { $in: recipientIds } })
      .populate(PROFILE_POPULATE)
      .select(PROFILE_SELECT)
      .lean();

    const enriched = profiles.map((profile) => {
      const swipe = pendingSwipes.find((s) =>
        s.recipientID._id.equals(profile.user)
      );
      return { ...profile, swipeRequestId: swipe?._id };
    });

    return res.status(200).json({
      success: true,
      message: "Pending request profiles fetched successfully.",
      data: enriched,
      count: enriched.length,
    });
  } catch (err) {
    console.error("Error in /network/requests/pendings:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching pending requests.",
    });
  }
});

// ------------------- GET MUTUAL "LINK" SWIPES -------------------
networkRouter.get("/network/mutualVibes", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const mutualSwipes = await Swipe.find({
      $or: [
        { initiatorID: userId, connectionStatus: "Link" },
        { recipientID: userId, connectionStatus: "Link" },
      ],
      mutualMatch: true,
    }).lean();

    if (!mutualSwipes.length) {
      return res.status(200).json({
        success: true,
        message: "No mutual connections found.",
        data: [],
      });
    }

    const mutualUserIds = mutualSwipes.map((s) =>
      s.initiatorID.toString() === userId.toString()
        ? s.recipientID
        : s.initiatorID
    );

    const profiles = await Profile.find({ user: { $in: mutualUserIds } })
      .populate(PROFILE_POPULATE)
      .select(PROFILE_SELECT)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Mutual connections fetched successfully.",
      data: profiles,
      count: profiles.length,
    });
  } catch (err) {
    console.error("Error in /network/mutualVibes:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching mutual connections.",
    });
  }
});

module.exports = networkRouter;
