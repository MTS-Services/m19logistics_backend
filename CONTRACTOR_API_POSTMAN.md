# Contractor API – Postman Testing Guide

End-to-end flow to test **Contractor** (Driver type) features in M19 Logistics.

## Base URL

```
{{baseUrl}} = http://localhost:3000/api
```

(Use your deployed API URL if testing against production/dev.)

## Auth Header

For all protected routes:

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

Suggested Postman variables:

| Variable | Example |
|----------|---------|
| `baseUrl` | `http://localhost:3000/api` |
| `adminToken` | (from admin login) |
| `contractorToken` | (from contractor login) |
| `contractorId` | user id returned on create |
| `deliveryId` | allocated delivery id |
| `contractorInvoiceId` | invoice id after generate |

---

## Overview

- Contractor is still `role: DRIVER` with `driverType: CONTRACTOR`
- Login uses normal `/auth/login`
- Response includes `displayRole: "Contractor"`
- Deliveries reuse existing driver APIs
- Pay Type & Rate are **admin-only**; contractor **cannot** change them

---

## Test Flow (recommended order)

```
1. Admin login
2. Admin creates contractor driver
3. Contractor login
4. Get contractor dashboard / profile
5. Admin allocates a delivery to contractor
6. Contractor accepts → completes delivery
7. Contractor generates invoice
8. Contractor lists invoices
9. Admin marks contractor invoice paid
10. Negative tests (pay fields locked, VAT rules, etc.)
```

---

## 1. Admin Login

**POST** `{{baseUrl}}/auth/login`

```json
{
  "email": "admin@m19logistics.com",
  "password": "YOUR_ADMIN_PASSWORD"
}
```

**Save:** `data.token` → `{{adminToken}}`

---

## 2. Create Contractor (Admin)

You can use **either** route.

### Option A – Users route (recommended for Admin Users form)

**POST** `{{baseUrl}}/admin/users`  
**Auth:** `Bearer {{adminToken}}`

Add `"role": "DRIVER"` (or `"CONTRACTOR"` as alias):

```json
{
  "role": "DRIVER",
  "fullName": "Hassan Courier Services",
  "username": "hassan_contractor",
  "email": "contractor@demo.com",
  "phone": "07700900123",
  "password": "Pass123!",
  "driverType": "CONTRACTOR",

  "tradingName": "Hassan Courier Services",
  "contactName": "Ahmed Hassan",
  "address": "14 Green Lane, Birmingham, B12 0XY",
  "tradingAddress": "Unit 3, Industrial Estate, Birmingham, B12 1AB",
  "driverLicenseNumber": "HASSAN912345AH9XY",
  "isVatRegistered": true,
  "vatNumber": "GB123456789",

  "vehicleRegistration": "AB12 CDE",
  "vehicleMake": "Ford",
  "vehicleModel": "Transit",
  "motExpiry": "2026-08-20",
  "insuranceExpiry": "2026-08-05",
  "goodsInTransitExpiry": "2026-08-18",
  "publicLiabilityExpiry": "2026-09-01",

  "bankName": "Barclays",
  "accountName": "Hassan Courier Services",
  "sortCode": "20-00-00",
  "accountNumber": "12345678",
  "bankReference": "HCS-M19",

  "payType": "WEEKLY",
  "rate": 180
}
```

> **Why you saw `Invalid role`:** `/admin/users` requires `role`.  
> Use `"role": "DRIVER"` + `"driverType": "CONTRACTOR"`,  
> or `"role": "CONTRACTOR"` (alias → saved as DRIVER + CONTRACTOR type).

### Option B – Drivers route

**POST** `{{baseUrl}}/admin/drivers`  
**Auth:** `Bearer {{adminToken}}`

Same body as above **without** `role` (this route always creates a DRIVER).

