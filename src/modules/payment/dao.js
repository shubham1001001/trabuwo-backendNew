const {
  Payment,
  Refund,
  RazorpayContact,
  RazorpayFundAccount,
  BankValidation,
} = require("./model");
const { Order } = require("../order/model");

exports.createPayment = (data, options = {}) => Payment.create(data, options);

exports.findPaymentById = (paymentId) => Payment.findByPk(paymentId);

exports.findPaymentByPublicId = (paymentPublicId) =>
  Payment.findOne({ where: { publicId: paymentPublicId } });

exports.findPaymentByGatewayOrderId = (gatewayOrderId) =>
  Payment.findOne({ where: { gatewayOrderId } });

exports.findPaymentByOrderPublicId = async (orderPublicId) => {
  const order = await Order.findOne({
    where: { publicId: orderPublicId },
    attributes: ["id"],
  });
  if (!order) return null;
  return Payment.findOne({ where: { orderId: order.id } });
};

exports.updatePaymentStatusById = (paymentId, status, data = {}) =>
  Payment.update({ status, ...data }, { where: { id: paymentId } });

exports.getPaymentWithOrderByPublicId = (paymentPublicId) =>
  Payment.findOne({
    where: { publicId: paymentPublicId },
    include: [
      {
        model: Order,
        as: "order",
        attributes: ["publicId", "totalAmount", "status"],
      },
    ],
  });

exports.findOrderByPublicId = (orderPublicId) =>
  Order.findOne({
    where: { publicId: orderPublicId },
    attributes: ["id", "publicId", "buyerId", "status", "totalAmount"],
  });

exports.findPaymentByGatewayPaymentId = (gatewayPaymentId) =>
  Payment.findOne({ where: { gatewayPaymentId } });

exports.createRefund = (data, options = {}) => Refund.create(data, options);

exports.findRefundByGatewayRefundId = (gatewayRefundId) =>
  Refund.findOne({ where: { gatewayRefundId } });

exports.upsertRazorpayContact = async (contactData, options = {}) => {
  const { razorpayContactId, name, email, contact, type, referenceId, active, notes, metadata } = contactData;

  const [contactRecord] = await RazorpayContact.upsert(
    {
      razorpayContactId,
      name,
      email: email || null,
      contact: contact || null,
      type: type || null,
      referenceId: referenceId || null,
      active: active !== undefined ? active : true,
      notes: notes || {},
      metadata: metadata || {},
    },
    {
      ...options,
      returning: true,
      conflictFields: ["razorpay_contact_id"],
    }
  );

  return contactRecord;
};

exports.findRazorpayContactByRazorpayId = (razorpayContactId, options = {}) =>
  RazorpayContact.findOne({
    where: { razorpayContactId },
    ...options,
  });

exports.upsertRazorpayFundAccount = async (fundAccountData, options = {}) => {
  const {
    razorpayFundAccountId,
    razorpayContactId,
    userBankInfoId,
    accountType,
    bankAccountDetails,
    vpaDetails,
    active,
    metadata,
  } = fundAccountData;

  const [fundAccountRecord] = await RazorpayFundAccount.upsert(
    {
      razorpayFundAccountId,
      razorpayContactId,
      userBankInfoId: userBankInfoId || null,
      accountType,
      bankAccountDetails: bankAccountDetails || null,
      vpaDetails: vpaDetails || null,
      active: active !== undefined ? active : true,
      metadata: metadata || {},
    },
    {
      ...options,
      returning: true,
      conflictFields: ["razorpay_fund_account_id"],
    }
  );

  return fundAccountRecord;
};

exports.findRazorpayFundAccountByRazorpayId = (razorpayFundAccountId, options = {}) =>
  RazorpayFundAccount.findOne({
    where: { razorpayFundAccountId },
    ...options,
  });

exports.findRazorpayFundAccountByUserBankInfoId = (userBankInfoId, options = {}) =>
  RazorpayFundAccount.findOne({
    where: { userBankInfoId },
    ...options,
  });

exports.createBankValidation = (data, options = {}) =>
  BankValidation.create(data, options);

exports.findBankValidationByRazorpayId = (razorpayValidationId, options = {}) =>
  BankValidation.findOne({
    where: { razorpayValidationId },
    ...options,
  });

exports.findBankValidationByRazorpayFundAccountId = (razorpayFundAccountId, options = {}) =>
  BankValidation.findOne({
    where: { razorpayFundAccountId },
    order: [["createdAt", "DESC"]],
    ...options,
  });
