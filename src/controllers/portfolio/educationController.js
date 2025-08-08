const Profile = require("../../models/profile");
const Education = require("../../models/Education");

// @desc    Create a new education
// @route   POST /api/educations
// @access  Private
const createEducation = async (req, res) => {
  try {
    const {
      institution,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      description,
    } = req.body;

    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const newEducation = new Education({
      profile: profile._id,
      institution,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      description,
    });

    await newEducation.save();

    res.status(201).json({
      success: true,
      message: "Education created successfully",
      data: newEducation,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Get all educations for a profile by slug
// @route   GET /api/educations/:slug
// @access  Public
const getEducations = async (req, res) => {
  try {
    const { slug } = req.params;

    const profile = await Profile.findOne({ slug });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const educations = await Education.find({ profile: profile._id }).sort({
      startDate: -1,
    });

    res.status(200).json({
      success: true,
      message: "Educations fetched successfully",
      data: educations,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Update an education by ID
// @route   PUT /api/educations/:id
// @access  Private
const updateEducation = async (req, res) => {
  try {
    const education = await Education.findById(req.params.id);

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education not found",
      });
    }

    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile || education.profile.toString() !== profile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updated = await Education.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Education updated successfully",
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

// @desc    Delete an education by ID
// @route   DELETE /api/educations/:id
// @access  Private
const deleteEducation = async (req, res) => {
  try {
    const education = await Education.findById(req.params.id);

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education not found",
      });
    }

    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile || education.profile.toString() !== profile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await education.deleteOne();

    res.status(200).json({
      success: true,
      message: "Education deleted successfully",
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
  createEducation,
  getEducations,
  updateEducation,
  deleteEducation,
};
