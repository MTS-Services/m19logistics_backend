# File Export Features - Testing Guide

## Overview
The M19 Logistics system now supports exporting data in multiple formats:
- **Invoice PDF** - Professional PDF invoices
- **Delivery Reports** - Excel (.xlsx) and CSV formats
- **Analytics Reports** - Excel (.xlsx) and CSV formats

---

## API Endpoints

### 1. Export Invoice as PDF

**Endpoint:** `GET /api/admin/invoices/:id/export/pdf`

**Authentication:** Required (Admin/Manager)

**Description:** Downloads invoice as a professionally formatted PDF

**Example:**
```bash
GET http://localhost:3000/api/admin/invoices/1/export/pdf
Authorization: Bearer <admin_token>
```

**Response:** PDF file download (Invoice-T0326.pdf)

**PDF Contents:**
- Company header (M19 Logistics)
- Invoice number, date, due date, status
- Customer billing information
- Itemized delivery list with SPO numbers
- Subtotal, VAT (20%), Grand Total
- Payment terms and notes (if any)

---

### 2. Export Deliveries Report

**Endpoint:** `GET /api/admin/deliveries/export?format=excel|csv`

**Authentication:** Required (Admin/Manager)

**Query Parameters:**
- `format` - Export format (`excel` or `csv`), default: `excel`
- `status` - Filter by status (optional)
- `startDate` - Filter by start date (optional)
- `endDate` - Filter by end date (optional)

**Example (Excel):**
```bash
GET http://localhost:3000/api/admin/deliveries/export?format=excel
Authorization: Bearer <admin_token>
```

**Example (CSV):**
```bash
GET http://localhost:3000/api/admin/deliveries/export?format=csv
Authorization: Bearer <admin_token>
```

**Example (Filtered):**
```bash
GET http://localhost:3000/api/admin/deliveries/export?format=excel&status=DELIVERED&startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>
```

**Response:** Excel or CSV file download (Deliveries-2026-01-31.xlsx or .csv)

**Columns Included:**
- SPO Number
- Delivery Date
- Time Slot
- Status
- Customer Name
- Delivery Address
- Weight (kg)
- Distance (miles)
- Base Price
- Distance Surcharge
- VAT
- Total Price
- Driver Name
- Requested By
- Phone
- Special Instructions
- Created At

**Excel Features:**
- Formatted headers (blue background, white text)
- Auto-filter enabled
- Proper column widths
- Currency formatting for prices

---

### 3. Export Analytics Report

**Endpoint:** `GET /api/admin/analytics/export?format=excel|csv`

**Authentication:** Required (Admin/Manager)

**Query Parameters:**
- `format` - Export format (`excel` or `csv`), default: `excel`
- Date range filters (optional)

**Example (Excel):**
```bash
GET http://localhost:3000/api/admin/analytics/export?format=excel
Authorization: Bearer <admin_token>
```

**Example (CSV):**
```bash
GET http://localhost:3000/api/admin/analytics/export?format=csv
Authorization: Bearer <admin_token>
```

**Response:** Excel or CSV file download (Analytics-2026-01-31.xlsx or .csv)

**Excel Sheets Included:**

**Sheet 1: Overview**
- Total Deliveries
- Completed Deliveries
- Pending Deliveries
- Cancelled Deliveries
- Total Revenue
- Active Drivers
- Active Customers
- Average Delivery Value

**Sheet 2: Deliveries by Status**
- Status breakdown
- Count per status
- Percentage distribution

**Sheet 3: Driver Performance**
- Driver name
- Total deliveries
- Completed count
- Pending count
- Completion rate
- Average rating

**Sheet 4: Customer Analytics**
- Customer name
- Email
- Total deliveries
- Total spent
- Average order value

**CSV Format:**
- Overview section only
- Simplified flat structure

---

## Testing Steps

### Test 1: Export Invoice PDF

