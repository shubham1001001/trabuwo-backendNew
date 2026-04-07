module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('categories', 'attributes_schema', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Dynamic attribute definitions for category (Trabuwo style)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('categories', 'attributes_schema');
  }
};
