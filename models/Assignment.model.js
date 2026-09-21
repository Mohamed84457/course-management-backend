import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    attachmentUrl: { type: String, default: null }, // Reference PDF/sheet from teacher
    totalPoints: { type: Number, default: 100, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "published",
    },
  },
  { timestamps: true },
);

const assignmentModel = mongoose.model("Assignment", assignmentSchema);

export default assignmentModel;
