const mongoose = require("mongoose");
const validator = require("validator");

const { Schema } = mongoose;

const ProjectSchema = new Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a project title"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a project description"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    technologies: {
      type: [String],
      required: true,
    },
    liveDemoLink: {
      type: String,
      trim: true,
      validate: [validator.isURL, "Please provide a valid URL"],
    },
    sourceCodeLink: {
      type: String,
      trim: true,
      validate: [validator.isURL, "Please provide a valid URL"],
    },
    images: [
      {
        type: String,
        validate: [validator.isURL, "Please provide a valid image URL"],
      },
    ],
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Project || mongoose.model("Project", ProjectSchema);
