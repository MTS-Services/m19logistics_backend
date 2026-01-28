# Manager Endpoints - M19 Logistics

Manager role can access most admin endpoints for delivery oversight and team management.

## Base URL
```
http://localhost:3000/api/admin
```

## Authentication
All endpoints require:
```
Authorization: Bearer YOUR_MANAGER_TOKEN
```

---

## 📋 Manager Access Overview

Managers share admin routes with **limited access**:
- ✅ **Full Access:** Deliveries, Analytics, Slot Management, Invoices (view only)
- ❌ **Restricted:** User Management (ADMIN only), Pricing Tiers (ADMIN only)

---

## 🚚 Delivery Management

### 1. Get All Deliveries
**GET** `/admin/deliveries`

Query Parameters:
- `status` - RECEIVED, ALLOCATED, DELIVERED, CANCELLED
- `customerId` - Filter by customer
- `driverId` - Filter by driver
- `startDate` - YYYY-MM-DD
- `endDate` - YYYY-MM-DD

```bash
GET /admin/deliveries?status=ALLOCATED&startDate=2026-01-20
```

### 2. Allocate Delivery to Driver
**POST** `/admin/deliveries/:id/allocate`

```json
{
  "driverId": 5
}
```

### 3. Update Delivery Status
**PUT** `/admin/deliveries/:id/status`

```json
{
  "status": "ALLOCATED"
}
```

### 4. Add Extra Charge to Delivery
**POST** `/admin/deliveries/:id/extra-charges`

```json
{
  "description": "Congestion charge",
  "amount": 15.00
}
```

### 5. Remove Extra Charge
**DELETE** `/admin/deliveries/:id/extra-charges/:chargeId`

### 6. Get Delivery Extra Charges
**GET** `/admin/deliveries/:id/extra-charges`

---

## 👥 User Management (VIEW ONLY)

### 1. Get All Users
**GET** `/admin/users`

Query Parameters:
- `role` - ADMIN, DRIVER, CUSTOMER, MANAGER
- `isActive` - true/false
- `search` - Search by name or email

```bash
GET /admin/users?role=DRIVER&isActive=true
```

### 2. Get User Details
**GET** `/admin/users/:id`

**Note:** Managers can VIEW users but CANNOT create, update, or delete (ADMIN only)

---

## 💰 Invoice Management (VIEW ONLY)

### 1. Get All Invoices
**GET** `/admin/invoices`

Query Parameters:
- `customerId` - Filter by customer
- `isPaid` - true/false
- `startDate` - YYYY-MM-DD
- `endDate` - YYYY-MM-DD

```bash
GET /admin/invoices?isPaid=false&startDate=2026-01-01
```

### 2. Get Invoice Details
**GET** `/admin/invoices/:id`

### 3. Generate Invoice for Customer
**POST** `/admin/invoices/generate`

```json
{
  "customerId": 15,
  "weekStartDate": "2026-01-20",
  "weekEndDate": "2026-01-26"
}
```

### 4. Generate Invoices for All Customers
**POST** `/admin/invoices/generate-all`

```json
{
  "weekStartDate": "2026-01-20",
  "weekEndDate": "2026-01-26"
}
```

### 5. Generate Last Week's Invoices
**POST** `/admin/invoices/generate-last-week`

No request body needed.

### 6. Edit/Update Invoice
**PUT** `/admin/invoices/:id`

