const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { OrderItem } = require("../order/model");
const { User } = require("../auth/model");
const { v7: uuidv7 } = require("uuid");
const s3ObjectTrackerService = require("../s3ObjectTracker/service");

const Review = sequelize.define(
  "Review",
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
    orderItemId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: OrderItem, key: "id" },
      unique: false,
    },
    reviewerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "reviews",
    timestamps: true,
    underscored: true,
  }
);

const ReviewImage = sequelize.define(
  "ReviewImage",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      unique: true,
    },
    reviewId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: Review, key: "id" },
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageKey: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "S3 key or file path",
    },
    altText: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "review_images",
    timestamps: true,
    underscored: true,
    hooks: {
      // TODO : check it's reliability
      afterCreate: async (reviewImage, options) => {
        try {
          await s3ObjectTrackerService.markAsLinked(
            reviewImage.imageKey,
            options
          );
        } catch {
          // check it
        }
      },
    },
  }
);

Review.belongsTo(OrderItem, { foreignKey: "orderItemId", as: "orderItem" });
OrderItem.hasOne(Review, { foreignKey: "orderItemId", as: "review" });

Review.belongsTo(User, { foreignKey: "reviewerId", as: "reviewer" });
User.hasMany(Review, { foreignKey: "reviewerId", as: "reviews" });

Review.hasMany(ReviewImage, { foreignKey: "reviewId", as: "images" });
ReviewImage.belongsTo(Review, { foreignKey: "reviewId", as: "review" });

const ReviewHelpful = sequelize.define(
  "ReviewHelpful",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      unique: true,
    },
    reviewId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: Review, key: "id" },
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: User, key: "id" },
    },
  },
  {
    tableName: "review_helpful",
    timestamps: true,
    underscored: true,
  }
);

Review.hasMany(ReviewHelpful, { foreignKey: "reviewId", as: "helpfulVotes" });
ReviewHelpful.belongsTo(Review, { foreignKey: "reviewId", as: "review" });
User.hasMany(ReviewHelpful, { foreignKey: "userId", as: "helpfulVotes" });
ReviewHelpful.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = { Review, ReviewImage, ReviewHelpful };
