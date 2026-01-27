# Invoice Editing Guide - M19 Logistics

Complete guide for editing invoices in the admin panel.

## Overview

The invoice editing system allows administrators to:
- View detailed invoice information
- Update invoice metadata (customer ref, notes, payment terms)
- Add/remove invoice items (deliveries)
- Override pricing and VAT for specific items
- Manually update invoice numbers
- Recalculate totals after edits

## Important Rules

### 1. Paid Invoice Protection
**Once an invoice is marked as paid, it CANNOT be edited.**

This prevents:
- Accidental modifications to finalized invoices
- Financial record tampering
- Audit trail corruption

If you need to adjust a paid invoice:
1. Contact the finance team
2. They will create a credit note or adjustment invoice
3. Never edit paid invoices directly

### 2. Automatic Recalculation
When you modify invoice items (add, update, remove), totals are automatically recalculated:
- **Subtotal:** Sum of (quantity × unitCost) for all items
- **VAT Total:** Sum of vatAmount for all items
- **Grand Total:** Subtotal + VAT Total

You can also manually trigger recalculation using `POST /admin/invoices/:id/recalculate`.

### 3. Invoice Number Format
Invoice numbers must follow the format: `T####` (e.g., T0326, T0999)
- Starts with "T"
- Followed by 4+ digits
- Must be unique across all invoices

## Common Use Cases

### 1. View Invoice Details
**Endpoint:** `GET /admin/invoices/:id`

**Response includes:**
- Invoice metadata (number, date, customer ref, notes)
- Customer information (name, email, login ID, store name)
- All invoice items with delivery details
- Current totals (subtotal, VAT, grand total)
- Payment status

```json
GET /admin/invoices/15

{
  "success": true,
  "data": {
    "id": 15,
    "invoiceNumber": "T0326",
    "customerId": 8,
    "invoiceDate": "2026-01-27T00:00:00.000Z",
    "subtotal": "225.00",
    "vatTotal": "45.00",
    "grandTotal": "270.00",
    "isPaid": false,
    "customerRef": "PO-12345",
    "notes": "Weekly delivery invoice",
    "customer": {
      "fullName": "John Customer",
      "customerProfile": {
        "loginId": "TOPPS001",
        "storeName": "Topps Tiles Store 1"
      }
    },
    "items": [
      {
        "id": 101,
        "deliveryId": 505,
        "spoNumber": "SPO-2026-001",
        "description": "Delivery to London SW1A 1AA",
        "quantity": 1,
        "unitCost": "75.00",
        "vatAmount": "15.00",
        "total": "90.00",
        "delivery": {
          "deliveryAddress": "123 Main Street, London",
          "weight": 1200
        }
      }
    ]
  }
}
```

### 2. Update Invoice Metadata
**Endpoint:** `PUT /admin/invoices/:id`

**Editable fields:**
- `customerRef` - Customer purchase order or reference number
- `notes` - Internal notes or billing instructions
- `paymentTerms` - Payment terms (e.g., "Net 30", "Due on receipt")
- `invoiceNumber` - Invoice number (use dedicated endpoint for this)

```json
PUT /admin/invoices/15

{
  "customerRef": "PO-12345-REV2",
  "notes": "Customer requested split payment",
  "paymentTerms": "Net 30"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice updated successfully",
  "data": {
    "id": 15,
    "invoiceNumber": "T0326",
    "customerRef": "PO-12345-REV2",
    "notes": "Customer requested split payment",
    "paymentTerms": "Net 30"
  }
}
```

### 3. Add Missing Delivery to Invoice
**Endpoint:** `POST /admin/invoices/:id/items`

**Scenario:** A delivery was completed but not included in the original invoice.

```json
POST /admin/invoices/15/items

{
  "deliveryId": 510,
  "description": "Delivery to Birmingham B1 1AA",
  "quantity": 1,
  "unitCost": 45.00,
  "vatAmount": 9.00,
  "total": 54.00,
  "spoNumber": "SPO-2026-105"
}
```

**What happens:**
1. Invoice item is created linking to delivery #510
2. Invoice totals are automatically recalculated
3. New subtotal: £225.00 + £45.00 = £270.00
4. New VAT total: £45.00 + £9.00 = £54.00
5. New grand total: £324.00

### 4. Add Manual Extra Charge
**Endpoint:** `POST /admin/invoices/:id/items`

**Scenario:** Customer needs to be billed for a special handling fee not tied to a specific delivery.

```json
POST /admin/invoices/15/items

{
  "description": "Weekend delivery surcharge",
  "quantity": 1,
  "unitCost": 25.00,
  "vatAmount": 5.00,
  "total": 30.00,
  "spoNumber": "MANUAL-WE-001",
  "isAdditional": true
}
```

**Note:** Setting `isAdditional: true` marks this as a manual charge (no deliveryId).

