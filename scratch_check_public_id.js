require("dotenv").config();
const Catalogue = require("./src/modules/catalogue/model");
const sequelize = require("./src/config/database");

async function checkPublicId() {
    try {
        await sequelize.authenticate();
        const cat = await Catalogue.findOne({ order: [['createdAt', 'DESC']] });
        console.log(`Catalogue publicId: ${cat.publicId}`);
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

checkPublicId();
