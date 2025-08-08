const mongoose = require("mongoose");
const { Schema } = mongoose;

const PortfolioSchema = new Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    theme: {
      primaryColor: { type: String, default: "#000000" },
      secondaryColor: { type: String, default: "#FFFFFF" },
      fontFamily: { type: String, default: "Arial" },
      layout: { type: String, default: "default" },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    customDomain: {
      type: String,
      trim: true,
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
    },
    lastGenerated: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Portfolio || mongoose.model("Portfolio", PortfolioSchema);