```json
{
  "invoiceNumber": "T0327",
  "status": "Sent",
  "customerRef": "PO-12345",
  "items": [
    {
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

### 7. Mark Invoice as Paid
**POST** `/admin/invoices/:id/mark-paid`

**Note:** Managers can generate and view invoices but pricing/payment operations may be restricted to ADMIN.

---

## 📊 Dashboard & Analytics

### 1. Get Dashboard Summary
**GET** `/admin/dashboard`

Returns:
- Total Bookings (all-time)
- Active Customers
- Active Drivers
- Revenue (MTD)
- Status Cards (Pending, In Progress, Completed)
- Recent Bookings

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalBookings": {
        "count": 248,
        "change": 12,
        "changeText": "12% from last month"
      },
      "activeCustomers": {
        "count": 42,
        "change": 8,
        "changeText": "8% from last month"
      },
      "activeDrivers": {
        "count": 12,
        "change": 0,
        "changeText": "0% from last month"
      },
      "revenue": {
        "amount": 8450.00,
        "formatted": "£8,450",
        "change": 18,
        "changeText": "18% from last month"
      }
    },
    "statusCards": {
      "pending": {
        "count": 8,
        "label": "Pending Bookings"
      },
      "inProgress": {
        "count": 15,
        "label": "In Progress"
      },
      "completedToday": {
        "count": 23,
        "label": "Completed"
      }
    },
    "recentBookings": [...]
  }
}
```

### 2. Get Analytics
**GET** `/admin/analytics?startDate=2026-01-01&endDate=2026-01-31`

### 3. Get Driver Performance
**GET** `/admin/analytics/drivers?startDate=2026-01-01&endDate=2026-01-31`

### 4. Get Customer Analytics
**GET** `/admin/analytics/customers?startDate=2026-01-01&endDate=2026-01-31`

---

## 📅 Slot Availability Management

### 1. Get Slot Availability
**GET** `/admin/slots?date=2026-01-30&timeSlot=AM`

Query Parameters:
- `date` - YYYY-MM-DD
- `timeSlot` - AM, PM, SAME_DAY

### 2. Set Slot Availability
**POST** `/admin/slots`

```json
{
  "date": "2026-01-30",
  "timeSlot": "AM",
  "maxCapacity": 10,
  "isAvailable": true
}
```

---

## 📧 Contact & Enquiry Management

### 1. Get All Contact Messages
**GET** `/admin/contacts`

Query Parameters:
- `isRead` - true/false
- `startDate` - YYYY-MM-DD
- `endDate` - YYYY-MM-DD

### 2. Get Contact Message Details
**GET** `/admin/contacts/:id`

### 3. Mark Contact as Read
**POST** `/admin/contacts/:id/mark-read`

### 4. Delete Contact Message
**DELETE** `/admin/contacts/:id`

### 5. Get All Enquiries
**GET** `/admin/enquiries`

Query Parameters:
- `isRead` - true/false
- `startDate` - YYYY-MM-DD
- `endDate` - YYYY-MM-DD

### 6. Get Enquiry Details
**GET** `/admin/enquiries/:id`

### 7. Mark Enquiry as Read
**POST** `/admin/enquiries/:id/mark-read`

### 8. Delete Enquiry
**DELETE** `/admin/enquiries/:id`

---

## ❌ ADMIN-ONLY Endpoints (Restricted for Managers)

Managers **CANNOT** access these endpoints:

### User Management
- ❌ **POST** `/admin/users` - Create user (ADMIN only)
- ❌ **PUT** `/admin/users/:id` - Update user (ADMIN only)
- ❌ **DELETE** `/admin/users/:id` - Delete user (ADMIN only)
- ❌ **POST** `/admin/users/:id/toggle-status` - Toggle user status (ADMIN only)

### Pricing Tiers
- ❌ **POST** `/admin/pricing-tiers` - Create pricing tier (ADMIN only)
- ❌ **PUT** `/admin/pricing-tiers/:id` - Update pricing tier (ADMIN only)
- ❌ **DELETE** `/admin/pricing-tiers/:id` - Delete pricing tier (ADMIN only)

Managers can **VIEW** pricing tiers:
- ✅ **GET** `/admin/pricing-tiers` - View all pricing tiers

---

## 🔑 Manager Profile Management

Managers can update their own profile:

### Update Profile
**PATCH** `/api/auth/profile`

```json
{
  "fullName": "Jane Manager",
  "phone": "+447700900456",
  "officeAddress": "789 Office Park, Birmingham",
  "accessScope": "Regional",
  "assignedStoreCount": 15
}
```

