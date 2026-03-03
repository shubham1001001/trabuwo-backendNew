const { GstVerification } = require("./model");

const DEFAULT_ATTRIBUTES = [
  "id",
  "publicId",
  "sellerOnboardingId",
  "idType",
  "idValue",
  "gstin",
  "legalName",
  "tradeName",
  "registrationDate",
  "status",
  "taxpayerType",
  "einvoiceStatus",
  "principalAddressAdr",
  "principalAddressLoc",
  "principalAddressPincode",
  "principalAddressState",
  "principalAddressDistrict",
  "principalAddressStreet",
  "principalAddressCity",
  "rawData",
];

exports.findBySellerOnboardingId = (sellerOnboardingId, options = {}) => {
  return GstVerification.findOne({
    where: { sellerOnboardingId },
    attributes: DEFAULT_ATTRIBUTES,
    ...options,
  });
};

exports.findBySellerOnboardingIdAndType = (
  sellerOnboardingId,
  idType,
  options = {}
) => {
  return GstVerification.findOne({
    where: { sellerOnboardingId, idType },
    attributes: DEFAULT_ATTRIBUTES,
    ...options,
  });
};

exports.create = (data, options = {}) =>
  GstVerification.create(data, { ...options, returning: true });

exports.updateById = (id, data, options = {}) =>
  GstVerification.update(data, { where: { id }, ...options });

