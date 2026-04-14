const express = require("express");
const multer = require("multer");
const router = express.Router();
const controller = require("./controller");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Public endpoint for Buyer Homepage
 */
router.get("/data", asyncHandler(controller.getGoldSectionData));

/**
 * Admin endpoints to manage settings
 */
router.get("/settings", authenticate, asyncHandler(controller.getGoldSettings));
router.put(
  "/settings",
  authenticate,
  upload.fields([
    { name: "backgroundImage", maxCount: 1 },
    { name: "heroImage", maxCount: 1 },
  ]),
  asyncHandler(controller.updateGoldSettings)
);

// --- GOLD CATEGORY TILE ROUTES ---
router.get("/tiles", authenticate, asyncHandler(controller.getGoldCategories));
router.post("/tiles", authenticate, upload.single("image"), asyncHandler(controller.createGoldCategory));
router.put("/tiles/:publicId", authenticate, upload.single("image"), asyncHandler(controller.updateGoldCategory));
router.delete("/tiles/:publicId", authenticate, asyncHandler(controller.deleteGoldCategory));

module.exports = router;
