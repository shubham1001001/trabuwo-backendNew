const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const {
  CLAIM_STATUSES,
  CLAIM_PRIORITIES,
  EVIDENCE_TYPES,
  RESPONSE_TYPES,
  PACKET_STATES,
} = require("./constants");

const ClaimCategory = sequelize.define(
  "ClaimCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
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
    tableName: "claim_categories",
    timestamps: true,
    underscored: true,
  }
);

const ClaimType = sequelize.define(
  "ClaimType",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "claim_categories",
        key: "id",
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
    tableName: "claim_types",
    timestamps: true,
    underscored: true,
  }
);

const Claim = sequelize.define(
  "Claim",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    //TODO : Fix reference
    claimTypeId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      references: {
        model: "claim_types",
        key: "id",
      },
    },
    orderId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    awbNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    packetId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    issueType: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 500],
      },
    },
    stateOfPacket: {
      type: DataTypes.ENUM(...PACKET_STATES),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },
    status: {
      type: DataTypes.ENUM(...CLAIM_STATUSES),
      defaultValue: "open",
    },
    priority: {
      type: DataTypes.ENUM(...CLAIM_PRIORITIES),
      defaultValue: "medium",
    },
    callbackNumber: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        len: [0, 15],
      },
    },
    isHelpful: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "claims",
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (claim) => {
        if (claim.changed("status") && claim.status === "resolved") {
          claim.resolvedAt = new Date();
        }
      },
    },
  }
);

const ClaimEvidence = sequelize.define(
  "ClaimEvidence",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      primaryKey: true,
    },
    //TODO : Fix reference
    claimId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: "claims",
        key: "id",
      },
    },
    evidenceType: {
      type: DataTypes.ENUM(...EVIDENCE_TYPES),
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        isUrl: true,
      },
    },
    fileKey: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 500],
      },
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "claim_evidence",
    timestamps: true,
    underscored: true,
  }
);

const ClaimResponse = sequelize.define(
  "ClaimResponse",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    //TODO : Fix reference
    claimId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "claims",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    responseType: {
      type: DataTypes.ENUM(...RESPONSE_TYPES),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000],
      },
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "claim_responses",
    timestamps: true,
    underscored: true,
  }
);

ClaimCategory.hasMany(ClaimType, {
  foreignKey: "categoryId",
  as: "claimTypes",
  onDelete: "RESTRICT",
});

ClaimType.belongsTo(ClaimCategory, {
  foreignKey: "categoryId",
  as: "category",
  onDelete: "RESTRICT",
});

ClaimType.hasMany(Claim, {
  foreignKey: "claimTypeId",
  as: "claims",
  onDelete: "RESTRICT",
});

Claim.belongsTo(ClaimType, {
  foreignKey: "claimTypeId",
  as: "claimType",
  onDelete: "RESTRICT",
});

Claim.hasMany(ClaimEvidence, {
  foreignKey: "claimId",
  as: "evidence",
  onDelete: "CASCADE",
});

ClaimEvidence.belongsTo(Claim, {
  foreignKey: "claimId",
  as: "claim",
  onDelete: "CASCADE",
});

Claim.hasMany(ClaimResponse, {
  foreignKey: "claimId",
  as: "responses",
  onDelete: "CASCADE",
});

ClaimResponse.belongsTo(Claim, {
  foreignKey: "claimId",
  as: "claim",
  onDelete: "CASCADE",
});

module.exports = {
  ClaimCategory,
  ClaimType,
  Claim,
  ClaimEvidence,
  ClaimResponse,
};
