const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const s3ObjectTrackerService = require("../s3ObjectTracker/service");
const { v7: uuidv7 } = require("uuid");

const SellerOnboarding = sequelize.define(
  "SellerOnboarding",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    currentStep: {
      type: DataTypes.ENUM(
        "TAX_IDENTITY",
        "ADDRESS",
        "BANK_DETAILS",
        "STORE_INFO",
        "COMPLETED"
      ),
      allowNull: false,
      defaultValue: "TAX_IDENTITY",
    },
    businessType: {
      type: DataTypes.ENUM(
        "MANUFACTURER",
        "RETAILER",
        "WHOLESALER",
        "RESELLER"
      ),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "seller_onboardings",
  }
);

const SellerProgress = sequelize.define(
  "SellerProgress",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    catalogUploaded: { type: DataTypes.BOOLEAN, defaultValue: false },
    catalogGoLive: { type: DataTypes.BOOLEAN, defaultValue: false },
    firstOrderReceived: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastCheckedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "seller_progress",
  }
);

const TaxIdentity = sequelize.define(
  "TaxIdentity",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sellerOnboardingId: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM("GST_NUMBER", "UIN_ENROLLMENT_ID"),
      allowNull: false,
    },
    value: { type: DataTypes.STRING, allowNull: false },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "tax_identities",
  }
);

const BankDetails = sequelize.define(
  "BankDetails",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sellerOnboardingId: { type: DataTypes.INTEGER, allowNull: false },
    accountNumber: { type: DataTypes.STRING, allowNull: false },
    ifscCode: { type: DataTypes.STRING, allowNull: false },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "bank_details",
  }
);

const Store = sequelize.define(
  "Store",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: () => uuidv7(),
    },
    sellerOnboardingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    ownerFullName: { type: DataTypes.STRING, allowNull: false },
    signatureS3Key: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "stores",
    hooks: {
      afterCreate: async (store, options) => {
        try {
          // Mark S3ObjectTracker as linked when Store with signature is created
          if (store.signatureS3Key) {
            await s3ObjectTrackerService.markAsLinked(
              store.signatureS3Key,
              options
            );
          }
        } catch (error) {
          // Log error but don't fail the Store creation
          console.error("Failed to mark S3ObjectTracker as linked:", error);
        }
      },
      afterUpdate: async (store, options) => {
        try {
          // Mark S3ObjectTracker as linked when signature is updated
          if (store.changed("signatureS3Key") && store.signatureS3Key) {
            await s3ObjectTrackerService.markAsLinked(
              store.signatureS3Key,
              options
            );
          }
        } catch (error) {
          // Log error but don't fail the Store update
          console.error("Failed to mark S3ObjectTracker as linked:", error);
        }
      },
    },
  }
);

const Location = sequelize.define(
  "Location",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pincode: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "locations",
    underscored: true,
    timestamps: true,
  }
);

const Address = sequelize.define(
  "Address",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sellerOnboardingId: { type: DataTypes.INTEGER, allowNull: false },
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    buildingNumber: { type: DataTypes.STRING },
    street: { type: DataTypes.STRING },
    landmark: { type: DataTypes.STRING },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "addresses",
  }
);

SellerOnboarding.hasMany(TaxIdentity, {
  foreignKey: "sellerOnboardingId",
  as: "taxIdentities",
  onDelete: "CASCADE",
});
SellerOnboarding.hasOne(Store, {
  foreignKey: "sellerOnboardingId",
  as: "store",
  onDelete: "CASCADE",
});
Store.belongsTo(SellerOnboarding, {
  foreignKey: "sellerOnboardingId",
  as: "sellerOnboarding",
});
SellerOnboarding.hasMany(BankDetails, {
  foreignKey: "sellerOnboardingId",
  onDelete: "CASCADE",
});

SellerOnboarding.hasMany(Address, {
  foreignKey: "sellerOnboardingId",
  as: "address",
  onDelete: "CASCADE",
});

Address.belongsTo(Location, {
  foreignKey: "locationId",
  onDelete: "CASCADE",
});

User.hasOne(SellerOnboarding, {
  foreignKey: "userId",
  as: "sellerOnboarding",
  onDelete: "CASCADE",
});
SellerOnboarding.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = {
  SellerOnboarding,
  TaxIdentity,
  Store,
  Address,
  BankDetails,
  Location,
  SellerProgress,
};
