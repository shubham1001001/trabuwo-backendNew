require("dotenv").config();
const { Product, ProductImage } = require("./src/modules/product/model");
const Catalogue = require("./src/modules/catalogue/model");
const sequelize = require("./src/config/database");

async function checkImages() {
    try {
        await sequelize.authenticate();
        
        const recentCat = await Catalogue.findOne({
            order: [['createdAt', 'DESC']],
            include: [{
                model: Product,
                as: 'products',
                include: [{
                    model: ProductImage,
                    as: 'images'
                }]
            }]
        });

        if (!recentCat) {
            console.log("No catalogue found");
            return;
        }

        console.log(`Catalogue: ${recentCat.name} (id: ${recentCat.id})`);
        recentCat.products.forEach(p => {
            console.log(`  Product: ${p.name}`);
            p.images.forEach(img => {
                console.log(`    Image: imageUrl="${img.imageUrl}", isPrimary=${img.isPrimary}`);
            });
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sequelize.close();
    }
}

checkImages();
