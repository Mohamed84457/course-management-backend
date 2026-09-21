import express from "express";
// controllers
import {
  hireNewTeacher,
  promoteToTeacher,
  deleteTeacher,
  getAllTeachers,
  getSpecifiedTeacher,
  protectedUpdateTeacher,
  updateTeacher,
} from "../controllers/teacherController.js";
// middleware
import auth from "../middlewares/auth.js";
import protectedRoute from "../middlewares/protected.js";
import { validationMiddleware } from "../middlewares/validation.js";
// schema
import newteacherSchema from "../validations/newTeacher.schema.js";
import { promotionToTeacher } from "../validations/promoteToTeacher.schema.js";
import { updateTeacherSchema } from "../validations/updateTeacher.schema.js";
const teacherRouter = express.Router();

// protected routes
// add new teacher
teacherRouter.post(
  "/",
  auth,
  protectedRoute,
  validationMiddleware(newteacherSchema),
  hireNewTeacher,
);
// promote to teacher
teacherRouter.post(
  "/promote/:userId",
  auth,
  protectedRoute,
  validationMiddleware(promotionToTeacher),
  promoteToTeacher,
);

//delete teacher
teacherRouter.delete("/:userId", auth,protectedRoute, deleteTeacher);
// get all teacher
teacherRouter.get("/", auth, protectedRoute, getAllTeachers);
teacherRouter.patch(
  "/update/protected/:teacherId",
  auth,
  protectedRoute,
  validationMiddleware(updateTeacherSchema),
  protectedUpdateTeacher,
);

// public routes
// get specified teacher
teacherRouter.get("/:teacherId", auth, getSpecifiedTeacher);
teacherRouter.patch(
  "/update/:teacherId",
  auth,
  validationMiddleware(updateTeacherSchema),
  updateTeacher,
);
export default teacherRouter;
