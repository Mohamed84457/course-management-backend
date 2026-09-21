import express from "express";
// middlewares
import auth from "../middlewares/auth.js";
import protectedRoute from "../middlewares/protected.js";
import { validationMiddleware } from "../middlewares/validation.js";
// validations
import quizSubmissionSchema from "../validations/quizSubmission.schema.js";
// controllers
import {
  submitQuiz,
  getQuizSubmissions,
  getQuizSubmission,
  updateSubmission,
  degreeAnswer,
  deleteSubmission,
} from "../controllers/quizSubmissionController.js";

const quizSubmissionsRouter = express.Router();

// submit quiz
quizSubmissionsRouter.post(
  "/:quizId",
  auth,
  validationMiddleware(quizSubmissionSchema),
  submitQuiz,
);
// protected
// get quiz's submissions
quizSubmissionsRouter.get(
  "/quiz/:quizId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  getQuizSubmissions,
);
// get submission
quizSubmissionsRouter.get(
  "/:submissionId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  getQuizSubmission,
);

// update submission
quizSubmissionsRouter.patch(
  "/:submissionId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  updateSubmission,
);

// degree answer
quizSubmissionsRouter.patch(
  "/answer/:submissionId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  degreeAnswer,
);

// delete submission
quizSubmissionsRouter.delete(
  "/:submissionId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  deleteSubmission,
);
export default quizSubmissionsRouter;
