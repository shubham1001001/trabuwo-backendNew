const dao = require("./dao");
const categoryDao = require("../category/dao");
const categoryService = require("../category/service");
const {
  ValidationError,
  DatabaseError,
  NotFoundError,
  ApiError,
} = require("../../utils/errors");
const ExcelService = require("../../utils/excelService");
const sequelize = require("../../config/database");

exports.createCategorySchema = async (data) => {
  const category = await categoryDao.getCategoryById(data.categoryId);
  if (!category || category.isDeleted) {
    throw new ValidationError("Category does not exist");
  }

  // Check for duplicate field name in the same category
  const existing = await dao.getSchemaByCategoryAndFieldName(
    data.categoryId,
    data.fieldName
  );
  if (existing) {
    throw new ValidationError("Field name already exists in this category");
  }

  // Validate field type specific requirements
  await validateFieldTypeRequirements(data);

  return await dao.createCategorySchema(data);
};

exports.getCategorySchemaById = async (id) => {
  const schema = await dao.getCategorySchemaById(id);
  if (!schema) {
    throw new NotFoundError("Category schema not found");
  }
  return schema;
};

exports.getCategorySchemasByCategoryId = async (categoryId) => {
  // Check if category exists
  const category = await categoryDao.getCategoryById(categoryId);
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }

  return await dao.getCategorySchemasByCategoryId(categoryId);
};

exports.getAllCategorySchemas = async (filters = {}) => {
  return await dao.getAllCategorySchemas(filters);
};

exports.updateCategorySchemaById = async (id, data) => {
  const schema = await dao.getCategorySchemaById(id);
  if (!schema) {
    throw new NotFoundError("Category schema not found");
  }

  // If fieldName is being updated, check for duplicates
  if (data.fieldName && data.fieldName !== schema.fieldName) {
    const existing = await dao.getSchemaByCategoryAndFieldName(
      schema.categoryId,
      data.fieldName
    );
    if (existing) {
      throw new ValidationError("Field name already exists in this category");
    }
  }

  // Validate field type specific requirements if fieldType is being updated
  if (data.fieldType) {
    await validateFieldTypeRequirements({ ...schema.toJSON(), ...data });
  }

  const result = await dao.updateCategorySchemaById(id, data);
  if (result[0] === 0) {
    throw new NotFoundError("Category schema not found");
  }

  return await dao.getCategorySchemaById(id);
};

exports.deleteCategorySchemaById = async (id) => {
  const schema = await dao.getCategorySchemaById(id);
  if (!schema) {
    throw new NotFoundError("Category schema not found");
  }

  const result = await dao.deleteCategorySchemaById(id);
  if (result[0] === 0) {
    throw new NotFoundError("Category schema not found");
  }

  return true;
};

exports.deleteCategorySchemasByCategoryId = async (categoryId) => {
  const category = await categoryDao.getCategoryById(categoryId);
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }

  const deletedCount = await dao.deleteCategorySchemasByCategoryId(categoryId);
  return deletedCount;
};

// Additional helper methods for better functionality
exports.getSchemasByFieldType = async (fieldType) => {
  return await dao.getAllCategorySchemas({ fieldType });
};

exports.bulkUpdateSchemas = async (updates) => {
  const results = [];
  for (const update of updates) {
    const result = await this.updateCategorySchemaById(update.id, update.data);
    results.push(result);
  }
  return results;
};

exports.validateSchemaForCategory = async (categoryId, data, options = {}) => {
  const schemas = await dao.getCategorySchemasByCategoryId(categoryId, options);
  const validationErrors = [];

  for (const schema of schemas) {
    if (schema.required && !data[schema.fieldName]) {
      validationErrors.push(`${schema.label} is required`);
    }

    if (data[schema.fieldName] && schema.validation) {
      const fieldErrors = validateFieldValue(
        data[schema.fieldName],
        schema.validation,
        schema.fieldType,
        schema.label
      );
      validationErrors.push(...fieldErrors);
    }
  }
  if (validationErrors.length > 0) {
    throw new ValidationError("Validation error", validationErrors);
  }

  return true;
};

exports.bulkCreateSchemas = async (schemas, categoryId) => {
  schemas.forEach((schema) => (schema.categoryId = categoryId));
  const category = await categoryDao.getCategoryById(categoryId);

  if (!category || category.isDeleted) {
    throw new ValidationError("Category does not exist");
  }

  return await sequelize.transaction(async (t) => {
    const createdSchemas = await dao.bulkCreateSchemas(schemas, {
      transaction: t,
    });
    return createdSchemas;
  });
};

