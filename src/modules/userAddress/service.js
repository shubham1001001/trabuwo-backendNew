const dao = require("./dao");
const sequelize = require("../../config/database");
const { NotFoundError } = require("../../utils/errors");

exports.createAddress = async (userId, addressData) => {
  const { pincode, city, state, ...addressFields } = addressData;

  return await sequelize.transaction(async (t) => {
    let location = await dao.getLocationByPincode(pincode);
    if (!location) {
      location = await dao.createLocation(
        { pincode, city, state },
        { transaction: t }
      );
    }

    const existingAddresses = await dao.getUserAddressesByUserId(userId);
    const isFirstAddress = existingAddresses.length === 0;
    const shouldBeDefault = addressData.isDefault || isFirstAddress;

    if (shouldBeDefault && !isFirstAddress) {
      await dao.setDefaultAddress(userId, null, { transaction: t });
    }

    const address = await dao.createUserAddress(
      {
        ...addressFields,
        userId,
        locationId: location.id,
        isDefault: shouldBeDefault,
      },
      { transaction: t }
    );

    return address;
  });
};

exports.getUserAddresses = async (userId) => {
  const addresses = await dao.getUserAddressesByUserId(userId);
  return addresses.map((address) => ({
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
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  }));
};

exports.getAddressById = async (userId, publicId) => {
  const address = await dao.getUserAddressById(publicId);
  if (!address) {
    throw new NotFoundError("Address not found");
  }
  if (address.userId !== userId) {
    throw new NotFoundError("Address not found");
  }

  return {
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
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
};

exports.updateAddress = async (userId, publicId, updateData) => {
  const address = await dao.getUserAddressById(publicId);
  if (!address) {
    throw new NotFoundError("Address not found");
  }
  if (address.userId !== userId) {
    throw new NotFoundError("Address not found");
  }

  const { pincode, city, state, ...addressFields } = updateData;

  return await sequelize.transaction(async (t) => {
    let locationId = address.locationId;

    if (pincode || city || state) {
      const newPincode = pincode || address.location.pincode;
      const newCity = city || address.location.city;
      const newState = state || address.location.state;

      let location = await dao.getLocationByPincode(newPincode);
      if (!location) {
        location = await dao.createLocation(
          { pincode: newPincode, city: newCity, state: newState },
          { transaction: t }
        );
      }
      locationId = location.id;
    }

    if (updateData.isDefault === true) {
      await dao.setDefaultAddress(userId, null, { transaction: t });
    }

    await dao.updateUserAddress(
      address.id,
      {
        ...addressFields,
        locationId,
      },
      { transaction: t }
    );

    return await dao.getUserAddressByPrimaryKey(address.id, {
      transaction: t,
    });
  });
};

exports.deleteAddress = async (userId, publicId) => {
  const address = await dao.getUserAddressById(publicId);
  if (!address) {
    throw new NotFoundError("Address not found");
  }
  if (address.userId !== userId) {
    throw new NotFoundError("Address not found");
  }

  return await sequelize.transaction(async (t) => {
    await dao.deleteUserAddress(address.id, { transaction: t });

    if (address.isDefault) {
      const remainingAddresses = await dao.getUserAddressesByUserId(userId);
      if (remainingAddresses.length > 0) {
        await dao.setDefaultAddress(userId, remainingAddresses[0].id, {
          transaction: t,
        });
      }
    }
  });
};

exports.setAsDefault = async (userId, publicId) => {
  const address = await dao.getUserAddressById(publicId);
  if (!address) {
    throw new NotFoundError("Address not found");
  }
  if (address.userId !== userId) {
    throw new NotFoundError("Address not found");
  }

  return await sequelize.transaction(async (t) => {
    await dao.setDefaultAddress(userId, address.id, { transaction: t });
    return await dao.getUserAddressByPrimaryKey(address.id);
  });
};
