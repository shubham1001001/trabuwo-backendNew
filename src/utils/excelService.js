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
}

module.exports = ExcelService;
