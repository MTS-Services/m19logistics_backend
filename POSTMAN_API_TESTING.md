# M19 Logistics API - Postman Testing Guide

Complete API endpoint testing guide for M19 Logistics Courier Management System.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require Bearer token in headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Public Endpoints](#public-endpoints)
3. [Customer Endpoints](#customer-endpoints)
4. [Driver Endpoints](#driver-endpoints)
5. [Manager Endpoints](#manager-endpoints)
6. [Admin Endpoints](#admin-endpoints)

---

## Authentication Endpoints

### 1. Register New User
**POST** `/auth/register`

```json
{
  "email": "customer@example.com",
  "username": "customer1",
  "password": "Pass123!",
  "fullName": "John Customer",
  "phone": "+447700900000",
  "role": "CUSTOMER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": 1, "email": "customer@example.com", "role": "CUSTOMER" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### 2. Login
**POST** `/auth/login`

```json
{
  "email": "customer@example.com",
  "password": "Pass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "customer@example.com",
      "fullName": "John Customer",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### 3. Get Current User Profile
**GET** `/auth/me`

Headers: `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "customer@example.com",
    "fullName": "John Customer",
    "role": "CUSTOMER",
    "customerProfile": {
      "loginId": "TOPPS001",
      "storeName": "Topps Tiles Store 1",
      "pricingTier": {
        "name": "Tier 1",
        "basePrice": "37.50"
      }
    }
  }
}
```

### 4. Change Password
**PUT** `/auth/change-password`

Headers: `Authorization: Bearer TOKEN`

```json
{
  "currentPassword": "Pass123!",
  "newPassword": "NewPass456!"
}
```

---

## Public Endpoints

No authentication required for these endpoints.

### 1. Submit Contact Form
**POST** `/public/contact`

**Use Case:** Anyone can send a contact message

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+447700900123",
  "message": "I would like to inquire about your delivery services for our business."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for contacting us. We will get back to you soon.",
  "data": {
    "id": 1,
    "createdAt": "2026-01-28T00:00:00.000Z"
  }
}
```

### 2. Submit Enquiry Form
**POST** `/public/enquiry`

**Use Case:** Anyone can send a business enquiry

```json
{
  "fullName": "John Doe",
  "companyName": "Your Company Ltd",
  "email": "john@example.com",
  "phoneNumber": "07971 415430",
  "subject": "What is your enquiry about?",
  "message": "Please provide details about your enquiry..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your enquiry. We will respond shortly.",
  "data": {
    "id": 1,
    "createdAt": "2026-01-28T00:00:00.000Z"
  }
}
```

---

## Customer Endpoints

### 1. Create Delivery Request
**POST** `/deliveries`

Headers: `Authorization: Bearer CUSTOMER_TOKEN`

```json
{
  "deliveryDate": "2026-01-30",
  "timeSlot": "AM",
  "weight": 1200,
  "deliveryAddress": "123 Main Street, London, SW1A 1AA",
  "customerName": "John Doe",
  "customerPhone": "+447700900123",
  "spoNumber": "SPO-2026-001",
  "requestedBy": "Jane Manager",
  "specialInstructions": "Please call before delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery created successfully",
  "data": {
    "id": 1,
    "deliveryDate": "2026-01-30T00:00:00.000Z",
    "timeSlot": "AM",
    "status": "RECEIVED",
    "totalPrice": "67.50",
    "customer": {
      "fullName": "John Customer",
      "customerProfile": {
        "loginId": "TOPPS001"
      }
    }
  }
}
```

### 2. Get My Deliveries
**GET** `/deliveries?status=ALLOCATED&startDate=2026-01-01&endDate=2026-01-31`

Headers: `Authorization: Bearer CUSTOMER_TOKEN`

Query Parameters:
- `status`: ALL, RECEIVED, ALLOCATED, DELIVERED, CANCELLED
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `search`: Search term

### 3. Get Delivery Details
**GET** `/deliveries/:id`

Headers: `Authorization: Bearer CUSTOMER_TOKEN`

### 4. Update Delivery (RECEIVED status only)
**PUT** `/deliveries/:id`

Headers: `Authorization: Bearer CUSTOMER_TOKEN`

```json
{
  "weight": 1500,
  "deliveryAddress": "456 New Street, London, SW1A 2BB",
  "specialInstructions": "Updated instructions"
}
```

### 5. Cancel Delivery
**POST** `/deliveries/:id/cancel`

Headers: `Authorization: Bearer CUSTOMER_TOKEN`

```json
{
  "reason": "Order cancelled by customer"
}
```

### 6. Get Dashboard Statistics
**GET** `/deliveries/dashboard/stats`

Headers: `Authorization: Bearer CUSTOMER_TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "pending": 5,
      "allocated": 3,
      "completed": 10,
      "cancelled": 1,
      "total": 19
    },
    "deliveries": {
      "pending": [...],
      "allocated": [...],
      "completed": [...],
      "cancelled": [...]
    }
  }
}
```

### 7. Get My Invoices
**GET** `/invoices?isPaid=false`

Headers: `Authorization: Bearer CUSTOMER_TOKEN`

Query Parameters:
- `isPaid`: true, false
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

---

## Driver Endpoints

### 1. Get Driver Dashboard
**GET** `/driver/dashboard`

Headers: `Authorization: Bearer DRIVER_TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "pendingDeliveries": 8,
      "completedDeliveries": 45,
      "todayDeliveries": 5,
      "thisWeekDeliveries": 12
    },
    "todaySchedule": [
      {
        "id": 123,
        "deliveryDate": "2026-01-27T00:00:00.000Z",
        "timeSlot": "AM",
        "deliveryAddress": "123 Main St",
        "customer": {
          "fullName": "John Customer",
          "customerProfile": {
            "loginId": "TOPPS001"
          }
        }
      }
    ]
  }
}
```

### 2. Get Assigned Deliveries
**GET** `/driver/deliveries?status=ALLOCATED&startDate=2026-01-27`

Headers: `Authorization: Bearer DRIVER_TOKEN`

Query Parameters:
- `status`: ALL, ALLOCATED, DELIVERED
- `startDate`, `endDate`, `search`

### 3. Get Delivery Details
**GET** `/driver/deliveries/:id`

Headers: `Authorization: Bearer DRIVER_TOKEN`

### 4. Upload Proof of Delivery
**POST** `/driver/deliveries/:id/upload-proof`

Headers: 
- `Authorization: Bearer DRIVER_TOKEN`
- `Content-Type: multipart/form-data`

Form Data:
- `signature`: File (image)
- `photo[]`: Files (images, up to 3)

**Response:**
```json
{
  "success": true,
  "message": "Proof of delivery uploaded successfully",
  "data": {
    "id": 123,
    "signatureUrl": "/uploads/signatures/1234567-14-signature.jpg",
    "photoUrl": "/uploads/photos/1234567-14-photo1.jpg,/uploads/photos/1234567-14-photo2.jpg",
    "status": "ALLOCATED"
  }
}
```

### 5. Mark Delivery as Complete
**POST** `/driver/deliveries/:id/complete`

Headers: `Authorization: Bearer DRIVER_TOKEN`

```json
{
  "receivedBy": "John Manager",
  "signatureUrl": "/uploads/signatures/1234567-14-signature.jpg",
  "photoUrl": "/uploads/photos/1234567-14-photo.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery marked as completed successfully",
  "data": {
    "id": 123,
    "status": "DELIVERED",
    "deliveredAt": "2026-01-27T10:30:00.000Z",
    "receivedBy": "John Manager"
  }
}
```

### 6. Submit Driver Feedback
**POST** `/driver/deliveries/:id/feedback`

Headers: `Authorization: Bearer DRIVER_TOKEN`

```json
{
  "rating": 5,
  "comments": "Smooth delivery, customer was helpful",
  "issues": ""
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": 1,
    "deliveryId": 123,
    "driverId": 14,
    "rating": 5,
    "comments": "Smooth delivery, customer was helpful"
  }
}
```

### 7. Get Performance Metrics
**GET** `/driver/performance?startDate=2026-01-01&endDate=2026-01-31`

Headers: `Authorization: Bearer DRIVER_TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDeliveries": 50,
    "completedDeliveries": 48,
    "completionRate": "96.00",
    "averageRating": "4.8",
    "feedbackCount": 45
  }
}
```

---

## Admin Endpoints

All admin endpoints require `ADMIN` or `MANAGER` role.

### User Management

#### 1. Get All Users
**GET** `/admin/users?role=CUSTOMER&isActive=true&search=john`

Headers: `Authorization: Bearer ADMIN_TOKEN`

Query Parameters:
- `role`: CUSTOMER, DRIVER, MANAGER, ADMIN
- `isActive`: true, false
- `search`: Search term

#### 2. Get User by ID
**GET** `/admin/users/:id`

Headers: `Authorization: Bearer ADMIN_TOKEN`

#### 3. Create User (ADMIN only)
**POST** `/admin/users`

Headers: `Authorization: Bearer ADMIN_TOKEN`

```json
{
  "email": "newdriver@m19logistics.com",
  "username": "driver01",
  "password": "Driver123!",
  "fullName": "Mike Driver",
  "phone": "+447700900999",
  "role": "DRIVER",
  "driverProfile": {
    "vehicleRegistration": "AB12 CDE",
    "driverLicenseNumber": "DRIV123456789",
    "address": "789 Driver St, London"
  }
}
```

#### 4. Update User (ADMIN only)
**PUT** `/admin/users/:id`

Headers: `Authorization: Bearer ADMIN_TOKEN`

```json
{
  "fullName": "Michael Driver Updated",
  "phone": "+447700900111",
  "isActive": true
}
```

#### 5. Delete User (ADMIN only)
**DELETE** `/admin/users/:id`

Headers: `Authorization: Bearer ADMIN_TOKEN`

#### 6. Toggle User Status (ADMIN only)
**PATCH** `/admin/users/:id/toggle-status`

Headers: `Authorization: Bearer ADMIN_TOKEN`

### Delivery Management

#### 1. Get All Deliveries
**GET** `/admin/deliveries?status=ALLOCATED&customerId=15&driverId=14&startDate=2026-01-01`

Headers: `Authorization: Bearer ADMIN_TOKEN`

Query Parameters:
- `status`: RECEIVED, ALLOCATED, DELIVERED, CANCELLED
- `customerId`: Integer
- `driverId`: Integer
- `startDate`, `endDate`, `search`

#### 2. Allocate Delivery to Driver
**POST** `/admin/deliveries/:id/allocate`

Headers: `Authorization: Bearer ADMIN_TOKEN`

```json
{
  "driverId": 14
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery allocated successfully",
  "data": {
    "id": 123,
    "status": "ALLOCATED",
    "driver": {
      "fullName": "Mike Driver",
      "email": "driver@m19logistics.com"
    }
  }
}
```

#### 3. Update Delivery Status
**PUT** `/admin/deliveries/:id/status`

Headers: `Authorization: Bearer ADMIN_TOKEN`

```json
{
  "status": "CANCELLED",
  "reason": "Customer requested cancellation"
}
```

#### 4. Add Extra Charge to Delivery
**POST** `/admin/deliveries/:id/extra-charges`

Headers: `Authorization: Bearer ADMIN_TOKEN`

```json
{
  "description": "Congestion charge",
  "amount": 15.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Extra charge added successfully",
  "data": {
    "id": 1,
    "deliveryId": 123,
    "description": "Congestion charge",
    "amount": "15.00",
    "createdAt": "2026-01-27T10:00:00.000Z"
  }
}
```

#### 5. Get Delivery Extra Charges
**GET** `/admin/deliveries/:id/extra-charges`

Headers: `Authorization: Bearer ADMIN_TOKEN`

#### 6. Remove Extra Charge
**DELETE** `/admin/deliveries/:id/extra-charges/:chargeId`

Headers: `Authorization: Bearer ADMIN_TOKEN`

### Pricing Tier Management

#### 1. Get All Pricing Tiers
**GET** `/admin/pricing-tiers`

Headers: `Authorization: Bearer ADMIN_TOKEN`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tier 1",
      "description": "Standard pricing for regular customers",
      "basePrice": "37.50",
      "vatRate": "20.00",
      "weightUnit": 800,
      "maxDistance": 45,
      "surchargeRate": "0.50",
      "isDefault": true,
      "isActive": true,
      "_count": {
        "customerProfiles": 6
      }
    }
  ]
}
```

