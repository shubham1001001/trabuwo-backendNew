const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const config = require("config");
const crypto = require("crypto");
const ApiError = require("../utils/ApiError");
const s3ObjectTrackerService = require("../modules/s3ObjectTracker/service");

const s3Client = new S3Client({
  region: config.get("digitalocean.region"),
  endpoint: config.get("digitalocean.endpoint"),
  credentials: {
    accessKeyId: config.get("digitalocean.accessKeyId"),
    secretAccessKey: config.get("digitalocean.secretAccessKey"),
  },
});

const generateFileName = (originalName, userId, folder) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const fileExtension = originalName.split(".").pop();
  return `${folder}/${userId}/${timestamp}-${randomString}.${fileExtension}`;
};

const generateSignedDownloadUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: config.get("digitalocean.spaceName"),
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

const generatePresignedUrl = async (fileName, contentType, userId, folder) => {
  const key = generateFileName(fileName, userId, folder);

  const command = new PutObjectCommand({
    Bucket: config.get("digitalocean.spaceName"),
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  try {
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    await s3ObjectTrackerService.createUnlinkedRecord(key);

    return {
      presignedUrl,
      key,
      url: getFileUrl(key),
      bucket: config.get("digitalocean.spaceName"),
    };
  } catch (error) {
    throw new ApiError(
      500,
      `Failed to generate presigned URL: ${error.message}`,
      "INTERNAL_ERROR"
    );
  }
};

const getFileUrl = (key) => {
  const baseUrl = config.get("digitalocean.cdnUrl") || config.get("digitalocean.baseUrl");
  return `${baseUrl}/${key}`;
};

const getKeyFromUrl = (url) => {
  if (!url) return null;
  const baseUrl = config.get("digitalocean.cdnUrl") || config.get("digitalocean.baseUrl");
  // Ensure we don't have double slashes if the baseUrl ends with one
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return url.replace(`${cleanBaseUrl}/`, "");
};

const deleteObject = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.get("digitalocean.spaceName"),
      Key: key,
    });

    const result = await s3Client.send(command);

    return result;
  } catch (error) {
    throw new ApiError(
      500,
      `Failed to delete S3 object: ${error.message}`,
      "S3_DELETION_ERROR"
    );
  }
};

const uploadBuffer = async (buffer, key, contentType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.get("digitalocean.spaceName"),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
      Metadata: {
        "uploaded-by": "system",
        "upload-type": "banner",
      },
    });

    await s3Client.send(command);

    return key;
  } catch (error) {
    throw new ApiError(
      500,
      `Failed to upload buffer to S3: ${error.message}`,
      "S3_UPLOAD_ERROR"
    );
  }
};

const generatePresignedUrlBulk = async (images, userId) => {
  const promises = images.map(async (image) => {
    try {
      const key = generateFileName(image.fileName, userId, "product_images");
      const command = new PutObjectCommand({
        Bucket: config.get("digitalocean.spaceName"),
        Key: key,
        ContentType: image.contentType,
        ACL: "public-read",
        Metadata: {
          "uploaded-by": userId.toString(),
          "original-name": image.fileName,
          "bulk-upload": "true",
        },
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      return {
        fileName: image.fileName,
        presignedUrl,
        key,
        url: getFileUrl(key),
        bucket: config.get("digitalocean.spaceName"),
        status: "success",
      };
    } catch (error) {
      return {
        fileName: image.fileName,
        error: error.message,
        status: "failed",
      };
    }
  });

  const results = await Promise.all(promises);

  const successfulKeys = results
    .filter((r) => r.status === "success")
    .map((r) => r.key);

  if (successfulKeys.length > 0) {
    await s3ObjectTrackerService.createUnlinkedRecordsBulk(successfulKeys);
  }

  return results;
};


// profile image upload

const uploadProfileBuffer = async (buffer, key, contentType, metadata = {}) => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.get("digitalocean.spaceName"),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
      Metadata: {
        ...metadata, //now defined
      },
    });

    await s3Client.send(command);

    return key;
  } catch (error) {
    throw new ApiError(
      500,
      `Failed to upload buffer to S3: ${error.message}`,
      "S3_UPLOAD_ERROR"
    );
  }
};

module.exports = {
  generatePresignedUrl,
  generatePresignedUrlBulk,
  getFileUrl,
  generateSignedDownloadUrl,
  deleteObject,
  uploadBuffer,
  uploadProfileBuffer,
  generateFileName,
  getKeyFromUrl
};
