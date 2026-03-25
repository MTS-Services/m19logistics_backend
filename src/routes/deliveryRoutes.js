const express = require("express");
const { body, query } = require("express-validator");
const deliveryController = require("../controllers/deliveryController");
const auditController = require("../controllers/auditController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/stats", authorize("CUSTOMER"), deliveryController.getStats);

router.post(
  "/",
  authorize("CUSTOMER"),
  [
    body("spoNumber").trim().notEmpty().withMessage("SPO number is required"),
    body("deliveryDate")
      .isISO8601()
      .withMessage("Valid delivery date is required"),
    body("timeSlot")
      .isIn(["AM", "PM", "SAME_DAY"])
      .withMessage("Valid time slot is required"),
    body("weight")
      .isFloat({ min: 0.1 })
      .withMessage("Weight must be greater than 0"),
    body("deliveryAddress")
      .trim()
      .notEmpty()
      .withMessage("Delivery address is required"),
    body("customerName")
      .trim()
      .notEmpty()
      .withMessage("Customer name is required"),
    body("customerPhone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required"),
    body("requestedBy")
      .trim()
      .notEmpty()
      .withMessage("Requested by field is required"),
    body("specialInstructions").optional().trim(),
    validate,
  ],
  deliveryController.createDelivery,
);

router.get(
  "/",
  authorize("CUSTOMER"),
  [
    query("status")
      .optional()
      .isIn(["ALL", "RECEIVED", "ALLOCATED", "DELIVERED", "CANCELLED"]),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
    query("search").optional().trim(),
  ],
  deliveryController.getMyDeliveries,
);

router.get("/:id", authorize("CUSTOMER"), deliveryController.getDeliveryById);

router.put(
  "/:id",
  authorize("CUSTOMER"),
  [
    body("deliveryDate").optional().isISO8601(),
    body("timeSlot").optional().isIn(["AM", "PM", "SAME_DAY"]),
    body("deliveryAddress").optional().trim().notEmpty(),
    body("specialInstructions").optional().trim(),
    validate,
  ],
  deliveryController.updateDelivery,
);

router.post(
  "/:id/cancel",
  authorize("CUSTOMER"),
  [
    body("reason")
      .trim()
      .notEmpty()
      .withMessage("Cancellation reason is required"),
    validate,
  ],
  deliveryController.cancelDelivery,
);

router.delete("/:id", authorize("CUSTOMER"), deliveryController.deleteDelivery);

router.get(
  "/audit-logs/me",
  authorize("CUSTOMER"),
  auditController.getMyAuditLogs,
);

router.get(
  "/audit-logs/:id",
  authorize("CUSTOMER"),
  auditController.getMyAuditLogById,
);

module.exports = router;
