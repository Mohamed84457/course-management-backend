const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Error:", err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.ENV === "development" && { stack: err.stack }),
  });
};

export { errorHandler };
