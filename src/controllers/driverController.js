const driverService = require('../services/driverService');
const prisma = require('../config/database');

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


exports.respondToDelivery = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const deliveryId = parseInt(req.params.id);
    const driverId = req.user.id;

    // Validate action
    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "accept" or "reject"',
      });
    }

    let delivery;

    if (action === 'accept') {
      delivery = await driverService.acceptDelivery(deliveryId, driverId);

      res.json({
        success: true,
        message: 'Delivery accepted successfully. You can now proceed with the delivery.',
        data: delivery,
      });
    } else {
      // Reject requires reason
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
      }

      delivery = await driverService.rejectDelivery(deliveryId, driverId, reason);

      res.json({
        success: true,
        message: 'Delivery rejected. Admin will be notified to reassign.',
        data: delivery,
      });
    }
  } catch (error) {
    console.error('Respond to delivery error:', error);
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};


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

exports.getSlotCapacity = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required (format: YYYY-MM-DD)'
      });
    }

    const targetDate = new Date(date);

    const slots = await prisma.slotAvailability.findMany({
      where: {
        date: targetDate
      },
      orderBy: { timeSlot: 'asc' }
    });

    // Count actual deliveries assigned to this driver for the date
    const driverDeliveries = await prisma.delivery.findMany({
      where: {
        driverId: req.user.id,
        deliveryDate: targetDate,
        status: { in: ['ALLOCATED', 'DELIVERED'] }
      },
      select: {
        timeSlot: true
      }
    });

    const deliveryCountBySlot = driverDeliveries.reduce((acc, del) => {
      acc[del.timeSlot] = (acc[del.timeSlot] || 0) + 1;
      return acc;
    }, {});

    const capacity = slots.map(slot => ({
      timeSlot: slot.timeSlot,
      totalDeliveries: slot.booked,
      maxCapacity: slot.maxCapacity,
      isFull: slot.isFull,
      myDeliveries: deliveryCountBySlot[slot.timeSlot] || 0
    }));

    res.json({
      success: true,
      data: {
        date,
        slots: capacity
      }
    });
  } catch (error) {
    console.error('Get slot capacity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve slot capacity.',
      error: error.message
    });
  }
};
