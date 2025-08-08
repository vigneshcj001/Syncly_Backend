const Profile = require("../../models/profile");
const Portfolio = require("../../models/Portfolio");

// @desc    Generate a new portfolio
// @route   POST /api/portfolio
// @access  Private
const generatePortfolio = async (req, res) => {
  try {
    const { theme, isPublic, customDomain, seo } = req.body;

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    const newPortfolio = new Portfolio({
      profile: profile._id,
      theme,
      isPublic,
      customDomain,
      seo,
      lastGenerated: new Date(),
    });

    await newPortfolio.save();

    res.status(201).json({
      success: true,
      message: "Portfolio generated successfully",
      data: newPortfolio,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  }
};

// @desc    Get portfolio by username (slug)
// @route   GET /api/portfolio/:slug
// @access  Public
const getPortfolioByUsername = async (req, res) => {
  try {
    const { slug } = req.params;

    const profile = await Profile.findOne({ slug });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    const portfolio = await Portfolio.findOne({ profile: profile._id });
    if (!portfolio) {
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });
    }

    res.status(200).json({
      success: true,
      message: "Portfolio fetched successfully",
      data: portfolio,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  }
};

// @desc    Update portfolio settings
// @route   PUT /api/portfolio/:id
// @access  Private
const updatePortfolioSettings = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });
    }

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile || portfolio.profile.toString() !== profile._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updated = await Portfolio.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Portfolio updated successfully",
      data: updated,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  }
};

// @desc    Delete portfolio
// @route   DELETE /api/portfolio/:id
// @access  Private
const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });
    }

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile || portfolio.profile.toString() !== profile._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await portfolio.deleteOne();

    res.status(200).json({
      success: true,
      message: "Portfolio deleted successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  }
};

module.exports = {
  generatePortfolio,
  getPortfolioByUsername,
  updatePortfolioSettings,
  deletePortfolio,
};
