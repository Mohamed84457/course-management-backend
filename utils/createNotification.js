import notificationModel from "../models/notification.model.js";
import enrollmentModel from "../models/enrollment.model.js";

/**
 * Creates a notification for a single user (e.g. Teacher)
 */
export const createNotification = async ({
  organizationId,
  userId,
  type,
  message,
  link = null,
  data = {},
}) => {
  try {
    if (!organizationId || !userId || !message) return null;
    return await notificationModel.create({
      organizationId,
      userId,
      type,
      message,
      link,
      data,
    });
  } catch (err) {
    console.error("createNotification error:", err);
    return null;
  }
};

/**
 * Sends a notification to all students enrolled in a specific course
 */
export const notifyEnrolledStudents = async ({
  organizationId,
  courseId,
  type,
  message,
  link = null,
  data = {},
}) => {
  try {
    if (!organizationId || !courseId || !message) return;

    const enrollments = await enrollmentModel
      .find({
        organizationId,
        courseId,
        status: { $in: ["active", "completed", "pending"] },
      })
      .populate("studentId");

    const notifications = [];
    for (const enrollment of enrollments) {
      const studentUserId = enrollment.studentId?.userId;
      if (studentUserId) {
        notifications.push({
          organizationId,
          userId: studentUserId,
          type,
          message,
          link,
          data,
        });
      }
    }

    if (notifications.length > 0) {
      await notificationModel.insertMany(notifications);
    }
  } catch (err) {
    console.error("notifyEnrolledStudents error:", err);
  }
};
