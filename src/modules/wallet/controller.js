const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");

exports.getWalletSummary = asyncHandler(async (req, res) => {
  const summary = await service.getWalletSummary(req.user.id);
  return res.status(200).json({
    success: true,
    data: summary,
  });
});

exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const request = await service.requestWithdrawal(req.user.id, parseFloat(amount));

  return res.status(201).json({
    success: true,
    message: "Withdrawal request submitted successfully",
    data: request,
  });
});

// ──────── Admin Handlers ────────

const dao = require("./dao");

exports.getAllPayoutRequests = asyncHandler(async (req, res) => {
  const { status, userId } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (userId) filters.userId = userId;

  const requests = await dao.getPayoutRequests(filters, {
    include: [
      { model: require("../auth/model").User, as: "user", attributes: ["email", "mobile"] }
    ]
  });

  return res.status(200).json({
    success: true,
    data: requests,
  });
});

exports.processPayoutRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status, adminNotes } = req.body;

  const request = await service.processPayoutRequest(requestId, status, adminNotes);

  return res.status(200).json({
    success: true,
    message: `Payout request ${status}`,
    data: request,
  });
});

exports.getPlatformLedger = asyncHandler(async (req, res) => {
  const { entryType, orderId } = req.query;
  const filters = {};
  if (entryType) filters.entryType = entryType;
  if (orderId) filters.orderId = orderId;

  const entries = await dao.getLedgerEntries(filters);

  return res.status(200).json({
    success: true,
    data: entries,
  });
});

exports.getSellerBalances = asyncHandler(async (req, res) => {
  const balances = await service.getSellerBalances();
  return res.status(200).json({
    success: true,
    data: balances,
  });
});
