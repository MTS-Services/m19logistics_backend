# Rate on Job + Collection Points — Postman Testing

Backend APIs for:

1. Contractor pay type `RATE_ON_JOB`
2. Create Job: `collectionPoints` + `contractorRate`
3. Allocate Driver: job rate vs contractor pay structure
4. Contractor invoice using per-job rates

Create Job = `POST /deliveries`. Customer, Admin, and Manager can all create. `customerId` is optional. Admin can also update fields on `PUT /admin/deliveries/:id`.

---

## Postman setup

**Environment variables**

| Variable | Example |
|----------|---------|
| `baseUrl` | `http://localhost:3000/api` |
| `adminToken` | (from admin login) |
| `customerToken` | (from customer login) |
| `contractorToken` | (from contractor login) |
| `weeklyContractorToken` | (from weekly contractor login) |
| `contractorId` | RATE_ON_JOB contractor user id |
| `weeklyContractorId` | WEEKLY contractor user id |
| `deliveryId` | job id |
| `invoiceId` | contractor invoice id |

**Every protected request**

```
Authorization: Bearer {{adminToken}}   (or customer / contractor token)
Content-Type: application/json
```

**Login Tests script** (save token automatically):

```javascript
const json = pm.response.json();
if (json.success && json.data && json.data.token) {
  pm.environment.set("adminToken", json.data.token); // change key per login
}
```

Server must be running: `npm run dev` → `http://localhost:3000`

---

## Recommended order

```
1. Admin login
2. Customer login
3. Create RATE_ON_JOB contractor
4. Create WEEKLY contractor (allocate pay-structure test)
5. Create job with collectionPoints + contractorRate
6. GET job — confirm fields saved
7. Admin update collectionPoints / contractorRate
8. Allocate RATE_ON_JOB contractor (must send contractorRate if job has none)
9. Re-allocate WEEKLY contractor with contractorRate (this-job rate)
10. Re-allocate WEEKLY contractor with contractorRate: null (pay structure)
11. Negative allocate tests
12. Contractor accept + complete
13. Generate contractor invoice — line amounts = job rates
14. Dashboard earnings use job rates
```

---

## 1. Admin login

**POST** `{{baseUrl}}/auth/login`

```json
{
  "email": "YOUR_ADMIN_EMAIL",
  "password": "YOUR_ADMIN_PASSWORD"
}
```

**Save:** `data.token` → `{{adminToken}}`

Tests script:

```javascript
const json = pm.response.json();
pm.environment.set("adminToken", json.data.token);
```

---

## 2. Customer login

**POST** `{{baseUrl}}/auth/login`

```json
{
  "email": "YOUR_CUSTOMER_EMAIL",
  "password": "YOUR_CUSTOMER_PASSWORD"
}
```

**Save:** `data.token` → `{{customerToken}}`

```javascript
const json = pm.response.json();
pm.environment.set("customerToken", json.data.token);
```

---

## 3. Create RATE_ON_JOB contractor

**POST** `{{baseUrl}}/api/admin/users`  
**Auth:** `Bearer {{adminToken}}`

`payType` now accepts: `DAILY` | `WEEKLY` | `FORTNIGHTLY` | `FOUR_WEEKLY` | `RATE_ON_JOB`

Use a unique email/username each run.

```json
{
  "fullName": "Rate On Job Courier",
  "username": "roj_contractor_01",
  "email": "roj.contractor01@example.com",
  "phone": "07700900901",
  "password": "Pass123!",
  "driverType": "CONTRACTOR",
  "tradingName": "ROJ Courier Ltd",
  "contactName": "Test Contractor",
  "address": "14 Green Lane, Birmingham, B12 0XY",
  "tradingAddress": "Unit 3, Industrial Estate, Birmingham, B12 1AB",
  "driverLicenseNumber": "ROJ912345AH9XY",
  "vehicleRegistration": "RO12 JOB",
  "motExpiry": "2027-08-20",
  "payType": "RATE_ON_JOB",
  "rate": 0
}
```

`rate` on the contractor profile is still required on create (fallback / default). Per-job pay comes from `Delivery.contractorRate`.

**Save:** `data.id` → `{{contractorId}}`

**Check**

- `data.driverProfile.driverType` = `CONTRACTOR`
- `data.driverProfile.payType` = `RATE_ON_JOB`

Same body works on **POST** `{{baseUrl}}/admin/users` if you add:

```json
"role": "DRIVER"
```

---

## 4. Edit contractor pay type

