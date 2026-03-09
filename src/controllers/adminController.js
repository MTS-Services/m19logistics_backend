const prisma = require('../config/database');
const adminService = require('../services/adminService');
const contactService = require('../services/contactService');
const enquiryService = require('../services/enquiryService');
const auditService = require('../services/auditService');
const exportService = require('../services/exportService');

// ==================== USER MANAGEMENT ====================

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers(req.query);

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(parseInt(req.params.id));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    // Validate user ID
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await adminService.updateUser(userId, req.body);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    if (error.message === 'Invalid user ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    // Validate user ID
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    await adminService.deleteUser(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    if (error.message === 'Invalid user ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    // Validate user ID
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await adminService.toggleUserStatus(userId);

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    if (error.message === 'Invalid user ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    next(error);
  }
};

// ==================== DELIVERY MANAGEMENT ====================

exports.getAllDeliveries = async (req, res, next) => {
  try {
    const deliveries = await adminService.getAllDeliveries(req.query);

    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeliveryById = async (req, res, next) => {
  try {
    const deliveryId = parseInt(req.params.id);

    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID',
      });
    }

    const delivery = await adminService.getDeliveryById(deliveryId);

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    if (error.message === 'Invalid delivery ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID',
      });
    }
    if (error.message === 'Delivery not found') {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }
    next(error);
  }
};

exports.updateDelivery = async (req, res, next) => {
  try {
    const deliveryId = parseInt(req.params.id);

    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID',
      });
    }

    const delivery = await adminService.updateDelivery(
      deliveryId,
      req.body
    );

    res.json({
      success: true,
      message: 'Delivery updated successfully',
      data: delivery,
    });
  } catch (error) {
    if (error.message === 'Invalid delivery ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID',
      });
    }
    if (error.message === 'Delivery not found') {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }
    if (error.message === 'Cannot edit delivery in current status') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit delivery in current status. Only RECEIVED or ALLOCATED deliveries can be edited.',
      });
    }
    next(error);
  }
};

exports.deleteDelivery = async (req, res, next) => {
  try {
    const deliveryId = parseInt(req.params.id);

    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID',
      });
    }

    const result = await adminService.deleteDelivery(deliveryId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === 'Invalid delivery ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID',
      });
    }
    if (error.message === 'Delivery not found') {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }
    if (error.message && error.message.includes('Cannot delete delivery in current status')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

exports.allocateDelivery = async (req, res, next) => {
  try {
    const { driverId } = req.body;
    const delivery = await adminService.allocateDelivery(
      parseInt(req.params.id),
      parseInt(driverId)
    );

    res.json({
      success: true,
      message: 'Delivery allocated successfully',
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const deliveryId = parseInt(req.params.id);

    // Validate delivery ID
    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID'
      });
    }

    const { status, ...data } = req.body;
    const delivery = await adminService.updateDeliveryStatus(
      deliveryId,
      status,
      data
    );

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery,
    });
  } catch (error) {
    if (error.message === 'Delivery not found') {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }
    if (error.message === 'Invalid delivery ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID'
      });
    }
    next(error);
  }
};

exports.addExtraCharge = async (req, res, next) => {
  try {
    const deliveryId = parseInt(req.params.id);

    // Validate delivery ID
    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID'
      });
    }

    const charge = await adminService.addExtraCharge(
      deliveryId,
      req.body
    );

    res.json({
      success: true,
      message: 'Extra charge added successfully',
      data: charge,
    });
  } catch (error) {
    if (error.message === 'Delivery not found') {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }
    if (error.message === 'Invalid delivery ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID'
      });
    }
    next(error);
  }
};

exports.removeExtraCharge = async (req, res, next) => {
  try {
    const chargeId = parseInt(req.params.chargeId);

    // Validate charge ID
    if (isNaN(chargeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid charge ID'
      });
    }

    await adminService.removeExtraCharge(chargeId);

    res.json({
      success: true,
      message: 'Extra charge removed successfully',
    });
  } catch (error) {
    if (error.message === 'Extra charge not found') {
      return res.status(404).json({
        success: false,
        message: 'Extra charge not found'
      });
    }
    if (error.message === 'Invalid charge ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid charge ID'
      });
    }
    next(error);
  }
};

