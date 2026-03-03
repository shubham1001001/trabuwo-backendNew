const VALID_STATUSES = [
  "draft",
  "qc_in_progress",
  "qc_passed",
  "qc_error",
  "live",
  "paused",
  "cancelled",
];

const VALID_QC_STATUSES = ["qc_passed", "qc_error"];

module.exports = {
  VALID_STATUSES,
  VALID_QC_STATUSES,
};
