const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("config");
const dao = require("./dao");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const {
  Msg91Error,
  NotFoundError,
  AuthenticationError,
  ConflictError,
} = require("../../utils/errors");
const Result = require("../../utils/Result");
const { handleAxiosError } = require("../../utils/axiosError");
const sequelize = require("../../config/database");

exports.createUser = async (email, password) => {
  const hashedPassword = await bcrypt.hash(password, 12);
  return dao.createUser({ email, password: hashedPassword });
};

exports.findUserByEmail = (email) => dao.findUserByEmail(email);
exports.findUserByMobile = (mobile) => dao.findUserByMobile(mobile);
exports.findUserById = (id) => dao.findUserById(id);
exports.findUserWithRoles = ({ id }) => dao.findUserWithRoles({ id });

exports.comparePasswords = (plain, hash) => {
  return bcrypt.compare(plain, hash);
};

exports.generateAccessToken = (user, roles) => {
  return jwt.sign({ id: user.id, roles }, config.get("jwtSecret"), {
    expiresIn: "600m",
  });
};

exports.generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

exports.createRefreshTokenRecord = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return dao.createRefreshToken({
    token,
    userId,
    expiresAt,
  });
};

exports.verifyRefreshToken = async (refreshToken) => {
  const tokenRecord = await dao.findRefreshToken(refreshToken);

  if (!tokenRecord) {
    throw new AuthenticationError("Invalid refresh token");
  }

  if (tokenRecord.isRevoked) {
    throw new AuthenticationError("Refresh token has been revoked");
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new AuthenticationError("Refresh token has expired");
  }

  return tokenRecord;
};

exports.revokeRefreshToken = async (refreshToken) => {
  return dao.revokeRefreshToken(refreshToken);
};

exports.revokeAllUserTokens = async (userId) => {
  return dao.revokeAllUserTokens(userId);
};

exports.generateTokenPair = async (user, roles) => {
  const accessToken = exports.generateAccessToken(user, roles);
  const refreshToken = exports.generateRefreshToken();

  await exports.createRefreshTokenRecord(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
};

exports.sendOtp = async ({ mobile }) => {
  const templateId = config.get("msg91TemplateId");
  const otpExpiry = 60;
  const authKey = config.get("msg91AuthKey");
  const url = `${config.get("msg91BaseUrl")}/api/v5/otp`;
  const realTimeResponse = 0;
  const payload = { otp_length: 6 };
  const query = [];

  if (otpExpiry) query.push(`otp_expiry=${otpExpiry}`);
  if (templateId) query.push(`template_id=${templateId}`);
  if (mobile) query.push(`mobile=${mobile}`);
  if (realTimeResponse) query.push(`realTimeResponse=${realTimeResponse}`);
  if (authKey) query.push(`authkey=${authKey}`);

  const fullUrl = query.length ? `${url}?${query.join("&")}` : url;

  try {
    const response = await axios.post(fullUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    const { data } = response;
    if (data.type === "error") {
      throw new Msg91Error(data.message);
    }
    return Result.success(data);
  } catch (error) {
    handleAxiosError(
      error,
      "OTP_SEND",
      error?.message || "Failed to send OTP",
      Msg91Error
    );
  }
};

exports.verifyOtp = async ({ mobile, otp }) => {
  const url = `${config.get("msg91BaseUrl")}/api/v5/otp/verify`;
  const query = [
    `mobile=${encodeURIComponent(mobile)}`,
    `otp=${encodeURIComponent(otp)}`,
    `authkey=${config.get("msg91AuthKey")}`,
  ];
  const fullUrl = `${url}?${query.join("&")}`;

  try {
    const response = await axios.get(fullUrl, { timeout: 10000 });
    const { data } = response;

    if (data.type === "error") {
      throw new Msg91Error(data.message);
    }

    return Result.success(data);
  } catch (error) {
    handleAxiosError(
      error,
      "OTP_VERIFY",
      error?.message || "Failed to verify OTP",
      Msg91Error
    );
  }
};

exports.retryOtp = async ({ mobile, retrytype }) => {
  const url = `${config.get("msg91BaseUrl")}/api/v5/otp/retry`;
  const query = [
    `mobile=${encodeURIComponent(mobile)}`,
    `retrytype=${encodeURIComponent(retrytype)}`,
    `authkey=${config.get("msg91AuthKey")}`,
  ];
  const fullUrl = `${url}?${query.join("&")}`;

  try {
    const response = await axios.get(fullUrl, { timeout: 10000 });
    const { data } = response;

    if (data.type === "error") {
      throw new Msg91Error(data.message);
    }

    return Result.success(data);
  } catch (error) {
    handleAxiosError(
      error,
      "OTP_RETRY",
      error?.message || "Failed to resend OTP",
      Msg91Error
    );
  }
};

exports.createUserWithMobile = async (mobile) => {
  return await dao.createUserWithRole({ mobile }, "buyer");
};

exports.generateAuthResponse = async (user) => {
  const roles = user.Roles ? user.Roles.map((r) => r.name) : [];
  const { accessToken, refreshToken } = await exports.generateTokenPair(
    user,
    roles
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      mobile: user.mobile,
      email: user.email,
      roles: roles,
    },
    message: "Logged in successfully",
  };
};

exports.findOrCreateUserByMobile = async (mobile) => {
  let user = await dao.findUserWithRoles({ mobile });

  if (!user) {
    user = await exports.createUserWithMobile(mobile);
  }

  return user;
};

exports.authenticateWithOtp = async ({ mobile, otp }) => {
  const otpResult = await exports.verifyOtp({ mobile, otp });
  const user = await exports.findOrCreateUserByMobile(mobile);

    if (user.status === "deleted") {
    throw new AuthenticationError("Account has been deleted");
  }

  const authResponse = await exports.generateAuthResponse(user);

  return Result.success({
    ...otpResult.data,
    ...authResponse,
  });
};

exports.authenticateWithPassword = async ({ email, password }) => {
  const user = await dao.findUserWithRoles({ email });

  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }


   if (user.status === "deleted") {
    throw new AuthenticationError("Account has been deleted");
  }

  const isPasswordValid = await exports.comparePasswords(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  const authResponse = await exports.generateAuthResponse(user);

  return Result.success(authResponse);
};






exports.generatePasswordResetToken = async (user) => {
  const jti = uuidv4();
  const expiresInMinutes = 15;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  await dao.createPasswordResetToken({
    userId: user.id,
    expiresAt,
    used: false,
    jti,
  });
  const payload = {
    sub: user.id,
    purpose: "reset_password",
  };
  const options = {
    expiresIn: `${expiresInMinutes}m`,
    jwtid: jti,
  };
  return jwt.sign(payload, config.get("resetPasswordSecret"), options);
};

exports.verifyPasswordResetToken = async (token, options = {}) => {
  let payload;
  payload = jwt.verify(token, config.get("resetPasswordSecret"));
  if (payload.purpose !== "reset_password") {
    throw new AuthenticationError("Invalid token purpose");
  }

  const tokenRecord = await dao.findPasswordResetTokenByJti(
    payload.jti,
    options
  );

  if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
    throw new AuthenticationError("Invalid or expired password reset token");
  }

  return payload;
};