**PUT** `{{baseUrl}}/admin/drivers/{{contractorId}}`  
**Auth:** `Bearer {{adminToken}}`

```json
{
  "payType": "RATE_ON_JOB",
  "rate": 0
}
```

---

## 5. Create WEEKLY contractor (pay structure test)

**POST** `{{baseUrl}}/admin/drivers`  
**Auth:** `Bearer {{adminToken}}`

Same contractor body as step 3, but:

```json
"email": "weekly.contractor01@example.com",
"username": "weekly_contractor_01",
"payType": "WEEKLY",
"rate": 80
```

**Save:** `data.id` → `{{weeklyContractorId}}`

---

## 6. Create Job (collection points + job rate)

**POST** `{{baseUrl}}/deliveries`

Use a **future** date so the AM/PM slot is not full.

**Auth:** `Bearer {{customerToken}}` or `Bearer {{adminToken}}`

```json
{
  "spoNumber": "SPO-ROJ-001",
  "deliveryDate": "2026-12-15",
  "timeSlot": "AM",
  "weight": 800,
  "deliveryAddress": "4 Bumpers Lane, Chester, CH1 4LY",
  "customerName": "John Smith",
  "customerPhone": "07123456789",
  "requestedBy": "Sarah Williams",
  "specialInstructions": "Rate on job test",
  "collectionPoints": [
    "Warehouse 1, Trafford Park, Manchester",
    "Yard 2, Sealand Industrial Estate, Chester"
  ],
  "contractorRate": 45.5
}
```

**Save:** `data.id` → `{{deliveryId}}`

**Check**

```json
{
  "success": true,
  "data": {
    "collectionPoints": [
      "Warehouse 1, Trafford Park, Manchester",
      "Yard 2, Sealand Industrial Estate, Chester"
    ],
    "contractorRate": "45.5"
  }
}
```

Empty collection strings are stripped. `contractorRate` optional; omit it to leave `null`.

---

## 7. GET job (customer)

**GET** `{{baseUrl}}/deliveries/{{deliveryId}}`  
**Auth:** `Bearer {{customerToken}}`

Confirm `collectionPoints` and `contractorRate`.

---

## 8. GET job (admin)

**GET** `{{baseUrl}}/admin/deliveries/{{deliveryId}}`  
**Auth:** `Bearer {{adminToken}}`

Same fields should be present.

---

## 9. Admin update job (Rate tab / extra collection)

**PUT** `{{baseUrl}}/admin/deliveries/{{deliveryId}}`  
**Auth:** `Bearer {{adminToken}}`

```json
{
  "collectionPoints": [
    "Depot A, Wrexham",
    "Collection B, Chester",
    "Collection C, Liverpool"
  ],
  "contractorRate": 52
}
```

**Check:** `collectionPoints` length 3, `contractorRate` = `52`.

Customer can do the same on **PUT** `{{baseUrl}}/deliveries/{{deliveryId}}`.

Clear job rate:

```json
{
  "contractorRate": null
}
```

---

## 10. Allocate — RATE_ON_JOB contractor

**POST** `{{baseUrl}}/admin/deliveries/{{deliveryId}}/allocate`  
**Auth:** `Bearer {{adminToken}}`

### 10a. Job already has a rate (from create/update)

```json
{
  "driverId": {{contractorId}}
}
```

Existing `contractorRate` is kept.

### 10b. Set / override this-job rate

```json
{
  "driverId": {{contractorId}},
  "contractorRate": 60
}
```

**Check**

- `data.contractorRate` = `60`
- `data.status` = `ALLOCATED`
- `data.driver.id` = contractor id
- `data.driver.driverProfile.payType` = `RATE_ON_JOB`

### 10c. RATE_ON_JOB with no rate anywhere → 400

First clear rate (step 9 `contractorRate: null`), then:

```json
{
  "driverId": {{contractorId}}
}
```

**Expect 400**

```json
{
  "success": false,
  "message": "contractorRate is required when allocating a Rate on Job contractor"
}
```

---

## 11. Allocate — WEEKLY contractor (pay structure vs this job)

**POST** `{{baseUrl}}/admin/deliveries/{{deliveryId}}/allocate`  
**Auth:** `Bearer {{adminToken}}`

### 11a. This-job rate (Rate tab)

```json
{
  "driverId": {{weeklyContractorId}},
  "contractorRate": 55
}
```

**Check:** `contractorRate` = `55`, `driver.driverProfile.payType` = `WEEKLY`

### 11b. Use contractor Daily/Weekly structure

