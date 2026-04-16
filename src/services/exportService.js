const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { Parser } = require("json2csv");
const prisma = require("../config/database");

class ExportService {
  generateInvoicePDF(invoice, bankingDetails = null, companyInfo = null) {
    const doc = new PDFDocument({ margin: 50 });

    // Company Header — use DB values, fall back to defaults
    const companyName = companyInfo?.name || "M19 Logistics";
    const companyAddress = companyInfo?.address || "Wrexham, United Kingdom";
    const companyPhone = companyInfo?.primaryPhone || "07818077110";
    const companyEmail = companyInfo?.email || "invoices@m19logistics.com";

    doc
      .fontSize(20)
      .text(companyName, 50, 50)
      .fontSize(10)
      .text(`Address: ${companyAddress}`, 50, 75)
      .text(`Phone: ${companyPhone}`, 50, 90)
      .text(`Email: ${companyEmail}`, 50, 105)
      .moveDown();

    // Invoice Title
    doc.fontSize(24).text("INVOICE", 400, 50);

    const topY = 160;
    doc
      .fontSize(10)
      .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, topY)
      .text(
        `Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString("en-GB")}`,
        50,
        topY + 15,
      )
      .text(`Status: ${invoice.isPaid ? "PAID" : "UNPAID"}`, 50, topY + 30);

    // Customer Details
    doc
      .text("Bill To:", 350, topY)
      .text(invoice.customer.fullName, 350, topY + 15)
      .text(invoice.customer.email, 350, topY + 30)
      .text(invoice.customer.phone || "", 350, topY + 45);

    if (invoice.customerRef) {
      doc.text(`Customer Ref: ${invoice.customerRef}`, 50, topY + 60);
    }

    const tableTop = topY + 100;
    const col1X = 50;
    const col1W = 80;
    const col2X = 135;
    const col2W = 62;
    const col3X = 202;
    const col3W = 200;
    const col4X = 407;
    const col4W = 22;
    const col5X = 434;
    const col5W = 58;
    const col6X = 498;
    const col6W = 57;
    const rowHeight = 32;

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("SPO", col1X, tableTop, { width: col1W, lineBreak: false })
      .text("Date", col2X, tableTop, { width: col2W, lineBreak: false })
      .text("Description", col3X, tableTop, { width: col3W, lineBreak: false })
      .text("Qty", col4X, tableTop, { width: col4W, lineBreak: false })
      .text("Unit Price", col5X, tableTop, { width: col5W, lineBreak: false })
      .text("Total", col6X, tableTop, { width: col6W, lineBreak: false });

    doc
      .moveTo(col1X, tableTop + 14)
      .lineTo(555, tableTop + 14)
      .stroke();

    // Table Items
    doc.font("Helvetica");
    let itemY = tableTop + 22;

    invoice.items.forEach((item) => {
      if (itemY > 700) {
        doc.addPage();
        itemY = 50;
      }

      const spoNumber = item.delivery?.spoNumber || item.spoNumber || "N/A";
      const deliveryDate = item.deliveryDate
        ? new Date(item.deliveryDate).toLocaleDateString("en-GB")
        : item.delivery?.deliveryDate
          ? new Date(item.delivery.deliveryDate).toLocaleDateString("en-GB")
          : "N/A";
      const description = item.description || "Delivery Service";
      const qty = String(item.quantity || 1);
      const unitCost = `£${(item.unitCost || 0).toFixed(2)}`;
      const total = `£${(item.total || 0).toFixed(2)}`;

      doc
        .fontSize(9)

        .text(spoNumber, col1X, itemY, {
          width: col1W,
          height: 14,
          lineBreak: false,
          ellipsis: true,
        })
        .text(deliveryDate, col2X, itemY, {
          width: col2W,
          height: 14,
          lineBreak: false,
          ellipsis: true,
        })
        .text(description, col3X, itemY, {
          width: col3W,
          height: 26,
          lineBreak: true,
        })
        .text(qty, col4X, itemY, { width: col4W, lineBreak: false })
        .text(unitCost, col5X, itemY, { width: col5W, lineBreak: false })
        .text(total, col6X, itemY, { width: col6W, lineBreak: false });

      itemY += rowHeight;
    });

    const summaryY = itemY + 20;
    doc
      .moveTo(400, summaryY - 10)
      .lineTo(560, summaryY - 10)
      .stroke();

    doc
      .fontSize(10)
      .text("Subtotal:", 400, summaryY)
      .text(`£${parseFloat(invoice.subtotal || 0).toFixed(2)}`, 500, summaryY, {
        align: "right",
      });