#### 2. Create Pricing Tier (ADMIN only)
**POST** `/admin/pricing-tiers`

Headers: `Authorization: Bearer ADMIN_TOKEN`

```json
{
  "name": "Tier 2 - Premium",
  "description": "Premium tier for high-volume customers",
  "basePrice": 32.00,
  "vatRate": 20.00,
  "weightUnit": 800,
  "maxDistance": 45,
  "surchargeRate": 0.45,
  "isDefault": false,
  "isActive": true
}
```

#### 3. Update Pricing Tier (ADMIN only)
**PUT** `/admin/pricing-tiers/:id`

Headers: `Authorization: Bearer ADMIN_TOKEN`

```json
{
  "basePrice": 35.00,
  "surchargeRate": 0.40
}
```

#### 4. Delete Pricing Tier (ADMIN only)
**DELETE** `/admin/pricing-tiers/:id`

Headers: `Authorization: Bearer ADMIN_TOKEN`

### Invoice Management

#### 1. Get All Invoices
**GET** `/admin/invoices?customerId=15&isPaid=false&startDate=2026-01-01`

Headers: `Authorization: Bearer ADMIN_TOKEN`

#### 2. Get Invoice Details
**GET** `/admin/invoices/:id`

Headers: `Authorization: Bearer ADMIN_TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "T0326",
    "customerId": 15,
    "invoiceDate": "2026-01-27T00:00:00.000Z",
    "dueDate": "2026-02-27T00:00:00.000Z",
    "status": "Sent",
    "subtotal": "225.00",
    "vatTotal": "45.00",
    "grandTotal": "270.00",
    "isPaid": false,
    "customerRef": "PO-12345",
    "notes": "Weekly delivery invoice",
    "customer": {
      "fullName": "John Customer",
      "email": "customer@example.com",
      "customerProfile": {
        "loginId": "TOPPS001",
        "storeName": "Topps Tiles Store 1"
      }
    },
    "items": [
      {
        "id": 1,
        "deliveryId": 101,
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

#### 3. Generate Invoice for Customer
**POST** `/admin/invoices/generate`

Headers: `Authorization: Bearer ADMIN_TOKEN`

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
    "invoiceNumber": "T0326",
    "customerId": 15,
    "invoiceDate": "2026-01-27T00:00:00.000Z",
    "subtotal": "225.00",
    "vatAmount": "45.00",
    "grandTotal": "270.00",
    "isPaid": false,
    "items": [...]
  }
}
```

