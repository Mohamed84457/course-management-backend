import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    thumbnail: {
      //image
      type: String,
      default: null,
    },
    price: {
      type: Number,
      default: 0,
      min: 0, // 0 means free course
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all_levels"],
      default: "beginner",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    educationLevel: {
      type: String,
      trim: true, // e.g. "Primary", "Secondary", "University"
    },
    durationHours: {
      type: Number,
      default: 0,
    },
    lessonsCount: {
      type: Number,
      default: 0,
    },
    capacity: {
      type: Number,
      default: null, // Max student enrollment limit (null = unlimited)
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Indexes for fast lookup
courseSchema.index({ organizationId: 1, categoryId: 1 });
courseSchema.index({ organizationId: 1, teacherId: 1 });
courseSchema.index({ organizationId: 1, status: 1 });

const courseModel = mongoose.model("Course", courseSchema);

export { courseModel };
