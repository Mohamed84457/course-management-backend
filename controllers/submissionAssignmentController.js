import mongoose from "mongoose";
// models
import assignmentSubmissionModel from "../models/AssignmentSubmission.model.js";
import assignmentModel from "../models/Assignment.model.js";
import enrollmentModel from "../models/enrollment.model.js";
import { Student } from "../models/Student.model.js";
import Teacher from "../models/Teacher.model.js";
// utils
import { createNotification } from "../utils/createNotification.js";

// submission of assignment
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { _id, role, organizationId } = req.user;
    const assignment = await assignmentModel.findOne({
      _id: assignmentId,
      organizationId,
      status: "published",
      dueDate: { $gte: new Date() },
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "assignment not found",
      });
    }
    if (!role.includes("student")) {
      return res.status(401).json({
        success: false,
        message: "not authorize to submit assignment",
      });
    }
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
      courseId: assignment.courseId,
      organizationId,
      status: { $nin: ["dropped", "cancelled"] },
    });
    if (!isEnrollCourse) {
      return res.status(403).json({
        success: false,
        message: "you can submit assignments in your courses only",
      });
    }
    const isSubmitAssignment = await assignmentSubmissionModel.findOne({
      assignmentId,
      studentId: student._id,
      organizationId,
    });
    if (isSubmitAssignment) {
      return res.status(400).json({
        success: false,
        message: "you already submitted this assignment",
      });
    }
    const submissionData = {
      ...req.body,
      assignmentId,
      organizationId,
      studentId: student._id,
      courseId: assignment.courseId,
    };
    const response = await assignmentSubmissionModel.create(submissionData);

    const teacher = await Teacher.findById(assignment.teacherId);
    if (teacher && teacher.userId) {
      createNotification({
        organizationId,
        userId: teacher.userId,
        type: "assignment_submission",
        message: `A student submitted an assignment for "${assignment.title}"`,
        link: `/teacher/submissions/assignment/${response._id}`,
        data: {
          courseId: assignment.courseId,
          assignmentId,
          submissionId: response._id,
          studentId: student._id,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "submit assignment successfully",
      submission: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get all submissions for one assignment (teacher/staff)
const getSubmissionsAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { _id, role, organizationId } = req.user;
    const { page = 1, limit = 10, grade, search, submittedAt } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;
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
          message: "you can only access your own assignments",
        });
      }
    } else if (!isStaff && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: "access forbidden",
      });
    }
    const match = {
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    };
    if (grade !== undefined && !isNaN(Number(grade))) {
      match.grade = { $gte: Number(grade) };
    }
    // Submitted date filter
    if (submittedAt) {
      const start = new Date(submittedAt);
      const end = new Date(submittedAt);
      end.setDate(end.getDate() + 1);
      match.submittedAt = {
        $gte: start,
        $lt: end,
      };
    }
    const pipeline = [
      {
        $match: match,
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $lookup: {
          from: "users",
          localField: "student.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ];
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            {
              "user.name": {
                $regex: search,
                $options: "i",
              },
            },
          ],
        },
      });
    }
    pipeline.push(
      {
        $sort: {
          submittedAt: -1,
        },
      },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                grade: 1,
                bonusPoints: 1,
                feedback: 1,
                submittedAt: 1,
                fileUrl: 1,
                submissionNotes: 1,
                status: 1,
                student: {
                  _id: "$student._id",
                  name: "$user.name",
                  email: "$user.email",
                  studentCode: "$student.studentCode",
                  phone: "$user.phone",
                },
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    );
    const result = await assignmentSubmissionModel.aggregate(pipeline);
    const submissions = result[0]?.data || [];
    const totalSubmissions = result[0]?.total[0]?.count || 0;
    return res.status(200).json({
      success: true,
      message: "assignment submissions fetched successfully",
      count: submissions.length,
      totalSubmissions,
      totalPages: Math.ceil(totalSubmissions / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      submissions,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get submission by submissionId
const getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { _id, role, organizationId } = req.user;
    const submission = await assignmentSubmissionModel.findOne({
      _id: submissionId,
      organizationId,
    });
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "submission not found",
      });
    }
    const assignment = await assignmentModel.findOne({
      _id: submission.assignmentId,
      organizationId,
      courseId: submission.courseId,
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "assignment no longer exist",
      });
    }
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
      if (teacher._id.toString() !== assignment.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can only access submissions of your own assignments",
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
      if (student._id.toString() !== submission.studentId.toString()) {
        return res.status(403).json({
          success: false,
          message: "access forbidden",
        });
      }
    } else if (!isStaff && !isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: "access forbidden",
      });
    }
    const studentAssignmentSubmission = await assignmentSubmissionModel
      .findOne({
        _id: submissionId,
        organizationId,
      })
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email phone gender profileImage lastLogin",
        },
      })
      .populate({
        path: "assignmentId",
        populate: {
          path: "lessonId",
        },
      })
      .populate("courseId");
    return res.status(200).json({
      success: true,
      message: "assignment submission fetched successfully",
      submission: studentAssignmentSubmission,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// update submission (grade / feedback)
const updateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { _id, role, organizationId } = req.user;
    const submission = await assignmentSubmissionModel.findOne({
      _id: submissionId,
      organizationId,
    });
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "submission not found",
      });
    }
    const assignment = await assignmentModel.findOne({
      _id: submission.assignmentId,
      organizationId,
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "assignment no longer exist",
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
          message: "you can update submissions of your own assignments",
        });
      }
    } else if (!isStaff && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: "access forbidden",
      });
    }
    const newSubmissionData = {};
    const ALLOWEDFIELD = ["grade", "bonusPoints", "feedback", "status"];
    for (const key of ALLOWEDFIELD) {
      if (req.body?.[key] !== undefined) {
        newSubmissionData[key] = req.body[key];
      }
    }
    if (Object.keys(newSubmissionData).length < 1) {
      return res.status(400).json({
        success: false,
        message: "nothing to update",
      });
    }
    if (
      (submission.grade === null || submission.grade === undefined) &&
      newSubmissionData.grade !== undefined &&
      !newSubmissionData.status
    ) {
      newSubmissionData.status = "graded";
    }
    const response = await assignmentSubmissionModel.findOneAndUpdate(
      { _id: submissionId, organizationId },
      { $set: newSubmissionData },
      {
        new: true,
        runValidators: true,
      },
    );
    return res.status(200).json({
      success: true,
      message: "assignment submission updated successfully",
      submission: response,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// delete submission
const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { _id, role, organizationId } = req.user;
    const submission = await assignmentSubmissionModel.findOne({
      _id: submissionId,
      organizationId,
    });
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "submission not found",
      });
    }
    const assignment = await assignmentModel.findOne({
      _id: submission.assignmentId,
      organizationId,
    });
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
      if (
        !assignment ||
        teacher._id.toString() !== assignment.teacherId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "you can only delete submissions of your own assignments",
        });
      }
    } else if (!isStaff && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: "access forbidden",
      });
    }
    const response = await assignmentSubmissionModel.findOneAndDelete({
      _id: submissionId,
      organizationId,
    });
    if (response) {
      return res.status(200).json({
        success: true,
        message: "assignment submission deleted successfully",
      });
    }
    return res.status(404).json({
      success: false,
      message: "submission not found",
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
  submitAssignment,
  getSubmissionsAssignment,
  getSubmission,
  updateSubmission,
  deleteSubmission,
};
