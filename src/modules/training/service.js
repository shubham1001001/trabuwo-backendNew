const dao = require("./dao");
const {
  NotFoundError,
  ValidationError,
  ConflictError,
} = require("../../utils/errors");

exports.getAvailableTrainingSlots = async (filters = {}) => {
  return dao.getAvailableTrainingSlots(filters);
};

exports.bookTrainingSlot = async (slotId, userId) => {
  const slot = await dao.getTrainingSlotById(slotId);

  if (!slot) {
    throw new NotFoundError("Training slot not found");
  }

  if (slot.isBooked || slot.userId !== null) {
    throw new ConflictError("Training slot is already booked");
  }

  if (slot.startTimestamp <= new Date()) {
    throw new ValidationError("Cannot book past training slots");
  }

  const existingBooking = await dao.checkUserHasBooking(userId);
  if (existingBooking) {
    throw new ConflictError("You already have an active training booking");
  }

  await dao.updateTrainingSlot(slotId, {
    userId,
    isBooked: true,
  });

  return dao.getTrainingSlotById(slotId);
};

exports.getUserBookedSlots = async (userId) => {
  return dao.getUserBookedSlots(userId);
};

exports.createTrainingSlot = async (slotData) => {
  if (slotData.endTimestamp <= slotData.startTimestamp) {
    throw new ValidationError("End time must be after start time");
  }

  if (slotData.startTimestamp <= new Date()) {
    throw new ValidationError("Start time must be in the future");
  }

  return dao.createTrainingSlot(slotData);
};
