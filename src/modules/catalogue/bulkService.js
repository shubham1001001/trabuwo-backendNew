const ExcelJS = require("exceljs");
const AdmZip = require("adm-zip");
const path = require("path");
const { v7: uuidv7 } = require("uuid");
const sequelize = require("../../config/database");
const Catalogue = require("./model");
const { Product, ProductVariant, ProductImage } = require("../product/model");
const categoryDao = require("../category/dao");
const categorySchemaDao = require("../categorySchema/dao");
const s3Service = require("../../services/s3");
const { processImageForUpload, sanitizeFileName } = require("../../utils/imageProcessor");
const config = require("config");
const { ValidationError, ApiError } = require("../../utils/errors");

class BulkCatalogueService {
  /**
   * Process Bulk Catalogue Upload
   * @param {number} userId - Seller ID
   * @param {number} categoryId - Category ID
   * @param {Buffer} excelBuffer - Excel file buffer
   * @param {Buffer} zipBuffer - Zip file buffer containing images
   */
  static async processBulkUpload(userId, categoryId, excelBuffer, zipBuffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelBuffer);
    const worksheet = workbook.getWorksheet("Bulk Upload");

    if (!worksheet) {
      throw new ValidationError("Invalid template: 'Bulk Upload' sheet not found");
    }

    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    // Map ZIP entries by normalized basename for smart matching
    const imageMap = new Map();
    zipEntries.forEach(entry => {
      if (!entry.isDirectory) {
        const basename = path.basename(entry.entryName).toLowerCase();
        imageMap.set(basename, entry);
      }
    });

    const category = await categoryDao.getCategoryById(categoryId);
    const schemas = await categorySchemaDao.getCategorySchemasByCategoryId(categoryId);

    // Map column headers to keys (Case-insensitive)
    const headerRow = worksheet.getRow(1);
    const colMap = {};
    const normalizedColMap = {}; // Will store lowercase keys
    
    headerRow.eachCell((cell, colNumber) => {
      if (cell.value) {
        const header = cell.value.toString().replace(/\*/g, "").trim();
        colMap[header] = colNumber;
        normalizedColMap[header.toLowerCase()] = colNumber;
      }
    });

    const getColNum = (name) => normalizedColMap[name.toLowerCase()];

    // Validate mandatory columns
    const mandatoryCols = ["Catalogue Name", "Product Name", "MRP", "Selling Price", "GST %", "Size", "Quantity/Stock", "Image 1"];
    const missingCols = mandatoryCols.filter(col => !getColNum(col));
    
    if (missingCols.length > 0) {
      throw new ValidationError(`Missing required columns: ${missingCols.join(", ")}`);
    }

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // Skip headers and help rows

      const rowData = {
        catalogueName: row.getCell(getColNum("Catalogue Name")).value?.toString().trim(),
        productName: row.getCell(getColNum("Product Name")).value?.toString().trim(),
        productDescription: row.getCell(getColNum("Product Description") || 0).value?.toString().trim() || "",
        mrp: parseFloat(row.getCell(getColNum("MRP")).value),
        trabuwoPrice: parseFloat(row.getCell(getColNum("Selling Price")).value),
        gst: parseFloat(row.getCell(getColNum("GST %")).value),
        size: row.getCell(getColNum("Size")).value?.toString().trim(),
        quantity: parseInt(row.getCell(getColNum("Quantity/Stock")).value),
        sku: row.getCell(getColNum("SKU") || 0).value?.toString().trim() || "",
        images: [
          row.getCell(getColNum("Image 1")).value?.toString().trim(),
          row.getCell(getColNum("Image 2") || 0).value?.toString().trim(),
          row.getCell(getColNum("Image 3") || 0).value?.toString().trim(),
          row.getCell(getColNum("Image 4") || 0).value?.toString().trim(),
          row.getCell(getColNum("Image 5") || 0).value?.toString().trim(),
        ].filter(Boolean),
        dynamicFields: {}
      };

      // Extract dynamic fields
      schemas.forEach(schema => {
        const colNum = getColNum(schema.label);
        if (colNum) {
          const value = row.getCell(colNum).value;
          if (value !== undefined && value !== null) {
            rowData.dynamicFields[schema.fieldName] = value;
          }
        }
      });

