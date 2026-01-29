# Slot Availability Implementation - Test Guide

## 🎯 Implementation Complete

The slot availability system has been fully implemented with the following components:

### ✅ Implemented Features

#### 1. **Admin - Set Slot Availability**
```http
POST /api/admin/slots
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "date": "2026-01-30",
  "timeSlot": "AM",
  "maxCapacity": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Slot availability updated successfully",
  "data": {
    "id": 1,
    "date": "2026-01-30T00:00:00.000Z",
    "timeSlot": "AM",
    "maxCapacity": 10,
    "booked": 0,
    "isFull": false,
    "updatedAt": "2026-01-29T..."
  }
}
```

#### 2. **Admin - View All Slots**
```http
GET /api/admin/slots?date=2026-01-30
Authorization: Bearer <admin_token>
```

**Optional filters:**
- `date` - Filter by specific date (YYYY-MM-DD)
- `timeSlot` - Filter by AM, PM, or SAME_DAY

---

#### 3. **Customer - Check Slot Availability**
```http
GET /api/public/slots/availability?date=2026-01-30
```

**No authentication required**

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-30",
    "slots": {
      "AM": {
        "available": true,
        "maxCapacity": 10,
        "booked": 3,
        "remaining": 7
      },
      "PM": {
        "available": false,
        "maxCapacity": 10,
        "booked": 10,
        "remaining": 0
      }
    }
  }
}
```

---

#### 4. **Customer - Create Delivery (With Slot Validation)**
```http
POST /api/deliveries
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "deliveryDate": "2026-01-30",
  "timeSlot": "AM",
  "weight": 500,
  "deliveryAddress": "123 Main St, Chester CH1 1AA",
  "customerName": "John Doe",
  "customerPhone": "01234567890",
  "spoNumber": "SPO12345",
  "requestedBy": "Jane Smith"
}
```

**Success Response (Slot Available):**
```json
{
  "success": true,
  "message": "Delivery request created successfully",
  "data": {
    "id": 123,
    "deliveryDate": "2026-01-30T00:00:00.000Z",
    "timeSlot": "AM",
    "status": "RECEIVED",
    "totalPrice": 45.00
  }
}
```

**Error Response (Slot Full):**
```json
{
  "success": false,
  "message": "AM slot is full for 1/30/2026. Please choose another time slot or date."
}
```

---

#### 5. **Customer - Cancel Delivery (Slot Booking Decremented)**
```http
DELETE /api/deliveries/:id
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "reason": "Delivery rescheduled"
}
```

**What Happens:**
1. Delivery status changed to CANCELLED
2. Slot `booked` count decremented by 1
3. Slot `isFull` set to false (slot freed up)

---

#### 6. **Driver - View Slot Capacity**
```http
GET /api/driver/slots?date=2026-01-30
Authorization: Bearer <driver_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-30",
    "slots": [
      {
        "timeSlot": "AM",
        "totalDeliveries": 8,
        "maxCapacity": 10,
        "isFull": false,
        "myDeliveries": 3
      },
      {
        "timeSlot": "PM",
        "totalDeliveries": 10,
        "maxCapacity": 10,
        "isFull": true,
        "myDeliveries": 5
      }
    ]
  }
}
```

---

## 🔄 Complete Workflow

### Scenario: Admin sets slots, customer books, then cancels

```bash
# Step 1: Admin sets AM slot capacity to 10
POST /api/admin/slots
{
  "date": "2026-01-30",
  "timeSlot": "AM",
  "maxCapacity": 10
}
# Result: booked = 0, isFull = false

# Step 2: Customer checks availability
GET /api/public/slots/availability?date=2026-01-30
# Result: AM available (0/10), PM not configured

# Step 3: Customer creates delivery
POST /api/deliveries
{
  "deliveryDate": "2026-01-30",
  "timeSlot": "AM",
  ...
}
# Result: Delivery created, booked = 1, isFull = false

# Step 4: 9 more customers book the same slot
# Result: booked = 10, isFull = true

# Step 5: Next customer tries to book
POST /api/deliveries
{
  "deliveryDate": "2026-01-30",
  "timeSlot": "AM",
  ...
}
# Result: ERROR - "AM slot is full for 1/30/2026..."

