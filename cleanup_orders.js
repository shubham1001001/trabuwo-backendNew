const { Sequelize, Op } = require("sequelize");
const config = require("config");
const dbConfig = config.get("db");

// Custom sequelize instance without SSL
const sequelize = new Sequelize(
    dbConfig.name,
    dbConfig.user,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: "postgres",
        port: dbConfig.port,
        logging: false,
        dialectOptions: {
            // Force SSL OFF
        }
    }
);

const Category = require("./src/modules/category/model");

async function cleanupSubcategories() {
    try {
        console.log("Starting subcategory order cleanup...");
        
        // Define the Category model on our custom instance OR just use raw query
        // Safest is raw query to avoid model instantiation issues with different sequelize instances
        await sequelize.authenticate();
        console.log("Connected successfully.");

        const [results, metadata] = await sequelize.query(
            'UPDATE categories SET "displayOrderWeb" = NULL WHERE "parentId" IS NOT NULL AND "parentId" != 0'
        );

        console.log(`Success! Removed order values from subcategories.`);
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

cleanupSubcategories();
