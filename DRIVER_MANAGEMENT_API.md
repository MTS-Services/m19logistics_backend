# Driver Management API - M19 Logistics

## Overview
Manager and Admin can perform full CRUD operations on drivers including viewing, creating, updating, and deleting driver accounts with their profiles.

**Access:** ADMIN and MANAGER roles

---

## 📋 Endpoints

### 1. Get All Drivers
**GET** `/api/admin/drivers`

Retrieve all drivers with performance statistics and profile information.

**Query Parameters:**
- `isActive` - Filter by active status (`true` or `false`)
- `search` - Search by name, email, or username
- `status` - Filter by driver status

**Example:**
```bash
GET /api/admin/drivers
GET /api/admin/drivers?isActive=true
GET /api/admin/drivers?search=john
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "fullName": "John Driver",
      "email": "john@m19logistics.com",
      "phone": "07123456789",
      "username": "johndriver",
      "profilePicture": "/uploads/drivers/john.jpg",
      "isActive": true,
      "createdAt": "2026-01-15T10:30:00.000Z",
      "driverProfile": {
        "id": 2,
        "vehicleRegistration": "AB12 CDE",
        "driverLicenseNumber": "DRIV123456",
        "address": "123 Driver St, London",
        "isActiveDriver": true,
        "enableSmsNotifications": true,
        "enableEmailNotifications": true
      },
      "performance": {
        "totalDeliveries": 45,
        "completed": 42,
        "pending": 3,
        "thisWeek": 8
      }
    }
  ],
  "count": 4,
  "summary": {
    "totalDrivers": 4,
    "activeDrivers": 4,
    "thisWeekDeliveries": 12
  }
}
```

---

### 2. Get Driver by ID
**GET** `/api/admin/drivers/:id`

Retrieve detailed information about a specific driver including delivery history and statistics.

**Example:**
```bash
GET /api/admin/drivers/5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "fullName": "John Driver",
    "email": "john@m19logistics.com",
    "phone": "07123456789",
    "username": "johndriver",
    "isActive": true,
    "driverProfile": {
      "id": 2,
      "vehicleRegistration": "AB12 CDE",
      "driverLicenseNumber": "DRIV123456",
      "address": "123 Driver St, London",
      "isActiveDriver": true
    },
    "deliveriesAssigned": [
      {
        "id": 101,
        "spoNumber": "SPO013349",
        "status": "DELIVERED",
        "deliveryDate": "2026-02-18",
        "customer": {
          "fullName": "Manchester Topps Store Manager",
          "email": "newuser1@gmail.com"
        },
        "driverFeedback": {
          "rating": 5,
          "comment": "Excellent delivery"
        }
      }
    ],
    "statistics": {
      "totalDeliveries": 45,
      "completedDeliveries": 42,
      "pendingDeliveries": 3,
      "completionRate": "93.3"
    }
  }
}
```

---

### 3. Create New Driver
**POST** `/api/admin/drivers`

Create a new driver account with profile information.

**Request Body:**
```json
{
  "email": "newdriver@m19logistics.com",
  "password": "Driver123!",
  "fullName": "New Driver Name",
  "phone": "07123456789",
  "username": "newdriver",
  "vehicleRegistration": "XY99 ABC",
  "driverLicenseNumber": "DRIV987654",
  "address": "456 Driver Ave, Manchester",
  "profilePicture": "/uploads/drivers/newdriver.jpg"
}
```

**Required Fields:**
- `email` - Valid email address (must be unique)
- `password` - Minimum 6 characters
- `fullName` - Driver's full name
- `phone` - Contact phone number

**Optional Fields:**
- `username` - Unique username for driver
- `vehicleRegistration` - Vehicle registration number
- `driverLicenseNumber` - Driver's license number
- `address` - Driver's address
- `profilePicture` - URL to profile picture

