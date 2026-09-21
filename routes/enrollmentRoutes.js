import express from "express";
// middleware
import auth from "../middlewares/auth.js";
import protectedRoute from "../middlewares/protected.js";
// controllers
import {
  newEnrollment,
  cancelEnrollment,
  deleteEnrollment,
  activeEnrollment,
  studentEnrollments,
  specificEnrollmentProtected,
  allEnrollments,
  courseEnrollments,
  enrollStudent,
  enrollmentStatus,
  paymentStatus,
  enrollmentProgress,
} from "../controllers/enrollmentController.js";

const enrollmentRoute = express.Router();

// student Routes
// create new enrollment
enrollmentRoute.post("/", auth, newEnrollment);
// cancel enrollment
enrollmentRoute.patch("/:enrollmentId/cancel", auth, cancelEnrollment);
enrollmentRoute.patch("/:enrollmentId/active", auth, activeEnrollment);
// get student Enrollments
enrollmentRoute.get("/my-enrollments", auth, studentEnrollments);

// general routes
// get specific enrollment
enrollmentRoute.get("/:enrollmentId/get", auth, specificEnrollmentProtected);

/*
protected
*/

// delete enrollment
enrollmentRoute.delete(
  "/:enrollmentId",
  auth,
  protectedRoute,
  deleteEnrollment,
);
// all enrollments
enrollmentRoute.get(
  "/all-enrollments",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  allEnrollments,
);
//  Get student roster for a specific course
enrollmentRoute.get(
  "/course/:courseId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  courseEnrollments,
);
// enrolling students
enrollmentRoute.post("/admin", auth, protectedRoute, enrollStudent);
// change enrollment status
enrollmentRoute.patch(
  "/:enrollmentId/status",
  auth,
  protectedRoute,
  enrollmentStatus,
);
// chnage enrollment payment status
enrollmentRoute.patch(
  "/:enrollmentId/payment-status",
  auth,
  protectedRoute,
  paymentStatus,
);
// enrollment progress
enrollmentRoute.patch(
  "/:enrollmentId/progress",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  enrollmentProgress,
);

export default enrollmentRoute;
