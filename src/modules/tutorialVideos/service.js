const dao = require("./dao");
const { NotFoundError, ResourceCreationError } = require("../../utils/errors");

class TutorialVideoService {
  async createTutorialVideo(videoData) {
    const video = await dao.create(videoData);
    if (!video) {
      throw new ResourceCreationError("Failed to create tutorial video");
    }
    return video;
  }

  async getTutorialVideoById(id) {
    const video = await dao.findById(id);
    if (!video) {
      throw new NotFoundError("Tutorial video not found");
    }
    return video;
  }

  async getAllTutorialVideos(options = {}) {
    return await dao.findAll(options);
  }

  async updateTutorialVideoById(id, updateData) {
    const video = await dao.updateById(id, updateData);
    if (!video) {
      throw new NotFoundError("Tutorial video not found");
    }
    return video;
  }

  async deleteTutorialVideoById(id) {
    const result = await dao.softDeleteById(id);
    if (!result) {
      throw new NotFoundError("Tutorial video not found");
    }
    return { message: "Tutorial video deleted successfully" };
  }

  async getSections() {
    return await dao.getSections();
  }
}

module.exports = new TutorialVideoService();
