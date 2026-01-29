# Driver Acceptance/Rejection Testing Guide

## Overview
This guide covers testing the driver accept/reject functionality where drivers must explicitly accept or reject deliveries allocated to them by admin before they can complete them.

## Workflow
1. **Customer** books delivery → Status: `RECEIVED`
2. **Admin** assigns driver → Status: `ALLOCATED`
3. **Driver** accepts OR rejects:
   - **Accept**: Records `acceptedAt`, stays `ALLOCATED`, can complete delivery
   - **Reject**: Status → `RECEIVED`, clears `driverId`, admin can reassign

---

## Prerequisites

### 1. Authentication Tokens
You need valid JWT tokens for testing:

**Admin Token:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Driver Token:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "driver@example.com",
  "password": "your_password"
}
```

**Customer Token:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "your_password"
}
```

---

## API Endpoints

### 1. Driver Accept/Reject Delivery (Single Route)

**Endpoint:** `POST /api/driver/deliveries/:id/respond`

**Headers:**
```
Authorization: Bearer {driver_token}
Content-Type: application/json
```

#### Accept Delivery

**Request:**
```json
POST http://localhost:5000/api/driver/deliveries/1/respond

{
  "action": "accept"
}
```

**Success Response (200):**
```json
{
  "message": "Delivery accepted successfully. You can now proceed to complete it.",
  "delivery": {
    "id": 1,
    "trackingNumber": "TRK123456",
    "status": "ALLOCATED",
    "acceptedAt": "2026-01-29T10:30:00.000Z",
    "rejectedAt": null,
    "rejectionReason": null,
    "driverId": 5,
    "customer": {
      "id": 3,
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    }
  }
}
```

**Error Responses:**
```json
// Already accepted
{
  "errors": [
    {
      "message": "Delivery already accepted"
    }
  ]
}

// Not ALLOCATED status
{
  "errors": [
    {
      "message": "Can only accept deliveries with ALLOCATED status"
    }
  ]
}

// Not assigned to you
{
  "errors": [
    {
      "message": "Delivery not found or not assigned to you"
    }
  ]
}
```

#### Reject Delivery

**Request:**
```json
POST http://localhost:5000/api/driver/deliveries/1/respond

{
  "action": "reject",
  "reason": "Unable to deliver due to vehicle breakdown"
}
```

**Success Response (200):**
```json
{
  "message": "Delivery rejected. The admin will be notified to reassign it.",
  "delivery": {
    "id": 1,
    "trackingNumber": "TRK123456",
    "status": "RECEIVED",
    "acceptedAt": null,
    "rejectedAt": "2026-01-29T10:35:00.000Z",
    "rejectionReason": "Unable to deliver due to vehicle breakdown",
    "driverId": null,
    "customer": {
      "id": 3,
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    }
  }
}
```

**Error Responses:**
```json
// Missing reason
{
  "errors": [
    {
      "msg": "Rejection reason is required when action is 'reject'",
      "param": "reason",
      "location": "body"
    }
  ]
}

// Already accepted
{
  "errors": [
    {
      "message": "Cannot reject an already accepted delivery"
    }
  ]
}

// Invalid action
{
  "errors": [
    {
      "msg": "Action must be either 'accept' or 'reject'",
      "param": "action",
      "location": "body"
    }
  ]
}
```

---

### 2. Complete Delivery (Requires Acceptance)

**Endpoint:** `POST /api/driver/deliveries/:id/complete`

**Headers:**
```
Authorization: Bearer {driver_token}
Content-Type: application/json
```

**Request:**
```json
POST http://localhost:5000/api/driver/deliveries/1/complete

{
  "receivedBy": "Jane Smith",
  "signatureUrl": "https://example.com/signatures/sig123.png",
  "photoUrl": "https://example.com/photos/photo123.jpg"
}
```

**Success Response (200):**
```json
{
  "message": "Delivery completed successfully",
  "delivery": {
    "id": 1,
    "trackingNumber": "TRK123456",
    "status": "DELIVERED",
    "deliveredAt": "2026-01-29T11:00:00.000Z",
    "acceptedAt": "2026-01-29T10:30:00.000Z",
    "receivedBy": "Jane Smith",
    "signatureUrl": "https://example.com/signatures/sig123.png",
    "photoUrl": "https://example.com/photos/photo123.jpg"
  }
}
```

