const service = require("./service");

const list = async (req, res) => {
  try {
    const brands = await service.getAllOriginalBrands(req.query);
    return res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.redirectCategoryId === "") data.redirectCategoryId = null;

    const brand = await service.createOriginalBrand(data, req.file);
    return res.status(201).json({
      success: true,
      message: "Original Brand Category created successfully",
      data: brand,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { publicId } = req.params;
    const data = { ...req.body };
    if (data.redirectCategoryId === "") data.redirectCategoryId = null;

    await service.updateOriginalBrand(publicId, data, req.file);
    return res.status(200).json({
      success: true,
      message: "Original Brand Category updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    const { publicId } = req.params;
    await service.deleteOriginalBrand(publicId);
    return res.status(200).json({
      success: true,
      message: "Original Brand Category deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  list,
  create,
  update,
  remove,
};
