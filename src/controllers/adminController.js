const adminService = require('../services/adminService');

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

// ==================== ANALYTICS DASHBOARD ====================

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
