# M19 Logistics Invoice Generation Guide

## Overview

The M19 Logistics system generates weekly invoices for customers based on completed deliveries. Invoices can be generated **manually** or **automatically** for all customers.

---

## Invoice Generation Process

### Step-by-Step Workflow

1. **Customer creates delivery request** → Status: `RECEIVED`
2. **Admin allocates delivery to driver** → Status: `ALLOCATED`
3. **Driver completes delivery with proof** → Status: `DELIVERED`
4. **System generates invoice** (manual or automatic) → Invoice created with auto-incrementing number (T0326+)

---

## Invoice Generation Methods

### Method 1: Manual Generation for Single Customer

**Endpoint:** `POST /api/admin/invoices/generate`

**Use Case:** Generate invoice for a specific customer for a date range

**Request:**
```json
{
  "customerId": 15,
  "weekStartDate": "2026-01-20",
  "weekEndDate": "2026-01-26"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice generated successfully",
  "data": {
    "id": 1,
    "invoiceNumber": "T0327",
    "customerId": 15,
    "invoiceDate": "2026-01-27T10:00:00.000Z",
    "weekStartDate": "2026-01-20T00:00:00.000Z",
    "weekEndDate": "2026-01-26T23:59:59.999Z",
    "subtotal": "225.00",
    "vatTotal": "45.00",
    "grandTotal": "270.00",
    "isPaid": false,
    "paymentTerms": "30 Days (End of Month)",
    "items": [
      {
        "id": 1,
        "deliveryId": 123,
        "description": "Cust. Ref: SPO-2026-001 / 1/20/2026 / 123 Main St",
        "quantity": 1,
        "unitCost": "37.50",
        "vatAmount": "7.50",
        "total": "45.00",
        "isAdditional": false
      }
    ],
    "customer": {
      "fullName": "John Customer",
      "email": "customer@example.com",
      "customerProfile": {
        "loginId": "TOPPS001",
        "storeName": "Topps Tiles Store 1"
      }
    }
  }
}
```

---

### Method 2: Automatic Generation for All Customers (NEW)

**Endpoint:** `POST /api/admin/invoices/generate-all`

**Use Case:** Generate invoices for ALL customers who have completed deliveries in a date range

**Request:**
```json
{
  "weekStartDate": "2026-01-20",
  "weekEndDate": "2026-01-26"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 12 invoices",
  "invoicesGenerated": 12,
  "invoices": [
    {
      "customerId": 15,
      "invoiceNumber": "T0327",
      "deliveryCount": 5,
      "grandTotal": "270.00"
    },
    {
      "customerId": 16,
      "invoiceNumber": "T0328",
      "deliveryCount": 3,
      "grandTotal": "162.00"
    }
  ],
  "errors": []
}
```

---

### Method 3: Auto-Generate Last Week's Invoices (EASIEST)

**Endpoint:** `POST /api/admin/invoices/generate-last-week`

**Use Case:** Automatically calculate last week (Monday-Sunday) and generate invoices

**Request:** No body needed

**Response:**
```json
{
  "success": true,
  "message": "Generated 8 invoices",
  "invoicesGenerated": 8,
  "invoices": [...]
}
```

---

## Invoice Number System

- **Format:** `T0326`, `T0327`, `T0328`, etc.
- **Auto-incrementing:** Each new invoice increments by 1
- **Stored in:** `SystemSetting` table with key `LAST_INVOICE_NUMBER`
- **Starting number:** 326 (T0326)

---

## What Gets Included in Invoices

### 1. Delivery Items
- All deliveries with status `DELIVERED`
- Delivered within the date range
- Not already invoiced (no existing `invoiceItemId`)

### 2. Extra Charges (NEW)
- Congestion charges
- Toll fees
- Parking fees
- Any additional charges added via `POST /admin/deliveries/:id/extra-charges`

### 3. Calculations
```
Delivery Subtotal = Base price calculation (weight blocks × price)
Extra Charges = Sum of all extra charges
Subtotal = Delivery Subtotal + Extra Charges
VAT (20%) = Subtotal × 0.20
Grand Total = Subtotal + VAT
```

---

## Testing the Invoice Process

### Complete Workflow Example

