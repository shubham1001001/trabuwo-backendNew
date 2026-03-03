const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { v7: uuidv7 } = require("uuid");
const { User } = require("../auth/model");

const PolicyType = sequelize.define(
  "PolicyType",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "policy_types",
    timestamps: true,
    underscored: true,
  }
);

const Policy = sequelize.define(
  "Policy",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: () => uuidv7(),
    },
    slug: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    policyTypeId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    tableName: "policies",
    timestamps: true,
    underscored: true,
  }
);

const PolicyVersion = sequelize.define(
  "PolicyVersion",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: () => uuidv7(),
    },
    policyId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    contentMarkdown: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "policy_versions",
    timestamps: true,
    underscored: true,
  }
);

const UserAgreement = sequelize.define(
  "UserAgreement",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: () => uuidv7(),
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    versionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    agreedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
  },
  {
    tableName: "user_agreements",
    timestamps: true,
    underscored: true,
  }
);

PolicyType.hasMany(Policy, {
  foreignKey: "policyTypeId",
  as: "policies",
});

Policy.belongsTo(PolicyType, {
  foreignKey: "policyTypeId",
  as: "policyType",
});

Policy.hasMany(PolicyVersion, {
  foreignKey: "policyId",
  as: "versions",
});

PolicyVersion.belongsTo(Policy, {
  foreignKey: "policyId",
  as: "policy",
});

PolicyVersion.hasMany(UserAgreement, {
  foreignKey: "versionId",
  as: "agreements",
});

UserAgreement.belongsTo(PolicyVersion, {
  foreignKey: "versionId",
  as: "version",
});

User.hasMany(UserAgreement, {
  foreignKey: "userId",
  as: "policyAgreements",
});

UserAgreement.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = {
  PolicyType,
  Policy,
  PolicyVersion,
  UserAgreement,
};

