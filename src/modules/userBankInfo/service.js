const dao = require("./dao");
const { NotFoundError } = require("../../utils/errors");

exports.upsertBankDetails = async (userId, bankData) => {
  const { accountNumber, ifsc, accountHolderName } = bankData;

  const userBankInfo = await dao.upsertUserBankInfo(userId, {
    accountNumber,
    ifsc,
    accountHolderName,
  });

  return userBankInfo;
};

exports.upsertUpiDetails = async (userId, upiData) => {
  const { upiId, upiName } = upiData;

  const userBankInfo = await dao.upsertUserBankInfo(userId, {
    upiId,
    upiName,
  });

  return userBankInfo;
};

exports.getUserBankInfo = async (userId) => {
  const userBankInfo = await dao.findUserBankInfoByUserId(userId);

  if (!userBankInfo) {
    throw new NotFoundError("User bank info not found");
  }

  return {
    publicId: userBankInfo.publicId,
    bankAccountNumber: userBankInfo.encryptedBankAccountNumber,
    bankIfsc: userBankInfo.encryptedBankIfsc,
    bankAccountHolderName: userBankInfo.encryptedBankAccountHolderName,
    upiId: userBankInfo.encryptedUpiId,
    upiName: userBankInfo.encryptedUpiName,
  };
};



exports.getMyBankAndUpiDetails = async (userId) => {
  const userBankInfo = await dao.findUserBankInfoByUserId(userId);

  if (!userBankInfo) {
    throw new NotFoundError("Bank details not found");
  }

  return userBankInfo;
};