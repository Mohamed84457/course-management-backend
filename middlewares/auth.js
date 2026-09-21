import jwt from "jsonwebtoken";
import { userModel } from "../models/User.model.js";

const auth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "unauthorize",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "unauthorize",
      });
    }
    if (!user.isactive) {
      return res.status(401).json({
        success: false,
        message: "unauthorize",
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.log("auth middlewar:", err);
    return res.status(401).json({
      success: false,
      message: "not authorize , not valid token  ",
    });
  }
};

export default auth;