    doc
      .text("VAT (20%):", 400, summaryY + 20)
      .text(
        `£${parseFloat(invoice.vatTotal || 0).toFixed(2)}`,
        500,
        summaryY + 20,
        {
          align: "right",
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Total:", 400, summaryY + 40)
      .text(
        `£${parseFloat(invoice.grandTotal || 0).toFixed(2)}`,
        500,
        summaryY + 40,
        {
          align: "right",
        },
      );

    let bankSectionY = summaryY + 70;

    if (bankingDetails) {
      doc.moveTo(50, bankSectionY).lineTo(560, bankSectionY).stroke();

      bankSectionY += 12;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Bank Details", 50, bankSectionY);

      if (bankingDetails.paymentTerms) {
        doc.text("Payment Terms", 350, bankSectionY);
      }

      bankSectionY += 16;

      doc.font("Helvetica").fontSize(9);

      if (bankingDetails.bankName) {
        doc.text(`Bank: ${bankingDetails.bankName}`, 50, bankSectionY);
        bankSectionY += 14;
      }
      if (bankingDetails.accountHolder) {
        doc.text(
          `Account Holder: ${bankingDetails.accountHolder}`,
          50,
          bankSectionY,
        );
        bankSectionY += 14;
      }
      if (bankingDetails.sortCode) {
        doc.text(`Sort Code: ${bankingDetails.sortCode}`, 50, bankSectionY);
        bankSectionY += 14;
      }
      if (bankingDetails.accountNumber) {
        doc.text(
          `Account Number: ${bankingDetails.accountNumber}`,
          50,
          bankSectionY,
        );
        bankSectionY += 14;
      }

      if (bankingDetails.paymentTerms) {
        doc.text(
          bankingDetails.paymentTerms,
          350,
          bankSectionY -
            14 *
              [
                bankingDetails.bankName,
                bankingDetails.accountHolder,
                bankingDetails.sortCode,
                bankingDetails.accountNumber,
              ].filter(Boolean).length,
          { width: 200 },
        );
      }

      bankSectionY += 10;

      doc.moveTo(50, bankSectionY).lineTo(560, bankSectionY).stroke();

      bankSectionY += 14;
    }

    // Payment terms from invoice (if not already shown in bank details)
    let footerY = bankSectionY;

    if (!bankingDetails && (invoice.paymentTerms || invoice.notes)) {
      doc.fontSize(10).font("Helvetica");
      let notesY = bankSectionY;

      if (invoice.paymentTerms) {
        doc.text("Payment Terms:", 50, notesY);
        doc.text(invoice.paymentTerms, 50, notesY + 15, { width: 500 });
        notesY += 50;
      }

      if (invoice.notes) {
        doc.text("Notes:", 50, notesY);
        doc.text(invoice.notes, 50, notesY + 15, { width: 500 });
        notesY += 35;
      }

      footerY = notesY;
    } else if (bankingDetails && invoice.notes) {
      doc.fontSize(10).font("Helvetica");
      doc.text("Notes:", 50, bankSectionY);
      doc.text(invoice.notes, 50, bankSectionY + 15, { width: 500 });
      footerY = bankSectionY + 50;
    }

    // Footer — rendered 20px below the last content section
    doc.fontSize(8).text("Thank you for your business!", 50, footerY + 20, {
      align: "center",
      width: 500,
    });

    doc.end();
    return doc;
  }

  async generateDeliveriesExcel(deliveries) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Deliveries");

    worksheet.columns = [
      { header: "SPO Number", key: "spoNumber", width: 15 },
      { header: "Delivery Date", key: "deliveryDate", width: 15 },
      { header: "Time Slot", key: "timeSlot", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Customer", key: "customerName", width: 20 },
      { header: "Delivery Address", key: "deliveryAddress", width: 40 },
      { header: "Weight (kg)", key: "weight", width: 12 },
      { header: "Distance (miles)", key: "distance", width: 15 },
      { header: "Base Price", key: "basePrice", width: 12 },
      { header: "Distance Surcharge", key: "distanceSurcharge", width: 18 },
      { header: "VAT", key: "vat", width: 10 },
      { header: "Total Price", key: "totalPrice", width: 12 },
      { header: "Driver", key: "driverName", width: 20 },
      { header: "Requested By", key: "requestedBy", width: 20 },
      { header: "Phone", key: "customerPhone", width: 15 },
      { header: "Special Instructions", key: "specialInstructions", width: 30 },
      { header: "Created At", key: "createdAt", width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add data rows
    deliveries.forEach((delivery) => {
      worksheet.addRow({
        spoNumber: delivery.spoNumber,
        deliveryDate: delivery.deliveryDate
          ? new Date(delivery.deliveryDate).toLocaleDateString()
          : "",
        timeSlot: delivery.timeSlot,
        status: delivery.status,
        customerName: delivery.customerName,
        deliveryAddress: delivery.deliveryAddress,
        weight: delivery.weight,
        distance: delivery.distance || 0,
        basePrice: delivery.basePrice
          ? `£${delivery.basePrice.toFixed(2)}`
          : "",
        distanceSurcharge: delivery.distanceSurcharge
          ? `£${delivery.distanceSurcharge.toFixed(2)}`
          : "",
        vat: delivery.vat ? `£${delivery.vat.toFixed(2)}` : "",
        totalPrice: delivery.totalPrice
          ? `£${delivery.totalPrice.toFixed(2)}`
          : "",
        driverName: delivery.driver?.fullName || "Not Assigned",
        requestedBy: delivery.requestedBy,
        customerPhone: delivery.customerPhone,
        specialInstructions: delivery.specialInstructions || "",
        createdAt: new Date(delivery.createdAt).toLocaleString(),
      });
    });

    worksheet.autoFilter = {
      from: "A1",
      to: "Q1",
    };

    return await workbook.xlsx.writeBuffer();
  }

  generateDeliveriesCSV(deliveries) {
    const fields = [
      { label: "SPO Number", value: "spoNumber" },
      {
        label: "Delivery Date",
        value: (row) =>
          row.deliveryDate
            ? new Date(row.deliveryDate).toLocaleDateString()
            : "",
      },
      { label: "Time Slot", value: "timeSlot" },
      { label: "Status", value: "status" },
      { label: "Customer", value: "customerName" },
      { label: "Delivery Address", value: "deliveryAddress" },
      { label: "Weight (kg)", value: "weight" },
      { label: "Distance (miles)", value: "distance" },
      {
        label: "Base Price",
        value: (row) => (row.basePrice ? `£${row.basePrice.toFixed(2)}` : ""),
      },
      {
        label: "Distance Surcharge",
        value: (row) =>
          row.distanceSurcharge ? `£${row.distanceSurcharge.toFixed(2)}` : "",
      },
      {
        label: "VAT",
        value: (row) => (row.vat ? `£${row.vat.toFixed(2)}` : ""),
      },
      {
        label: "Total Price",
        value: (row) => (row.totalPrice ? `£${row.totalPrice.toFixed(2)}` : ""),
      },
      {
        label: "Driver",
        value: (row) => row.driver?.fullName || "Not Assigned",
      },
      { label: "Requested By", value: "requestedBy" },
      { label: "Phone", value: "customerPhone" },
      { label: "Special Instructions", value: "specialInstructions" },
      {
        label: "Created At",
        value: (row) => new Date(row.createdAt).toLocaleString(),
      },
    ];

    const parser = new Parser({ fields });
    return parser.parse(deliveries);
  }

  async generateAnalyticsExcel(analyticsData) {
    const workbook = new ExcelJS.Workbook();

    // Overview Sheet
    const overviewSheet = workbook.addWorksheet("Overview");
    overviewSheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 20 },
    ];

    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    overviewSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    const summary = analyticsData.summary || {};
    const statusData = analyticsData.deliveriesByStatus || {};

    overviewSheet.addRow({
      metric: "Total Deliveries",
      value: summary.totalDeliveries || 0,
    });
    overviewSheet.addRow({
      metric: "Completed Deliveries",
      value: statusData.delivered || 0,
    });
    overviewSheet.addRow({
      metric: "Pending Deliveries",
      value: (statusData.received || 0) + (statusData.allocated || 0),
    });
    overviewSheet.addRow({
      metric: "Cancelled Deliveries",
      value: statusData.cancelled || 0,
    });
    overviewSheet.addRow({
      metric: "Total Revenue",
      value: `£${(summary.totalRevenue || 0).toFixed(2)}`,
    });
    overviewSheet.addRow({
      metric: "Total Invoices",
      value: summary.totalInvoices || 0,
    });
    overviewSheet.addRow({
      metric: "Paid Invoices",
      value: summary.paidInvoices || 0,
    });
    overviewSheet.addRow({
      metric: "Unpaid Invoices",
      value: summary.unpaidInvoices || 0,
    });
    overviewSheet.addRow({
      metric: "Active Drivers",
      value: summary.activeDrivers || 0,
    });
    overviewSheet.addRow({
      metric: "Active Customers",
      value: summary.activeCustomers || 0,
    });

    if (Object.keys(statusData).length > 0) {
      const statusSheet = workbook.addWorksheet("Deliveries by Status");
      statusSheet.columns = [
        { header: "Status", key: "status", width: 20 },
        { header: "Count", key: "count", width: 15 },
        { header: "Percentage", key: "percentage", width: 15 },
      ];

      statusSheet.getRow(1).font = { bold: true };
      statusSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      statusSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

      const totalDeliveries = summary.totalDeliveries || 1;
      Object.entries(statusData).forEach(([status, count]) => {
        statusSheet.addRow({
          status: status.toUpperCase(),
          count: count,
          percentage: `${((count / totalDeliveries) * 100).toFixed(2)}%`,
        });
      });
    }

    // Driver Performance Sheet
    if (
      analyticsData.driverPerformance &&
      analyticsData.driverPerformance.length > 0
    ) {
      const driverSheet = workbook.addWorksheet("Driver Performance");
      driverSheet.columns = [
        { header: "Driver Name", key: "name", width: 25 },
        { header: "Total Deliveries", key: "totalDeliveries", width: 18 },
        { header: "Completed", key: "completed", width: 15 },
        { header: "Pending", key: "pending", width: 15 },
        { header: "Completion Rate", key: "completionRate", width: 18 },
        { header: "Average Rating", key: "avgRating", width: 15 },
      ];

      driverSheet.getRow(1).font = { bold: true };
      driverSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      driverSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

      analyticsData.driverPerformance.forEach((driver) => {
        driverSheet.addRow({
          name: driver.driverName || driver.name,
          totalDeliveries: driver.totalDeliveries || 0,
          completed: driver.completedDeliveries || driver.completed || 0,
          pending: driver.pendingDeliveries || driver.pending || 0,
          completionRate: `${((driver.completionRate || 0) * 100).toFixed(2)}%`,
          avgRating: driver.averageRating || driver.avgRating || "N/A",
        });
      });
    }

    if (
      analyticsData.customerAnalytics &&
      analyticsData.customerAnalytics.length > 0
    ) {
      const customerSheet = workbook.addWorksheet("Customer Analytics");
      customerSheet.columns = [
        { header: "Customer Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Total Deliveries", key: "totalDeliveries", width: 18 },
        { header: "Total Spent", key: "totalSpent", width: 15 },
        { header: "Average Order Value", key: "avgOrderValue", width: 20 },
      ];

      customerSheet.getRow(1).font = { bold: true };
      customerSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      customerSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };

      analyticsData.customerAnalytics.forEach((customer) => {
        customerSheet.addRow({
          name: customer.customerName || customer.name,
          email: customer.email || "",
          totalDeliveries: customer.totalDeliveries || 0,
          totalSpent: `£${(customer.totalSpent || 0).toFixed(2)}`,
          avgOrderValue: `£${(customer.avgOrderValue || 0).toFixed(2)}`,
        });
      });
    }

    return await workbook.xlsx.writeBuffer();
  }