### 5. Override Item Pricing
**Endpoint:** `PUT /admin/invoices/:invoiceId/items/:itemId`

**Scenario:** Customer negotiated a discount, need to adjust the price of a specific delivery.

```json
PUT /admin/invoices/15/items/101

{
  "unitCost": 60.00,
  "vatAmount": 12.00
}
```

**What happens:**
1. Original: £75.00 + £15.00 VAT = £90.00
2. Updated: £60.00 + £12.00 VAT = £72.00 (auto-calculated)
3. Invoice totals are automatically recalculated
4. Net savings: £18.00

**You can also update:**
- `description` - Change item description
- `quantity` - Update quantity (total = quantity × unitCost + vatAmount)
- `spoNumber` - Update SPO reference

### 6. Remove Incorrect Item
**Endpoint:** `DELETE /admin/invoices/:invoiceId/items/:itemId`

**Scenario:** An item was added to the wrong invoice by mistake.

```json
DELETE /admin/invoices/15/items/102
```

**What happens:**
1. Invoice item #102 is deleted
2. Invoice totals are automatically recalculated
3. Subtotal, VAT, and grand total reduced accordingly

### 7. Manually Update Invoice Number
**Endpoint:** `PUT /admin/invoices/:id/invoice-number`

**Scenario:** Need to match invoice numbers with external accounting system.

```json
PUT /admin/invoices/15/invoice-number

{
  "invoiceNumber": "T0999"
}
```

**Validation:**
- Must be unique (will fail if T0999 already exists)
- Must match format `T####`
- Cannot update paid invoices

**Warning:** Changing invoice numbers can break sequential numbering. Use with caution.

### 8. Recalculate Totals Manually
**Endpoint:** `POST /admin/invoices/:id/recalculate`

**Scenario:** After making multiple bulk edits, verify totals are correct.

```json
POST /admin/invoices/15/recalculate
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice totals recalculated successfully",
  "data": {
    "id": 15,
    "invoiceNumber": "T0326",
    "subtotal": "250.00",
    "vatTotal": "50.00",
    "grandTotal": "300.00"
  }
}
```

**Note:** Totals are automatically recalculated when adding/updating/removing items, but this endpoint can be used to force a recalculation.

## Workflow Examples

### Example 1: Fix Invoice with Wrong Customer Reference

```bash
# Step 1: View current invoice
GET /admin/invoices/15

# Step 2: Update customer reference
PUT /admin/invoices/15
{
  "customerRef": "PO-CORRECTED-12345"
}
```

### Example 2: Add Forgotten Delivery + Extra Charge

```bash
# Step 1: View invoice to check current state
GET /admin/invoices/15

# Step 2: Add missing delivery
POST /admin/invoices/15/items
{
  "deliveryId": 520,
  "description": "Delivery to Manchester",
  "quantity": 1,
  "unitCost": 50.00,
  "vatAmount": 10.00,
  "total": 60.00,
  "spoNumber": "SPO-2026-120"
}

# Step 3: Add congestion charge
POST /admin/invoices/15/items
{
  "description": "London congestion charge",
  "quantity": 1,
  "unitCost": 15.00,
  "vatAmount": 3.00,
  "total": 18.00,
  "isAdditional": true
}

# Step 4: Verify final totals (automatic recalculation already happened)
GET /admin/invoices/15
```

### Example 3: Apply Customer Discount

```bash
# Step 1: View invoice items
GET /admin/invoices/15

# Step 2: Identify item to discount (e.g., item ID 101)

# Step 3: Apply 20% discount
# Original: unitCost = 75.00, vatAmount = 15.00, total = 90.00
# Discounted: unitCost = 60.00, vatAmount = 12.00
PUT /admin/invoices/15/items/101
{
  "unitCost": 60.00,
  "vatAmount": 12.00,
  "description": "Delivery to London SW1A 1AA (20% discount applied)"
}

# Step 4: Add notes to invoice
PUT /admin/invoices/15
{
  "notes": "20% loyalty discount applied to first delivery"
}
```

### Example 4: Remove Duplicate Entry

```bash
# Step 1: View invoice items to identify duplicate
GET /admin/invoices/15

# Step 2: Remove duplicate item (e.g., item ID 105)
DELETE /admin/invoices/15/items/105

# Step 3: Verify totals updated correctly
GET /admin/invoices/15
```

## Error Handling

### Error: "Cannot edit a paid invoice"
**Cause:** Attempting to modify an invoice that has been marked as paid.

**Solution:**
- Check invoice status: `GET /admin/invoices/:id`
- If incorrectly marked as paid, contact finance team to reverse payment status
- If legitimately paid, create a credit note or adjustment invoice instead

### Error: "Invoice number T0999 already exists"
**Cause:** Trying to assign an invoice number that's already in use.

