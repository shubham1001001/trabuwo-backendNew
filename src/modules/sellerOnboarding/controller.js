const service = require("./service");
const s3Service = require("../../services/s3");
const { ConflictError, NotFoundError } = require("../../utils/errors");
const apiResponse = require("../../utils/apiResponse");

exports.createSellerOnboarding = async (req, res) => {
  const existingOnboarding = await service.getSellerOnboardingByUserId(
    req.user.id
  );
  if (existingOnboarding) {
    throw new ConflictError("Seller onboarding already exists for this user");
  }

  const onboarding = await service.createSellerOnboarding({
    userId: req.user.id,
  });
  return apiResponse.success(res, onboarding, "Seller onboarding created", 201);
};

exports.getSellerOnboardingByUserId = async (req, res) => {
  const onboarding = await service.getSellerOnboardingByUserId(req.user.id);
  if (!onboarding) throw new NotFoundError("Seller onboarding not found");
  return apiResponse.success(res, onboarding);
};

exports.createTaxIdentity = async (req, res) => {
  const taxIdentity = await service.createTaxIdentityWithOnboardingUpdate(
    req.user.id,
    req.body
  );

  return apiResponse.success(
    res,
    taxIdentity,
    "Tax identity created successfully",
    201
  );
};

exports.getTaxIdentitiesByUserId = async (req, res) => {
  const onboarding = await service.getSellerOnboardingByUserId(req.user.id);
  if (!onboarding) throw new NotFoundError("Seller onboarding not found");
  const taxIdentities = await service.getTaxIdentitiesByOnboardingId(
    onboarding.id
  );
  return apiResponse.success(res, taxIdentities);
};

exports.createBankDetails = async (req, res) => {
  const bankDetails = await service.createBankDetailsWithOnboardingUpdate(
    req.user.id,
    req.body
  );
  return apiResponse.success(res, bankDetails, "Bank details created", 201);
};

exports.getBankDetailsByOnboardingId = async (req, res) => {
  const onboarding = await service.getSellerOnboardingByUserId(req.user.id);
  if (!onboarding) throw new NotFoundError("Seller onboarding not found");
  const bankDetails = await service.getBankDetailsByOnboardingId(onboarding.id);
  return apiResponse.success(res, bankDetails);
};

exports.createLocation = async (req, res) => {
  const location = await service.createLocation(req.body);
  return apiResponse.success(res, location, "Location created", 201);
};
exports.getLocationById = async (req, res) => {
  const location = await service.getLocationById(req.params.id);
  if (!location) throw new NotFoundError("Location not found");
  return apiResponse.success(res, location);
};

exports.createStore = async (req, res) => {
  const store = await service.createStoreWithOnboardingUpdate(
    req.user.id,
    req.body
  );

  return apiResponse.success(res, store, "Store created successfully", 201);
};

exports.getStoresByOnboardingId = async (req, res) => {
  const stores = await service.getStoresByOnboardingId(
    req.params.sellerOnboardingId
  );
  return apiResponse.success(res, stores);
};
exports.getStoreById = async (req, res) => {
  const store = await service.getStoreById(req.params.id);
  if (!store) throw new NotFoundError("Store not found");
  return apiResponse.success(res, store);
};

exports.createAddress = async (req, res) => {
  const address = await service.createAddressWithOnboardingUpdate(
    req.user.id,
    req.body
  );

  return apiResponse.success(res, address, "Address created successfully", 201);
};

exports.getAddressByUserId = async (req, res) => {
  const onboarding = await service.getSellerOnboardingByUserId(req.user.id);
  if (!onboarding) throw new NotFoundError("Seller onboarding not found");
  const address = await service.getAddressBySellerOnboardingId(onboarding.id);
  if (!address) throw new NotFoundError("Address not found");
  return apiResponse.success(res, address);
};

exports.generatePresignedUrl = async (req, res) => {
  const { fileName, contentType } = req.body;
  const userId = req.user.id;
  const presignedUrl = await s3Service.generatePresignedUrl(
    fileName,
    contentType,
    userId,
    "e-signatures"
  );
  return apiResponse.success(res, presignedUrl);
};

exports.updateBusinessType = async (req, res) => {
  const result = await service.updateBusinessType(
    req.user.id,
    req.body.businessType
  );
  return apiResponse.success(res, result, "Business type updated successfully");
};

exports.getSellerProgress = async (req, res) => {
  const progress = await service.getSellerProgress(req.user.id);
  return apiResponse.success(res, progress);
};

exports.updateBankDetails = async (req, res) => {
  const bankDetails = await service.updateBankDetails(req.user.id, req.body);
  return apiResponse.success(
    res,
    bankDetails,
    "Bank details updated successfully"
  );
};

exports.addPickupLocation = async (req, res) => {
  const result = await service.addPickupLocationToShiprocket(req.user.id);
  return apiResponse.success(
    res,
    result,
    "Pickup location added to Shiprocket successfully"
  );
};