exports.generateExcelTemplate = async (categoryId) => {
  try {
    // Check if category exists
    const category = await categoryDao.getCategoryById(categoryId);
    if (!category || category.isDeleted) {
      throw new ApiError(404, "Category not found", "NOT_FOUND");
    }

    // Get schemas for the category
    const schemas = await dao.getCategorySchemasByCategoryId(categoryId);
    if (!schemas || schemas.length === 0) {
      throw new ValidationError("No schemas found for this category");
    }

    // Generate Excel template
    const excelBuffer = await ExcelService.generateSchemaTemplate(
      schemas,
      category.name
    );

    return {
      buffer: excelBuffer,
      filename: `${category.name.replace(/[^a-zA-Z0-9]/g, "_")}_template.xlsx`,
      categoryName: category.name,
      schemaCount: schemas.length,
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ApiError) {
      throw error;
    }
    throw new DatabaseError("Failed to generate Excel template", error.message);
  }
};

exports.validateVariantDynamicFields = async (categoryId, dynamicFields) => {
  const schemas = await dao.getCategorySchemasByCategoryId(categoryId);
  const variantSchemas = schemas.filter(
    (schema) => schema.section === "addVariant"
  );

  const validationErrors = [];

  for (const schema of variantSchemas) {
    const fieldValue = dynamicFields[schema.fieldName];

    if (
      schema.required &&
      (fieldValue === undefined || fieldValue === null || fieldValue === "")
    ) {
      validationErrors.push(`Field '${schema.label}' is required`);
    }

    if (fieldValue === undefined || fieldValue === null) continue;

    switch (schema.fieldType) {
      case "text":
        if (typeof fieldValue !== "string") {
          validationErrors.push(`Field '${schema.label}' must be a string`);
        }
        break;
      case "number":
        if (typeof fieldValue !== "number" || isNaN(fieldValue)) {
          validationErrors.push(`Field '${schema.label}' must be a number`);
        }
        break;
      case "boolean":
        if (typeof fieldValue !== "boolean") {
          validationErrors.push(`Field '${schema.label}' must be a boolean`);
        }
        break;
      case "select":
        if (!schema.options || !schema.options.includes(fieldValue)) {
          validationErrors.push(
            `Field '${schema.label}' must be one of: ${schema.options.join(
              ", "
            )}`
          );
        }
        break;
      case "multiselect":
        if (
          !Array.isArray(fieldValue) ||
          !fieldValue.every((val) => schema.options.includes(val))
        ) {
          validationErrors.push(
            `Field '${schema.label}' must be an array of: ${schema.options.join(
              ", "
            )}`
          );
        }
        break;
      case "file":
        if (typeof fieldValue !== "string") {
          validationErrors.push(
            `Field '${schema.label}' must be a file URL string`
          );
        }
        break;
    }

    if (schema.validation) {
      const validation = schema.validation;

      if (validation.minLength && fieldValue.length < validation.minLength) {
        validationErrors.push(
          `Field '${schema.label}' must be at least ${validation.minLength} characters`
        );
      }

      if (validation.maxLength && fieldValue.length > validation.maxLength) {
        validationErrors.push(
          `Field '${schema.label}' must be at most ${validation.maxLength} characters`
        );
      }

      if (validation.min && fieldValue < validation.min) {
        validationErrors.push(
          `Field '${schema.label}' must be at least ${validation.min}`
        );
      }

      if (validation.max && fieldValue > validation.max) {
        validationErrors.push(
          `Field '${schema.label}' must be at most ${validation.max}`
        );
      }
    }
  }

  if (validationErrors.length > 0) {
    throw new ValidationError("Validation error", validationErrors);
  }

  return true;
};

const validateFieldTypeRequirements = async (data) => {
  if (data.fieldType === "select" || data.fieldType === "multiselect") {
    if (
      !data.options ||
      !Array.isArray(data.options) ||
      data.options.length === 0
    ) {
      throw new ValidationError(
        `${data.fieldType} field type requires options array`
      );
    }
  }
};

const validateFieldValue = (value, validation, fieldType, fieldLabel) => {
  const errors = [];

  if (validation.minLength && value.length < validation.minLength) {
    errors.push(
      `Field '${fieldLabel}' must be at least ${validation.minLength} characters`
    );
  }

  if (validation.maxLength && value.length > validation.maxLength) {
    errors.push(
      `Field '${fieldLabel}' must be at most ${validation.maxLength} characters`
    );
  }

  if (validation.min && fieldType === "number" && value < validation.min) {
    errors.push(`Field '${fieldLabel}' must be at least ${validation.min}`);
  }

  if (validation.max && fieldType === "number" && value > validation.max) {
    errors.push(`Field '${fieldLabel}' must be at most ${validation.max}`);
  }

  return errors;
};

