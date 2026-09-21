// models
import lessonModel from "../models/Lesson.model.js";
import Teacher from "../models/Teacher.model.js";
import { courseModel } from "../models/Course.model.js";
import enrollmentModel from "../models/enrollment.model.js";
import { Student } from "../models/Student.model.js";
import assignmentModel from "../models/Assignment.model.js";
import assignmentSubmissionModel from "../models/AssignmentSubmission.model.js";
import quizModel from "../models/Quiz.model.js";
import quizSubmissionModel from "../models/QuizSubmission.model.js";
// utils
import { notifyEnrolledStudents } from "../utils/createNotification.js";

// create lesson
const newLesson = async (req, res) => {
  try {
    const { _id, role, organizationId } = req.user;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "enter first to organization",
      });
    }

    const { courseId, title, description, materialUrl, isPublished } = req.body;

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
      if (course.teacherId.toString() !== teacher._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can only add lessons to your own courses",
        });
      }
    }

    // duplicate checking
    const lessonCheck = await lessonModel.findOne({
      courseId,
      title: title.trim(),
      organizationId,
    });
    if (lessonCheck) {
      return res.status(400).json({
        success: false,
        message: "lesson already exist",
      });
    }

    const lastLesson = await lessonModel
      .findOne({
        courseId,
        organizationId,
      })
      .sort({ orderIndex: -1 });

    const orderIndex = lastLesson ? lastLesson.orderIndex + 1 : 1;

    const response = await lessonModel.create({
      organizationId,
      courseId,
      title: title.trim(),
      description,
      materialUrl,
      orderIndex,
      isPublished,
    });
    if (response) {
      const newCount = (course.lessonsCount || 0) + 1;
      course.lessonsCount = newCount;
      await course.save();

      notifyEnrolledStudents({
        organizationId,
        courseId,
        type: "new_lesson",
        message: `New lesson created in "${course.title}": "${title.trim()}"`,
        link: `/courses/${courseId}/lessons/${response._id}`,
        data: { courseId, lessonId: response._id },
      });
    }

    return res.status(201).json({
      success: true,
      message: "lesson create successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// update lesson
const updateLesson = async (req, res) => {
  try {
    const { _id, role, organizationId } = req.user;
    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "enter first to organization",
      });
    }
    const { lessonId } = req.params;

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
        message: "course not found",
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
          message: "you can only update lessons from your own courses",
        });
      }
    }

    const newLessonData = {};
    const ALLOW_FIELDS = [
      "title",
      "description",
      "materialUrl",
      "isPublished",
      "orderIndex",
    ];

    if (req.body?.orderIndex) {
      if (req.body?.orderIndex != lesson.orderIndex) {
        const existLessonOrder = await lessonModel.findOne({
          courseId: lesson.courseId,
          orderIndex: req.body?.orderIndex,
          organizationId,
        });
        if (existLessonOrder) {
          return res.status(400).json({
            success: false,
            message: "this order already taken",
          });
        }
      }
    }

    for (const key of ALLOW_FIELDS) {
      if (req.body?.[key] !== undefined) {
        newLessonData[key] = req.body?.[key];
      }
    }
    if (Object.keys(newLessonData).length < 1) {
      return res.status(400).json({
        success: false,
        message: "there is no thing to update ",
      });
    }

    if (newLessonData?.title) {
      const duplicatedLesson = await lessonModel.findOne({
        title: newLessonData.title,
        courseId: lesson.courseId,
        organizationId,
        _id: { $ne: lessonId },
      });
      if (duplicatedLesson) {
        return res.status(400).json({
          success: false,
          message: "duplicated lesson title",
        });
      }
      newLessonData.title = newLessonData.title.trim();
    }

    const response = await lessonModel.findOneAndUpdate(
      { _id: lessonId, organizationId },
      { $set: newLessonData },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "lesson updated successfully",
      lesson: response,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// delete lesson
const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
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
        message: "course not exist",
      });
    }

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");

    // Teacher authorization
    if (!isStaff && isTeacher) {
      const teacher = await Teacher.findOne({
        userId: _id,
      });

      if (!teacher) {
        return res.status(403).json({
          success: false,
          message: "not authorized",
        });
      }

      if (teacher._id.toString() !== course.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can only delete lessons from your own courses",
        });
      }
    }

    // =========================
    // Delete Assignments
    // =========================

    const assignments = await assignmentModel.find({
      lessonId,
      organizationId,
    });

    const assignmentIds = assignments.map((assignment) => assignment._id);

    if (assignmentIds.length > 0) {
      await assignmentSubmissionModel.deleteMany({
        assignmentId: { $in: assignmentIds },
        organizationId,
      });
    }

    await assignmentModel.deleteMany({
      lessonId,
      organizationId,
    });

    // =========================
    // Delete Quizzes
    // =========================

    const quizzes = await quizModel.find({
      lessonId,
      organizationId,
    });

    const quizIds = quizzes.map((quiz) => quiz._id);

    if (quizIds.length > 0) {
      await quizSubmissionModel.deleteMany({
        quizId: { $in: quizIds },
        organizationId,
      });
    }

    await quizModel.deleteMany({
      lessonId,
      organizationId,
    });

    // =========================
    // Delete Lesson
    // =========================

    await lessonModel.deleteOne({
      _id: lessonId,
      organizationId,
    });

    // =========================
    // Update Course
    // =========================

    course.lessonsCount = Math.max((course.lessonsCount || 0) - 1, 0);

    await course.save();

    return res.status(200).json({
      success: true,
      message: "lesson deleted successfully",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get all  course lessons
const courseLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { _id, role, organizationId } = req.user;
    const {
      page = 1,
      limit = 10,
      title,
      description,
      lessonNumber,
    } = req.query;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "sign organization first",
      });
    }

    const filter = { organizationId, courseId };

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
          message: "you can only show lessons from your own courses",
        });
      }
    }

    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    if (description) {
      filter.description = { $regex: description, $options: "i" };
    }
    if (lessonNumber) {
      const lessonNum = Number(lessonNumber);
      if (!Number.isInteger(lessonNum) || lessonNum < 1) {
        return res.status(400).json({
          success: false,
          message: "lessonNumber must be a positive integer",
        });
      }
      filter.orderIndex = lessonNum;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalLessons = await lessonModel.countDocuments(filter);

    const lessons = await lessonModel
      .find(filter)
      .sort({ orderIndex: 1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "lessons course fetched successfully",
      count: lessons.length,
      totalLessons,
      totalPages: Math.ceil(totalLessons / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      lessons,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// public
// get all published lessons of course
const publishedCourseLessons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      title,
      description,
      lessonNumber,
    } = req.query;

    const { courseId } = req.params;

    const { _id, role, organizationId } = req.user;
    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "sign organization first",
      });
    }

    const filter = { organizationId, courseId, isPublished: true };

    const course = await courseModel.findOne({
      _id: courseId,
      organizationId,
      status: "published",
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found ",
      });
    }
    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");
    const isStudent = role.includes("student");

    if (!isStaff && !isTeacher && isStudent) {
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
        courseId,
        organizationId,
        status: { $in: ["active", "completed"] },
      });
      if (!isEnrollCourse) {
        return res.status(403).json({
          success: false,
          message: "access forbidden",
        });
      }
    }
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
          message: "you can only show your lessons of own course ",
        });
      }
    }
    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    if (description) {
      filter.description = { $regex: description, $options: "i" };
    }
    if (lessonNumber) {
      const lessonNum = Number(lessonNumber);
      if (!Number.isInteger(lessonNum) || lessonNum < 1) {
        return res.status(400).json({
          success: false,
          message: "lessonNumber must be a positive integer",
        });
      }
      filter.orderIndex = lessonNum;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalLessons = await lessonModel.countDocuments(filter);

    const lessons = await lessonModel
      .find(filter)
      .sort({ orderIndex: 1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "lessons course fetched successfully",
      count: lessons.length,
      totalLessons,
      totalPages: Math.ceil(totalLessons / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      lessons,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get specific lesson
const getLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { _id, role, organizationId } = req.user;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "user is not associated with an organization",
      });
    }

    const STAFF = ["owner", "admin", "manager"];
    const isStaff = STAFF.some((s) => role.includes(s));
    const isTeacher = role.includes("teacher");
    const isStudent = role.includes("student");

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
        message: "lesson no longer exist ",
      });
    }

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
          message: "you can only access lessons from your own courses",
        });
      }
    }
    if (!isStaff && !isTeacher && isStudent) {
      if (!lesson.isPublished || course.status !== "published") {
        return res.status(403).json({
          success: false,
          message: "access forbidden",
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
        courseId: course._id,
        organizationId,
        status: { $in: ["active", "completed"] },
      });
      if (!isEnrollCourse) {
        return res.status(403).json({
          success: false,
          message: "access forbidden",
        });
      }
    }

    if (!isStaff && !isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: "access forbidden",
      });
    }

    return res.status(200).json({
      success: true,
      message: "lesson fetched successfully",
      lesson,
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
  newLesson,
  updateLesson,
  deleteLesson,
  publishedCourseLessons,
  courseLessons,
  getLesson,
};
