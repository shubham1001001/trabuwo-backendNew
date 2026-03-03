const { UserBankInfo } = require("./model");
const { createBlindIndex } = require("../../utils/blindIndex");

exports.upsertUserBankInfo = async (userId, data, options = {}) => {
  const { accountNumber, ifsc, accountHolderName, upiId, upiName, keyVersion } = data;

  const updateData = {};
  const blindIndexUpdates = {};

  if (keyVersion !== undefined) {
    updateData.keyVersion = keyVersion;
  }

  if (accountNumber !== undefined) {
    updateData.encryptedBankAccountNumber = accountNumber;
    blindIndexUpdates.bankAccountNumberIndex = accountNumber
      ? createBlindIndex(accountNumber)
      : null;
  }

  if (ifsc !== undefined) {
    updateData.encryptedBankIfsc = ifsc;
    blindIndexUpdates.bankIfscIndex = ifsc ? createBlindIndex(ifsc) : null;
  }

  if (accountHolderName !== undefined) {
    updateData.encryptedBankAccountHolderName = accountHolderName;
  }

  if (upiId !== undefined) {
    updateData.encryptedUpiId = upiId;
    blindIndexUpdates.upiIdIndex = upiId ? createBlindIndex(upiId) : null;
  }

  if (upiName !== undefined) {
    updateData.encryptedUpiName = upiName;
  }

  const [userBankInfo] = await UserBankInfo.upsert(
    {
      userId,
      ...updateData,
      ...blindIndexUpdates,
    },
    {
      ...options,
      returning: true,
    }
  );

  return userBankInfo;
};

exports.findUserBankInfoByUserId = (userId, options = {}) =>
  UserBankInfo.findOne({
    where: { userId },
    ...options,
  });

exports.findUserBankInfoByPublicId = (publicId, options = {}) =>
  UserBankInfo.findOne({
    where: { publicId },
    ...options,
  });

exports.findByBlindIndex = (indexType, indexValue, options = {}) => {
  const fieldMap = {
    accountNumber: "bankAccountNumberIndex",
    ifsc: "bankIfscIndex",
    upiId: "upiIdIndex",
  };

  const field = fieldMap[indexType];
  if (!field) {
    throw new Error(`Invalid blind index type: ${indexType}`);
  }

  const blindIndex = createBlindIndex(indexValue);

  return UserBankInfo.findOne({
    where: { [field]: blindIndex },
    ...options,
  });
};