```json
{
  "fullName": "Hassan Courier Services",
  "username": "hassan_contractor",
  "email": "contractor@demo.com",
  "phone": "07700900123",
  "password": "Pass123!",
  "driverType": "CONTRACTOR",

  "tradingName": "Hassan Courier Services",
  "contactName": "Ahmed Hassan",
  "address": "14 Green Lane, Birmingham, B12 0XY",
  "tradingAddress": "Unit 3, Industrial Estate, Birmingham, B12 1AB",
  "driverLicenseNumber": "HASSAN912345AH9XY",
  "isVatRegistered": true,
  "vatNumber": "GB123456789",

  "vehicleRegistration": "AB12 CDE",
  "vehicleMake": "Ford",
  "vehicleModel": "Transit",
  "motExpiry": "2026-08-20",
  "insuranceExpiry": "2026-08-05",
  "goodsInTransitExpiry": "2026-08-18",
  "publicLiabilityExpiry": "2026-09-01",

  "bankName": "Barclays",
  "accountName": "Hassan Courier Services",
  "sortCode": "20-00-00",
  "accountNumber": "12345678",
  "bankReference": "HCS-M19",

  "payType": "WEEKLY",
  "rate": 180
}
```

### Required for CONTRACTOR

| Field | Required |
|-------|----------|
| fullName, username, email, phone, password | Yes |
| tradingName, address, tradingAddress | Yes |
| driverLicenseNumber | Yes |
| vehicleRegistration, motExpiry | Yes |
| payType, rate | Yes |
| vatNumber | Yes **only if** `isVatRegistered: true` |

### Valid `payType` values

- `DAILY`
- `WEEKLY`
- `FORTNIGHTLY`
- `FOUR_WEEKLY`

**Save:**

- `data.id` → `{{contractorId}}`
- Expect `data.displayRole` = `"Contractor"`
- Expect `data.driverProfile.driverType` = `"CONTRACTOR"`

### Expected success

```json
{
  "success": true,
  "data": {
    "id": 123,
    "role": "DRIVER",
    "displayRole": "Contractor",
    "driverProfile": {
      "driverType": "CONTRACTOR",
      "payType": "WEEKLY",
      "rate": "180"
    }
  }
}
```

### Expected validation failure (example)

If `isVatRegistered: true` and no `vatNumber`:

```json
{
  "success": false,
  "message": "VAT Number is required when VAT Registered is Yes"
}
```

---

## 3. List Contractors Only (Admin)

**GET** `{{baseUrl}}/admin/drivers?driverType=CONTRACTOR`  
**Auth:** `Bearer {{adminToken}}`

---

## 4. Get Contractor By ID (Admin)

**GET** `{{baseUrl}}/admin/drivers/{{contractorId}}`  
**Auth:** `Bearer {{adminToken}}`

Check:

- `displayRole`
- `documentStatus` (MOT / insurance expiry highlight flags)

---

## 5. Update Contractor Pay (Admin only)

**PUT** `{{baseUrl}}/admin/drivers/{{contractorId}}`  
**Auth:** `Bearer {{adminToken}}`

```json
{
  "payType": "FORTNIGHTLY",
  "rate": 200
}
```

Admin **can** change pay fields.

---

## 6. Contractor Login

**POST** `{{baseUrl}}/auth/login`

```json
{
  "email": "contractor@demo.com",
  "password": "Pass123!"
}
```

**Save:** `data.token` → `{{contractorToken}}`

Check:

```json
{
  "data": {
    "user": {
      "role": "DRIVER",
      "displayRole": "Contractor",
      "driverProfile": {
        "driverType": "CONTRACTOR"
      }
    }
  }
}
```

---

## 7. Auth Me

**GET** `{{baseUrl}}/auth/me`  
**Auth:** `Bearer {{contractorToken}}`

Expect:

- `displayRole: "Contractor"`
- `payFieldsReadOnly: true`
- `documentStatus` with labels like `EXPIRED`, `EXPIRES WITHIN 14 DAYS`, `VALID`