**Error Response (Without Acceptance):**
```json
{
  "errors": [
    {
      "message": "You must accept the delivery before completing it"
    }
  ]
}
```

---

### 3. View Driver's Deliveries

**Endpoint:** `GET /api/driver/deliveries`

**Headers:**
```
Authorization: Bearer {driver_token}
```

**Request:**
```
GET http://localhost:5000/api/driver/deliveries?status=ALLOCATED
```

**Response:**
```json
{
  "deliveries": [
    {
      "id": 1,
      "trackingNumber": "TRK123456",
      "status": "ALLOCATED",
      "acceptedAt": null,
      "rejectedAt": null,
      "pickupAddress": "123 Main St",
      "deliveryAddress": "456 Oak Ave",
      "customer": {
        "fullName": "John Doe",
        "phone": "1234567890"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 4. Admin View Rejected Deliveries

When a driver rejects a delivery, the admin can see it using these endpoints:

#### View All Deliveries (Including Rejected)

**Endpoint:** `GET /api/admin/deliveries`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Request (View all deliveries):**
```
GET http://localhost:5000/api/admin/deliveries
```

**Request (Filter by RECEIVED status to see rejected deliveries):**
```
GET http://localhost:5000/api/admin/deliveries?status=RECEIVED
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "trackingNumber": "TRK123456",
      "status": "RECEIVED",
      "acceptedAt": null,
      "rejectedAt": "2026-01-29T10:35:00.000Z",
      "rejectionReason": "Unable to deliver due to vehicle breakdown",
      "driverId": null,
      "customerId": 3,
      "deliveryDate": "2026-01-30",
      "timeSlot": "AM",
      "pickupAddress": "123 Main St",
      "deliveryAddress": "456 Oak Ave",
      "customer": {
        "id": 3,
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "driver": null
    }
  ],
  "count": 1
}
```

**Key Fields for Rejected Deliveries:**
- `status`: `"RECEIVED"` (delivery was rejected and needs reassignment)
- `rejectedAt`: Timestamp when driver rejected it (not null if rejected)
- `rejectionReason`: Why the driver rejected it
- `driverId`: `null` (driver assignment cleared after rejection)
- `acceptedAt`: `null`

**Filter Options:**
```
GET /api/admin/deliveries?status=RECEIVED          // See all unassigned/rejected deliveries
GET /api/admin/deliveries?driverId=5               // See all deliveries for specific driver
GET /api/admin/deliveries?customerId=3             // See all deliveries for specific customer
GET /api/admin/deliveries?startDate=2026-01-29     // Filter by date range
GET /api/admin/deliveries?search=TRK123            // Search by tracking number/address
```

**Identify Rejected Deliveries:**
A delivery was rejected if:
- `status == "RECEIVED"` AND `rejectedAt != null` AND `rejectionReason != null`

---

### 5. Admin Reassign After Rejection

**Endpoint:** `POST /api/admin/deliveries/:id/assign`

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request:**
```json
POST http://localhost:5000/api/admin/deliveries/1/assign

{
  "driverId": 7
}
```

**Response:**
```json
{
  "message": "Delivery assigned successfully",
  "delivery": {
    "id": 1,
    "trackingNumber": "TRK123456",
    "status": "ALLOCATED",
    "driverId": 7,
    "acceptedAt": null,
    "rejectedAt": null,
    "rejectionReason": null
  }
}
```

---

### 6. Admin Update Slot Capacity

Admin can increase or decrease slot capacity for any date/time slot in a single route.

**Endpoint:** `PUT /api/admin/slots/:id/capacity`

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

#### Increase Capacity

**Request:**
```json
PUT http://localhost:5000/api/admin/slots/1/capacity

{
  "method": "increase",
  "value": 5
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Slot capacity increased successfully",
  "data": {
    "id": 1,
    "date": "2026-01-30T00:00:00.000Z",
    "timeSlot": "AM",
    "maxCapacity": 15,
    "booked": 8,
    "isFull": false
  }
}
```

#### Decrease Capacity

**Request:**
```json
PUT http://localhost:5000/api/admin/slots/1/capacity

{
  "method": "decrease",
  "value": 3
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Slot capacity decreased successfully",
  "data": {
    "id": 1,
    "date": "2026-01-30T00:00:00.000Z",
    "timeSlot": "AM",
    "maxCapacity": 12,
    "booked": 8,
    "isFull": false
  }
}
```

**Error Responses:**
```json
// Cannot reduce below current bookings
{
  "errors": [
    {
      "message": "Cannot reduce capacity below current bookings (8). Cancel some bookings first."
    }
  ]
}

