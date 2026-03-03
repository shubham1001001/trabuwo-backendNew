const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");
const { handleValidationErrors } = require("../../utils/validation");

router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     UserAddress:
 *       type: object
 *       required:
 *         - name
 *         - phoneNumber
 *         - pincode
 *         - city
 *         - state
 *       properties:
 *         publicId:
 *           type: string
 *           format: uuid
 *           description: Unique public identifier
 *         name:
 *           type: string
 *           description: Contact name for this address
 *         phoneNumber:
 *           type: string
 *           description: Contact phone number
 *         pincode:
 *           type: string
 *           description: Postal code
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State name
 *         buildingNumber:
 *           type: string
 *           description: Building number
 *         street:
 *           type: string
 *           description: Street name
 *         landmark:
 *           type: string
 *           description: Nearby landmark
 *         addressType:
 *           type: string
 *           enum: [home, work, other]
 *           description: Type of address
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default address
 */

/**
 * @swagger
 * /api/user-addresses:
 *   post:
 *     summary: Create a new user address
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phoneNumber
 *               - pincode
 *               - city
 *               - state
 *             properties:
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               pincode:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               buildingNumber:
 *                 type: string
 *               street:
 *                 type: string
 *               landmark:
 *                 type: string
 *               addressType:
 *                 type: string
 *                 enum: [home, work, other]
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserAddress'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthenticateorized
 */
router.post(
  "/",
  validation.createAddressValidation,
  handleValidationErrors,
  controller.createAddress
);

/**
 * @swagger
 * /api/user-addresses:
 *   get:
 *     summary: Get all user addresses
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserAddress'
 *       401:
 *         description: Unauthenticateorized
 */
router.get("/", controller.getUserAddresses);

/**
 * @swagger
 * /api/user-addresses/{publicId}:
 *   get:
 *     summary: Get a specific user address
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address public ID
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserAddress'
 *       404:
 *         description: Address not found
 *       401:
 *         description: Unauthenticateorized
 */
router.get(
  "/:publicId",
  validation.getAddressValidation,
  handleValidationErrors,
  controller.getAddressById
);

/**
 * @swagger
 * /api/user-addresses/{publicId}:
 *   put:
 *     summary: Update a user address
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address public ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               pincode:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               buildingNumber:
 *                 type: string
 *               street:
 *                 type: string
 *               landmark:
 *                 type: string
 *               addressType:
 *                 type: string
 *                 enum: [home, work, other]
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserAddress'
 *       404:
 *         description: Address not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthenticateorized
 */
router.put(
  "/:publicId",
  validation.updateAddressValidation,
  handleValidationErrors,
  controller.updateAddress
);

/**
 * @swagger
 * /api/user-addresses/{publicId}:
 *   delete:
 *     summary: Delete a user address
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address public ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 *       401:
 *         description: Unauthenticateorized
 */
router.delete(
  "/:publicId",
  validation.deleteAddressValidation,
  handleValidationErrors,
  controller.deleteAddress
);

/**
 * @swagger
 * /api/user-addresses/{publicId}/set-default:
 *   patch:
 *     summary: Set an address as default
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address public ID
 *     responses:
 *       200:
 *         description: Default address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicId:
 *                       type: string
 *                       format: uuid
 *                     isDefault:
 *                       type: boolean
 *       404:
 *         description: Address not found
 *       401:
 *         description: Unauthenticateorized
 */
router.patch(
  "/:publicId/set-default",
  validation.setDefaultValidation,
  handleValidationErrors,
  controller.setAsDefault
);

module.exports = router;
