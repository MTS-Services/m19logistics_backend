# 🧪 M19 Logistics - Postman API Testing Guide

Base URL: `http://localhost:3000`

---

## � Profile Management Routes

### 1. Get My Profile
**GET** `/api/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Customer Example):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 3,
      "email": "topps022@toppstiles.co.uk",
      "username": "T022",
      "fullName": "Topps Chester Manager",
      "role": "CUSTOMER",
      "isActive": true,
      "profilePicture": null,
      "customerProfile": {...},
      "driverProfile": null,
      "managerProfile": null
    },
    "profile": {
      "id": 1,
      "userId": 3,
      "storeName": "Topps Chester",
      "depotAddress": "4 Bumpers Lane, Sealand Ind Est, Chester, CH1 4LY",
      "loginId": "C0001",
      "pricingTierId": 1,
      "customBasePrice": null,
      "customVatRate": "20.00",
      "accessScope": "deliveries:create,deliveries:view,invoices:view",
      "pricingTier": {
        "id": 1,
        "name": "Tier A",
        "tierCode": "TIER_A",
        "basePrice": "35.00",
        "vatRate": "20.00"
      }
    }
  }
}
```

---

### 2. Update Customer Profile
**PATCH** `/api/profile/customer`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body (JSON) - Partial Update:**
```json
{
  "storeName": "Topps Tiles Chester - Updated",
  "depotAddress": "New Address, Chester, CH1 4LY",
  "pricingTierId": 2,
  "customVatRate": 20.00,
  "accessScope": "deliveries:create,deliveries:view,deliveries:edit,invoices:view"
}
```

**Note:** 
- Only customers can update customer profiles
- All fields are optional - only send fields you want to update
- `loginId` cannot be changed (auto-generated and immutable)

**Available Fields:**
- `storeName` - Store/Business name
- `depotAddress` - Full depot address
- `pricingTierId` - Pricing tier ID (1 or 2)
- `customBasePrice` - Custom base price override
- `customVatRate` - Custom VAT rate
- `accessScope` - Access permissions

**Response:**
```json
{
  "success": true,
  "message": "Customer profile updated successfully.",
  "data": {
    "id": 1,
    "userId": 3,
    "storeName": "Topps Tiles Chester - Updated",
    "depotAddress": "New Address, Chester, CH1 4LY",
    "loginId": "C0001",
    "pricingTierId": 2,
    "customBasePrice": null,
    "customVatRate": "20.00",
    "accessScope": "deliveries:create,deliveries:view,deliveries:edit,invoices:view",
    "pricingTier": {
      "id": 2,
      "name": "Tier B",
      "tierCode": "TIER_B",
      "basePrice": "45.00",
      "vatRate": "20.00"
    },
    "createdAt": "2026-01-25T10:00:00.000Z",
    "updatedAt": "2026-01-26T06:15:00.000Z"
  }
}
```

**Error Response (Wrong Role):**
```json
{
  "success": false,
  "message": "Only customers can update customer profile."
}
```

---

### 3. Update Driver Profile
**PATCH** `/api/profile/driver`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body (JSON) - Partial Update:**
```json
{
  "vehicleRegistration": "XY99 ZZZ",
  "driverLicenseNumber": "DL987654",
  "address": "456 New Street, Wrexham, LL11 2AB",
  "isActiveDriver": true,
  "enableSmsNotifications": true,
  "enableEmailNotifications": false
}
```

**Note:** 
- Only drivers can update driver profiles
- All fields are optional - only send fields you want to update

**Available Fields:**
- `vehicleRegistration` - Vehicle registration number
- `driverLicenseNumber` - Driver's license number
- `address` - Home address
- `isActiveDriver` - Can receive delivery assignments (true/false)
- `enableSmsNotifications` - Enable SMS notifications (true/false)
- `enableEmailNotifications` - Enable email notifications (true/false)

**Response:**
```json
{
  "success": true,
  "message": "Driver profile updated successfully.",
  "data": {
    "id": 2,
    "userId": 4,
    "vehicleRegistration": "XY99 ZZZ",
    "driverLicenseNumber": "DL987654",
    "address": "456 New Street, Wrexham, LL11 2AB",
    "isActiveDriver": true,
    "enableSmsNotifications": true,
    "enableEmailNotifications": false,
    "createdAt": "2026-01-25T10:00:00.000Z",
    "updatedAt": "2026-01-26T06:20:00.000Z"
  }
}
```

