const { v7: uuidv7 } = require("uuid");
require("dotenv").config();
const sequelize = require("./src/config/database");
const Catalogue = require("./src/modules/catalogue/model");
const { Product, ProductImage, ProductVariant } = require("./src/modules/product/model");
const Category = require("./src/modules/category/model");
const { Op } = require("sequelize");

async function replicateCatalogues() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database.");

    // 1. Identify Leaf Categories
    // Find all categories that are not parentId of any other category
    const allCategories = await Category.findAll({ where: { isDeleted: false } });
    const parentIds = new Set(allCategories.map(c => c.parentId).filter(id => id !== null));
    const leafCategories = allCategories.filter(c => !parentIds.has(c.id) && c.id !== 6474);

    console.log(`🔍 Found ${leafCategories.length} leaf categories to populate.`);

    // 2. Fetch Source Catalogues (from ID 6474)
    const sourceCatalogues = await Catalogue.findAll({
      where: { categoryId: 6474, isDeleted: false },
      include: [
        {
          model: Product,
          as: "products",
          where: { isDeleted: false },
          required: false,
          include: [
            { model: ProductVariant, as: "variants", where: { isDeleted: false }, required: false },
            { model: ProductImage, as: "images", where: { isDeleted: false }, required: false }
          ]
        }
      ]
    });

    if (sourceCatalogues.length === 0) {
      console.error("❌ No source catalogues found in category 6474.");
      return;
    }

    console.log(`📦 Source contains ${sourceCatalogues.length} catalogues. Starting replication...`);

    let totalCreated = 0;

    for (const leaf of leafCategories) {
      console.log(`📍 Processing category: ${leaf.name} (ID: ${leaf.id})`);
      
      const transaction = await sequelize.transaction();
      try {
        for (const sourceCat of sourceCatalogues) {
          // Clone Catalogue
          const newCatalogue = await Catalogue.create({
            name: `[Test] ${sourceCat.name} - ${leaf.name}`,
            description: sourceCat.description,
            status: "live", // Set directly to live for visibility
            userId: sourceCat.userId,
            categoryId: leaf.id,
            minPrice: sourceCat.minPrice,
            maxPrice: sourceCat.maxPrice,
            thumbnailUrl: sourceCat.thumbnailUrl,
            isDeleted: false
          }, { transaction });

          // Clone Products
          for (const sourceProd of (sourceCat.products || [])) {
            const newProduct = await Product.create({
              catalogueId: newCatalogue.id,
              name: sourceProd.name,
              styleCode: sourceProd.styleCode,
              dynamicFields: sourceProd.dynamicFields,
              description: sourceProd.description,
              status: "active",
              manufacturerName: sourceProd.manufacturerName,
              manufacturerPincode: sourceProd.manufacturerPincode,
              manufacturerAddress: sourceProd.manufacturerAddress,
              countryOfOrigin: sourceProd.countryOfOrigin,
              packerName: sourceProd.packerName,
              packerAddress: sourceProd.packerAddress,
              packerPincode: sourceProd.packerPincode,
              importerName: sourceProd.importerName,
              importerAddress: sourceProd.importerAddress,
              importerPincode: sourceProd.importerPincode,
              weightInGram: sourceProd.weightInGram,
              isDeleted: false
            }, { transaction });

            // Clone Variants
            if (sourceProd.variants && sourceProd.variants.length > 0) {
              const variantsData = sourceProd.variants.map(v => ({
                productId: newProduct.id,
                trabuwoPrice: v.trabuwoPrice,
                wrongDefectiveReturnPrice: v.wrongDefectiveReturnPrice,
                mrp: v.mrp,
                inventory: v.inventory,
                skuId: v.skuId,
                dynamicFields: v.dynamicFields,
                isActive: true,
                isDeleted: false,
                publicId: uuidv7() // Manual UUID for bulk if needed, but create handles it unless we use bulkCreate
              }));
              await ProductVariant.bulkCreate(variantsData, { transaction });
            }

            // Clone Images
            if (sourceProd.images && sourceProd.images.length > 0) {
              const imagesData = sourceProd.images.map(img => ({
                productId: newProduct.id,
                imageUrl: img.imageUrl,
                imageKey: img.imageKey,
                altText: img.altText,
                caption: img.caption,
                sortOrder: img.sortOrder,
                isPrimary: img.isPrimary,
                isActive: true,
                isDeleted: false,
                publicId: uuidv7()
              }));
              await ProductImage.bulkCreate(imagesData, { transaction });
            }
          }
          totalCreated++;
        }
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        console.error(`❌ Failed to replicate to category ${leaf.name}:`, err.message);
      }
    }

    console.log(`\n🎉 Successfully replicated ${totalCreated} catalogues across ${leafCategories.length} categories.`);
  } catch (err) {
    console.error("❌ Fatal error during replication:", err);
  } finally {
    await sequelize.close();
  }
}

replicateCatalogues();
