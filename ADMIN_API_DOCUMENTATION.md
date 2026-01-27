# 🔐 M19 Logistics - Admin Panel API Documentation

Base URL: `http://localhost:3000/api/admin`

**Authentication Required:** All admin endpoints require a valid JWT token with **ADMIN** or **MANAGER** role.

```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

---

## 🔑 Admin Login

Use the pre-loaded admin account:

```bash
POST /api/auth/login
{
  "email": "admin@m19logistics.com",
  "password": "Admin123"
}
```

---

## 👥 USER MANAGEMENT

### 1. Get All Users
**GET** `/api/admin/users`

**Query Parameters:**
- `role`: `ADMIN`, `DRIVER`, `CUSTOMER`, `MANAGER`
- `isActive`: `true` or `false`
- `search`: Search by name or email

**Examples:**
```
GET /api/admin/users
GET /api/admin/users?role=CUSTOMER
GET /api/admin/users?isActive=true
GET /api/admin/users?search=topps
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 13,
      "fullName": "Topps Chester",
      "email": "topps022@toppstiles.co.uk",
      "phone": "01244123456",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "customerProfile": {
        "loginId": "T022",
        "storeName": "Topps Chester",
        "depotAddress": "4 Bumpers Lane, Sealand Ind Est, Chester, CH1 4LY",
        "pricingTier": {
          "name": "Tier B",
          "basePrice": "37.50",
          "vatRate": "20.00"
        }
      },
      "_count": {
        "deliveriesRequested": 5,
        "deliveriesAssigned": 0
      }
    }
  ],
  "count": 1
}
```

---

### 2. Get User by ID
**GET** `/api/admin/users/:id`

**Response:** Detailed user info with recent deliveries

---

### 3. Create User
**POST** `/api/admin/users`  
**Access:** ADMIN only

**Body (Customer):**
```json
{
  "email": "newcustomer@example.com",
  "password": "Password123",
  "fullName": "New Customer Store",
  "phone": "01234567890",
  "role": "CUSTOMER",
  "isActive": true,
  "storeName": "New Store Name",
  "depotAddress": "123 Main St, City, POST CODE",
  "loginId": "T999",
  "pricingTierId": 1
}
```

**Body (Driver):**
```json
{
  "email": "newdriver@m19logistics.com",
  "password": "Driver123",
  "fullName": "John Driver",
  "phone": "07123456789",
  "role": "DRIVER",
  "isActive": true,
  "vehicleRegistration": "AB12 CDE",
  "isActiveDriver": true
}
```

**Body (Manager):**
```json
{
  "email": "newmanager@m19logistics.com",
  "password": "Manager123",
  "fullName": "Jane Manager",
  "phone": "07987654321",
  "role": "MANAGER",
  "isActive": true,
  "accessScope": "FULL"
}
```

---

### 4. Update User
**PUT** `/api/admin/users/:id`  
**Access:** ADMIN only

**Body:**
```json
{
  "fullName": "Updated Name",
  "phone": "01234567890",
  "isActive": true,
  "customerProfile": {
    "pricingTierId": 2,
    "customBasePrice": "40.00"
  }
}
```

---

### 5. Delete User
**DELETE** `/api/admin/users/:id`  
**Access:** ADMIN only

**Note:** If user has deliveries, they will be deactivated instead of deleted.

---

### 6. Toggle User Status
**POST** `/api/admin/users/:id/toggle-status`  
**Access:** ADMIN only

Activates or deactivates a user account.

---

## 🚚 DELIVERY MANAGEMENT

### 1. Get All Deliveries (Admin View)
**GET** `/api/admin/deliveries`

**Query Parameters:**
- `status`: `ALL`, `RECEIVED`, `ALLOCATED`, `DELIVERED`, `CANCELLED`
- `startDate`: `2026-01-01`
- `endDate`: `2026-01-31`
- `customerId`: `13`
- `driverId`: `2`
- `search`: Search SPO number, address, customer name

**Examples:**
```
GET /api/admin/deliveries
GET /api/admin/deliveries?status=RECEIVED
GET /api/admin/deliveries?customerId=13
GET /api/admin/deliveries?driverId=2&status=ALLOCATED
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
      "status": "RECEIVED",
      "totalPrice": "50.00",
      "customer": {
        "id": 13,
        "fullName": "Topps Chester",
        "email": "topps022@toppstiles.co.uk",
        "customerProfile": {
          "loginId": "T022",
          "storeName": "Topps Chester"
        }
      },
      "driver": null
    }
  ],
  "count": 1
}
```

---

### 2. Allocate Delivery to Driver
**POST** `/api/admin/deliveries/:id/allocate`

**Body:**
```json
{
  "driverId": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery allocated successfully",
  "data": {
    "id": 1,
    "status": "ALLOCATED",
    "driverId": 2,
    "allocatedAt": "2026-01-26T12:00:00.000Z",
    "driver": {
      "fullName": "BK Driver",
      "email": "bk@m19logistics.com"
    }
  }
}
```

---

### 3. Update Delivery Status
**PUT** `/api/admin/deliveries/:id/status`

**Mark as Delivered:**
```json
{
  "status": "DELIVERED",
  "proofOfDelivery": "https://storage/proof.jpg",
  "signature": "https://storage/signature.jpg"
}
```

**Cancel Delivery:**
```json
{
  "status": "CANCELLED",
  "reason": "Customer requested cancellation"
}
```

---

## 💰 PRICING TIER MANAGEMENT

### 1. Get All Pricing Tiers
**GET** `/api/admin/pricing-tiers`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tier A",
      "description": "Premium tier for Newcastle",
      "basePrice": "41.67",
      "vatRate": "20.00",
      "weightUnit": 800,
      "maxDistance": 45,
      "surchargeRate": "0.50",
      "isDefault": false,
      "isActive": true,
      "_count": {
        "customers": 1
      }
    }
  ],
  "count": 2
}
```

