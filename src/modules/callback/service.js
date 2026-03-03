const callbackDao = require("./dao");

exports.createCallback = async (callbackData, userId) => {
  const { mobile, status = "pending" } = callbackData;
  return await callbackDao.createCallback({ userId, mobile, status });
};

exports.updateCallbackStatus = async (id, status) => {
  return await callbackDao.updateCallbackStatus(id, status);
};

exports.deleteCallback = async (id) => {
  return await callbackDao.deleteCallback(id);
};

exports.getAllCallbacks = async (page, limit) => {
  return await callbackDao.getAllCallbacks(page, limit);
};

exports.getCallbackById = async (id) => {
  return await callbackDao.getCallbackById(id);
};
