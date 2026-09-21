import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// models
import { userModel } from "../models/User.model.js";
import { Student } from "../models/Student.model.js";
// utils
import { sendEmail } from "../utils/sendEmail.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";

// register
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      gender,
      phone,
      parentName,
      parentPhone,
      address,
      school,
      educationLevel,
    } = req.body ?? {};
    // check if user exist
    const existUser = await userModel.findOne({ email });
    if (existUser) {
      return res.status(409).json({
        success: false,
        message: "email has been used",
      });
    }

    const verifyToken = crypto.randomUUID();
    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");
    const expireVerifyToken = Date.now() + 15 * 60 * 1000;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      gender,
      phone,
      verifyToken: hashedVerifyToken,
      expireVerifyToken,
    });
    //  if role is student, then create student
    if (role.includes("student")) {
      try {
        const studentCode =
          "ST-" + crypto.randomBytes(4).toString("hex").toUpperCase();
        await Student.create({
          userId: user._id,
          parentName,
          studentCode,
          parentPhone,
          address,
          school,
          educationLevel,
        });
      } catch (studentErr) {
        await userModel.findByIdAndDelete(user._id); // rollback
        throw studentErr;
      }
    }

    const userObj = sanitizeUser(user);
    res.status(201).json({
      success: true,
      message: "registration  successfully",
      user: userObj,
    });

    const url = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    await sendEmail({
      to: email,
      subject: "Your Course Account - Verify Your Email Address",
      text: `Dear ${name}, please verify your email: ${url}`,

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2d3748;">Verify Your Email</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for registering with <strong>Course Management</strong>. Please confirm your email address to activate your account.</p>
          <p style="margin: 24px 0;">
            <a href="${url}" 
               style="background-color: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${url}</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #888;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `,
    }).catch((emailErr) => {
      console.error("Failed to send verification email:", emailErr);
      // optionally: queue a retry, mark user.emailSendFailed = true, etc.
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "internal server error",
      err,
    });
  }
};

// verify email
const verifyEmail = async (req, res) => {
  try {
    const { verifytoken } = req.params ?? "";

    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifytoken)
      .digest("hex");

    const user = await userModel.findOne({
      verifyToken: hashedVerifyToken,
      expireVerifyToken: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "invalid or expired token ",
      });
    }

    user.isEmailVerified = true;

    user.verifyToken = undefined;
    user.expireVerifyToken = undefined;

    const payload = { id: user._id };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.EXPIRE_TOKEN,
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.EXPIRE_REFRESH,
    });
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    const isProduction =
      process.env.NODE_ENV === "production" || process.env.ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    const userObj = sanitizeUser(user);
    return res.status(200).json({
      success: true,
      message: "email verified successfully",
      user: userObj,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// login
const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password required",
      });
    }

    const user = await userModel.findOne({
      email,
      isactive: true,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "email or password wrong",
      });
    }

    const verifyPassword = await bcrypt.compare(password, user.password);
    if (!verifyPassword) {
      return res.status(400).json({
        success: false,
        message: "email or password wrong",
      });
    }

    if (!user.isEmailVerified) {
      if (user.expireVerifyToken > Date.now()) {
        return res.status(400).json({
          success: false,
          message: "please verify your email first",
        });
      }
      return res.status(400).json({
        success: false,
        message: "email or password wrong",
      });
    }

    user.lastLogin = Date.now();
    const payload = { id: user._id };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.EXPIRE_TOKEN,
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.EXPIRE_REFRESH,
    });
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    const isProduction =
      process.env.NODE_ENV === "production" || process.env.ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    const userObj = sanitizeUser(user);
    // const userObj = user;

    return res.status(200).json({
      success: true,
      message: "login successfully",
      user: userObj,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// forget password
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body ?? {}; //?? very important
    // due to if user not send

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }

    const user = await userModel.findOne({
      email,
      isactive: true,
      isEmailVerified: true,
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "if user is registerd then link is sent to your email",
      });
    }

    const resetToken = crypto.randomUUID();
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expireResetToken = Date.now() + 15 * 60 * 1000;

    user.resetToken = hashedResetToken;
    user.expireResetToken = expireResetToken;
    await user.save();

    const url = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Reset Your Password",
      text: `Dear ${user.name}, please reset your password: ${url}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #2d3748;">Reset Your Password</h2>
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>We received a request to reset the password for your Course Management account. Please click the link below to reset your password:</p>
        <p style="margin: 24px 0;">
          <a href="${url}" 
             style="background-color: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5;">${url}</p>
        <p>This link will expire in 15 minutes.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
    });

    return res.status(200).json({
      success: true,
      message: "reset password link sent to your email",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// reset password
const resetPassword = async (req, res) => {
  try {
    const { newPassword, resetToken } = req.body ?? {};

    if (!newPassword || !resetToken) {
      return res.status(400).json({
        success: false,
        message: "newPassword and resetToken are required",
      });
    }

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await userModel.findOne({
      resetToken: hashedResetToken,
      expireResetToken: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "invalid or expired token",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.expireResetToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "password updated success",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error ",
    });
  }
};

// refresh token
const refreshToken = async (req, res) => {
  try {
    let refreshToken;
    if (req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    } else if (req.cookies?.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "refresh token required",
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      // clear the bad cookie so the client doesn't keep resending it
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "refresh token expired, please login again",
        });
      }
      // covers JsonWebTokenError (malformed, bad signature, etc.)
      return res.status(403).json({
        success: false,
        message: "invalid refresh token",
      });
    }

    const user = await userModel.findOne({ _id: decoded.id });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "invalid or expired refresh token",
      });
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.EXPIRE_TOKEN,
      },
    );

    user.accessToken = newAccessToken;
    await user.save();

    const isProduction =
      process.env.NODE_ENV === "production" || process.env.ENV === "production";

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "generate new access token ",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get me
const getMe = async (req, res) => {
  const userToken = req.user;

  const user = await userModel.findOne({
    _id: userToken.id,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "user not found",
    });
  }

  const userObj = sanitizeUser(user);

  return res.status(200).json({
    success: true,
    message: "user found successfully",
    user: userObj,
  });
};
//logout
const logout = async (req, res) => {
  const { _id } = req.user;

  const user = await userModel.findById(_id);
  user.accessToken = null;
  user.refreshToken = null;
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.ENV === "production";

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
  });

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Check if a file was provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // if already has profile image
    if (user.profileImage) {
      // user.profileImage is e.g. "/uploads/123-filename.jpg"
      const oldImagePath = path.join(
        __dirname,
        "..",
        "public",
        user.profileImage,
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Removes old file from disk
      }
    }

    // Check if a file was uploaded
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    user.profileImage = imageUrl;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "profile image changed successfully",
      profileImage: user.profileImage,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete profile image
const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    if (user.profileImage) {
      const imagePath = path.join(__dirname, "..", "public", user.profileImage);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      user.profileImage = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "image delete successfully",
      });
    }

    return res.status(404).json({
      success: false,
      message: "no image found",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// change password if he login (auth)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body ?? {};
    const userId = req.user.id; // from auth middleware

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both oldPassword and newPassword are required",
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export {
  sanitizeUser,
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
};
