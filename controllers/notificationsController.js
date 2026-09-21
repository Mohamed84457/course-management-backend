import notificationModel from "../models/notification.model.js";

// get own notifications
const getNotifications = async (req, res) => {
  try {
    const { _id, organizationId } = req.user;
    const { isRead, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query = {
      organizationId,
      userId: _id,
    };

    if (isRead === "true") {
      query.isRead = true;
    } else if (isRead === "false") {
      query.isRead = false;
    }

    const totalnotifications = await notificationModel.countDocuments(query);

    const notifications = await notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "notifications fetched successfully",
      totalnotifications,
      count: notifications.length,
      totalPages: Math.ceil(totalnotifications / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      notifications,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// read single notification
const readNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { _id, organizationId } = req.user;

    const notification = await notificationModel.findOne({
      _id: notificationId,
      organizationId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "notification not found",
      });
    }

    if (notification.userId.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: "access forbidden",
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "notification marked as read successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// read all user notifications
const readNotifications = async (req, res) => {
  try {
    const { _id, organizationId } = req.user;

    await notificationModel.updateMany(
      {
        userId: _id,
        organizationId,
      },
      {
        isRead: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "read all notifications successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete single notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { _id, organizationId } = req.user;

    const notification = await notificationModel.findOne({
      _id: notificationId,
      organizationId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "notification not found",
      });
    }

    if (notification.userId.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: "access forbidden",
      });
    }

    await notificationModel.findOneAndDelete({
      _id: notificationId,
      organizationId,
      userId: _id,
    });

    return res.status(200).json({
      success: true,
      message: "notification deleted successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete all own notifications
const deleteNotifications = async (req, res) => {
  try {
    const { _id, organizationId } = req.user;

    await notificationModel.deleteMany({
      userId: _id,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "notifications deleted successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export {
  getNotifications,
  readNotification,
  readNotifications,
  deleteNotification,
  deleteNotifications,
};
