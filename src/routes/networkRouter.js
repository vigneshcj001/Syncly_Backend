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



// ------------------- GET MUTUAL CONNECTIONS -------------------
// GET mutual vibe connections where final status is "Link"
networkRouter.get("/network/mutualVibes", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Step 1: Find all mutual "Vibe" connections
    const sentVibes = await Swipe.find({
      initiatorID: userId,
      connectionStatus: "Vibe",
    }).lean();

    const recipientIds = sentVibes.map((s) => s.recipientID);

    const receivedVibes = await Swipe.find({
      initiatorID: { $in: recipientIds },
      recipientID: userId,
      connectionStatus: "Vibe",
    }).lean();

    const mutualUserPairs = [];

    for (const received of receivedVibes) {
      const match = sentVibes.find(
        (s) =>
          s.recipientID.toString() === received.initiatorID.toString()
      );

      if (match) {
        mutualUserPairs.push({
          userA: userId,
          userB: received.initiatorID,
        });
      }
    }

    // Step 2: Now find all swipes between mutual pairs where status is "Link"
    const orConditions = mutualUserPairs.flatMap(({ userA, userB }) => [
      { initiatorID: userA, recipientID: userB },
      { initiatorID: userB, recipientID: userA },
    ]);

    const linkedSwipes = await Swipe.find({
      connectionStatus: "Link",
      $or: orConditions,
    }).lean();

    const uniqueLinkedPairs = [];

    const seen = new Set();

    for (const swipe of linkedSwipes) {
      const key = [swipe.initiatorID.toString(), swipe.recipientID.toString()]
        .sort()
        .join("_");

      if (!seen.has(key)) {
        seen.add(key);
        uniqueLinkedPairs.push(swipe);
      }
    }

    const allUserIds = new Set();
    uniqueLinkedPairs.forEach((s) => {
      allUserIds.add(s.initiatorID.toString());
      allUserIds.add(s.recipientID.toString());
    });

    const profiles = await Profile.find({
      user: { $in: Array.from(allUserIds) },
    }).lean();

    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.user.toString()] = p;
    });

    const enriched = uniqueLinkedPairs.map((pair) => ({
      ...pair,
      initiatorID: profileMap[pair.initiatorID.toString()] || null,
      recipientID: profileMap[pair.recipientID.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      message: "Mutual Links fetched",
      data: enriched,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
