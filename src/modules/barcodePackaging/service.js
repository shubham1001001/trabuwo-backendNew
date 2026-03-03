const dao = require("./dao");
const { NotFoundError } = require("../../utils/errors");

const createVendor = async (data) => {
  return await dao.createVendor(data);
};

const getVendorById = async (id) => {
  const vendor = await dao.getVendorById(id);
  if (!vendor) {
    throw new NotFoundError("Vendor not found");
  }
  return vendor;
};

const getVendorByPublicId = async (publicId) => {
  const vendor = await dao.getVendorByPublicId(publicId);
  if (!vendor) {
    throw new NotFoundError("Vendor not found");
  }
  return vendor;
};

const listVendors = async () => {
  return await dao.listVendors([
    "publicId",
    "name",
    "location",
    "imgS3Key",
    "pricePerPacket",
    "redirectUrl",
  ]);
};

const updateVendorById = async (id, data) => {
  const vendor = await dao.updateVendorById(id, data);
  if (!vendor) {
    throw new NotFoundError("Vendor not found");
  }
  return vendor;
};

const deleteVendorById = async (id) => {
  const deleted = await dao.deleteVendorById(id);
  if (!deleted) {
    throw new NotFoundError("Vendor not found");
  }
  return { message: "Vendor deleted successfully" };
};

module.exports = {
  createVendor,
  getVendorById,
  getVendorByPublicId,
  listVendors,
  updateVendorById,
  deleteVendorById,
};
