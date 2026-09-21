const handleProtection = async (allowedRoles, req, res, next) => {
  try {
    const userRole = req.user?.role;
    const userRoles = Array.isArray(userRole)
      ? userRole
      : typeof userRole === "string"
        ? [userRole]
        : [];

    const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "forbidden",
      });
    }
   
    next();
  } catch (err) {
    console.error("protected middleware error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

const protectedRoute = (rolesOrReq, res, next) => {
  const defaultRoles = ["owner", "admin", "manager"];

  // Check if used directly as Express middleware: protectedRoute(req, res, next)
  if (res && typeof res.status === "function" && typeof next === "function") {
    return handleProtection(defaultRoles, rolesOrReq, res, next);
  }

  // Otherwise, used as factory function: protectedRoute(roles)
  const allowedRoles =
    Array.isArray(rolesOrReq) && rolesOrReq.length > 0
      ? rolesOrReq
      : typeof rolesOrReq === "string"
        ? [rolesOrReq]
        : defaultRoles;

  return (req, res, next) => handleProtection(allowedRoles, req, res, next);
};

export default protectedRoute;
