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
networkRouter.get("/network/requests/pendings", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Find swipes where someone else sent a Vibe to this user
    const pendingSwipes = await Swipe.find({
      recipientID: loggedInUser._id,
      connectionStatus: "Vibe",
    }).populate("initiatorID", "_id"); // populate the one who sent the Vibe

    if (!pendingSwipes.length) {
      return res.status(200).json({
        success: true,
        message: "No pending requests found.",
        data: [],
      });
    }

    // Extract user IDs who sent the Vibe
    const initiatorIds = pendingSwipes.map((s) => s.initiatorID._id);

    const profiles = await Profile.find({ user: { $in: initiatorIds } })
      .populate(PROFILE_POPULATE)
      .select(PROFILE_SELECT);

    res.status(200).json({
      success: true,
      message: "Pending request profiles fetched successfully.",
      data: profiles,
      count: profiles.length,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});


// ------------------- GET MUTUAL CONNECTIONS -------------------
networkRouter.get("/network/mutualVibes", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const loggedInUserId = req.user._id.toString();

    // Fetch all swipes with "Link" where the user is either initiator or recipient
    const allLinkSwipes = await Swipe.find({
      $or: [
        { initiatorID: loggedInUserId, connectionStatus: "Link" },
        { recipientID: loggedInUserId, connectionStatus: "Link" },
      ],
    }).populate("initiatorID recipientID", "_id");

    const linksFromUser = new Set(); // Users the logged-in user sent a "Link" to
    const linksToUser = new Set();   // Users who sent a "Link" to the logged-in user

    allLinkSwipes.forEach((swipe) => {
      const initiatorId = swipe.initiatorID._id.toString();
      const recipientId = swipe.recipientID._id.toString();

      if (initiatorId === loggedInUserId) {
        linksFromUser.add(recipientId);
      }
      if (recipientId === loggedInUserId) {
        linksToUser.add(initiatorId);
      }
    });

    // Find mutual connections (both users sent "Link" to each other)
    const mutualUserIds = [...linksFromUser].filter((id) =>
      linksToUser.has(id)
    );

    if (!mutualUserIds.length) {
      return res.status(200).json({
        success: true,
        message: "No mutual connections found.",
        data: [],
        count: 0,
      });
    }

    const profiles = await Profile.find({
      user: { $in: mutualUserIds },
    })
      .populate({
        path: "user",
        select: "-userName -emailID -password -createdAt -updatedAt -__v",
      })
      .select("-slug -createdAt -updatedAt -__v");

    return res.status(200).json({
      success: true,
      message: "Mutual connections fetched successfully.",
      data: profiles,
      count: profiles.length,
    });
  } catch (error) {
    console.error("Error in /network/mutualVibes:", error);
    return res.status(400).send("ERROR: " + error.message);
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