#### 4. Generate Invoices for All Customers
**POST** `/admin/invoices/generate-all`

Headers: `Authorization: Bearer ADMIN_TOKEN`

**Use Case:** Generate invoices for ALL customers with completed deliveries in a date range

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
    }
  ]
}
```

#### 5. Generate Last Week's Invoices (EASIEST)
**POST** `/admin/invoices/generate-last-week`

Headers: `Authorization: Bearer ADMIN_TOKEN`

**Use Case:** Automatically generate invoices for all customers for last week (Mon-Sun)

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

#### 6. Edit/Update Invoice (Single Endpoint for All Edits)
**PUT** `/admin/invoices/:id`

Headers: `Authorization: Bearer ADMIN_TOKEN`

**Use Case:** Update invoice metadata, items, pricing - all in one request

**Update Only Metadata (Invoice Number, Status, Dates):**
```json
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

**Update Complete Invoice (Metadata + Delivery Entries):**
```json
{
  "invoiceNumber": "T0327",
  "status": "Sent",
  "invoiceDate": "2026-01-08",
  "dueDate": "2026-02-08",
  "items": [
    {
      "deliveryId": 101,
      "spoNumber": "SP0013351",
      "description": "Delivery to 4 Bumpers Lane, Sealand Ind Est, Chester",
      "quantity": 1,
      "unitCost": 37.50,
      "vatAmount": 7.50,
      "total": 45.00
    },
    {
      "deliveryId": 102,
      "spoNumber": "SP0013352",
      "description": "Delivery to Birmingham",
      "quantity": 1,
      "unitCost": 45.00,
      "vatAmount": 9.00,
      "total": 54.00
    }
  ]
}
```