**Error Response (Wrong Role):**
```json
{
  "success": false,
  "message": "Only drivers can update driver profile."
}
```

---

### 4. Update Manager Profile
**PATCH** `/api/profile/manager`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body (JSON) - Partial Update:**
```json
{
  "officeAddress": "Regional Office, Manchester, M1 1AA",
  "accessScope": "All Northern Topps Tiles stores",
  "assignedStoreCount": 8
}
```

**Note:** 
- Only managers can update manager profiles
- All fields are optional - only send fields you want to update

**Available Fields:**
- `officeAddress` - Manager's office address
- `accessScope` - Access scope description
- `assignedStoreCount` - Number of stores managed

**Response:**
```json
{
  "success": true,
  "message": "Manager profile updated successfully.",
  "data": {
    "id": 1,
    "userId": 5,
    "officeAddress": "Regional Office, Manchester, M1 1AA",
    "accessScope": "All Northern Topps Tiles stores",
    "assignedStoreCount": 8,
    "createdAt": "2026-01-25T10:00:00.000Z",
    "updatedAt": "2026-01-26T06:25:00.000Z"
  }
}
```

**Error Response (Wrong Role):**
```json
{
  "success": false,
  "message": "Only managers can update manager profile."
}
```

---

## �📋 Table of Contents
- [Authentication Routes](#authentication-routes)- [Profile Management Routes](#profile-management-routes)- [User Management Routes](#user-management-routes)
- [Testing Workflow](#testing-workflow)

---

## 🔐 Authentication Routes

### 1. Health Check
**GET** `/api/health`

**Headers:**
```
None required
```

**Response:**
```json
{
  "success": true,
  "message": "M19 Logistics API is running",
  "timestamp": "2026-01-25T10:30:00.000Z"
}
```

---

### 2. Register New User (Single API for All Roles)
**POST** `/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

---

#### 2.1 Register Customer

**Body (JSON) - Full Customer Registration:**
```json
{
  "email": "topps.manchester@toppstiles.co.uk",
  "username": "toppsmanchester",
  "password": "SecurePass123!",
  "fullName": "Manchester Topps Store Manager",
  "phone": "01612345678",
  "role": "CUSTOMER",
  "storeName": "Topps Tiles Manchester",
  "depotAddress": "45 Oxford Road, Manchester, M1 5AN",
  "pricingTierId": 1,
  "accessScope": "deliveries:create,deliveries:view,invoices:view"
}
```

**Required Fields (Customer):**
- `email`, `username`, `password`, `fullName`, `role`

**Optional Customer Fields:**
- `phone` - Contact phone number
- `storeName` - Store/Business name
- `depotAddress` - Full depot address for delivery calculations
- `pricingTierId` - Pricing tier ID (1 = Tier A, 2 = Tier B)
- `customBasePrice` - Custom base price override
- `customVatRate` - Custom VAT rate (default 20.00)
- `accessScope` - Permissions scope

**Auto-Generated Fields:**
- `loginId` - Unique login identifier (auto-generated format: C0001, C0002, etc.)

---

#### 2.2 Register Driver

**Body (JSON) - Full Driver Registration:**
```json
{
  "email": "john.driver@m19logistics.com",
  "username": "johndriver",
  "password": "Driver123!",
  "fullName": "John Driver",
  "phone": "07123456789",
  "role": "DRIVER",
  "vehicleRegistration": "AB12 CDE",
  "driverLicenseNumber": "DL123456",
  "address": "123 Driver Street, Wrexham, LL12 7VJ",
  "isActiveDriver": true,
  "enableSmsNotifications": true,
  "enableEmailNotifications": true
}
```

**Required Fields (Driver):**
- `email`, `username`, `password`, `fullName`, `role`

**Optional Driver Fields:**
- `phone` - Contact phone number
- `vehicleRegistration` - Vehicle registration number
- `driverLicenseNumber` - Driver's license number
- `address` - Driver's home address
- `isActiveDriver` - Can receive deliveries (default: true)
- `enableSmsNotifications` - SMS alerts (default: false)
- `enableEmailNotifications` - Email alerts (default: true)

---

#### 2.3 Register Manager

**Body (JSON) - Full Manager Registration:**
```json
{
  "email": "rob.myers@toppstiles.com",
  "username": "robmyers",
  "password": "Manager123!",
  "fullName": "Rob Myers",
  "phone": "07725957625",
  "role": "MANAGER",
  "officeAddress": "Area Manager Office, Wrexham",
  "accessScope": "All Topps Tiles stores",
  "assignedStoreCount": 6
}
```

**Required Fields (Manager):**
- `email`, `username`, `password`, `fullName`, `role`

**Optional Manager Fields:**
- `phone` - Contact phone number
- `officeAddress` - Manager's office address
- `accessScope` - Access scope description
- `assignedStoreCount` - Number of stores managed

---

#### 2.4 Register Admin

**Body (JSON) - Admin Registration:**
```json
{
  "email": "newadmin@m19logistics.com",
  "username": "newadmin",
  "password": "Admin123!",
  "fullName": "New Admin User",
  "phone": "07971234567",
  "role": "ADMIN"
}
```

**Required Fields (Admin):**
- `email`, `username`, `password`, `fullName`, `role`

---

**Response Example (Customer):**
```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": 5,
      "email": "topps.manchester@toppstiles.co.uk",
      "username": "toppsmanchester",
      "fullName": "Manchester Topps Store Manager",
      "role": "CUSTOMER",
      "phone": "01612345678",
      "profilePicture": null,
      "createdAt": "2026-01-26T05:30:00.000Z",
      "profile": {
        "id": 3,
        "userId": 5,
        "storeName": "Topps Tiles Manchester",
        "depotAddress": "45 Oxford Road, Manchester, M1 5AN",
        "loginId": "C0001",
        "pricingTierId": 1,
        "customBasePrice": null,
        "customVatRate": "20.00",
        "accessScope": "deliveries:create,deliveries:view,invoices:view",
        "pricingTier": {
          "id": 1,
          "name": "Tier A",
          "tierCode": "TIER_A",
          "basePrice": "35.00",
          "vatRate": "20.00"
        }
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** The `loginId` field (e.g., "C0001") is automatically generated during registration and cannot be manually specified.

**Response Example (Driver):**
```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": 6,
      "email": "john.driver@m19logistics.com",
      "username": "johndriver",
      "fullName": "John Driver",
      "role": "DRIVER",
      "phone": "07123456789",
      "profilePicture": null,
      "createdAt": "2026-01-26T05:35:00.000Z",
      "profile": {
        "id": 2,
        "userId": 6,
        "vehicleRegistration": "AB12 CDE",
        "driverLicenseNumber": "DL123456",
        "address": "123 Driver Street, Wrexham, LL12 7VJ",
        "isActiveDriver": true,
        "enableSmsNotifications": true,
        "enableEmailNotifications": true
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

Email already exists:
```json
{
  "success": false,
  "message": "Email already registered."
}
```

Username already taken:
```json
{
  "success": false,
  "message": "Username already taken."
}
```

Invalid role:
```json
{
  "success": false,
  "message": "Invalid role specified."
}
```

---

### 3. Login
**POST** `/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "YourPassword123!"
}
```

**Example Logins:**

Admin:
```json
{
  "email": "admin@m19logistics.com",
  "password": "Admin123!"
}
```

Driver (BK):
```json
{
  "email": "bk@m19logistics.com",
  "password": "M1901"
}
```

Customer (Topps Chester):
```json
{
  "email": "topps022@toppstiles.co.uk",
  "password": "Password022"
}
```

Area Manager (Rob):
```json
{
  "email": "rob@m19logistics.com",
  "password": "Topps01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 3,
      "email": "topps022@toppstiles.co.uk",
      "username": "T022",
      "fullName": "Topps Chester Manager",
      "phone": "01244398888",
      "role": "CUSTOMER",
      "profilePicture": null,
      "isActive": true,
      "createdAt": "2026-01-25T10:00:00.000Z",
      "lastLogin": "2026-01-26T05:30:00.000Z",
      "customerProfile": {
        "id": 1,
        "userId": 3,
        "storeName": "Topps Chester",
        "depotAddress": "4 Bumpers Lane, Sealand Ind Est, Chester, CH1 4LY",
        "loginId": "T022",
        "pricingTierId": 1,
        "customBasePrice": null,
        "customVatRate": "20.00",
        "accessScope": "deliveries:create,deliveries:view,invoices:view",
        "pricingTier": {
          "id": 1,
          "name": "Tier A",
          "tierCode": "TIER_A",
          "basePrice": "35.00",
          "vatRate": "20.00"
        }
      },
      "driverProfile": null,
      "managerProfile": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "requirePasswordReset": false
  }
}
```

---

### 4. Get Current User Profile
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "email": "topps022@toppstiles.co.uk",
    "username": "T022",
    "fullName": "Topps Chester Manager",
    "role": "CUSTOMER",
    "phone": "01244398888",
    "profilePicture": null,
    "isActive": true,
    "createdAt": "2026-01-25T10:00:00.000Z",
    "lastLogin": "2026-01-26T05:30:00.000Z",
    "customerProfile": {
      "id": 1,
      "userId": 3,
      "storeName": "Topps Chester",
      "depotAddress": "4 Bumpers Lane, Sealand Ind Est, Chester, CH1 4LY",
      "loginId": "T022",
      "pricingTierId": 1,
      "customBasePrice": null,
      "customVatRate": "20.00",
      "accessScope": "deliveries:create,deliveries:view,invoices:view",
      "pricingTier": {
        "id": 1,
        "name": "Tier A",
        "tierCode": "TIER_A",
        "basePrice": "35.00",
        "vatRate": "20.00"
      }
    },
    "driverProfile": null,
    "managerProfile": null
  }
}
```

---

### 5. Change Password
**POST** `/api/auth/change-password`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "currentPassword": "M1901",
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** After changing password, all existing tokens are revoked. Use the new token provided in the response.

---

### 6. Logout
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful."
}
```

---

## 👤 Profile Management

### 1. Get My Profile
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Description:** Gets the authenticated user's profile with role-specific data. Role is automatically detected from the access token.

**Response (Customer Example):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "email": "topps022@toppstiles.co.uk",
    "username": "T022",
    "fullName": "Topps Chester Manager",
    "role": "CUSTOMER",
    "phone": "01244398888",
    "profilePicture": null,
    "isActive": true,
    "createdAt": "2026-01-25T10:00:00.000Z",
    "lastLogin": "2026-01-26T05:30:00.000Z",
    "customerProfile": {
      "id": 1,
      "userId": 3,
      "storeName": "Topps Chester",
      "depotAddress": "4 Bumpers Lane, Sealand Ind Est, Chester, CH1 4LY",
      "loginId": "C0001",
      "pricingTierId": 1,
      "customBasePrice": null,
      "customVatRate": "20.00",
      "accessScope": "deliveries:create,deliveries:view,invoices:view",
      "pricingTier": {
        "id": 1,
        "name": "Tier A",
        "tierCode": "TIER_A",
        "basePrice": "35.00",
        "vatRate": "20.00"
      }
    },
    "driverProfile": null,
    "managerProfile": null
  }
}
```

