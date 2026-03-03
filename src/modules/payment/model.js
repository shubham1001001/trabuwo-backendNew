const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { Order } = require("../order/model");
const { UserBankInfo } = require("../userBankInfo/model");
const { v7: uuidv7 } = require("uuid");

const Payment = sequelize.define(
  "Payment",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    orderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Order,
        key: "id",
      },
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    },
    gatewayOrderId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    gatewayPaymentId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "INR",
    },
    status: {
      type: DataTypes.ENUM("pending", "captured", "failed", "refunded"),
      defaultValue: "pending",
    },
    gateway: {
      type: DataTypes.ENUM("razorpay"),
      defaultValue: "razorpay",
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    errorDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receipt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    capturedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "payments",
  }
);

const Refund = sequelize.define(
  "Refund",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    paymentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Payment,
        key: "id",
      },
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    },
    gatewayRefundId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    gatewayPaymentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "Amount in smallest currency unit (paise for INR)",
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "INR",
    },
    status: {
      type: DataTypes.ENUM("pending", "processed", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    speedRequested: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    speedProcessed: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receipt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    acquirerData: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    batchId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "refunds",
  }
);

const RazorpayContact = sequelize.define(
  "RazorpayContact",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    razorpayContactId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Razorpay contact ID (e.g., cont_00000000000001)",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Phone number",
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "razorpay_contacts",
    indexes: [
      {
        fields: ["razorpay_contact_id"],
        unique: true,
      },
      {
        fields: ["email"],
      },
      {
        fields: ["contact"],
      },
    ],
  }
);

const RazorpayFundAccount = sequelize.define(
  "RazorpayFundAccount",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    razorpayFundAccountId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Razorpay fund account ID (e.g., fa_00000000000001)",
    },
    razorpayContactId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: RazorpayContact,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    userBankInfoId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: UserBankInfo,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      comment: "Link to internal user bank info",
    },
    accountType: {
      type: DataTypes.ENUM("bank_account", "vpa"),
      allowNull: false,
    },
    bankAccountDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Stores bank_account details: name, ifsc, account_number, bank_name",
    },
    vpaDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Stores VPA details: username, handle",
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "razorpay_fund_accounts",
    indexes: [
      {
        fields: ["razorpay_fund_account_id"],
        unique: true,
      },
      {
        fields: ["razorpay_contact_id"],
      },
      {
        fields: ["user_bank_info_id"],
      },
      {
        fields: ["account_type"],
      },
    ],
  }
);

const BankValidation = sequelize.define(
  "BankValidation",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    razorpayFundAccountId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: RazorpayFundAccount,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
      comment: "Reference to RazorpayFundAccount",
    },
    razorpayValidationId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Razorpay validation ID (e.g., fav_00000000000001)",
    },
    status: {
      type: DataTypes.ENUM("created", "completed", "failed"),
      allowNull: false,
      defaultValue: "created",
    },
    utr: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "12-digit UTR for successful validation",
    },
    accountStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "active or invalid",
    },
    registeredName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Name registered with bank",
    },
    nameMatchScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Score between 0-100",
    },
    validationDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statusDetails: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: "Status description, source, reason",
    },
    referenceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "bank_validations",
    indexes: [
      {
        fields: ["razorpay_fund_account_id"],
      },
      {
        fields: ["razorpay_validation_id"],
        unique: true,
      },
      {
        fields: ["status"],
      },
    ],
  }
);

Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });
Payment.hasMany(Refund, { foreignKey: "paymentId", as: "refunds" });
Refund.belongsTo(Payment, { foreignKey: "paymentId", as: "payment" });

RazorpayFundAccount.belongsTo(RazorpayContact, {
  foreignKey: "razorpayContactId",
  as: "contact",
});
RazorpayContact.hasMany(RazorpayFundAccount, {
  foreignKey: "razorpayContactId",
  as: "fundAccounts",
});

RazorpayFundAccount.belongsTo(UserBankInfo, {
  foreignKey: "userBankInfoId",
  as: "userBankInfo",
});
UserBankInfo.hasMany(RazorpayFundAccount, {
  foreignKey: "userBankInfoId",
  as: "razorpayFundAccounts",
});

BankValidation.belongsTo(RazorpayFundAccount, {
  foreignKey: "razorpayFundAccountId",
  as: "fundAccount",
});
RazorpayFundAccount.hasMany(BankValidation, {
  foreignKey: "razorpayFundAccountId",
  as: "validations",
});

module.exports = {
  Payment,
  Refund,
  RazorpayContact,
  RazorpayFundAccount,
  BankValidation,
};
