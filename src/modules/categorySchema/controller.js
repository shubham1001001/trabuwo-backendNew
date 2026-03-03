const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const ApiError = require("../../utils/ApiError");
const { ValidationError, DatabaseError } = require("../../utils/errors");

exports.createCategorySchema = async (req, res) => {
  try {
    const schema = await service.createCategorySchema(req.body);
    return apiResponse.success(
      res,
      schema,
      "Category schema created successfully",
      201
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ApiError(400, error.message, "VALIDATION_ERROR");
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.getCategorySchemaById = async (req, res) => {
  try {
    const schema = await service.getCategorySchemaById(req.params.id);
    return apiResponse.success(
      res,
      schema,
      "Category schema retrieved successfully"
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.getCategorySchemasByCategoryId = async (req, res) => {
  try {
    const schemas = await service.getCategorySchemasByCategoryId(
      req.params.categoryId
    );
    return apiResponse.success(
      res,
      schemas,
      "Category schemas retrieved successfully"
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.getAllCategorySchemas = async (req, res) => {
  try {
    const filters = {};
    if (req.query.fieldType) filters.fieldType = req.query.fieldType;

    const schemas = await service.getAllCategorySchemas(filters);
    return apiResponse.success(
      res,
      schemas,
      "Category schemas retrieved successfully"
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.updateCategorySchema = async (req, res) => {
  try {
    const updatedSchema = await service.updateCategorySchemaById(
      req.params.id,
      req.body
    );
    return apiResponse.success(
      res,
      updatedSchema,
      "Category schema updated successfully"
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ApiError(400, error.message, "VALIDATION_ERROR");
    }
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.deleteCategorySchema = async (req, res) => {
  try {
    await service.deleteCategorySchemaById(req.params.id);
    return apiResponse.success(
      res,
      null,
      "Category schema deleted successfully"
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.deleteCategorySchemasByCategoryId = async (req, res) => {
  const deletedCount = await service.deleteCategorySchemasByCategoryId(
    req.params.categoryId
  );
  return apiResponse.success(
    res,
    { deletedCount },
    `${deletedCount} category schema(s) deleted successfully`
  );
};

// Additional controller methods for enhanced functionality
exports.getSchemasByFieldType = async (req, res) => {
  try {
    const { fieldType } = req.params;
    const schemas = await service.getSchemasByFieldType(fieldType);
    return apiResponse.success(
      res,
      schemas,
      `Schemas with field type '${fieldType}' retrieved successfully`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.bulkUpdateSchemas = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ApiError(400, "Updates array is required", "VALIDATION_ERROR");
    }

    const results = await service.bulkUpdateSchemas(updates);
    return apiResponse.success(res, results, "Schemas updated successfully");
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ApiError(400, error.message, "VALIDATION_ERROR");
    }
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.validateSchemaForCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const data = req.body;

    await service.validateSchemaForCategory(categoryId, data);
    return apiResponse.success(
      res,
      null,
      "Data validation passed successfully"
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ApiError(400, error.message, "VALIDATION_ERROR");
    }
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.bulkCreateSchemas = async (req, res) => {
  const { schemas, categoryId } = req.body;
  const createdSchemas = await service.bulkCreateSchemas(schemas, categoryId);
  return apiResponse.success(
    res,
    createdSchemas,
    `${createdSchemas.length} schemas created successfully`,
    201
  );
};

exports.downloadExcelTemplate = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const excelData = await service.generateExcelTemplate(categoryId);

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${excelData.filename}"`
    );
    res.setHeader("Content-Length", excelData.buffer.length);

    // Send the Excel file buffer
    res.send(excelData.buffer);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ApiError(400, error.message, "VALIDATION_ERROR");
    }
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw new ApiError(500, error.message, "DATABASE_ERROR");
    }
    throw error;
  }
};

exports.getAvailableFilters = async (req, res) => {
  const filtersWithCategories = await service.getAvailableFiltersWithCategories(
    req.params.categoryId
  );
  return apiResponse.success(
    res,
    filtersWithCategories,
    "Available filters retrieved successfully"
  );
};

exports.getAllUniqueFilters = async (req, res) => {
  const filters = await service.getAllUniqueFilters();
  return apiResponse.success(
    res,
    filters,
    "All unique filterable fields retrieved successfully"
  );
};
