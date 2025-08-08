const Profile = require("../../models/profile");
const Certification = require("../../models/Certification");

// @desc    Create a new certification
// @route   POST /api/certifications
// @access  Private
const createCertification = async (req, res) => {
  try {
    const {
      name,
      issuingOrganization,
      issueDate,
      expirationDate,
      credentialID,
      credentialURL,
      description,
    } = req.body;

    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const newCertification = new Certification({
      profile: profile._id,
      name,
      issuingOrganization,
      issueDate,
      expirationDate,
      credentialID,
      credentialURL,
      description,
    });

    await newCertification.save();

    res.status(201).json({
      success: true,
      message: "Certification created successfully",
      data: newCertification,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Get all certifications for a profile by slug
// @route   GET /api/certifications/:slug
// @access  Public
const getCertifications = async (req, res) => {
  try {
    const { slug } = req.params;

    const profile = await Profile.findOne({ slug });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const certifications = await Certification.find({
      profile: profile._id,
    }).sort({
      issueDate: -1,
    });

    res.status(200).json({
      success: true,
      message: "Certifications fetched successfully",
      data: certifications,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Update a certification by ID
// @route   PUT /api/certifications/:id
// @access  Private
const updateCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    const profile = await Profile.findOne({ user: req.user._id });

    if (
      !profile ||
      certification.profile.toString() !== profile._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updated = await Certification.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Certification updated successfully",
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

// @desc    Delete a certification by ID
// @route   DELETE /api/certifications/:id
// @access  Private
const deleteCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    const profile = await Profile.findOne({ user: req.user._id });

    if (
      !profile ||
      certification.profile.toString() !== profile._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await certification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Certification deleted successfully",
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
  createCertification,
  getCertifications,
  updateCertification,
  deleteCertification,
};
