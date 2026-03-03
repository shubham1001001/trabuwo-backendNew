const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.createTutorialVideo = async (req, res) => {
  const video = await service.createTutorialVideo(req.body);
  return apiResponse.success(
    res,
    video,
    "Tutorial video created successfully",
    201
  );
};

exports.getTutorialVideoById = async (req, res) => {
  const video = await service.getTutorialVideoById(req.params.id);
  return apiResponse.success(
    res,
    video,
    "Tutorial video retrieved successfully"
  );
};

exports.getAllTutorialVideos = async (req, res) => {
  const { section, includeInactive } = req.query;
  const options = {
    section: section || undefined,
    includeInactive: includeInactive === "true",
  };

  const videos = await service.getAllTutorialVideos(options);
  return apiResponse.success(
    res,
    videos,
    "Tutorial videos retrieved successfully"
  );
};

exports.updateTutorialVideoById = async (req, res) => {
  const video = await service.updateTutorialVideoById(req.params.id, req.body);
  return apiResponse.success(res, video, "Tutorial video updated successfully");
};

exports.deleteTutorialVideoById = async (req, res) => {
  const result = await service.deleteTutorialVideoById(req.params.id);
  return apiResponse.success(
    res,
    result,
    "Tutorial video deleted successfully"
  );
};

exports.getSections = async (req, res) => {
  const sections = await service.getSections();
  return apiResponse.success(
    res,
    sections,
    "Tutorial video sections retrieved successfully"
  );
};
