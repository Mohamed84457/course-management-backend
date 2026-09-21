import { userModel } from "../models/User.model.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";

// Get all organization users (Protected: Owner, Admin, Manager)
const getAllUsers = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with an organization",
      });
    }

    const { search, role, isactive, page = 1, limit = 10 } = req.query;

    const query = { organizationId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isactive !== undefined) {
      query.isactive = isactive === "true";
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalUsers = await userModel.countDocuments(query);
    const users = await userModel
      .find(query)
      .select("-password -accessToken -refreshToken -resetToken -verifyToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: users.length,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limitNum),
      currentPage: pageNum,
      users,
    });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update User Role (Protected: Owner, Admin)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body ?? {};

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const rolesArray = Array.isArray(role) ? role : [role];
    const ALLOWED_ROLES = [
      "owner",
      "admin",
      "manager",
      "instructor",
      "student",
      "teacher",
    ];

    const isValid = rolesArray.every((r) => ALLOWED_ROLES.includes(r));
    if (!isValid || rolesArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    const user = await userModel.findOne({
      _id: userId,
      organizationId: req.user.organizationId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in your organization",
      });
    }

    user.role = rolesArray;
    await user.save();

    const updatedUser = sanitizeUser(user);

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("updateUserRole error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update User Status - Activate / Deactivate (Protected: Owner, Admin)
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isactive } = req.body ?? {};

    if (typeof isactive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isactive must be a boolean (true or false)",
      });
    }

    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own active status",
      });
    }

    const user = await userModel.findOne({
      _id: userId,
      organizationId: req.user.organizationId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in your organization",
      });
    }

    user.isactive = isactive;
    await user.save();

    const updatedUser = sanitizeUser(user);

    return res.status(200).json({
      success: true,
      message: `User ${isactive ? "activated" : "deactivated"} successfully`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("updateUserStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { getAllUsers, updateUserRole, updateUserStatus };
