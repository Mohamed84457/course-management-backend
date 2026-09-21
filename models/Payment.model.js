import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    month: {
      type: String,
      required: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "vodafone_cash", "bank_transfer", "card", "other"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["completed", "pending", "refunded"],
      default: "completed",
    },
    receiptNumber: {
      type: String,
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

paymentSchema.index({ organizationId: 1, studentId: 1 });
paymentSchema.index({ organizationId: 1, courseId: 1 });
paymentSchema.index({ organizationId: 1, month: 1 });

const paymentModel = mongoose.model("Payment", paymentSchema);

export default paymentModel;
