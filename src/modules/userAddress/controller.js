const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

exports.createAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const addressData = req.body;

  const address = await service.createAddress(userId, addressData);

  return apiResponse.success(
    res,
    {
      publicId: address.publicId,
      name: address.name,
      phoneNumber: address.phoneNumber,
      buildingNumber: address.buildingNumber,
      street: address.street,
      landmark: address.landmark,
      addressType: address.addressType,
      isDefault: address.isDefault,
    },
    "Address created successfully",
    201
  );
});

exports.getUserAddresses = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const addresses = await service.getUserAddresses(userId);

  return apiResponse.success(res, addresses, "Addresses retrieved successfully");
});

exports.getAddressById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { publicId } = req.params;

  const address = await service.getAddressById(userId, publicId);

  return apiResponse.success(res, address, "Address retrieved successfully");
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { publicId } = req.params;
  const updateData = req.body;

  const address = await service.updateAddress(userId, publicId, updateData);

  return apiResponse.success(
    res,
    {
      publicId: address.publicId,
      name: address.name,
      phoneNumber: address.phoneNumber,
      buildingNumber: address.buildingNumber,
      street: address.street,
      landmark: address.landmark,
      addressType: address.addressType,
      isDefault: address.isDefault,
      pincode: address.location.pincode,
      city: address.location.city,
      state: address.location.state,
    },
    "Address updated successfully"
  );
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { publicId } = req.params;

  await service.deleteAddress(userId, publicId);

  return apiResponse.success(res, null, "Address deleted successfully");
});

exports.setAsDefault = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { publicId } = req.params;

  const address = await service.setAsDefault(userId, publicId);

  return apiResponse.success(
    res,
    {
      publicId: address.publicId,
      isDefault: address.isDefault,
    },
    "Default address updated successfully"
  );
});
