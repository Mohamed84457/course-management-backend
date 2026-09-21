// models
import enrollmentModel from "../models/enrollment.model.js";
import { courseModel } from "../models/Course.model.js";
import { userModel } from "../models/User.model.js";
import { Student } from "../models/Student.model.js";
import Teacher from "../models/Teacher.model.js";
import { organizationModel } from "../models/Organization.model.js";

// enroll course
const newEnrollment = async (req, res) => {
  try {
    // const response=await enrollmentModel.create(req.body);
    const { organizationId, _id } = req.user;

    const courseId = req.body?.courseId;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId required",
      });
    }

    let enrollmentData = { organizationId };

    if (!req.user.role.includes("student")) {
      return res.status(400).json({
        success: false,
        message: "must register as student before enrollment",
      });
    }

    const student = await Student.findOne({
      userId: _id,
    });
    if (!student) {
      return res.status(400).json({
        success: false,
        message: "student profile not found",
      });
    }

    enrollmentData.studentId = student._id;

    const course = await courseModel.findOne({
      _id: courseId,
      organizationId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found in this organization",
      });
    }
    if (course.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "cannot enroll in unpublished course",
      });
    }
    if (course.capacity != null) {
      const countStudentsOfCourse = await enrollmentModel.countDocuments({
        courseId,
        status: {
          $in: ["active", "pending"],
        },
      });

      if (countStudentsOfCourse >= course.capacity) {
        return res.status(400).json({
          success: false,
          message: "course completed",
        });
      }
    }

    if (course.price > 0) {
      enrollmentData.paymentStatus = "unpaid";
      enrollmentData.status = "pending";
    } else {
      enrollmentData.paymentStatus = "free";
      enrollmentData.status = "active";
    }
    enrollmentData.courseId = courseId;

    const existingEnrollment = await enrollmentModel.findOne({
      studentId: student._id,
      courseId,
      organizationId,
    });

    if (existingEnrollment) {
      if (["active", "pending"].includes(existingEnrollment.status)) {
        return res.status(400).json({
          success: false,
          message: "you are already enrolled in this course",
        });
      }
      // Reactivate existing cancelled or dropped enrollment
      existingEnrollment.status = enrollmentData.status;
      existingEnrollment.paymentStatus = enrollmentData.paymentStatus;
      existingEnrollment.enrolledAt = new Date();
      await existingEnrollment.save();

      return res.status(200).json({
        success: true,
        message: "re-enrolled in course successfully",
        enrollment: existingEnrollment,
      });
    }

    const response = await enrollmentModel.create(enrollmentData);

    return res.status(201).json({
      success: true,
      message: "made enrollment successfully",
      enrollment: response,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// cancel enrollment course
const cancelEnrollment = async (req, res) => {
  try {
    const { organizationId, _id } = req.user;
    const { enrollmentId } = req.params;

    const student = await Student.findOne({
      userId: _id,
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "student profile not found",
      });
    }

    const enrollment = await enrollmentModel.findOne({
      _id: enrollmentId,
      studentId: student._id,
      organizationId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "enrollment not found",
      });
    }

    if (enrollment.status == "cancelled") {
      return res.status(400).json({
        success: false,
        message: "enrollment is already cancelled",
      });
    }

    enrollment.status = "cancelled";
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "enrollment cancelled successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// active enrollment course

const activeEnrollment = async (req, res) => {
  try {
    const { organizationId, _id } = req.user;
    const { enrollmentId } = req.params;

    const student = await Student.findOne({
      userId: _id,
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "student profile not found",
      });
    }

    const enrollment = await enrollmentModel.findOne({
      _id: enrollmentId,
      studentId: student._id,
      organizationId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "enrollment not found",
      });
    }

    const course = await courseModel.findOne({
      _id: enrollment.courseId,
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found to active enrollment",
      });
    }

    if (course.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "cannot activate enrollment for unpublished course",
      });
    }

    if (course.capacity !== null) {
      const countStudentsOfCourse = await enrollmentModel.countDocuments({
        courseId: enrollment.courseId,
        status: {
          $in: ["active", "pending"],
        },
      });

      if (countStudentsOfCourse >= course.capacity) {
        return res.status(400).json({
          success: false,
          message: "course completed",
        });
      }
    }

    if (enrollment.status == "active") {
      return res.status(400).json({
        success: false,
        message: "enrollment is already active",
      });
    }

    enrollment.status = "active";
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "enrollment active successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get all enrollments for student
const studentEnrollments = async (req, res) => {
  try {
    const { organizationId, _id } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const student = await Student.findOne({
      userId: _id,
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: "student profile not found",
      });
    }

    const totalEnrollments = await enrollmentModel.countDocuments({
      organizationId,
      studentId: student._id,
      status: { $in: ["active", "pending"] },
    });

    const enrollments = await enrollmentModel
      .find({
        organizationId,
        studentId: student._id,
        status: { $in: ["active", "pending"] },
      })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "enrollments fetched successfully",
      count: enrollments.length,
      totalEnrollments,
      totalPages: Math.ceil(totalEnrollments / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      enrollments,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get spefific enrollment "for student"
const specificEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await enrollmentModel
      .findOne({
        _id: enrollmentId,
      })
      .populate("courseId");

    return res.status(200).json({
      success: true,
      message: "enrollment fetched successfully",
      enrollment,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// protected
// get spefific enrollment "for admins"
const specificEnrollmentProtected = async (req, res) => {
  try {
    const { _id, role, organizationId } = req.user;
    const { enrollmentId } = req.params;

    const enrollment = await enrollmentModel
      .findOne({
        _id: enrollmentId,
        organizationId,
      })
      .populate("courseId")
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select:
            "name email role organizationId isactive gender phone profileImage",
        },
      });

    // Enrollment doesn't exist
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "enrollment not found",
      });
    }

    const STAFF = ["owner", "manager", "admin"];

    const isStaff = STAFF.some((r) => role.includes(r));
    const isTeacher = role.includes("teacher");
    const isStudent = role.includes("student");

    // Staff can access any enrollment
    if (isStaff) {
      return res.status(200).json({
        success: true,
        message: "enrollment fetched successfully",
        enrollment,
      });
    }

    // Teacher can access enrollments for their courses
    if (isTeacher) {
      const teacher = await Teacher.findOne({ userId: _id });
      if (
        teacher &&
        enrollment.courseId?.teacherId?.toString() === teacher._id.toString()
      ) {
        return res.status(200).json({
          success: true,
          message: "enrollment fetched successfully",
          enrollment,
        });
      }
    }

    // Student can access only their own enrollment
    if (isStudent) {
      if (_id.toString() === enrollment.studentId?.userId?._id?.toString()) {
        return res.status(200).json({
          success: true,
          message: "enrollment fetched successfully",
          enrollment,
        });
      }
    }

    return res.status(403).json({
      success: false,
      message: "access denied",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// delete enrollment
const deleteEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { organizationId } = req.user;

    const enrollment = await enrollmentModel.findOne({
      _id: enrollmentId,
      organizationId,
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "enrollment not found",
      });
    }

    await enrollment.deleteOne({
      _id: enrollmentId,
    });

    return res.status(200).json({
      success: true,
      message: "enrollment deleted successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// all enrollment
const allEnrollments = async (req, res) => {
  try {
    const { _id, role, organizationId } = req.user;

    const {
      page = 1,
      limit = 10,
      enrolledAt,
      courseId,
      studentId,
      status,
      paymentStatus,
    } = req.query;

    const STAFF = ["owner", "manager", "admin"];

    const isStaff = STAFF.some((r) => role.includes(r));
    const isTeacher = role.includes("teacher");

    // --------------------------------
    // Authorization
    // --------------------------------

    if (!isStaff && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: "access denied",
      });
    }

    // --------------------------------
    // Base filter
    // --------------------------------

    let filter = {
      organizationId,
    };

    // --------------------------------
    // Teacher filter
    // --------------------------------

    if (isTeacher && !isStaff) {
      const teacher = await Teacher.findOne({
        userId: _id,
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "teacher not found",
        });
      }

      const courses = await courseModel
        .find({
          organizationId,
          teacherId: teacher._id,
        })
        .select("_id");

      const courseIds = courses.map((course) => course._id.toString());

      filter.courseId = {
        $in: courseIds,
      };
    }

    // --------------------------------
    // Query filters
    // --------------------------------

    if (enrolledAt) {
      filter.enrolledAt = enrolledAt;
    }

    if (courseId) {
      filter.courseId = courseId;
    }

    if (studentId) {
      filter.studentId = studentId;
    }

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // --------------------------------
    // Pagination
    // --------------------------------

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const skip = (pageNum - 1) * limitNum;

    // --------------------------------
    // Count
    // --------------------------------

    const totalEnrollments = await enrollmentModel.countDocuments(filter);

    // --------------------------------
    // Fetch
    // --------------------------------

    const enrollments = await enrollmentModel
      .find(filter)
      .populate("courseId")
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email role  isactive gender phone profileImage",

          populate: {
            path: "organizationId",
          },
        },
      })
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "enrollments fetched successfully",
      count: enrollments.length,
      totalEnrollments,
      totalPages: Math.ceil(totalEnrollments / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      enrollments,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// course enrollments
const courseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { _id, role, organizationId } = req.user;

    const {
      page = 1,
      limit = 10,
      paymentStatus,
      enrolledAt,
      status,
    } = req.query;

    let filter = { organizationId };
    if (paymentStatus) {
      filter = { ...filter, paymentStatus };
    }
    if (status) {
      filter = { ...filter, status };
    }
    if (enrolledAt) {
      filter = { ...filter, enrolledAt };
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const skip = (pageNum - 1) * limitNum;

    const course = await courseModel.findOne({
      _id: courseId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found",
      });
    }

    filter.courseId = courseId;

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");

    if (!isStaff && isTeacher) {
      const teacher = await Teacher.findOne({
        userId: _id,
      });

      if (!teacher || teacher._id.toString() !== course.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "access denied",
        });
      }
    }

    const totalEnrollments = await enrollmentModel.countDocuments(filter);

    const enrollments = await enrollmentModel
      .find(filter)
      .populate({
        path: "organizationId",
      })
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select:
            "name email role organizationId isactive gender phone profileImage",
        },
      })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "course enrollments fetched successfully",
      count: enrollments.length,
      totalEnrollments,
      totalPages: Math.ceil(totalEnrollments / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      enrollments,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// admin enroll student
const enrollStudent = async (req, res) => {
  try {
    const studentId = req.body?.studentId;
    const courseId = req.body?.courseId;
    const organizationId = req.user.organizationId || req.body?.organizationId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "studentId required",
      });
    }
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId required",
      });
    }
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId required",
      });
    }

    const student = await Student.findOne({
      _id: studentId,
    }).populate("userId");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "student not found",
      });
    }

    const course = await courseModel.findOne({
      _id: courseId,
      organizationId,
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found",
      });
    }

    // find if already enrolled
    const enrollment = await enrollmentModel.findOne({
      studentId,
      courseId,
      organizationId,
    });

    if (enrollment) {
      if (["active", "pending"].includes(enrollment.status)) {
        return res.status(400).json({
          success: false,
          message: "student is already enrolled in this course",
        });
      }
      // Reactivate cancelled or dropped enrollment
      enrollment.status = "active";
      enrollment.enrolledAt = new Date();
      await enrollment.save();

      return res.status(200).json({
        success: true,
        message: "enroll student successfully",
        enrollment,
      });
    }

    const organization = await organizationModel.findOne({
      _id: organizationId,
    });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "organization not found",
      });
    }

    if (student?.userId?.organizationId) {
      if (student?.userId?.organizationId.toString() !== organizationId) {
        return res.status(400).json({
          success: false,
          message: "student not in your organization",
        });
      }
    }

    if (!student?.userId?.organizationId) {
      const user = await userModel.findOne({
        _id: student.userId._id,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "user not found",
        });
      }
      user.organizationId = organizationId;
      await user.save();
    }

    const response = await enrollmentModel.create({
      courseId,
      studentId,
      organizationId,
    });
    return res.status(201).json({
      success: true,
      message: "enroll student successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// change enrollment status
const enrollmentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const status = req.body?.status;

    const VALIDSTATUS = [
      "pending",
      "active",
      "completed",
      "dropped",
      "cancelled",
    ];

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status required ",
      });
    }

    const isValid = VALIDSTATUS.includes(status);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: `enter valid status ${VALIDSTATUS}`,
      });
    }
    const { organizationId } = req.user;
    const enrollment = await enrollmentModel.findOne({
      _id: enrollmentId,
      organizationId,
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "enrollment not found",
      });
    }

    enrollment.status = status;
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "enrollment status changed successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// change payment status
const paymentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const paymentStatus = req.body?.paymentStatus;
    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "paymentStatus required",
      });
    }

    const VALIDPAYMENTSTATUS = ["free", "paid", "unpaid", "refunded"];
    const isValid = VALIDPAYMENTSTATUS.includes(paymentStatus);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: `enter valid payment status ${VALIDPAYMENTSTATUS} `,
      });
    }

    const { organizationId } = req.user;
    const enrollment = await enrollmentModel.findOne({
      _id: enrollmentId,
      organizationId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "enrollment not found",
      });
    }

    enrollment.paymentStatus = paymentStatus;

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "enrollment paymentStatus changed successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// change enrollment progress
const enrollmentProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const progress = req.body?.progress;

    const { _id, role, organizationId } = req.user;

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");

    if (progress === undefined || progress === null) {
      return res.status(400).json({
        success: false,
        message: "progress is required",
      });
    }

    const isValidNum =
      typeof progress === "number" && progress >= 0 && progress <= 100;

    if (!isValidNum) {
      return res.status(400).json({
        success: false,
        message: "progress must be number and between 0 and 100",
      });
    }

    const enrollment = await enrollmentModel
      .findOne({
        _id: enrollmentId,
        organizationId,
      })
      .populate("courseId");
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "enrollment not found",
      });
    }

    if (!isStaff && isTeacher) {
      const teacher = await Teacher.findOne({
        userId: _id,
      });
      if (!teacher) {
        return res.status(401).json({
          success: false,
          message: "unauthorized",
        });
      }

      if (
        teacher._id.toString() !== enrollment.courseId?.teacherId?.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "access forbidden",
        });
      }
    }

    enrollment.progress = progress;
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "enrollment progress changed successfully",
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
  newEnrollment,
  cancelEnrollment,
  activeEnrollment,
  deleteEnrollment,
  studentEnrollments,
  specificEnrollment,
  specificEnrollmentProtected,
  allEnrollments,
  courseEnrollments,
  enrollStudent,
  enrollmentStatus,
  paymentStatus,
  enrollmentProgress,
};