// Slot not found
{
  "errors": [
    {
      "message": "Slot not found"
    }
  ]
}

// Negative capacity
{
  "errors": [
    {
      "message": "Capacity cannot be negative"
    }
  ]
}
```

**How to Get Slot ID:**
```json
GET http://localhost:5000/api/admin/slots?date=2026-01-30&timeSlot=AM
Authorization: Bearer {admin_token}
```

---

## Complete Test Scenarios

### Scenario 1: Happy Path (Accept → Complete)

**Step 1:** Customer books delivery
```json
POST http://localhost:5000/api/deliveries
Authorization: Bearer {customer_token}

{
  "pickupAddress": "123 Main St",
  "deliveryAddress": "456 Oak Ave",
  "timeSlot": "AM",
  "deliveryDate": "2026-01-30",
  "packageDetails": "Electronics"
}
```

**Step 2:** Admin assigns driver
```json
POST http://localhost:5000/api/admin/deliveries/1/assign
Authorization: Bearer {admin_token}

{
  "driverId": 5
}
```

**Step 3:** Driver accepts delivery
```json
POST http://localhost:5000/api/driver/deliveries/1/respond
Authorization: Bearer {driver_token}

{
  "action": "accept"
}
```

**Step 4:** Driver completes delivery
```json
POST http://localhost:5000/api/driver/deliveries/1/complete
Authorization: Bearer {driver_token}

{
  "receivedBy": "Jane Smith",
  "signatureUrl": "https://example.com/sig.png",
  "photoUrl": "https://example.com/photo.jpg"
}
```

---

### Scenario 2: Rejection Path (Reject → Admin Reassigns)

**Step 1-2:** Same as above (Customer books, Admin assigns)

**Step 3:** Driver rejects delivery
```json
POST http://localhost:5000/api/driver/deliveries/1/respond
Authorization: Bearer {driver_token}

{
  "action": "reject",
  "reason": "Vehicle breakdown, cannot deliver today"
}
```
**Result:** Status → `RECEIVED`, driverId → `null`

**Step 4:** Admin assigns to different driver
```json
POST http://localhost:5000/api/admin/deliveries/1/assign
Authorization: Bearer {admin_token}

{
  "driverId": 7
}
```
**Result:** Status → `ALLOCATED`, driverId → `7`, previous rejection cleared

**Step 5:** New driver accepts
```json
POST http://localhost:5000/api/driver/deliveries/1/respond
Authorization: Bearer {driver2_token}

{
  "action": "accept"
}
```

**Step 6:** New driver completes
```json
POST http://localhost:5000/api/driver/deliveries/1/complete
Authorization: Bearer {driver2_token}

{
  "receivedBy": "Jane Smith",
  "signatureUrl": "https://example.com/sig.png",
  "photoUrl": "https://example.com/photo.jpg"
}
```

---

### Scenario 3: Admin Monitoring Rejected Deliveries

**Step 1:** Driver rejects delivery
```json
POST http://localhost:5000/api/driver/deliveries/1/respond
Authorization: Bearer {driver_token}

{
  "action": "reject",
  "reason": "Vehicle breakdown, cannot deliver today"
}
```

**Step 2:** Admin checks all deliveries
```json
GET http://localhost:5000/api/admin/deliveries?status=RECEIVED
Authorization: Bearer {admin_token}
```

**Response shows rejected delivery:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "RECEIVED",
      "rejectedAt": "2026-01-29T10:35:00.000Z",
      "rejectionReason": "Vehicle breakdown, cannot deliver today",
      "driverId": null,
      "customer": {
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

**Step 3:** Admin reviews rejection reason and reassigns
```json
POST http://localhost:5000/api/admin/deliveries/1/assign
Authorization: Bearer {admin_token}

{
  "driverId": 7
}
```

---

### Scenario 4: Error Cases

#### Test 1: Complete without accepting
```json
POST http://localhost:5000/api/driver/deliveries/1/complete
Authorization: Bearer {driver_token}

{
  "receivedBy": "Jane Smith",
  "signatureUrl": "https://example.com/sig.png"
}
```
**Expected:** `400 Error - You must accept the delivery before completing it`

#### Test 2: Accept twice
```json
// First accept - Success
POST http://localhost:5000/api/driver/deliveries/1/respond
{ "action": "accept" }

