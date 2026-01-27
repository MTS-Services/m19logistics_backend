const driverService = require('../services/driverService');

/**
 * Get driver dashboard with stats and today's schedule
 */
exports.getDashboard = async (req, res) => {
  try {
    const dashboard = await driverService.getDriverDashboard(req.user.id);
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard.',
      error: error.message,
    });
  }
};

/**
 * Get all assigned deliveries for driver
 */
exports.getAssignedDeliveries = async (req, res) => {
  try {
    const deliveries = await driverService.getAssignedDeliveries(req.user.id, req.query);
    
    res.json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    console.error('Get assigned deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve deliveries.',
      error: error.message,
    });
  }
};

/**
 * Get single delivery details
 */
exports.getDeliveryDetails = async (req, res) => {
  try {
    const delivery = await driverService.getDeliveryDetails(
      parseInt(req.params.id),
      req.user.id
    );
    
    res.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    console.error('Get delivery details error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Upload proof of delivery (signature & photos)
 */
exports.uploadProofOfDelivery = async (req, res) => {
  try {
    if (!req.files || (!req.files.signature && !req.files.photo)) {
      return res.status(400).json({
        success: false,
        message: 'At least one file (signature or photo) is required.',
      });
    }

    const delivery = await driverService.uploadProofOfDelivery(
      parseInt(req.params.id),
      req.user.id,
      req.files
    );
    
    res.json({
      success: true,
      message: 'Proof of delivery uploaded successfully.',
      data: delivery,
    });
  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Mark delivery as complete
 */
exports.completeDelivery = async (req, res) => {
  try {
    const delivery = await driverService.completeDelivery(
      parseInt(req.params.id),
      req.user.id,
      req.body
    );
    
    res.json({
      success: true,
      message: 'Delivery marked as completed successfully.',
      data: delivery,
    });
  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Submit driver feedback for a delivery
 */
exports.submitFeedback = async (req, res) => {
  try {
    const feedback = await driverService.submitFeedback(
      parseInt(req.params.id),
      req.user.id,
      req.body
    );
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully.',
      data: feedback,
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get driver performance metrics
 */
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const metrics = await driverService.getPerformanceMetrics(
      req.user.id,
      req.query.startDate,
      req.query.endDate
    );
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics.',
      error: error.message,
    });
  }
};
