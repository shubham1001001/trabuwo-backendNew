// const { v4: uuid } = require("uuid");
const config = require("config");
const dao = require("./dao");
const catalogueDao = require("../catalogue/dao");
const categoryDao = require("../category/dao");
const categorySchemaDao = require("../categorySchema/dao");
const catalogueService = require("../catalogue/service");
const categorySchemaService = require("../categorySchema/service");
const sequelize = require("../../config/database");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  ResourceCreationError,
} = require("../../utils/errors");
const s3Service = require("../../services/s3");
const { ProductImage, ProductVariant } = require("./model");

const SENSITIVE_PRODUCT_FIELDS = new Set([
  "id",
  "publicId",
  "catalogueId",
  "status",
  "blockReasonType",
  "searchVector",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "createdBy",
  "updatedBy",
]);

const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

exports.stripSensitiveProductFields = (input) => {
  if (!isPlainObject(input)) return {};

  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_PRODUCT_FIELDS.has(key)) continue;
    output[key] = value;
  }
  return output;
};

exports.getProductById = async (id, userId) => {
  const product = await dao.getProductById(id, userId);
  if (!product) {
    throw new NotFoundError("Product not found");
  }
  return product;
};

exports.getAllProducts = (filters = {}) => dao.getAllProducts(filters);

exports.getProductsByCatalogueId = async (catalogueId, userId) => {
  return dao.getProductsByCatalogueId(catalogueId, userId);
};

exports.getProductsByCategoryId = (categoryId) =>
  dao.getProductsByCategoryId(categoryId);

const handleImageUpdates = async (productId, images, transaction) => {
  if (images === undefined) return;

  const existingImages = await dao.getProductImagesByProductId(productId, {
    attributes: ["publicId"],
    transaction,
  });

  const existingIds = new Set(existingImages.map((img) => img.publicId));
  const incomingExistingIds = new Set(
    (images || []).map((img) => img && img.publicId)
  );
  const idsToDelete = [...existingIds].filter(
    (eid) => !incomingExistingIds.has(eid)
  );

  if (idsToDelete.length > 0) {
    await ProductImage.update(
      { isDeleted: true },
      {
        where: { publicId: idsToDelete, productId, isDeleted: false },
        transaction,
      }
    );
  }

  if (images && images.length > 0) {
    const imageRows = images.map((image, index) => {
      const payload = {
        productId,
        publicId: image.publicId,
        imageUrl: image.imageUrl,
        imageKey: image.imageKey,
        altText: image.altText || "",
        caption: image.caption || "",
        sortOrder: image.sortOrder ?? index,
        isPrimary: image.isPrimary ?? index === 0,
        isActive: image.isActive ?? true,
        isDeleted: false,
      };
      return payload;
    });

    await dao.bulkUpsertProductImages(imageRows, {
      transaction,
    });
  }
};

const handleVariantUpdates = async (productId, variants, transaction) => {
  if (variants === undefined) return;

  const existingVariants = await dao.getProductVariantsByProductId(productId, {
    attributes: ["publicId"],
    transaction,
  });

  const existingIds = new Set(
    existingVariants.map((variant) => variant.publicId)
  );
  const incomingExistingIds = new Set(
    (variants || []).map((variant) => variant && variant.publicId)
  );
  const idsToDelete = [...existingIds].filter(
    (eid) => !incomingExistingIds.has(eid)
  );

  if (idsToDelete.length > 0) {
    await ProductVariant.update(
      { isDeleted: true },
      {
        where: { publicId: idsToDelete, productId, isDeleted: false },
        transaction,
      }
    );
  }

  if (variants && variants.length > 0) {
    const variantRows = variants.map((variant) => {
      const payload = {
        publicId: variant.publicId,
        productId,
        trabuwoPrice: variant.trabuwoPrice,
        wrongDefectiveReturnPrice: variant.wrongDefectiveReturnPrice || 0,
        mrp: variant.mrp || 0,
        inventory: variant.inventory || 0,
        skuId: variant.skuId || null,
        dynamicFields: variant.dynamicFields || {},
        isActive: variant.isActive ?? true,
        isDeleted: false,
      };
      return payload;
    });

    await dao.bulkUpsertProductVariants(variantRows, {
      transaction,
    });
  }
};

