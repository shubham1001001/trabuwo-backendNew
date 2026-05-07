const { S3Client, PutObjectAclCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

// Override for internal connection if running on the server
if (process.env.DB_HOST === "165.22.210.2") {
    process.env.DB_HOST = "127.0.0.1";
    process.env.DB_SSL = "false";
}

const { ProductImage } = require("../src/modules/product/model");
const sequelize = require("../src/config/database");

/**
 * INSTRUCTIONS:
 * 1. Ensure your .env has correct DO_ACCESS_KEY, DO_SECRET_KEY, DO_REGION, DO_SPACE_NAME.
 * 2. If running locally, you might need to tunnel to your DB or use correct DB_HOST.
 * 3. Run: node scratch/fix_existing_images.js
 */

const s3Client = new S3Client({
  region: process.env.DO_REGION || "sgp1",
  endpoint: process.env.DO_ENDPOINT || "https://sgp1.digitaloceanspaces.com",
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY,
    secretAccessKey: process.env.DO_SECRET_KEY,
  },
  forcePathStyle: false
});

async function fixAllImages() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    // Find recent images that might be broken
    const images = await ProductImage.findAll({
      where: { isDeleted: false },
      order: [["createdAt", "DESC"]],
      limit: 200 // Adjust limit as needed
    });

    console.log(`Found ${images.length} images to process.`);

    const bucket = process.env.DO_SPACE_NAME || "trabuwobucket";

    for (const img of images) {
      if (!img.imageKey) {
          console.log(`Skipping image ${img.id} (no key)`);
          continue;
      }
      
      console.log(`Setting public-read for: ${img.imageKey}`);
      try {
        const command = new PutObjectAclCommand({
          Bucket: bucket,
          Key: img.imageKey,
          ACL: "public-read",
        });
        await s3Client.send(command);
        console.log(`  ✓ Fixed image ${img.id}`);
      } catch (err) {
        console.error(`  ✗ Failed for ${img.id}: ${err.message}`);
      }
    }

    console.log("\nFinished processing images.");

  } catch (err) {
    console.error("Critical Error:", err);
  } finally {
    await sequelize.close();
  }
}

fixAllImages();