---

### 2. Update My Profile
**PATCH** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Description:** Updates the authenticated user's complete profile including base user information and role-specific fields. The system automatically detects the user's role from the access token. Only send the fields you want to update.

---

#### Base User Fields (All Roles)

**Available for all users:**
- `email` - Email address (must be unique)
- `username` - Username (must be unique)
- `fullName` - Full name
- `phone` - Phone number
- `profilePicture` - Profile picture URL

**Note:** Password cannot be changed through this route. Use `/api/auth/change-password` instead.

---

#### For Customers (role: CUSTOMER)

**Request Body Example (Full Update):**
```json
{
  "email": "updated.email@toppstiles.co.uk",
  "username": "toppschester",
  "fullName": "Updated Manager Name",
  "phone": "01244398888",
  "storeName": "Topps Tiles Chester - Updated",
  "depotAddress": "New Address, Chester, CH1 4LY",
  "pricingTierId": 2,
  "customVatRate": 20.00,
  "accessScope": "deliveries:create,deliveries:view,deliveries:edit,invoices:view"
}
```

**Additional Customer-Specific Fields:**
- `storeName` - Store/Business name
- `depotAddress` - Full depot address
- `pricingTierId` - Pricing tier ID (1 or 2)
- `customBasePrice` - Custom base price override
- `customVatRate` - Custom VAT rate
- `accessScope` - Access permissions
- **Note:** `loginId` cannot be changed (auto-generated and immutable)