exports.getDeliveryExtraCharges = async (req, res, next) => {
  try {
    const deliveryId = parseInt(req.params.id);

    // Validate delivery ID
    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID'
      });
    }

    const charges = await adminService.getDeliveryExtraCharges(deliveryId);

    res.json({
      success: true,
      data: charges,
      count: charges.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllPricingTiers = async (req, res, next) => {
  try {
    const tiers = await adminService.getAllPricingTiers();

    res.json({
      success: true,
      data: tiers,
      count: tiers.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.createPricingTier = async (req, res, next) => {
  try {
    const tier = await adminService.createPricingTier(req.body);

    res.status(201).json({
      success: true,
      message: 'Pricing tier created successfully',
      data: tier,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePricingTier = async (req, res, next) => {
  try {
    const tierId = parseInt(req.params.id);

    // Validate pricing tier ID
    if (isNaN(tierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing tier ID',
      });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const tier = await adminService.updatePricingTier(
      tierId,
      req.body
    );

    res.json({
      success: true,
      message: 'Pricing tier updated successfully',
      data: tier,
    });
  } catch (error) {
    if (error.message === 'Invalid pricing tier ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing tier ID',
      });
    }
    if (error.message === 'Pricing tier not found') {
      return res.status(404).json({
        success: false,
        message: 'Pricing tier not found',
      });
    }
    next(error);
  }
};

exports.deletePricingTier = async (req, res, next) => {
  try {
    const tierId = parseInt(req.params.id);

    // Validate pricing tier ID
    if (isNaN(tierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing tier ID',
      });
    }

    await adminService.deletePricingTier(tierId);

    res.json({
      success: true,
      message: 'Pricing tier deleted successfully',
    });
  } catch (error) {
    if (error.message === 'Invalid pricing tier ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing tier ID',
      });
    }
    if (error.message === 'Pricing tier not found') {
      return res.status(404).json({
        success: false,
        message: 'Pricing tier not found',
      });
    }
    if (error.message.includes('Cannot delete pricing tier')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// ==================== INVOICE MANAGEMENT ====================

exports.generateInvoice = async (req, res, next) => {
  try {
    const { customerId, weekStartDate, weekEndDate } = req.body;
    const invoice = await adminService.generateInvoice(
      parseInt(customerId),
      weekStartDate,
      weekEndDate
    );

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

exports.generateWeeklyInvoicesForAll = async (req, res, next) => {
  try {
    const invoiceGenerationService = require('../services/invoiceGenerationService');
    const { weekStartDate, weekEndDate } = req.body;

    const result = await invoiceGenerationService.generateWeeklyInvoicesForAllCustomers(
      weekStartDate,
      weekEndDate
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.generateLastWeekInvoices = async (req, res, next) => {
  try {
    const invoiceGenerationService = require('../services/invoiceGenerationService');
    const { weekStartDate, weekEndDate } = invoiceGenerationService.getLastWeekRange();

    const result = await invoiceGenerationService.generateWeeklyInvoicesForAllCustomers(
      weekStartDate,
      weekEndDate
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.sendInvoiceReminders = async (req, res, next) => {
  try {
    const cronService = require('../services/cronService');
    await cronService.sendWeeklyInvoiceReminder();

    res.json({
      success: true,
      message: 'Invoice payment reminders sent. Check server logs for details.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllInvoices = async (req, res, next) => {
  try {
    const invoices = await adminService.getAllInvoices(req.query);

    // Calculate summary statistics
    const totalInvoices = invoices.length;
    const totalPaid = invoices
      .filter(inv => inv.isPaid)
      .reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);
    const totalUnpaid = invoices
      .filter(inv => !inv.isPaid)
      .reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);

    res.json({
      success: true,
      data: invoices,
      count: invoices.length,
      summary: {
        totalInvoices,
        totalPaid: totalPaid.toFixed(2),
        totalUnpaid: totalUnpaid.toFixed(2),
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.markInvoiceAsPaid = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id);

    // Validate invoice ID
    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const invoice = await adminService.markInvoiceAsPaid(invoiceId);

    res.json({
      success: true,
      message: 'Invoice marked as paid',
      data: invoice,
    });
  } catch (error) {
    if (error.message === 'Invalid invoice ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    next(error);
  }
};

exports.addExtraCharge = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id);

    // Validate invoice ID
    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const item = await adminService.addExtraCharge(
      invoiceId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Extra charge added successfully',
      data: item,
    });
  } catch (error) {
    if (error.message === 'Invalid invoice ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    next(error);
  }
};


exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id);

    // Validate invoice ID
    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const invoice = await adminService.getInvoiceById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    if (error.message === 'Invalid invoice ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }
    next(error);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id);

    // Validate invoice ID
    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const invoice = await adminService.updateInvoiceComplete(
      invoiceId,
      req.body
    );

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
  } catch (error) {
    if (error.message === 'Invalid invoice ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    if (error.message.includes('Cannot edit a paid invoice')) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit a paid invoice. Contact finance team for adjustments.',
        hint: 'To override this protection, include "allowEditPaid: true" in your request body.',
      });
    }
    if (error.message.includes('Invoice number') && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

exports.getSlotAvailability = async (req, res, next) => {
  try {
    const slots = await adminService.getSlotAvailability(req.query);

    res.json({
      success: true,
      data: slots,
      count: slots.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.setSlotAvailability = async (req, res, next) => {
  try {
    const slot = await adminService.setSlotAvailability(req.body);

    res.json({
      success: true,
      message: 'Slot availability updated successfully',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSlotCapacity = async (req, res, next) => {
  try {
    const { method, value } = req.body;
    const slotId = parseInt(req.params.id);

    if (isNaN(slotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot ID',
      });
    }

    const slot = await adminService.updateSlotCapacity(
      slotId,
      method,
      parseInt(value)
    );

    res.json({
      success: true,
      message: `Slot capacity ${method}d by ${value} successfully`,
      data: slot,
    });
  } catch (error) {
    if (error.message === 'Invalid slot ID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot ID',
      });
    }
    if (error.message === 'Slot not found') {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }
    if (error.message === 'Method must be either "increase" or "decrease"') {
      return res.status(400).json({
        success: false,
        message: 'Method must be either "increase" or "decrease"',
      });
    }
    if (error.message === 'Value must be a positive number') {
      return res.status(400).json({
        success: false,
        message: 'Value must be a positive number',
      });
    }
    if (error.message === 'Capacity cannot be negative') {
      return res.status(400).json({
        success: false,
        message: 'Capacity cannot be negative',
      });
    }
    if (error.message && error.message.includes('cannot reduce capacity below')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};


exports.getDashboard = async (req, res, next) => {
  try {
    const dashboard = await adminService.getDashboard();

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};


exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getAnalytics(req.query);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};


exports.getAllContacts = async (req, res, next) => {
  try {
    const contacts = await contactService.getAllContacts(req.query);

    res.json({
      success: true,
      data: contacts,
      count: contacts.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getContactById = async (req, res, next) => {
  try {
    const contact = await contactService.getContactById(parseInt(req.params.id));

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

exports.markContactAsRead = async (req, res, next) => {
  try {
    const contact = await contactService.markContactAsRead(parseInt(req.params.id));

    res.json({
      success: true,
      message: 'Contact marked as read',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    await contactService.deleteContact(parseInt(req.params.id));

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllEnquiries = async (req, res, next) => {
  try {
    const enquiries = await enquiryService.getAllEnquiries(req.query);

    res.json({
      success: true,
      data: enquiries,
      count: enquiries.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.getEnquiryById(parseInt(req.params.id));

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }

    res.json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

exports.markEnquiryAsRead = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.markEnquiryAsRead(parseInt(req.params.id));

    res.json({
      success: true,
      message: 'Enquiry marked as read',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteEnquiry = async (req, res, next) => {
  try {
    await enquiryService.deleteEnquiry(parseInt(req.params.id));

    res.json({
      success: true,
      message: 'Enquiry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
exports.getDriverPerformance = async (req, res, next) => {
  try {
    const performance = await adminService.getDriverPerformance(req.query);

    res.json({
      success: true,
      data: performance,
      count: performance.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getCustomerAnalytics(req.query);

    res.json({
      success: true,
      data: analytics,
      count: analytics.length,
    });
  } catch (error) {
    next(error);
  }
};

// AUDIT LOGS (ADMIN) 

exports.getAllAuditLogs = async (req, res, next) => {
  try {
    const logs = await auditService.getAllAuditLogs(req.query);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuditLogById = async (req, res, next) => {
  try {
    const log = await auditService.getAuditLogById(parseInt(req.params.id));

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};


// Export Invoice as PDF
exports.exportInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await adminService.getInvoiceById(parseInt(req.params.id));

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    const pdfBuffer = await exportService.generateInvoicePDFBuffer(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// Export Deliveries (Excel or CSV) 
exports.exportDeliveries = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;

    const deliveries = await adminService.getAllDeliveries({
      ...req.query,
      includeAll: true,
    });

    if (format === 'csv') {
      const csv = exportService.generateDeliveriesCSV(deliveries);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Deliveries-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      const excelBuffer = await exportService.generateDeliveriesExcel(deliveries);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Deliveries-${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(excelBuffer);
    }
  } catch (error) {
    next(error);
  }
};

// Export Analytics (Excel or CSV)
exports.exportAnalytics = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;

    const analyticsData = await adminService.getAnalytics(req.query);

    if (format === 'csv') {
      const csv = exportService.generateAnalyticsCSV(analyticsData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Analytics-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      const excelBuffer = await exportService.generateAnalyticsExcel(analyticsData);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(excelBuffer);
    }
  } catch (error) {
    next(error);
  }
};

// ==================== DRIVER MANAGEMENT ====================

exports.getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await adminService.getAllDrivers(req.query);

    // Calculate summary stats for UI
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.isActive && d.driverProfile?.isActiveDriver).length;
    const thisWeekDeliveries = drivers.reduce((sum, d) => sum + (d.performance?.thisWeek || 0), 0);

    res.json({
      success: true,
      data: drivers,
      count: drivers.length,
      summary: {
        totalDrivers,
        activeDrivers,
        thisWeekDeliveries
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDriverById = async (req, res, next) => {
  try {
    const driver = await adminService.getDriverById(parseInt(req.params.id));

    res.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }
    next(error);
  }
};

exports.createDriver = async (req, res, next) => {
  try {
    const driver = await adminService.createDriver(req.body);

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver,
    });
  } catch (error) {
    if (error.message === 'Email already exists' || error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

exports.updateDriver = async (req, res, next) => {
  try {
    const driver = await adminService.updateDriver(parseInt(req.params.id), req.body);

    res.json({
      success: true,
      message: 'Driver updated successfully',
      data: driver,
    });
  } catch (error) {
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }
    if (error.message === 'Email already exists' || error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

exports.deleteDriver = async (req, res, next) => {
  try {
    const result = await adminService.deleteDriver(parseInt(req.params.id));

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }
    if (error.message.includes('Cannot delete driver with active or allocated deliveries')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};


// DRIVER AVAILABILITY MANAGEMENT (ADMIN/MANAGER) 


exports.getAllDriversAvailability = async (req, res, next) => {
  try {
    const { startDate, endDate, date, timeSlot, isAvailable, driverId } = req.query;

    const where = {};


    if (date) {
      where.date = new Date(date);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }


    if (timeSlot) {
      where.timeSlot = timeSlot;
    }

    // Availability filtering
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }


    if (driverId) {
      where.driverId = parseInt(driverId);
    }

    const availability = await prisma.driverAvailability.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            driverProfile: {
              select: {
                vehicleRegistration: true,
                isActiveDriver: true,
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { timeSlot: 'asc' },
        { driver: { fullName: 'asc' } }
      ],
    });


    const grouped = {};
    availability.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0];
      const slotKey = `${dateKey}_${item.timeSlot}`;

      if (!grouped[slotKey]) {
        grouped[slotKey] = {
          date: item.date,
          timeSlot: item.timeSlot,
          drivers: []
        };
      }

      grouped[slotKey].drivers.push({
        id: item.driver.id,
        fullName: item.driver.fullName,
        email: item.driver.email,
        phone: item.driver.phone,
        vehicleRegistration: item.driver.driverProfile?.vehicleRegistration,
        isActiveDriver: item.driver.driverProfile?.isActiveDriver,
        isAvailable: item.isAvailable,
        notes: item.notes,
        availabilityId: item.id,
      });
    });

    res.json({
      success: true,
      count: availability.length,
      data: availability,
      grouped: Object.values(grouped),
    });
  } catch (error) {
    console.error('Get all drivers availability error:', error);
    next(error);
  }
};


exports.getDriverAvailability = async (req, res, next) => {
  try {
    const driverId = parseInt(req.params.id);


    const driver = await prisma.user.findUnique({
      where: { id: driverId, role: 'DRIVER' },
      select: { id: true, fullName: true, email: true },
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const { startDate, endDate, date, timeSlot } = req.query;
    const where = { driverId };


    if (date) {
      where.date = new Date(date);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }


    if (timeSlot) {
      where.timeSlot = timeSlot;
    }

    const availability = await prisma.driverAvailability.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { timeSlot: 'asc' }
      ],
    });

    res.json({
      success: true,
      driver: {
        id: driver.id,
        fullName: driver.fullName,
        email: driver.email,
      },
      count: availability.length,
      data: availability,
    });
  } catch (error) {
    console.error('Get driver availability error:', error);
    next(error);
  }
};

