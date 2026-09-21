import express from "express";
// middlewares
import auth from "../middlewares/auth.js";
// controllers
import {
  getNotifications,
  readNotification,
  readNotifications,
  deleteNotification,
  deleteNotifications,
} from "../controllers/notificationsController.js";

const notificationRouter = express.Router();

// get notifications
notificationRouter.get("/", auth, getNotifications);

// read all notifications
notificationRouter.patch("/read-all", auth, readNotifications);

// read single notification
notificationRouter.patch("/:notificationId/read", auth, readNotification);

// delete all notifications (must come before /:notificationId)
notificationRouter.delete("/all", auth, deleteNotifications);

// delete single notification
notificationRouter.delete("/:notificationId", auth, deleteNotification);

export default notificationRouter;
