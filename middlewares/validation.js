const validationMiddleware = (schema) => {
  return (req, res, next) => {
    const data = req.body ?? {};
    const result = schema.safeParse(data);
    if (!result.success) {
      const { fieldErrors } = result.error.flatten();
      const messages = Object.entries(fieldErrors)
        .map(([field, errs]) => `${field}: ${errs.join(", ")}`)
        .join(" | ");
      return res.status(400).json({
        success: false,
        message: "validation error",
        errors: fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
};
export { validationMiddleware };
