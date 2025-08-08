const mongoose = require("mongoose");
const { Schema } = mongoose;

const CertificationSchema = new Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please provide the certification name"],
      trim: true,
    },
    issuingOrganization: {
      type: String,
      required: [true, "Please provide the issuing organization"],
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expirationDate: {
      type: Date,
    },
    credentialID: {
      type: String,
      trim: true,
    },
    credentialURL: {
      type: String,
      trim: true,
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
  mongoose.models.Certification ||
  mongoose.model("Certification", CertificationSchema);