```bash
# 1. Login as Customer
POST /api/auth/login
{
  "email": "customer1@topps.com",
  "password": "Customer123"
}
# Save token as CUSTOMER_TOKEN

# 2. Create Delivery
POST /api/deliveries
Authorization: Bearer CUSTOMER_TOKEN
{
  "deliveryDate": "2026-01-30",
  "timeSlot": "AM",
  "weight": 1200,
  "deliveryAddress": "123 Test St, London",
  "customerName": "John Test",
  "customerPhone": "+447700900000",
  "spoNumber": "SPO-TEST-001",
  "requestedBy": "Manager Test"
}
# Note the delivery ID (e.g., 123)

# 3. Login as Admin
POST /api/auth/login
{
  "email": "admin@m19logistics.com",
  "password": "Admin123"
}
# Save token as ADMIN_TOKEN

# 4. Allocate Delivery to Driver
POST /api/admin/deliveries/123/allocate
Authorization: Bearer ADMIN_TOKEN
{
  "driverId": 14
}

# 5. Login as Driver
POST /api/auth/login
{
  "email": "driver@m19logistics.com",
  "password": "Driver123"
}
# Save token as DRIVER_TOKEN

# 6. Complete Delivery
POST /api/driver/deliveries/123/complete
Authorization: Bearer DRIVER_TOKEN
{
  "receivedBy": "Store Manager",
  "signatureUrl": "/uploads/signatures/sig.jpg",
  "photoUrl": "/uploads/photos/photo.jpg"
}

# 7. (Optional) Add Extra Charge
POST /api/admin/deliveries/123/extra-charges
Authorization: Bearer ADMIN_TOKEN
{
  "description": "Congestion charge",
  "amount": 15.00
}

# 8. Generate Invoice (Option A: Single Customer)
POST /api/admin/invoices/generate
Authorization: Bearer ADMIN_TOKEN
{
  "customerId": 15,
  "weekStartDate": "2026-01-27",
  "weekEndDate": "2026-02-02"
}

# OR 8. Generate Invoice (Option B: All Customers)
POST /api/admin/invoices/generate-all
Authorization: Bearer ADMIN_TOKEN
{
  "weekStartDate": "2026-01-27",
  "weekEndDate": "2026-02-02"
}

# OR 8. Generate Invoice (Option C: Last Week Auto)
POST /api/admin/invoices/generate-last-week
Authorization: Bearer ADMIN_TOKEN

# 9. View Invoices
GET /api/admin/invoices
Authorization: Bearer ADMIN_TOKEN

# OR as Customer
GET /api/invoices
Authorization: Bearer CUSTOMER_TOKEN
```

---

## Why Invoices Weren't Showing

### The Problem
You had completed deliveries but no invoices because:
1. ❌ Invoices are **NOT automatically generated** when deliveries complete
2. ❌ You must **manually trigger** invoice generation
3. ❌ No cron job or scheduled task exists

### The Solution
Now you have **3 options**:

1. **Manual per customer:** `POST /admin/invoices/generate` (original)
2. **Automatic for all:** `POST /admin/invoices/generate-all` ⭐ (NEW)
3. **Last week auto:** `POST /admin/invoices/generate-last-week` ⭐ (EASIEST)

---

## Best Practices

### Weekly Invoice Generation Schedule

**Option 1: Manual Process (Current)**
- Every Monday morning, admin runs: `POST /admin/invoices/generate-last-week`
- This generates invoices for all customers for the previous week (Mon-Sun)

**Option 2: Automated (Future Enhancement)**
- Install `node-cron` package
- Schedule automatic generation every Monday at 1 AM
- Emails sent automatically to customers

### Recommended Workflow
```
Monday 1:00 AM (automated)
↓
Generate invoices for last week (Mon-Sun)
↓
Email invoices to all customers
↓
Customers receive invoices by Monday morning
↓
Payment due within 30 days
```

---

## Future Enhancements

### 1. Automated Scheduling (Cron Job)
```bash
npm install node-cron
```

Create `src/jobs/invoiceScheduler.js`:
```javascript
const cron = require('node-cron');
const invoiceGenerationService = require('../services/invoiceGenerationService');

// Run every Monday at 1 AM
cron.schedule('0 1 * * 1', async () => {
  console.log('Running weekly invoice generation...');
  const { weekStartDate, weekEndDate } = invoiceGenerationService.getLastWeekRange();
  await invoiceGenerationService.generateWeeklyInvoicesForAllCustomers(
    weekStartDate, 
    weekEndDate
  );
});
```

### 2. PDF Generation
- Install `pdfkit` or `puppeteer`
- Generate PDF invoices
- Store in `uploads/invoices/`

### 3. Email Notifications
- Install `nodemailer`
- Send invoice PDFs via email
- Include payment link

### 4. Invoice Editing
- Allow admins to edit invoice items
- Add manual adjustments
- Apply discounts

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/invoices` | GET | Get all invoices (with filters) |
| `/admin/invoices/generate` | POST | Generate invoice for single customer |
| `/admin/invoices/generate-all` | POST | Generate invoices for ALL customers ⭐ |
| `/admin/invoices/generate-last-week` | POST | Auto-generate last week's invoices ⭐ |
| `/admin/invoices/:id/mark-paid` | POST | Mark invoice as paid |
| `/admin/invoices/:id/extra-charge` | POST | Add extra charge to invoice |
| `/invoices` | GET | Customer view their invoices |

---

## Troubleshooting

### "No deliveries to invoice for this period"
- **Cause:** No deliveries with status `DELIVERED` in date range
- **Solution:** Ensure deliveries are marked as DELIVERED first

### "Invoice number not incrementing"
- **Cause:** `LAST_INVOICE_NUMBER` not in SystemSetting table
- **Solution:** Run seed script or manually insert:
```sql
INSERT INTO "SystemSetting" (key, value) VALUES ('LAST_INVOICE_NUMBER', '326');
```

### "Deliveries already invoiced"
- **Cause:** Trying to invoice same deliveries twice
- **Solution:** Each delivery can only be on ONE invoice

---

## Quick Start

**To generate invoices RIGHT NOW:**

```bash
# Login as admin
POST /api/auth/login
{ "email": "admin@m19logistics.com", "password": "Admin123" }

# Generate last week's invoices for ALL customers
POST /api/admin/invoices/generate-last-week
Authorization: Bearer YOUR_ADMIN_TOKEN

# Check invoices
GET /api/admin/invoices
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

**Last Updated:** January 27, 2026
