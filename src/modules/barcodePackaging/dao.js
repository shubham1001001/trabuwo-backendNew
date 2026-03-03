const barcodePackagingVendor = require("./model");

const createVendor = async (data) => {
  return await barcodePackagingVendor.create(data);
};

const getVendorById = async (id, attributes = null) => {
  const options = {
    where: { id },
  };

  if (attributes) {
    options.attributes = attributes;
  }

  return await barcodePackagingVendor.findOne(options);
};

const getVendorByPublicId = async (publicId, attributes = null) => {
  const options = {
    where: { publicId },
  };

  if (attributes) {
    options.attributes = attributes;
  }

  return await barcodePackagingVendor.findOne(options);
};

const listVendors = async (attributes = null) => {
  const options = {};

  if (attributes) {
    options.attributes = attributes;
  }

  return await barcodePackagingVendor.findAll(options);
};

const updateVendorById = async (id, data) => {
  const allowedAttributes = [
    "name",
    "location",
    "imgS3Key",
    "pricePerPacket",
    "redirectUrl",
  ];
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedAttributes.includes(key))
  );

  const [updatedRowsCount, [updatedVendor]] =
    await barcodePackagingVendor.update(filteredData, {
      where: { id },
      returning: true,
    });

  if (updatedRowsCount === 0) {
    return null;
  }

  return updatedVendor;
};

const deleteVendorById = async (id) => {
  const deletedRowsCount = await barcodePackagingVendor.destroy({
    where: { id },
  });

  return deletedRowsCount > 0;
};

module.exports = {
  createVendor,
  getVendorById,
  getVendorByPublicId,
  listVendors,
  updateVendorById,
  deleteVendorById,
};
