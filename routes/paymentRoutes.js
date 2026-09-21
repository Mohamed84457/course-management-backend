import express from "express";
// middlewares
import auth from "../middlewares/auth.js";
import protectedRoute from "../middlewares/protected.js";
import { validationMiddleware } from "../middlewares/validation.js";
// validations
import {
  createPaymentSchema,
  updatePaymentSchema,
} from "../validations/payment.schema.js";
// controllers
import {
  createPayment,
  getPayments,
  getPayment,
  updatePayment,
  deletePayment,
  getStudentPayments,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// Record manual payment
paymentRouter.post(
  "/",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  validationMiddleware(createPaymentSchema),
  createPayment,
);

// Get all payments (filtering, search & pagination)
paymentRouter.get(
  "/",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher"]),
  getPayments,
);

// Get payments for specific student
paymentRouter.get(
  "/student/:studentId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher", "student"]),
  getStudentPayments,
);

// Get single payment details
paymentRouter.get(
  "/:paymentId",
  auth,
  protectedRoute(["owner", "admin", "manager", "teacher", "student"]),
  getPayment,
);

// Update payment details
paymentRouter.patch(
  "/:paymentId",
  auth,
  protectedRoute(["owner", "admin", "manager"]),
  validationMiddleware(updatePaymentSchema),
  updatePayment,
);

// Delete payment
paymentRouter.delete(
  "/:paymentId",
  auth,
  protectedRoute(["owner", "admin", "manager"]),
  deletePayment,
);

export default paymentRouter;