**Note:** When `items` array is provided, ALL existing items are replaced with the new items. Totals are automatically recalculated.

**Response:**
```json
{
  "success": true,
  "message": "Invoice updated successfully",
  "data": {
    "id": 15,
    "invoiceNumber": "T0327",
    "customerId": 8,
    "status": "Sent",
    "subtotal": "82.50",
    "vatTotal": "16.50",
    "grandTotal": "99.00",
    "items": [...]
  }
}
```

#### 7. Mark Invoice as Paid
**POST** `/admin/invoices/:id/mark-paid`

Headers: `Authorization: Bearer ADMIN_TOKEN`

**Note:** Once marked as paid, invoice cannot be edited

#### 8. Add Extra Charge to Invoice
**POST** `/admin/invoices/:id/extra-charge`

Headers: `Authorization: Bearer ADMIN_TOKEN`

```json
{
  "description": "Additional handling fee",
  "unitCost": 10.00,
  "vatAmount": 2.00,
  "total": 12.00
}
```

### Analytics

#### 1. Get Overall Analytics
**GET** `/admin/analytics/overall?startDate=2026-01-01&endDate=2026-01-31`

Headers: `Authorization: Bearer ADMIN_TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDeliveries": 150,
    "totalRevenue": "5625.00",
    "activeCustomers": 12,
    "activeDrivers": 5,
    "recentDeliveries": [...]
  }
}
```