exports.updateProductById = async (publicId, data, userId) => {
  const cleanedInput = exports.stripSensitiveProductFields(data);

  return await sequelize.transaction(async (t) => {
    const product = await dao.getProductById(publicId, userId, {
      transaction: t,
    });
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const { images, variants, ...productData } = cleanedInput;

    if (variants && variants.length > 0) {
      for (const variant of variants) {
        await categorySchemaService.validateSchemaForCategory(
          product.catalogue.categoryId,
          {
            ...variant.dynamicFields,
            ...productData.dynamicFields,
          }
        );
      }
    }

    await dao.updateProductById(product.id, productData, { transaction: t });

    await handleImageUpdates(product.id, images, t);

    await handleVariantUpdates(product.id, variants, t);

    return dao.getProductById(publicId, userId, { transaction: t });
  });
};

exports.softDeleteProductById = async (id, userId) => {
  return await sequelize.transaction(async (t) => {
    const product = await dao.getProductById(id, userId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Check if product belongs to user's catalogue
    if (product.catalogue.userId !== userId) {
      throw new ConflictError(
        "You can only delete products in your own catalogues"
      );
    }

    // Soft delete the product and its images
    await dao.softDeleteProductById(id, { transaction: t });
    await dao.softDeleteProductImagesByProductId(id, { transaction: t });

    return { message: "Product deleted successfully" };
  });
};

exports.getProductsByUserId = (userId) => dao.getProductsByUserId(userId);

exports.createBulkCataloguesWithProducts = async (catalogues, userId) => {
  // Validate dynamic fields before processing
  await exports.validateProductsDynamicFields(
    { catalogues },
    { type: "bulkCatalogues" }
  );

  return await sequelize.transaction(async (t) => {
    const createdCatalogues = [];
    for (const catalogueInput of catalogues) {
      const { name, description, categoryId, products } = catalogueInput;

      const category = await categoryDao.getCategoryByPublicId(categoryId);
      if (!category) {
        throw new NotFoundError("Category not found");
      }

      const catalogue = await catalogueService.createCatalogue(
        { name, description, categoryId: category.id },
        userId,
        { transaction: t }
      );

      if (!catalogue) {
        throw new ResourceCreationError(
          "Catalogue creation failed",
          catalogueInput
        );
      }

      const productRows = (products || []).map((p) => ({
        name: p.name,
        description: p.description,
        dynamicFields: p.dynamicFields,
        manufacturerName: p.manufacturerName,
        manufacturerPincode: p.manufacturerPincode,
        manufacturerAddress: p.manufacturerAddress,
        countryOfOrigin: p.countryOfOrigin,
        packerName: p.packerName,
        packerAddress: p.packerAddress,
        packerPincode: p.packerPincode,
        importerName: p.importerName,
        importerAddress: p.importerAddress,
        importerPincode: p.importerPincode,
        styleCode: p.styleCode,
        weightInGram: p.weightInGram,
        catalogueId: catalogue.id,
      }));

      const createdProducts = await dao.createMultipleProducts(productRows, {
        transaction: t,
        returning: true,
      });

      const imageRows = [];
      for (let i = 0; i < createdProducts.length; i++) {
        const created = createdProducts[i];
        const input = products[i];
        const images = input?.images || [];
        if (!images.length) continue;
        for (let idx = 0; idx < images.length; idx++) {
          const image = images[idx];
          const cloudfrontDomain = config.get("aws.cloudfront.domain");
          const protocol = cloudfrontDomain.startsWith("http") ? "" : "https://";
          imageRows.push({
            productId: created.id,
            imageUrl: `${protocol}${cloudfrontDomain}/${image.imageKey}`,
            imageKey: image.imageKey,
            altText: image.altText || "",
            caption: image.caption || "",
            sortOrder: image.sortOrder ?? idx,
            isPrimary: image.isPrimary ?? idx === 0,
          });
        }
      }
      if (imageRows.length > 0) {
        await dao.bulkCreateProductImages(imageRows, { transaction: t });
      }

      const variantRows = [];
      for (let i = 0; i < createdProducts.length; i++) {
        const created = createdProducts[i];
        const input = products[i];
        const variants = input?.variants || [];
        if (!variants.length) continue;
        for (let vIdx = 0; vIdx < variants.length; vIdx++) {
          const v = variants[vIdx];
          variantRows.push({
            productId: created.id,
            trabuwoPrice: v.trabuwoPrice,
            wrongDefectiveReturnPrice: v.wrongDefectiveReturnPrice,
            mrp: v.mrp,
            inventory: v.inventory,
            skuId: v.skuId,
            dynamicFields: v.dynamicFields,
          });
        }
      }
      if (variantRows.length > 0) {
        await dao.bulkCreateProductVariants(variantRows, { transaction: t });
      }

      createdCatalogues.push({
        ...catalogue.toJSON(),
        products: createdProducts,
      });

      // Update catalogue summary with the created products and images
      const catalogueWithDetails = await catalogueDao.getCatalogueById(catalogue.id, {
        transaction: t,
      });

      if (catalogueWithDetails) {
        const summary = catalogueService.calculateCatalogueSummary(
          catalogueWithDetails.products
        );
        await catalogueDao.updateCatalogueById(catalogue.id, summary, {
          transaction: t,
        });
      }
    }


    return createdCatalogues;
  });
};

exports.createSingleCatalogueWithProducts = async (catalogue, userId) => {
  await exports.validateProductsDynamicFields(catalogue, {
    type: "singleCatalogue",
  });

  const result = await exports.createBulkCataloguesWithProducts(
    [catalogue],
    userId
  );
  return result;
};

exports.bulkUpdateProductsWithImages = async (
  products,
  userId,
  catalogueId,
  categoryId
) => {
  await exports.validateProductsDynamicFields(
    { products },
    { type: "bulkProducts", categoryId }
  );

  return await sequelize.transaction(async (t) => {
    const productsToUpdate = [];
    const productsToCreate = [];

    for (const product of products) {
      if (product.publicId) {
        productsToUpdate.push(product);
      } else {
        productsToCreate.push(product);
      }
    }

    // Step 2: Handle existing products (with publicId)
    const updatedProducts = new Array(products.length); // Maintain original order
    const productIdMap = new Map(); // publicId -> id mapping

    if (productsToUpdate.length > 0) {
      // Fetch existing products by publicId to get their primary keys
      const publicIds = productsToUpdate.map((p) => p.publicId);
      const existingProducts = await dao.getProductsByPublicIds(publicIds);

      if (existingProducts.length !== productsToUpdate.length) {
        const foundPublicIds = existingProducts.map((p) => p.publicId);
        const missingPublicIds = publicIds.filter(
          (id) => !foundPublicIds.includes(id)
        );
        throw new NotFoundError(
          `Products not found: ${missingPublicIds.join(", ")}`
        );
      }

      // Verify user ownership
      for (const existingProduct of existingProducts) {
        if (existingProduct.catalogue.userId !== userId) {
          throw new ConflictError(
            `You don't have permission to update product: ${existingProduct.publicId}`
          );
        }
        productIdMap.set(existingProduct.publicId, existingProduct.id);
      }

      // Prepare update data for existing products
      const productUpdates = productsToUpdate.map((product) => ({
        id: productIdMap.get(product.publicId),
        update: {
          name: product.name,
          styleCode: product.styleCode,
          manufacturerName: product.manufacturerName,
          manufacturerPincode: product.manufacturerPincode,
          manufacturerAddress: product.manufacturerAddress,
          countryOfOrigin: product.countryOfOrigin,
          packerName: product.packerName,
          packerAddress: product.packerAddress,
          packerPincode: product.packerPincode,
          importerName: product.importerName,
          importerAddress: product.importerAddress,
          importerPincode: product.importerPincode,
          description: product.description,
          dynamicFields: product.dynamicFields,
        },
      }));

      // Bulk update existing products
      await dao.bulkUpdateProductsById(productUpdates, { transaction: t });

      // Add to result with their publicIds, maintaining original order
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (product.publicId) {
          updatedProducts[i] = {
            ...product,
            id: productIdMap.get(product.publicId),
          };
        }
      }
    }

    // Step 3: Handle new products (without publicId)
    if (productsToCreate.length > 0) {
      if (!catalogueId) {
        throw new ValidationError("catalogueId is required for new products");
      }

      // Get catalogue by publicId and verify user ownership
      const catalogue = await catalogueDao.getCatalogueByPublicId(catalogueId);
      if (!catalogue) {
        throw new NotFoundError("Catalogue not found");
      }
      if (catalogue.userId !== userId) {
        throw new ConflictError(
          "You don't have permission to add products to this catalogue"
        );
      }

      const category = await categoryDao.getCategoryByPublicId(categoryId);
      if (!category) {
        throw new NotFoundError("Category not found");
      }

      // Prepare product data for creation
      const productRows = productsToCreate.map((p) => ({
        name: p.name,
        styleCode: p.styleCode,
        manufacturerName: p.manufacturerName,
        manufacturerPincode: p.manufacturerPincode,
        manufacturerAddress: p.manufacturerAddress,
        countryOfOrigin: p.countryOfOrigin,
        packerName: p.packerName,
        packerAddress: p.packerAddress,
        packerPincode: p.packerPincode,
        importerName: p.importerName,
        importerAddress: p.importerAddress,
        importerPincode: p.importerPincode,
        description: p.description,
        dynamicFields: p.dynamicFields,
        weightInGram: p.weightInGram,
        catalogueId: catalogue.id,
      }));

      const createdProducts = await dao.createMultipleProducts(productRows, {
        transaction: t,
        returning: true,
      });

      // Add to result maintaining original order
      let createdIndex = 0;
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (!product.publicId) {
          updatedProducts[i] = {
            ...product,
            publicId: createdProducts[createdIndex].publicId,
            id: createdProducts[createdIndex].id,
          };
          createdIndex++;
        }
      }
    }

    // Step 4: Handle Images for all products (both updated and created)
    // Process images for each product in the original order
    for (let i = 0; i < products.length; i++) {
      const originalProduct = products[i];
      const updatedProduct = updatedProducts[i];

      if (!updatedProduct) continue; // Skip if product wasn't processed

      const productId = updatedProduct.id;

      if (originalProduct.images && originalProduct.images.length > 0) {
        // Soft delete all existing images for this product
        await dao.softDeleteProductImagesByProductId(productId, {
          transaction: t,
        });

        const cloudfrontDomain = config.get("aws.cloudfront.domain");
        const protocol = cloudfrontDomain.startsWith("http") ? "" : "https://";

        // Prepare new images data
        const imageRows = originalProduct.images.map((image, imageIndex) => ({
          productId: productId,
          imageUrl: `${protocol}${cloudfrontDomain}/${image.imageKey}`,
          imageKey: image.imageKey,

          altText: image.altText || "",
          caption: image.caption || "",
          sortOrder: image.sortOrder ?? imageIndex,
          isPrimary: image.isPrimary ?? imageIndex === 0,
        }));

        // Create new images
        if (imageRows.length > 0) {
          await dao.bulkCreateProductImages(imageRows, { transaction: t });
        }
      }
    }

    // Filter out undefined entries and return only processed products
    return updatedProducts.filter((product) => product !== undefined);
  });
};

