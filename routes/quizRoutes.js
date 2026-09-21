import express from "express";
// middlewares
import auth from "../middlewares/auth.js";
import protectedRoute from "../middlewares/protected.js";
import { validationMiddleware } from "../middlewares/validation.js";
// validations
import quizSchema from "../validations/quizSchema.js";
import updateQuizSchema from "../validations/updateQuizSchema.js";
// controllers
import {
  newQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizzes,
  getQuiz,
} from "../controllers/quizController.js";
const quizRouter = express.Router();

// protected
// make quiz
quizRouter.post(
  "/",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  validationMiddleware(quizSchema),
  newQuiz,
);
// update quiz
quizRouter.patch(
  "/:quizId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  validationMiddleware(updateQuizSchema),
  updateQuiz,
);
// delete quiz
quizRouter.delete(
  "/:quizId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  deleteQuiz,
);
// public
// get quizzes of lesson
quizRouter.get("/lesson/:lessonId", auth, getQuizzes);
// get quiz
quizRouter.get("/:quizId", auth, getQuiz);

export default quizRouter;