---

#### For Drivers (role: DRIVER)

**Request Body Example (Full Update):**
```json
{
  "email": "john.updated@m19logistics.com",
  "username": "johndriver",
  "fullName": "John Updated Driver",
  "phone": "07123456789",
  "vehicleRegistration": "XY99 ZZZ",
  "driverLicenseNumber": "DL987654",
  "address": "456 New Street, Wrexham, LL11 2AB",
  "isActiveDriver": true,
  "enableSmsNotifications": true,
  "enableEmailNotifications": false
}
```

**Additional Driver-Specific Fields:**
- `vehicleRegistration` - Vehicle registration number
- `driverLicenseNumber` - Driver's license number
- `address` - Home address
- `isActiveDriver` - Can receive delivery assignments (true/false)
- `enableSmsNotifications` - Enable SMS notifications (true/false)
- `enableEmailNotifications` - Enable email notifications (true/false)

---

#### For Managers (role: MANAGER)

**Request Body Example (Full Update):**
```json
{
  "email": "rob.updated@toppstiles.com",
  "username": "robmyers",
  "fullName": "Rob Myers Updated",
  "phone": "07725957625",
  "officeAddress": "Regional Office, Manchester, M1 1AA",
  "accessScope": "All Northern Topps Tiles stores",
  "assignedStoreCount": 8
}
```

