require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('config');
const dbConfig = config.get('db');

// Custom initialization to handle SSL issues during repair
let sequelize;
try {
  sequelize = new Sequelize(
    dbConfig.name,
    dbConfig.user,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: 'postgres',
      port: dbConfig.port,
      logging: false,
      dialectOptions: {
        ssl: {
          require: false,
          rejectUnauthorized: false
        }
      }
    }
  );
} catch (e) {
  console.error("Initial Sequelize setup failed:", e);
}

const Catalogue = require('./src/modules/catalogue/model');
const { Product, ProductImage, ProductVariant } = require('./src/modules/product/model');

async function fixData() {
  try {
    console.log("Starting data repair script (memory efficient)...");
    const catalogueIds = await Catalogue.findAll({ attributes: ['id'], raw: true });
    console.log(`Found ${catalogueIds.length} catalogues.`);

    for (const { id } of catalogueIds) {
      const catalogue = await Catalogue.findByPk(id, {
        include: [
          {
            model: Product,
            as: 'products',
            include: [
              { model: ProductImage, as: 'images' },
              { model: ProductVariant, as: 'variants' }
            ]
          }
        ]
      });
      console.log(`Processing catalogue: ${catalogue.name} (ID: ${catalogue.id})`);
      
      let thumbnailUrl = catalogue.thumbnailUrl;
      const cloudfrontDomain = config.get("aws.cloudfront.domain");

      // Fix product images first
      if (catalogue.products) {
        for (const product of catalogue.products) {
          if (product.images) {
            for (const image of product.images) {
              if (image.imageUrl && !image.imageUrl.startsWith('http')) {
                const fixedUrl = `https://${image.imageUrl}`;
                console.log(`  Fixing Product Image ID ${image.id}: ${image.imageUrl} -> ${fixedUrl}`);
                await image.update({ imageUrl: fixedUrl });
              }
            }
          }
        }
      }

      // Re-fetch or re-evaluate thumbnailUrl after product image fixes
      const firstProduct = catalogue.products && catalogue.products[0];
      if (firstProduct && firstProduct.images && firstProduct.images.length > 0) {
        const primaryImage =
          firstProduct.images.find((img) => img.isPrimary) ||
          firstProduct.images[0];
        thumbnailUrl = primaryImage.imageUrl;
      }

      // Ensure thumbnailUrl has https
      if (thumbnailUrl && !thumbnailUrl.startsWith('http')) {
        thumbnailUrl = `https://${thumbnailUrl}`;
      }
      
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let hasPrices = false;

      if (catalogue.products) {
        catalogue.products.forEach((prd) => {
          if (prd.variants) {
            prd.variants.forEach((v) => {
              const price = parseFloat(v.trabuwoPrice);
              if (!isNaN(price)) {
                if (price < minPrice) minPrice = price;
                if (price > maxPrice) maxPrice = price;
                hasPrices = true;
              }
            });
          }
        });
      }

      const priceRange = hasPrices 
        ? (minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`)
        : "--";

      console.log(`Updating Catalogue ID ${catalogue.id}: thumbnailUrl=${thumbnailUrl}, priceRange=${priceRange}`);

      await catalogue.update({
        thumbnailUrl,
        priceRange,
        minPrice: hasPrices ? minPrice : 0,
        maxPrice: hasPrices ? maxPrice : 0,
        totalProducts: catalogue.products.length
      });
    }

    console.log("Data repair complete.");
  } catch (error) {
    console.error("Error during data repair:", error);
  } finally {
    await sequelize.close();
  }
}

fixData();
