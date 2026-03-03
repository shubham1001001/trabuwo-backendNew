const Faq = require("./model");
const sequelize = require("../../config/database");

class FaqDao {
  async create(faqData) {
    return await Faq.create(faqData);
  }

  async findById(id) {
    return await Faq.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async findAll(options = {}) {
    const { section, includeInactive = false } = options;

    const whereClause = {
      isDeleted: false,
    };

    if (section) {
      whereClause.section = section;
    }

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    return await Faq.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });
  }

  async updateById(id, updateData) {
    await Faq.update(updateData, {
      where: {
        id,
        isDeleted: false,
      },
    });

    return await this.findById(id);
  }

  async softDeleteById(id) {
    const [updatedRows] = await Faq.update(
      { isDeleted: true },
      {
        where: {
          id,
          isDeleted: false,
        },
      }
    );

    return updatedRows > 0;
  }

  async getSections() {
    const sections = await Faq.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("section")), "section"],
      ],
      where: {
        isDeleted: false,
        isActive: true,
      },
      raw: true,
    });

    return sections.map((item) => item.section);
  }
}

module.exports = new FaqDao();
