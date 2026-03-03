const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.getAvailableTrainingSlots = async (req, res) => {
  const filters = {};
  if (req.query.language) filters.language = req.query.language;
  if (req.query.date) filters.date = req.query.date;

  const slots = await service.getAvailableTrainingSlots(filters);
  return apiResponse.success(res, slots);
};

exports.bookTrainingSlot = async (req, res) => {
  const bookedSlot = await service.bookTrainingSlot(req.params.id, req.user.id);
  return apiResponse.success(
    res,
    bookedSlot,
    "Training slot booked successfully"
  );
};

exports.getUserBookedSlots = async (req, res) => {
  const slots = await service.getUserBookedSlots(req.user.id);
  return apiResponse.success(res, slots);
};

exports.createTrainingSlot = async (req, res) => {
  const slot = await service.createTrainingSlot(req.body);
  return apiResponse.success(
    res,
    slot,
    "Training slot created successfully",
    201
  );
};