With profile picture:
```
Content-Type: multipart/form-data

profilePicture: [file]
fullName: "Jane Manager"
officeAddress: "789 Office Park"
```

---

## 📋 Common Manager Workflows

### Workflow 1: Allocate Pending Deliveries
```bash
# 1. Get pending deliveries
GET /admin/deliveries?status=RECEIVED

# 2. Allocate to driver
POST /admin/deliveries/101/allocate
{
  "driverId": 5
}

# 3. Verify allocation
GET /admin/deliveries/101
```

### Workflow 2: Monitor Driver Performance
```bash
# 1. Get all active drivers
GET /admin/users?role=DRIVER&isActive=true

# 2. Check driver performance
GET /admin/analytics/drivers?startDate=2026-01-01&endDate=2026-01-31

# 3. View specific driver's deliveries
GET /admin/deliveries?driverId=5&status=DELIVERED
```

### Workflow 3: Generate Weekly Invoices
```bash
# 1. Check completed deliveries for the week
GET /admin/deliveries?status=DELIVERED&startDate=2026-01-20&endDate=2026-01-26

# 2. Generate invoices for all customers
POST /admin/invoices/generate-last-week

# 3. Review generated invoices
GET /admin/invoices?startDate=2026-01-20
```

### Workflow 4: Handle Extra Charges
```bash
# 1. Get delivery details
GET /admin/deliveries/101

# 2. Add congestion charge
POST /admin/deliveries/101/extra-charges
{
  "description": "London congestion charge",
  "amount": 15.00
}

# 3. Verify charges
GET /admin/deliveries/101/extra-charges
```

### Workflow 5: Review Customer Enquiries
```bash
# 1. Get unread enquiries
GET /admin/enquiries?isRead=false

# 2. View enquiry details
GET /admin/enquiries/5

# 3. Mark as read after handling
POST /admin/enquiries/5/mark-read
```

---

## 🔐 Authentication

### Login as Manager
**POST** `/api/auth/login`

```json
{
  "email": "manager@m19logistics.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 3,
      "email": "manager@m19logistics.com",
      "fullName": "Jane Manager",
      "role": "MANAGER",
      "managerProfile": {
        "officeAddress": "789 Office Park, Birmingham",
        "accessScope": "Regional",
        "assignedStoreCount": 15
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

---

## 📊 Manager vs Admin Permissions

| Feature | Manager | Admin |
|---------|---------|-------|
| View Deliveries | ✅ | ✅ |
| Allocate Deliveries | ✅ | ✅ |
| Update Delivery Status | ✅ | ✅ |
| Add Extra Charges | ✅ | ✅ |
| View Users | ✅ | ✅ |
| Create/Edit/Delete Users | ❌ | ✅ |
| View Invoices | ✅ | ✅ |
| Generate Invoices | ✅ | ✅ |
| Edit Invoices | ✅ | ✅ |
| View Pricing Tiers | ✅ | ✅ |
| Create/Edit Pricing Tiers | ❌ | ✅ |
| View Analytics | ✅ | ✅ |
| Manage Slots | ✅ | ✅ |
| View Contacts/Enquiries | ✅ | ✅ |
| Delete Contacts/Enquiries | ✅ | ✅ |

---

## 🎯 Quick Reference

**Manager Dashboard:**
```
GET /admin/dashboard
```

**Allocate Delivery:**
```
POST /admin/deliveries/:id/allocate
Body: { "driverId": 5 }
```

**Generate Invoices:**
```
POST /admin/invoices/generate-last-week
```

**View Analytics:**
```
GET /admin/analytics/drivers
```

**Handle Enquiries:**
```
GET /admin/enquiries?isRead=false
POST /admin/enquiries/:id/mark-read
```

---

For complete API documentation, see [POSTMAN_API_TESTING.md](POSTMAN_API_TESTING.md).
