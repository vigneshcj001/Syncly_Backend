const mongoose = require("mongoose");
const { Schema } = mongoose;

const SwipeSchema = new Schema(
  {
    initiatorID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    connectionStatus: {
      type: String,
      enum: ["interested", "dismissed", "connected", "declined"],
    },
    mutualMatch: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SwipeSchema.index({ initiatorID: 1, recipientID: 1 }, { unique: true });

SwipeSchema.pre("save", function (next) {
  if (this.initiatorID.equals(this.recipientID)) {
    return next(new Error("You cannot connect with your own profile."));
  }
  next();
});

module.exports = mongoose.models.Swipe || mongoose.model("Swipe", SwipeSchema);
