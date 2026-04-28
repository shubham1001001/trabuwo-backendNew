const dao = require("./dao");
const { NotFoundError, ValidationError } = require("../../utils/errors");

// ──────── In-Memory Cache (TTL: 5 minutes) ────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.value;
  }
  cache.delete(key);
  return null;
}

function setCache(key, value) {
  cache.set(key, { value, timestamp: Date.now() });
}

function clearCache() {
  cache.clear();
}

// ──────── Config Value Helpers ────────

async function getConfigValue(key, defaultValue = null) {
  // Check cache first
  const cached = getCached(`config:${key}`);
  if (cached !== null) return cached;

  const config = await dao.getConfigByKey(key);
  if (!config) return defaultValue;

  let parsedValue;
  switch (config.valueType) {
    case "number":
    case "percentage":
      parsedValue = parseFloat(config.value);
      break;
    case "boolean":
      parsedValue = config.value === "true";
      break;
    case "json":
      parsedValue = JSON.parse(config.value);
      break;
    default:
      parsedValue = config.value;
  }

  setCache(`config:${key}`, parsedValue);
  return parsedValue;
}

// ──────── Public API: Pricing ────────

exports.getShippingFee = async () => {
  return await getConfigValue("shipping_fee", 80);
};

exports.getBuiltInShippingFee = async () => {
  return await getConfigValue("builtin_shipping_fee", 70);
};

exports.getPlatformFee = async () => {
  return await getConfigValue("platform_fee", 15);
};

exports.getCodFee = async () => {
  return await getConfigValue("cod_fee", 20);
};

exports.getLogisticsCost = async () => {
  return await getConfigValue("logistics_cost", 60);
};

// ──────── Public API: Commission ────────

exports.getDefaultCommissionRate = async () => {
  const rate = await getConfigValue("default_commission_rate", 5);
  return rate / 100; // Convert percentage to decimal
};

exports.getCommissionRate = async (categoryId) => {
  if (categoryId) {
    // Check cache
    const cacheKey = `commission:${categoryId}`;
    const cached = getCached(cacheKey);
    if (cached !== null) return cached;

    const categoryCommission = await dao.getCategoryCommission(categoryId);
    if (categoryCommission) {
      const rate = parseFloat(categoryCommission.commissionRate) / 100;
      setCache(cacheKey, rate);
      return rate;
    }
  }

  // Fallback to default
  return await exports.getDefaultCommissionRate();
};

// ──────── Public API: Reseller Limits ────────

exports.getResellerLimits = async () => {
  const minMargin = await getConfigValue("min_reseller_margin", 20);
  const maxMultiplier = await getConfigValue("max_reseller_margin_multiplier", 2);
  return { minMargin, maxMultiplier };
};

// ──────── Public API: Payout Config ────────

exports.getPayoutConfig = async () => {
  const delayDays = await getConfigValue("payout_delay_days", 7);
  const minSellerWithdrawal = await getConfigValue("min_seller_withdrawal", 500);
  const minResellerWithdrawal = await getConfigValue("min_reseller_withdrawal", 200);
  return { delayDays, minSellerWithdrawal, minResellerWithdrawal };
};

// ──────── Public API: PG Cost ────────

exports.getPgCostPercentage = async () => {
  return await getConfigValue("pg_cost_percentage", 2);
};

exports.getCodPgCost = async () => {
  return await getConfigValue("cod_pg_cost", 20);
};

// ──────── Admin Operations ────────

exports.getAllConfigs = async (category) => {
  return await dao.getAllConfigs(category);
};

exports.updateConfig = async (key, value, description) => {
  const config = await dao.getConfigByKey(key);
  if (!config) {
    throw new NotFoundError(`Config key '${key}' not found`);
  }

  // Validate value based on type
  switch (config.valueType) {
    case "number":
    case "percentage":
      if (isNaN(parseFloat(value))) {
        throw new ValidationError(`Value for '${key}' must be a number`);
      }
      break;
    case "boolean":
      if (value !== "true" && value !== "false") {
        throw new ValidationError(`Value for '${key}' must be 'true' or 'false'`);
      }
      break;
    case "json":
      try {
        JSON.parse(value);
      } catch {
        throw new ValidationError(`Value for '${key}' must be valid JSON`);
      }
      break;
  }

  const updateData = { value: String(value) };
  if (description !== undefined) {
    updateData.description = description;
  }

  const result = await dao.upsertConfig(key, updateData);

  // Clear cache for this key
  cache.delete(`config:${key}`);

  return result;
};