**Response:**
```json
{
  "success": true,
  "message": "Driver created successfully",
  "data": {
    "id": 10,
    "email": "newdriver@m19logistics.com",
    "fullName": "New Driver Name",
    "phone": "07123456789",
    "username": "newdriver",
    "role": "DRIVER",
    "isActive": true,
    "driverProfile": {
      "id": 8,
      "vehicleRegistration": "XY99 ABC",
      "driverLicenseNumber": "DRIV987654",
      "address": "456 Driver Ave, Manchester",
      "isActiveDriver": true,
      "enableSmsNotifications": true,
      "enableEmailNotifications": true
    }
  }
}
```

---

### 4. Update Driver
**PUT** `/api/admin/drivers/:id`

Update driver information and profile details.

**Request Body (all fields optional):**
```json
{
  "fullName": "Updated Driver Name",
  "email": "updatedemail@m19logistics.com",
  "phone": "07987654321",
  "username": "updatedusername",
  "profilePicture": "/uploads/drivers/updated.jpg",
  "isActive": true,
  "vehicleRegistration": "NEW123",
  "driverLicenseNumber": "NEWLIC456",
  "address": "789 Updated St, London",
  "isActiveDriver": true
}
```

**User Fields:**
- `email` - Update email (must be unique)
- `username` - Update username (must be unique)
- `fullName` - Update full name
- `phone` - Update phone number
- `profilePicture` - Update profile picture URL
- `isActive` - Activate/deactivate user account

**Driver Profile Fields:**
- `vehicleRegistration` - Update vehicle registration
- `driverLicenseNumber` - Update driver license number
- `address` - Update driver address
- `isActiveDriver` - Set driver as active/inactive for deliveries

**Response:**
```json
{
  "success": true,
  "message": "Driver updated successfully",
  "data": {
    "id": 10,
    "email": "updatedemail@m19logistics.com",
    "fullName": "Updated Driver Name",
    "phone": "07987654321",
    "isActive": true,
    "driverProfile": {
      "vehicleRegistration": "NEW123",
      "driverLicenseNumber": "NEWLIC456",
      "address": "789 Updated St, London",
      "isActiveDriver": true
    }
  }
}
```

---

### 5. Delete Driver
**DELETE** `/api/admin/drivers/:id`

Delete a driver account and their profile.

**Restrictions:**
- Cannot delete drivers with active or allocated deliveries
- All deliveries must be completed, cancelled, or reassigned first

**Example:**
```bash
DELETE /api/admin/drivers/10
```

**Response:**
```json
{
  "success": true,
  "message": "Driver deleted successfully"
}
```

**Error Response (if driver has active deliveries):**
```json
{
  "success": false,
  "message": "Cannot delete driver with active or allocated deliveries. Please reassign or complete deliveries first."
}
```

---

## 🔐 Authorization

All driver management endpoints require:
- **Authentication:** Bearer token in Authorization header
- **Role:** ADMIN or MANAGER

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

## 📊 Use Cases

### Manager Workflow: View Driver List
```bash
# 1. Get all active drivers
GET /api/admin/drivers?isActive=true

# 2. View summary statistics
# Response includes: totalDrivers, activeDrivers, thisWeekDeliveries
```

### Manager Workflow: Add New Driver
```bash
# 1. Create driver account
POST /api/admin/drivers
{
  "email": "sarah@m19logistics.com",
  "password": "Driver123!",
  "fullName": "Sarah Driver",
  "phone": "07123456789",
  "vehicleRegistration": "SA21 DRV",
  "driverLicenseNumber": "DRIV345678",
  "address": "London, UK"
}

# 2. Verify creation
GET /api/admin/drivers/NEW_DRIVER_ID
```

### Manager Workflow: Update Driver Information
```bash
# 1. Get driver details
GET /api/admin/drivers/5

# 2. Update driver information
PUT /api/admin/drivers/5
{
  "phone": "07999888777",
  "vehicleRegistration": "NEW999",
  "isActiveDriver": true
}

# 3. Verify update
GET /api/admin/drivers/5
```