exports.bulkUpdateCatalogueProducts = async (
  cataloguePublicId,
  products,
  userId
) => {
  const catalogue = await catalogueDao.getCatalogueByPublicId(
    cataloguePublicId
  );
  if (!catalogue) {
    throw new NotFoundError("Catalogue not found");
  }
  if (catalogue.userId !== userId) {
    throw new ConflictError(
      "You don't have permission to update this catalogue"
    );
  }

  // Get category from catalogue since all products in a catalogue share the same category
  const category = await categoryDao.getCategoryById(catalogue.categoryId);
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  // TODO fix this method to not make multiple calls to the database
  await exports.validateProductsDynamicFields(
    { products },
    { type: "bulkProducts", categoryId: category.publicId }
  );

  return await sequelize.transaction(async (t) => {
    const existingProducts = await dao.getExistingProductsByCatalogue(
      catalogue.id,
      {
        transaction: t,
      }
    );

    if (existingProducts.length !== products.length) {
      throw new ConflictError(
        "Products to update do not match the existing products"
      );
    }
    const existingImageIds = existingProducts.flatMap((p) =>
      p.images ? p.images.map((image) => image.publicId) : []
    );
    const existingVariantIds = existingProducts.flatMap((p) =>
      p.variants ? p.variants.map((variant) => variant.publicId) : []
    );
    const imagesIdsInPayload = products.flatMap((product) =>
      product.images ? product.images.map((image) => image.publicId) : []
    );
    const variantIdsInPayload = products.flatMap((product) =>
      product.variants
        ? product.variants.map((variant) => variant.publicId)
        : []
    );
    const imageIdsToDelete = existingImageIds.filter(
      (id) => !imagesIdsInPayload.includes(id)
    );
    const variantIdsToDelete = existingVariantIds.filter(
      (id) => !variantIdsInPayload.includes(id)
    );

    if (imageIdsToDelete.length > 0) {
      await dao.softDeleteImagesByPublicIds(imageIdsToDelete, {
        transaction: t,
      });
    }
    if (variantIdsToDelete.length > 0) {
      await dao.softDeleteVariantsByPublicIds(variantIdsToDelete, {
        transaction: t,
      });
    }

    const productRows = products.map((product) => ({
      publicId: product.publicId,
      catalogueId: catalogue.id,
      name: product.name,
      styleCode: product.styleCode,
      manufacturerName: product.manufacturerName,
      manufacturerPincode: product.manufacturerPincode,
      manufacturerAddress: product.manufacturerAddress,
      countryOfOrigin: product.countryOfOrigin,
      packerName: product.packerName,
      packerAddress: product.packerAddress,
      packerPincode: product.packerPincode,
      importerName: product.importerName,
      importerAddress: product.importerAddress,
      importerPincode: product.importerPincode,
      description: product.description,
      dynamicFields: product.dynamicFields,
      weightInGram: product.weightInGram,
    }));

    const upsertedProducts = await dao.bulkUpsertProducts(productRows, {
      transaction: t,
    });

    const productIdMap = new Map();
    upsertedProducts.forEach((product) => {
      productIdMap.set(product.publicId, product.id);
    });

    const imageRows = [];
    products.forEach((product) => {
      if (product.images && product.images.length > 0) {
        const productId = productIdMap.get(product.publicId);
        const cloudfrontDomain = config.get("aws.cloudfront.domain");
        const protocol = cloudfrontDomain.startsWith("http") ? "" : "https://";

        product.images.forEach((image, index) => {
          imageRows.push({
            publicId: image.publicId,
            productId: productId,
            imageUrl: `${protocol}${cloudfrontDomain}/${image.imageKey}`,
            imageKey: image.imageKey,

            altText: image.altText || "",
            caption: image.caption || "",
            sortOrder: image.sortOrder ?? index,
            isPrimary: image.isPrimary ?? index === 0,
          });
        });
      }
    });

    if (imageRows.length > 0) {
      await dao.bulkUpsertProductImages(imageRows, { transaction: t });
    }

    const variantRows = [];
    products.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        const productId = productIdMap.get(product.publicId);
        product.variants.forEach((variant) => {
          variantRows.push({
            publicId: variant.publicId,
            productId: productId,
            trabuwoPrice: variant.trabuwoPrice,
            wrongDefectiveReturnPrice: variant.wrongDefectiveReturnPrice || 0,
            mrp: variant.mrp,
            inventory: variant.inventory,
            skuId: variant.skuId,
            dynamicFields: variant.dynamicFields,
          });
        });
      }
    });

    if (variantRows.length > 0) {
      await dao.bulkUpsertProductVariants(variantRows, { transaction: t });
    }

    // const createdCount = upsertedProducts.filter((p) => !p.publicId).length;
    // const updatedCount = upsertedProducts.length - createdCount;
    // const deletedCount = existingProducts.length - upsertedProducts.length;

    return {
      success: true,
      message: "Catalogue products updated successfully",
      data: {
        // created: createdCount,
        // updated: updatedCount,
        // deleted: deletedCount,
        // totalProcessed: products.length,
        // summary: {
        //   totalProcessed: products.length,
        //   created: createdCount,
        //   updated: updatedCount,
        //   deleted: deletedCount,
        // },
      },
    };
  });
};

