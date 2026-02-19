const invoiceService = require('../services/invoiceService');

class InvoiceController {
  /**
   * Get all invoices for customer
   * GET /api/invoices
   */
  async getMyInvoices(req, res) {
    try {
      const customerId = req.user.id;
      const { startDate, endDate, isPaid, search } = req.query;

      const invoices = await invoiceService.getCustomerInvoices(customerId, {
        startDate,
        endDate,
        isPaid,
        search,
      });

      // Calculate summary statistics
      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);
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
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          totalPaid: parseFloat(totalPaid.toFixed(2)),
          totalUnpaid: parseFloat(totalUnpaid.toFixed(2)),
        },
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
      const invoiceId = parseInt(id);

      // Validate invoice ID
      if (isNaN(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid invoice ID',
        });
      }

      const customerId = req.user.role === 'CUSTOMER' ? req.user.id : null;

      const invoice = await invoiceService.getInvoiceById(
        invoiceId,
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
