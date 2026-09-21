import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String, trim: true },
    image: { type: String },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate category names within the same organization
categorySchema.index({ organizationId: 1, name: 1 }, { unique: true });

const categoryModel = mongoose.model("Category", categorySchema);

export { categoryModel };
