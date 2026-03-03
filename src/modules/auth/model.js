const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { ValidationError } = require("../../utils/errors");
const { v7: uuidv7 } = require("uuid");

const User = sequelize.define(
  "User",
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
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    underscored: true,
    timestamps: true,
    validate: {
      emailOrMobileRequired() {
        if (!this.email && !this.mobile) {
          throw new ValidationError("Either email or mobile must be provided");
        }
      },
    },
  }
);

const Role = sequelize.define(
  "Role",
  {
    name: {
      type: DataTypes.ENUM("admin", "buyer", "seller", "influencer"),
      allowNull: false,
    },
  },
  {
    tableName: "roles",
  }
);

const UserRole = sequelize.define(
  "UserRole",
  {
    userId: {
      type: DataTypes.BIGINT,
      references: { model: User, key: "id" },
    },
    roleId: {
      type: DataTypes.INTEGER,
      references: { model: Role, key: "id" },
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "user_roles",
  }
);

const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "refresh_tokens",
    timestamps: true,
    underscored: true,
  }
);

const PasswordResetToken = sequelize.define(
  "PasswordResetToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    jti: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "password_reset_tokens",
    timestamps: true,
    underscored: true,
  }
);

User.hasMany(PasswordResetToken, {
  foreignKey: "userId",
  as: "passwordResetTokens",
});
PasswordResetToken.belongsTo(User, { foreignKey: "userId" });
//Remember to delete this using cron job

User.belongsToMany(Role, { through: "UserRole", foreignKey: "userId" });
Role.belongsToMany(User, { through: "UserRole", foreignKey: "roleId" });

User.hasMany(RefreshToken, {
  foreignKey: "userId",
  as: "refreshTokens",
});
RefreshToken.belongsTo(User, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

const NotificationChannel = sequelize.define(
  "NotificationChannel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    type: {
      type: DataTypes.ENUM("email", "whatsapp"),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    subscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "notification_channels",
    timestamps: true,
    underscored: true,
  }
);

User.hasMany(NotificationChannel, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
NotificationChannel.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  User,
  Role,
  UserRole,
  RefreshToken,
  PasswordResetToken,
  NotificationChannel,
};