exports.resetPasswordWithToken = async (token, newPassword) => {
  return await sequelize.transaction(async (t) => {
    const payload = await exports.verifyPasswordResetToken(token, {
      transaction: t,
    });
    const user = await dao.findUserById(payload.sub, { transaction: t });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword }, { transaction: t });
    await dao.markPasswordResetTokenUsed(payload.jti, t);
    return Result.success({ message: "Password reset successful" });
  });
};

exports.setEmailAndPassword = async (userId, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 12);
  const [, [updatedUser]] = await dao.updateUser(userId, {
    email,
    password: hashedPassword,
  });

  if (!updatedUser) {
    throw new NotFoundError("User not found");
  }

  return { id: updatedUser?.id, email: updatedUser?.email };
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
  const user = await dao.findUserById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isCurrentPasswordValid = await exports.comparePasswords(
    currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new AuthenticationError("Current password is incorrect");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  await user.update({ password: hashedNewPassword });

  await exports.revokeAllUserTokens(userId);
  return { message: "Password changed successfully" };
};

exports.subscribeToEmail = async (userId, email) => {
  const user = await dao.findUserById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.email !== email) {
    throw new ConflictError("Email does not match with the user's email");
  }

  const notificationChannel = await dao.createNotificationChannel({
    userId,
    type: "email",
    value: email,
    subscribed: true,
  });

  return notificationChannel;
};

exports.subscribeToWhatsApp = async (userId, mobile) => {
  const user = await dao.findUserById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const existingChannel = await dao.findNotificationChannelByUserIdAndType(
    userId,
    "whatsapp"
  );

  if (existingChannel) {
    await dao.updateNotificationChannel(existingChannel.id, {
      value: mobile,
      subscribed: true,
    });
    return await dao.findNotificationChannelByUserIdAndType(userId, "whatsapp");
  } else {
    const notificationChannel = await dao.createNotificationChannel({
      userId,
      type: "whatsapp",
      value: mobile,
      subscribed: true,
    });
    return notificationChannel;
  }
};

exports.updateWhatsAppNumber = async (userId, mobile) => {
  const existingChannel = await dao.findNotificationChannelByUserIdAndType(
    userId,
    "whatsapp"
  );

  if (existingChannel) {
    await dao.updateNotificationChannel(existingChannel.id, {
      value: mobile,
    });
    return await dao.findNotificationChannelByUserIdAndType(userId, "whatsapp");
  } else {
    const notificationChannel = await dao.createNotificationChannel({
      userId,
      type: "whatsapp",
      value: mobile,
      subscribed: true,
    });
    return notificationChannel;
  }
};


exports.editProfile = async (userId, payload) => {
  const user = await dao.findUserById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // email unique check
  if (payload.email && payload.email !== user.email) {
    const existingUser = await dao.findUserByEmail(payload.email);

    if (existingUser) {
      throw new ValidationError("Email already exists");
    }
  }

  Object.keys(payload).forEach(
    (key) => payload[key] === undefined && delete payload[key]
  );

  const [, [updatedUser]] = await dao.updateUser(userId, payload);

  const userData = updatedUser.toJSON();
  delete userData.password;

  return userData;
};
exports.getProfile = async (userId) => {
  const user = await dao.findUserWithRoles({ id: userId });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    id: user.id,
    publicId: user.publicId,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    gender: user.gender,
    dob: user.dob,
    maritalStatus: user.maritalStatus,
    numberOfKids: user.numberOfKids,
    occupation: user.occupation,
    education: user.education,
    monthlyIncome: user.monthlyIncome,
    aboutMe: user.aboutMe,
    languageSpoken: user.languageSpoken,
    profileImage: user.profileImage,
    roles: user.Roles ? user.Roles.map((r) => r.name) : [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};


exports.deleteAccount = async (userId) => {
  const user = await dao.findUserById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // revoke refresh tokens
  await dao.revokeAllUserTokens(userId);

  // soft delete user
  await dao.softDeleteUser(userId);

  return true;
};