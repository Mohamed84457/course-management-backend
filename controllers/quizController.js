// models
import quizModel from "../models/Quiz.model.js";
import lessonModel from "../models/Lesson.model.js";
import { courseModel } from "../models/Course.model.js";
import Teacher from "../models/Teacher.model.js";
import { Student } from "../models/Student.model.js";
import quizSubmissionModel from "../models/QuizSubmission.model.js";
import enrollmentModel from "../models/enrollment.model.js";
// utils
import { sanitizeQuestions } from "../utils/sanitizeQuestions.js";
import { notifyEnrolledStudents } from "../utils/createNotification.js";

// new quiz
const newQuiz = async (req, res) => {
  try {
    const { lessonId } = req.body;
    const { _id, role, organizationId } = req.user;

    const quizData = { ...req.body, organizationId };

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
    quizData.courseId = course._id;

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
          message: "you can only make quiz in your own lessons",
        });
      }
      quizData.teacherId = teacher._id;
    }

    if (quizData.dueDate) {
      const dueDateObj = new Date(quizData.dueDate);
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
      quizData.dueDate = dueDateObj;
    }

    const quiz = await quizModel.create(quizData);

    notifyEnrolledStudents({
      organizationId,
      courseId: course._id,
      type: "new_quiz",
      message: `New quiz published in "${course.title}": "${quizData.title ? quizData.title.trim() : ""}"`,
      link: `/quizzes/${quiz._id}`,
      data: {
        courseId: course._id,
        lessonId: quizData.lessonId,
        quizId: quiz._id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "quiz create successfully",
      quiz,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// update quiz
const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { _id, role } = req.user;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "quiz not found ",
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
      if (teacher._id.toString() !== quiz.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can update quizzes in your own lessons",
        });
      }
    }

    if (req.body.title) {
      quiz.title = req.body.title;
    }
    if (req.body.description) {
      quiz.description = req.body.description;
    }
    if (req.body.durationMinutes) {
      quiz.durationMinutes = req.body.durationMinutes;
    }
    if (req.body.status) {
      quiz.status = req.body.status;
    }
    if (req.body.questions) {
      quiz.questions = req.body.questions;
    }
    if (req.body.passingMarks) {
      quiz.passingMarks = req.body.passingMarks;
    }
    if (req.body.dueDate) {
      const dueDateObj = new Date(req.body.dueDate);

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
      quiz.dueDate = dueDateObj;
    }

    await quiz.save();

    return res.status(200).json({
      success: true,
      message: "quiz updated successfully",
      quiz,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete quiz
const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { _id, role, organizationId } = req.user;

    const quiz = await quizModel.findOne({
      _id: quizId,
    });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "quiz not found",
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
        return res.status(403).json({
          success: false,
          message: "not authorized",
        });
      }

      if (teacher._id.toString() !== quiz.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can only delete your own quizzes",
        });
      }
    }

    await quizSubmissionModel.deleteMany({
      quizId,
      organizationId,
    });
    await quizModel.deleteOne({
      _id: quizId,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "quiz & his submissions deleted successfully ",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get all quizzes
const getQuizzes = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { _id, role, organizationId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 1, 10);
    const skip = (pageNum - 1) * limitNum;

    const lesson = await lessonModel.findOne({
      _id: lessonId,
    });
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "lesson no longer exist ",
      });
    }
    const course = await courseModel.findOne({
      _id: lesson.courseId,
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course no longer exist ",
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
        organizationId,
        courseId: course._id,
      });
      if (isEnrollCourse) {
        const query = {
          lessonId,
          organizationId,
          courseId: course._id,
          status: { $nin: "draft" },
        };

        const [totalQuizzes, quizzes] = await Promise.all([
          quizModel.countDocuments(query),
          quizModel
            .find(query)
            .select(
              "organizationId  courseId teacherId lessonId title description passingMarks durationMinutes status totalMarks dueDate ",
            )
            .skip(skip)
            .limit(limitNum),
        ]);

        // const totalQuizzes = await quizModel.countDocuments();

        // const quizzes = await quizModel
        //   .find()
        //   .select(
        //     )
        //   .skip(skip)
        //   .limit(limitNum);

        return res.status(200).json({
          success: true,
          message: "lesson's quizzes fetched succssfully",
          count: quizzes.length,
          totalQuizzes,
          totalPages: Math.ceil(totalQuizzes / limitNum),
          currentPage: pageNum,
          limit: limitNum,
          quizzes,
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
          message: "you can access quizzes in your lessons",
        });
      }
    }

    const query = {
      lessonId,
      organizationId,
      courseId: course._id,
    };

    const [totalQuizzes, quizzes] = await Promise.all([
      quizModel.countDocuments(query),
      quizModel
        .find(query)
        .select(
          "organizationId  courseId teacherId lessonId title description passingMarks durationMinutes status",
        )
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.status(200).json({
      success: true,
      message: "lesson's quizzes fetched successfully",
      count: quizzes.length,
      totalQuizzes,
      totalPages: Math.ceil(totalQuizzes / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      quizzes,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get quiz
const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { _id, role, organizationId } = req.user;

    const quiz = await quizModel
      .findOne({
        _id: quizId,
        organizationId,
      })
      .lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "quiz not found",
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
      if (quiz.status == "draft") {
        return res.status(404).json({
          success: false,
          message: "quiz not found",
        });
      }
      const isEnrollCourse = await enrollmentModel.findOne({
        studentId: student._id,
        organizationId,
        courseId: quiz.courseId,
        status: { $nin: ["cancelled", "dropped"] },
      });
      if (isEnrollCourse) {
        const sanQuestions = sanitizeQuestions(quiz.questions);
        const sanQuiz = { ...quiz, questions: sanQuestions };

        const isSubmitQuiz = await quizSubmissionModel
          .findOne({
            quizId,
            organizationId,
            studentId: student._id,
          })
          .select("score bonusPoints totalScore isPassed submittedAt");
        if (isSubmitQuiz) {
          return res.status(200).json({
            success: true,
            message: "quiz fetched successfully",
            quiz: sanQuiz,
            isSubmitQuiz: true,
            submit: isSubmitQuiz,
          });
        }
        return res.status(200).json({
          success: true,
          message: "quiz fetched successfully",
          quiz: sanQuiz,
          isSubmitQuiz: false,
        });
      }
      return res.status(403).json({
        success: false,
        message: "you are not enrolled in this course",
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
      if (teacher._id.toString() !== quiz.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          message: "you can access quizzes from own lessons",
        });
      }
    }
    return res.status(200).json({
      success: true,
      message: "quiz fetched successfully",
      quiz,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
export { newQuiz, updateQuiz, deleteQuiz, getQuizzes, getQuiz };
