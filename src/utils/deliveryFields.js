const { body } = require("express-validator");

function normalizeCollectionPoints(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error("collectionPoints must be an array of addresses");
  }
  return value.map((point) => String(point ?? "").trim()).filter(Boolean);
}

function normalizeContractorRate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0) {
    throw new Error("contractorRate must be a non-negative number");
  }
  return rate;
}

function pickJobExtraFields(payload = {}) {
  const extra = {};
  if (Object.prototype.hasOwnProperty.call(payload, "collectionPoints")) {
    extra.collectionPoints = normalizeCollectionPoints(payload.collectionPoints);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "contractorRate")) {
    extra.contractorRate = normalizeContractorRate(payload.contractorRate);
  }
  return extra;
}

const contractorRateValidators = [
  body("contractorRate")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === "") return true;
      const rate = Number(value);
      return Number.isFinite(rate) && rate >= 0;
    })
    .withMessage("contractorRate must be a non-negative number"),
];

const jobExtraFieldValidators = [
  body("collectionPoints")
    .optional()
    .isArray()
    .withMessage("collectionPoints must be an array of addresses"),
  body("collectionPoints.*")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Each collection point must be a non-empty string"),
  ...contractorRateValidators,
];

function resolveAllocateContractorRate({
  isContractor,
  payType,
  existingRate,
  payload = {},
}) {
  if (!isContractor) {
    return { contractorRate: null };
  }

  const extra = pickJobExtraFields(payload);
  const nextRate =
    extra.contractorRate !== undefined
      ? extra.contractorRate
      : existingRate == null
        ? null
        : Number(existingRate);

  if (payType === "RATE_ON_JOB" && nextRate === null) {
    const error = new Error(
      "contractorRate is required when allocating a Rate on Job contractor",
    );
    error.statusCode = 400;
    throw error;
  }

  if (extra.contractorRate !== undefined) {
    return { contractorRate: extra.contractorRate };
  }

  return {};
}

module.exports = {
  pickJobExtraFields,
  jobExtraFieldValidators,
  contractorRateValidators,
  resolveAllocateContractorRate,
};
