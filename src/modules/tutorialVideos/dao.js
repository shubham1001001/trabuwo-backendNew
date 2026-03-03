const TutorialVideo = require("./model");
const sequelize = require("../../config/database");

class TutorialVideoDao {
  async create(videoData) {
    return await TutorialVideo.create(videoData);
  }

  async findById(id) {
    return await TutorialVideo.findOne({
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

    return await TutorialVideo.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });
  }

  async updateById(id, updateData) {
    await TutorialVideo.update(updateData, {
      where: {
        id,
        isDeleted: false,
      },
    });

    return await this.findById(id);
  }

  async softDeleteById(id) {
    const [updatedRows] = await TutorialVideo.update(
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
    const sections = await TutorialVideo.findAll({
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

module.exports = new TutorialVideoDao();
