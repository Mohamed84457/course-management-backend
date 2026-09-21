// models
import { courseModel } from "../models/Course.model.js";
import { categoryModel } from "../models/Category.model.js";
import teacherModel from "../models/Teacher.model.js";
import enrollmentModel from "../models/enrollment.model.js";
import lessonModel from "../models/Lesson.model.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// create new course
const newCourse = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { categoryId, teacherId } = req.body;

    const newcourse = { ...req.body, organizationId };

    const category = await categoryModel.findOne({
      _id: categoryId,
      organizationId,
    });

    const teacher = await teacherModel
      .findOne({
        _id: teacherId,
      })
      .populate("userId");

    const teacherExist =
      teacher?.userId?.organizationId?.toString() === organizationId.toString();

    if (!category || !teacherExist) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      if (req.file) {
        const imagePath = path.join(
          __dirname,
          "../public/uploads",
          req.file.filename,
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "teacher not found",
        });
      }
    }

    if (req.file) {
      newcourse.thumbnail = `/uploads/${req.file.filename}`;
    }

    const course = await courseModel.create(newcourse);

    return res.status(201).json({
      success: true,
      message: "course created successfully",
      course: course,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// update course
const updateCource = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const { courseId } = req.params;

    const oldcourse = await courseModel.findOne({
      _id: courseId,
      organizationId,
    });
    if (!oldcourse) {
      return res.status(404).json({
        success: false,
        message: "course not found",
      });
    }

    const ALLOW_FIELDS = [
      "categoryId",
      "teacherId",
      "title",
      "description",
      "price",
      "educationLevel",
      "durationHours",
      "lessonsCount",
      "capacity",
      "isFeatured",
      "status",
    ];

    const newCourceData = {};

    for (const key of ALLOW_FIELDS) {
      if (req.body?.[key] !== undefined) {
        newCourceData[key] = req.body?.[key];
      }
    }

    if (Object.keys(newCourceData).length < 1 && !req.file) {
      return res.status(400).json({
        success: false,
        message: "there is not thing to update",
      });
    }

    if (newCourceData?.categoryId !== undefined) {
      const category = await categoryModel.findOne({
        _id: newCourceData.categoryId,
        organizationId,
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "category nit found",
        });
      }
    }

    if (newCourceData?.teacherId !== undefined) {
      const teacher = await teacherModel
        .findOne({
          _id: newCourceData?.teacherId,
        })
        .populate("userId");

      if (!teacher || teacher?.userId?.organizationId !== organizationId) {
        return res.status(404).json({
          success: false,
          message: "teacher not found ",
        });
      }
    }

    if (req.file) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      if (oldcourse?.thumbnail) {
        const oldImagePath = path.join(
          __dirname,
          "../public",
          oldcourse?.thumbnail,
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      newCourceData.thumbnail = `/uploads/${req.file.filename}`;
    }
    const response = await courseModel.updateOne(
      {
        _id: courseId,
        organizationId,
      },
      {
        $set: newCourceData,
      },
    );

    return res.status(200).json({
      success: true,
      message: "course updated successfully",
      course: newCourceData,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// delete course
const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await courseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found",
      });
    }

    if (course.thumbnail) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const imagePath = path.join(__dirname, "../public", course.thumbnail);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await courseModel.deleteOne({ _id: courseId });
    await enrollmentModel.deleteMany({ courseId });
    await lessonModel.deleteMany({ courseId });
    return res.status(200).json({
      success: true,
      message: "course deleted successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get all  courses
const allCourses = async (req, res) => {
  try {
    const { categoryId, teacherId, page = 1, limit = 10 } = req.query;

    const organizationId =
      req?.query?.organizationId || req?.user?.organizationId;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    let filter = {};

    if (organizationId) {
      filter.organizationId = organizationId;
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (teacherId) {
      filter.teacherId = teacherId;
    }

    const totalCourses = await courseModel.countDocuments(filter);

    let enrollmentFilter = {
      status: { $in: ["active", "completed", "pending"] },
    };

    if (organizationId) {
      enrollmentFilter.organizationId = organizationId;
    }

    if (categoryId || teacherId) {
      const matchingCourseDocs = await courseModel.find(filter).select("_id");
      enrollmentFilter.courseId = { $in: matchingCourseDocs.map((c) => c._id) };
    }

    const [totalEnrollments, uniqueStudents] = await Promise.all([
      enrollmentModel.countDocuments(enrollmentFilter),
      enrollmentModel.distinct("studentId", enrollmentFilter),
    ]);

    const totalEnrolledStudents = uniqueStudents.length;

    const courses = await courseModel
      .find(filter)
      .populate("categoryId")
      .populate({
        path: "teacherId",
        select: "employeeCode specialization qualification experience",
        populate: {
          path: "userId",
          select:
            "name email role organizationId isactive gender phone profileImage",
        },
      })
      .skip(skip)
      .limit(limitNum)
      .select("title price thumbnail  durationHours discountPrice level");

    const courseIds = courses.map((c) => c._id);
    const enrollmentCounts = await enrollmentModel.aggregate([
      {
        $match: {
          courseId: { $in: courseIds },
          status: { $in: ["active", "completed", "pending"] },
        },
      },
      {
        $group: {
          _id: "$courseId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    enrollmentCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const coursesWithCount = courses.map((c) => {
      const cObj = c.toObject();
      cObj.enrolledStudentsCount = countMap[c._id.toString()] || 0;
      return cObj;
    });

    return res.status(200).json({
      success: true,
      message: "courses fetched successfully",
      count: coursesWithCount.length,
      totalCourses,
      totalEnrolledStudents,
      totalEnrollments,
      totalPages: Math.ceil(totalCourses / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      courses: coursesWithCount,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get specific course
const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await courseModel
      .findOne({ _id: courseId })
      .populate("organizationId")
      .populate("categoryId")
      .populate({
        path: "teacherId",
        select: "employeeCode specialization qualification experience",
        populate: {
          path: "userId",
          select:
            "name email role organizationId isactive gender phone profileImage",
        },
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found",
      });
    }

    const enrolledStudentsCount = await enrollmentModel.countDocuments({
      courseId: course._id,
      status: { $in: ["active", "completed", "pending"] },
    });

    const courseObj = course.toObject();
    courseObj.enrolledStudentsCount = enrolledStudentsCount;

    return res.status(200).json({
      success: true,
      message: "course fetched successfully",
      course: courseObj,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
export { newCourse, updateCource, deleteCourse, allCourses, getCourse };
