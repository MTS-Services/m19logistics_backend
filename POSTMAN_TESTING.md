# 🧪 M19 Logistics - Postman API Testing Guide

Base URL: `http://localhost:3000`

---

## 📋 Table of Contents
- [Authentication Routes](#authentication-routes)
- [User Management Routes](#user-management-routes)
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

### 2. Register New User
**POST** `/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123",
  "fullName": "Test User",
  "phone": "07971234567",
  "role": "CUSTOMER"
}
```

**Roles:** `ADMIN`, `DRIVER`, `CUSTOMER`, `MANAGER`

**Response:**
```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": 1,
      "email": "test@example.com",
      "username": "testuser",
      "fullName": "Test User",
      "role": "CUSTOMER",
      "phone": "07971234567",
      "profilePicture": null,
      "createdAt": "2026-01-25T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Login
**POST** `/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON) - Admin:**
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**Body (JSON) - Driver (BK):**
```json
{
  "username": "BK01",
  "password": "M1901"
}
```

**Body (JSON) - Customer (Topps Chester):**
```json
{
  "username": "T022",
  "password": "Password022"
}
```

**Body (JSON) - Area Manager (Rob):**
```json
{
  "username": "Rob01",
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
      "id": 1,
      "email": "admin@m19logistics.com",
      "username": "admin",
      "fullName": "M19 Admin",
      "phone": "07971415430",
      "role": "ADMIN",
      "profilePicture": null,
      "isActive": true,
      "depotAddress": null,
      "loginId": null,
      "pricingTier": null,
      "customBasePrice": null,
      "customVatRate": null,
      "createdAt": "2026-01-25T10:00:00.000Z",
      "lastLogin": "2026-01-25T10:30:00.000Z"
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
    "id": 1,
    "email": "admin@m19logistics.com",
    "username": "admin",
    "fullName": "M19 Admin",
    "role": "ADMIN",
    "phone": "07971415430",
    "profilePicture": null,
    "isActive": true,
    "depotAddress": null,
    "loginId": null,
    "pricingTier": null,
    "customBasePrice": null,
    "customVatRate": null,
    "createdAt": "2026-01-25T10:00:00.000Z",
    "lastLogin": "2026-01-25T10:30:00.000Z"
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
