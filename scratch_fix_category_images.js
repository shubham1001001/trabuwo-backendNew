require("dotenv").config();
const { Client } = require("pg");

async function fixCategoryImages() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      "postgres://postgres:e9mEO8Os8199qGeuNK8i8YgAaF9e2OjS@my-postgres-db.c7io8egwa63a.ap-south-1.rds.amazonaws.com:5432/trabuwo_dev",
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database.");

    // 1. Get the image URL from "Popular" category (ID 6468)
    const resPopular = await client.query(
      "SELECT image_url FROM categories WHERE id = 6468"
    );

    if (resPopular.rows.length === 0 || !resPopular.rows[0].image_url) {
      console.error("❌ Could not find image URL for Popular category (ID 6468).");
      return;
    }

    const defaultImg = resPopular.rows[0].image_url;
    console.log(`🔍 Found default image: ${defaultImg}`);

    // 2. Update all NULL image_url entries
    const resUpdate = await client.query(
      "UPDATE categories SET image_url = $1 WHERE image_url IS NULL AND is_deleted = false",
      [defaultImg]
    );

    console.log(`🎉 Successfully updated ${resUpdate.rowCount} categories.`);
  } catch (err) {
    console.error("❌ Error during repair:", err);
  } finally {
    await client.end();
  }
}

fixCategoryImages();
