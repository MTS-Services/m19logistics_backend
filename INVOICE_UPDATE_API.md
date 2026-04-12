# Invoice Update API — Postman Testing Guide

**Endpoint:** `PUT {{baseUrl}}/api/admin/invoices/{{invoiceId}}`  
**Auth:** Bearer token (Admin only)

---

## What Can Be Updated

| Field           | Type            | Notes                                    |
| --------------- | --------------- | ---------------------------------------- |
| `invoiceNumber` | string          | Must be unique (e.g. `MX1X-05`)          |
| `invoiceDate`   | ISO date string |                                          |
| `dueDate`       | ISO date string | optional                                 |
| `status`        | string          | e.g. `Draft`, `Sent`                     |
| `customerRef`   | string          | optional reference                       |
| `notes`         | string          | optional notes                           |
| `paymentTerms`  | string          | e.g. `30 Days (End of Month)`            |
| `items`         | array           | Replaces ALL existing line items         |
| `allowEditPaid` | boolean         | Set `true` to override paid-invoice lock |

> **Totals (`subtotal`, `vatTotal`, `grandTotal`) are auto-recalculated** from `items` — do not send them manually.

---

## Postman Setup

### 1. Login (get token)

```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@m19logistics.com",
  "password": "Admin123!"
}
```

Copy the `token` from the response and set it as `{{token}}` in your Postman environment.

---

### 2. Update Invoice — Full Example

```
PUT {{baseUrl}}/api/admin/invoices/20
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**

```json
{
  "invoiceNumber": "MX1X-05",
  "invoiceDate": "2026-04-09T03:10:54.558Z",
  "status": "Draft",
  "paymentTerms": "30 Days (End of Month)",
  "notes": null,
  "customerRef": null,
  "items": [
    {
      "deliveryId": 119,
      "description": "Cust. Ref: 49319518 / 4/2/2026 / Penhesgyn Newydd, Menai Bridge, LL59 5RY",
      "quantity": 1,
      "unitCost": 50,
      "vatAmount": 10,
      "total": 60,
      "isAdditional": false
    },
    {
      "deliveryId": 120,
      "description": "Cust. Ref: S1500-SPO008743 / 4/2/2026 / 44 Ty'n Rhos, Gaerwen, Anglesey, LL60 6HL",
      "quantity": 1,
      "unitCost": 50,
      "vatAmount": 10,
      "total": 60,
      "isAdditional": false
    }
  ]
}
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Invoice updated successfully",
  "data": {
    "id": 20,
    "invoiceNumber": "MX1X-05",
    "customerId": 80,
    "weekStartDate": "2026-03-30T00:00:00.000Z",
    "weekEndDate": "2026-04-05T00:00:00.000Z",
    "invoiceDate": "2026-04-09T03:10:54.558Z",
    "dueDate": null,
    "status": "Draft",
    "subtotal": "100.00",
    "vatTotal": "20.00",
    "grandTotal": "120.00",
    "paymentTerms": "30 Days (End of Month)",
    "customerRef": null,
    "notes": null,
    "isPaid": false,
    "paidAt": null,
    "pdfUrl": null,
    "customer": {
      "id": 80,
      "fullName": "Topps Tiles Bangor",
      "email": "topps500@toppstiles.co.uk",
      "customerProfile": {
        "loginId": null,
        "storeName": "Topps Bangor"
      }
    },
    "items": [
      {
        "id": 46,
        "invoiceId": 20,
        "deliveryId": 119,
        "spoNumber": null,
        "description": "Cust. Ref: 49319518 / 4/2/2026 / Penhesgyn Newydd, Menai Bridge, LL59 5RY",
        "quantity": 1,
        "unitCost": "50.00",
        "vatAmount": "10.00",
        "total": "60.00",
        "isAdditional": false
      },
      {
        "id": 47,
        "invoiceId": 20,
        "deliveryId": 120,
        "spoNumber": null,
        "description": "Cust. Ref: S1500-SPO008743 / 4/2/2026 / 44 Ty'n Rhos, Gaerwen, Anglesey, LL60 6HL",
        "quantity": 1,
        "unitCost": "50.00",
        "vatAmount": "10.00",
        "total": "60.00",
        "isAdditional": false
      }
    ]
  }
}
```

---

## Common Scenarios

### Update notes/customerRef only (no items)

```json
{
  "notes": "Payment due by end of April",
  "customerRef": "BANGOR-APR-2026"
}
```

> Items are untouched when `items` is omitted from the body.

---

### Change invoice number only

```json
{
  "invoiceNumber": "MX1X-05"
}
```

---

### Edit a paid invoice (override lock)

```json
{
  "allowEditPaid": true,
  "notes": "Correction applied by finance team"
}
```

---

### Add a manual extra charge line item

```json
{
  "items": [
    {
      "deliveryId": 119,
      "description": "Cust. Ref: 49319518 / 4/2/2026 / Penhesgyn Newydd, Menai Bridge, LL59 5RY",
      "quantity": 1,
      "unitCost": 50,
      "vatAmount": 10,
      "total": 60,
      "isAdditional": false
    },
    {
      "deliveryId": 120,
      "description": "Cust. Ref: S1500-SPO008743 / 4/2/2026 / 44 Ty'n Rhos, Gaerwen, Anglesey, LL60 6HL",
      "quantity": 1,
      "unitCost": 50,
      "vatAmount": 10,
      "total": 60,
      "isAdditional": false
    },
    {
      "deliveryId": null,
      "description": "Additional Fuel Surcharge",
      "quantity": 1,
      "unitCost": 15,
      "vatAmount": 3,
      "total": 18,
      "isAdditional": true
    }
  ]
}
```

> New `grandTotal` will be auto-calculated as `138.00`.

---

## Error Responses

| Status | Message                                 | Cause                                                                |
| ------ | --------------------------------------- | -------------------------------------------------------------------- |
| 400    | `Invalid invoice ID`                    | Non-numeric ID in URL                                                |
| 403    | `Cannot edit a paid invoice`            | Invoice already marked paid — send `allowEditPaid: true` to override |
| 404    | `Invoice not found`                     | Wrong invoice ID                                                     |
| 409    | `Invoice number MX1X-05 already exists` | Another invoice already uses that number                             |

---

## Important Rules

- Sending `items` **replaces all existing line items** — always include ALL lines, not just changed ones
- `subtotal`, `vatTotal`, `grandTotal` are **ignored in the request** — they are always recalculated from items
- `customerId`, `weekStartDate`, `weekEndDate` are **not updatable** via this endpoint
