# Invoice Edit API - Single Endpoint

Complete guide for the unified invoice editing endpoint.

## Endpoint

**PUT** `/admin/invoices/:id`

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

## What You Can Update

This single endpoint can update **all invoice fields** including:

### 1. Invoice Metadata
- `invoiceNumber` - Invoice number (format: T####)
- `customerId` - Change customer
- `invoiceDate` - Invoice date
- `dueDate` - Payment due date
- `status` - Invoice status (Draft, Sent, Paid, Overdue, etc.)
- `customerRef` - Customer reference/PO number
- `notes` - Internal notes
- `paymentTerms` - Payment terms

### 2. Delivery Entries (Items)
- `items` - Array of all delivery entries
  - Each item can include:
    - `deliveryId` - Link to existing delivery (optional)
    - `spoNumber` - SPO reference number
    - `description` - Delivery description
    - `quantity` - Quantity (default: 1)
    - `unitCost` - Base price
    - `vatAmount` - VAT amount
    - `total` - Total (unitCost * quantity + vatAmount)
    - `deliveryDate` - Delivery date (optional)
    - `address` - Delivery address (optional)
    - `basePrice` - Base price (alternative to unitCost)
    - `distanceSurcharge` - Distance surcharge (optional)
    - `isAdditional` - Mark as manual/extra charge

## Example 1: Update Basic Invoice Fields

Matching your UI form with Invoice Number, Customer, Dates, and Status:

```json
PUT /admin/invoices/15

{
  "invoiceNumber": "T0327",
  "customerId": 8,
  "invoiceDate": "2026-01-08",
  "dueDate": "2026-02-08",
  "status": "Sent",
  "customerRef": "PO-12345",
  "notes": "Customer requested email delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice updated successfully",
  "data": {
    "id": 15,
    "invoiceNumber": "T0327",
    "customerId": 8,
    "invoiceDate": "2026-01-08T00:00:00.000Z",
    "dueDate": "2026-02-08T00:00:00.000Z",
    "status": "Sent",
    "customerRef": "PO-12345",
    "subtotal": "225.00",
    "vatTotal": "45.00",
    "grandTotal": "270.00"
  }
}
```

## Example 2: Update Invoice with Delivery Entries

Complete form submission matching your UI (Invoice + Delivery Entries):

```json
PUT /admin/invoices/15

{
  "invoiceNumber": "T0327",
  "customerId": 8,
  "invoiceDate": "2026-01-08",
  "dueDate": "2026-02-08",
  "status": "Sent",
  "items": [
    {
      "deliveryId": 101,
      "spoNumber": "SP0013351",
      "description": "Delivery to 4 Bumpers Lane, Sealand Ind Est, Chester",
      "quantity": 1,
      "unitCost": 37.50,
      "vatAmount": 7.50,
      "total": 45.00,
      "deliveryDate": "2026-01-04",
      "address": "4 Bumpers Lane, Sealand Ind Est, Chester",
      "basePrice": 37.5,
      "distanceSurcharge": 18.75
    },
    {
      "deliveryId": 102,
      "spoNumber": "SP0013352",
      "description": "Delivery to Birmingham",
      "quantity": 1,
      "unitCost": 45.00,
      "vatAmount": 9.00,
      "total": 54.00,
      "deliveryDate": "2026-01-05",
      "address": "123 Birmingham Road, B1 1AA"
    }
  ]
}
```

**What happens:**
1. Invoice metadata is updated (number, customer, dates, status)
2. All existing items are deleted
3. New items from the request are created
4. Totals are recalculated automatically
   - Subtotal: £37.50 + £45.00 = £82.50
   - VAT Total: £7.50 + £9.00 = £16.50
   - Grand Total: £99.00

**Response:**
```json
{
  "success": true,
  "message": "Invoice updated successfully",
  "data": {
    "id": 15,
    "invoiceNumber": "T0327",
    "customerId": 8,
    "invoiceDate": "2026-01-08T00:00:00.000Z",
    "dueDate": "2026-02-08T00:00:00.000Z",
    "status": "Sent",
    "subtotal": "82.50",
    "vatTotal": "16.50",
    "grandTotal": "99.00",
    "items": [
      {
        "id": 201,
        "spoNumber": "SP0013351",
        "description": "Delivery to 4 Bumpers Lane, Sealand Ind Est, Chester",
        "unitCost": "37.50",
        "total": "45.00",
        "delivery": {
          "deliveryAddress": "4 Bumpers Lane, Sealand Ind Est, Chester"
        }
      },
      {
        "id": 202,
        "spoNumber": "SP0013352",
        "description": "Delivery to Birmingham",
        "unitCost": "45.00",
        "total": "54.00"
      }
    ]
  }
}
```

## Example 3: Only Update Invoice Number and Status

```json
PUT /admin/invoices/15

{
  "invoiceNumber": "T0999",
  "status": "Paid"
}
```

## Example 4: Add New Delivery Entry

To add a delivery entry without removing existing ones:

1. First, get current invoice with items:
```json
GET /admin/invoices/15
```

2. Then send PUT with all items (existing + new):
```json
PUT /admin/invoices/15

{
  "items": [
    // Existing items (from GET response)
    {
      "deliveryId": 101,
      "spoNumber": "SP0013351",
      "description": "Existing delivery",
      "quantity": 1,
      "unitCost": 37.50,
      "vatAmount": 7.50,
      "total": 45.00
    },
    // New item to add
    {
      "spoNumber": "SP0013355",
      "description": "New delivery to Manchester",
      "quantity": 1,
      "unitCost": 50.00,
      "vatAmount": 10.00,
      "total": 60.00,
      "isAdditional": false
    }
  ]
}
```

## Example 5: Remove a Delivery Entry

Send PUT with only the items you want to keep:

```json
PUT /admin/invoices/15

{
  "items": [
    {
      "deliveryId": 101,
      "spoNumber": "SP0013351",
      "description": "Keep this one",
      "quantity": 1,
      "unitCost": 37.50,
      "vatAmount": 7.50,
      "total": 45.00
    }
    // Item #102 is not included, so it will be removed
  ]
}
```

## Example 6: Update Delivery Entry Pricing

```json
PUT /admin/invoices/15

{
  "items": [
    {
      "deliveryId": 101,
      "spoNumber": "SP0013351",
      "description": "Delivery with discount",
      "quantity": 1,
      "unitCost": 30.00,  // Reduced from 37.50
      "vatAmount": 6.00,  // Reduced from 7.50
      "total": 36.00      // Reduced from 45.00
    }
  ]
}
```

## Example 7: Add Manual Extra Charge

```json
PUT /admin/invoices/15

{
  "items": [
    // Include all existing delivery items here
    {
      "deliveryId": 101,
      "spoNumber": "SP0013351",
      "description": "Regular delivery",
      "quantity": 1,
      "unitCost": 37.50,
      "vatAmount": 7.50,
      "total": 45.00
    },
    // Add manual charge (no deliveryId)
    {
      "spoNumber": "MANUAL-001",
      "description": "Weekend delivery surcharge",
      "quantity": 1,
      "unitCost": 25.00,
      "vatAmount": 5.00,
      "total": 30.00,
      "isAdditional": true
    }
  ]
}
```

## Frontend Form Submission Example

When the user clicks "Save Changes" in your form:

```javascript
// Collect form data
const formData = {
  invoiceNumber: document.getElementById('invoiceNumber').value, // "T0327"
  customerId: parseInt(document.getElementById('customer').value), // 8
  invoiceDate: document.getElementById('invoiceDate').value, // "2026-01-08"
  dueDate: document.getElementById('dueDate').value, // "2026-02-08"
  status: document.getElementById('status').value, // "Sent"
  
  // Collect all delivery entries from the form
  items: deliveryEntries.map(entry => ({
    deliveryId: entry.deliveryId,
    spoNumber: entry.spoNumber,
    description: entry.description || entry.address,
    quantity: 1,
    unitCost: parseFloat(entry.basePrice),
    vatAmount: parseFloat(entry.basePrice) * 0.20, // 20% VAT
    total: parseFloat(entry.basePrice) + parseFloat(entry.distanceSurcharge || 0) + (parseFloat(entry.basePrice) * 0.20),
    deliveryDate: entry.date,
    address: entry.address,
    basePrice: parseFloat(entry.basePrice),
    distanceSurcharge: parseFloat(entry.distanceSurcharge || 0)
  }))
};

// Submit to API
fetch(`/api/admin/invoices/${invoiceId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(formData)
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    alert('Invoice updated successfully!');
    // Refresh invoice view or redirect
  }
});
```

## Important Notes

### 1. Items Array Behavior
- If you send `items` array, **all existing items are replaced**
- If you **omit** `items` from request, existing items are **not changed**
- To keep existing items, include them in the `items` array

### 2. Automatic Recalculation
When `items` array is provided:
- Subtotal = Sum of (quantity × unitCost)
- VAT Total = Sum of vatAmount
- Grand Total = Sum of total

### 3. Paid Invoice Protection
- Cannot edit invoices where `isPaid = true`
- Error: "Cannot edit a paid invoice. Contact finance team for adjustments."
- To allow editing (dangerous): send `"allowEditPaid": true` in request

### 4. Invoice Number Validation
- Must match format: `T####` (e.g., T0326, T0999)
- Must be unique across all invoices
- Error if duplicate: "Invoice number T0999 already exists"

