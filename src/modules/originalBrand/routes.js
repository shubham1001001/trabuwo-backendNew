const express = require("express");
const router = express.Router();
const controller = require("./controller");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { authenticate } = require("../../middleware/auth");
const { 
  createOriginalBrandValidation, 
  updateOriginalBrandValidation 
} = require("./validation");

// Public listing
router.get("/list", controller.list);

// Admin operations (Protected)
router.post(
  "/", 
  authenticate, 
  upload.fields([{ name: "image", maxCount: 1 }, { name: "mobileBanner", maxCount: 1 }]), 
  createOriginalBrandValidation, 
  controller.create
);

router.put(
  "/:publicId", 
  authenticate, 
  upload.fields([{ name: "image", maxCount: 1 }, { name: "mobileBanner", maxCount: 1 }]), 
  updateOriginalBrandValidation, 
  controller.update
);

router.delete("/:publicId", authenticate, controller.remove);

module.exports = router;
