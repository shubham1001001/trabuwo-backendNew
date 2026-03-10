const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return null;
  if (accountNumber.length <= 4) return "****";
  return `****${accountNumber.slice(-4)}`;
};

exports.upsertBankDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { accountNumber, ifsc, accountHolderName } = req.body;

  const userBankInfo = await service.upsertBankDetails(userId, {
    accountNumber,
    ifsc,
    accountHolderName,
  });

  return apiResponse.success(
    res,
    {
      publicId: userBankInfo.publicId,
      bankAccountNumber: maskAccountNumber(userBankInfo.encryptedBankAccountNumber),
      bankIfsc: userBankInfo.encryptedBankIfsc,
      bankAccountHolderName: userBankInfo.encryptedBankAccountHolderName,
      upiId: userBankInfo.encryptedUpiId,
      upiName: userBankInfo.encryptedUpiName,
    },
    "Bank details updated successfully"
  );
});

exports.upsertUpiDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { upiId, upiName } = req.body;

  const userBankInfo = await service.upsertUpiDetails(userId, {
    upiId,
    upiName,
  });

  return apiResponse.success(
    res,
    {
      publicId: userBankInfo.publicId,
      bankAccountNumber: maskAccountNumber(userBankInfo.encryptedBankAccountNumber),
      bankIfsc: userBankInfo.encryptedBankIfsc,
      bankAccountHolderName: userBankInfo.encryptedBankAccountHolderName,
      upiId: userBankInfo.encryptedUpiId,
      upiName: userBankInfo.encryptedUpiName,
    },
    "UPI details updated successfully"
  );
});


exports.getMyBankAndUpiDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const userBankInfo = await service.getMyBankAndUpiDetails(userId);

  return apiResponse.success(
    res,
    {
      publicId: userBankInfo?.publicId || null,
      bankAccountNumber: maskAccountNumber(userBankInfo?.encryptedBankAccountNumber),
      bankIfsc: userBankInfo?.encryptedBankIfsc || null,
      bankAccountHolderName: userBankInfo?.encryptedBankAccountHolderName || null,
      upiId: userBankInfo?.encryptedUpiId || null,
      upiName: userBankInfo?.encryptedUpiName || null,
    },
    "Bank and UPI details fetched successfully"
  );
});