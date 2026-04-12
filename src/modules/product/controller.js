const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.createMultipleProducts = async (req, res) => {
  const products = await service.createMultipleProducts(
    req.body.products,
    req.user.id
  );
  return apiResponse.success(res, products, "Products created", 201);
};

exports.getProductById = async (req, res) => {
  const product = await service.getProductById(req.params.id, req.user.id);
  return apiResponse.success(res, product);
};

exports.getAllProducts = async (req, res) => {
  const filters = {};
  if (req.query.categoryId) filters.categoryId = req.query.categoryId;
  if (req.query.isActive !== undefined)
    filters.isActive = req.query.isActive === "true";

  const products = await service.getAllProducts(filters);
  return apiResponse.success(res, products);
};

exports.getProductsByCatalogueId = async (req, res) => {
  const userId = req.user?.id || null;
  const products = await service.getProductsByCatalogueId(
    req.params.catalogueId,
    userId
  );
  return apiResponse.success(res, products);
};

exports.getProductsByCategoryId = async (req, res) => {
  const products = await service.getProductsByCategoryId(req.params.categoryId);
  return apiResponse.success(res, products);
};

exports.getMyProducts = async (req, res) => {
  const products = await service.getProductsByUserId(req.user.id);
  return apiResponse.success(res, products);
};

exports.updateProduct = async (req, res) => {
  const updatedProduct = await service.updateProductById(
    req.params.id,
    req.body,
    req.user.id
  );
  return apiResponse.success(res, updatedProduct, "Product updated");
};

exports.deleteProduct = async (req, res) => {
  await service.softDeleteProductById(req.params.id, req.user.id);
  return apiResponse.success(res, null, "Product deleted");
};

exports.createBulkCataloguesWithProducts = async (req, res) => {
  const result = await service.createBulkCataloguesWithProducts(
    req.body.catalogues,
    req.user.id
  );
  return apiResponse.success(
    res,
    result,
    "Catalogues and products created",
    201
  );
};

exports.createSingleCatalogueWithProducts = async (req, res) => {
  const createdCatalogue = await service.createSingleCatalogueWithProducts(
    req.body,
    req.user.id
  );
  return apiResponse.success(res, createdCatalogue, "Catalogue created", 201);
};

exports.bulkUpdateProductsWithImages = async (req, res) => {
  const updatedProducts = await service.bulkUpdateProductsWithImages(
    req.body.products,
    req.user.id,
    req.body.catalogueId,
    req.body.categoryId
  );
  return apiResponse.success(res, updatedProducts, "Products updated");
};

exports.generatePresignedUrl = async (req, res) => {
  const { fileName, contentType } = req.body;
  const presignedUrlData = await service.generatePresignedUrl(
    fileName,
    contentType,
    req.user.id
  );
  return apiResponse.success(
    res,
    presignedUrlData,
    "Presigned URL generated successfully"
  );
};

exports.uploadDirect = async (req, res) => {
  const result = await service.uploadDirect(req.file, req.user.id);
  return apiResponse.success(res, result, "Image uploaded successfully");
};

exports.createProductVariant = async (req, res) => {
  const { productId } = req.params;
  const variantData = req.body;
  const userId = req.user.id;

  const variantProduct = await service.createProductVariant(
    productId,
    variantData,
    userId
  );

  return apiResponse.success(
    res,
    variantProduct,
    "Product variant created successfully",
    201
  );
};

exports.bulkUpdateCatalogueProducts = async (req, res) => {
  const { cataloguePublicId } = req.params;
  const { products } = req.body;
  const userId = req.user.id;

  const result = await service.bulkUpdateCatalogueProducts(
    cataloguePublicId,
    products,
    userId
  );

  apiResponse.success(res, result.data, result.message, 200);
};
