const mongoose = require("mongoose");

const { Schema } = mongoose;

const EducationSchema = new Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    institution: {
      type: String,
      required: [true, "Please provide the institution name"],
      trim: true,
    },
    degree: {
      type: String,
      required: [true, "Please provide the degree"],
      trim: true,
    },
    fieldOfStudy: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Education || mongoose.model("Education", EducationSchema);
