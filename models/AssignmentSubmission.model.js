import mongoose from "mongoose";

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
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
    fileUrl: { type: String, required: true }, // Uploaded PDF/image file link
    submissionNotes: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
    grade: { type: Number, min: 0, default: null }, // Score given by teacher
    bonusPoints: { type: Number, default: 0, min: 0 }, // Extra bonus points awarded!
    feedback: { type: String, trim: true }, // Teacher notes
    status: {
      type: String,
      enum: ["submitted", "graded", "resubmit"],
      default: "submitted",
    },
  },
  { timestamps: true },
);

const assignmentSubmissionModel = mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema,
);
export default assignmentSubmissionModel;
