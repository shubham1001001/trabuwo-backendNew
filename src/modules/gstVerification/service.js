const axios = require("axios");
const config = require("config");
const dao = require("./dao");
const { getSellerOnboardingByUserId } = require("../sellerOnboarding/dao");
const { handleAxiosError } = require("../../utils/axiosError");
const {
  NotFoundError,
  ValidationError,
  ExternalServiceError,
} = require("../../utils/errors");

const GSTIN_CHECK_BASE_URL = "https://sheet.gstincheck.co.in";

const gstinAxios = axios.create({
  baseURL: GSTIN_CHECK_BASE_URL,
  timeout: 10000,
});

const parseGstDate = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  // Expected format from GSTIN_CHECK: DD/MM/YYYY
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
};

const mapIdTypeFromDealerType = (dty) => {
  if (dty === "Regular" || dty === "Composition") {
    return "GSTIN";
  }

  if (dty === "Unregistered Applicant") {
    return "EID";
  }

  throw new ValidationError(
    "Unsupported dealer type received from GST service",
    {
      dealerType: dty,
    }
  );
};

const normalizeGstData = (data) => {
  if (!data) {
    return {};
  }

  const pradr = data.pradr || {};
  const addr = pradr.addr || {};

  return {
    gstin: data.gstin || null,
    legalName: data.lgnm || null,
    tradeName: data.tradeNam || null,
    registrationDate: parseGstDate(data.rgdt),
    status: data.sts || null,
    taxpayerType: data.dty || null,
    einvoiceStatus: data.einvoiceStatus || null,
    principalAddressAdr: pradr.adr || null,
    principalAddressLoc: addr.loc || null,
    principalAddressPincode: addr.pncd || null,
    principalAddressState: addr.stcd || addr.st || null,
    principalAddressDistrict: addr.dst || null,
    principalAddressStreet: addr.bnm || null,
    principalAddressCity: addr.city || null,
  };
};

const toDto = (entity) => {
  if (!entity) {
    return null;
  }

  return {
    publicId: entity.publicId,
    idType: entity.idType,
    idValue: entity.idValue,
    gstin: entity.gstin,
    legalName: entity.legalName,
    tradeName: entity.tradeName,
    registrationDate: entity.registrationDate,
    status: entity.status,
    taxpayerType: entity.taxpayerType,
    einvoiceStatus: entity.einvoiceStatus,
    principalAddress: {
      adr: entity.principalAddressAdr,
      loc: entity.principalAddressLoc,
      pincode: entity.principalAddressPincode,
      state: entity.principalAddressState,
      district: entity.principalAddressDistrict,
      street: entity.principalAddressStreet,
      city: entity.principalAddressCity,
    },
  };
};

exports.verifyAndStoreForUser = async (userId, { idValue }) => {
  const sellerOnboarding = await getSellerOnboardingByUserId(userId);
  if (!sellerOnboarding) {
    throw new NotFoundError("Seller onboarding not found");
  }

  const apiKey = config.get("gst.gstinCheckApiKey");
  if (!apiKey) {
    throw new ExternalServiceError(
      "GSTIN_CHECK API key is not configured",
      "GSTIN_CHECK"
    );
  }

  let response;
  try {
    response = await gstinAxios.get(`/check/${apiKey}/${idValue}`);
  } catch (error) {
    handleAxiosError(
      error,
      "GSTIN_CHECK",
      "Failed to verify GST/EID with GSTIN_CHECK",
      ExternalServiceError
    );
  }

  const payload = response?.data;

  if (!payload) {
    throw new ExternalServiceError(
      "Empty response from GSTIN_CHECK",
      "GSTIN_CHECK"
    );
  }

  if (payload.flag === false) {
    if (payload.errorCode === "INVALID_GSTNUMBER") {
      throw new ValidationError(payload.message || "Invalid GSTIN Number.", {
        errorCode: payload.errorCode,
      });
    }

    if (payload.errorCode === "API_KEY_INVALID") {
      throw new ExternalServiceError(
        payload.message || "GSTIN_CHECK API key is invalid.",
        "GSTIN_CHECK",
        { errorCode: payload.errorCode }
      );
    }

    throw new ExternalServiceError(
      payload.message || "GSTIN_CHECK verification failed",
      "GSTIN_CHECK",
      {
        errorCode: payload.errorCode,
      }
    );
  }

  if (payload.flag !== true || !payload.data) {
    throw new ExternalServiceError(
      "GSTIN_CHECK response missing data",
      "GSTIN_CHECK",
      payload
    );
  }

  const idType = mapIdTypeFromDealerType(payload.data.dty);
  const normalized = normalizeGstData(payload.data);

  let existing = await dao.findBySellerOnboardingId(sellerOnboarding.id);

  if (!existing) {
    existing = await dao.create({
      sellerOnboardingId: sellerOnboarding.id,
      idType,
      idValue,
      ...normalized,
      rawData: payload.data,
    });
  } else {
    await dao.updateById(existing.id, {
      idType,
      idValue,
      ...normalized,
      rawData: payload.data,
    });

    existing = await dao.findBySellerOnboardingId(sellerOnboarding.id);
  }

  return toDto(existing);
};

exports.getForUser = async (userId) => {
  const sellerOnboarding = await getSellerOnboardingByUserId(userId);
  if (!sellerOnboarding) {
    throw new NotFoundError("Seller onboarding not found");
  }

  const existing = await dao.findBySellerOnboardingId(sellerOnboarding.id);

  if (!existing) {
    throw new NotFoundError("GST/EID verification not found");
  }

  return toDto(existing);
};