exports.getAvailableFilters = async (categoryId) => {
  const parsedCategoryId = parseInt(categoryId);

  // Check if category exists
  const category = await categoryDao.getCategoryById(parsedCategoryId);
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }

  // Check if category has children
  const directChildren = await categoryDao.getCategoriesByParentId(
    parsedCategoryId
  );
  const hasChildren = directChildren.length > 0;

  let categoryIdsToQuery = [parsedCategoryId];

  if (hasChildren) {
    // Get all leaf descendant category IDs
    const allCategories = await categoryDao.getAllCategories({
      isDeleted: false,
    });
    const { getAllLeafDescendants } = require("../category/helper");
    const leafDescendants = getAllLeafDescendants(
      allCategories,
      parsedCategoryId
    );
    categoryIdsToQuery = leafDescendants.map((cat) => cat.id);
  }

  // Get filters for the category(ies)
  const filters = await dao.getAvailableFilters(categoryIdsToQuery);

  // Aggregate filters by fieldName (merge options when same fieldName exists)
  const fieldMap = new Map();

  // Process product filters
  filters.productFilters.forEach((filter) => {
    const fieldName = filter.fieldName;
    if (fieldMap.has(fieldName)) {
      const existing = fieldMap.get(fieldName);
      // Merge options if both have options arrays
      if (filter.options && Array.isArray(filter.options)) {
        const combinedOptions = [
          ...(existing.options || []),
          ...filter.options,
        ];
        existing.options = [...new Set(combinedOptions)];
      }
    } else {
      fieldMap.set(fieldName, {
        fieldName: filter.fieldName,
        fieldType: filter.fieldType,
        label: filter.label,
        description: filter.description || null,
        options: filter.options ? [...filter.options] : null,
        section: filter.section,
      });
    }
  });

  // Process variant filters
  const variantFieldMap = new Map();
  filters.variantFilters.forEach((filter) => {
    const fieldName = filter.fieldName;
    if (variantFieldMap.has(fieldName)) {
      const existing = variantFieldMap.get(fieldName);
      // Merge options if both have options arrays
      if (filter.options && Array.isArray(filter.options)) {
        const combinedOptions = [
          ...(existing.options || []),
          ...filter.options,
        ];
        existing.options = [...new Set(combinedOptions)];
      }
    } else {
      variantFieldMap.set(fieldName, {
        fieldName: filter.fieldName,
        fieldType: filter.fieldType,
        label: filter.label,
        description: filter.description || null,
        options: filter.options ? [...filter.options] : null,
        section: filter.section,
      });
    }
  });

  return {
    productFilters: Array.from(fieldMap.values()),
    variantFilters: Array.from(variantFieldMap.values()),
  };
};

exports.getAllUniqueFilters = async () => {
  const schemas = await dao.getAllFilterableFields();

  const fieldMap = new Map();

  schemas.forEach((schema) => {
    const fieldName = schema.fieldName;

    if (fieldMap.has(fieldName)) {
      const existing = fieldMap.get(fieldName);

      if (schema.options && Array.isArray(schema.options)) {
        const combinedOptions = [
          ...(existing.options || []),
          ...schema.options,
        ];
        existing.options = [...new Set(combinedOptions)];
      }
    } else {
      fieldMap.set(fieldName, {
        fieldName: schema.fieldName,
        fieldType: schema.fieldType,
        label: schema.label,
        description: schema.description || null,
        options: schema.options || null,
        section: schema.section,
      });
    }
  });

  const uniqueFields = Array.from(fieldMap.values());
  const { productFilters, variantFilters } = uniqueFields.reduce(
    (acc, field) => {
      if (field.section === "addVariant") {
        acc.variantFilters.push(field);
      } else {
        acc.productFilters.push(field);
      }
      return acc;
    },
    { productFilters: [], variantFilters: [] }
  );

  return {
    productFilters,
    variantFilters,
  };
};

exports.getAvailableFiltersWithCategories = async (categoryId) => {
  const parsedCategoryId = parseInt(categoryId);

  const filters = await exports.getAvailableFilters(parsedCategoryId);
  const childrenOrSiblings =
    await categoryService.getCategoryChildrenOrSiblings(parsedCategoryId);

  return {
    ...filters,
    childrenOrSiblings,
  };
};
