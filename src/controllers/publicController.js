const contactService = require('../services/contactService');
const enquiryService = require('../services/enquiryService');
const prisma = require('../config/database');

// ==================== SLOT AVAILABILITY ====================

exports.getSlotAvailability = async (req, res, next) => {
  try {
    let { date } = req.query;

    // If date is provided, return single date slots
    if (date) {
      const targetDate = new Date(date);

      const slots = await prisma.slotAvailability.findMany({
        where: {
          date: targetDate
        },
        orderBy: { timeSlot: 'asc' }
      });

      const availability = {
        date,
        slots: {
          AM: {
            available: false,
            maxCapacity: 0,
            booked: 0,
            remaining: 0
          },
          PM: {
            available: false,
            maxCapacity: 0,
            booked: 0,
            remaining: 0
          }
        }
      };

      slots.forEach(slot => {
        if (slot.timeSlot === 'AM' || slot.timeSlot === 'PM') {
          const remaining = slot.maxCapacity - slot.booked;
          availability.slots[slot.timeSlot] = {
            available: !slot.isFull && remaining > 0,
            maxCapacity: slot.maxCapacity,
            booked: slot.booked,
            remaining: remaining
          };
        }
      });

      return res.json({
        success: true,
        data: availability
      });
    }

    // If no date provided, return all upcoming slots (from today onwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    const slots = await prisma.slotAvailability.findMany({
      where: {
        date: {
          gte: today
        }
      },
      orderBy: [
        { date: 'asc' },
        { timeSlot: 'asc' }
      ]
    });

    // Group slots by date
    const slotsByDate = {};

    slots.forEach(slot => {
      const dateKey = slot.date.toISOString().split('T')[0];

      // Skip dates before today
      if (dateKey < todayString) {
        return;
      }

      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = {
          date: dateKey,
          slots: {
            AM: {
              available: false,
              maxCapacity: 0,
              booked: 0,
              remaining: 0
            },
            PM: {
              available: false,
              maxCapacity: 0,
              booked: 0,
              remaining: 0
            }
          }
        };
      }

      if (slot.timeSlot === 'AM' || slot.timeSlot === 'PM') {
        const remaining = slot.maxCapacity - slot.booked;
        slotsByDate[dateKey].slots[slot.timeSlot] = {
          available: !slot.isFull && remaining > 0,
          maxCapacity: slot.maxCapacity,
          booked: slot.booked,
          remaining: remaining
        };
      }
    });

    // Convert to array
    const availabilityArray = Object.values(slotsByDate);

    res.json({
      success: true,
      count: availabilityArray.length,
      data: availabilityArray
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CONTACT FORM ====================

exports.submitContact = async (req, res, next) => {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const contact = await contactService.createContact(req.body);

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us. We will get back to you soon.',
      data: {
        id: contact.id,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.submitEnquiry = async (req, res, next) => {
  try {

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const enquiry = await enquiryService.createEnquiry(req.body);

    res.status(201).json({
      success: true,
      message: 'Thank you for your enquiry. We will respond shortly.',
      data: {
        id: enquiry.id,
        createdAt: enquiry.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};