```json
{
  "driverId": {{weeklyContractorId}},
  "contractorRate": null
}
```

**Check:** `contractorRate` = `null` (invoice later uses profile `rate`, e.g. 80)

Omit `contractorRate` entirely to **keep** whatever is already on the job.

---

## 12. Negative allocate / validation

**POST** `{{baseUrl}}/admin/deliveries/{{deliveryId}}/allocate`  
**Auth:** `Bearer {{adminToken}}`

| Body | Expect |
|------|--------|
| `{ "driverId": {{contractorId}}, "contractorRate": -1 }` | 400 Validation failed |
| `{ "driverId": {{contractorId}}, "collectionPoints": ["x"] }` | ignored / not part of allocate |
| missing `driverId` | 400 Driver ID is required |

---

## 13. Contractor login + accept + complete

Needed before invoice (job must be `DELIVERED`).

**POST** `{{baseUrl}}/auth/login`

```json
{
  "email": "roj.contractor01@example.com",
  "password": "Pass123!"
}
```

**Save:** `data.token` → `{{contractorToken}}`

**POST** `{{baseUrl}}/driver/deliveries/{{deliveryId}}/respond`  
**Auth:** `Bearer {{contractorToken}}`

```json
{
  "action": "accept"
}
```

**POST** `{{baseUrl}}/driver/deliveries/{{deliveryId}}/complete`  
**Auth:** `Bearer {{contractorToken}}`

```json
{
  "receivedBy": "Site manager"
}
```

**Check:** `status` = `DELIVERED`

For mixed-rate invoice, create a second job (steps 6–10 + accept/complete) with `contractorRate: 30.25`.

---

## 14. Generate contractor invoice

**POST** `{{baseUrl}}/driver/contractor/invoices/generate`  
**Auth:** `Bearer {{contractorToken}}`

Current pay period (RATE_ON_JOB uses this week, Mon–Sun):

```json
{}
```

Or a specific window that includes the completed jobs:

```json
{
  "periodStart": "2026-11-17",
  "periodEnd": "2026-11-23"
}
```

**Save:** `data.id` → `{{invoiceId}}`

**Check**

- `data.jobCount` = number of uninvoiced delivered jobs in the period
- `data.items[].amount` = that job’s `contractorRate` (not profile daily/weekly rate)
- `data.amount` = sum of line amounts

Example: jobs at 60 and 30.25 → `amount` = `90.25`

**RATE_ON_JOB job missing `contractorRate` → 400**

```
contractorRate is required on Rate on Job deliveries before invoicing: SPO-...
```

---

## 15. List / get invoice

**GET** `{{baseUrl}}/driver/contractor/invoices`  
**Auth:** `Bearer {{contractorToken}}`

**GET** `{{baseUrl}}/driver/contractor/invoices/{{invoiceId}}`  
**Auth:** `Bearer {{contractorToken}}`

**GET** `{{baseUrl}}/admin/contractor-invoices`  
**Auth:** `Bearer {{adminToken}}`

Delivery on each item should include `contractorRate`.

---

## 16. Dashboard earnings

**GET** `{{baseUrl}}/driver/contractor/dashboard`  
**Auth:** `Bearer {{contractorToken}}`

**Check:** `data.currentPeriod.currentEarnings` = sum of job rates in the current period (not `jobs × profile rate`).

`data.currentPeriod.label` = `Rate on Job` for `RATE_ON_JOB` contractors.

Recent completed jobs: `amount` is that job’s rate.

---

## Field rules (quick)

| Field | Type | Notes |
|-------|------|--------|
| `payType` | enum | `DAILY`, `WEEKLY`, `FORTNIGHTLY`, `FOUR_WEEKLY`, `RATE_ON_JOB` |
| `collectionPoints` | string[] | optional; trimmed; empty strings dropped |
| `contractorRate` | number \| null | optional; `>= 0`; `null` clears |

| Allocate `contractorRate` | Result |
|---------------------------|--------|
| number | save this-job rate |
| `null` | clear → use contractor Daily/Weekly profile rate |
| omitted | keep value already on the job |
| employee driver | always cleared |
| `RATE_ON_JOB` and rate missing on job + body | 400 |

---

## Postman collection skeleton

Create a collection **Rate on Job** with folders:

1. Auth
2. Contractor pay type
3. Create / update job
4. Allocate
5. Complete + invoice

Collection variable `baseUrl` = `http://localhost:3000/api`

Do not commit real passwords. Use your local/testing accounts only.
