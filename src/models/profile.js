const mongoose = require("mongoose");
const validator = require("validator");
const slugify = require("slugify");

const { Schema } = mongoose;

const ProfileSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: [true, "Please provide your username"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailID: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    avatar: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png",
      validate: {
        validator: function (v) {
          return (
            typeof v === "string" &&
            (v.startsWith("data:image/") ||
              /\.(jpeg|jpg|png|gif|webp|svg|bmp)$/i.test(v) ||
              validator.isURL(v, {
                protocols: ["http", "https"],
                require_tld: true,
                require_protocol: true,
              }))
          );
        },
        message: (props) =>
          `${props.value} is not a valid image URL or format!`,
      },
    },
    bio: {
      type: String,
      default: "No bio provided",
      maxlength: [1000, "Bio cannot be more than 1000 characters"],
      trim: true,
    },
    domain: { type: String, trim: true },
    stack: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    location: { type: String, trim: true, default: "Unknown" },
    role: {
      type: String,
      enum: ["user", "mentor", "admin", "moderator"],
      default: "user",
    },
    mentorshipRole: {
      type: String,
      enum: ["mentor", "learner", "both"],
      default: "learner",
    },
    socialLinks: {
      portfolio: {
        type: String,
        default: "",
        validate: {
          validator: function (v) {
            if (!v) return true;
            return validator.isURL(v, {
              protocols: ["http", "https"],
              require_tld: true,
              require_protocol: true,
            });
          },
          message: "Invalid portfolio URL",
        },
      },
      github: {
        type: String,
        default: "",
        validate: {
          validator: function (v) {
            if (!v) return true;
            return validator.isURL(v, {
              protocols: ["http", "https"],
              require_tld: true,
              require_protocol: true,
            });
          },
          message: "Invalid github URL",
        },
      },
      X: {
        type: String,
        default: "",
        validate: {
          validator: function (v) {
            if (!v) return true;
            return validator.isURL(v, {
              protocols: ["http", "https"],
              require_tld: true,
              require_protocol: true,
            });
          },
          message: "Invalid X URL",
        },
      },
      linkedin: {
        type: String,
        default: "",
        validate: {
          validator: function (v) {
            if (!v) return true;
            return validator.isURL(v, {
              protocols: ["http", "https"],
              require_tld: true,
              require_protocol: true,
            });
          },
          message: "Invalid linkedin URL",
        },
      },
      youtube: {
        type: String,
        default: "",
        validate: {
          validator: function (v) {
            if (!v) return true;
            return validator.isURL(v, {
              protocols: ["http", "https"],
              require_tld: true,
              require_protocol: true,
            });
          },
          message: "Invalid youtube URL",
        },
      },
    },
    following: { type: [Schema.Types.ObjectId], ref: "Profile", default: [] },
    followers: { type: [Schema.Types.ObjectId], ref: "Profile", default: [] },
    status: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active",
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    experience: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Experience",
      },
    ],
    education: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Education",
      },]
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate slug from userName
ProfileSchema.pre("save", function (next) {
  if (this.isModified("userName")) {
    this.slug = slugify(this.userName, { lower: true, strict: true });
  }
  next();
});

module.exports =
  mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
