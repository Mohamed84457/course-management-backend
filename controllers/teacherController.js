import crypto from "crypto";
import bcrypt from "bcrypt";
// models
import { userModel } from "../models/User.model.js";
import Teacher from "../models/Teacher.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import mongoose from "mongoose";

// make new teacher acount
const hireNewTeacher = async (req, res) => {
  try {
    const CREATE_ALLOWED_FIELDS = [
      "name",
      "email",
      "password",
      "role",
      "gender",
      "address",
      "phone",
      "qualification",
      "specialization",
      "experience",
      "bio",
      "salary",
    ];

    const newteacheruser = {};
    for (const key of CREATE_ALLOWED_FIELDS) {
      if (req.body?.[key] !== undefined) {
        newteacheruser[key] = req.body[key];
      }
    }

    if (!newteacheruser.password) {
      return res.status(400).json({
        success: false,
        message: "password is required",
      });
    }

    if (!newteacheruser.role || !newteacheruser.role.length) {
      newteacheruser.role = ["teacher"];
    }

    // check if user exists
    const existUser = await userModel.findOne({ email: newteacheruser.email });
    if (existUser) {
      return res.status(409).json({
        success: false,
        message: "email has been used",
      });
    }

    const verifyToken = crypto.randomUUID();
    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");
    const expireVerifyToken = Date.now() + 15 * 60 * 1000;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newteacheruser.password, salt);

    const user = await userModel.create({
      name: newteacheruser.name,
      email: newteacheruser.email,
      password: hashedPassword,
      role: newteacheruser.role,
      gender: newteacheruser.gender,
      phone: newteacheruser.phone,
      verifyToken: hashedVerifyToken,
      expireVerifyToken,
    });

    const userRoles = Array.isArray(newteacheruser.role)
      ? newteacheruser.role
      : [newteacheruser.role];

    if (userRoles.includes("teacher") || userRoles.includes("instructor")) {
      try {
        const employeeCode =
          "TC-" + crypto.randomBytes(4).toString("hex").toUpperCase();
        await Teacher.create({
          userId: user._id,
          specialization: newteacheruser.specialization,
          qualification: newteacheruser.qualification,
          experience: newteacheruser.experience,
          bio: newteacheruser.bio,
          salary: newteacheruser.salary,
          employeeCode,
        });
      } catch (teacherErr) {
        await userModel.findByIdAndDelete(user._id); // rollback
        console.error("Error creating Teacher record:", teacherErr.message);
        return res.status(500).json({
          success: false,
          message: "Could not create teacher account details, please try again",
          err: teacherErr.message,
        });
      }
    }

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: "registration successfully",
      user: userObj,
    });

    const url = `${process.env.CLIENT_URL}/api/auth/verify/${verifyToken}`;
    await sendEmail({
      to: newteacheruser.email,
      subject: "Your Course Account - Verify Your Email Address",
      text: `Dear ${newteacheruser.name}, please verify your email: ${url}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2d3748;">Verify Your Email</h2>
          <p>Dear <strong>${newteacheruser.name}</strong>,</p>
          <p>Thank you for registering with <strong>Course Management</strong>. Please confirm your email address to activate your account.</p>
          <p style="margin: 24px 0;">
            <a href="${url}" 
               style="background-color: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${url}</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #888;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `,
    }).catch((emailErr) => {
      console.error("Failed to send verification email:", emailErr);
    });
  } catch (err) {
    console.error("newTeacher controller error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
      err: err.message,
    });
  }
};
// promotion user to teacher
const promoteToTeacher = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findOne({
      _id: userId,
      isactive: true,
      isEmailVerified: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    const currentRoles = Array.isArray(user.role) ? user.role : [];
    if (currentRoles.includes("teacher")) {
      return res.status(409).json({
        success: false,
        message: "user is already a teacher",
      });
    }

    const CREATE_ALLOWED_FIELDS = [
      "qualification",
      "specialization",
      "experience",
      "bio",
      "salary",
    ];

    let newteacheruser = {};
    for (const key of CREATE_ALLOWED_FIELDS) {
      if (req.body?.[key] !== undefined) {
        newteacheruser[key] = req.body[key];
      }
    }

    if (Array.isArray(user.role)) {
      if (!user.role.includes("teacher")) {
        user.role.push("teacher");
      }
    } else {
      user.role = ["teacher"];
    }

    const employeeCode =
      "TC-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    const teacher = await Teacher.create({
      userId: userId,
      specialization: newteacheruser.specialization,
      qualification: newteacheruser.qualification,
      experience: newteacheruser.experience,
      bio: newteacheruser.bio,
      salary: newteacheruser.salary,
      employeeCode,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "teacher created successfully",
      teacher,
    });
  } catch (err) {
    console.error("promoteToTeacher error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
      err: err.message,
    });
  }
};
// delete teacher
const deleteTeacher = async (req, res) => {
  const userId = req.params.userId;
  const teacher = await Teacher.findOne({ userId });
  const user = await userModel.findOne({ _id: userId });
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: "teacher not found",
    });
  }
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "user not found",
    });
  }

  const userRoles = Array.isArray(user.role) ? user.role : [];
  try {
    if (userRoles.includes("teacher")) {
      const result = await Teacher.findOneAndDelete({
        userId,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "teacher not found",
        });
      }
      const newRoles = userRoles.filter((r) => r !== "teacher");
      user.role = newRoles;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "teacher dedleted successfully",
      });
    }
  } catch (err) {
    console.log("can not delete teacher now please try again later", err);
    return res.status(500).json({
      success: false,
      message: "can not delete user now please try again later",
    });
  }
};
// get all teachers
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate({
    path: "userId",
    select:
      "name email role gender phone isEmailVerified isactive createdAt updatedAt",
  });
     if (!teachers) {

      return res.status(200).json({
        success: true,
        message: "no teachers yet",
        teacher: teachers,
      });
    }

    return res.status(200).json({
      success: true,
      message: "all teachers ",
      teacher: teachers,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get specified teacher
const getSpecifiedTeacher = async (req, res) => {
  const teacherId = req.params.teacherId;

  if (!teacherId) {
    return res.status(400).json({
      success: false,
      message: "teacher id required",
    });
  }

  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "teacher not found",
      });
    }
    const allowedRoles = ["owner", "admin", "manager"];

    const isStaff = allowedRoles.some((role) => req.user.role.includes(role));
    if (req.user.id !== teacher.userId.toString() && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "teacher found",
      teacher,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// update specified teacher by admin or owner to update salary
const protectedUpdateTeacher = async (req, res) => {
  const teacherId = req.params.teacherId;

  if (!teacherId) {
    return res.status(400).json({
      success: false,
      message: "teacher id required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid teacher id",
    });
  }
  try {
    const teacher = await Teacher.findById(teacherId);

    const CREATE_ALLOWED_FIELDS = [
      "qualification",
      "specialization",
      "experience",
      "bio",
      "salary",
    ];

    const newTeacherData = {};
    for (const key of CREATE_ALLOWED_FIELDS) {
      if (req.body?.[key] !== undefined) {
        newTeacherData[key] = req.body[key];
      }
    }

    if (Object.keys(newTeacherData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      newTeacherData,
      { new: true, runValidators: true },
    );

    if (!updatedTeacher) {
      return res.status(404).json({
        success: false,
        message: "teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "teacher updated successfully",
      teacher: updatedTeacher,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// update specified data teacher
const updateTeacher = async (req, res) => {
  const teacherId = req.params.teacherId;

  if (!teacherId) {
    return res.status(400).json({
      success: false,
      message: "teacher id required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid teacher id",
    });
  }
  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "teacher not found",
      });
    }
    const allowedRoles = ["owner", "admin", "manager"];

    const isStaff = allowedRoles.some((role) => req.user.role.includes(role));
    if (req.user.id !== teacher.userId.toString() && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "access denied",
      });
    }

    const CREATE_ALLOWED_FIELDS = [
      "qualification",
      "specialization",
      "experience",
      "bio",
    ];

    const newTeacherData = {};
    for (const key of CREATE_ALLOWED_FIELDS) {
      if (req.body?.[key] !== undefined) {
        newTeacherData[key] = req.body[key];
      }
    }

    if (Object.keys(newTeacherData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      newTeacherData,
      { new: true, runValidators: true },
    );

    if (!updatedTeacher) {
      return res.status(404).json({
        success: false,
        message: "teacher not found",
      });
    }

    const teacherObj = updatedTeacher.toObject();
    delete teacherObj.salary;
    return res.status(200).json({
      success: true,
      message: "teacher updated successfully",
      teacher: teacherObj,
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
  hireNewTeacher,
  promoteToTeacher,
  deleteTeacher,
  getAllTeachers,
  getSpecifiedTeacher,
  protectedUpdateTeacher,
  updateTeacher
};
