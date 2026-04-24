const express = require("express");
const router = express.Router();
const controller = require("./controller");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Use upload.any() to handle dynamic tile images
router.post("/", upload.any(), controller.create);
router.get("/", controller.getAll);
router.get("/by-category/:categoryId", controller.getByCategory);
router.get("/:id", controller.getById);
router.put("/:id", upload.any(), controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