1. Login as Admin:
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@m19logistics.com",
  "password": "admin123"
}
```

2. Get invoice ID from invoices list:
```bash
GET http://localhost:3000/api/admin/invoices
Authorization: Bearer <token>
```

3. Export invoice as PDF:
```bash
GET http://localhost:3000/api/admin/invoices/1/export/pdf
Authorization: Bearer <token>
```

4. Verify PDF downloads and opens correctly
5. Check PDF contains all invoice details

---

### Test 2: Export Deliveries (Excel)

1. Export all deliveries as Excel:
```bash
GET http://localhost:3000/api/admin/deliveries/export?format=excel
Authorization: Bearer <admin_token>
```

2. Verify Excel file downloads (Deliveries-YYYY-MM-DD.xlsx)
3. Open in Excel/LibreOffice
4. Check all columns are present
5. Verify header formatting (blue background)
6. Test auto-filter functionality
7. Verify price formatting (£XX.XX)

---

### Test 3: Export Deliveries (CSV)

1. Export as CSV:
```bash
GET http://localhost:3000/api/admin/deliveries/export?format=csv
Authorization: Bearer <admin_token>
```

2. Verify CSV file downloads
3. Open in text editor or Excel
4. Check comma-separated format is correct
5. Verify all data is present

---

### Test 4: Export Filtered Deliveries

1. Export only delivered items from January 2026:
```bash
GET http://localhost:3000/api/admin/deliveries/export?format=excel&status=DELIVERED&startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>
```

2. Verify only filtered records are included
3. Check file naming includes date

---

### Test 5: Export Analytics (Excel)

1. Export analytics as Excel:
```bash
GET http://localhost:3000/api/admin/analytics/export?format=excel
Authorization: Bearer <admin_token>
```

2. Verify Excel file downloads (Analytics-YYYY-MM-DD.xlsx)
3. Open and check multiple sheets:
   - Overview
   - Deliveries by Status
   - Driver Performance
   - Customer Analytics
4. Verify data accuracy
5. Check formatting and calculations

---

### Test 6: Export Analytics (CSV)

1. Export as CSV:
```bash
GET http://localhost:3000/api/admin/analytics/export?format=csv
Authorization: Bearer <admin_token>
```

2. Verify CSV contains overview metrics
3. Check format is readable

---

## Frontend Integration

### Invoice PDF Download Button
```javascript
const downloadInvoicePDF = async (invoiceId) => {
  try {
    const response = await fetch(`/api/admin/invoices/${invoiceId}/export/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
};
```

### Deliveries Excel Export Button
```javascript
const exportDeliveries = async (format = 'excel') => {
  try {
    const response = await fetch(`/api/admin/deliveries/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deliveries-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

### Analytics Excel Export Button
```javascript
const exportAnalytics = async (format = 'excel') => {
  try {
    const response = await fetch(`/api/admin/analytics/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analytics-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

---

## Error Handling

### Invoice Not Found
```json
{
  "success": false,
  "message": "Invoice not found"
}
```

### Invalid Format
- Default format is 'excel' if not specified or invalid

### Authentication Error
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Authorization Error
```json
{
  "success": false,
  "message": "Access denied. Admin or Manager role required."
}
```

---

## File Naming Convention

- **Invoice PDF:** `Invoice-{invoiceNumber}.pdf` (e.g., Invoice-T0326.pdf)
- **Deliveries Excel:** `Deliveries-{YYYY-MM-DD}.xlsx`
- **Deliveries CSV:** `Deliveries-{YYYY-MM-DD}.csv`
- **Analytics Excel:** `Analytics-{YYYY-MM-DD}.xlsx`
- **Analytics CSV:** `Analytics-{YYYY-MM-DD}.csv`

---

## Libraries Used

- **pdfkit** - PDF generation
- **exceljs** - Excel file generation
- **json2csv** - CSV file generation

---

## Notes

1. **Large Datasets:** For very large datasets (>10,000 records), consider implementing pagination or streaming
2. **File Size:** Excel files are typically larger than CSV files
3. **Formatting:** Excel provides better formatting, CSV is simpler and more universal
4. **Browser Compatibility:** Download functionality works in all modern browsers
5. **Memory:** PDF and Excel generation happens in memory - monitor server resources for large exports

---

## Production Recommendations

1. **Caching:** Consider caching frequently requested exports
2. **Background Jobs:** For very large exports, use job queues (Bull, Agenda)
3. **Storage:** Optionally save generated files to S3/cloud storage
4. **Rate Limiting:** Implement rate limiting on export endpoints
5. **Compression:** Enable gzip compression for large files
6. **Monitoring:** Log export requests for analytics
7. **Cleanup:** If storing files temporarily, implement automatic cleanup

---

## Success!

All export features are now fully implemented and ready for testing! 🎉
