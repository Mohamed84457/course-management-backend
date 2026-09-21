import express from "express";
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from "../controllers/userController.js";
import auth from "../middlewares/auth.js";
import protectedRoute from "../middlewares/protected.js";

const userRouter = express.Router();

// Get all users in the user's organization (Owner, Admin, Manager)
userRouter.get("/", auth, protectedRoute, getAllUsers);

// Update user roles (Owner, Admin)
userRouter.patch(
  "/:userId/role",
  auth,
  protectedRoute(["owner", "admin"]),
  updateUserRole
);

// Update user active status (Owner, Admin)
userRouter.patch(
  "/:userId/status",
  auth,
  protectedRoute(["owner", "admin"]),
  updateUserStatus
);

export default userRouter;
