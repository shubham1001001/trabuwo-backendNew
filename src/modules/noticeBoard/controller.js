const noticeBoardService = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

class NoticeBoardController {
  createNotice = asyncHandler(async (req, res) => {
    const noticeData = req.body;
    const createdNotice = await noticeBoardService.createNotice(noticeData);

    return apiResponse.success(
      res,
      createdNotice,
      "Notice created successfully",
      201
    );
  });

  getNoticeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notice = await noticeBoardService.getNoticeById(parseInt(id));

    return apiResponse.success(res, notice, "Notice retrieved successfully");
  });

  getAllNotices = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    const result = await noticeBoardService.getAllNotices(
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    return apiResponse.success(res, result, "Notices retrieved successfully");
  });

  updateNotice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedNotice = await noticeBoardService.updateNotice(
      parseInt(id),
      updateData
    );

    return apiResponse.success(
      res,
      updatedNotice,
      "Notice updated successfully"
    );
  });

  deleteNotice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await noticeBoardService.deleteNotice(parseInt(id));

    return apiResponse.success(res, null, result.message);
  });

  toggleNoticeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const updatedNotice = await noticeBoardService.toggleNoticeStatus(
      parseInt(id)
    );

    return apiResponse.success(
      res,
      updatedNotice,
      "Notice status toggled successfully"
    );
  });

  generatePresignedUrl = asyncHandler(async (req, res) => {
    const { fileName, contentType, folder } = req.body;
    const userId = req.user.id;

    const presignedData = await noticeBoardService.generatePresignedUrl(
      fileName,
      contentType,
      userId,
      folder
    );

    return apiResponse.success(
      res,
      presignedData,
      "Presigned URL generated successfully"
    );
  });

  deleteImage = asyncHandler(async (req, res) => {
    const { s3Key } = req.body;

    const result = await noticeBoardService.deleteImage(s3Key);

    return apiResponse.success(res, result, "Image deleted successfully");
  });
}

module.exports = new NoticeBoardController();
