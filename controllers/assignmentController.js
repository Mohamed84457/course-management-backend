//models
import assignmentModel from "../models/Assignment.model.js";
import assignmentSubmissionModel from "../models/AssignmentSubmission.model.js";
import Teacher from "../models/Teacher.model.js";
import { Student } from "../models/Student.model.js";
import { courseModel } from "../models/Course.model.js";
import lessonModel from "../models/Lesson.model.js";
import enrollmentModel from "../models/enrollment.model.js";
// utils
import { notifyEnrolledStudents } from "../utils/createNotification.js";

// create new assignment
const newAssignment = async (req, res) => {
  try {
    const { lessonId, title, dueDate } = req.body;

    const { _id, role, organizationId } = req.user;

    const lesson = await lessonModel.findOne({
      _id: lessonId,
      organizationId,
    });
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "lesson not found",
      });
    }

    const course = await courseModel.findOne({
      _id: lesson.courseId,
      organizationId,
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not exist yet",
      });
    }

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");

    if (!isStaff && isTeacher) {
      const teacher = await Teacher.findOne({
        userId: _id,
      });
      if (!teacher) {
        return res.status(401).json({
          success: false,
          message: "not authorize",
        });
      }

      if (teacher._id.toString() !== course.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can only add assignments to lessons of own course",
        });
      }
    }
    const duplicatedAssignment = await assignmentModel.findOne({
      organizationId,
      lessonId,
      courseId: lesson.courseId,
      teacherId: course.teacherId,
      title,
    });
    if (duplicatedAssignment) {
      return res.status(400).json({
        success: false,
        message: "duplicated assignment",
      });
    }

    const dueDateObj = new Date(dueDate);

    if (isNaN(dueDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid dueDate",
      });
    }

    if (dueDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "dueDate must be in the future",
      });
    }

    const assignmentData = {
      ...req.body,
      organizationId,
      courseId: lesson.courseId,
      teacherId: course.teacherId,
    };
    const assignment = await assignmentModel.create(assignmentData);

    notifyEnrolledStudents({
      organizationId,
      courseId: lesson.courseId,
      type: "new_assignment",
      message: `New assignment created in "${course.title}": "${title.trim()}"`,
      link: `/assignments/${assignment._id}`,
      data: { courseId: lesson.courseId, lessonId, assignmentId: assignment._id },
    });

    return res.status(201).json({
      success: true,
      message: "assignment created successfully",
      assignment,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { _id, role, organizationId } = req.user;

    const assignment = await assignmentModel.findOne({
      _id: assignmentId,
      organizationId,
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "assignment not found",
      });
    }

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");

    if (!isStaff && isTeacher) {
      const teacher = await Teacher.findOne({
        userId: _id,
      });
      if (!teacher) {
        return res.status(401).json({
          success: false,
          message: "not authorize",
        });
      }
      if (teacher._id.toString() !== assignment.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can only delete assignments from your own lessons",
        });
      }
    }

    await assignmentModel.findByIdAndDelete(assignmentId);
    await assignmentSubmissionModel.deleteMany({ assignmentId });

    return res.status(200).json({
      success: true,
      message: "assignment deleted successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// update assignment
const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const { _id, role, organizationId } = req.user;

    const assignment = await assignmentModel.findOne({
      _id: assignmentId,
      organizationId,
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "assignment not found",
      });
    }

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");

    if (!isStaff && isTeacher) {
      const teacher = await Teacher.findOne({
        userId: _id,
      });
      if (!teacher) {
        return res.status(401).json({
          success: false,
          message: "not authorize",
        });
      }
      if (teacher._id.toString() !== assignment.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can only update assignments of your lessons",
        });
      }
    }

    const ALLOWEDFILEDS = [
      "title",
      "description",
      "attachmentUrl",
      "totalPoints",
      "dueDate",
      "status",
    ];

    const newAssignmentData = {};
    for (const key of ALLOWEDFILEDS) {
      if (req.body?.[key] !== undefined) {
        newAssignmentData[key] = req.body[key];
      }
    }

    if (Object.keys(newAssignmentData).length < 1) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    if (newAssignmentData.title) {
      const duplicatedAssignment = await assignmentModel.findOne({
        teacherId: assignment.teacherId,
        organizationId,
        lessonId: assignment.lessonId,
        title: newAssignmentData.title,
        _id: { $ne: assignmentId },
      });
      if (duplicatedAssignment) {
        return res.status(400).json({
          success: false,
          message: "duplicated assignment title",
        });
      }
    }

    if (newAssignmentData.dueDate) {
      const dueDateObj = new Date(newAssignmentData.dueDate);

      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid dueDate",
        });
      }

      if (dueDateObj <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "dueDate must be in the future",
        });
      }
    }

    if (newAssignmentData.status) {
      const ALLOWEDSTATUS = ["draft", "published", "closed"];
      const isValidStatus = ALLOWEDSTATUS.includes(newAssignmentData.status);
      if (!isValidStatus) {
        return res.status(400).json({
          success: false,
          message: "status must be one of [draft, published, closed]",
        });
      }
    }

    const response = await assignmentModel.findByIdAndUpdate(
      assignmentId,
      newAssignmentData,
      {
        new: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "assignment updated successfully",
      assignment: response,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get all lesson assignments
const getLessonAssignments = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { _id, role, organizationId } = req.user;

    let filter = { organizationId };

    const lesson = await lessonModel.findOne({
      _id: lessonId,
      organizationId,
    });
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "lesson not found",
      });
    }
    filter.lessonId = lessonId;

    const course = await courseModel.findOne({
      _id: lesson.courseId,
      organizationId,
    });
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "course no longer exist",
      });
    }

    filter.courseId = course._id;

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");
    const isStudent = role.includes("student");

    if (!isStaff && isTeacher) {
      const teacher = await Teacher.findOne({
        userId: _id,
      });
      if (!teacher) {
        return res.status(401).json({
          success: false,
          message: "not authorize",
        });
      }
      if (teacher._id.toString() !== course.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can only get assignments from lessons of own course",
        });
      }
    } else if (!isStaff && !isTeacher && isStudent) {
      const student = await Student.findOne({
        userId: _id,
      });
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "not authorize",
        });
      }

      const isEnrollCourse = await enrollmentModel.findOne({
        studentId: student._id,
        organizationId,
        courseId: lesson.courseId,
        status: { $nin: ["dropped", "cancelled"] },
      });

      if (!isEnrollCourse) {
        return res.status(403).json({
          success: false,
          message: "access forbidden",
        });
      }
      filter.status = { $in: ["published", "closed"] };
    } else if (!isStaff && !isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: "access forbidden",
      });
    }

    const assignments = await assignmentModel.find(filter);

    return res.status(200).json({
      success: true,
      message: "assignments fetched successfully",
      assignments,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get assignment
const getAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { _id, role, organizationId } = req.user;

    const assignment = await assignmentModel.findOne({
      _id: assignmentId,
      organizationId,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "assignment not found",
      });
    }

    const lesson = await lessonModel.findOne({
      _id: assignment.lessonId,
      organizationId,
    });
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "lesson not found",
      });
    }

    const course = await courseModel.findOne({
      _id: lesson.courseId,
      organizationId,
    });
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "course no longer exist",
      });
    }

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");
    const isStudent = role.includes("student");

    if (isStaff) {
      return res.status(200).json({
        success: true,
        message: "assignment fetched successfully",
        assignment,
      });
    }

    if (isTeacher) {
      const teacher = await Teacher.findOne({
        userId: _id,
      });
      if (teacher && teacher._id.toString() === course.teacherId.toString()) {
        return res.status(200).json({
          success: true,
          message: "assignment fetched successfully",
          assignment,
        });
      }
    }

    if (isStudent) {
      const student = await Student.findOne({
        userId: _id,
      });
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "not authorize",
        });
      }

      const isEnrollCourse = await enrollmentModel.findOne({
        studentId: student._id,
        courseId: course._id,
        organizationId,
        status: { $nin: ["dropped", "cancelled"] },
      });
      if (!isEnrollCourse) {
        return res.status(403).json({
          success: false,
          message: "access forbidden",
        });
      }
      if (assignment.status === "draft") {
        return res.status(404).json({
          success: false,
          message: "assignment not found",
        });
      }

      const isSubmitAssignment = await assignmentSubmissionModel.findOne({
        studentId: student._id,
        organizationId,
        assignmentId,
      });

      return res.status(200).json({
        success: true,
        message: "assignment fetched successfully",
        assignment,
        isSubmit: !!isSubmitAssignment,
        submission: isSubmitAssignment || null,
      });
    }

    return res.status(403).json({
      success: false,
      message: "access forbidden",
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
  newAssignment,
  deleteAssignment,
  updateAssignment,
  getLessonAssignments,
  getAssignment,
};
