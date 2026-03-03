"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sharelist_items", {
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      catalogue_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: "catalogues", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addConstraint("sharelist_items", {
      type: "primary key",
      fields: ["user_id", "catalogue_id"],
      name: "pk_sharelist_items_user_catalogue",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sharelist_items");
  },
};
