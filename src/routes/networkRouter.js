const express = require("express");
const networkRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const Swipe = require("../models/swipe");
const Profile = require("../models/profile");

const PROFILE_POPULATE = {
  path: "user",
  select: "-userName -emailID -password -createdAt -updatedAt -__v",
};
const PROFILE_SELECT = "-slug -createdAt -updatedAt -__v";

// ------------------- GET PENDING SWIPES -------------------
// GET pending vibe requests for current user
networkRouter.get("/network/requests/pendings", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const pendings = await Swipe.find({
      recipientID: userId,
      connectionStatus: "Vibe",
    }).lean();

    const initiatorIds = pendings.map((p) => p.initiatorID);

    const profiles = await Profile.find({ user: { $in: initiatorIds } }).lean();

    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.user.toString()] = p;
    });

    const enrichedPendings = pendings.map((swipe) => ({
      ...swipe,
      initiatorID: profileMap[swipe.initiatorID.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      message: "Pending Vibe requests received",
      data: enrichedPendings,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


networkRouter.get("/network/mutualVibes", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all Link swipes involving the logged-in user
    const sentVibes = await Swipe.find({
      $or: [
        { recipientID: loggedInUserId, connectionStatus: "Link" },
        { initiatorID: loggedInUserId, connectionStatus: "Link" },
      ],
    });

    // Get the other user ID (not the logged-in user)
    const mutualUserIds = sentVibes.map((row) =>
      row.initiatorID.toString() === loggedInUserId.toString()
        ? row.recipientID
        : row.initiatorID
    );

    // Remove duplicates
    const uniqueUserIds = [...new Set(mutualUserIds.map(String))];

    // Fetch profile data of those users
    const mutualProfiles = await Profile.find({
      user: { $in: uniqueUserIds },
    }).populate("user", "-password");

    res.status(200).json({
      success: true,
      message: "Mutual vibe connections found",
      data: mutualProfiles,
    });
  } catch (error) {
    console.error("Error in mutualVibes route:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});






// ------------------- GET FEED -------------------
networkRouter.get("/network/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page || 1);
    let limit = parseInt(req.query.limit || 10);
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const swipes = await Swipe.find({
      $or: [
        { initiatorID: loggedInUser._id },
        { recipientID: loggedInUser._id },
      ],
    }).select("initiatorID recipientID");

    const hideUsersFromFeed = new Set();
    swipes.forEach((req) => {
      hideUsersFromFeed.add(req.initiatorID.toString());
      hideUsersFromFeed.add(req.recipientID.toString());
    });

    const profiles = await Profile.find({
      $and: [
        { user: { $nin: Array.from(hideUsersFromFeed) } },
        { user: { $ne: loggedInUser._id } },
      ],
    })
      .populate(PROFILE_POPULATE)
      .select(PROFILE_SELECT)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: profiles.length
        ? "Feed fetched successfully."
        : "No new profiles to show right now.",
      feed: profiles,
      totalResults: profiles.length,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

module.exports = networkRouter;
