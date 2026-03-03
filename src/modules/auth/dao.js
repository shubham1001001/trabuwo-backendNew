const { User, Role, RefreshToken, NotificationChannel } = require("./model");
const { PasswordResetToken } = require("./model");
const sequelize = require("../../config/database");

exports.createUser = (data) => User.create(data);
exports.findUserByEmail = (email) => User.findOne({ where: { email } });
exports.findUserByMobile = (mobile) => User.findOne({ where: { mobile } });
exports.findUserById = (id, options = {}) => User.findByPk(id, options);
exports.findUserByPublicId = (publicId, options = {}) =>
  User.findOne({ where: { publicId }, ...options });
exports.updateUser = (id, data) =>
  User.update(data, { where: { id }, returning: true });

exports.createRefreshToken = (data) => RefreshToken.create(data);
exports.findRefreshToken = (token) =>
  RefreshToken.findOne({ where: { token } });
exports.revokeRefreshToken = (token) =>
  RefreshToken.update({ isRevoked: true }, { where: { token } });
exports.revokeAllUserTokens = (userId) =>
  RefreshToken.update({ isRevoked: true }, { where: { userId } });

exports.deleteExpiredTokens = async () => {
  const deletedCount = await RefreshToken.destroy({
    where: {
      expiresAt: {
        [require("sequelize").Op.lt]: new Date(),
      },
    },
  });
  return { deletedCount };
};

exports.deleteRevokedTokens = async () => {
  const deletedCount = await RefreshToken.destroy({
    where: {
      isRevoked: true,
    },
  });
  return { deletedCount };
};

exports.countExpiredTokens = async () => {
  return await RefreshToken.count({
    where: {
      expiresAt: {
        [require("sequelize").Op.lt]: new Date(),
      },
    },
  });
};

exports.countRevokedTokens = async () => {
  return await RefreshToken.count({
    where: {
      isRevoked: true,
    },
  });
};

exports.findUserWithRoles = ({ id, email, mobile }) => {
  const where = id ? { id } : email ? { email } : { mobile };
  return User.findOne({
    where,
    include: [
      {
        model: Role,
        as: "Roles",
        attributes: ["name"],
        through: { attributes: [] },
      },
    ],
  });
};

exports.createUserWithRole = async (userData, roleName) => {
  return await sequelize.transaction(async (t) => {
    const user = await User.create(userData, { transaction: t });

    const role = await Role.findOne({
      where: { name: roleName },
      transaction: t,
    });

    if (role) {
      await user.setRoles([role], { transaction: t });
    }

    return await User.findOne({
      where: { id: user.id },
      include: [
        {
          model: Role,
          as: "Roles",
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
      transaction: t,
    });
  });
};

exports.createPasswordResetToken = (data) => PasswordResetToken.create(data);
exports.findPasswordResetTokenByJti = (jti, options = {}) =>
  PasswordResetToken.findOne({ where: { jti }, ...options });
exports.markPasswordResetTokenUsed = (jti, t) =>
  PasswordResetToken.update(
    { used: true },
    {
      where: { jti },
      transaction: t,
    }
  );

exports.createNotificationChannel = (data) => NotificationChannel.create(data);
exports.findNotificationChannelByUserIdAndType = (userId, type) =>
  NotificationChannel.findOne({ where: { userId, type } });
exports.updateNotificationChannel = (id, data) =>
  NotificationChannel.update(data, { where: { id }, returning: true });

/*Reminder - User Cron Job to cleanup expired tokens */