exports.validateDynamicFields = async (categoryId, dynamicFields) => {
  const schemaFields = await categorySchemaDao.getCategorySchemasByCategoryId(
    categoryId
  );

  for (const schemaField of schemaFields) {
    const fieldValue = dynamicFields[schemaField.fieldName];

    if (
      schemaField.required &&
      (fieldValue === undefined || fieldValue === null || fieldValue === "")
    ) {
      throw new ValidationError(`Field '${schemaField.label}' is required`);
    }

    if (fieldValue === undefined || fieldValue === null) continue;

    switch (schemaField.fieldType) {
      case "text":
        if (typeof fieldValue !== "string") {
          throw new ValidationError(
            `Field '${schemaField.label}' must be a string`
          );
        }
        break;
      case "number":
        if (typeof fieldValue !== "number" || isNaN(fieldValue)) {
          throw new ValidationError(
            `Field '${schemaField.label}' must be a number`
          );
        }
        break;
      case "boolean":
        if (typeof fieldValue !== "boolean") {
          throw new ValidationError(
            `Field '${schemaField.label}' must be a boolean`
          );
        }
        break;
      case "select":
        if (!schemaField.options || !schemaField.options.includes(fieldValue)) {
          throw new ValidationError(
            `Field '${
              schemaField.label
            }' must be one of: ${schemaField.options.join(", ")}`
          );
        }
        break;
      case "multiselect":
        if (
          !Array.isArray(fieldValue) ||
          !fieldValue.every((val) => schemaField.options.includes(val))
        ) {
          throw new ValidationError(
            `Field '${
              schemaField.label
            }' must be an array of: ${schemaField.options.join(", ")}`
          );
        }
        break;
      case "file":
        if (typeof fieldValue !== "string") {
          throw new ValidationError(
            `Field '${schemaField.label}' must be a file URL string`
          );
        }
        break;
    }

    if (schemaField.validation) {
      const validation = schemaField.validation;

      if (validation.minLength && fieldValue.length < validation.minLength) {
        throw new ValidationError(
          `Field '${schemaField.label}' must be at least ${validation.minLength} characters`
        );
      }

      if (validation.maxLength && fieldValue.length > validation.maxLength) {
        throw new ValidationError(
          `Field '${schemaField.label}' must be at most ${validation.maxLength} characters`
        );
      }

      if (validation.min && fieldValue < validation.min) {
        throw new ValidationError(
          `Field '${schemaField.label}' must be at least ${validation.min}`
        );
      }

      if (validation.max && fieldValue > validation.max) {
        throw new ValidationError(
          `Field '${schemaField.label}' must be at most ${validation.max}`
        );
      }
    }
  }
};