// Second accept - Error
POST http://localhost:5000/api/driver/deliveries/1/respond
{ "action": "accept" }
```
**Expected:** `400 Error - Delivery already accepted`

#### Test 3: Reject without reason
```json
POST http://localhost:5000/api/driver/deliveries/1/respond

{
  "action": "reject"
}
```
**Expected:** `400 Error - Rejection reason is required when action is 'reject'`

#### Test 4: Invalid action
```json
POST http://localhost:5000/api/driver/deliveries/1/respond

{
  "action": "pending"
}
```
**Expected:** `400 Error - Action must be either 'accept' or 'reject'`

#### Test 5: Reject after accepting
```json
// First accept
POST http://localhost:5000/api/driver/deliveries/1/respond
{ "action": "accept" }

// Try to reject
POST http://localhost:5000/api/driver/deliveries/1/respond
{ "action": "reject", "reason": "Changed my mind" }
```
**Expected:** `400 Error - Cannot reject an already accepted delivery`

---

## Database Fields

After acceptance/rejection, check these fields in the database:

**Accepted Delivery:**
```
acceptedAt: "2026-01-29T10:30:00.000Z"
rejectedAt: null
rejectionReason: null
status: "ALLOCATED"
driverId: 5
```

**Rejected Delivery:**
```
acceptedAt: null
rejectedAt: "2026-01-29T10:35:00.000Z"
rejectionReason: "Unable to deliver due to vehicle breakdown"
status: "RECEIVED"
driverId: null
```

**Completed Delivery:**
```
acceptedAt: "2026-01-29T10:30:00.000Z"
deliveredAt: "2026-01-29T11:00:00.000Z"
status: "DELIVERED"
driverId: 5
```

---

## Postman Collection Tips

1. **Create Environment Variables:**
   - `baseUrl`: `http://localhost:5000`
   - `adminToken`: (set after admin login)
   - `driverToken`: (set after driver login)
   - `customerToken`: (set after customer login)
   - `deliveryId`: (set after creating delivery)

2. **Pre-request Scripts** (for login endpoints):
```javascript
pm.environment.set("adminToken", pm.response.json().token);
```

3. **Test Scripts** (to validate responses):
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Delivery accepted successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.delivery.acceptedAt).to.not.be.null;
    pm.expect(jsonData.delivery.status).to.eql("ALLOCATED");
});
```

---

## Quick Reference

| Action | Method | Endpoint | Auth | Required Fields |
|--------|--------|----------|------|----------------|
| Accept Delivery | POST | `/api/driver/deliveries/:id/respond` | Driver | `action: "accept"` |
| Reject Delivery | POST | `/api/driver/deliveries/:id/respond` | Driver | `action: "reject"`, `reason` |
| Complete Delivery | POST | `/api/driver/deliveries/:id/complete` | Driver | `receivedBy`, `signatureUrl` |
| View Deliveries | GET | `/api/driver/deliveries` | Driver | - |
| **View All Deliveries** | **GET** | **`/api/admin/deliveries`** | **Admin** | **Query params (optional)** |
| **View Rejected Deliveries** | **GET** | **`/api/admin/deliveries?status=RECEIVED`** | **Admin** | **-** |
| Assign Driver | POST | `/api/admin/deliveries/:id/assign` | Admin | `driverId` |
| **Update Slot Capacity** | **PUT** | **`/api/admin/slots/:id/capacity`** | **Admin** | **`method`, `value`** |
| View Slot Availability | GET | `/api/admin/slots` | Admin | Query params (optional) |

---

## Notes

- Driver must be authenticated with valid JWT token
- Delivery must be in `ALLOCATED` status to accept/reject
- Cannot reject after accepting
- Cannot accept after rejecting
- Completion requires prior acceptance

**Admin Monitoring:**
- Admin can view all deliveries with `GET /api/admin/deliveries`
- Filter by `status=RECEIVED` to see rejected deliveries
- Rejected deliveries have `rejectedAt` timestamp and `rejectionReason` field
- Rejected deliveries have `driverId = null` and can be reassigned
- Admin should check `rejectionReason` before reassigning to understand why it was rejected
- Rejection clears driver assignment for admin reassignment
- Rejection reason is mandatory for reject action
