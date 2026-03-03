exports.CLAIM_STATUSES = ["open", "in_progress", "resolved", "closed"];

exports.CLAIM_PRIORITIES = ["low", "medium", "high", "urgent"];

exports.EVIDENCE_TYPES = [
  "barcode_image",
  "product_image",
  "reverse_waybill",
  "unpacking_video",
];

exports.REQUIRED_EVIDENCE_TYPES = ["unpacking_video", "product_image"];

exports.RESPONSE_TYPES = ["user_update", "admin_response", "system_update"];

exports.PACKET_STATES = ["intact", "damaged", "tampered", "missing"];

exports.FILE_LIMITS = {
  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024,
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg"],
  },
  VIDEO: {
    MAX_SIZE: 50 * 1024 * 1024,
    ALLOWED_TYPES: ["video/mp4", "video/avi", "video/mov"],
  },
  DOCUMENT: {
    MAX_SIZE: 10 * 1024 * 1024,
    ALLOWED_TYPES: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
};
