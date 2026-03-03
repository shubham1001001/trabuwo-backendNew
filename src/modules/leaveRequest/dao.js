const LeaveRequest = require("./model");

class LeaveRequestDAO {
  async create(leaveData, options = {}) {
    return await LeaveRequest.create(leaveData, options);
  }

  async findById(id, options = {}) {
    return await LeaveRequest.findByPk(id, options);
  }

  async findByUserId(userId, options = {}) {
    return await LeaveRequest.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      ...options,
    });
  }

  async findAll(options = {}) {
    return await LeaveRequest.findAll({
      order: [["createdAt", "DESC"]],
      ...options,
    });
  }

  async findWithPagination(page = 1, limit = 10, options = {}) {
    const offset = (page - 1) * limit;

    const { count, rows } = await LeaveRequest.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      ...options,
    });

    return {
      leaveRequests: rows,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(count / limit),
        total_count: count,
        limit,
      },
    };
  }

  async update(id, updateData, options = {}) {
    const [updatedCount] = await LeaveRequest.update(updateData, {
      where: { id },
      ...options,
    });
    return updatedCount > 0;
  }

  async delete(id, options = {}) {
    const deletedCount = await LeaveRequest.destroy({
      where: { id },
      ...options,
    });
    return deletedCount > 0;
  }
}

module.exports = new LeaveRequestDAO();
