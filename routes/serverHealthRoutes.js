import express from "express";

const healthServerRouter = express.Router();

healthServerRouter.get("/health", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      server: process.env.SERVER_NAME || "unknown",
      port: process.env.PORT || 3000,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
});

export default healthServerRouter;
