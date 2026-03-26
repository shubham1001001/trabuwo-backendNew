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
  region: config.get("aws.region"),
  credentials: {
    accessKeyId: config.get("aws.accessKeyId"),
    secretAccessKey: config.get("aws.secretAccessKey"),
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
    Bucket: config.get("aws.s3.bucketName"),
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

const generatePresignedUrl = async (fileName, contentType, userId, folder) => {
  const key = generateFileName(fileName, userId, folder);

  const command = new PutObjectCommand({
    Bucket: config.get("aws.s3.bucketName"),
    Key: key,
    ContentType: contentType,
    Metadata: {
      "uploaded-by": userId.toString(),
      "original-name": fileName,
    },
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
      bucket: config.get("aws.s3.bucketName"),
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
  return `https://${config.get("aws.s3.bucketName")}.s3.${config.get(
    "aws.region"
  )}.amazonaws.com/${key}`;
};

const deleteObject = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.get("aws.s3.bucketName"),
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
      Bucket: config.get("aws.s3.bucketName"),
      Key: key,
      Body: buffer,
      ContentType: contentType,
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
        Bucket: config.get("aws.s3.bucketName"),
        Key: key,
        ContentType: image.contentType,
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
        bucket: config.get("aws.s3.bucketName"),
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
      Bucket: config.get("aws.s3.bucketName"),
      Key: key,
      Body: buffer,
      ContentType: contentType,
        // ACL: "public-read",
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
  generateFileName
};
