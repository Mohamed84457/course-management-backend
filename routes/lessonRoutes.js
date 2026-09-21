import express from "express";
// moddlewares
import auth from "../middlewares/auth.js";
import protectedRoute from "../middlewares/protected.js";
// validations
import { validationMiddleware } from "../middlewares/validation.js";
import lessonSchema from "../validations/lesson.Schema.js";
// controllers
import {
  newLesson,
  updateLesson,
  deleteLesson,
  courseLessons,
  publishedCourseLessons,
  getLesson,
} from "../controllers/lessonController.js";

const lessonRoute = express.Router();

// create lesson
lessonRoute.post(
  "/",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  validationMiddleware(lessonSchema),
  newLesson,
);
// update lesson
lessonRoute.patch(
  "/:lessonId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  updateLesson,
);
// delete lesson
lessonRoute.delete(
  "/:lessonId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  deleteLesson,
);
// course lessons
lessonRoute.get(
  "/course/:courseId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  courseLessons,
);

//public
// published course lessons
lessonRoute.get("/course/:courseId/published", auth, publishedCourseLessons);
// get lesson

lessonRoute.get("/:lessonId", auth, getLesson);

export default lessonRoute;