#### 2. Get Driver Performance
**GET** `/admin/analytics/driver-performance/:driverId?startDate=2026-01-01&endDate=2026-01-31`

Headers: `Authorization: Bearer ADMIN_TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "driver": {
      "id": 14,
      "fullName": "Mike Driver"
    },
    "totalDeliveries": 50,
    "completedDeliveries": 48,
    "completionRate": "96.00",
    "averageRating": "4.8"
  }
}
```

#### 3. Get Customer Analytics
**GET** `/admin/analytics/customers?startDate=2026-01-01&endDate=2026-01-31`

Headers: `Authorization: Bearer ADMIN_TOKEN`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "name": "John Customer",
      "email": "customer@example.com",
      "loginId": "TOPPS001",
      "storeName": "Topps Tiles Store 1",
      "pricingTier": "Tier 1",
      "totalDeliveries": 25,
      "totalSpent": "937.50",
      "averageOrderValue": "37.50"
    }
  ]
}
```

### Slot Availability

#### 1. Get Slot Availability
**GET** `/admin/slots?date=2026-01-30&timeSlot=AM`

Headers: `Authorization: Bearer ADMIN_TOKEN`

#### 2. Set Slot Availability
**POST** `/admin/slots`

Headers: `Authorization: Bearer ADMIN_TOKEN`

```json
{
  "date": "2026-01-30",
  "timeSlot": "AM",
  "maxCapacity": 20,
  "currentBookings": 0,
  "isAvailable": true
}
```

---

## Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing Workflow

### 1. Setup Test Users

```bash
# Admin
POST /auth/login
{ "email": "admin@m19logistics.com", "password": "Admin123" }

