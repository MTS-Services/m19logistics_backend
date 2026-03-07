const deliveryService = require('../services/deliveryService');
const prisma = require('../config/database');

class DeliveryController {

  async createDelivery(req, res) {
    try {
      const customerId = req.user.id;
      const {
        spoNumber,
        deliveryDate,
        timeSlot,
        weight,
        deliveryAddress,
        customerName,
        customerPhone,
        requestedBy,
        specialInstructions,
      } = req.body;

      // Check for same-day delivery
      if (deliveryService.isSameDay(deliveryDate) && timeSlot !== 'SAME_DAY') {
        return res.status(400).json({
          success: false,
          message: 'Same-day delivery requires confirmation. Please call 07971415430.',
        });
      }

      const delivery = await deliveryService.createDelivery(customerId, {
        spoNumber,
        deliveryDate: new Date(deliveryDate),
        timeSlot,
        weight: parseFloat(weight),
        deliveryAddress,
        customerName,
        customerPhone,
        requestedBy,
        specialInstructions,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: customerId,
          deliveryId: delivery.id,
          action: 'CREATE_DELIVERY',
          description: `Created delivery request ${delivery.spoNumber}`,
          afterData: delivery,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Delivery request created successfully',
        confirmed: true,
        bookingConfirmation: {
          bookingId: delivery.id,
          spoNumber: delivery.spoNumber,
          deliveryDate: delivery.deliveryDate,
          timeSlot: delivery.timeSlot,
          status: delivery.status,
          customerName: delivery.customerName,
          deliveryAddress: delivery.deliveryAddress,
          totalPrice: delivery.totalPrice
        },
        data: delivery,
      });
    } catch (error) {
      console.error('Create delivery error:', error);

      // Handle slot-related errors with clear messaging
      if (error.message.includes('FULL') ||
        error.message.includes('slot is full') ||
        error.message.includes('slot availability') ||
        error.message.includes('Please choose another') ||
        error.message.includes('Please contact admin') ||
        error.message.includes('No remaining capacity') ||
        error.message.includes('Maximum capacity')) {
        return res.status(400).json({
          success: false,
          confirmed: false,
          slotUnavailable: true,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create delivery request',
        error: error.message,
      });
    }
  }

  async getMyDeliveries(req, res) {
    try {
      const customerId = req.user.id;
      const { status, startDate, endDate, search } = req.query;

      const deliveries = await deliveryService.getCustomerDeliveries(customerId, {
        status,
        startDate,
        endDate,
        search,
      });

      res.json({
        success: true,
        data: deliveries,
        count: deliveries.length,
      });
    } catch (error) {
      console.error('Get deliveries error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch deliveries',
        error: error.message,
      });
    }
  }

  async getDeliveryById(req, res) {
    try {
      const { id } = req.params;
      const deliveryId = parseInt(id);


      if (isNaN(deliveryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery ID',
        });
      }

      const customerId = req.user.role === 'CUSTOMER' ? req.user.id : null;

      const delivery = await deliveryService.getDeliveryById(
        deliveryId,
        customerId
      );

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found',
        });
      }

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
      console.error('Get delivery error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery',
        error: error.message,
      });
    }
  }


  async updateDelivery(req, res) {
    try {
      const { id } = req.params;
      const deliveryId = parseInt(id);

      // Validate delivery ID
      if (isNaN(deliveryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery ID',
        });
      }

      const customerId = req.user.id;
      const updateData = req.body;

      const oldDelivery = await deliveryService.getDeliveryById(deliveryId, customerId);

      const delivery = await deliveryService.updateDelivery(
        deliveryId,
        customerId,
        updateData
      );


      await prisma.auditLog.create({
        data: {
          userId: customerId,
          deliveryId: delivery.id,
          action: 'UPDATE_DELIVERY',
          description: `Updated delivery ${delivery.spoNumber}`,
          beforeData: oldDelivery,
          afterData: delivery,
        },
      });

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
      if (error.message === 'Delivery not found or access denied') {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found or access denied',
        });
      }
      console.error('Update delivery error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


  async cancelDelivery(req, res) {
    try {
      const { id } = req.params;
      const deliveryId = parseInt(id);


      if (isNaN(deliveryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery ID',
        });
      }

      const { reason } = req.body;
      const customerId = req.user.id;

      const delivery = await deliveryService.cancelDelivery(
        deliveryId,
        customerId,
        reason
      );


      await prisma.auditLog.create({
        data: {
          userId: customerId,
          deliveryId: delivery.id,
          action: 'CANCEL_DELIVERY',
          description: `Cancelled delivery ${delivery.spoNumber}`,
          reason,
          afterData: delivery,
        },
      });

      res.json({
        success: true,
        message: 'Delivery cancelled successfully',
        data: delivery,
      });
    } catch (error) {
      if (error.message === 'Invalid delivery ID') {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery ID',
        });
      }
      if (error.message === 'Delivery not found or access denied') {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found or access denied',
        });
      }
      console.error('Cancel delivery error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


  async deleteDelivery(req, res) {
    try {
      const { id } = req.params;
      const deliveryId = parseInt(id);

      // Validate delivery ID
      if (isNaN(deliveryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery ID',
        });
      }

      const customerId = req.user.id;

      await deliveryService.deleteDelivery(deliveryId, customerId);

      res.json({
        success: true,
        message: 'Delivery deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Invalid delivery ID') {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery ID',
        });
      }
      if (error.message === 'Delivery not found or access denied') {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found or access denied',
        });
      }
      console.error('Delete delivery error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getStats(req, res) {
    try {
      const customerId = req.user.id;
      const stats = await deliveryService.getCustomerStats(customerId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message,
      });
    }
  }
}

module.exports = new DeliveryController();