## Validation Rules

| Field | Rules |
|-------|-------|
| invoiceNumber | Optional, format T####, unique |
| customerId | Optional, integer |
| invoiceDate | Optional, ISO8601 date |
| dueDate | Optional, ISO8601 date |
| status | Optional, string |
| customerRef | Optional, string |
| notes | Optional, string |
| paymentTerms | Optional, string |
| items | Optional, array |
| items.*.description | Required if items provided |
| items.*.quantity | Integer, min 1 |
| items.*.unitCost | Float, min 0 |
| items.*.vatAmount | Float, min 0 |
| items.*.total | Float, min 0 |

## Error Responses

### Invoice Not Found
```json
{
  "success": false,
  "message": "Invoice not found"
}
```

### Paid Invoice
```json
{
  "success": false,
  "message": "Cannot edit a paid invoice. Contact finance team for adjustments."
}
```

### Duplicate Invoice Number
```json
{
  "success": false,
  "message": "Invoice number T0999 already exists"
}
```

### Validation Error
```json
{
  "success": false,
  "errors": [
    {
      "field": "invoiceNumber",
      "message": "Invoice number must be in format T#### (e.g., T0326)"
    }
  ]
}
```

## Testing in Postman

### 1. Get Invoice First
```
GET http://localhost:3000/api/admin/invoices/15
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### 2. Update Invoice
```
PUT http://localhost:3000/api/admin/invoices/15
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "invoiceNumber": "T0327",
  "customerId": 8,
  "invoiceDate": "2026-01-08",
  "dueDate": "2026-02-08",
  "status": "Sent",
  "items": [
    {
      "deliveryId": 101,
      "spoNumber": "SP0013351",
      "description": "Delivery to Chester",
      "quantity": 1,
      "unitCost": 37.50,
      "vatAmount": 7.50,
      "total": 45.00
    }
  ]
}
```

## Quick Reference

| Action | Request |
|--------|---------|
| Update invoice number only | `{ "invoiceNumber": "T0999" }` |
| Update status only | `{ "status": "Sent" }` |
| Update customer | `{ "customerId": 10 }` |
| Update dates | `{ "invoiceDate": "2026-01-08", "dueDate": "2026-02-08" }` |
| Replace all items | `{ "items": [...] }` |
| Update metadata + items | `{ "status": "Sent", "items": [...] }` |
| Add notes | `{ "notes": "Important: Customer needs PDF" }` |

---

**See Also:**
- [INVOICE_GENERATION_GUIDE.md](INVOICE_GENERATION_GUIDE.md) - How to generate invoices
- [POSTMAN_API_TESTING.md](POSTMAN_API_TESTING.md) - Complete API reference
