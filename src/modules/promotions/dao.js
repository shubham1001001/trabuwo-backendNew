const { Promotion, PromotionSeller, PromotionProduct } = require("./model");
const { Product, ProductImage } = require("../product/model");
const Catalogue = require("../catalogue/model");
const { Op, fn, col } = require("sequelize");
const { NotFoundError, ConflictError } = require("../../utils/errors");

class PromotionDAO {
  //TODO : security check if product added belongs to the user
  async createPromotion(promotionData) {
    const promotion = await Promotion.create(promotionData);
    return promotion;
  }

  async getPromotionById(id) {
    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      throw new NotFoundError("Promotion not found");
    }
    return promotion;
  }

  async getAllPromotions(filters = {}) {
    const whereClause = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    const totalProductsCount = await Product.count({
      where: { isDeleted: false },
      include: [
        {
          model: Catalogue,
          as: "catalogue",
          where: { userId: filters.userId },
        },
      ],
    });

    const promotionProductsInclude = {
      model: PromotionProduct,
      attributes: [],
      required: false,
      where: {
        isActive: true,
        sellerId: filters.userId,
      },
    };

    const promotionSellersInclude = {
      model: PromotionSeller,
      attributes: ["status", "id"],
      required: false,
      where: { sellerId: filters.userId },
    };

    const promotions = await Promotion.findAll({
      where: whereClause,
      include: [promotionProductsInclude, promotionSellersInclude],
      attributes: {
        include: [
          [
            fn("COUNT", fn("DISTINCT", col("PromotionProducts.product_id"))),
            "productsInPromotion",
          ],
        ],
      },
      group: [col("Promotion.id"), col("PromotionSellers.id")],
      order: [["createdAt", "DESC"]],
      subQuery: false,
    });

    const result = promotions.map((p) => {
      const promotion = p.toJSON();
      promotion.totalProducts = totalProductsCount;

      const productsInPromotion = Number(promotion.productsInPromotion || 0);
      promotion.isParticipated = productsInPromotion > 0;
      const registration = Array.isArray(promotion.PromotionSellers)
        ? promotion.PromotionSellers[0]
        : undefined;
      promotion.registrationStatus = registration ? registration.status : null;
      delete promotion.PromotionSellers;

      return promotion;
    });

    return result;
  }

  async updatePromotion(id, updateData) {
    const promotion = await this.getPromotionById(id);
    await promotion.update(updateData);
    return promotion;
  }

  async deletePromotion(id) {
    const promotion = await this.getPromotionById(id);
    await promotion.destroy();
    return true;
  }

  async registerSeller(promotionId, sellerId) {
    const existingRegistration = await PromotionSeller.findOne({
      where: { promotionId, sellerId },
    });

    if (existingRegistration) {
      throw new ConflictError("Seller already registered for this promotion");
    }

    const registration = await PromotionSeller.create({
      promotionId,
      sellerId,
    });

    return registration;
  }

  async getPromotionSellers(promotionId) {
    const sellers = await PromotionSeller.findAll({
      where: { promotionId },
      include: [
        {
          model: Promotion,
          attributes: ["name", "type"],
        },
      ],
    });

    return sellers;
  }

  async updateSellerStatus(promotionId, sellerId, status, approvedBy) {
    const registration = await PromotionSeller.findOne({
      where: { promotionId, sellerId },
    });

    if (!registration) {
      throw new NotFoundError("Seller registration not found");
    }

    const updateData = { status };
    if (status === "APPROVED") {
      updateData.approvalDate = new Date();
      updateData.approvedBy = approvedBy;
    }

    await registration.update(updateData);
    return registration;
  }

  async addProduct(promotionId, productData, userId) {
    const doAllProductsBelongToUser = await this.doAllProductsBelongToUser(
      [productData.productId],
      userId
    );

    if (!doAllProductsBelongToUser) {
      throw new ConflictError("Product does not belong to the user");
    }

    const productObj = await Product.findOne({
      where: { publicId: productData.productId, isDeleted: false },
      attributes: ["id"],
    });

    const existingProduct = await PromotionProduct.findOne({
      where: {
        promotionId,
        productId: productObj.id,
        sellerId: userId,
      },
    });

    if (existingProduct) {
      throw new ConflictError("Product already added to this promotion");
    }

    const product = await PromotionProduct.create({
      promotionId,
      sellerId: userId,
      productId: productObj.id,
      discountPercent: productData.discountPercent,
      returnDefectiveDiscountPercent:
        productData.returnDefectiveDiscountPercent,
    });

    return product;
  }

  async getPromotionProducts(promotionId, userId) {
    const products = await PromotionProduct.findAll({
      where: { promotionId, isActive: true, sellerId: userId },
      include: [
        {
          model: Promotion,
          as: "promotion",
          attributes: ["name", "type", "discountType", "discountValue"],
        },
        {
          model: Product,
          as: "product",
          attributes: ["name", "publicId", "dynamicFields"],
          include: [
            {
              model: ProductImage,
              as: "images",
              attributes: [
                "imageUrl",
                "altText",
                "caption",
                "sortOrder",
                "isPrimary",
              ],
              where: { isActive: true, isDeleted: false },
              required: false,
            },
          ],
        },
      ],
    });

    return products;
  }

  async addMultipleProducts(promotionId, productsData, userId) {
    const doAllProductsBelongToUser = await this.doAllProductsBelongToUser(
      productsData.map((product) => product.productId),
      userId
    );

    if (!doAllProductsBelongToUser) {
      throw new ConflictError("Product does not belong to the user");
    }

    // Map publicIds to internal numeric ids for storage/lookup
    const productIdsObj = await Product.findAll({
      where: {
        publicId: productsData.map((p) => p.productId),
        isDeleted: false,
      },
      attributes: ["id", "publicId"],
    });

    const modifiedProductsData = productsData.map((product) => ({
      promotionId,
      productId: productIdsObj.find((obj) => obj.publicId === product.productId)
        .id,
      discountPercent: product.discountPercent,
      returnDefectiveDiscountPercent: product.returnDefectiveDiscountPercent,
      sellerId: userId,
    }));

    const products = await PromotionProduct.bulkCreate(modifiedProductsData);
    return products;
  }

  async updateMultipleProductDiscounts(promotionId, productsData, userId) {
    const doAllProductsBelongToUser = await this.doAllProductsBelongToUser(
      productsData.map((product) => product.productId),
      userId
    );

    const productIdsObj = await Product.findAll({
      where: {
        publicId: productsData.map((p) => p.productId),
        isDeleted: false,
      },
      attributes: ["id", "publicId"],
    });

    const modifiedProductsData = productsData.map((product) => ({
      ...product,
      productId: productIdsObj.find((obj) => obj.publicId === product.productId)
        .id,
    }));

    if (!doAllProductsBelongToUser) {
      throw new ConflictError("Product does not belong to the user");
    }

    return await PromotionProduct.sequelize.transaction(async (t) => {
      const updatePromises = modifiedProductsData.map(async (product) => {
        const result = await PromotionProduct.update(
          {
            discountPercent: product.discountPercent,
            returnDefectiveDiscountPercent:
              product.returnDefectiveDiscountPercent,
          },
          {
            where: {
              promotionId,
              productId: product.productId,
              sellerId: userId,
            },
            transaction: t,
          }
        );
        return result;
      });

      await Promise.all(updatePromises);
      return true;
    });
  }

  async removeProduct(promotionId, productId, sellerId) {
    const doAllProductsBelongToUser = await this.doAllProductsBelongToUser(
      [productId],
      sellerId
    );

    if (!doAllProductsBelongToUser) {
      throw new ConflictError("Product does not belong to the user");
    }
    const product = await Product.findOne({
      where: { publicId: productId, isDeleted: false },
    });

    const promotionProduct = await PromotionProduct.findOne({
      where: { promotionId, productId: product.id, sellerId },
    });

    if (!promotionProduct) {
      throw new NotFoundError("Product not found in promotion");
    }

    await promotionProduct.destroy();
    return true;
  }

  async removeMultipleProducts(promotionId, productIds, sellerId) {
    const doAllProductsBelongToUser = await this.doAllProductsBelongToUser(
      productIds,
      sellerId
    );

    if (!doAllProductsBelongToUser) {
      throw new ConflictError("Product does not belong to the user");
    }
    const productIdsObj = await Product.findAll({
      where: { publicId: productIds, isDeleted: false },
      attributes: ["id"],
    });
    return await PromotionProduct.sequelize.transaction(async (t) => {
      const result = await PromotionProduct.destroy({
        where: {
          promotionId,
          productId: { [Op.in]: productIdsObj.map((p) => p.id) },
          sellerId,
        },
        transaction: t,
      });

      return result;
    });
  }

  async removeAllProducts(promotionId, sellerId) {
    return await PromotionProduct.sequelize.transaction(async (t) => {
      const result = await PromotionProduct.destroy({
        where: { promotionId, sellerId },
        transaction: t,
      });

      return result;
    });
  }

  async getActivePromotions() {
    const currentDate = new Date();
    const promotions = await Promotion.findAll({
      where: {
        status: "ACTIVE",
        isActive: true,
        startDate: { [Op.lte]: currentDate },
        endDate: { [Op.gte]: currentDate },
      },
      order: [["startDate", "ASC"]],
    });

    return promotions;
  }

  async getProductsNotInPromotions(promotionId, pagination = {}, userId) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const existingPromotionProductIds = await PromotionProduct.findAll({
      attributes: ["productId"],
      raw: true,
      where: {
        promotionId: promotionId,
        sellerId: userId,
      },
    });

    const existingProductIds = existingPromotionProductIds.map(
      (promotionProduct) => promotionProduct.productId
    );

    const whereClause = {
      isDeleted: false,
    };

    if (existingProductIds.length > 0) {
      whereClause.id = {
        [Op.notIn]: existingProductIds,
      };
    }

    const countResult = await Product.count({
      where: whereClause,
      include: [
        {
          model: Catalogue,
          as: "catalogue",
          where: {
            userId: userId,
          },
          required: true,
        },
      ],
    });

    const products = await Product.findAll({
      where: whereClause,
      include: [
        {
          model: ProductImage,
          as: "images",
          required: false,
        },
        {
          model: Catalogue,
          as: "catalogue",
          where: {
            userId: userId,
          },
          required: true,
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(countResult / limit);

    return {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: countResult,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  async doAllProductsBelongToUser(productIds, userId) {
    const count = await Product.count({
      where: { publicId: productIds, isDeleted: false },
      include: [{ model: Catalogue, as: "catalogue", where: { userId } }],
    });
    return count === productIds.length;
  }
}

module.exports = new PromotionDAO();
