const NoticeBoard = require("./model");

class NoticeBoardDAO {
  async create(noticeData, options = {}) {
    return await NoticeBoard.create(noticeData, options);
  }

  async findById(id, options = {}) {
    return await NoticeBoard.findByPk(id, options);
  }

  async findAll(options = {}) {
    return await NoticeBoard.findAll(options);
  }

  async findNoticesWithPagination(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await NoticeBoard.findAndCountAll({
      limit,
      offset,
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    return {
      notices: rows,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(count / limit),
        total_count: count,
        limit,
      },
    };
  }

  async update(id, updateData, options = {}) {
    const [updatedCount] = await NoticeBoard.update(updateData, {
      where: { id },
      ...options,
    });
    return updatedCount > 0;
  }

  async delete(id, options = {}) {
    const deletedCount = await NoticeBoard.destroy({
      where: { id },
      ...options,
    });
    return deletedCount > 0;
  }
}

module.exports = new NoticeBoardDAO();
