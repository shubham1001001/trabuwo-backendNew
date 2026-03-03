const leaveRequestService = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

class LeaveRequestController {
  createLeaveRequest = asyncHandler(async (req, res) => {
    const { startDate, endDate, reason } = req.body;
    const userId = req.user.id;

    const leaveRequest = await leaveRequestService.createLeaveRequest(
      { startDate, endDate, reason },
      userId
    );

    return apiResponse.success(
      res,
      leaveRequest,
      "Leave request created successfully",
      201
    );
  });

  getLeaveRequestById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const leaveRequest = await leaveRequestService.getLeaveRequestById(id);

    return apiResponse.success(
      res,
      leaveRequest,
      "Leave request retrieved successfully"
    );
  });

  getUserLeaveRequests = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const userId = req.user.id;

    const result = await leaveRequestService.getUserLeaveRequests(
      userId,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    return apiResponse.success(
      res,
      result,
      "User leave requests retrieved successfully"
    );
  });

  getAllLeaveRequests = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    const result = await leaveRequestService.getAllLeaveRequests(
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    return apiResponse.success(
      res,
      result,
      "All leave requests retrieved successfully"
    );
  });

  updateLeaveRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const updatedRequest = await leaveRequestService.updateLeaveRequest(
      parseInt(id),
      updateData,
      userId
    );

    return apiResponse.success(
      res,
      updatedRequest,
      "Leave request updated successfully"
    );
  });

  deleteLeaveRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await leaveRequestService.deleteLeaveRequest(
      parseInt(id),
      userId
    );

    return apiResponse.success(
      res,
      result,
      "Leave request deleted successfully"
    );
  });
}

module.exports = new LeaveRequestController();