**Additional Manager-Specific Fields:**
- `officeAddress` - Manager's office address
- `accessScope` - Access scope description
- `assignedStoreCount` - Number of stores managed

---

#### For Admins (role: ADMIN)

**Request Body Example:**
```json
{
  "email": "admin.updated@m19logistics.com",
  "username": "adminuser",
  "fullName": "Updated Admin Name",
  "phone": "07971234567"
}
```

Admins can only update base user fields (no role-specific profile).

---

**Success Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "user": {
      "id": 3,
      "email": "updated.email@toppstiles.co.uk",
      "username": "toppschester",
      "fullName": "Updated Manager Name",
      "role": "CUSTOMER",
      "phone": "01244398888",
      "profilePicture": null,
      "isActive": true,
      "createdAt": "2026-01-25T10:00:00.000Z",
      "lastLogin": "2026-01-26T05:30:00.000Z",
      "customerProfile": {
        "id": 1,
        "userId": 3,
        "storeName": "Topps Tiles Chester - Updated",
        "depotAddress": "New Address, Chester, CH1 4LY",
        "loginId": "C0001",
        "pricingTierId": 2,
        "customBasePrice": null,
        "customVatRate": "20.00",
        "accessScope": "deliveries:create,deliveries:view,deliveries:edit,invoices:view",
        "pricingTier": {
          "id": 2,
          "name": "Tier B",
          "tierCode": "TIER_B",
          "basePrice": "45.00",
          "vatRate": "20.00"
        }
      },
      "driverProfile": null,
      "managerProfile": null
    },
    "updatedFields": {
      "userFields": ["email", "username", "fullName", "phone"],
      "profileFields": ["storeName", "depotAddress", "pricingTierId", "accessScope"]
    }
  }
}
```

**Error Responses:**

Email already registered:
```json
{
  "success": false,
  "message": "Email already registered."
}
```

Username already taken:
```json
{
  "success": false,
  "message": "Username already taken."
}
```

No fields to update:
```json
{
  "success": false,
  "message": "No fields to update."
}
```

Profile not found:
```json
{
  "success": false,
  "message": "Profile not found."
}
```

---

## 🧪 Testing Workflow

### Step 1: Test Health Check
1. Create a new GET request in Postman
2. URL: `http://localhost:3000/api/health`
3. Send the request
4. Expected: 200 OK with success message

### Step 2: Login as Admin
1. Create a new POST request
2. URL: `http://localhost:3000/api/auth/login`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "username": "admin",
     "password": "Admin123!"
   }
   ```
5. Send the request
6. **Copy the `token` from the response** (you'll need it for protected routes)

### Step 3: Get Your Profile (Protected Route)
1. Create a new GET request
2. URL: `http://localhost:3000/api/auth/me`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer <paste-your-token-here>`
4. Send the request
5. Expected: Your user profile data

### Step 4: Test Different User Roles

**Login as Driver (BK):**
```json
{
  "username": "BK01",
  "password": "M1901"
}
```

