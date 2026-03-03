const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       required:
 *         - name
 *         - start
 *         - totalBudget
 *         - bidType
 *         - dailyBudget
 *         - catalogues
 *       properties:
 *         id:
 *           type: integer
 *           description: Campaign ID
 *         name:
 *           type: string
 *           description: Campaign name
 *         start:
 *           type: string
 *           format: date-time
 *           description: Campaign start date
 *         end:
 *           type: string
 *           format: date-time
 *           description: Campaign end date
 *         status:
 *           type: string
 *           enum: [live, paused, upcoming]
 *           description: Campaign status
 *         totalBudget:
 *           type: number
 *           format: decimal
 *           description: Total campaign budget
 *         bidType:
 *           type: string
 *           enum: [cost_per_click, cost_per_ad_order]
 *           description: Bid type
 *         dailyBudget:
 *           type: number
 *           format: decimal
 *           description: Daily budget
 *         catalogues:
 *           type: array
 *           description: Array of catalogues with cost per click
 *           items:
 *             type: object
 *             required:
 *               - catalogueId
 *               - costPerClick
 *             properties:
 *               catalogueId:
 *                 type: integer
 *                 description: Catalogue ID
 *               costPerClick:
 *                 type: number
 *                 format: decimal
 *                 description: Cost per click for this catalogue
 *         userId:
 *           type: integer
 *           description: User ID who created the campaign
 *     CampaignCatalogue:
 *       type: object
 *       required:
 *         - campaignId
 *         - catalogueId
 *         - costPerClick
 *       properties:
 *         id:
 *           type: integer
 *           description: Campaign catalogue ID
 *         campaignId:
 *           type: integer
 *           description: Campaign ID
 *         catalogueId:
 *           type: integer
 *           description: Catalogue ID
 *         costPerClick:
 *           type: number
 *           format: decimal
 *           description: Cost per click
 */

/**
 * @swagger
 * /api/advertisement/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/campaigns",
  validation.createCampaignValidation,
  controller.createCampaign
);

/**
 * @swagger
 * /api/advertisement/campaigns:
 *   get:
 *     summary: Get all campaigns with pagination
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [live, paused, upcoming]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
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
 *                     campaigns:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Campaign'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         total_count:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/campaigns",
  validation.getAllCampaignsValidation,
  controller.getAllCampaigns
);

/**
 * @swagger
 * /api/advertisement/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *       404:
 *         description: Campaign not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/campaigns/:id",
  validation.campaignIdValidation,
  controller.getCampaignById
);

/**
 * @swagger
 * /api/advertisement/campaigns/{id}:
 *   put:
 *     summary: Update campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       404:
 *         description: Campaign not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/campaigns/:id",
  validation.updateCampaignValidation,
  controller.updateCampaign
);

/**
 * @swagger
 * /api/advertisement/campaigns/{id}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 *       404:
 *         description: Campaign not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/campaigns/:id",
  validation.campaignIdValidation,
  controller.deleteCampaign
);

/**
 * @swagger
 * /api/advertisement/campaign-catalogues/{id}:
 *   get:
 *     summary: Get campaign catalogue by ID
 *     tags: [Campaign Catalogues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign catalogue ID
 *     responses:
 *       200:
 *         description: Campaign catalogue retrieved successfully
 *       404:
 *         description: Campaign catalogue not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/campaign-catalogues/:id",
  validation.campaignCatalogueIdValidation,
  controller.getCampaignCatalogueById
);

/**
 * @swagger
 * /api/advertisement/campaigns/{campaignId}/catalogues:
 *   get:
 *     summary: Get catalogues by campaign ID
 *     tags: [Campaign Catalogues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign catalogues retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/campaigns/:campaignId/catalogues",
  validation.campaignCatalogueByCampaignIdValidation,
  controller.getCampaignCataloguesByCampaignId
);

/**
 * @swagger
 * /api/advertisement/campaign-catalogues/{id}:
 *   put:
 *     summary: Update campaign catalogue
 *     tags: [Campaign Catalogues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign catalogue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CampaignCatalogue'
 *     responses:
 *       200:
 *         description: Campaign catalogue updated successfully
 *       404:
 *         description: Campaign catalogue not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/campaign-catalogues/:id",
  validation.updateCampaignCatalogueValidation,
  controller.updateCampaignCatalogue
);

/**
 * @swagger
 * /api/advertisement/campaign-catalogues/{id}:
 *   delete:
 *     summary: Delete campaign catalogue
 *     tags: [Campaign Catalogues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign catalogue ID
 *     responses:
 *       200:
 *         description: Campaign catalogue deleted successfully
 *       404:
 *         description: Campaign catalogue not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/campaign-catalogues/:id",
  validation.campaignCatalogueIdValidation,
  controller.deleteCampaignCatalogue
);

/**
 * @swagger
 * /api/advertisement/available-catalogues:
 *   get:
 *     summary: Get available catalogues not in any campaign
 *     tags: [Available Catalogues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Available catalogues retrieved successfully
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
 *                     catalogues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           products:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 price:
 *                                   type: number
 *                                 images:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: string
 *                                       imageUrl:
 *                                         type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/available-catalogues",
  validation.getAvailableCataloguesValidation,
  controller.getAvailableCatalogues
);

/**
 * @swagger
 * /api/advertisement/campaigns/{id}/restart:
 *   put:
 *     summary: Restart campaign with updated catalogues
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - catalogueData
 *             properties:
 *               catalogueData:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of campaign catalogues to keep with updated cost per click
 *                 items:
 *                   type: object
 *                   required:
 *                     - campaignCatalogueId
 *                     - costPerClick
 *                   properties:
 *                     campaignCatalogueId:
 *                       type: integer
 *                       description: Campaign catalogue ID
 *                     costPerClick:
 *                       type: number
 *                       format: decimal
 *                       description: Updated cost per click for this catalogue
 *     responses:
 *       200:
 *         description: Campaign restarted successfully
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
 *                   $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Campaign not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/campaigns/:id/restart",
  validation.restartCampaignValidation,
  controller.restartCampaign
);

module.exports = router;
