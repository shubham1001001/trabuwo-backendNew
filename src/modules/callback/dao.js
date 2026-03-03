const { Callback } = require("./model");
const { NotFoundError } = require("../../utils/errors");

exports.createCallback = async (callbackData) => {
  return await Callback.create(callbackData);
};

exports.updateCallbackStatus = async (id, status) => {
  const callback = await Callback.findByPk(id);
  if (!callback) {
    throw new NotFoundError("Callback not found");
  }

  await callback.update({ status });
  return callback;
};

exports.deleteCallback = async (id) => {
  const callback = await Callback.findByPk(id);
  if (!callback) {
    throw new NotFoundError("Callback not found");
  }

  await callback.destroy();
  return { message: "Callback deleted successfully" };
};

exports.getAllCallbacks = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Callback.findAndCountAll({
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    callbacks: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit),
    },
  };
};

exports.getCallbackById = async (id) => {
  const callback = await Callback.findByPk(id);
  if (!callback) {
    throw new NotFoundError("Callback not found");
  }
  return callback;
};
