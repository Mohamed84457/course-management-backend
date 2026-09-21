import express from "express";
// middlewares
import auth from "../middlewares/auth.js";
import { validationMiddleware } from "../middlewares/validation.js";
import protectedRoute from "../middlewares/protected.js";
// validation
import assignmentSchema from "../validations/assignment.schema.js";
const assignmentRoute = express.Router();
// controllers
import {
  newAssignment,
  deleteAssignment,
  updateAssignment,
  getLessonAssignments,
  getAssignment
} from "../controllers/assignmentController.js";
// create new assignment
assignmentRoute.post(
  "/",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  validationMiddleware(assignmentSchema),
  newAssignment,
);
// delete assignment
assignmentRoute.delete(
  "/:assignmentId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  deleteAssignment,
);
// update assignment
assignmentRoute.patch(
  "/:assignmentId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  updateAssignment,
);
// get lesson assignments
assignmentRoute.get("/lesson/:lessonId", auth, getLessonAssignments);
// get assignment
assignmentRoute.get("/:assignmentId", auth, getAssignment);

export default assignmentRoute;