      if (rowData.catalogueName && rowData.productName) {
        rows.push(rowData);
      }
    });

    if (rows.length === 0) {
      throw new ValidationError("No valid data found in Excel");
    }

    // Group rows by Catalogue -> Product (with trimming for safety)
    const catalogueGroups = {};
    rows.forEach(row => {
      const catName = (row.catalogueName || "").toString().trim();
      const prodName = (row.productName || "").toString().trim();
      
      if (!catName || !prodName) return;

      if (!catalogueGroups[catName]) {
        catalogueGroups[catName] = {};
      }
      if (!catalogueGroups[catName][prodName]) {
        catalogueGroups[catName][prodName] = [];
      }
      catalogueGroups[catName][prodName].push(row);
    });

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each Catalogue
    for (const [catName, products] of Object.entries(catalogueGroups)) {
      const transaction = await sequelize.transaction();
      try {
        const catalogue = await Catalogue.create({
          name: catName,
          userId,
          categoryId,
          status: "qc_in_progress",
          submittedAt: new Date()
        }, { transaction });

        for (const [prodName, variants] of Object.entries(products)) {
          const firstVariant = variants[0];
          
          const product = await Product.create({
            catalogueId: catalogue.id,
            name: prodName,
            description: firstVariant.productDescription,
            dynamicFields: {}, // We'll split dynamic fields between product and variant based on schema
            manufacturerName: "Trabuwo Seller", // Default since it's required in model
            manufacturerPincode: "110001",
            manufacturerAddress: "Address entry pending",
            countryOfOrigin: "India",
            packerName: "Trabuwo Seller",
            packerAddress: "Address entry pending",
            packerPincode: "110001",
            importerName: "Trabuwo Seller",
            importerAddress: "Address entry pending",
            importerPincode: "110001",
            weightInGram: 500
          }, { transaction });

          // Split dynamic fields
          const productFields = {};
          const variantFieldsBase = {};
          schemas.forEach(s => {
            if (s.section === "addVariant") {
              variantFieldsBase[s.fieldName] = firstVariant.dynamicFields[s.fieldName];
            } else {
              productFields[s.fieldName] = firstVariant.dynamicFields[s.fieldName];
            }
          });
          await product.update({ dynamicFields: productFields }, { transaction });

          // Handle Images
          for (let i = 0; i < firstVariant.images.length; i++) {
            const imgName = firstVariant.images[i].toLowerCase();
            const entry = imageMap.get(imgName);
            if (entry) {
              const imageBuffer = entry.getData();
              const processedBuffer = await processImageForUpload(imageBuffer, { quality: 80 });
              const sanitizedName = sanitizeFileName(imgName);
              const key = `products/${product.id}/${sanitizedName}-${uuidv7()}.webp`;
              
              await s3Service.uploadBuffer(processedBuffer, key, "image/webp");
              
              imageUrl = s3Service.getFileUrl(key);

              await ProductImage.create({
                productId: product.id,
                imageUrl,
                imageKey: key,
                isPrimary: i === 0,
                sortOrder: i
              }, { transaction });

              // Set catalogue thumbnail from first image of first product
              if (i === 0 && !catalogue.thumbnailUrl) {
                await catalogue.update({ thumbnailUrl: imageUrl }, { transaction });
              }
            }
          }

          // Create Variants
          for (const vData of variants) {
            const vFields = {};
            schemas.forEach(s => {
              if (s.section === "addVariant") {
                vFields[s.fieldName] = vData.dynamicFields[s.fieldName];
              }
            });

            await ProductVariant.create({
              productId: product.id,
              trabuwoPrice: vData.trabuwoPrice,
              mrp: vData.mrp,
              inventory: vData.quantity,
              skuId: vData.sku,
              dynamicFields: vFields
            }, { transaction });
          }
        }

        await transaction.commit();
        results.success++;
      } catch (error) {
        await transaction.rollback();
        results.failed++;
        results.errors.push({ catalogue: catName, error: error.message });
      }
    }

    return results;
  }
}

module.exports = BulkCatalogueService;
