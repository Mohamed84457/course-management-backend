import crypto from "crypto";
import bcrypt from "bcrypt";
// models
import { userModel } from "../models/User.model.js";
import { Student } from "../models/Student.model.js";

// make student
const makeStudent = async (req, res) => {
  try {
    const ALLOWED_KEYS = [
      "name",
      "email",
      "password",
      "organizationId",
      "gender",
      "phone",
      "parentPhone",
      "parentName",
      "address",
      "school",
      "educationLevel",
    ];

    let studentData = {};
    for (const key of ALLOWED_KEYS) {
      if (req.body?.[key] !== undefined) {
        studentData[key] = req.body[key];
      }
    }

    if (Object.keys(studentData).length < 1) {
      return res.status(404).json({
        success: false,
        message: "please provide required details",
      });
    }

    const existUser = await userModel.findOne({
      email: studentData.email,
    });

    if (existUser) {
      return res.status(409).json({
        success: false,
        message: "email is already exist",
      });
    }

    const role = ["student"];
    studentData.role = role;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(studentData.password, salt);
    studentData.password = hashedPassword;
    studentData.isEmailVerified = true;

    const result = await userModel.create({
      ...studentData,
    });

    const targetRole = "student";

    if (result.role.includes(targetRole)) {
      const studentCode =
        "ST-" + crypto.randomBytes(4).toString("hex").toUpperCase();

      const std = await Student.create({
        userId: result._id,
        studentCode,
        parentPhone: studentData.parentPhone,
        parentName: studentData.parentName,
        address: studentData.address,
        school: studentData.school,
        educationLevel: studentData.educationLevel,
      });
      // Hide sensitive data from response
      const { password, ...userWithoutPassword } = result._doc;

      return res.status(201).json({
        success: true,
        message: "student create successfully",
        user: userWithoutPassword,
        student: std,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "created user is not a student",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get specific student
const getSpecificStudent = async (req, res) => {
  try {
    const studentId = req.params?.studentId;
    const studentData = await Student.findById(studentId).populate({
      path: "userId",
      select: "-password -__v", //select all except these
      match: {
        isactive: true,
      },
    });

    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: "student not found",
      });
    }

    const result = studentData.toObject();
    result.user = result.userId;
    delete result.userId;

    const STAFF = ["owner", "manager", "admin"];
    const isStaff = STAFF.some((role) => req.user.role.includes(role));

    if (!isStaff && req.user.id !== result.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "access denied",
      });
    }

    res.status(200).json({
      success: true,
      message: "student found successfully",
      student: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// update student
const updateStudent = async (req, res) => {
  try {
    const { userId } = req.params;

    const ALLOWED_KEYS = [
      "studentCode",
      "parentName",
      "parentPhone",
      "address",
      "school",
      "educationLevel",
    ];
    let newStudentData = {};
    for (const key of ALLOWED_KEYS) {
      if (req.body?.[key] !== undefined) {
        newStudentData[key] = req.body[key];
      }
    }

    if (Object.keys(newStudentData).length < 1) {
      return res.status(400).json({
        success: false,
        message: "no thing to update",
      });
    }
    const student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "student not found",
      });
    }

    const STAFF = ["owner", "manager", "admin"];
    const isStaff = STAFF.some((role) => req.user.role.includes(role));

    if (!isStaff && req.user._id.toString() !== student.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "access denied",
      });
    }
    const updatedStudent = await Student.findOneAndUpdate(
      { userId },
      { $set: newStudentData },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "updated successfully",
      updatedStudent,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
//

// delete student
const deleteStudent = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    const student = await Student.findOneAndDelete({ userId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "student not found",
      });
    }

    const newRole = user?.role.filter((r) => r !== "student");
    user.role = newRole || [];

    await user.save();

    res.status(200).json({
      success: true,
      message: "student delete success",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get all students (Protected: Owner, Manager, Admin)
const getAllStudents = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, educationLevel, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Find all users in this organization with 'student' role
    const userQuery = { organizationId, role: "student" };
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const matchingUsers = await userModel.find(userQuery).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    const studentQuery = { userId: { $in: userIds } };

    if (educationLevel) {
      studentQuery.educationLevel = educationLevel;
    }

    const totalStudents = await Student.countDocuments(studentQuery);
    const students = await Student.find(studentQuery)
      .populate({
        path: "userId",
        select: "-password -__v", //select all except these
        match: {
          isactive: true,
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const result = students.map((std) => {
      const obj = std.toObject();
      obj.user = obj.userId;
      delete obj.userId;

      return obj;
    });

    return res.status(200).json({
      success: true,
      count: students.length,
      totalStudents,
      totalPages: Math.ceil(totalStudents / limitNum),
      currentPage: pageNum,
      students: result,
    });
  } catch (err) {
    console.error("getAllStudents error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export {
  makeStudent,
  getSpecificStudent,
  updateStudent,
  deleteStudent,
  getAllStudents,
};
