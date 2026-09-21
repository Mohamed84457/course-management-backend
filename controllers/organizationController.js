import crypto from "crypto";
//models
import { organizationModel } from "../models/Organization.model.js";
import { userModel } from "../models/User.model.js";
import { Student } from "../models/Student.model.js";

import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// utils
import { sanitizeUser } from "../utils/sanitizeUser.js";

// create organization
const createOrganization = async (req, res) => {
  try {
    if (!req.user || !Array.isArray(req.user.role)) {
      return res
        .status(401)
        .json({ success: false, message: "unauthenticated" });
    }

    let joinCode;

    do {
      joinCode = "OR-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    } while (await organizationModel.exists({ joinCode }));

    const CREATE_ALLOWED_FIELDS = [
      "name",
      "email",
      "address",
      "phone",
      "logo",
      "website",
      "settings",
    ];
    const neworganization = {};
    for (const key of CREATE_ALLOWED_FIELDS) {
      if (req.body?.[key] !== undefined) neworganization[key] = req.body[key];
    }
    neworganization.ownerId = req.user._id;
    neworganization.joinCode = joinCode;

    const newOrganization = await organizationModel.create(neworganization);

    return res.status(201).json({
      success: true,
      message: "organization create successfully",
      organization: newOrganization,
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({
        success: false,
        message: "email already used",
      });
    }
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// // disactive organization
// const disactiveOrganization = async (req, res) => {
//   try {
//     const organizationId = req.params.organizationId ?? "";

//     if (!mongoose.Types.ObjectId.isValid(organizationId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid organization id",
//       });
//     }

//     const organization = await organizationModel.findById(organizationId);

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: "Organization not found",
//       });
//     }

//     organization.isActive = false;
//     await organization.save();

//     res.status(200).json({
//       success: true,
//       message: "organization disactive successfully",
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({
//       success: false,
//       message: "internal server error",
//     });
//   }
// };
// // active organization
// const activeOrganization = async (req, res) => {
//   try {
//     const organizationId = req.params.organizationId ?? "";

//     if (!mongoose.Types.ObjectId.isValid(organizationId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid organization id",
//       });
//     }

//     const organization = await organizationModel.findById(organizationId);

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: "Organization not found",
//       });
//     }

//     organization.isActive = true;
//     await organization.save();

//     res.status(200).json({
//       success: true,
//       message: "organization active successfully",
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({
//       success: false,
//       message: "internal server error",
//     });
//   }
// };

// update organization
const updateOrganization = async (req, res) => {
  const ALLOWED_FIELDS = [
    "name",
    "email",
    "address",
    "isActive",
    "phone",
    "settings",
  ];

  try {
    const organizationId = req.params.organizationId;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization id",
      });
    }

    // prevent user update these
    const newOrganizationData = {};
    for (const key of ALLOWED_FIELDS) {
      if (req.body?.[key] !== undefined) {
        newOrganizationData[key] = req.body[key];
      }
    }

    if (Object.keys(newOrganizationData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const organization = await organizationModel.findByIdAndUpdate(
      organizationId,
      {
        $set: newOrganizationData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "organization updated successfully",
      data: organization,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get all organization
const getAllOrganization = async (req, res) => {
  try {
    const result = await organizationModel.find();
    return res.status(200).json({
      success: true,
      message: "got all organization successfully ",
      data: result || [],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      messsage: "internal server error",
    });
  }
};
// get specified organization
const ownerSpecifiedOrganization = async (req, res) => {
  try {
    const id = req.params.organizationId ?? "";
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization id",
      });
    }
    const organization = await organizationModel.findOne({
      _id: id,
    });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "got organization successfully",
      data: organization,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// public controllers
// get all active organization
const getAllActiveOrganization = async (req, res) => {
  try {
    const result = await organizationModel.find({ isActive: true });
    return res.status(200).json({
      success: true,
      message: "got all organization successfully ",
      data: result || [],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      messsage: "internal server error",
    });
  }
};

// get specified organization
const specifiedOrganization = async (req, res) => {
  try {
    const id = req.params.organizationId ?? "";
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization id",
      });
    }
    const organization = await organizationModel.findOne({
      _id: id,
      isActive: true,
    });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "organization specified successfully",
      data: organization,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete organization
const deleteOrganization = async (req, res) => {
  const organizationId = req.params.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization id is required",
    });
  }
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid organization id",
    });
  }

  try {
    const result = await organizationModel.findByIdAndDelete(organizationId);
    console.log(result);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: " organization not found ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "organization delete successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get all students of organization
const AllStudentsOfOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const students = await Student.aggregate([
      {
        $lookup: {
          from: "users", // name of the users collection in MongoDB
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" }, // Flatten the user array
      {
        $match: {
          "user.organizationId": new mongoose.Types.ObjectId(organizationId),
          "user.role": "student",
        },
      },
      {
        $project: {
          "user.password": 0,
          "user.refreshToken": 0,
          "user.verifyToken": 0,
        },
      },
    ]);

    const filteredStudentsData = students.map((s) => ({
      ...s,
      user: sanitizeUser(s.user),
    }));

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      count: students.length,
      students: filteredStudentsData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// join the organization
// Join Organization using joinCode
const joinOrganization = async (req, res) => {
  try {
    const joinCode = req.body?.joinCode ?? null;

    if (!joinCode || typeof joinCode !== "string") {
      return res.status(400).json({
        success: false,
        message: "Join code is required",
      });
    }

    // Find active organization matching the code
    const organization = await organizationModel.findOne({
      joinCode: joinCode.trim().toUpperCase(),
      isActive: true,
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive organization join code",
      });
    }

    const user = await userModel.findById(req.user._id);

    // Check if user is already in this organization
    if (user.organizationId?.toString() === organization._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this organization",
      });
    }

    // Assign organization to user
    user.organizationId = organization._id;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Successfully joined ${organization.name}`,
      organization: {
        id: organization._id,
        name: organization.name,
        email: organization.email,
        logo: organization.logo,
      },
    });
  } catch (err) {
    console.error("joinOrganization Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// add & update organization logo
const uploadOrganizationImage = async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "image required",
      });
    }

    const organization = await organizationModel.findById(organizationId);
    if (!organization) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "organization not found",
      });
    }

    if (
      organization?.ownerId?.toString() !== req?.user?._id?.toString() ||
      !req.user.role.includes("owner")
    ) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        success: false,
        message: "you are denied to edit organization ",
      });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // if already has profile image
    if (organization.logo) {
      // organization.logo is e.g. "/uploads/123-filename.jpg"
      const oldImagePath = path.join(
        __dirname,
        "..",
        "public",
        organization.logo,
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Removes old file from disk
      }
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    organization.logo = imageUrl;

    await organization.save();

    return res.status(200).json({
      success: true,
      message: "organization logo changed successfully",
      organizationLogo: organization?.logo,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete profile image
const deleteOrganizationImage = async (req, res) => {
  try {
    const organizationId = req.params.organizationId;

    const organization = await organizationModel.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "organization not found",
      });
    }

    if (organization?.ownerId?.toString() !== req?.user?._id?.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    if (organization.logo) {
      const imagePath = path.join(__dirname, "..", "public", organization.logo);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      organization.logo = null;
      await organization.save();

      return res.status(200).json({
        success: true,
        message: "organization logo delete successfully",
      });
    }

    return res.status(404).json({
      success: false,
      message: "no image found",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export {
  createOrganization,
  updateOrganization,
  getAllOrganization,
  getAllActiveOrganization,
  specifiedOrganization,
  ownerSpecifiedOrganization,
  deleteOrganization,
  AllStudentsOfOrganization,
  joinOrganization,
  uploadOrganizationImage,
  deleteOrganizationImage,
};
