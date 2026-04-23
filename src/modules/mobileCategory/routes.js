const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { authenticate, authorize } = require("../../middleware/auth");
const upload = require("../../middleware/multer");

router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  upload.single("image"),
  controller.createCategory
);

router.get("/", controller.getAllCategories);

router.get("/:publicId", controller.getCategory);

router.put(
  "/:publicId",
  authenticate,
  authorize(["admin"]),
  upload.single("image"),
  controller.updateCategory
);

router.delete(
  "/:publicId",
  authenticate,
  authorize(["admin"]),
  controller.deleteCategory
);

module.exports = router;
