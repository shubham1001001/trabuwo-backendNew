const leaveRequestDAO = require("./dao");
const { NotFoundError, ResourceCreationError } = require("../../utils/errors");

class LeaveRequestService {
  async createLeaveRequest(leaveData, userId) {
    const leaveRequest = await leaveRequestDAO.create({
      ...leaveData,
      userId,
    });

    return leaveRequest;
  }

  async getLeaveRequestById(id) {
    const leaveRequest = await leaveRequestDAO.findById(id);
    if (!leaveRequest) {
      throw new NotFoundError("Leave request not found");
    }
    return leaveRequest;
  }

  async getUserLeaveRequests(userId, page = 1, limit = 10) {
    return await leaveRequestDAO.findWithPagination(page, limit, {
      where: { userId },
    });
  }

  async getAllLeaveRequests(page = 1, limit = 10) {
    return await leaveRequestDAO.findWithPagination(page, limit);
  }

  async updateLeaveRequest(id, updateData, userId) {
    const existingRequest = await leaveRequestDAO.findById(id);
    if (!existingRequest) {
      throw new NotFoundError("Leave request not found");
    }

    if (existingRequest.userId !== userId) {
      throw new ResourceCreationError(
        "You can only update your own leave requests"
      );
    }

    const updated = await leaveRequestDAO.update(id, updateData);
    if (!updated) {
      throw new ResourceCreationError("Failed to update leave request");
    }

    return await leaveRequestDAO.findById(id);
  }

  async deleteLeaveRequest(id, userId) {
    const existingRequest = await leaveRequestDAO.findById(id);
    if (!existingRequest) {
      throw new NotFoundError("Leave request not found");
    }

    if (existingRequest.userId !== userId) {
      throw new ResourceCreationError(
        "You can only delete your own leave requests"
      );
    }

    await leaveRequestDAO.delete(id);

    return { message: "Leave request deleted successfully" };
  }
}

module.exports = new LeaveRequestService();
