const Razorpay = require("razorpay");
const crypto = require("crypto");
const config = require("config");
const dao = require("./dao");
const { UserBankInfo } = require("../userBankInfo/model");
const {
  NotFoundError,
  ValidationError,
  ExternalServiceError,
} = require("../../utils/errors");

const razorpay = new Razorpay({
  key_id: config.get("razorpay.keyId"),
  key_secret: config.get("razorpay.keySecret"),
});

exports.createPaymentOrder = async (
  orderId,
  userId,
  amount,
  description,
  createOptions = {}
) => {
  const { transaction } = createOptions;
  const razorpayOptions = {
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: orderId,
    notes: {
      orderId,
      userId: userId.toString(),
    },
  };

  const razorpayOrder = await razorpay.orders.create(razorpayOptions);

  const payment = await dao.createPayment(
    {
      orderId,
      userId,
      gatewayOrderId: razorpayOrder.id,
      amount,
      description,
      receipt: razorpayOptions.receipt,
    },
    { transaction }
  );

  return {
    paymentId: payment.publicId,
    gatewayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount / 100,
    currency: razorpayOrder.currency,
  };
};

exports.verifyPayment = async (orderPublicId, gatewayPaymentId, signature) => {
  const payment = await dao.findPaymentByOrderPublicId(orderPublicId);
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  const text = `${payment.gatewayOrderId}|${gatewayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", config.get("razorpay.keySecret"))
    .update(text)
    .digest("hex");

  if (signature !== expectedSignature) {
    throw new ValidationError("Invalid payment signature");
  }

  await dao.updatePaymentStatusById(payment.id, "captured", {
    gatewayPaymentId,
    capturedAt: new Date(),
  });

  return dao.findPaymentById(payment.id);
};

exports.processWebhook = async (event, signature, rawBody) => {
  const expectedSignature = crypto
    .createHmac("sha256", config.get("razorpay.webhookSecret"))
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    throw new ValidationError("Invalid webhook signature");
  }

  const { payload } = event;
  const payment = await dao.findPaymentByGatewayOrderId(
    payload.payment.entity.order_id
  );

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  switch (event.event) {
    case "payment.captured":
      await dao.updatePaymentStatusById(payment.id, "captured", {
        gatewayPaymentId: payload.payment.entity.id,
        capturedAt: new Date(),
        paymentMethod: payload.payment.entity.method,
        errorCode: null,
        errorDescription: null,
      });
      break;
    case "payment.failed":
      await dao.updatePaymentStatusById(payment.id, "failed", {
        errorCode: payload.payment.entity.error_code,
        errorDescription: payload.payment.entity.error_description,
        metadata: { failureReason: payload.payment.entity.error_description },
      });
      break;
  }

  return payment;
};

exports.getPaymentStatus = async (paymentPublicId) => {
  const payment = await dao.getPaymentWithOrderByPublicId(paymentPublicId);
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }
  return payment;
};

exports.processRefund = async (gatewayPaymentId, refundOptions = {}) => {
  const { amount, speed, notes, receipt } = refundOptions;

  const payment = await dao.findPaymentByGatewayPaymentId(gatewayPaymentId);
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  if (payment.status !== "captured") {
    throw new ValidationError(
      "Payment must be in captured status to process refund"
    );
  }

  const razorpayOptions = {};
  if (amount !== undefined) {
    razorpayOptions.amount = amount;
  }
  if (speed) {
    razorpayOptions.speed = speed;
  }
  if (notes) {
    razorpayOptions.notes = notes;
  }
  if (receipt) {
    razorpayOptions.receipt = receipt;
  }

  let refund;
  try {
    refund = await razorpay.payments.refund(gatewayPaymentId, razorpayOptions);
  } catch (error) {
    if (error.statusCode === 400) {
      throw new ValidationError(
        error.error?.description || "Failed to process refund"
      );
    }
    throw new ExternalServiceError(
      error.error?.description || "Failed to process refund via Razorpay",
      "RAZORPAY"
    );
  }

  const refundData = {
    paymentId: payment.id,
    gatewayRefundId: refund.id,
    gatewayPaymentId: refund.payment_id,
    amount: refund.amount,
    currency: refund.currency,
    status:
      refund.status === "processed"
        ? "processed"
        : refund.status === "failed"
        ? "failed"
        : "pending",
    speedRequested: refund.speed_requested || null,
    speedProcessed: refund.speed_processed || null,
    receipt: refund.receipt || null,
    notes: refund.notes || {},
    acquirerData: refund.acquirer_data || {},
    batchId: refund.batch_id || null,
  };

  await dao.createRefund(refundData);

  if (refund.status === "processed") {
    const paymentAmountInPaise = Math.round(payment.amount * 100);
    const isFullRefund = !amount || refund.amount >= paymentAmountInPaise;

    if (isFullRefund) {
      await dao.updatePaymentStatusById(payment.id, "refunded", {
        refundedAt: new Date(),
      });
    }
  }

  return {
    id: refund.id,
    amount: refund.amount,
    currency: refund.currency,
    payment_id: refund.payment_id,
    status: refund.status,
    created_at: refund.created_at,
    ...(refund.speed_requested && { speed_requested: refund.speed_requested }),
    ...(refund.speed_processed && { speed_processed: refund.speed_processed }),
    ...(refund.receipt && { receipt: refund.receipt }),
    ...(refund.notes &&
      Object.keys(refund.notes).length > 0 && { notes: refund.notes }),
  };
};

exports.validateBankAccount = async (userBankInfoId, validationData, options = {}) => {
  const { transaction } = options;
  const {
    sourceAccountNumber,
    accountType = "bank_account",
    validationType = "optimized",
    contact,
    referenceId,
    notes,
  } = validationData;

  const userBankInfo = await UserBankInfo.findByPk(userBankInfoId, {
    transaction,
  });

  if (!userBankInfo) {
    throw new NotFoundError("User bank info not found");
  }

  if (accountType === "bank_account") {
    if (!userBankInfo.encryptedBankAccountNumber || !userBankInfo.encryptedBankIfsc) {
      throw new ValidationError(
        "Bank account number and IFSC are required for bank account validation"
      );
    }
  } else if (accountType === "vpa") {
    if (!userBankInfo.encryptedUpiId) {
      throw new ValidationError(
        "UPI ID is required for VPA validation"
      );
    }
  } else {
    throw new ValidationError(
      "Invalid account type. Must be 'bank_account' or 'vpa'"
    );
  }

  const fundAccountPayload = {
    account_type: accountType,
  };

  if (accountType === "bank_account") {
    fundAccountPayload.bank_account = {
      name: userBankInfo.encryptedBankAccountHolderName || "",
      ifsc: userBankInfo.encryptedBankIfsc,
      account_number: userBankInfo.encryptedBankAccountNumber,
    };
  } else if (accountType === "vpa") {
    fundAccountPayload.vpa = {
      address: userBankInfo.encryptedUpiId,
    };
  }

  // Build contact name - use UPI name for VPA, account holder name for bank account
  const contactName =
    contact?.name ||
    (accountType === "vpa"
      ? userBankInfo.encryptedUpiName || ""
      : userBankInfo.encryptedBankAccountHolderName || "");

  const razorpayPayload = {
    source_account_number: sourceAccountNumber,
    ...(accountType === "bank_account" && { validation_type: validationType }),
    fund_account: fundAccountPayload,
    contact: {
      name: contactName,
      ...(contact?.email && { email: contact.email }),
      ...(contact?.contact && { contact: contact.contact }),
      ...(contact?.type && { type: contact.type }),
      ...(contact?.reference_id && { reference_id: contact.reference_id }),
      ...(contact?.notes && { notes: contact.notes }),
    },
    ...(referenceId && { reference_id: referenceId }),
    ...(notes && { notes }),
  };

  let razorpayResponse;
  try {
    razorpayResponse = await razorpay.fundAccounts.validations.create(
      razorpayPayload
    );
  } catch (error) {
    if (error.statusCode === 400) {
      throw new ValidationError(
        error.error?.description || `Failed to validate ${accountType}`
      );
    }
    throw new ExternalServiceError(
      error.error?.description || `Failed to validate ${accountType} via Razorpay`,
      "RAZORPAY"
    );
  }

  const validationResults = razorpayResponse.validation_results || {};
  const statusDetails = razorpayResponse.status_details || {};
  const fundAccount = razorpayResponse.fund_account || {};
  const fundAccountContact = fundAccount.contact || {};

  if (!fundAccountContact.id) {
    throw new ExternalServiceError(
      "Contact information missing in Razorpay response",
      "RAZORPAY"
    );
  }

  const razorpayContact = await dao.upsertRazorpayContact(
    {
      razorpayContactId: fundAccountContact.id,
      name: fundAccountContact.name || "",
      email: fundAccountContact.email || null,
      contact: fundAccountContact.contact || null,
      type: fundAccountContact.type || null,
      referenceId: fundAccountContact.reference_id || null,
      active: fundAccountContact.active !== undefined ? fundAccountContact.active : true,
      notes: fundAccountContact.notes || {},
      metadata: {
        entity: fundAccountContact.entity,
        created_at: fundAccountContact.created_at,
      },
    },
    { transaction }
  );

  if (!fundAccount.id) {
    throw new ExternalServiceError(
      "Fund account information missing in Razorpay response",
      "RAZORPAY"
    );
  }

  const bankAccountData = fundAccount.bank_account || null;
  const vpaData = fundAccount.vpa || null;

  const razorpayFundAccount = await dao.upsertRazorpayFundAccount(
    {
      razorpayFundAccountId: fundAccount.id,
      razorpayContactId: razorpayContact.id,
      userBankInfoId: userBankInfo.id,
      accountType: fundAccount.account_type || "bank_account",
      bankAccountDetails: bankAccountData
        ? {
            name: bankAccountData.name || null,
            ifsc: bankAccountData.ifsc || null,
            account_number: bankAccountData.account_number || null,
            bank_name: bankAccountData.bank_name || null,
          }
        : null,
      vpaDetails: vpaData
        ? {
            address: vpaData.address || null,
          }
        : null,
      active: fundAccount.active !== undefined ? fundAccount.active : true,
      metadata: {
        entity: fundAccount.entity,
        created_at: fundAccount.created_at,
      },
    },
    { transaction }
  );

  const bankValidationData = {
    razorpayFundAccountId: razorpayFundAccount.id,
    razorpayValidationId: razorpayResponse.id,
    status: razorpayResponse.status || "created",
    utr: razorpayResponse.utr || null,
    accountStatus: validationResults.account_status || null,
    registeredName: validationResults.registered_name || null,
    nameMatchScore: validationResults.name_match_score
      ? parseInt(validationResults.name_match_score, 10)
      : null,
    validationDetails: validationResults.details || null,
    statusDetails: {
      description: statusDetails.description || null,
      source: statusDetails.source || null,
      reason: statusDetails.reason || null,
    },
    referenceId: razorpayResponse.reference_id || referenceId || null,
    metadata: {
      entity: razorpayResponse.entity,
      ...(razorpayResponse.notes && { notes: razorpayResponse.notes }),
    },
  };

  const bankValidation = await dao.createBankValidation(bankValidationData, {
    transaction,
  });

  return {
    id: bankValidation.publicId,
    status: bankValidation.status,
    accountStatus: bankValidation.accountStatus,
    registeredName: bankValidation.registeredName,
    nameMatchScore: bankValidation.nameMatchScore,
    utr: bankValidation.utr,
    razorpayValidationId: bankValidation.razorpayValidationId,
    razorpayFundAccountId: razorpayFundAccount.razorpayFundAccountId,
    statusDetails: bankValidation.statusDetails,
  };
};
