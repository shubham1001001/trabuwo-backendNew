const noticeBoardDAO = require("./dao");
const s3Service = require("../../services/s3");
const sequelize = require("../../config/database");
const { NotFoundError, ResourceCreationError } = require("../../utils/errors");

class NoticeBoardService {
  async createNotice(noticeData) {
    const createdNotice = await noticeBoardDAO.create(noticeData);
    return createdNotice;
  }

  async getNoticeById(id) {
    const notice = await noticeBoardDAO.findById(id);
    if (!notice) {
      throw new NotFoundError("Notice not found");
    }
    return notice;
  }

  async getAllNotices(page = 1, limit = 10) {
    return await noticeBoardDAO.findNoticesWithPagination(page, limit);
  }

  async updateNotice(id, updateData) {
    return await sequelize.transaction(async (t) => {
      const existingNotice = await noticeBoardDAO.findById(id);
      if (!existingNotice) {
        throw new NotFoundError("Notice not found");
      }

      if (updateData.s3Key && updateData.s3Key !== existingNotice.s3Key) {
        await this.deleteImage(existingNotice.s3Key);
      }

      const updated = await noticeBoardDAO.update(id, updateData, {
        transaction: t,
      });
      if (!updated) {
        throw new ResourceCreationError("Failed to update notice");
      }

      return await noticeBoardDAO.findById(id, { transaction: t });
    });
  }

  async deleteNotice(id) {
    return await sequelize.transaction(async (t) => {
      const existingNotice = await noticeBoardDAO.findById(id);
      if (!existingNotice) {
        throw new NotFoundError("Notice not found");
      }

      await this.deleteImage(existingNotice.s3Key);
      await noticeBoardDAO.delete(id, { transaction: t });

      return { message: "Notice deleted successfully" };
    });
  }

  async toggleNoticeStatus(id) {
    const existingNotice = await noticeBoardDAO.findById(id);
    if (!existingNotice) {
      throw new NotFoundError("Notice not found");
    }

    const newStatus = !existingNotice.isActive;
    const updated = await noticeBoardDAO.update(id, { isActive: newStatus });
    if (!updated) {
      throw new ResourceCreationError("Failed to update notice status");
    }

    return await noticeBoardDAO.findById(id);
  }

  async generatePresignedUrl(
    fileName,
    contentType,
    userId,
    folder = "notices"
  ) {
    const presignedData = await s3Service.generatePresignedUrl(
      fileName,
      contentType,
      userId,
      folder
    );

    return presignedData;
  }

  async deleteImage(s3Key) {
    return await s3Service.deleteObject(s3Key);
  }
}

module.exports = new NoticeBoardService();
