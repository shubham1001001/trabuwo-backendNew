const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.createFaq = async (req, res) => {
  const faq = await service.createFaq(req.body);
  return apiResponse.success(res, faq, "FAQ created successfully", 201);
};

exports.getFaqById = async (req, res) => {
  const faq = await service.getFaqById(req.params.id);
  return apiResponse.success(res, faq, "FAQ retrieved successfully");
};

exports.getAllFaqs = async (req, res) => {
  const { section, includeInactive } = req.query;
  const options = {
    section: section || undefined,
    includeInactive: includeInactive === "true",
  };

  const faqs = await service.getAllFaqs(options);
  return apiResponse.success(res, faqs, "FAQs retrieved successfully");
};

exports.updateFaqById = async (req, res) => {
  const faq = await service.updateFaqById(req.params.id, req.body);
  return apiResponse.success(res, faq, "FAQ updated successfully");
};

exports.deleteFaqById = async (req, res) => {
  const result = await service.deleteFaqById(req.params.id);
  return apiResponse.success(res, result, "FAQ deleted successfully");
};

exports.getSections = async (req, res) => {
  const sections = await service.getSections();
  return apiResponse.success(
    res,
    sections,
    "FAQ sections retrieved successfully"
  );
};
