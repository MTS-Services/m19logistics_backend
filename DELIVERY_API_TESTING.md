# 📦 M19 Logistics - Delivery & Invoice API Testing

Base URL: `http://localhost:3000`

---

## 🔐 Authentication Required

All delivery and invoice endpoints require authentication. Include the Bearer token in headers:

```
Authorization: Bearer <your-token-here>
Content-Type: application/json
```

**Get your token by logging in first:**
```bash
POST /api/auth/login
{
  "email": "topps022@toppstiles.co.uk",
  "password": "Password022"
}
```

---

## 📊 Delivery Statistics

### Get Dashboard Stats
**GET** `/api/deliveries/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": 1,
    "allocated": 1,
    "completed": 1,
    "cancelled": 23,
    "total": 26
  }
}
```

---

## 📦 Delivery Management

### 1. Create Delivery Request
**POST** `/api/deliveries`

**Body:**
```json
{
  "spoNumber": "SPO013349",
  "deliveryDate": "2026-01-20",
  "timeSlot": "AM",
  "weight": 800,
  "deliveryAddress": "4 Bumpers Lane, Chester, CH1 4LY",
  "customerName": "John Smith",
  "customerPhone": "07123456789",
  "requestedBy": "Sarah Williams",
  "specialInstructions": "Please call before arrival"
}
```

**Time Slots:** `AM`, `PM`, `SAME_DAY`

**Success Response:**
```json
{
  "success": true,
  "message": "Delivery request created successfully",
  "data": {
    "id": 1,
    "spoNumber": "SPO013349",
    "status": "RECEIVED",
    "distanceFromDepot": 25,
    "totalPrice": 45.00,
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Deliveries (with Filters)
**GET** `/api/deliveries`

**Query Parameters:**
- `status`: `ALL`, `RECEIVED`, `ALLOCATED`, `DELIVERED`, `CANCELLED`
- `startDate`: `2026-01-01`
- `endDate`: `2026-01-31`
- `search`: Search term

**Examples:**
```
GET /api/deliveries
GET /api/deliveries?status=RECEIVED
GET /api/deliveries?status=DELIVERED
GET /api/deliveries?startDate=2026-01-01&endDate=2026-01-31
GET /api/deliveries?search=SPO013349
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "spoNumber": "SPO013349",
      "deliveryDate": "2026-01-20T00:00:00.000Z",
      "timeSlot": "AM",
      "weight": 800,
      "deliveryAddress": "4 Bumpers Lane, Chester, CH1 4LY",
      "customerName": "John Smith",
      "customerPhone": "07123456789",
      "status": "RECEIVED",
      "totalPrice": 45.00,
      "distanceFromDepot": 25,
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Delivery by ID
**GET** `/api/deliveries/:id`

