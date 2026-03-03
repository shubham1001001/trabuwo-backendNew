const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.generateBulkUploadUrls = async (req, res) => {
  const { images } = req.body;
  const userId = req.user.id;

  const result = await service.generateBulkUploadUrls(images, userId);

  return apiResponse.success(
    res,
    result,
    "Bulk upload URLs generated successfully"
  );
};
