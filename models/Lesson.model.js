import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
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
    title: { type: String, required: true, trim: true }, // e.g. "Lecture 1: Intro to Physics"
    description: { type: String, trim: true }, // Notes on what was covered offline
    materialUrl: { type: String, default: null }, // Optional link to PDF, Drive, or document
    orderIndex: { type: Number, default: 1 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const lessonModel = mongoose.model("Lesson", lessonSchema);

export default lessonModel;