---

### 2. Create Pricing Tier
**POST** `/api/admin/pricing-tiers`  
**Access:** ADMIN only

**Body:**
```json
{
  "name": "Tier C",
  "description": "Custom tier for special customers",
  "basePrice": "45.00",
  "vatRate": "20.00",
  "weightUnit": 800,
  "maxDistance": 45,
  "surchargeRate": "0.50",
  "isDefault": false
}
```

**Field Explanations:**
- `name`: Display name for the tier (e.g., "Tier A", "Premium")
- `description`: Brief description of the tier
- `basePrice`: Base price in £ per weight unit (e.g., 45.00)
- `vatRate`: VAT percentage (default: 20.00)
- `weightUnit`: Weight per block in kg (default: 800)
- `maxDistance`: Base distance included in miles (default: 45)
- `surchargeRate`: Additional charge rate for distance (0-1, where 0.5 = 50% of base price per maxDistance)
- `isDefault`: Set as default tier for new customers

**Pricing Calculation Example:**
- Base Price: £45.00 per 800kg
- Max Distance: 45 miles included
- Surcharge Rate: 0.5 (50%)
- If delivery is 90 miles (2 × 45mi zones) and 1600kg (2 × 800kg blocks):
  - Base: £45 × 2 blocks = £90
  - Surcharge: £45 × 2 blocks × 0.5 × 1 extra zone = £45
  - Subtotal: £135
  - VAT (20%): £27
  - **Total: £162**

---

### 3. Update Pricing Tier
**PUT** `/api/admin/pricing-tiers/:id`  
**Access:** ADMIN only

**Body:**
```json
{
  "basePrice": "42.00",
  "description": "Updated pricing",
  "surchargeRate": "0.60",
  "isDefault": true
}
```

---

### 4. Delete Pricing Tier
**DELETE** `/api/admin/pricing-tiers/:id`  
**Access:** ADMIN only

**Note:** Cannot delete if customers are using this tier.

---

## 🧾 INVOICE MANAGEMENT