**Solution:**
- Check existing invoices: `GET /admin/invoices?invoiceNumber=T0999`
- Choose a different invoice number
- Use auto-increment by generating new invoice instead of manual number assignment

### Error: "Invoice not found"
**Cause:** Invoice ID does not exist in the database.

**Solution:**
- Verify invoice ID: `GET /admin/invoices` (list all invoices)
- Check if invoice was deleted
- Ensure you're using numeric ID, not invoice number

### Error: "Invoice item not found"
**Cause:** Trying to update/delete an item that doesn't exist.

**Solution:**
- Get current invoice items: `GET /admin/invoices/:id`
- Verify item ID from the response
- Check if item was already deleted

## Security & Permissions

### Who Can Edit Invoices?
- **ADMIN** - Full access to all invoice editing features
- **MANAGER** - Full access to all invoice editing features
- **CUSTOMER** - Read-only access to their own invoices
- **DRIVER** - No invoice access

### Audit Trail
All invoice modifications are tracked:
- Who made the change (user ID from JWT token)
- When the change was made (timestamp)
- What was changed (before/after values)

View audit logs: `GET /admin/audit-logs?entityType=Invoice&entityId=15`

## Best Practices

### 1. Always View Before Editing
```bash
GET /admin/invoices/:id
```
Check current state to avoid overwriting unintended changes.

### 2. Use Descriptive Notes
```json
{
  "notes": "Discount applied per email from Sarah Johnson on 2026-01-25"
}
```
Document why changes were made for future reference.

### 3. Verify After Edits
```bash
GET /admin/invoices/:id
```
Confirm totals calculated correctly and all changes applied.

### 4. Don't Edit Paid Invoices
Wait for finance team to provide credit note process.

### 5. Backup Invoice Number Sequence
When manually assigning invoice numbers, keep track in external system to avoid conflicts.

## Integration with Invoice Generation

### Automatic vs Manual Items
- **Automatic items:** Created during invoice generation from deliveries
- **Manual items:** Added via `POST /admin/invoices/:id/items` with `isAdditional: true`

Both types can be edited equally after creation (if invoice not paid).

### When to Edit vs Regenerate
- **Edit:** Minor corrections (wrong customer ref, missed delivery, pricing adjustment)
- **Regenerate:** Major errors (wrong customer, wrong date range, incorrect data)

To regenerate:
1. Delete old invoice: `DELETE /admin/invoices/:id` (if not paid)
2. Generate new invoice: `POST /admin/invoices/generate`

## Future Enhancements

### Planned Features
1. **PDF Regeneration** - Regenerate PDF after edits
2. **Bulk Editing** - Edit multiple invoice items at once
3. **Template Overrides** - Custom invoice layouts per customer
4. **Multi-Currency** - Support for GBP, EUR, USD
5. **Credit Notes** - Formal reversal process for paid invoices
6. **Email Notifications** - Notify customers when invoice edited

### Currently Not Supported
- Editing paid invoices (by design)
- Changing invoice customer (create new invoice instead)
- Changing invoice date (use invoice generation date range)
- Deleting invoices with payments (contact finance team)

## Troubleshooting

### Invoice Totals Don't Match Expected
1. Recalculate: `POST /admin/invoices/:id/recalculate`
2. Check all items: `GET /admin/invoices/:id` (review items array)
3. Verify VAT calculation: 20% standard rate
4. Check for hidden extra charges or manual items

### Can't Find Invoice to Edit
1. List all invoices: `GET /admin/invoices`
2. Filter by customer: `GET /admin/invoices?customerId=8`
3. Search by invoice number: `GET /admin/invoices?invoiceNumber=T0326`
4. Check if invoice was generated: Review invoice generation logs

### Changes Not Saving
1. Check authentication: Ensure valid JWT token
2. Verify authorization: Must be ADMIN or MANAGER role
3. Check invoice status: Cannot edit paid invoices
4. Validate request body: Ensure all required fields present

## Quick Reference

| Action | Endpoint | Method |
|--------|----------|--------|
| View invoice | `/admin/invoices/:id` | GET |
| Update metadata | `/admin/invoices/:id` | PUT |
| Add item | `/admin/invoices/:id/items` | POST |
| Update item | `/admin/invoices/:invoiceId/items/:itemId` | PUT |
| Remove item | `/admin/invoices/:invoiceId/items/:itemId` | DELETE |
| Recalculate | `/admin/invoices/:id/recalculate` | POST |
| Update number | `/admin/invoices/:id/invoice-number` | PUT |
| Mark paid | `/admin/invoices/:id/mark-paid` | POST |

---

For invoice generation guide, see [INVOICE_GENERATION_GUIDE.md](INVOICE_GENERATION_GUIDE.md).

For complete API testing examples, see [POSTMAN_API_TESTING.md](POSTMAN_API_TESTING.md).
