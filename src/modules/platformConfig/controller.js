const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");

// ──────── Platform Configs ────────

exports.getAllConfigs = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const configs = await service.getAllConfigs(category || null);

  return res.status(200).json({
    success: true,
    message: "Platform configs retrieved successfully",
    data: configs,
  });
});

exports.updateConfig = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  const config = await service.updateConfig(key, value, description);

  return res.status(200).json({
    success: true,
    message: `Config '${key}' updated successfully`,
    data: config,
  });
});

exports.createConfig = asyncHandler(async (req, res) => {
  const config = await service.createConfig(req.body);

  return res.status(201).json({
    success: true,
    message: "Config created successfully",
    data: config,
  });
});

// ──────── Category Commissions ────────

exports.getAllCategoryCommissions = asyncHandler(async (req, res) => {
  const commissions = await service.getAllCategoryCommissions();

  return res.status(200).json({
    success: true,
    message: "Category commissions retrieved successfully",
    data: commissions,
  });
});

exports.upsertCategoryCommission = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { commissionRate } = req.body;

  const commission = await service.upsertCategoryCommission(
    parseInt(categoryId, 10),
    parseFloat(commissionRate)
  );

  return res.status(200).json({
    success: true,
    message: "Category commission updated successfully",
    data: commission,
  });
});

exports.deleteCategoryCommission = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  await service.deleteCategoryCommission(parseInt(categoryId, 10));

  return res.status(200).json({
    success: true,
    message: "Category commission removed successfully",
  });
});

// ──────── Public Config (for buyer/seller apps) ────────

exports.getPublicPricingConfig = asyncHandler(async (req, res) => {
  const [platformFee, codFee] = await Promise.all([
    service.getPlatformFee(),
    service.getCodFee(),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      shippingFee: 0,
      platformFee,
      codFee,
    },
  });
});

exports.getCalculatorConfig = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const [platformFee, builtInShippingFee, commissionRate] = await Promise.all([
    service.getPlatformFee(),
    service.getBuiltInShippingFee(),
    service.getCommissionRate(categoryId ? parseInt(categoryId, 10) : null),
  ]);

  return res.status(200).json({
    success: true,
    message: "Calculator config retrieved successfully",
    data: {
      platformFee,
      builtInShippingFee,
      commissionRate,
    },
  });
});
