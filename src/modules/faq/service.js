const dao = require("./dao");
const { NotFoundError, ResourceCreationError } = require("../../utils/errors");

class FaqService {
  async createFaq(faqData) {
    const faq = await dao.create(faqData);
    if (!faq) {
      throw new ResourceCreationError("Failed to create FAQ");
    }
    return faq;
  }

  async getFaqById(id) {
    const faq = await dao.findById(id);
    if (!faq) {
      throw new NotFoundError("FAQ not found");
    }
    return faq;
  }

  async getAllFaqs(options = {}) {
    return await dao.findAll(options);
  }

  async updateFaqById(id, updateData) {
    const faq = await dao.updateById(id, updateData);
    if (!faq) {
      throw new NotFoundError("FAQ not found");
    }
    return faq;
  }

  async deleteFaqById(id) {
    const result = await dao.softDeleteById(id);
    if (!result) {
      throw new NotFoundError("FAQ not found");
    }
    return { message: "FAQ deleted successfully" };
  }

  async getSections() {
    return await dao.getSections();
  }
}

module.exports = new FaqService();