---

## 8. Contractor Dashboard

**GET** `{{baseUrl}}/driver/contractor/dashboard`  
**Auth:** `Bearer {{contractorToken}}`

Returns:

- Current pay period
- Completed jobs count
- Current earnings (`jobs × rate`)
- Invoice status (paid / outstanding)
- Recent completed jobs
- Recent invoices
- Vehicle document expiry status

---

## 9. Contractor Profile

### Get profile

**GET** `{{baseUrl}}/driver/contractor/profile`  
**Auth:** `Bearer {{contractorToken}}`

### Update personal / vehicle / bank (allowed)

**PUT** `{{baseUrl}}/driver/contractor/profile`  
**Auth:** `Bearer {{contractorToken}}`

```json
{
  "contactName": "Ahmed Hassan",
  "phone": "07700900123",
  "tradingAddress": "Unit 3, Industrial Estate, Birmingham, B12 1AB",
  "bankName": "Barclays",
  "sortCode": "20-00-00",
  "accountNumber": "12345678"
}
```

### Update pay fields (must FAIL)

**PUT** `{{baseUrl}}/driver/contractor/profile`  
**Auth:** `Bearer {{contractorToken}}`

```json
{
  "payType": "DAILY",
  "rate": 999
}
```

**Expected:** `403` / error message that contractors cannot change Pay Type / Rate.

---

## 10. Delivery Flow (Assigned → Completed)

Contractors use the same driver delivery APIs.

### 10.1 Admin allocates delivery

**POST** `{{baseUrl}}/admin/deliveries/{{deliveryId}}/allocate`  
**Auth:** `Bearer {{adminToken}}`

```json
{
  "driverId": {{contractorId}}
}
```

> Use an existing `RECEIVED` delivery id, or create one as a customer first.

### 10.2 List assigned deliveries

**GET** `{{baseUrl}}/driver/deliveries?status=ALLOCATED`  
**Auth:** `Bearer {{contractorToken}}`

### 10.3 Accept delivery

**POST** `{{baseUrl}}/driver/deliveries/{{deliveryId}}/respond`  
**Auth:** `Bearer {{contractorToken}}`

```json
{
  "action": "accept"
}
```

### 10.4 Complete delivery

**POST** `{{baseUrl}}/driver/deliveries/{{deliveryId}}/complete`  
**Auth:** `Bearer {{contractorToken}}`

```json
{
  "receivedBy": "Reception Desk",
  "photoUrls": []
}
```

### 10.5 List completed deliveries

**GET** `{{baseUrl}}/driver/deliveries?status=DELIVERED`  
**Auth:** `Bearer {{contractorToken}}`

Optional search:

```
GET {{baseUrl}}/driver/deliveries?status=DELIVERED&search=SPO
```

---

## 11. Generate Contractor Invoice

**POST** `{{baseUrl}}/driver/contractor/invoices/generate`  
**Auth:** `Bearer {{contractorToken}}`

### Option A – current pay period (default)

```json
{}
```

### Option B – custom period

```json
{
  "periodStart": "2026-07-07",
  "periodEnd": "2026-07-13"
}
```

**Rules:**

- Only `DELIVERED` jobs in the period
- Only jobs **not already invoiced**
- Amount = `jobCount × rate`
- Invoice number format: `INV-C-2026-001`

**Save:** `data.id` → `{{contractorInvoiceId}}`

### Expected

```json
{
  "success": true,
  "message": "Contractor invoice generated successfully",
  "data": {
    "invoiceNumber": "INV-C-2026-001",
    "jobCount": 2,
    "rate": "180",
    "amount": "360",
    "status": "OUTSTANDING"
  }
}
```

If no eligible deliveries:

```json
{
  "success": false,
  "message": "No uninvoiced completed deliveries found for this period"
}
```

---

## 12. Contractor – My Invoices

### List

**GET** `{{baseUrl}}/driver/contractor/invoices`  
**Auth:** `Bearer {{contractorToken}}`