# Step 6: First customer cancels
DELETE /api/deliveries/123
{
  "reason": "Changed plans"
}
# Result: booked = 9, isFull = false

# Step 7: Next customer can now book
POST /api/deliveries
{
  "deliveryDate": "2026-01-30",
  "timeSlot": "AM",
  ...
}
# Result: Success! booked = 10, isFull = true
```

---

## 📋 Testing Checklist

### Admin Tests
- [ ] Create slot for specific date and time
- [ ] Update existing slot capacity
- [ ] View all slots with filters
- [ ] Verify slot is created with correct defaults (booked=0, isFull=false)

### Customer Tests  
- [ ] Check slot availability before booking
- [ ] Successfully book delivery when slot available
- [ ] Receive error when slot is full
- [ ] Verify slot count increments after booking
- [ ] Cancel delivery and verify slot count decrements
- [ ] Book SAME_DAY delivery (should skip slot validation)

### Driver Tests
- [ ] View slot capacity for specific date
- [ ] See total deliveries vs personal deliveries
- [ ] Verify counts match actual allocated deliveries

### Edge Cases
- [ ] Booking when no slot configured (should show error message)
- [ ] Cancelling already cancelled delivery (slot should not decrement twice)
- [ ] Updating slot capacity when deliveries already booked
- [ ] Multiple simultaneous bookings (race condition test)

---

## 🐛 Error Scenarios

### 1. Slot Not Configured
```
POST /api/deliveries
timeSlot: "AM", date: "2026-02-01"

Error: "No slot availability configured for AM on 2/1/2026. Please contact admin."
```

### 2. Slot Full
```
POST /api/deliveries
timeSlot: "PM", date: "2026-01-30"

Error: "PM slot is full for 1/30/2026. Please choose another time slot or date."
```

### 3. Invalid Date Format
```
GET /api/public/slots/availability?date=30-01-2026

Error: "Date parameter is required (format: YYYY-MM-DD)"
```

---

## 🔍 Database Verification

```sql
-- Check slot availability
SELECT * FROM "SlotAvailability" 
WHERE date = '2026-01-30' 
ORDER BY "timeSlot";

-- Verify booked count matches deliveries
SELECT 
  s.date,
  s."timeSlot",
  s.booked AS "Slot Booked Count",
  COUNT(d.id) AS "Actual Deliveries",
  s."maxCapacity",
  s."isFull"
FROM "SlotAvailability" s
LEFT JOIN "Delivery" d ON 
  d."deliveryDate" = s.date 
  AND d."timeSlot" = s."timeSlot"
  AND d.status != 'CANCELLED'
WHERE s.date = '2026-01-30'
GROUP BY s.id, s.date, s."timeSlot";
```

---

## 📊 Monitoring

### Key Metrics to Track
1. **Slot Utilization Rate**: `booked / maxCapacity`
2. **Overbooking Incidents**: Cases where `booked > maxCapacity`
3. **Slot Availability**: Percentage of slots not full
4. **Cancellation Impact**: How often cancellations free up full slots

### Admin Dashboard Queries
```javascript
// Get today's slot utilization
GET /api/admin/slots?date=2026-01-29

// Most popular time slots
// (Custom query - add to analytics if needed)
```

---

## 🚀 Next Steps (Future Enhancements)

1. **Auto-create slots** - Automatically create slots for next 30 days
2. **Dynamic capacity** - Adjust capacity based on driver availability
3. **Waitlist** - Allow customers to join waitlist for full slots
4. **Slot notifications** - Alert customers when slot becomes available
5. **Cron job** - Reset old slot data (e.g., delete slots older than 90 days)

---

## ✅ Implementation Summary

All slot availability features are now **fully implemented**:
- ✅ Admin can create/update slot capacity
- ✅ Customers can check slot availability (public endpoint)
- ✅ Delivery creation validates slots and increments count
- ✅ Delivery cancellation decrements slot count
- ✅ Drivers can view slot capacity and their assignments
- ✅ Automatic `isFull` flag management
- ✅ Same-day deliveries skip slot validation

**Status:** Ready for testing and production use.
