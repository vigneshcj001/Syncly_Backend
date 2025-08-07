const mongoose = require("mongoose");
const validator = require("validator");

const projectSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 2000 },
    techStack: { type: [String], default: [] },
    githubLink: {
      type: String,
      validate: (v) => !v || validator.isURL(v),
    },
    liveLink: {
      type: String,
      validate: (v) => !v || validator.isURL(v),
    },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
