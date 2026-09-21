import crypto from "crypto";
// models
import paymentModel from "../models/Payment.model.js";
import { Student } from "../models/Student.model.js";
import { courseModel } from "../models/Course.model.js";
import enrollmentModel from "../models/enrollment.model.js";
import Teacher from "../models/Teacher.model.js";
// utils
import { createNotification } from "../utils/createNotification.js";

// Create manual payment
const createPayment = async (req, res) => {
  try {
    const { _id, organizationId } = req.user;
    const {
      studentId,
      courseId,
      amount,
      month,
      paymentMethod = "cash",
      paymentStatus = "completed",
      notes,
    } = req.body;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "User must be associated with an organization",
      });
    }

    // Verify Student
    const student = await Student.findOne({
      _id: studentId,
    }).populate("userId");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Verify Course
    const course = await courseModel.findOne({
      _id: courseId,
      organizationId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found in this organization",
      });
    }

    // Check or update/create enrollment
    let enrollment = await enrollmentModel.findOne({
      studentId,
      courseId,
      organizationId,
    });

    if (!enrollment) {
      enrollment = await enrollmentModel.create({
        organizationId,
        studentId,
        courseId,
        status: "active",
        paymentStatus: "paid",
        enrolledAt: new Date(),
      });
    } else {
      enrollment.status = "active";
      enrollment.paymentStatus = "paid";
      await enrollment.save();
    }

    // Generate unique receipt number
    const receiptNumber =
      "PAY-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    // Create Payment Record
    const payment = await paymentModel.create({
      organizationId,
      studentId,
      courseId,
      enrollmentId: enrollment._id,
      amount,
      month,
      paymentMethod,
      paymentStatus,
      receiptNumber,
      receivedBy: _id,
      notes,
      paymentDate: new Date(),
    });

    // Notify Student
    if (student.userId) {
      createNotification({
        organizationId,
        userId: student.userId._id || student.userId,
        type: "payment_received",
        message: `Payment of ${amount} EGP for course "${course.title}" (${month}) was successfully recorded. Receipt #${receiptNumber}`,
        link: `/payments/receipt/${payment._id}`,
        data: {
          courseId,
          paymentId: payment._id,
          receiptNumber,
          amount,
          month,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment,
    });
  } catch (err) {
    console.error("createPayment error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all payments (Staff & Teacher)
const getPayments = async (req, res) => {
  try {
    const { _id, role, organizationId } = req.user;
    const {
      studentId,
      courseId,
      month,
      paymentStatus,
      paymentMethod,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization required",
      });
    }

    const filter = { organizationId };

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((r) => role.includes(r));
    const isTeacher = role.includes("teacher");

    if (!isStaff && isTeacher) {
      const teacher = await Teacher.findOne({ userId: _id });
      if (!teacher) {
        return res.status(401).json({
          success: false,
          message: "Not authorized",
        });
      }
      const teacherCourses = await courseModel
        .find({ organizationId, teacherId: teacher._id })
        .select("_id");
      filter.courseId = { $in: teacherCourses.map((c) => c._id) };
    }

    if (studentId) filter.studentId = studentId;
    if (courseId) filter.courseId = courseId;
    if (month) filter.month = { $regex: month, $options: "i" };
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { month: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const totalPayments = await paymentModel.countDocuments(filter);

    const payments = await paymentModel
      .find(filter)
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email phone gender profileImage",
        },
      })
      .populate("courseId", "title price thumbnail level")
      .populate("receivedBy", "name email role")
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      count: payments.length,
      totalPayments,
      totalPages: Math.ceil(totalPayments / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      payments,
    });
  } catch (err) {
    console.error("getPayments error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get single payment details
const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { organizationId } = req.user;

    const payment = await paymentModel
      .findOne({
        _id: paymentId,
        organizationId,
      })
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email phone gender profileImage address",
        },
      })
      .populate("courseId")
      .populate("receivedBy", "name email role")
      .populate("enrollmentId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment details fetched successfully",
      payment,
    });
  } catch (err) {
    console.error("getPayment error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update payment details
const updatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { organizationId } = req.user;

    const payment = await paymentModel.findOne({
      _id: paymentId,
      organizationId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    const ALLOWED_FIELDS = [
      "amount",
      "month",
      "paymentMethod",
      "paymentStatus",
      "notes",
    ];
    const updateData = {};

    for (const key of ALLOWED_FIELDS) {
      if (req.body?.[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const updatedPayment = await paymentModel.findOneAndUpdate(
      { _id: paymentId, organizationId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      payment: updatedPayment,
    });
  } catch (err) {
    console.error("updatePayment error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { organizationId } = req.user;

    const payment = await paymentModel.findOneAndDelete({
      _id: paymentId,
      organizationId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (err) {
    console.error("deletePayment error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all payments for a specific student
const getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { organizationId } = req.user;

    const payments = await paymentModel
      .find({
        studentId,
        organizationId,
      })
      .populate("courseId", "title price thumbnail level")
      .populate("receivedBy", "name email")
      .sort({ paymentDate: -1 });

    return res.status(200).json({
      success: true,
      message: "Student payments fetched successfully",
      count: payments.length,
      payments,
    });
  } catch (err) {
    console.error("getStudentPayments error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  createPayment,
  getPayments,
  getPayment,
  updatePayment,
  deletePayment,
  getStudentPayments,
};
