const brandService = require("./service");
const apiResponse = require("../../utils/apiResponse");

/**
 * CREATE BRAND
 */
exports.create = async (req, res) => {
  const brand = await brandService.createBrand(req.body, req.user);

  return apiResponse.success(
    res,
    brand,
    "Brand created successfully",
    201
  );
};

/**
 * GET BRAND BY PUBLIC ID
 */
exports.getByPublicId = async (req, res) => {
  const { publicId } = req.params;

  const brand = await brandService.getBrandByPublicId(publicId);

  return apiResponse.success(
    res,
    brand,
    "Brand fetched successfully"
  );
};

/**
 * UPDATE BRAND
 */
exports.update = async (req, res) => {
  const { publicId } = req.params;

  const brand = await brandService.updateBrand(
    publicId,
    req.body,
    req.user
  );

  return apiResponse.success(
    res,
    brand,
    "Brand updated successfully"
  );
};

/**
 * DELETE BRAND
 */
exports.remove = async (req, res) => {
  const { publicId } = req.params;

  await brandService.deleteBrand(publicId);

  return apiResponse.success(
    res,
    null,
    "Brand deleted successfully"
  );
};

/**
 * LIST BRANDS
 */
exports.list = async (req, res) => {
  const result = await brandService.listBrands(req.query);

  return apiResponse.success(
    res,
    result,
    "Brands fetched successfully"
  );
};


//list of active brands activeBrandList
exports.activeBrandList = async (req, res) => {
  const result = await brandService.listActiveBrands(req.query);

  return apiResponse.success(
    res,
    result,
    "Active Brands fetched successfully"
  );
};
