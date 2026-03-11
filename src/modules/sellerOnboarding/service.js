const dao = require("./dao");
const sequelize = require("../../config/database");
const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../../utils/errors");
const { TaxIdentity, BankDetails, Store, Address } = require("./model");
const { Role, UserRole } = require("../auth/model");
const catalogueDao = require("../catalogue/dao");
const orderDao = require("../order/dao");
const shiprocketService = require("../shiprocket/service");

exports.createSellerOnboarding = (data) => dao.createSellerOnboarding(data);
exports.getSellerOnboardingById = (id) => dao.getSellerOnboardingById(id);
exports.getSellerOnboardingByUserId = (userId) =>
  dao.getSellerOnboardingByUserId(userId);
exports.updateSellerOnboardingById = (id, data) =>
  dao.updateSellerOnboardingById(id, data);

exports.createTaxIdentity = (data) => dao.createTaxIdentity(data);
exports.getTaxIdentitiesByOnboardingId = (sellerOnboardingId) =>
  dao.getTaxIdentitiesByOnboardingId(sellerOnboardingId);

exports.createBankDetails = (data) => dao.createBankDetails(data);
exports.getBankDetailsByOnboardingId = (sellerOnboardingId) =>
  dao.getBankDetailsByOnboardingId(sellerOnboardingId);

exports.createStore = (data) => dao.createStore(data);
exports.getStoresByOnboardingId = (sellerOnboardingId) =>
  dao.getStoresByOnboardingId(sellerOnboardingId);
exports.getStoreById = (id) => dao.getStoreById(id);

exports.createAddress = (data) => dao.createAddress(data);
exports.getAddressBySellerOnboardingId = (sellerOnboardingId) =>
  dao.getAddressBySellerOnboardingId(sellerOnboardingId);

exports.createLocation = (data) => dao.createLocation(data);
exports.getLocationById = (id) => dao.getLocationById(id);
exports.getLocationByPincode = (pincode) => dao.getLocationByPincode(pincode);

exports.createTaxIdentityWithOnboardingUpdate = async (
  userId,
  taxIdentityData
) => {
  return await sequelize.transaction(async (t) => {
    const existingOnboarding = await this.getSellerOnboardingByUserId(userId, {
      transaction: t,
      include: [
        {
          model: TaxIdentity,
          as: "taxIdentities",
        },
      ],
    });

    if (!existingOnboarding) {
      throw new NotFoundError("Seller onboarding not found");
    }

    if (existingOnboarding?.taxIdentities?.length > 0) {
      throw new ConflictError("Tax identity already exists for this user");
    }

    const taxIdentity = await this.createTaxIdentity(
      {
        ...taxIdentityData,
        sellerOnboardingId: existingOnboarding?.id,
      },
      { transaction: t }
    );

    await this.updateSellerOnboardingById(
      existingOnboarding.id,
      { currentStep: "ADDRESS" },
      { transaction: t }
    );

    return taxIdentity;
  });
};

exports.createBankDetailsWithOnboardingUpdate = async (
  userId,
  bankDetailsData
) => {
  return await sequelize.transaction(async (t) => {
    const existingOnboarding = await this.getSellerOnboardingByUserId(userId, {
      transaction: t,
      include: [
        {
          model: BankDetails,
          as: "bankDetails",
        },
      ],
    });

    if (!existingOnboarding) {
      throw new NotFoundError("Seller onboarding not found");
    }

    if (existingOnboarding?.bankDetails?.length > 0) {
      throw new ConflictError("Bank details already exist for this user");
    }

    const bankDetails = await this.createBankDetails(
      {
        ...bankDetailsData,
        sellerOnboardingId: existingOnboarding.id,
      },
      { transaction: t }
    );

    await this.updateSellerOnboardingById(
      existingOnboarding.id,
      { currentStep: "STORE_INFO" },
      { transaction: t }
    );
    return bankDetails;
  });
};

exports.createStoreWithOnboardingUpdate = async (userId, storeData) => {
  return await sequelize.transaction(async (t) => {
    const existingOnboarding = await this.getSellerOnboardingByUserId(userId, {
      transaction: t,
      include: [
        {
          model: Store,
          as: "stores",
        },
      ],
    });

    if (!existingOnboarding) {
      throw new NotFoundError("Seller onboarding not found");
    }

    if (existingOnboarding?.stores?.length > 0) {
      throw new ConflictError("Store already exists for this user");
    }

    const store = await this.createStore(
      {
        ...storeData,
        sellerOnboardingId: existingOnboarding.id,
      },
      { transaction: t }
    );

    await this.updateSellerOnboardingById(
      existingOnboarding.id,
      { currentStep: "COMPLETED" },
      { transaction: t }
    );

    const sellerRole = await Role.findOne({
      where: { name: "seller" },
      transaction: t,
    });
    if (sellerRole) {
      await UserRole.findOrCreate({
        where: { userId, roleId: sellerRole.id },
        defaults: { userId, roleId: sellerRole.id },
        transaction: t,
      });
    }

    return store;
  });
};

exports.createAddressWithOnboardingUpdate = async (userId, addressData) => {
  return await sequelize.transaction(async (t) => {
    const { pincode, city, state, ...addressFields } = addressData;

    let location = await this.getLocationByPincode(pincode);
    if (!location) {
      location = await this.createLocation(
        { pincode, city, state },
        { transaction: t }
      );
    }

    const existingOnboarding = await this.getSellerOnboardingByUserId(userId, {
      transaction: t,
      include: [
        {
          model: Address,
          as: "address",
        },
      ],
    });

    if (!existingOnboarding) {
      throw new NotFoundError("Seller onboarding not found");
    }

    if (existingOnboarding.address) {
      throw new ConflictError("Address already exists for this user");
    }

    const address = await this.createAddress(
      {
        ...addressFields,
        sellerOnboardingId: existingOnboarding.id,
        locationId: location.id,
      },
      { transaction: t }
    );

    await this.updateSellerOnboardingById(
      existingOnboarding.id,
      { currentStep: "BANK_DETAILS" },
      { transaction: t }
    );

    return address;
  });
};

