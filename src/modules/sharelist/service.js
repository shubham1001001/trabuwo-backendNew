const dao = require("./dao");
const catalogueDao = require("../catalogue/dao");
const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../../utils/errors");

exports.getSharelist = async (userId) => {
  const items = await dao.findSharelistItemsByUserId(userId);
  if (!items || items.length === 0) return [];
  return items.map((i) => i.toJSON());
};

exports.addToSharelist = async (userId, cataloguePublicId) => {
  const catalogue = await catalogueDao.getCatalogueByPublicId(
    cataloguePublicId
  );
  if (!catalogue) {
    throw new NotFoundError(`Catalogue with ID ${cataloguePublicId} not found`);
  }

  if (catalogue.isDeleted) {
    throw new ValidationError("Catalogue is not available");
  }

  const existing = await dao.findSharelistItemByUserAndCatalogue(
    userId,
    catalogue.id
  );
  if (existing) {
    throw new ConflictError("Catalogue is already in sharelist");
  }

  await dao.addToSharelist(userId, catalogue.id);

  const updatedList = await dao.findSharelistItemsByUserId(userId);
  return updatedList.map((i) => i.toJSON());
};