### Manager Workflow: Deactivate Driver
```bash
# 1. Check driver's active deliveries
GET /api/admin/deliveries?driverId=5&status=ALLOCATED

# 2. Reassign active deliveries (if any)
POST /api/admin/deliveries/101/allocate
{
  "driverId": 7
}

# 3. Deactivate driver
PUT /api/admin/drivers/5
{
  "isActive": false,
  "isActiveDriver": false
}
```

### Manager Workflow: Delete Driver
```bash
# 1. Verify no active deliveries
GET /api/admin/deliveries?driverId=5&status=ALLOCATED

# 2. Delete driver (only if no active deliveries)
DELETE /api/admin/drivers/5
```

---

## 🎯 UI Integration

### Driver Management Page Components

**Summary Cards:**
- Total Drivers (from `summary.totalDrivers`)
- Active Drivers (from `summary.activeDrivers`)
- This Week Deliveries (from `summary.thisWeekDeliveries`)

**Driver List Table Columns:**
- Avatar/Profile Picture
- Driver Name (`fullName`)
- Contact (`email`, `phone`)
- Vehicle Registration (`driverProfile.vehicleRegistration`)
- Performance:
  - Total Deliveries (`performance.totalDeliveries`)
  - This Week (`performance.thisWeek`)
- Status Badge (`isActive`, `driverProfile.isActiveDriver`)
- Actions (Edit, Delete menu)

**Search/Filter Options:**
- Search by name, email, username
- Filter by active status
- Filter by driver status

---

## ⚠️ Error Handling

### Common Errors

**404 Not Found:**
```json
{
  "success": false,
  "message": "Driver not found"
}
```

**400 Bad Request (Validation Error):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

**409 Conflict (Delete with active deliveries):**
```json
{
  "success": false,
  "message": "Cannot delete driver with active or allocated deliveries. Please reassign or complete deliveries first."
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

---

## 🧪 Testing Examples

### Postman Collection

**1. Login as Manager**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "manager@m19logistics.com",
  "password": "Manager123"
}

# Copy the token from response
```

**2. Get All Drivers**
```bash
GET http://localhost:3000/api/admin/drivers
Authorization: Bearer YOUR_MANAGER_TOKEN
```

**3. Create New Driver**
```bash
POST http://localhost:3000/api/admin/drivers
Authorization: Bearer YOUR_MANAGER_TOKEN
Content-Type: application/json

{
  "email": "testdriver@m19logistics.com",
  "password": "Test123!",
  "fullName": "Test Driver",
  "phone": "07111222333",
  "vehicleRegistration": "TEST123",
  "driverLicenseNumber": "TESTLIC789"
}
```

**4. Update Driver**
```bash
PUT http://localhost:3000/api/admin/drivers/DRIVER_ID
Authorization: Bearer YOUR_MANAGER_TOKEN
Content-Type: application/json

{
  "phone": "07999888777",
  "isActive": true
}
```

**5. Delete Driver**
```bash
DELETE http://localhost:3000/api/admin/drivers/DRIVER_ID
Authorization: Bearer YOUR_MANAGER_TOKEN
```

---

## 📝 Notes

- **Performance Data:** Calculated in real-time based on delivery history
- **Week Calculation:** Monday to Sunday
- **Email Notifications:** Welcome email sent automatically on driver creation
- **Cascading Delete:** Driver profile is automatically deleted when driver is deleted
- **Active Status:** `isActive` controls login, `isActiveDriver` controls delivery allocation
- **Unique Constraints:** Email and username must be unique across all users

---

## 🔄 Related Endpoints

- **Delivery Allocation:** `POST /api/admin/deliveries/:id/allocate`
- **Driver Performance Analytics:** `GET /api/admin/analytics/drivers`
- **Driver Deliveries:** `GET /api/admin/deliveries?driverId=X`
- **User Management:** `GET /api/admin/users?role=DRIVER`

---

For complete API documentation, see [POSTMAN_API_TESTING.md](POSTMAN_API_TESTING.md).
