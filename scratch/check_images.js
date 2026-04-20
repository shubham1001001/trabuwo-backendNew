require("dotenv").config();
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const config = require("config");

const s3Client = new S3Client({
  region: config.get("digitalocean.region"),
  endpoint: config.get("digitalocean.endpoint"),
  credentials: {
    accessKeyId: config.get("digitalocean.accessKeyId"),
    secretAccessKey: config.get("digitalocean.secretAccessKey"),
  },
});

async function checkImage(key) {
  try {
    console.log(`Checking key: ${key}...`);
    const command = new HeadObjectCommand({
      Bucket: config.get("digitalocean.spaceName"),
      Key: key,
    });
    const response = await s3Client.send(command);
    console.log(`✅ FOUND: ${key} (Size: ${response.ContentLength}, Type: ${response.ContentType})`);
  } catch (error) {
    if (error.name === 'NotFound') {
        console.log(`❌ NOT FOUND: ${key}`);
    } else {
        console.log(`❌ ERROR checking ${key}: ${error.message}`);
    }
  }
}

async function run() {
  const keysToCheck = [
    "banners/16/1776675779843-small-homepage-banner-1.webp",
    "banners/16/1776675779843-medium-homepage-banner-1.webp",
    "banners/16/1776675779843-large-homepage-banner-1.webp",
    "banners/16/1776675779843-original-homepage-banner-1.png"
  ];

  for (const key of keysToCheck) {
    await checkImage(key);
  }
}

run();