**Example:** `GET /api/deliveries/1`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "spoNumber": "SPO013349",
    "deliveryDate": "2026-01-20T00:00:00.000Z",
    "timeSlot": "AM",
    "weight": 800,
    "deliveryAddress": "4 Bumpers Lane, Chester, CH1 4LY",
    "customerName": "John Smith",
    "customerPhone": "07123456789",
    "requestedBy": "Sarah Williams",
    "specialInstructions": "Please call before arrival",
    "status": "RECEIVED",
    "distanceFromDepot": 25,
    "calculatedBasePrice": 37.50,
    "distanceSurcharge": 0,
    "subtotal": 37.50,
    "vatAmount": 7.50,
    "totalPrice": 45.00,
    "customer": {
      "fullName": "Topps Chester",
      "email": "topps022@toppstiles.co.uk",
      "depotAddress": "4 Bumpers Lane, Sealand Ind Est, Chester, CH1 4LY"
    },
    "driver": null,
    "extraCharges": []
  }
}
```

---

### 4. Update Delivery
**PUT** `/api/deliveries/:id`

**⚠️ Note:** Can only edit deliveries with `RECEIVED` status

**Body (update any field):**
```json
{
  "deliveryDate": "2026-01-21",
  "timeSlot": "PM",
  "deliveryAddress": "Updated Address, Chester, CH1 5XY",
  "specialInstructions": "New instructions here"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Delivery updated successfully",
  "data": {
    "id": 1,
    "deliveryDate": "2026-01-21T00:00:00.000Z",
    "timeSlot": "PM",
    "deliveryAddress": "Updated Address, Chester, CH1 5XY"
  }
}
```

**Error Response (if already allocated):**
```json
{
  "success": false,
  "message": "Cannot edit delivery once it has been allocated"
}
```

---

### 5. Cancel Delivery
**POST** `/api/deliveries/:id/cancel`

**⚠️ Note:** Can only cancel `RECEIVED` or `ALLOCATED` deliveries

**Body:**
```json
{
  "reason": "Customer requested cancellation due to store closure"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Delivery cancelled successfully",
  "data": {
    "id": 1,
    "status": "CANCELLED",
    "cancelledAt": "2026-01-15T11:00:00.000Z",
    "cancellationReason": "Customer requested cancellation due to store closure"
  }
}
```

---

### 6. Delete Delivery
**DELETE** `/api/deliveries/:id`

**⚠️ Note:** Can only delete deliveries with `RECEIVED` status

**Success Response:**
```json
{
  "success": true,
  "message": "Delivery deleted successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Can only delete pending deliveries"
}
```

---

## 🧾 Invoice Management

### 1. Get All Invoices
**GET** `/api/invoices`

**Query Parameters:**
- `startDate`: `2026-01-01`
- `endDate`: `2026-01-31`
- `isPaid`: `true` or `false`

**Examples:**
```
GET /api/invoices
GET /api/invoices?isPaid=false
GET /api/invoices?startDate=2026-01-01&endDate=2026-01-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invoiceNumber": "T0326",
      "invoiceDate": "2026-01-12T00:00:00.000Z",
      "weekStartDate": "2026-01-06T00:00:00.000Z",
      "weekEndDate": "2026-01-12T00:00:00.000Z",
      "subtotal": 112.50,
      "vatTotal": 22.50,
      "grandTotal": 135.00,
      "isPaid": true,
      "paidAt": "2026-01-15T10:00:00.000Z",
      "paymentTerms": "30 Days (End of Month)",
      "items": [
        {
          "id": 1,
          "description": "Cust. Ref: SPO013349 / 1/10/2026 / 4 Bumpers Lane, Chester",
          "quantity": 1,
          "unitCost": 37.50,
          "vatAmount": 7.50,
          "total": 45.00,
          "isAdditional": false
        }
      ]
    }
  ],
  "count": 1
}
```

---

### 2. Get Invoice by ID
**GET** `/api/invoices/:id`

**Example:** `GET /api/invoices/1`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "T0326",
    "invoiceDate": "2026-01-12T00:00:00.000Z",
    "weekStartDate": "2026-01-06T00:00:00.000Z",
    "weekEndDate": "2026-01-12T00:00:00.000Z",
    "subtotal": 112.50,
    "vatTotal": 22.50,
    "grandTotal": 135.00,
    "isPaid": true,
    "customer": {
      "fullName": "Topps Chester",
      "email": "topps022@toppstiles.co.uk",
      "depotAddress": "4 Bumpers Lane, Sealand Ind Est, Chester, CH1 4LY"
    },
    "items": [
      {
        "description": "Cust. Ref: SPO013349 / 1/10/2026 / 4 Bumpers Lane, Chester",
        "unitCost": 37.50,
        "vatAmount": 7.50,
        "total": 45.00,
        "delivery": {
          "spoNumber": "SPO013349",
          "deliveryDate": "2026-01-10T00:00:00.000Z",
          "deliveryAddress": "4 Bumpers Lane, Chester, CH1 4LY"
        }
      }
    ]
  }
}
```

---

### 3. Get Invoice by Number
**GET** `/api/invoices/number/:invoiceNumber`

**Example:** `GET /api/invoices/number/T0326`

**Response:** Same as Get Invoice by ID

---

## 🧪 Complete Testing Flow

### Step 1: Login as Customer
```bash
POST http://localhost:3000/api/auth/login
{
  "email": "topps022@toppstiles.co.uk",
  "password": "Password022"
}
```
**Copy the token from response**

---

### Step 2: Get Dashboard Statistics
```bash
GET http://localhost:3000/api/deliveries/stats
Headers: Authorization: Bearer <token>
```

---

