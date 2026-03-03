const CategorySchema = require("./model");
const Category = require("../category/model");
const { DatabaseError } = require("../../utils/errors");

exports.createCategorySchema = async (data) => {
  try {
    return await CategorySchema.create(data);
  } catch (error) {
    throw new DatabaseError("Failed to create category schema", error.message);
  }
};

exports.getCategorySchemaById = async (id) => {
  return await CategorySchema.findOne({
    where: { id, isActive: true },
    include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
  });
};

exports.getCategorySchemasByCategoryId = async (categoryId, options = {}) => {
  return await CategorySchema.findAll({
    where: {
      categoryId,
      isActive: true,
    },
    order: [["order", "ASC"]],
    ...options,
  });
};

exports.getAllCategorySchemas = async (filters = {}) => {
  try {
    const whereClause = { isActive: true, ...filters };
    return await CategorySchema.findAll({
      where: whereClause,
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
      ],
      order: [["order", "ASC"]],
    });
  } catch (error) {
    throw new DatabaseError(
      "Failed to retrieve all category schemas",
      error.message
    );
  }
};

exports.updateCategorySchemaById = async (id, data) => {
  try {
    return await CategorySchema.update(data, { where: { id, isActive: true } });
  } catch (error) {
    throw new DatabaseError("Failed to update category schema", error.message);
  }
};

exports.deleteCategorySchemaById = async (id) => {
  try {
    return await CategorySchema.update({ isActive: false }, { where: { id } });
  } catch (error) {
    throw new DatabaseError("Failed to delete category schema", error.message);
  }
};

exports.deleteCategorySchemasByCategoryId = async (categoryId) => {
  const deletedCount = await CategorySchema.destroy({
    where: { categoryId },
  });
  return deletedCount;
};

exports.getSchemaByCategoryAndFieldName = async (categoryId, fieldName) => {
  try {
    return await CategorySchema.findOne({
      where: { categoryId, fieldName, isActive: true },
    });
  } catch (error) {
    throw new DatabaseError(
      "Failed to retrieve schema by category and field name",
      error.message
    );
  }
};

exports.bulkCreateSchemas = async (schemas) => {
  return await CategorySchema.bulkCreate(schemas, {
    validate: true,
    returning: true,
  });
};

exports.bulkUpdateSchemas = async (updates) => {
  try {
    const transaction = await CategorySchema.sequelize.transaction();
    try {
      const results = [];
      for (const update of updates) {
        const result = await CategorySchema.update(update.data, {
          where: { id: update.id, isActive: true },
          transaction,
        });
        results.push(result);
      }
      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw new DatabaseError("Failed to bulk update schemas", error.message);
  }
};

exports.getSchemasWithCategoryInfo = async (filters = {}) => {
  try {
    const whereClause = { isActive: true, ...filters };
    return await CategorySchema.findAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "description"],
          where: { isDeleted: false },
        },
      ],
      order: [
        ["categoryId", "ASC"],
        ["order", "ASC"],
      ],
    });
  } catch (error) {
    throw new DatabaseError(
      "Failed to retrieve schemas with category info",
      error.message
    );
  }
};

exports.getSchemaCountByCategory = async (categoryId) => {
  try {
    return await CategorySchema.count({
      where: { categoryId, isActive: true },
    });
  } catch (error) {
    throw new DatabaseError(
      "Failed to get schema count by category",
      error.message
    );
  }
};

exports.getSchemasByFieldType = async (fieldType) => {
  try {
    return await CategorySchema.findAll({
      where: { fieldType, isActive: true },
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
      ],
      order: [["order", "ASC"]],
    });
  } catch (error) {
    throw new DatabaseError(
      "Failed to retrieve schemas by field type",
      error.message
    );
  }
};

exports.getRequiredSchemasByCategory = async (categoryId) => {
  try {
    return await CategorySchema.findAll({
      where: { categoryId, required: true, isActive: true },
      order: [["order", "ASC"]],
    });
  } catch (error) {
    throw new DatabaseError(
      "Failed to retrieve required schemas by category",
      error.message
    );
  }
};

exports.updateSchemaOrder = async (id, order) => {
  try {
    return await CategorySchema.update(
      { order },
      { where: { id, isActive: true } }
    );
  } catch (error) {
    throw new DatabaseError("Failed to update schema order", error.message);
  }
};

exports.getNextOrderForCategory = async (categoryId) => {
  try {
    const maxOrder = await CategorySchema.max("order", {
      where: { categoryId, isActive: true },
    });
    return (maxOrder || 0) + 1;
  } catch (error) {
    throw new DatabaseError(
      "Failed to get next order for category",
      error.message
    );
  }
};

exports.getAvailableFilters = async (categoryId) => {
  // Support both single categoryId and array of categoryIds
  const categoryIds = Array.isArray(categoryId) ? categoryId : [categoryId];

  const { Op } = require("sequelize");

  const schemas = await CategorySchema.findAll({
    where: {
      categoryId: {
        [Op.in]: categoryIds,
      },
      isFilterable: true,
      isActive: true,
    },
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
    ],
  });

  const { productFilters, variantFilters } = schemas.reduce(
    (acc, schema) => {
      if (schema.section === "addVariant") {
        acc.variantFilters.push(schema);
      } else {
        acc.productFilters.push(schema);
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

exports.getAllFilterableFields = async () => {
  const schemas = await CategorySchema.findAll({
    where: {
      isFilterable: true,
      isActive: true,
    },
    order: [["fieldName", "ASC"]],
  });

  return schemas;
};
