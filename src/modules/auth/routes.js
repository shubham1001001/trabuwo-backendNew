const express = require("express");
const multer = require("multer");
const router = express.Router();
const authController = require("./controller");
const {
  registerValidation,
  loginValidation,
  loginWithOtpValidation,
  refreshTokenValidation,
  logoutValidation,
  sendOtpValidation,
  retryOtpValidation,
  forgotPasswordValidation,
  passwordResetValidation,
  changePasswordValidation,
  subscribeEmailValidation,
  subscribeWhatsAppValidation,
  updateWhatsAppValidation,
  editProfileValidation
} = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");




const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
 *                 example: "Password@123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "User registered successfully."
 *               data:
 *                 id: 1
 *                 email: "user@example.com"
 *                 roles: ["buyer"]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/register",
  registerValidation,
  asyncHandler(authController.setEmailAndPassword)
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   id: 1
 *                   email: "user@example.com"
 *                   roles: ["buyer"]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/login-password",
  loginValidation,
  asyncHandler(authController.loginUserWithPassword)
);

/**
 * @swagger
 * /api/auth/login-otp:
 *   post:
 *     summary: Login a user with mobile OTP
 *     description: |
 *       Authenticates a user using mobile number and OTP. If the user doesn't exist,
 *       a new user account will be created automatically with the default 'buyer' role.
 *
 *       **Features:**
 *       - Verifies OTP sent to the mobile number
 *       - Creates new user account if user doesn't exist
 *       - Assigns default 'buyer' role to new users
 *       - Returns access and refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - otp
 *             properties:
 *               mobile:
 *                 type: string
 *                 pattern: '^91\d{10}$'
 *                 description: Mobile number in Indian format with country code
 *                 example: "919876543210"
 *                 minLength: 12
 *                 maxLength: 12
 *               otp:
 *                 type: string
 *                 description: One-Time Password received via SMS
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       description: Refresh token for getting new access tokens
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         mobile:
 *                           type: string
 *                           example: "919876543210"
 *                         email:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["buyer"]
 *                     message:
 *                       type: string
 *                       example: "Logged in successfully"
 *       400:
 *         description: Bad request - Invalid OTP or mobile number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid OTP"
 *                 code:
 *                   type: string
 *                   example: "OTP_ERROR"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/login-otp",
  loginWithOtpValidation,
  asyncHandler(authController.loginWithOtp)
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token received from login
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   id: 1
 *                   email: "user@example.com"
 *                   roles: ["buyer"]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/refresh",
  refreshTokenValidation,
  asyncHandler(authController.refreshToken)
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and revoke refresh token
 *     description: |
 *       Logs out the user and revokes the refresh token.
 *
 *       **Header Requirement:**
 *       - You must include the `X-Platform` header with value `web` only applicable for web.
 *
 *       **Platform-specific behavior:**
 *       - For **mobile**: The `refreshToken` must be included in the request body.
 *       - For **web**: The `refreshToken` is expected as a cookie (it will be set as a cookie when the user logs in).
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to revoke (required for mobile, ignored for web)
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Logged out successfully"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/logout", logoutValidation, asyncHandler(authController.logout));

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to a mobile number for authentication
 *     description: |
 *       Sends a One-Time Password (OTP) to the specified mobile number for user authentication.
 *       The OTP will be sent via SMS and is valid for 60 minutes.
 *
 *       **Features:**
 *       - Supports Indian mobile numbers (91XXXXXXXXXX format)
 *       - OTP expires after 60 minutes
 *       - Works for both new user registration and existing user login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *             properties:
 *               mobile:
 *                 type: string
 *                 pattern: '^91\d{10}$'
 *                 description: Mobile number in Indian format with country code
 *                 example: "919876543210"
 *                 minLength: 12
 *                 maxLength: 12
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "success"
 *                     message:
 *                       type: string
 *                       example: "OTP sent successfully"
 *                     request_id:
 *                       type: string
 *                       description: Unique request ID for tracking
 *                       example: "1234567890abcdef"
 *       400:
 *         description: Bad request - Invalid mobile number format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to send OTP. Please try again. If the problem persists, contact support."
 *                 code:
 *                   type: string
 *                   example: "MSG91_ERROR"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error. Please try again later."
 *                 code:
 *                   type: string
 *                   example: "INTERNAL_ERROR"
 */
router.post(
  "/send-otp",
  sendOtpValidation,
  asyncHandler(authController.sendOtp)
);

// router.get(
//   "/verify-otp",
//   verifyOtpValidation,
//   asyncHandler(authController.verifyOtp)
// );

/**
 * @swagger
 * /api/auth/retry-otp:
 *   get:
 *     summary: Retry OTP for a mobile number
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: mobile
 *         schema:
 *           type: string
 *         required: true
 *         description: Mobile number
 *       - in: query
 *         name: retrytype
 *         schema:
 *           type: string
 *         required: true
 *         description: Retry type (text, voice, etc.)
 *     responses:
 *       200:
 *         description: OTP retry result
 */
router.get(
  "/retry-otp",
  retryOtpValidation,
  asyncHandler(authController.retryOtp)
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset token via OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - otp
 *             properties:
 *               mobile:
 *                 type: string
 *                 pattern: '^91\\d{10}$'
 *                 description: Mobile number in Indian format with country code
 *                 example: "919876543210"
 *                 minLength: 12
 *                 maxLength: 12
 *               otp:
 *                 type: string
 *                 description: One-Time Password received via SMS
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Reset token issued if user exists, otherwise success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Reset token issued"
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       description: Password reset token (JWT)
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid OTP or mobile number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid OTP"
 *                 code:
 *                   type: string
 *                   example: "OTP_ERROR"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  asyncHandler(authController.forgotPassword)
);

