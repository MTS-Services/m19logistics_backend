const contactService = require('../services/contactService');
const enquiryService = require('../services/enquiryService');

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