**Login as Customer (Topps Chester):**
```json
{
  "username": "T022",
  "password": "Password022"
}
```

**Login as Area Manager (Rob):**
```json
{
  "username": "Rob01",
  "password": "Topps01"
}
```

### Step 5: Test Password Reset Flow
1. Login with a customer account (e.g., T022)
2. Note: `requirePasswordReset: true` in response
3. Call `/api/auth/change-password` with:
   ```json
   {
     "currentPassword": "Password022",
     "newPassword": "NewSecurePassword123!"
   }
   ```
4. Use the new token from response
5. Login again with new password to verify

---

## 🔑 Pre-loaded Test Accounts

### Admin Account
- **Username:** `admin`
- **Email:** `admin@m19logistics.com`
- **Password:** `Admin123!`
- **Role:** ADMIN
- **Reset Required:** No

### Driver Account
- **Username:** `BK01`
- **Email:** `wwwbk@yahoo.co.uk`
- **Password:** `M1901`
- **Role:** DRIVER
- **Reset Required:** Yes

### Area Manager Account
- **Username:** `Rob01`
- **Email:** `rob.myers@toppstiles.com`
- **Password:** `Topps01`
- **Role:** MANAGER
- **Reset Required:** Yes

### Customer Accounts (Topps Stores)

| Store | Username | Email | Password | Pricing Tier |
|-------|----------|-------|----------|--------------|
| Topps Chester | T022 | topps022@toppstiles.co.uk | Password022 | Tier B (£45) |
| Topps Nantwich | T226 | topps226@toppstiles.co.uk | Password226 | Tier B (£45) |
| Topps Newcastle | T167 | topps167@toppstiles.co.uk | Password167 | Tier A (£50) |
| Topps Northwich | T143 | topps143@toppstiles.co.uk | Password143 | Tier B (£45) |
| Topps Rhyl | T211 | topps211@toppstiles.co.uk | Password211 | Tier B (£45) |
| Topps Wrexham | T217 | topps217@toppstiles.co.uk | Password217 | Tier B (£45) |

**All customer accounts require password reset on first login**

---

## 📊 Expected Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required",
      "value": "invalid-email"
    }
  ]
}
```

### 401 Unauthorized - Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid credentials."
}
```

### 401 Unauthorized - No Token
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 401 Unauthorized - Expired Token
```json
{
  "success": false,
  "message": "Token has expired."
}
```

### 401 Unauthorized - Inactive Account
```json
{
  "success": false,
  "message": "Account is inactive. Please contact administrator."
}
```

### 403 Forbidden - Insufficient Permissions
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions.",
  "requiredRole": ["ADMIN"],
  "userRole": "CUSTOMER"
}
```

### 404 Not Found - Endpoint Not Found
```json
{
  "success": false,
  "message": "API endpoint not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🎯 Postman Collection Tips

### Setting Up Environment Variables
1. Create a new Environment in Postman called "M19 Logistics Dev"
2. Add these variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (leave empty, will be set after login)
   - `adminToken`: (save admin token here)
   - `driverToken`: (save driver token here)
   - `customerToken`: (save customer token here)

### Using Variables in Requests
- URL: `{{baseUrl}}/api/auth/login`
- Authorization Header: `Bearer {{token}}`

### Auto-Save Token After Login
In the "Tests" tab of your login request, add:
```javascript
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.environment.set("token", jsonData.data.token);
});
```

---

## 📝 Notes

- All tokens expire after **30 days**
- Tokens are stored in the database and can be revoked
- Password changes revoke all existing tokens
- Protected routes require `Authorization: Bearer <token>` header
- All responses include `success: true/false` field
- Validation errors return 400 with detailed error messages
- Server must be running: `npm run dev`

---

## 🐛 Troubleshooting

**Connection Refused:**
- Make sure server is running: `npm run dev`
- Check port is 3000: `http://localhost:3000`

**401 Unauthorized:**
- Verify token is correct and not expired
- Check Authorization header format: `Bearer <token>`
- Token should not have quotes or extra spaces

**Database Errors:**
- Run migrations: `npx prisma migrate dev`
- Check database connection in `.env`

**Token Expired:**
- Login again to get a new token
- Tokens last 30 days from creation

---

**Happy Testing! 🚀**
