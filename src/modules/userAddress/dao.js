const { UserAddress } = require("./model");
const { Location } = require("../sellerOnboarding/model");

exports.createUserAddress = (data, options = {}) =>
  UserAddress.create(data, options);

exports.getUserAddressesByUserId = (userId) =>
  UserAddress.findAll({
    where: { userId },
    include: [
      {
        model: Location,
        as: "location",
        attributes: ["pincode", "city", "state"],
      },
    ],
    order: [
      ["isDefault", "DESC"],
      ["createdAt", "DESC"],
    ],
  });

exports.getUserAddressById = (publicId) =>
  UserAddress.findOne({
    where: { publicId },
    include: [
      {
        model: Location,
        as: "location",
        attributes: ["pincode", "city", "state"],
      },
    ],
  });

exports.getUserAddressByPrimaryKey = (id, options = {}) =>
  UserAddress.findByPk(id, {
    include: [
      {
        model: Location,
        as: "location",
        attributes: ["pincode", "city", "state"],
      },
    ],
    ...options,
  });

exports.updateUserAddress = (id, data, options = {}) =>
  UserAddress.update(data, { where: { id }, ...options });

exports.deleteUserAddress = (id, options = {}) =>
  UserAddress.destroy({ where: { id }, ...options });

exports.setDefaultAddress = (userId, addressId, options = {}) =>
  UserAddress.update(
    { isDefault: false },
    { where: { userId }, ...options }
  ).then(() =>
    UserAddress.update(
      { isDefault: true },
      { where: { id: addressId, userId }, ...options }
    )
  );

exports.getDefaultAddress = (userId) =>
  UserAddress.findOne({
    where: { userId, isDefault: true },
    include: [
      {
        model: Location,
        as: "location",
        attributes: ["pincode", "city", "state"],
      },
    ],
  });

exports.createLocation = (data, options = {}) => Location.create(data, options);

exports.getLocationByPincode = (pincode) =>
  Location.findOne({ where: { pincode } });
