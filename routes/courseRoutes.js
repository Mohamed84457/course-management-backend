import express from "express";
// middlewares
import auth from "../middlewares/auth.js";
import protectedRoute from "../middlewares/protected.js";
import { validationMiddleware } from "../middlewares/validation.js";
import { imageUpload } from "../middlewares/imageUpload.js";
// schema
import updateCourseSchema from "../validations/updateCourse.schema.js";
import courseSchema from "../validations/course.schema.js";
// controllers
import {
  newCourse,
  updateCource,
  deleteCourse,
  allCourses,
  getCourse,
} from "../controllers/courseController.js";

const courseRoute = express.Router();
// create course
courseRoute.post(
  "/",
  auth,
  protectedRoute,
  imageUpload.single("image"),
  validationMiddleware(courseSchema),
  newCourse,
);
// update course
courseRoute.patch(
  "/:courseId",
  auth,
  protectedRoute,
  imageUpload.single("image"),
  validationMiddleware(updateCourseSchema),
  updateCource,
);
// delete course
courseRoute.delete("/:courseId", auth, protectedRoute, deleteCourse);
// all courses with filtring
courseRoute.get("/", auth, allCourses);
// get specific course
courseRoute.get("/:courseId", auth, getCourse);
export default courseRoute;
