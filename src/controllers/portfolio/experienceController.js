const Profile = require("../../models/profile");
const Experience = require("../../models/Experience");

// @desc    Create a new experience
// @route   POST /api/experiences
// @access  Private
const createExperience = async (req, res) => {
  try {
    const { company, role, startDate, endDate, description, employmentType } =
      req.body;

    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const newExperience = new Experience({
      profile: profile._id,
      company,
      role,
      startDate,
      endDate,
      description,
      employmentType,
    });

    await newExperience.save();

    res.status(201).json({
      success: true,
      message: "Experience created successfully",
      data: newExperience,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Get all experiences for a profile by slug
// @route   GET /api/experiences/:slug
// @access  Public
const getExperiences = async (req, res) => {
  try {
    const { slug } = req.params;

    const profile = await Profile.findOne({ slug });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const experiences = await Experience.find({ profile: profile._id }).sort({
      startDate: -1,
    });

    res.status(200).json({
      success: true,
      message: "Experiences fetched successfully",
      data: experiences,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Update an experience by ID
// @route   PUT /api/experiences/:id
// @access  Private
const updateExperience = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile || experience.profile.toString() !== profile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updated = await Experience.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Experience updated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Delete an experience by ID
// @route   DELETE /api/experiences/:id
// @access  Private
const deleteExperience = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile || experience.profile.toString() !== profile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await experience.deleteOne();

    res.status(200).json({
      success: true,
      message: "Experience deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

module.exports = {
  createExperience,
  getExperiences,
  updateExperience,
  deleteExperience,
};
