"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("product_variants", "seller_price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Seller's desired payout for all returns",
    });

    await queryInterface.addColumn("product_variants", "seller_return_price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Seller's desired payout for wrong/defective returns only",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("product_variants", "seller_price");
    await queryInterface.removeColumn("product_variants", "seller_return_price");
  },
};
