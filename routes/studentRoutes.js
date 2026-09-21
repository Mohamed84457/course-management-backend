import express from "express";
const studentRouter = express.Router();
// middlewares
import { validationMiddleware } from "../middlewares/validation.js";
import auth from "../middlewares/auth.js";
import protectedRoute from "../middlewares/protected.js";
// controllers
import {
  makeStudent,
  getSpecificStudent,
  updateStudent,
  deleteStudent,
  getAllStudents,
} from "../controllers/studentController.js";
// schemas
import userSchema from "../validations/user.schema.js";

// get all students
studentRouter.get("/", auth, protectedRoute, getAllStudents);

// make student
studentRouter.post(
  "/",
  auth,
  protectedRoute,
  validationMiddleware(userSchema),
  makeStudent,
);
// get student
studentRouter.get("/:studentId", auth, getSpecificStudent);

// update student
studentRouter.patch("/:userId/edit", auth, updateStudent);
// delete student
studentRouter.delete("/:userId", auth, protectedRoute, deleteStudent);

export default studentRouter;