exports.createConfig = async (data) => {
  const { key, value, valueType, description, category } = data;

  const existing = await dao.getConfigByKey(key);
  if (existing) {
    throw new ValidationError(`Config key '${key}' already exists`);
  }

  return await dao.upsertConfig(key, {
    value: String(value),
    valueType: valueType || "number",
    description,
    category: category || "general",
  });
};

// ──────── Category Commission Admin ────────

exports.getAllCategoryCommissions = async () => {
  return await dao.getAllCategoryCommissions();
};

exports.upsertCategoryCommission = async (categoryId, commissionRate) => {
  if (commissionRate < 0 || commissionRate > 100) {
    throw new ValidationError("Commission rate must be between 0 and 100");
  }

  const result = await dao.upsertCategoryCommission(categoryId, commissionRate);

  // Clear cache
  cache.delete(`commission:${categoryId}`);

  return result;
};

exports.deleteCategoryCommission = async (categoryId) => {
  await dao.deleteCategoryCommission(categoryId);
  cache.delete(`commission:${categoryId}`);
};

// ──────── Seed Default Configs ────────

exports.seedDefaults = async () => {
  const defaults = [
    // Pricing
    { key: "shipping_fee", value: "80", valueType: "number", description: "Shipping fee charged to buyer (₹)", category: "pricing" },
    { key: "builtin_shipping_fee", value: "70", valueType: "number", description: "Standard shipping fee built into product price (₹)", category: "pricing" },
    { key: "platform_fee", value: "15", valueType: "number", description: "Platform fee charged to buyer (₹)", category: "pricing" },
    { key: "cod_fee", value: "20", valueType: "number", description: "COD fee charged to buyer (₹)", category: "pricing" },

    // Commission
    { key: "default_commission_rate", value: "5", valueType: "percentage", description: "Default commission rate (%) charged on listing price", category: "commission" },

    // Logistics
    { key: "logistics_cost", value: "60", valueType: "number", description: "Actual logistics cost paid to delivery partner (₹)", category: "logistics" },

    // Payment Gateway
    { key: "pg_cost_percentage", value: "2", valueType: "percentage", description: "Payment gateway fee for prepaid (% of total)", category: "payment_gateway" },
    { key: "cod_pg_cost", value: "20", valueType: "number", description: "Payment gateway fee for COD orders (₹)", category: "payment_gateway" },

    // Reseller
    { key: "min_reseller_margin", value: "20", valueType: "number", description: "Minimum reseller margin (₹)", category: "reseller" },
    { key: "max_reseller_margin_multiplier", value: "2", valueType: "number", description: "Maximum reseller price = LP × multiplier", category: "reseller" },

    // Payout
    { key: "payout_delay_days", value: "7", valueType: "number", description: "Days after delivery before payout (T+N)", category: "payout" },
    { key: "min_seller_withdrawal", value: "500", valueType: "number", description: "Minimum seller withdrawal amount (₹)", category: "payout" },
    { key: "min_reseller_withdrawal", value: "200", valueType: "number", description: "Minimum reseller withdrawal amount (₹)", category: "payout" },

    // Return
    { key: "return_shipping_cost", value: "60", valueType: "number", description: "Reverse logistics cost per return (₹)", category: "returns" },
    { key: "max_free_returns_per_month", value: "2", valueType: "number", description: "Maximum free returns per buyer per month", category: "returns" },
    { key: "high_rto_threshold", value: "20", valueType: "percentage", description: "RTO rate above which seller bears full cost (%)", category: "returns" },
  ];

  await dao.bulkUpsertConfigs(defaults);
};

exports.clearCache = clearCache;
