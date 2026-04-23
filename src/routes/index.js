const express = require("express");
const router = express.Router();

router.use("/auth", require("../modules/auth/routes"));
router.use("/seller-onboarding", require("../modules/sellerOnboarding/routes"));
router.use("/gst", require("../modules/gstVerification/routes"));
router.use(
  "/legal-and-policies",
  require("../modules/legalAndPolicies/routes")
);
router.use("/category", require("../modules/category/routes"));
router.use("/catalogue", require("../modules/catalogue/routes"));
router.use("/category-schema", require("../modules/categorySchema/routes"));
router.use("/product", require("../modules/product/routes"));
router.use("/order", require("../modules/order/routes"));
router.use("/training", require("../modules/training/routes"));
router.use("/pricing", require("../modules/pricing/routes"));
router.use("/pricing", require("../modules/priceRecommendation/routes"));
router.use("/cart", require("../modules/cart/routes"));
router.use("/payment", require("../modules/payment/routes"));
router.use("/shiprocket", require("../modules/shiprocket/routes"));
router.use("/claim", require("../modules/claim/routes"));
router.use("/review", require("../modules/review/routes"));
router.use("/promotions", require("../modules/promotions/routes"));
router.use(
  "/influencer-marketing",
  require("../modules/influencerMarketing/routes")
);
router.use(
  "/business-dashboard",
  require("../modules/businessDashboard/routes")
);
router.use("/image-bulk-upload", require("../modules/imageBulkUpload/routes"));
router.use("/notice-board", require("../modules/noticeBoard/routes"));
router.use("/leave-request", require("../modules/leaveRequest/routes"));
router.use("/faq", require("../modules/faq/routes"));
router.use("/tutorial-videos", require("../modules/tutorialVideos/routes"));
router.use("/callback", require("../modules/callback/routes"));
router.use("/inventory", require("../modules/inventory/routes"));
router.use("/advertisement", require("../modules/advertisement/routes"));
router.use("/banner", require("../modules/banner/routes"));
router.use("/category-sections", require("../modules/categorySection/routes"));
router.use("/section-assets", require("../modules/sectionAsset/routes"));
router.use("/category-icons", require("../modules/categoryIcon/routes"));
router.use("/home-categories", require("../modules/homeCategory/routes"));
router.use("/barcode-packaging", require("../modules/barcodePackaging/routes"));
router.use("/store-follow", require("../modules/storeFollow/routes"));
router.use("/user-addresses", require("../modules/userAddress/routes"));
router.use("/user-bank-info", require("../modules/userBankInfo/routes"));
router.use(
  "/product-view-history",
  require("../modules/productViewHistory/routes")
);
router.use("/wishlist", require("../modules/wishlist/routes"));
router.use("/sharelist", require("../modules/sharelist/routes"));
router.use("/returns", require("../modules/return/routes"));
router.use(
  "/product-stock-notifications",
  require("../modules/productStockNotification/routes")
);
router.use("/brands", require("../modules/brand/routes"))
router.use("/gold-section", require("../modules/goldSection/routes"));
router.use("/original-brand-categories", require("../modules/originalBrand/routes"));
router.use("/mobile-category", require("../modules/mobileCategory/routes"));
module.exports = router;
