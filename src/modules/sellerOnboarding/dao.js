const {
  SellerOnboarding,
  TaxIdentity,
  Store,
  Address,
  BankDetails,
  Location,
  SellerProgress,
} = require("./model");
const { User } = require("../auth/model");

exports.createSellerOnboarding = (data, options = {}) =>
  SellerOnboarding.create(data, options);
exports.getSellerOnboardingById = (id) => SellerOnboarding.findByPk(id);
exports.getSellerOnboardingByUserId = (userId) =>
  SellerOnboarding.findOne({ where: { userId } });
exports.updateCurrentStepByUserId = (userId, currentStep, options = {}) =>
  SellerOnboarding.update({ currentStep }, { where: { userId }, ...options });
exports.updateCurrentStepById = (id, currentStep, options = {}) =>
  SellerOnboarding.update({ currentStep }, { where: { id }, ...options });
exports.updateSellerOnboardingById = (id, data, options = {}) =>
  SellerOnboarding.update(data, { where: { id }, ...options });

exports.createTaxIdentity = (data, options = {}) =>
  TaxIdentity.create(data, options);
exports.getTaxIdentitiesByOnboardingId = (sellerOnboardingId) =>
  TaxIdentity.findOne({ where: { sellerOnboardingId } });

exports.createBankDetails = (data, options = {}) =>
  BankDetails.create(data, options);
exports.getBankDetailsByOnboardingId = (sellerOnboardingId) =>
  BankDetails.findOne({ where: { sellerOnboardingId } });

exports.createStore = (data, options = {}) => Store.create(data, options);
exports.getStoresByOnboardingId = (sellerOnboardingId) =>
  Store.findOne({ where: { sellerOnboardingId } });
exports.getStoreById = (id) => Store.findByPk(id);

exports.createAddress = (data, options = {}) => Address.create(data, options);
exports.getAddressBySellerOnboardingId = (sellerOnboardingId) =>
  Address.findOne({
    where: { sellerOnboardingId },
    include: [
      {
        model: Location,
        as: "Location",
        required: true,
      },
    ],
  });

exports.createLocation = (data, options = {}) => Location.create(data, options);
exports.getLocationById = (id) => Location.findByPk(id);
exports.getLocationByPincode = (pincode) =>
  Location.findOne({ where: { pincode } });

exports.getSellerProgressByUserId = (userId) =>
  SellerProgress.findOne({ where: { userId } });

exports.createSellerProgress = (data, options = {}) =>
  SellerProgress.create(data, options);

exports.updateSellerProgress = (userId, data, options = {}) =>
  SellerProgress.update(data, { where: { userId }, ...options });

exports.getSellerOnboardingWithAllDataByUserId = (userId) =>
  SellerOnboarding.findOne({
    where: { userId },
    include: [
      {
        model: Store,
        as: "store",
        required: false,
      },
      {
        model: Address,
        as: "address",
        required: false,
        include: [
          {
            model: Location,
            as: "Location",
            required: false,
          },
        ],
      },
      {
        model: TaxIdentity,
        as: "taxIdentities",
        required: false,
      },
      {
        model: User,
        as: "user",
        required: false,
        attributes: ["id", "mobile", "email"],
      },
    ],
  });


  exports.getStoreInfoByOnboardingId = (sellerOnboardingId) =>
  Store.findOne({
    where: { sellerOnboardingId },
  });