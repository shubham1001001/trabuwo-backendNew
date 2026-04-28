const express = require("express");
const controller = require("./controller");
const { authenticate: auth, requireRole } = require("../../middleware/auth");

const router = express.Router();

// ──────── User Routes (Seller/Reseller) ────────

router.get("/summary", auth, controller.getWalletSummary);
router.post("/withdraw", auth, controller.requestWithdrawal);

// ──────── Admin Routes ────────

router.get(
  "/admin/payouts",
  auth,
  requireRole("admin"),
  controller.getAllPayoutRequests
);

router.put(
  "/admin/payouts/:requestId",
  auth,
  requireRole("admin"),
  controller.processPayoutRequest
);

router.get(
  "/admin/ledger",
  auth,
  requireRole("admin"),
  controller.getPlatformLedger
);

router.get(
  "/admin/seller-balances",
  auth,
  requireRole("admin"),
  controller.getSellerBalances
);

module.exports = router;
