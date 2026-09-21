// Helper function to sanitize user object before sending in response
const sanitizeUser = (user) => {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.accessToken;
  delete userObj.refreshToken;
  delete userObj.verifyToken;
  delete userObj.expireVerifyToken;
  delete userObj.resetToken;
  delete userObj.expireResetToken;
  return userObj;
};

export { sanitizeUser };
