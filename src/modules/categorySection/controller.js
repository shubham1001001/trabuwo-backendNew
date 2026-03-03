const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

exports.createSection = asyncHandler(async (req, res) => {
  const created = await service.createSection(req.body);
  return apiResponse.success(res, created, "Section created", 201);
});

exports.getPublicByCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.categoryId
    ? parseInt(req.params.categoryId, 10)
    : 769; // Hardcoded category id for home page
  const deviceType = req.query.deviceType;

  const knownParams = ["deviceType"];
  const filter = {};

  const queryString = (req.originalUrl || req.url).split("?")[1] || "";
  const searchParams = new URLSearchParams(queryString);

  for (const key of searchParams.keys()) {
    if (knownParams.includes(key)) continue;
    const allValues = searchParams.getAll(key).filter(
      (v) => v !== undefined && v !== ""
    );
    if (allValues.length === 0) continue;
    if (allValues.length > 1) {
      filter[key] = allValues;
    } else {
      const raw = allValues[0];
      if (typeof raw === "string" && raw.includes(",")) {
        const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
        filter[key] = parts.length === 1 ? parts[0] : parts;
      } else {
        filter[key] = raw;
      }
    }
  }

  const filterObject = Object.keys(filter).length > 0 ? filter : null;

  const sections = await service.getPublicSectionsByCategoryId(
    categoryId,
    deviceType,
    filterObject
  );

  return apiResponse.success(res, sections, "Sections fetched");
});

exports.updateSection = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const updated = await service.updateSection(publicId, req.body);

  return apiResponse.success(
    res,
    {
      publicId: updated.publicId,
      categoryId: updated.categoryId,
      name: updated.name,
      displayOrder: updated.displayOrder,
      layout: updated.layout,
      column: updated.column,
      isActive: updated.isActive,
    },
    "Category section updated"
  );
});
