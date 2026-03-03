const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Catalogue = require("../catalogue/model");
const s3ObjectTrackerService = require("../s3ObjectTracker/service");
const { v7: uuidv7 } = require("uuid");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      unique: true,
      allowNull: false,
    },
    catalogueId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Catalogue,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    styleCode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255],
      },
    },
    dynamicFields: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isObject(value) {
          if (
            value === null ||
            typeof value !== "object" ||
            Array.isArray(value)
          ) {
            throw new Error("Dynamic fields must be an object");
          }
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },
    status: {
      type: DataTypes.ENUM("active", "paused", "blocked", "activation_pending"),
      defaultValue: "activation_pending",
    },
    blockReasonType: {
      type: DataTypes.ENUM(
        "duplicate",
        "poor_quality",
        "verification_failed",
        "account_paused",
        "other"
      ),
      allowNull: true,
    },
    manufacturerName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 255],
      },
    },
    manufacturerPincode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isPincode(value) {
          if (!value || !/^\d{6}$/.test(value)) {
            throw new Error("Manufacturer pincode must be exactly 6 digits");
          }
        },
      },
    },
    manufacturerAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 500],
      },
    },
    countryOfOrigin: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    packerName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 255],
      },
    },
    packerAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 500],
      },
    },
    packerPincode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isPincode(value) {
          if (!value || !/^\d{6}$/.test(value)) {
            throw new Error("Packer pincode must be exactly 6 digits");
          }
        },
      },
    },
    importerName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 255],
      },
    },
    importerAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 500],
      },
    },
    importerPincode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isPincode(value) {
          if (!value || !/^\d{6}$/.test(value)) {
            throw new Error("Importer pincode must be exactly 6 digits");
          }
        },
      },
    },

    weightInGram: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    searchVector: {
      type: DataTypes.TSVECTOR,
      allowNull: true,
      field: "search_vector",
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "products",
    hooks: {
      beforeSave: async (product) => {
        if (product.changed("name") || product.changed("description")) {
          const nameText = product.name || "";
          const descText = product.description || "";

          product.searchVector = sequelize.literal(`
            setweight(to_tsvector('english', ${sequelize.escape(
              nameText
            )}), 'A') ||
            setweight(to_tsvector('english', ${sequelize.escape(
              descText
            )}), 'B')
          `);
        }
      },
    },
  }
);

const ProductVariant = sequelize.define(
  "ProductVariant",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
    },
    trabuwoPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    wrongDefectiveReturnPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    inventory: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    skuId: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    dynamicFields: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isObject(value) {
          if (
            value === null ||
            typeof value !== "object" ||
            Array.isArray(value)
          ) {
            throw new Error("Dynamic fields must be an object");
          }
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "product_variants",
    underscored: true,
  }
);

const ProductImage = sequelize.define(
  "ProductImage",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    altText: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    caption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "product_images",
    hooks: {
      afterCreate: async (productImage, options) => {
        try {
          // Mark S3ObjectTracker as linked when ProductImage is created
          await s3ObjectTrackerService.markAsLinked(
            productImage.imageKey,
            options
          );
        } catch (error) {
          // Log error but don't fail the ProductImage creation
          console.error("Failed to mark S3ObjectTracker as linked:", error);
        }
      },
    },
  }
);

ProductImage.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(ProductImage, { foreignKey: "productId", as: "images" });

ProductVariant.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(ProductVariant, { foreignKey: "productId", as: "variants" });

Product.belongsTo(Catalogue, { foreignKey: "catalogueId", as: "catalogue" });

Catalogue.hasMany(Product, { foreignKey: "catalogueId", as: "products" });

module.exports = { Product, ProductImage, ProductVariant };
