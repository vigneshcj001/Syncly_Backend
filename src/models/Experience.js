const mongoose = require("mongoose");

const { Schema } = mongoose;

const ExperienceSchema = new Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    company: {
      type: String,
      required: [true, "Please provide the company name"],
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Please provide your role"],
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
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Experience || mongoose.model("Experience", ExperienceSchema);
