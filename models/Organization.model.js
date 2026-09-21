import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    logo: String,

    phone: {
      type: String,
      required: true,
    },

    address: String,

    website: String,

    isActive: {
      type: Boolean,
      default: true,
    },
    joinCode: {
      type: String,
      unique: true,
      sparse: true, //make it not required and still if he put
      // then must be unique
    },

    settings: {
      currency: {
        type: String,
        default: "EGP",
      },

      timezone: {
        type: String,
        default: "Africa/Cairo",
      },

      language: {
        type: String,
        default: "en",
      },
    },
  },
  {
    timestamps: true,
  },
);

export const organizationModel = mongoose.model(
  "Organization",
  organizationSchema,
);
