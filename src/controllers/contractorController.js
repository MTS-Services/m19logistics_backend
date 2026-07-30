const contractorService = require("../services/contractorService");

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await contractorService.getDashboard(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const data = await contractorService.getProfile(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const data = await contractorService.updateProfile(req.user.id, req.body);
    res.json({
      success: true,
      message: "Profile updated successfully",
      data,
    });
  } catch (error) {
    const status = error.message.includes("cannot change") ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getInvoices = async (req, res, next) => {
  try {
    const isAdminOrManager =
      req.user.role === "ADMIN" || req.user.role === "MANAGER";

    const result = isAdminOrManager
      ? await contractorService.getAllInvoices(req.query)
      : await contractorService.getInvoices(req.user.id, req.query);

    res.json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
      count: result.invoices.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const isAdminOrManager =
      req.user.role === "ADMIN" || req.user.role === "MANAGER";

    let data;
    if (isAdminOrManager) {
      const prisma = require("../config/database");
      data = await prisma.contractorInvoice.findUnique({
        where: { id: invoiceId },
        include: {
          contractor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              driverProfile: {
                select: { tradingName: true, payType: true, rate: true },
              },
            },
          },
          items: {
            include: {
              delivery: {
                select: {
                  id: true,
                  spoNumber: true,
                  deliveryAddress: true,
                  customerName: true,
                  deliveredAt: true,
                },
              },
            },
          },
        },
      });
      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Invoice not found" });
      }
    } else {
      data = await contractorService.getInvoiceById(req.user.id, invoiceId);
    }

    res.json({ success: true, data });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

exports.generateInvoice = async (req, res, next) => {
  try {
    const data = await contractorService.generateInvoice(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Contractor invoice generated successfully",
      data,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    const isAdminOrManager =
      req.user.role === "ADMIN" || req.user.role === "MANAGER";

    const data = await contractorService.deleteInvoice(invoiceId, {
      userId: req.user.id,
      isAdminOrManager,
    });

    res.json({
      success: true,
      message: "Contractor invoice deleted successfully",
      data,
    });
  } catch (error) {
    let status = 400;
    if (error.message.includes("not found")) status = 404;
    if (error.message.includes("only delete your own")) status = 403;
    res.status(status).json({ success: false, message: error.message });
  }
};

exports.exportInvoicePDFByNumber = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: "Invoice number is required",
      });
    }

    const isAdminOrManager =
      req.user.role === "ADMIN" || req.user.role === "MANAGER";

    const invoice = await contractorService.getInvoiceByNumber(invoiceNumber, {
      userId: req.user.id,
      isAdminOrManager,
    });

    const exportService = require("../services/exportService");
    const pdfBuffer =
      await exportService.generateContractorInvoicePDFBuffer(invoice);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Contractor-Invoice-${invoice.invoiceNumber}.pdf`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    let status = 500;
    if (error.message.includes("not found")) status = 404;
    if (error.message.includes("only download your own")) status = 403;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to generate contractor invoice PDF",
    });
  }
};

// Admin
exports.adminGetInvoices = async (req, res, next) => {
  try {
    const result = await contractorService.getAllInvoices(req.query);
    res.json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
      count: result.invoices.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.adminMarkPaid = async (req, res, next) => {
  try {
    const data = await contractorService.markInvoicePaid(
      parseInt(req.params.id),
    );
    res.json({
      success: true,
      message: "Contractor invoice marked as paid",
      data,
    });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};
