const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.create = async (req, res, next) => {
  try {
    const result = await service.createSection(req.body, req.files);
    return apiResponse.success(res, result, "Section created successfully", 201);
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const result = await service.getAllSections(req.query);
    return apiResponse.success(res, result, "Sections fetched successfully");
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await service.getSectionById(req.params.id);
    return apiResponse.success(res, result, "Section fetched successfully");
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await service.updateSection(req.params.id, req.body, req.files);
    return apiResponse.success(res, result, "Section updated successfully");
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await service.deleteSection(req.params.id);
    return apiResponse.success(res, null, "Section deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getByCategory = async (req, res, next) => {
  try {
    const result = await service.getSectionsByCategoryId(req.params.categoryId);
    return apiResponse.success(res, result, "Sections fetched successfully");
  } catch (error) {
    next(error);
  }
};