# Customer (from seed data)
POST /auth/login
{ "email": "customer1@topps.com", "password": "Customer123" }

# Driver (create via admin)
POST /admin/users
{
  "email": "testdriver@m19logistics.com",
  "username": "testdriver",
  "password": "Driver123!",
  "fullName": "Test Driver",
  "role": "DRIVER"
}
```

### 2. Customer Creates Delivery

```bash
POST /deliveries
Authorization: Bearer CUSTOMER_TOKEN
{
  "deliveryDate": "2026-01-30",
  "timeSlot": "AM",
  "weight": 1200,
  "deliveryAddress": "123 Test St, London, SW1A 1AA",
  "customerName": "John Test",
  "customerPhone": "+447700900000",
  "spoNumber": "SPO-TEST-001",
  "requestedBy": "Manager Test"
}
```

### 3. Admin Allocates to Driver

```bash
POST /admin/deliveries/{deliveryId}/allocate
Authorization: Bearer ADMIN_TOKEN
{ "driverId": 14 }
```

### 4. Driver Uploads Proof

```bash
POST /driver/deliveries/{deliveryId}/upload-proof
Authorization: Bearer DRIVER_TOKEN
Content-Type: multipart/form-data
- signature: [file]
- photo: [file]
```

### 5. Driver Marks Complete

```bash
POST /driver/deliveries/{deliveryId}/complete
Authorization: Bearer DRIVER_TOKEN
{
  "receivedBy": "Store Manager",
  "signatureUrl": "/uploads/signatures/...",
  "photoUrl": "/uploads/photos/..."
}
```

### 6. Driver Submits Feedback

```bash
POST /driver/deliveries/{deliveryId}/feedback
Authorization: Bearer DRIVER_TOKEN
{
  "rating": 5,
  "comments": "Smooth delivery"
}
```

### 7. Admin Generates Invoice

```bash
POST /admin/invoices/generate
Authorization: Bearer ADMIN_TOKEN
{
  "customerId": 15,
  "weekStartDate": "2026-01-27",
  "weekEndDate": "2026-02-02"
}
```

---

## Environment Variables

Create `.env` file:

```env
DATABASE_URL="postgresql://postgres@147.93.107.217:5426/postgres"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=30d
NODE_ENV=development
PORT=3000
```

---

## Notes

- All dates should be in ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`
- File uploads use `multipart/form-data` content type
- Pricing calculation: `(weight÷800kg) × basePrice + distanceSurcharge + VAT`
- Invoice numbers auto-increment from T0326
- Deliveries can only be edited in RECEIVED status
- Drivers can only complete deliveries in ALLOCATED status
- Extra charges can be added to deliveries and invoices

---

## Contact & Enquiry Management

### Admin - View All Contacts
**GET** `/admin/contacts?isRead=false`

Headers: `Authorization: Bearer ADMIN_TOKEN`

Query Parameters:
- `isRead`: true/false
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+447700900123",
      "message": "I would like to inquire...",
      "isRead": false,
      "createdAt": "2026-01-28T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Admin - Mark Contact as Read
**POST** `/admin/contacts/:id/mark-read`

### Admin - Delete Contact
**DELETE** `/admin/contacts/:id` (ADMIN only)

### Admin - View All Enquiries
**GET** `/admin/enquiries?isRead=false`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fullName": "John Doe",
      "companyName": "Your Company Ltd",
      "email": "john@example.com",
      "phoneNumber": "07971 415430",
      "subject": "What is your enquiry about?",
      "message": "Please provide details...",
      "isRead": false,
      "createdAt": "2026-01-28T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Admin - Mark Enquiry as Read
**POST** `/admin/enquiries/:id/mark-read`

### Admin - Delete Enquiry
**DELETE** `/admin/enquiries/:id` (ADMIN only)

---

## Support

For issues or questions, contact the development team.

**Last Updated:** January 27, 2026
