import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    data: {
      type: Object,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const notificationModel = mongoose.model("Notification", notificationSchema);
export default notificationModel;
