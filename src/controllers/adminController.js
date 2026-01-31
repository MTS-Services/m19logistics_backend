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
    const user = await adminService.updateUser(parseInt(req.params.id), req.body);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(parseInt(req.params.id));
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserStatus(parseInt(req.params.id));
    
    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
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
    const { status, ...data } = req.body;
    const delivery = await adminService.updateDeliveryStatus(
      parseInt(req.params.id),
      status,
      data
    );
    
    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

exports.addExtraCharge = async (req, res, next) => {
  try {
    const charge = await adminService.addExtraCharge(
      parseInt(req.params.id),
      req.body
    );
    
    res.json({
      success: true,
      message: 'Extra charge added successfully',
      data: charge,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeExtraCharge = async (req, res, next) => {
  try {
    await adminService.removeExtraCharge(parseInt(req.params.chargeId));
    
    res.json({
      success: true,
      message: 'Extra charge removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeliveryExtraCharges = async (req, res, next) => {
  try {
    const charges = await adminService.getDeliveryExtraCharges(
      parseInt(req.params.id)
    );
    
    res.json({
      success: true,
      data: charges,
      count: charges.length,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PRICING TIER MANAGEMENT ====================

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
    const tier = await adminService.updatePricingTier(
      parseInt(req.params.id),
      req.body
    );
    
    res.json({
      success: true,
      message: 'Pricing tier updated successfully',
      data: tier,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePricingTier = async (req, res, next) => {
  try {
    await adminService.deletePricingTier(parseInt(req.params.id));
    
    res.json({
      success: true,
      message: 'Pricing tier deleted successfully',
    });
  } catch (error) {
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

exports.getAllInvoices = async (req, res, next) => {
  try {
    const invoices = await adminService.getAllInvoices(req.query);
    
    res.json({
      success: true,
      data: invoices,
      count: invoices.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.markInvoiceAsPaid = async (req, res, next) => {
  try {
    const invoice = await adminService.markInvoiceAsPaid(parseInt(req.params.id));
    
    res.json({
      success: true,
      message: 'Invoice marked as paid',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

exports.addExtraCharge = async (req, res, next) => {
  try {
    const item = await adminService.addExtraCharge(
      parseInt(req.params.id),
      req.body
    );
    
    res.status(201).json({
      success: true,
      message: 'Extra charge added successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== INVOICE EDITING ====================

exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await adminService.getInvoiceById(parseInt(req.params.id));
    
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
    next(error);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await adminService.updateInvoiceComplete(
      parseInt(req.params.id),
      req.body
    );
    
    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SLOT AVAILABILITY MANAGEMENT ====================

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
    const slot = await adminService.updateSlotCapacity(
      parseInt(req.params.id),
      method,
      parseInt(value)
    );
    
    res.json({
      success: true,
      message: `Slot capacity ${method}d by ${value} successfully`,
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

//  DASHBOARD 

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

// ANALYTICS DASHBOARD 

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

//  CONTACT MANAGEMENT 

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

//  ENQUIRY MANAGEMENT 

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

//  EXPORT FEATURES 

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

    const pdfDoc = exportService.generateInvoicePDF(invoice);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);
    
    pdfDoc.pipe(res);
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
