const { TrainingSlot } = require("./model");
const { User } = require("../auth/model");
const { Op } = require("sequelize");

exports.createTrainingSlot = (data) => TrainingSlot.create(data);

exports.getAvailableTrainingSlots = (filters = {}) => {
  const whereClause = {
    isBooked: false,
    userId: null,
    startTimestamp: {
      [Op.gt]: new Date(),
    },
  };

  if (filters.language) {
    whereClause.language = filters.language;
  }

  if (filters.date) {
    const startOfDay = new Date(filters.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filters.date);
    endOfDay.setHours(23, 59, 59, 999);

    whereClause.startTimestamp = {
      [Op.between]: [startOfDay, endOfDay],
    };
  }

  return TrainingSlot.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: "bookedBy",
        attributes: ["id", "email", "mobile"],
      },
    ],
    order: [["startTimestamp", "ASC"]],
  });
};

exports.getTrainingSlotById = (id) =>
  TrainingSlot.findByPk(id, {
    include: [
      {
        model: User,
        as: "bookedBy",
        attributes: ["id", "email", "mobile"],
      },
    ],
  });

exports.updateTrainingSlot = (id, data) =>
  TrainingSlot.update(data, { where: { id } });

exports.getUserBookedSlots = (userId) =>
  TrainingSlot.findAll({
    where: {
      userId,
      isBooked: true,
      startTimestamp: {
        [Op.gt]: new Date(),
      },
    },
    include: [
      {
        model: User,
        as: "bookedBy",
        attributes: ["id", "email", "mobile"],
      },
    ],
    order: [["startTimestamp", "ASC"]],
  });

exports.checkUserHasBooking = (userId) =>
  TrainingSlot.findOne({
    where: {
      userId,
      isBooked: true,
      startTimestamp: {
        [Op.gt]: new Date(),
      },
    },
  });
