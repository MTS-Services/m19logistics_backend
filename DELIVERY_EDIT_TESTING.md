# Delivery Edit API — Postman Testing Guide

Base URL: `http://localhost:3000/api`

All requests require the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Step 1 — Get a Token

### Login as Customer

**POST** `http://localhost:3000/api/auth/login`

Headers:

```
Content-Type: application/json
```

Body:

```json
{
  "email": "customer@example.com",
  "password": "yourpassword"
}
```

Response — copy `token` from the response for use in subsequent requests.

---

### Login as Admin

**POST** `http://localhost:3000/api/auth/login`

Body:

```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

---

## Step 2 — Find a Delivery to Edit

### Customer: List My Deliveries

**GET** `http://localhost:3000/api/deliveries`

Headers:

```
Authorization: Bearer <customer_token>
```

Look for a delivery with `"status": "RECEIVED"` or `"status": "ALLOCATED"` — copy its `id`.

---

### Admin: List All Deliveries

**GET** `http://localhost:3000/api/admin/deliveries`

Headers:

```
Authorization: Bearer <admin_token>
```

---

## Step 3 — Edit a Delivery

### Customer Edit

**PUT** `http://localhost:3000/api/deliveries/:id`

Replace `:id` with the delivery ID.

Headers:

```
Authorization: Bearer <customer_token>
Content-Type: application/json
```

Body (all fields optional — only send what you want to change):

```json
{
  "deliveryDate": "2026-05-10T00:00:00.000Z",
  "timeSlot": "AM",
  "deliveryAddress": "123 New Street, Manchester, M1 1AB",
  "specialInstructions": "Leave at front door",
  "weight": 3.5,
  "spoNumber": "SPO-2026-001",
  "requestedBy": "Jane Doe",
  "customerPhone": "07700900000",
  "customerName": "John Smith"
}
```

Valid `timeSlot` values: `"AM"`, `"PM"`, `"SAME_DAY"`

> **Note:** If `deliveryAddress` changes, pricing is automatically recalculated based on the customer's pricing tier and new distance.

---

### Admin Edit

**PUT** `http://localhost:3000/api/admin/deliveries/:id`

Replace `:id` with the delivery ID.

Headers:

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

Body (all fields optional — only send what you want to change):

```json
{
  "deliveryDate": "2026-05-10T00:00:00.000Z",
  "timeSlot": "PM",
  "weight": 5.5,
  "deliveryAddress": "456 High Road, Liverpool, L1 1AA",
  "customerName": "John Smith",
  "customerPhone": "07700900000",
  "spoNumber": "SPO-2026-001",
  "specialInstructions": "Call before delivery"
}
```

---

## Step 4 — Expected Responses

### Success (200 OK)

```json
{
  "success": true,
  "message": "Delivery updated successfully",
  "data": {
    "id": 1,
    "status": "RECEIVED",
    "deliveryDate": "2026-05-10T00:00:00.000Z",
    "timeSlot": "AM",
    "deliveryAddress": "123 New Street, Manchester, M1 1AB",
    ...
  }
}
```

### Error — Delivery Already Delivered/Cancelled (400)

```json
{
  "success": false,
  "message": "Cannot edit delivery once it has been delivered or cancelled"
}
```

### Error — Not Found or Wrong Customer (404)

```json
{
  "success": false,
  "message": "Delivery not found or access denied"
}
```

### Error — Unauthorized (401)

```json
{
  "success": false,
  "message": "Access token required"
}
```

### Error — Wrong Role (403)

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

---

## Status Rules

| Delivery Status | Customer Can Edit | Admin Can Edit |
| --------------- | ----------------- | -------------- |
| `RECEIVED`      | ✅ Yes            | ✅ Yes         |
| `ALLOCATED`     | ✅ Yes            | ✅ Yes         |
| `DELIVERED`     | ❌ No             | ❌ No          |
| `CANCELLED`     | ❌ No             | ❌ No          |

---

## Fields Summary

| Field                 | Customer | Admin | Notes                  |
| --------------------- | -------- | ----- | ---------------------- |
| `deliveryDate`        | ✅       | ✅    | ISO 8601 format        |
| `timeSlot`            | ✅       | ✅    | `AM`, `PM`, `SAME_DAY` |
| `deliveryAddress`     | ✅       | ✅    | Triggers price recalc  |
| `specialInstructions` | ✅       | ✅    | Free text              |
| `spoNumber`           | ✅       | ✅    |                        |
| `requestedBy`         | ✅       | ✅    |                        |
| `customerPhone`       | ✅       | ✅    |                        |
| `customerName`        | ✅       | ✅    |                        |
| `weight`              | ✅       | ✅    | Triggers price recalc  |