/**
 * @swagger
 * /api/auth/password-reset:
 *   post:
 *     summary: Reset password using a valid reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token (JWT)
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               newPassword:
 *                 type: string
 *                 minLength: 4
 *                 description: New password (min 4 characters)
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset successful"
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid or expired token, or invalid password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired password reset token"
 *                 code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/password-reset",
  passwordResetValidation,
  asyncHandler(authController.passwordReset)
);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password (authenticated)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: User's current password
 *                 example: "CurrentPass@123"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
 *                 description: New password (min 8 chars, 1 capital, 1 number, 1 special char)
 *                 example: "NewPass@456"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Password changed successfully"
 *       400:
 *         description: Validation error or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Current password is incorrect"
 *                 code:
 *                   type: string
 *                   example: "AUTHENTICATION_ERROR"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  asyncHandler(authController.changePassword)
);

/**
 * @swagger
 * /api/auth/subscribe-email:
 *   post:
 *     summary: Subscribe to email notifications (authenticated)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - value
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email]
 *                 description: Notification channel type (must be email)
 *                 example: "email"
 *               value:
 *                 type: string
 *                 format: email
 *                 description: Email address for notifications
 *                 example: "user@example.com"
 *     responses:
 *       201:
 *         description: Email subscription successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email subscription successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     type:
 *                       type: string
 *                       example: "email"
 *                     value:
 *                       type: string
 *                       example: "user@example.com"
 *                     subscribed:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/subscribe-email",
  authenticate,
  subscribeEmailValidation,
  asyncHandler(authController.subscribeToEmail)
);

/**
 * @swagger
 * /api/auth/subscribe-whatsapp:
 *   post:
 *     summary: Subscribe to WhatsApp notifications (authenticated)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - value
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [whatsapp]
 *                 description: Notification channel type (must be whatsapp)
 *                 example: "whatsapp"
 *               value:
 *                 type: string
 *                 pattern: "^91\\d{10}$"
 *                 description: Mobile number in format 919234567890
 *                 example: "919234567890"
 *     responses:
 *       201:
 *         description: WhatsApp subscription successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "WhatsApp subscription successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     type:
 *                       type: string
 *                       example: "whatsapp"
 *                     value:
 *                       type: string
 *                       example: "919234567890"
 *                     subscribed:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/subscribe-whatsapp",
  authenticate,
  subscribeWhatsAppValidation,
  asyncHandler(authController.subscribeToWhatsApp)
);

/**
 * @swagger
 * /api/auth/whatsapp-number:
 *   put:
 *     summary: Update WhatsApp number for notifications (authenticated)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *                 pattern: "^91\\d{10}$"
 *                 description: Mobile number in format 919234567890
 *                 example: "919234567890"
 *     responses:
 *       200:
 *         description: WhatsApp number updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "WhatsApp number updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     type:
 *                       type: string
 *                       example: "whatsapp"
 *                     value:
 *                       type: string
 *                       example: "919234567890"
 *                     subscribed:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *                 code:
 *                   type: string
 *                   example: "NOT_FOUND_ERROR"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/whatsapp-number",
  authenticate,
  updateWhatsAppValidation,
  asyncHandler(authController.updateWhatsAppNumber)
);


/**
 * @swagger
 * /api/auth/edit-profile:
 *   put:
 *     summary: Edit user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Rohit
 *               lastName:
 *                 type: string
 *                 example: Sharma
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: female
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: 1998-05-10
 *               maritalStatus:
 *                 type: string
 *                 enum: [single, married, divorced, widowed]
 *                 example: single
 *               numberOfKids:
 *                 type: integer
 *                 example: 0
 *               occupation:
 *                 type: string
 *                 example: Software Developer
 *               education:
 *                 type: string
 *                 example: B.Tech
 *               monthlyIncome:
 *                 type: number
 *                 example: 40000
 *               aboutMe:
 *                 type: string
 *                 example: I am a backend developer
 *               languageSpoken:
 *                 type: string
 *                 example: Hindi, English
 *               profileImage:
 *                 type: string
 *                 example: https://example.com/profile.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  "/edit-profile",
  authenticate,
  editProfileValidation,
  asyncHandler(authController.editProfile)
);



/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get logged in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 1
 *                     publicId:
 *                       type: string
 *                       example: 019975e7-6fbf-77da-b993-a2be045c0de9
 *                     firstName:
 *                       type: string
 *                       example: Rohit
 *                     lastName:
 *                       type: string
 *                       example: Sharma
 *                     email:
 *                       type: string
 *                       example: test@test.com
 *                     mobile:
 *                       type: string
 *                       example: 916283914650
 *                     profileImage:
 *                       type: string
 *                       example: https://example.com/profile.jpg
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["buyer"]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 */
router.get(
  "/profile",
  authenticate,
  asyncHandler(authController.getProfile)
);



/**
 * @swagger
 * /api/auth/delete-account:
 *   delete:
 *     summary: Delete logged in user account
 *     description:  Soft deletes the authenticated user's account by marking status as deleted.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully
 *                 data:
 *                   type: object
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found
 *                 code:
 *                   type: string
 *                   example: NOT_FOUND_ERROR
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/delete-account",
  authenticate,
  asyncHandler(authController.deleteAccount)
);


/**
 * @swagger
 * /api/auth/profile-image:
 *   patch:
 *     summary: Upload/Update profile image
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 */
router.patch(
  "/profile-image",
  authenticate,
  upload.single("profileImage"),
  asyncHandler(authController.updateProfileImage)
);
module.exports = router;
