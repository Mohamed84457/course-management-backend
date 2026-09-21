import express from "express";
// schemas
import userSchema from "../validations/user.schema.js";
import resetPasswordSchema from "../validations/resetpassword.schema.js";
import loginSchema from "../validations/login.schema.js";
// middleware
import { validationMiddleware } from "../middlewares/validation.js";
import auth from "../middlewares/auth.js";
import { imageUpload } from "../middlewares/imageUpload.js";
// controllers
import {
  register,
  verifyEmail,
  login,
  forgetPassword,
  resetPassword,
  refreshToken,
  uploadProfileImage,
  deleteProfileImage,
  changePassword,
  getMe,
  logout,
} from "../controllers/authController.js";

const authrouter = express.Router();

authrouter.post("/register", validationMiddleware(userSchema), register);
// authrouter.get("/verify/:verifytoken", verifyEmail);
authrouter.post("/verify/:verifytoken", verifyEmail);
authrouter.post("/login", validationMiddleware(loginSchema), login);
authrouter.post("/forgot-password", forgetPassword);
authrouter.post(
  "/reset-password",
  validationMiddleware(resetPasswordSchema),
  resetPassword,
);
authrouter.post("/change-password", auth, changePassword);
authrouter.post("/refresh-token", refreshToken);
authrouter.get("/me", auth, getMe);
authrouter.post(
  "/image-profile",
  auth,
  imageUpload.single("image"),
  uploadProfileImage,
);


authrouter.delete("/image-profile", auth, deleteProfileImage);
authrouter.post("/logout", logout);

export default authrouter;
