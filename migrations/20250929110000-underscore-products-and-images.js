"use strict";

module.exports = {
  async up(queryInterface) {
    // products
    const productRenames = [
      ["publicId", "public_id"],
      ["catalogueId", "catalogue_id"],
      ["categoryId", "category_id"],
      ["styleCode", "style_code"],
      ["dynamicFields", "dynamic_fields"],
      ["searchVector", "search_vector"],
      ["blockReasonType", "block_reason_type"],
      ["manufacturerName", "manufacturer_name"],
      ["manufacturerPincode", "manufacturer_pincode"],
      ["manufacturerAddress", "manufacturer_address"],
      ["countryOfOrigin", "country_of_origin"],
      ["packerName", "packer_name"],
      ["packerAddress", "packer_address"],
      ["packerPincode", "packer_pincode"],
      ["importerName", "importer_name"],
      ["importerAddress", "importer_address"],
      ["importerPincode", "importer_pincode"],
      ["isDeleted", "is_deleted"],
      ["createdAt", "created_at"],
      ["updatedAt", "updated_at"],
    ];

    for (const [from, to] of productRenames) {
      await queryInterface.renameColumn("products", from, to).catch(() => {});
    }

    // product_images
    const imageRenames = [
      ["publicId", "public_id"],
      ["productId", "product_id"],
      ["imageUrl", "image_url"],
      ["imageKey", "image_key"],
      ["altText", "alt_text"],
      ["sortOrder", "sort_order"],
      ["isPrimary", "is_primary"],
      ["isActive", "is_active"],
      ["isDeleted", "is_deleted"],
      ["createdAt", "created_at"],
      ["updatedAt", "updated_at"],
    ];

    for (const [from, to] of imageRenames) {
      await queryInterface
        .renameColumn("product_images", from, to)
        .catch(() => {});
    }
  },

  async down(queryInterface) {
    const productRenames = [
      ["public_id", "publicId"],
      ["catalogue_id", "catalogueId"],
      ["category_id", "categoryId"],
      ["style_code", "styleCode"],
      ["dynamic_fields", "dynamicFields"],
      ["search_vector", "searchVector"],
      ["block_reason_type", "blockReasonType"],
      ["manufacturer_name", "manufacturerName"],
      ["manufacturer_pincode", "manufacturerPincode"],
      ["manufacturer_address", "manufacturerAddress"],
      ["country_of_origin", "countryOfOrigin"],
      ["packer_name", "packerName"],
      ["packer_address", "packerAddress"],
      ["packer_pincode", "packerPincode"],
      ["importer_name", "importerName"],
      ["importer_address", "importerAddress"],
      ["importer_pincode", "importerPincode"],
      ["is_deleted", "isDeleted"],
      ["created_at", "createdAt"],
      ["updated_at", "updatedAt"],
    ];

    for (const [from, to] of productRenames) {
      await queryInterface.renameColumn("products", from, to).catch(() => {});
    }

    const imageRenames = [
      ["public_id", "publicId"],
      ["product_id", "productId"],
      ["image_url", "imageUrl"],
      ["image_key", "imageKey"],
      ["alt_text", "altText"],
      ["sort_order", "sortOrder"],
      ["is_primary", "isPrimary"],
      ["is_active", "isActive"],
      ["is_deleted", "isDeleted"],
      ["created_at", "createdAt"],
      ["updated_at", "updatedAt"],
    ];

    for (const [from, to] of imageRenames) {
      await queryInterface
        .renameColumn("product_images", from, to)
        .catch(() => {});
    }
  },
};
