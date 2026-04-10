const ExcelJS = require("exceljs");
const { ValidationError } = require("./errors");

class ExcelService {
  /**
   * Generate Excel template for category schema
   * @param {Array} schemas - Array of schema objects
   * @param {string} categoryName - Name of the category
   * @returns {Promise<Buffer>} - Excel file buffer
   */
  static async generateSchemaTemplate(schemas, categoryName = "Category") {
    try {
      if (!Array.isArray(schemas) || schemas.length === 0) {
        throw new ValidationError(
          "No schemas provided for Excel template generation"
        );
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Trabuwo System";
      workbook.lastModifiedBy = "Trabuwo System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Create data entry sheet
      await this.createDataSheet(workbook, schemas, categoryName);

      // Create instructions sheet
      await this.createInstructionsSheet(workbook, schemas, categoryName);

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to generate Excel template: ${error.message}`);
    }
  }

  /**
   * Create main data entry sheet
   * @param {ExcelJS.Workbook} workbook - Excel workbook
   * @param {Array} schemas - Array of schema objects
   * @param {string} categoryName - Name of the category
   */
  static async createDataSheet(workbook, schemas, categoryName) {
    const worksheet = workbook.addWorksheet("Data Entry");
    worksheet.name = "Data Entry";

    // Set column headers (Row 1)
    const headers = schemas.map((schema) => schema.label);
    worksheet.addRow(headers);

    // Set field types (Row 2)
    const fieldTypes = schemas.map((schema) =>
      this.getFieldTypeDisplay(schema.fieldType)
    );
    worksheet.addRow(fieldTypes);

    // Set required indicators (Row 3)
    const requiredIndicators = schemas.map((schema) =>
      schema.required ? "Required" : "Optional"
    );
    worksheet.addRow(requiredIndicators);

    // Set sample data (Row 4)
    const sampleData = schemas.map((schema) => this.getSampleData(schema));
    worksheet.addRow(sampleData);

    // Add empty rows for data entry
    for (let i = 0; i < 20; i++) {
      worksheet.addRow(new Array(schemas.length).fill(""));
    }

    // Apply formatting and validation
    await this.applyValidationAndFormatting(worksheet, schemas);
  }

  /**
   * Create instructions sheet
   * @param {ExcelJS.Workbook} workbook - Excel workbook
   * @param {Array} schemas - Array of schema objects
   * @param {string} categoryName - Name of the category
   */
  static async createInstructionsSheet(workbook, schemas, categoryName) {
    const worksheet = workbook.addWorksheet("Instructions");
    worksheet.name = "Instructions";

    // Title
    const titleRow = worksheet.addRow([
      `${categoryName} - Data Entry Instructions`,
    ]);
    titleRow.font = { bold: true, size: 16 };
    worksheet.mergeCells("A1:C1");

    worksheet.addRow([]); // Empty row

    // General instructions
    worksheet.addRow(["General Instructions:"]);
    worksheet.addRow(['1. Fill in the data in the "Data Entry" sheet']);
    worksheet.addRow(["2. Follow the validation rules for each field"]);
    worksheet.addRow(["3. Required fields must be filled"]);
    worksheet.addRow(["4. Use the sample data as a reference"]);
    worksheet.addRow(["5. Save the file and parse it in your application"]);

    worksheet.addRow([]); // Empty row

    // Field details
    worksheet.addRow(["Field Details:"]);
    worksheet.addRow([
      "Field Name",
      "Type",
      "Required",
      "Validation Rules",
      "Sample Data",
    ]);

    schemas.forEach((schema) => {
      worksheet.addRow([
        schema.label,
        this.getFieldTypeDisplay(schema.fieldType),
        schema.required ? "Yes" : "No",
        this.getValidationRulesText(schema),
        this.getSampleData(schema),
      ]);
    });

    worksheet.addRow([]); // Empty row

    // JSON structure example
    worksheet.addRow(["Expected JSON Structure:"]);
    worksheet.addRow([
      "After parsing the Excel, your data should look like this:",
    ]);

    const jsonExample = this.generateJsonExample(schemas);
    worksheet.addRow([jsonExample]);

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = Math.max(15, column.width || 0);
    });
  }

  /**
   * Apply validation and formatting to worksheet
   * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
   * @param {Array} schemas - Array of schema objects
   */
  static async applyValidationAndFormatting(worksheet, schemas) {
    // Format headers (Row 1)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Format field types row (Row 2)
    const typeRow = worksheet.getRow(2);
    typeRow.font = { italic: true, size: 10 };
    typeRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    };

    // Format required indicators row (Row 3)
    const requiredRow = worksheet.getRow(3);
    requiredRow.font = { size: 10 };
    schemas.forEach((schema, index) => {
      const cell = requiredRow.getCell(index + 1);
      if (schema.required) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFE6E6" },
        };
        cell.font = { bold: true, color: { argb: "FFFF0000" } };
      }
    });

    // Format sample data row (Row 4)
    const sampleRow = worksheet.getRow(4);
    sampleRow.font = { size: 10 };
    sampleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8F8F8" },
    };

    // Apply data validation for each column
    schemas.forEach((schema, index) => {
      const column = index + 1;
      this.applyColumnValidation(worksheet, column, schema);
    });

    // Set column widths
    schemas.forEach((schema, index) => {
      const column = worksheet.getColumn(index + 1);
      column.width = this.getColumnWidth(schema);
    });

    // Freeze panes
    worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];
  }

  /**
   * Apply validation to specific column
   * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
   * @param {number} column - Column number
   * @param {Object} schema - Schema object
   */
  static applyColumnValidation(worksheet, column, schema) {
    const columnLetter = worksheet.getColumn(column).letter;

    // Apply validation based on field type
    switch (schema.fieldType) {
      case "select":
        if (schema.options && schema.options.length > 0) {
          worksheet.dataValidations.add(
            `${columnLetter}5:${columnLetter}1000`,
            {
              type: "list",
              allowBlank: !schema.required,
              formulae: [`"${schema.options.join(",")}"`],
              showErrorMessage: true,
              errorTitle: "Invalid Selection",
              error: `Please select from: ${schema.options.join(", ")}`,
            }
          );
        }
        break;

      case "multiselect":
        if (schema.options && schema.options.length > 0) {
          worksheet.dataValidations.add(
            `${columnLetter}5:${columnLetter}1000`,
            {
              type: "list",
              allowBlank: !schema.required,
              formulae: [`"${schema.options.join(",")}"`],
              showErrorMessage: true,
              errorTitle: "Invalid Selection",
              error: `Please select from: ${schema.options.join(
                ", "
              )} (multiple selections separated by comma)`,
            }
          );
        }
        break;

      case "boolean":
        worksheet.dataValidations.add(`${columnLetter}5:${columnLetter}1000`, {
          type: "list",
          allowBlank: !schema.required,
          formulae: ['"Yes,No"'],
          showErrorMessage: true,
          errorTitle: "Invalid Boolean",
          error: "Please enter Yes or No",
        });
        break;

      case "number":
        let validation = {
          type: "decimal",
          allowBlank: !schema.required,
          showErrorMessage: true,
          errorTitle: "Invalid Number",
          error: "Please enter a valid number",
        };

        if (schema.validation) {
          if (schema.validation.min !== undefined) {
            validation.operator = "greaterThanOrEqual";
            validation.formulae = [schema.validation.min.toString()];
          }
          if (schema.validation.max !== undefined) {
            validation.operator = "lessThanOrEqual";
            validation.formulae = [schema.validation.max.toString()];
          }
        }

        worksheet.dataValidations.add(
          `${columnLetter}5:${columnLetter}1000`,
          validation
        );
        break;

      case "text":
        if (schema.validation) {
          let validation = {
            type: "textLength",
            allowBlank: !schema.required,
            showErrorMessage: true,
            errorTitle: "Invalid Text Length",
            error: "Text length validation failed",
          };

          if (schema.validation.minLength !== undefined) {
            validation.operator = "greaterThanOrEqual";
            validation.formulae = [schema.validation.minLength.toString()];
          }
          if (schema.validation.maxLength !== undefined) {
            validation.operator = "lessThanOrEqual";
            validation.formulae = [schema.validation.maxLength.toString()];
          }

          worksheet.dataValidations.add(
            `${columnLetter}5:${columnLetter}1000`,
            validation
          );
        }
        break;
    }
  }

  /**
   * Get field type display text
   * @param {string} fieldType - Field type
   * @returns {string} - Display text
   */
  static getFieldTypeDisplay(fieldType) {
    const typeMap = {
      text: "Text",
      number: "Number",
      select: "Single Select",
      multiselect: "Multi Select",
      boolean: "Yes/No",
      file: "File",
    };
    return typeMap[fieldType] || fieldType;
  }

  /**
   * Get sample data for field
   * @param {Object} schema - Schema object
   * @returns {string} - Sample data
   */
  static getSampleData(schema) {
    switch (schema.fieldType) {
      case "text":
        return "Sample Text";
      case "number":
        return "100";
      case "select":
        return schema.options && schema.options.length > 0
          ? schema.options[0]
          : "Option 1";
      case "multiselect":
        return schema.options && schema.options.length > 0
          ? `${schema.options[0]},${schema.options[1]}`
          : "Option 1,Option 2";
      case "boolean":
        return "Yes";
      case "file":
        return "filename.jpg";
      default:
        return "Sample Data";
    }
  }

  /**
   * Get validation rules text
   * @param {Object} schema - Schema object
   * @returns {string} - Validation rules text
   */
  static getValidationRulesText(schema) {
    const rules = [];

    if (schema.required) {
      rules.push("Required");
    }

    if (schema.validation) {
      if (schema.validation.minLength !== undefined) {
        rules.push(`Min length: ${schema.validation.minLength}`);
      }
      if (schema.validation.maxLength !== undefined) {
        rules.push(`Max length: ${schema.validation.maxLength}`);
      }
      if (schema.validation.min !== undefined) {
        rules.push(`Min value: ${schema.validation.min}`);
      }
      if (schema.validation.max !== undefined) {
        rules.push(`Max value: ${schema.validation.max}`);
      }
    }

    if (schema.options && schema.options.length > 0) {
      rules.push(`Options: ${schema.options.join(", ")}`);
    }

    return rules.join("; ") || "None";
  }

  /**
   * Get column width based on field type
   * @param {Object} schema - Schema object
   * @returns {number} - Column width
   */
  static getColumnWidth(schema) {
    switch (schema.fieldType) {
      case "text":
        return 20;
      case "number":
        return 12;
      case "select":
      case "multiselect":
        return 15;
      case "boolean":
        return 10;
      case "file":
        return 25;
      default:
        return 15;
    }
  }

  /**
   * Generate JSON example
   * @param {Array} schemas - Array of schema objects
   * @returns {string} - JSON example
   */
  static generateJsonExample(schemas) {
    const example = {};
    schemas.forEach((schema) => {
      example[schema.fieldName] = this.getSampleData(schema);
    });
    return JSON.stringify(example, null, 2);
  }
  /**
   * Generate Bulk Catalogue Template for a category
   * @param {Object} category - Category object
   * @param {Array} schemas - Category schemas (product and variant attributes)
   * @returns {Promise<Buffer>} - Excel file buffer
   */
  static async generateBulkCatalogueTemplate(category, schemas) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Trabuwo System";
      workbook.lastModifiedBy = "Trabuwo System";
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet("Bulk Upload");
      worksheet.name = "Bulk Upload";

      // Define standard columns
      const baseColumns = [
        { header: "Catalogue Name*", key: "catalogueName", width: 25, required: true, help: "Group variants into same catalogue using this name" },
        { header: "Product Name*", key: "productName", width: 25, required: true, help: "Group variants into same product within a catalogue" },
        { header: "Product Description", key: "productDescription", width: 30, required: false, help: "Optional description for the product" },
        { header: "MRP*", key: "mrp", width: 12, required: true, help: "Maximum Retail Price", type: "number" },
        { header: "Selling Price*", key: "trabuwoPrice", width: 15, required: true, help: "Your selling price on Trabuwo", type: "number" },
        { header: "GST %*", key: "gst", width: 10, required: true, help: "Applicable GST percentage (e.g., 5, 12, 18)", type: "number" },
        { header: "Size*", key: "size", width: 12, required: true, help: "Size of this variant (e.g., XL, S, 42)" },
        { header: "Quantity/Stock*", key: "quantity", width: 15, required: true, help: "Available stock for this variant", type: "number" },
        { header: "SKU", key: "sku", width: 15, required: false, help: "Your internal stock keeping unit" },
        { header: "Image 1*", key: "image1", width: 25, required: true, help: "Filename in zip, e.g. prod1_main.jpg" },
        { header: "Image 2", key: "image2", width: 25, required: false, help: "Additional image filename" },
        { header: "Image 3", key: "image3", width: 25, required: false, help: "Additional image filename" },
        { header: "Image 4", key: "image4", width: 25, required: false, help: "Additional image filename" },
        { header: "Image 5", key: "image5", width: 25, required: false, help: "Additional image filename" },
      ];

      // Add dynamic columns from schema
      const dynamicColumns = schemas.map(schema => ({
        header: `${schema.label}${schema.required ? "*" : ""}`,
        key: `attr_${schema.fieldName}`,
        width: this.getColumnWidth(schema),
        required: schema.required,
        help: schema.description || "",
        schema: schema // Keep schema reference for validation
      }));

      const allColumns = [...baseColumns, ...dynamicColumns];

      // Set headers (Row 1)
      const headerRow = worksheet.getRow(1);
      allColumns.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = col.header;
      });

      // Set Help/Description (Row 2) - Hidden or Small
      const helpRow = worksheet.getRow(2);
      allColumns.forEach((col, idx) => {
        const cell = helpRow.getCell(idx + 1);
        cell.value = col.help;
      });

      // Format Headers
      headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEA3B08" } }; // Trabuwo Orange
      headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      headerRow.height = 30;

      helpRow.font = { italic: true, size: 9, color: { argb: "FF666666" } };
      helpRow.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      helpRow.height = 40;

      // Apply Data Validations
      allColumns.forEach((col, idx) => {
        const columnLetter = worksheet.getColumn(idx + 1).letter;
        const range = `${columnLetter}3:${columnLetter}1000`;

        if (col.type === "number") {
          worksheet.dataValidations.add(range, {
            type: "decimal",
            operator: "greaterThanOrEqual",
            formulae: ["0"],
            showErrorMessage: true,
            error: "Please enter a valid positive number"
          });
        }

        if (col.schema) {
          this.applyColumnValidation(worksheet, idx + 1, col.schema, 3);
        }
      });

      // Set column widths
      allColumns.forEach((col, idx) => {
        worksheet.getColumn(idx + 1).width = col.width;
      });

      // Instructions Sheet
      const instructions = workbook.addWorksheet("Instructions");
      instructions.addRow(["BULK CATALOG UPLOAD INSTRUCTIONS"]).font = { bold: true, size: 16 };
      instructions.addRow([]);
      instructions.addRow(["1. Fill in the 'Bulk Upload' sheet."]);
      instructions.addRow(["2. Each row represents one variant (e.g., a specific size)."]);
      instructions.addRow(["3. Grouping: To group variants into the same product, give them the same 'Catalogue Name' and 'Product Name'."]);
      instructions.addRow(["4. Images: Enter the EXACT filename of the image as it appears in your zip file (e.g., shoe_front.jpg)."]);
      instructions.addRow(["5. Zip File: Create a zip folder containing all images mentioned in the Excel. Do not use subfolders."]);
      instructions.addRow(["6. Required Fields: Columns marked with '*' are mandatory."]);
      instructions.addRow(["7. Attributes: Category-specific fields must follow the rules listed in the data entry headers."]);
      
      instructions.getColumn(1).width = 100;

      // Freeze top 2 rows
      worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      throw new Error(`Failed to generate bulk template: ${error.message}`);
    }
  }

  /**
   * Override applyColumnValidation to support custom StartRow
   */
  static applyColumnValidation(worksheet, column, schema, startRow = 5) {
    const columnLetter = worksheet.getColumn(column).letter;
    const range = `${columnLetter}${startRow}:${columnLetter}1000`;

    switch (schema.fieldType) {
      case "select":
      case "multiselect":
        if (schema.options && schema.options.length > 0) {
          worksheet.dataValidations.add(range, {
            type: "list",
            allowBlank: !schema.required,
            formulae: [`"${schema.options.slice(0, 10).join(",")}"`], // Excel list limit
            showErrorMessage: true,
            error: `Select from: ${schema.options.join(", ")}`
          });
        }
        break;
      case "boolean":
        worksheet.dataValidations.add(range, {
          type: "list",
          allowBlank: !schema.required,
          formulae: ['"Yes,No"'],
          showErrorMessage: true,
          error: "Select Yes or No"
        });
        break;
      case "number":
        worksheet.dataValidations.add(range, {
          type: "decimal",
          allowBlank: !schema.required,
          showErrorMessage: true,
          error: "Enter a valid number"
        });
        break;
    }
  }
}

module.exports = ExcelService;