### 1. Get All Invoices
**GET** `/api/admin/invoices`

**Query Parameters:**
- `customerId`: `13`
- `isPaid`: `true` or `false`
- `startDate`: `2026-01-01`
- `endDate`: `2026-01-31`

**Examples:**
```
GET /api/admin/invoices
GET /api/admin/invoices?isPaid=false
GET /api/admin/invoices?customerId=13
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invoiceNumber": "T0327",
      "invoiceDate": "2026-01-26T00:00:00.000Z",
      "weekStartDate": "2026-01-20T00:00:00.000Z",
      "weekEndDate": "2026-01-26T00:00:00.000Z",
      "subtotal": "41.67",
      "vatTotal": "8.33",
      "grandTotal": "50.00",
      "isPaid": false,
      "customer": {
        "fullName": "Topps Chester",
        "email": "topps022@toppstiles.co.uk",
        "customerProfile": {
          "loginId": "T022",
          "storeName": "Topps Chester"
        }
      },
      "items": [
        {
          "description": "Cust. Ref: SPO013349 / 1/20/2026 / 4 Bumpers Lane, Chester",
          "quantity": 1,
          "unitCost": "41.67",
          "vatAmount": "8.33",
          "total": "50.00"
        }
      ]
    }
  ],
  "count": 1
}
```

---

### 2. Generate Invoice
**POST** `/api/admin/invoices/generate`

**Body:**
```json
{
  "customerId": 13,
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
    "grandTotal": "135.00",
    "items": [...]
  }
}
```

**Note:** Only generates invoices for DELIVERED deliveries that haven't been invoiced yet.

---

### 3. Mark Invoice as Paid
**POST** `/api/admin/invoices/:id/mark-paid`

**Response:**
```json
{
  "success": true,
  "message": "Invoice marked as paid",
  "data": {
    "id": 1,
    "isPaid": true,
    "paidAt": "2026-01-26T14:30:00.000Z"
  }
}
```

---

### 4. Add Extra Charge to Invoice
**POST** `/api/admin/invoices/:id/extra-charge`

**Body:**
```json
{
  "description": "Additional handling fee",
  "quantity": 1,
  "unitCost": 25.00,
  "vatAmount": 5.00,
  "total": 30.00
}
```

**Note:** Cannot modify paid invoices.

---

## 📅 SLOT AVAILABILITY MANAGEMENT

### 1. Get Slot Availability
**GET** `/api/admin/slots`

**Query Parameters:**
- `date`: `2026-01-27`
- `timeSlot`: `AM`, `PM`, `SAME_DAY`

**Examples:**
```
GET /api/admin/slots
GET /api/admin/slots?date=2026-01-27
GET /api/admin/slots?timeSlot=AM
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2026-01-27T00:00:00.000Z",
      "timeSlot": "AM",
      "maxCapacity": 10,
      "currentBookings": 3,
      "isAvailable": true
    }
  ],
  "count": 1
}
```

---

### 2. Set Slot Availability
**POST** `/api/admin/slots`

**Body:**
```json
{
  "date": "2026-01-28",
  "timeSlot": "AM",
  "maxCapacity": 15,
  "isAvailable": true
}
```

**Note:** Updates existing slot or creates new one if it doesn't exist.

---

## 📊 ANALYTICS DASHBOARD

### 1. Overall Analytics
**GET** `/api/admin/analytics`

**Query Parameters:**
- `startDate`: `2026-01-01`
- `endDate`: `2026-01-31`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDeliveries": 150,
      "totalRevenue": "6750.00",
      "totalInvoices": 25,
      "paidInvoices": 18,
      "unpaidInvoices": 7,
      "activeCustomers": 6,
      "activeDrivers": 3
    },
    "deliveriesByStatus": {
      "received": 10,
      "allocated": 5,
      "delivered": 130,
      "cancelled": 5
    },
    "recentDeliveries": [...]
  }
}
```

---

### 2. Driver Performance
**GET** `/api/admin/analytics/drivers`

**Query Parameters:**
- `startDate`: `2026-01-01`
- `endDate`: `2026-01-31`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "BK Driver",
      "email": "bk@m19logistics.com",
      "phone": "07123456789",
      "vehicleRegistration": "M19 LOG",
      "totalAssigned": 45,
      "completed": 42,
      "pending": 3,
      "completionRate": "93.33"
    }
  ],
  "count": 1
}
```

