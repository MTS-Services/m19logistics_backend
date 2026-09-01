const PAY_TYPES = ["DAILY", "WEEKLY", "FORTNIGHTLY", "FOUR_WEEKLY"];
const DRIVER_TYPES = ["EMPLOYEE", "CONTRACTOR"];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

//determines the status of a document expiry
function getExpiryStatus(dateValue, referenceDate = new Date()) {
  if (!dateValue) {
    return {
      date: null,
      status: "MISSING",
      label: "Not set",
      highlight: false,
      daysRemaining: null,
    };
  }

  const expiry = startOfDay(dateValue);
  const today = startOfDay(referenceDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((expiry - today) / msPerDay);

  if (daysRemaining < 0) {
    return {
      date: expiry,
      status: "EXPIRED",
      label: "EXPIRED",
      highlight: true,
      daysRemaining,
    };
  }
  if (daysRemaining <= 7) {
    return {
      date: expiry,
      status: "WITHIN_7_DAYS",
      label: "EXPIRES WITHIN 7 DAYS",
      highlight: true,
      daysRemaining,
    };
  }
  if (daysRemaining <= 14) {
    return {
      date: expiry,
      status: "WITHIN_14_DAYS",
      label: "EXPIRES WITHIN 14 DAYS",
      highlight: true,
      daysRemaining,
    };
  }
  if (daysRemaining <= 30) {
    return {
      date: expiry,
      status: "WITHIN_30_DAYS",
      label: "EXPIRES WITHIN 30 DAYS",
      highlight: true,
      daysRemaining,
    };
  }

  return {
    date: expiry,
    status: "VALID",
    label: "VALID",
    highlight: false,
    daysRemaining,
  };
}

function getDocumentExpirySummary(profile) {
  return {
    motExpiry: getExpiryStatus(profile?.motExpiry),
    insuranceExpiry: getExpiryStatus(profile?.insuranceExpiry),
    goodsInTransitExpiry: getExpiryStatus(profile?.goodsInTransitExpiry),
    publicLiabilityExpiry: getExpiryStatus(profile?.publicLiabilityExpiry),
  };
}

function getPayPeriodRange(payType, referenceDate = new Date()) {
  const today = startOfDay(referenceDate);
  const day = today.getDay(); // 0 Sun .. 6 Sat

  if (payType === "DAILY") {
    return { periodStart: today, periodEnd: endOfDay(today), label: "Daily" };
  }

  // Weeks start Monday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  if (payType === "WEEKLY") {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      periodStart: monday,
      periodEnd: endOfDay(sunday),
      label: "Weekly",
    };
  }

  if (payType === "FORTNIGHTLY") {
    // Current fortnight ending on this week's Sunday
    const periodStart = new Date(monday);
    periodStart.setDate(monday.getDate() - 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      periodStart,
      periodEnd: endOfDay(sunday),
      label: "Fortnightly",
    };
  }

  // FOUR_WEEKLY – 28-day window ending this Sunday
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const periodStart = new Date(monday);
  periodStart.setDate(monday.getDate() - 21);
  return {
    periodStart,
    periodEnd: endOfDay(sunday),
    label: "Four Weekly",
  };
}

function validateContractorFields(data, { isCreate = false } = {}) {
  const errors = [];
  const driverType = data.driverType || "EMPLOYEE";

  if (driverType && !DRIVER_TYPES.includes(driverType)) {
    errors.push("driverType must be EMPLOYEE or CONTRACTOR");
  }

  if (driverType !== "CONTRACTOR") {
    return errors;
  }

  const requiredOnCreate = [
    ["tradingName", "Trading Name"],
    ["address", "Address"],
    ["tradingAddress", "Trading Address"],
    ["driverLicenseNumber", "Driver's Licence Number"],
    ["vehicleRegistration", "Van Registration"],
    ["motExpiry", "MOT Expiry"],
    ["payType", "Pay Type"],
    ["rate", "Rate"],
  ];

  for (const [field, label] of requiredOnCreate) {
    const value = data[field];
    const missing =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");
    if (isCreate && missing) {
      errors.push(`${label} is required for contractors`);
    }
  }

  if (data.payType && !PAY_TYPES.includes(data.payType)) {
    errors.push("Pay Type must be Daily, Weekly, Fortnightly, or Four Weekly");
  }

  if (data.rate !== undefined && data.rate !== null && data.rate !== "") {
    const rate = parseFloat(data.rate);
    if (Number.isNaN(rate) || rate < 0) {
      errors.push("Rate must be a valid positive number");
    }
  }

  const vatRegistered =
    data.isVatRegistered === true ||
    data.isVatRegistered === "true" ||
    data.isVatRegistered === 1;

  if (vatRegistered) {
    if (
      data.vatNumber === undefined ||
      data.vatNumber === null ||
      String(data.vatNumber).trim() === ""
    ) {
      if (isCreate || data.isVatRegistered !== undefined) {
        errors.push("VAT Number is required when VAT Registered is Yes");
      }
    }
  }

  return errors;
}

function pickDriverProfileFields(data, { allowPayFields = true } = {}) {
  const fields = [
    "driverType",
    "vehicleRegistration",
    "driverLicenseNumber",
    "address",
    "isActiveDriver",
    "enableSmsNotifications",
    "enableEmailNotifications",
    "tradingName",
    "contactName",
    "tradingAddress",
    "isVatRegistered",
    "vatNumber",
    "vehicleMake",
    "vehicleModel",
    "motExpiry",
    "insuranceExpiry",
    "goodsInTransitExpiry",
    "publicLiabilityExpiry",
    "bankName",
    "accountName",
    "sortCode",
    "accountNumber",
    "bankReference",
  ];

  if (allowPayFields) {
    fields.push("payType", "rate");
  }

  const result = {};
  for (const key of fields) {
    if (data[key] !== undefined) {
      if (
        [
          "motExpiry",
          "insuranceExpiry",
          "goodsInTransitExpiry",
          "publicLiabilityExpiry",
        ].includes(key) &&
        data[key]
      ) {
        result[key] = new Date(data[key]);
      } else if (key === "isVatRegistered") {
        result[key] =
          data[key] === true || data[key] === "true" || data[key] === 1;
      } else if (key === "rate" && data[key] !== null && data[key] !== "") {
        result[key] = parseFloat(data[key]);
      } else if (key === "isActiveDriver" || key.startsWith("enable")) {
        result[key] =
          data[key] === true || data[key] === "true" || data[key] === 1;
      } else {
        result[key] = data[key];
      }
    }
  }
  return result;
}

module.exports = {
  PAY_TYPES,
  DRIVER_TYPES,
  getExpiryStatus,
  getDocumentExpirySummary,
  getPayPeriodRange,
  validateContractorFields,
  pickDriverProfileFields,
  startOfDay,
  endOfDay,
};
