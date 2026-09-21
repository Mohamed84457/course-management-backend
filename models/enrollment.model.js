import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["pending", "active", "completed", "dropped", "cancelled"],
      default: "active",
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    grade: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["free", "paid", "unpaid", "refunded"],
      default: "free",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate enrollment of the same student in the same course
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Fast queries for organization, student, and course lookup
enrollmentSchema.index({ organizationId: 1, studentId: 1 });
enrollmentSchema.index({ organizationId: 1, courseId: 1 });
enrollmentSchema.index({ organizationId: 1, status: 1 });

const enrollmentModel = mongoose.model("Enrollment", enrollmentSchema);

export default enrollmentModel;

