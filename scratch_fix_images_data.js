require("dotenv").config();
const { Product, ProductImage } = require("./src/modules/product/model");
const Catalogue = require("./src/modules/catalogue/model");
const sequelize = require("./src/config/database");

const CAMPUS_IMG = "d7548un9mg0.cloudfront.net/product_images/28/1775739379074-58a7670f57f8b543.png";

async function fixImages() {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB");

        // 1. Find the "Testing" catalogues
        const catalogues = await Catalogue.findAll({
            where: {
                name: {
                    [require("sequelize").Op.iLike]: "%testing%"
                }
            },
            include: [{
                model: Product,
                as: 'products',
                include: [{
                    model: ProductImage,
                    as: 'images'
                }]
            }]
        });

        console.log(`Found ${catalogues.length} catalogues to fix.`);

        for (const cat of catalogues) {
            console.log(`Fixing Catalogue: ${cat.name}`);
            
            // Update catalogue thumbnail
            await cat.update({ thumbnailUrl: CAMPUS_IMG });

            for (const prd of cat.products) {
                console.log(`  Fixing Product: ${prd.name}`);
                
                if (prd.images && prd.images.length > 0) {
                    // Update existing images
                    for (const img of prd.images) {
                        await img.update({ imageUrl: CAMPUS_IMG });
                    }
                } else {
                    // Create new image if none exist
                    await ProductImage.create({
                        productId: prd.id,
                        imageUrl: CAMPUS_IMG,
                        isPrimary: true,
                        isActive: true
                    });
                }
            }
        }

        console.log("All testing products have been updated to use the Campus image!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sequelize.close();
    }
}

fixImages();
