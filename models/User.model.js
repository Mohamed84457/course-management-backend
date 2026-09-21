import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: [String],
      enum: ["owner", "admin", "manager", "instructor", "student", "teacher"],
      required: true,
      default: ["student"],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    isactive: { type: Boolean, default: true },
    gender: { type: String, enum: ["male", "female"] },
    phone: {
      type: String,
    },

    profileImage: {
      type: String,
    },
    isEmailVerified: { type: Boolean, default: false },
    accessToken: { type: String },
    refreshToken: { type: String },
    verifyToken: { type: String },
    expireVerifyToken: { type: Date },
    resetToken: { type: String },
    expireResetToken: { type: Date },
    lastLogin: { type: Date },
  },
  {
    timestamps: true, // creates createdAt and updatedAt automatically
  },
);

const userModel = mongoose.model("User", userSchema);
export { userModel };
