const authService = require("./service");
const { ValidationError } = require("../../utils/errors");
const apiResponse = require("../../utils/apiResponse");
const { generateTokenPair } = require("./service");

exports.setEmailAndPassword = async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.setEmailAndPassword(
    req.user.id,
    email,
    password
  );
  return apiResponse.success(res, user, "User registered successfully.", 201);
};

exports.loginUserWithPassword = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.authenticateWithPassword({
    email,
    password,
  });
  const authData = result.data;

  const platform = req.header("X-Platform")?.toLowerCase();

  if (platform === "web") {
    res.cookie("refreshToken", authData.refreshToken, {
      httpOnly: true,
      secure: false, //change to true in production
      sameSite: "lax", //change to strict in production
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  return apiResponse.success(res, {
    accessToken: authData.accessToken,
    refreshToken: platform === "web" ? null : authData.refreshToken,
    user: authData.user,
  });
};

exports.loginWithOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  const result = await authService.authenticateWithOtp({ mobile, otp });
  const authData = result.data;

  const platform = req.header("X-Platform")?.toLowerCase();

  if (platform === "web") {
    res.cookie("refreshToken", authData.refreshToken, {
      httpOnly: true,
      secure: false, //change to true in production
      sameSite: "lax", //change to strict in production
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  return apiResponse.success(res, {
    accessToken: authData.accessToken,
    refreshToken: platform === "web" ? null : authData.refreshToken,
    user: authData.user,
  });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError("Refresh token is required");
  }

  const tokenRecord = await authService.verifyRefreshToken(refreshToken);
  const user = await authService.findUserWithRoles({ id: tokenRecord.userId });
  const roles = user.Roles ? user.Roles.map((r) => r.name) : [];

  await authService.revokeRefreshToken(refreshToken);
  const { accessToken, refreshToken: newRefreshToken } =
    await generateTokenPair(user, roles);

  const platform = req.header("X-Platform")?.toLowerCase();

  if (platform === "web") {
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false, //change to true in production
      sameSite: "lax", //change to strict in production
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  return apiResponse.success(res, {
    accessToken,
    refreshToken: platform === "web" ? null : newRefreshToken,
    user: { id: user.id, email: user.email, roles },
  });
};

exports.logout = async (req, res) => {
  const platform = req.header("X-Platform")?.toLowerCase();
  let refreshToken;

  if (platform === "web") {
    refreshToken = req.cookies?.refreshToken;
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false, // change to true in production
      sameSite: "lax", // change to strict in production
      path: "/",
    });
  } else {
    refreshToken = req.body.refreshToken;
  }

  if (refreshToken) {
    await authService.revokeRefreshToken(refreshToken);
  }

  return apiResponse.success(res, null, "Logged out successfully");
};

exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;
  const result = await authService.sendOtp({ mobile });
  return apiResponse.success(res, result.data, "OTP sent successfully");
};

exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.query;
  const result = await authService.verifyOtp({ mobile, otp });

  return apiResponse.success(res, result.data, result.data.message);
};

exports.retryOtp = async (req, res) => {
  const { mobile, retrytype } = req.query;
  const result = await authService.retryOtp({ mobile, retrytype });
  return apiResponse.success(res, result.data, "OTP retry successful");
};

exports.forgotPassword = async (req, res) => {
  const { mobile, otp } = req.body;
  await authService.verifyOtp({ mobile, otp });
  const user = await authService.findUserByMobile(mobile);

  if (user) {
    const resetToken = await authService.generatePasswordResetToken(user);
    return apiResponse.success(res, { resetToken }, "Reset token issued");
  }

  return apiResponse.success(res, {}, "Success");
};

exports.passwordReset = async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPasswordWithToken(token, newPassword);
  return apiResponse.success(res, result.data, result.data.message);
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(
    req.user.id,
    currentPassword,
    newPassword
  );
  return apiResponse.success(res, result, result.message);
};

exports.subscribeToEmail = async (req, res) => {
  const { value: email } = req.body;
  const notificationChannel = await authService.subscribeToEmail(
    req.user.id,
    email
  );
  return apiResponse.success(
    res,
    notificationChannel,
    "Email subscription successful",
    201
  );
};

exports.subscribeToWhatsApp = async (req, res) => {
  const { value: mobile } = req.body;
  const notificationChannel = await authService.subscribeToWhatsApp(
    req.user.id,
    mobile
  );
  return apiResponse.success(
    res,
    notificationChannel,
    "WhatsApp subscription successful",
    201
  );
};

exports.updateWhatsAppNumber = async (req, res) => {
  const { value: mobile } = req.body;
  const notificationChannel = await authService.updateWhatsAppNumber(
    req.user.id,
    mobile
  );
  return apiResponse.success(
    res,
    notificationChannel,
    "WhatsApp number updated successfully"
  );
};



exports.editProfile = async (req, res) => {
  const user = await authService.editProfile(req.user.id, req.body);

  return apiResponse.success(res, user, "Profile updated successfully");
};

exports.getProfile = async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  return apiResponse.success(res, user, "Profile fetched successfully");
};


exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;
console.log("id>>>>",userId)
  const result = await authService.deleteAccount(userId);

  return apiResponse.success(
    res,
    null,
    "Account deleted successfully"
  );
};