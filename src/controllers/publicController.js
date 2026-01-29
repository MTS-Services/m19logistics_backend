const contactService = require('../services/contactService');
const enquiryService = require('../services/enquiryService');
const prisma = require('../config/database');

// ==================== SLOT AVAILABILITY ====================

exports.getSlotAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required (format: YYYY-MM-DD)'
      });
    }
    
    // Parse date
    const targetDate = new Date(date);
    
    // Get slot availability for the date
    const slots = await prisma.slotAvailability.findMany({
      where: { 
        date: targetDate
      },
      orderBy: { timeSlot: 'asc' }
    });
    
    // Format response
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
    
    // Populate with actual slot data
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
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CONTACT FORM ====================

exports.submitContact = async (req, res, next) => {
  try {
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

// ==================== ENQUIRY FORM ====================

exports.submitEnquiry = async (req, res, next) => {
  try {
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