exports.updateBusinessType = async (userId, businessType) => {
  const existingOnboarding = await this.getSellerOnboardingByUserId(userId);

  if (!existingOnboarding) {
    throw new NotFoundError("Seller onboarding not found");
  }

  await this.updateSellerOnboardingById(existingOnboarding.id, {
    businessType,
  });

  return { businessType };
};

exports.getSellerProgress = async (userId) => {
  let progress = await dao.getSellerProgressByUserId(userId);

  if (!progress) {
    progress = await dao.createSellerProgress({
      userId,
      catalogUploaded: false,
      catalogGoLive: false,
      firstOrderReceived: false,
    });
  }

  const needCatalogUploaded = !progress.catalogUploaded;
  const needCatalogGoLive = !progress.catalogGoLive;
  const needFirstOrder = !progress.firstOrderReceived;

  const [catalogUploadedCount, catalogGoLiveCount, firstOrderCount] =
    await Promise.all([
      needCatalogUploaded ? catalogueDao.countByUserId(userId) : 0,
      needCatalogGoLive
        ? catalogueDao.countByUserIdAndStatus(userId, "qc_passed")
        : 0,
      needFirstOrder ? orderDao.countBySellerId(userId) : 0,
    ]);

  const updates = {};
  if (needCatalogUploaded) updates.catalogUploaded = catalogUploadedCount > 0;
  if (needCatalogGoLive) updates.catalogGoLive = catalogGoLiveCount > 0;
  if (needFirstOrder) updates.firstOrderReceived = firstOrderCount > 0;

  if (Object.keys(updates).length > 0) {
    updates.lastCheckedAt = new Date();
    await dao.updateSellerProgress(userId, updates);
    progress = await dao.getSellerProgressByUserId(userId);
  }

  return {
    steps: [
      { name: "Upload Catalog", completed: progress.catalogUploaded },
      { name: "Catalogs Go Live", completed: progress.catalogGoLive },
      { name: "Get First Order", completed: progress.firstOrderReceived },
    ],
  };
};

exports.updateBankDetails = async (userId, bankDetailsData) => {
  const existingOnboarding = await this.getSellerOnboardingByUserId(userId);

  if (!existingOnboarding) {
    throw new NotFoundError("Seller onboarding not found");
  }

  if (existingOnboarding.currentStep !== "COMPLETED") {
    throw new ConflictError(
      "Bank details can only be updated when onboarding is completed"
    );
  }

  const existingBankDetails = await this.getBankDetailsByOnboardingId(
    existingOnboarding.id
  );

  if (!existingBankDetails) {
    throw new NotFoundError(
      "Bank details not found. Please create bank details first."
    );
  }

  await existingBankDetails.update(bankDetailsData);
  return existingBankDetails;
};

exports.addPickupLocationToShiprocket = async (userId) => {
  const sellerOnboarding = await dao.getSellerOnboardingWithAllDataByUserId(
    userId
  );
  if (!sellerOnboarding) {
    throw new NotFoundError("Seller onboarding not found");
  }

  const store = sellerOnboarding.store;
  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const address = Array.isArray(sellerOnboarding.address)
    ? sellerOnboarding.address[0]
    : sellerOnboarding.address;
  if (!address || !address.Location) {
    throw new NotFoundError("Address with location not found");
  }

  const user = sellerOnboarding.user;
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!user.mobile) {
    throw new ValidationError("User mobile number is required");
  }

  const taxIdentities = sellerOnboarding.taxIdentities || [];
  const taxIdentity = Array.isArray(taxIdentities)
    ? taxIdentities.find((ti) => ti.type === "GST_NUMBER")
    : null;

  const pickupLocation = store.email.substring(0, 36);
  const fullAddress = `${address.buildingNumber || ""} ${
    address.street || ""
  }`.trim();
  const addressLine =
    fullAddress.length > 80 ? fullAddress.substring(0, 80) : fullAddress;

  const phoneNumber = user.mobile.replace(/\D/g, "");
  const phone = parseInt(phoneNumber, 10);
  if (isNaN(phone)) {
    throw new ValidationError("Invalid mobile number format");
  }

  const pinCode = parseInt(address.Location.pincode, 10);
  if (isNaN(pinCode)) {
    throw new ValidationError("Invalid pincode format");
  }

  const pickupLocationData = {
    pickup_location: pickupLocation,
    name: store.ownerFullName,
    email: store.email,
    phone: phone,
    address: addressLine,
    address_2: address.landmark || "",
    city: address.Location.city,
    state: address.Location.state,
    country: "India",
    pin_code: pinCode,
  };

  if (taxIdentity && taxIdentity.type === "GST_NUMBER") {
    pickupLocationData.gstin = taxIdentity.value;
  }

  const response = await shiprocketService.addPickupLocation(
    pickupLocationData
  );

  return response;
};


exports.getAdminSellerDetails = async (onboardingId) => {
  const seller = await dao.getSellerOnboardingById(onboardingId);
  if (!seller) return null;

  const taxIdentity = await dao.getTaxIdentitiesByOnboardingId(onboardingId);
  const bankDetails = await dao.getBankDetailsByOnboardingId(onboardingId);
  const storeInfo = await dao.getStoreInfoByOnboardingId(onboardingId);

  return {
    seller,
    taxIdentity,
    bankDetails,
    storeInfo,
  };
};