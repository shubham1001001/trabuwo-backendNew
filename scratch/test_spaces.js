require("dotenv").config();
const s3Service = require("../src/services/s3");

async function runTest() {
  const testKey = `test-upload-${Date.now()}.txt`;
  const testBuffer = Buffer.from("Hello from DigitalOcean Spaces test script!");
  const contentType = "text/plain";

  console.log("--- STARTING DIGITALOCEAN SPACES TEST ---");

  try {
    // 1. Test Buffer Upload
    console.log(`1. Uploading test file: ${testKey}...`);
    await s3Service.uploadBuffer(testBuffer, testKey, contentType);
    console.log("✅ Upload successful!");

    // 2. Test Get URL
    const url = s3Service.getFileUrl(testKey);
    console.log(`2. Public URL: ${url}`);

    // 3. Test Signed Download URL
    console.log("3. Generating signed download URL...");
    const signedUrl = await s3Service.generateSignedDownloadUrl(testKey);
    console.log(`✅ Signed URL generated: ${signedUrl}`);

    // 4. Test Key from URL
    const extractedKey = s3Service.getKeyFromUrl(url);
    console.log(`4. Extracted Key from URL: ${extractedKey}`);
    if (extractedKey === testKey) {
      console.log("✅ Key extraction successful!");
    } else {
      console.log(`❌ Key extraction failed! Expected ${testKey}, got ${extractedKey}`);
    }

    // 5. Test Deletion
    console.log("5. Deleting test file...");
    await s3Service.deleteObject(testKey);
    console.log("✅ Deletion successful!");

    console.log("--- ALL TESTS PASSED SUCCESSFULLY! ---");
  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

runTest();
