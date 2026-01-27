const invoiceService = require('../services/invoiceService');

class InvoiceController {
  /**
   * Get all invoices for customer
   * GET /api/invoices
   */
  async getMyInvoices(req, res) {
    try {
      const customerId = req.user.id;
      const { startDate, endDate, isPaid } = req.query;

      const invoices = await invoiceService.getCustomerInvoices(customerId, {
        startDate,
        endDate,
        isPaid,
      });

      res.json({
        success: true,
        data: invoices,
        count: invoices.length,
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoices',
        error: error.message,
      });
    }
  }

  /**
   * Get invoice by ID
   * GET /api/invoices/:id
   */
  async getInvoiceById(req, res) {
    try {
      const { id } = req.params;
      const customerId = req.user.role === 'CUSTOMER' ? req.user.id : null;

      const invoice = await invoiceService.getInvoiceById(
        parseInt(id),
        customerId
      );

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
      console.error('Get invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoice',
        error: error.message,
      });
    }
  }

  /**
   * Get invoice by number
   * GET /api/invoices/number/:invoiceNumber
   */
  async getInvoiceByNumber(req, res) {
    try {
      const { invoiceNumber } = req.params;
      const customerId = req.user.role === 'CUSTOMER' ? req.user.id : null;

      const invoice = await invoiceService.getInvoiceByNumber(
        invoiceNumber,
        customerId
      );

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
      console.error('Get invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoice',
        error: error.message,
      });
    }
  }
}

module.exports = new InvoiceController();
