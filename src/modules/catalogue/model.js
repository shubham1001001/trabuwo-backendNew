const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const Category = require("../category/model");
const { v7: uuidv7 } = require("uuid");

const Catalogue = sequelize.define(
  "Catalogue",
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "qc_in_progress",
        "qc_passed",
        "qc_error",
        "live",
        "paused",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "qc_in_progress",
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
    },
    qcNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    qcReviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    reviewsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    maxPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "catalogues",
  }
);

Catalogue.belongsTo(User, {
  foreignKey: "userId",
  as: "seller",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
User.hasMany(Catalogue, { foreignKey: "userId", as: "catalogues" });
Category.hasMany(Catalogue, { foreignKey: "categoryId", as: "catalogues" });
Catalogue.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

module.exports = Catalogue;