### Step 3: Create a Delivery Request
```bash
POST http://localhost:3000/api/deliveries
Headers: Authorization: Bearer <token>
Body:
{
  "spoNumber": "SPO013350",
  "deliveryDate": "2026-01-25",
  "timeSlot": "AM",
  "weight": 800,
  "deliveryAddress": "Unit 1, Test Address, Chester CH1 4LY",
  "customerName": "John Smith",
  "customerPhone": "07123456789",
  "requestedBy": "Sarah Williams",
  "specialInstructions": "Call before delivery"
}
```

---

### Step 4: View All Deliveries
```bash
GET http://localhost:3000/api/deliveries
Headers: Authorization: Bearer <token>
```

---

### Step 5: Filter by Status
```bash
# Pending deliveries
GET http://localhost:3000/api/deliveries?status=RECEIVED

# Completed deliveries
GET http://localhost:3000/api/deliveries?status=DELIVERED

# Cancelled deliveries
GET http://localhost:3000/api/deliveries?status=CANCELLED
```

---

### Step 6: View Delivery Details
```bash
GET http://localhost:3000/api/deliveries/1
Headers: Authorization: Bearer <token>
```

---

### Step 7: Edit Delivery
```bash
PUT http://localhost:3000/api/deliveries/1
Headers: Authorization: Bearer <token>
Body:
{
  "deliveryDate": "2026-01-26",
  "timeSlot": "PM",
  "specialInstructions": "Updated: Please call 30 mins before arrival"
}
```

---

### Step 8: Cancel Delivery
```bash
POST http://localhost:3000/api/deliveries/1/cancel
Headers: Authorization: Bearer <token>
Body:
{
  "reason": "Customer requested cancellation - store closed"
}
```

---

### Step 9: View Invoices
```bash
GET http://localhost:3000/api/invoices
Headers: Authorization: Bearer <token>
```

---

### Step 10: View Specific Invoice
```bash
GET http://localhost:3000/api/invoices/1
Headers: Authorization: Bearer <token>
```

---

## 📋 Delivery Status Workflow

```
RECEIVED (Pending)
    ↓
ALLOCATED (In Progress)
    ↓
DELIVERED (Completed)

Or:
CANCELLED (at any stage before DELIVERED)
```

**Customer Permissions:**
- ✅ Create delivery: Any time
- ✅ Edit delivery: Only `RECEIVED` status
- ✅ Cancel delivery: `RECEIVED` or `ALLOCATED` status
- ✅ Delete delivery: Only `RECEIVED` status

---

## 💰 Pricing Calculation

**Base Pricing:**
- Tier A (Newcastle): £41.67 + 20% VAT = £50.00 per 800kg
- Tier B (Others): £37.50 + 20% VAT = £45.00 per 800kg

**Weight Calculation:**
- Every 800kg = 1 block
- 801-1600kg = 2 blocks (£90.00 for Tier B)
- 1601-2400kg = 3 blocks (£135.00 for Tier B)

**Distance Surcharge:**
- Base: Up to 45 miles included
- Extra: £18.75 per 45 miles per 800kg block (for Tier B)

**Example:**
- Weight: 1600kg (2 blocks)
- Distance: 90 miles (1 extra 45-mile zone)
- Base: £75.00
- Surcharge: £37.50
- Subtotal: £112.50
- VAT: £22.50
- **Total: £135.00**

---

## 🔑 Pre-loaded Customer Accounts for Testing

| Customer | Email | Password | Tier | Base Price |
|----------|-------|----------|------|------------|
| Topps Chester | topps022@toppstiles.co.uk | Password022 | B | £37.50 |
| Topps Nantwich | topps226@toppstiles.co.uk | Password226 | B | £37.50 |
| Topps Newcastle | topps167@toppstiles.co.uk | Password167 | **A** | £41.67 |
| Topps Northwich | topps143@toppstiles.co.uk | Password143 | B | £37.50 |
| Topps Rhyl | topps211@toppstiles.co.uk | Password211 | B | £37.50 |
| Topps Wrexham | topps217@toppstiles.co.uk | Password217 | B | £37.50 |

---

## ⚠️ Error Responses

### 400 - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "weight",
      "message": "Weight must be greater than 0"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions.",
  "requiredRole": ["CUSTOMER"],
  "userRole": "DRIVER"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Delivery not found"
}
```

---

**✅ All endpoints are ready for testing!**

**Server:** `npm run dev`  
**Port:** 3000  
**Base URL:** `http://localhost:3000`
