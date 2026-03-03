const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.verifyAndStore = async (req, res) => {
  const { idValue } = req.body;

  const dto = await service.verifyAndStoreForUser(req.user.id, {
    idValue,
  });

  return apiResponse.success(
    res,
    dto,
    "GST/EID verification completed successfully",
    201
  );
};

exports.getCurrent = async (req, res) => {
  const dto = await service.getForUser(req.user.id);

  return apiResponse.success(
    res,
    dto,
    "GST/EID verification details fetched successfully"
  );
};

