const service = require("./service");
const { generatePresignedUrl } = require("../../services/s3");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await service.createVendor(req.body);
  return apiResponse.success(res, vendor, "Vendor created successfully", 201);
});

const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await service.getVendorById(req.params.id);
  return apiResponse.success(res, vendor, "Vendor retrieved successfully");
});

const getVendorByPublicId = asyncHandler(async (req, res) => {
  const vendor = await service.getVendorByPublicId(req.params.publicId);
  return apiResponse.success(res, vendor, "Vendor retrieved successfully");
});

const listVendors = asyncHandler(async (req, res) => {
  const vendors = await service.listVendors();
  return apiResponse.success(res, vendors, "Vendors retrieved successfully");
});

const updateVendorById = asyncHandler(async (req, res) => {
  const vendor = await service.updateVendorById(req.params.id, req.body);
  return apiResponse.success(res, vendor, "Vendor updated successfully");
});

const deleteVendorById = asyncHandler(async (req, res) => {
  const result = await service.deleteVendorById(req.params.id);
  return apiResponse.success(res, result, "Vendor deleted successfully");
});

const generatePresignedUrlForImage = asyncHandler(async (req, res) => {
  const { key, contentType } = req.body;
  const userId = req.user.id;

  const presignedData = await generatePresignedUrl(
    key,
    contentType,
    userId,
    "barcode_packaging"
  );
  return apiResponse.success(
    res,
    presignedData,
    "Presigned URL generated successfully"
  );
});

module.exports = {
  createVendor,
  getVendorById,
  getVendorByPublicId,
  listVendors,
  updateVendorById,
  deleteVendorById,
  generatePresignedUrlForImage,
};