Query params:

| Param | Example | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `10` | Page size |
| `status` | `OUTSTANDING` / `PAID` / `ALL` | Filter |
| `search` | `INV-C` | Invoice number search |

### Get one

**GET** `{{baseUrl}}/driver/contractor/invoices/{{contractorInvoiceId}}`  
**Auth:** `Bearer {{contractorToken}}`

---

## 13. Admin – Contractor Invoices

### List all

**GET** `{{baseUrl}}/admin/contractor-invoices`  
**Auth:** `Bearer {{adminToken}}`

Optional:

```
GET {{baseUrl}}/admin/contractor-invoices?contractorId={{contractorId}}&status=OUTSTANDING&page=1&limit=10
```

### Mark paid

**POST** `{{baseUrl}}/admin/contractor-invoices/{{contractorInvoiceId}}/mark-paid`  
**Auth:** `Bearer {{adminToken}}`

**Expected:** `status: "PAID"`, `paidAt` set.

---

## 14. Create Employee Driver (control test)

**POST** `{{baseUrl}}/admin/drivers`  
**Auth:** `Bearer {{adminToken}}`

```json
{
  "fullName": "John Employee Driver",
  "username": "john_employee",
  "email": "employee.driver@demo.com",
  "phone": "07700900999",
  "password": "Pass123!",
  "driverType": "EMPLOYEE",
  "vehicleRegistration": "XY99 ZZZ",
  "driverLicenseNumber": "EMP123",
  "address": "1 Test Street"
}
```

Then login as this user and call:

**GET** `{{baseUrl}}/driver/contractor/dashboard`

**Expected:** error – only available for contractors.

---

## 15. Negative / Edge Cases Checklist

| # | Test | Expected |
|---|------|----------|
| 1 | Create contractor without `tradingName` | 400 validation error |
| 2 | `isVatRegistered: true` without `vatNumber` | 400 |
| 3 | Invalid `payType` / `rate` as contractor | Blocked (403/400) |
| 4 | Admin updates `payType` / `rate` | Success |
| 5 | Generate invoice with no completed jobs | 400 no deliveries |
| 6 | Generate invoice twice for same jobs | Second call finds 0 uninvoiced |
| 7 | Employee driver hits `/driver/contractor/*` | Error – contractors only |
| 8 | Expiry dates within 7/14/30 days | `documentStatus.*.highlight = true` |

---

## Quick Postman Collection Order

1. `Admin Login` → set `adminToken`
2. `Create Contractor` → set `contractorId`
3. `Contractor Login` → set `contractorToken`
4. `GET Contractor Dashboard`
5. `GET Contractor Profile`
6. `PUT Profile` (allowed fields)
7. `PUT Profile payType` (should fail)
8. `Allocate Delivery` (admin)
9. `Accept Delivery` (contractor)
10. `Complete Delivery` (contractor)
11. `Generate Invoice` (contractor)
12. `List My Invoices` (contractor)
13. `Mark Invoice Paid` (admin)
14. `Dashboard` again → earnings / invoice status updated

---

## Related Existing Driver Routes (still used)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/driver/dashboard` | General driver dashboard (+ contractor extras if type=CONTRACTOR) |
| GET | `/driver/deliveries` | Assigned / completed list |
| GET | `/driver/deliveries/:id` | Delivery details |
| POST | `/driver/deliveries/:id/respond` | Accept / reject |
| POST | `/driver/deliveries/:id/complete` | Mark delivered |
| POST | `/driver/deliveries/:id/upload-proof` | Signature / photos |

---

## Notes

- `role` in DB/JWT stays **`DRIVER`**
- UI should use **`displayRole`** / `driverProfile.driverType`
- Customer invoices (`/invoices`, `/admin/invoices`) are separate from contractor invoices (`INV-C-...`)
- Restart server after migration if Prisma client was regenerated
