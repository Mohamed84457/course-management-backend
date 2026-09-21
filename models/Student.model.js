import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    studentCode: {
      type: String,
      trim: true,
      sparse: true,
    },

    parentName: {
      type: String,
      required: true,
      trim: true,
    },

    parentPhone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    school: {
      type: String,
      trim: true,
    },

    educationLevel: {
      type: String,
      enum: [
        "Primary",
        "Preparatory",
        "Secondary",
        "University",
        "Graduate",
        "Other",
      ],
    },
  },
  {
    timestamps: true,
  },
);

const Student = mongoose.model("Student", studentSchema);

export { Student };