---

### 3. Customer Analytics
**GET** `/api/admin/analytics/customers`

**Query Parameters:**
- `startDate`: `2026-01-01`
- `endDate`: `2026-01-31`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 13,
      "name": "Topps Chester",
      "email": "topps022@toppstiles.co.uk",
      "loginId": "T022",
      "storeName": "Topps Chester",
      "pricingTier": "Tier B",
      "totalDeliveries": 25,
      "totalSpent": "1125.00",
      "averageOrderValue": "45.00"
    }
  ],
  "count": 6
}
```

---

## 🧪 Complete Admin Testing Flow

### Step 1: Login as Admin
```bash
POST http://localhost:3000/api/auth/login
{
  "email": "admin@m19logistics.com",
  "password": "Admin123"
}
```

### Step 2: View Analytics Dashboard
```bash
GET http://localhost:3000/api/admin/analytics
```

### Step 3: View All Pending Deliveries
```bash
GET http://localhost:3000/api/admin/deliveries?status=RECEIVED
```

### Step 4: Allocate Delivery to Driver
```bash
POST http://localhost:3000/api/admin/deliveries/1/allocate
{
  "driverId": 2
}
```

### Step 5: View Driver Performance
```bash
GET http://localhost:3000/api/admin/analytics/drivers
```

### Step 6: Mark Delivery as Delivered
```bash
PUT http://localhost:3000/api/admin/deliveries/1/status
{
  "status": "DELIVERED"
}
```

### Step 7: Generate Invoice
```bash
POST http://localhost:3000/api/admin/invoices/generate
{
  "customerId": 13,
  "weekStartDate": "2026-01-20",
  "weekEndDate": "2026-01-26"
}
```

### Step 8: View All Unpaid Invoices
```bash
GET http://localhost:3000/api/admin/invoices?isPaid=false
```

### Step 9: Mark Invoice as Paid
```bash
POST http://localhost:3000/api/admin/invoices/1/mark-paid
```

### Step 10: Create New Customer
```bash
POST http://localhost:3000/api/admin/users
{
  "email": "newstore@toppstiles.co.uk",
  "password": "Password123",
  "fullName": "Topps New Store",
  "phone": "01234567890",
  "role": "CUSTOMER",
  "storeName": "Topps New Store",
  "depotAddress": "123 New Street, City, POST CODE",
  "loginId": "T999",
  "pricingTierId": 2
}
```

---

## 🔒 Access Control

| Feature | ADMIN | MANAGER |
|---------|-------|---------|
| View Users/Deliveries/Invoices | ✅ | ✅ |
| Allocate Deliveries | ✅ | ✅ |
| Update Delivery Status | ✅ | ✅ |
| Generate Invoices | ✅ | ✅ |
| Mark Invoice as Paid | ✅ | ✅ |
| Add Extra Charges | ✅ | ✅ |
| Manage Slots | ✅ | ✅ |
| View Analytics | ✅ | ✅ |
| **Create/Update/Delete Users** | ✅ | ❌ |
| **Manage Pricing Tiers** | ✅ | ❌ |

---

## 📝 Notes

- **Soft Delete:** Users with deliveries are deactivated instead of deleted
- **Invoice Generation:** Only creates invoices for DELIVERED deliveries not already invoiced
- **Driver Allocation:** Only RECEIVED deliveries can be allocated
- **Pricing Tiers:** Cannot delete tiers that are in use by customers
- **Slot Management:** Automatically updates or creates slots based on date and time slot combination

---

**✅ Admin panel is fully functional and ready for testing!**
