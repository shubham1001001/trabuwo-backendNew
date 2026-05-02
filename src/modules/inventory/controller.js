const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");
const service = require("./service");

class InventoryController {
  getCataloguesWithProducts = asyncHandler(async (req, res) => {
    const {
      status,
      sortBy,
      stockFilter,
      blockReasonFilter,
      catalogueId,
      categoryId,
      page,
      limit,
    } = req.query;
    const userId = req.user.id;

    const filters = {
      status,
      sortBy,
      stockFilter,
      blockReasonFilter,
      catalogueId,
      categoryId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    };

    const result = await service.getCataloguesWithProducts(filters, userId);

    return apiResponse.success(
      res,
      result,
      "Catalogues retrieved successfully"
    );
  });

  updateProductStock = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { stock } = req.body;
    const userId = req.user.id;

    const result = await service.updateProductStock(productId, stock, userId);

    return apiResponse.success(
      res,
      result,
      "Product stock updated successfully"
    );
  });

  updateVariantStock = asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    const { stock } = req.body;
    const userId = req.user.id;

    const result = await service.updateVariantStock(variantId, stock, userId);

    return apiResponse.success(
      res,
      result,
      "Variant stock updated successfully"
    );
  });


  bulkPauseProducts = asyncHandler(async (req, res) => {
    const { catalogueId } = req.params;
    const { productIds } = req.body;
    const userId = req.user.id;

    const result = await service.bulkPauseProducts(
      catalogueId,
      productIds,
      userId
    );

    const responseData = {
      catalogueId: parseInt(catalogueId),
      totalPaused: result.updatedCount,
    };

    return apiResponse.success(
      res,
      responseData,
      "Products paused successfully"
    );
  });

  getUserCategoryTree = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await service.getUserCategoryTree(userId);
    return apiResponse.success(
      res,
      result,
      "Category tree retrieved successfully"
    );
  });



  getInventoryList = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await service.getInventoryList(userId);

  return apiResponse.success(
    res,
    result,
    "Inventory list fetched successfully"
  );
});
}

module.exports = new InventoryController();
