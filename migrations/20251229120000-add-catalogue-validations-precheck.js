"use strict";

module.exports = {
  async up(queryInterface) {
    // Ensure catalogue name length between 1 and 255 characters
    await queryInterface.sequelize.query(`
      ALTER TABLE catalogues
      DROP CONSTRAINT IF EXISTS catalogues_name_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE catalogues
      ADD CONSTRAINT catalogues_name_length_check
      CHECK (char_length(name) >= 1 AND char_length(name) <= 255);
    `);

    // Ensure catalogue description is at most 2000 characters (if present)
    await queryInterface.sequelize.query(`
      ALTER TABLE catalogues
      DROP CONSTRAINT IF EXISTS catalogues_description_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE catalogues
      ADD CONSTRAINT catalogues_description_length_check
      CHECK (description IS NULL OR char_length(description) <= 2000);
    `);

    // Ensure QC notes are at most 2000 characters (if present)
    await queryInterface.sequelize.query(`
      ALTER TABLE catalogues
      DROP CONSTRAINT IF EXISTS catalogues_qc_notes_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE catalogues
      ADD CONSTRAINT catalogues_qc_notes_length_check
      CHECK (qc_notes IS NULL OR char_length(qc_notes) <= 2000);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE catalogues
      DROP CONSTRAINT IF EXISTS catalogues_name_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE catalogues
      DROP CONSTRAINT IF EXISTS catalogues_description_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE catalogues
      DROP CONSTRAINT IF EXISTS catalogues_qc_notes_length_check;
    `);
  },
};