const validateProductDynamicFields = async (product, categoryId) => {
  for (let j = 0; j < product.variants.length; j++) {
    const variant = product.variants[j] || {};
    const merged = {
      ...(product.dynamicFields || {}),
      ...(variant.dynamicFields || {}),
    };
    await categorySchemaService.validateSchemaForCategory(categoryId, merged);
  }
};

const validateProductsWithCategory = async (
  products,
  categoryPublicId,
  errorContext = ""
) => {
  const category = await categoryDao.getCategoryByPublicId(categoryPublicId);
  if (!category) {
    throw new ValidationError(`Category not found${errorContext}`);
  }

  for (let i = 0; i < products.length; i++) {
    await validateProductDynamicFields(products[i], category.id);
  }
};

exports.validateProductsDynamicFields = async (data, context = {}) => {
  const { type, categoryId } = context;

  if (type === "singleCatalogue") {
    const { categoryId: catId, products } = data;
    await validateProductsWithCategory(products, catId);
  } else if (type === "bulkCatalogues") {
    const { catalogues } = data;
    for (let cIdx = 0; cIdx < catalogues.length; cIdx++) {
      const catalogue = catalogues[cIdx];
      const products = catalogue.products || [];
      await validateProductsWithCategory(
        products,
        catalogue.categoryId,
        ` for catalogue index ${cIdx}`
      );
    }
  } else if (type === "bulkProducts") {
    const { products } = data;
    await validateProductsWithCategory(products, categoryId);
  }
};

exports.generatePresignedUrl = async (fileName, contentType, userId) => {
  const folder = "product_images";
  return await s3Service.generatePresignedUrl(
    fileName,
    contentType,
    userId,
    folder
  );
};

exports.createProductVariant = async (sourceProductId, variantData, userId) => {
  return await sequelize.transaction(async (t) => {
    const sourceProduct = await dao.getProductById(sourceProductId, userId, {
      transaction: t,
    });
    if (!sourceProduct) {
      throw new NotFoundError("Source product not found");
    }

    if (variantData.dynamicFields) {
      await categorySchemaService.validateVariantDynamicFields(
        sourceProduct.catalogue.categoryId,
        variantData.dynamicFields
      );
    }

    const productVariant = await dao.createProductVariant(
      sourceProduct.id,
      variantData,
      { transaction: t }
    );

    return productVariant;
  });
};