  generateAnalyticsCSV(analyticsData) {
    const summary = analyticsData.summary || {};
    const statusData = analyticsData.deliveriesByStatus || {};

    const data = [
      {
        section: "Overview",
        metric: "Total Deliveries",
        value: summary.totalDeliveries || 0,
      },
      {
        section: "Overview",
        metric: "Completed Deliveries",
        value: statusData.delivered || 0,
      },
      {
        section: "Overview",
        metric: "Pending Deliveries",
        value: (statusData.received || 0) + (statusData.allocated || 0),
      },
      {
        section: "Overview",
        metric: "Cancelled Deliveries",
        value: statusData.cancelled || 0,
      },
      {
        section: "Overview",
        metric: "Total Revenue",
        value: `£${(summary.totalRevenue || 0).toFixed(2)}`,
      },
      {
        section: "Overview",
        metric: "Total Invoices",
        value: summary.totalInvoices || 0,
      },
      {
        section: "Overview",
        metric: "Paid Invoices",
        value: summary.paidInvoices || 0,
      },
      {
        section: "Overview",
        metric: "Unpaid Invoices",
        value: summary.unpaidInvoices || 0,
      },
      {
        section: "Overview",
        metric: "Active Drivers",
        value: summary.activeDrivers || 0,
      },
      {
        section: "Overview",
        metric: "Active Customers",
        value: summary.activeCustomers || 0,
      },
    ];

    const fields = [
      { label: "Section", value: "section" },
      { label: "Metric", value: "metric" },
      { label: "Value", value: "value" },
    ];

    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  async generateInvoicePDFBuffer(invoice) {
    const [bankingDetails, companyInfo] = await Promise.all([
      prisma.bankingDetails.findFirst(),
      prisma.companyInformation.findFirst(),
    ]);
    return new Promise((resolve, reject) => {
      const chunks = [];
      const doc = this.generateInvoicePDF(invoice, bankingDetails, companyInfo);
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
  }
}

module.exports = new ExportService();
