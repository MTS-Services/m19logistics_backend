# Driver Availability Management System

## Overview
This system allows drivers to manage their availability for different dates and time slots (AM, PM, SAME_DAY). This replaces the previous system where drivers only viewed slot capacity.

## Features
- Set availability for specific dates and time slots
- Bulk set availability for multiple dates
- View upcoming availability
- Update or remove availability entries
- Prevent setting availability for past dates

---

## Database Schema

### DriverAvailability Model
```prisma
model DriverAvailability {
  id          Int      @id @default(autoincrement())
  driverId    Int
  date        DateTime @db.Date
  timeSlot    TimeSlot  // AM, PM, SAME_DAY
  isAvailable Boolean  @default(true)
  notes       String?  @db.Text
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  driver      User @relation("DriverAvailability", fields: [driverId], references: [id], onDelete: Cascade)
  
  @@unique([driverId, date, timeSlot])
  @@index([driverId])
  @@index([date])
  @@index([driverId, date])
}
```

---

## API Endpoints

### 1. Get My Availability
**GET** `/api/driver/availability`

**Query Parameters:**
- `date` (optional) - Specific date (YYYY-MM-DD)
- `startDate` (optional) - Filter from this date
- `endDate` (optional) - Filter to this date
- `timeSlot` (optional) - Filter by time slot (AM, PM, SAME_DAY)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/driver/availability?startDate=2026-03-10&endDate=2026-03-17" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "driverId": 2,
      "date": "2026-03-10T00:00:00.000Z",
      "timeSlot": "AM",
      "isAvailable": true,
      "notes": "Available for morning deliveries",
      "createdAt": "2026-03-07T12:00:00.000Z",
      "updatedAt": "2026-03-07T12:00:00.000Z"
    }
  ]
}
```

---

### 2. Set Availability
**POST** `/api/driver/availability`

**Body:**
```json
{
  "date": "2026-03-15",
  "timeSlot": "AM",
  "isAvailable": true,
  "notes": "Available for deliveries"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/driver/availability" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-03-15",
    "timeSlot": "AM",
    "isAvailable": true,
    "notes": "Available all morning"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Availability updated successfully.",
  "data": {
    "id": 1,
    "driverId": 2,
    "date": "2026-03-15T00:00:00.000Z",
    "timeSlot": "AM",
    "isAvailable": true,
    "notes": "Available all morning",
    "createdAt": "2026-03-07T12:00:00.000Z",
    "updatedAt": "2026-03-07T12:00:00.000Z"
  }
}
```

---

### 3. Bulk Set Availability
**POST** `/api/driver/availability/bulk`

Set availability for multiple dates and time slots at once.

**Body:**
```json
{
  "startDate": "2026-03-10",
  "endDate": "2026-03-17",
  "timeSlots": ["AM", "PM"],
  "isAvailable": true,
  "notes": "Available all week"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/driver/availability/bulk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-10",
    "endDate": "2026-03-17",
    "timeSlots": ["AM", "PM"],
    "isAvailable": true,
    "notes": "Available all week"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Set availability for 16 time slots",
  "count": 16,
  "data": [...]
}
```

---

### 4. Get Upcoming Availability
**GET** `/api/driver/availability/upcoming`

Get availability for the next N days (default: 14 days).

**Query Parameters:**
- `days` (optional) - Number of days to look ahead (default: 14)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/driver/availability/upcoming?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 8,
  "data": [...]
}
```

---

### 5. Update Availability
**PUT** `/api/driver/availability/:id`

Update an existing availability entry.

**Body:**
```json
{
  "isAvailable": false,
  "notes": "Not available - personal appointment"
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/driver/availability/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isAvailable": false,
    "notes": "Not available - personal appointment"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Availability updated successfully.",
  "data": {
    "id": 1,
    "driverId": 2,
    "date": "2026-03-15T00:00:00.000Z",
    "timeSlot": "AM",
    "isAvailable": false,
    "notes": "Not available - personal appointment",
    "updatedAt": "2026-03-07T13:00:00.000Z"
  }
}
```

---

### 6. Delete Availability
**DELETE** `/api/driver/availability/:id`

Remove an availability entry.

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/driver/availability/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Availability deleted successfully."
}
```

---

## Frontend Integration Examples

### View Driver's Calendar

```javascript
async function loadDriverAvailability() {
  const startDate = '2026-03-10';
  const endDate = '2026-03-17';
  
  const response = await fetch(
    `/api/driver/availability?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const result = await response.json();
  
  if (result.success) {
    // Build calendar UI with result.data
    displayCalendar(result.data);
  }
}
```

### Set Availability for a Day

```javascript
async function setAvailability(date, timeSlot, isAvailable) {
  const response = await fetch('/api/driver/availability', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      date,
      timeSlot,
      isAvailable,
      notes: isAvailable ? 'Available' : 'Not available'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert('Availability updated successfully!');
    loadDriverAvailability(); // Refresh
  }
}

// Usage
setAvailability('2026-03-15', 'AM', true);
```

### Bulk Set Availability for a Week

```javascript
async function setWeekAvailability(startDate, endDate, timeSlots) {
  const response = await fetch('/api/driver/availability/bulk', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate,
      endDate,
      timeSlots, // ['AM', 'PM']
      isAvailable: true,
      notes: 'Available for deliveries'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert(`Set availability for ${result.count} time slots`);
  }
}

// Usage: Set available for AM & PM for next week
setWeekAvailability('2026-03-10', '2026-03-17', ['AM', 'PM']);
```

### Toggle Availability (Quick Action)

```javascript
async function toggleAvailability(availabilityId, currentState) {
  const response = await fetch(`/api/driver/availability/${availabilityId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      isAvailable: !currentState
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Availability toggled');
    return result.data;
  }
}
```

---

## UI/UX Recommendations

### Calendar View
Display a calendar where drivers can:
- Click on a date to set availability
- Toggle between Available/Not Available
- Add notes for specific days
- Color-code availability status:
  - 🟢 Green: Available
  - 🔴 Red: Not Available
  - ⚪ Gray: No availability set (default available)

### Quick Actions
- "Set Available This Week" button
- "Set Available Next Month" button
- "Copy Previous Week" button
- "Clear All" button

### Mobile-Friendly
- Swipe between weeks
- Tap to toggle availability
- Long-press for options (add notes, delete entry)

---

## Validation Rules

1. **Cannot set availability for past dates**
   - Date must be today or future

2. **Unique constraint**
   - One entry per driver + date + timeslot combination
   - Update existing entry if already exists

3. **Time slots**
   - Must be: AM, PM, or SAME_DAY

4. **Bulk operations**
   - End date must be after start date
   - At least one time slot required
   - Maximum recommended: 60 days at once

---

## Admin View (Future Enhancement)

Admins could view all drivers' availability:
- See which drivers are available for a specific date/slot
- Help with manual delivery allocation
- Identify scheduling conflicts

---

## Migration Applied

✅ Migration created: `20260307060258_add_driver_availability_and_increase_slot_capacity`

Changes:
1. Added `DriverAvailability` table
2. Increased `SlotAvailability.maxCapacity` default from 5 to 10

---

## Testing

### Test Data Setup
```sql
-- Insert test availability for driver (userId = 2)
INSERT INTO "DriverAvailability" ("driverId", "date", "timeSlot", "isAvailable", "notes", "createdAt", "updatedAt")
VALUES 
  (2, '2026-03-10', 'AM', true, 'Available', NOW(), NOW()),
  (2, '2026-03-10', 'PM', true, 'Available', NOW(), NOW()),
  (2, '2026-03-11', 'AM', false, 'Not available - appointment', NOW(), NOW()),
  (2, '2026-03-12', 'AM', true, 'Available', NOW(), NOW());
```

### API Test Script
```bash
# Login as driver
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"driver1","password":"driver123"}' \
  | jq -r '.token')

# Get availability
curl -X GET "http://localhost:3000/api/driver/availability" \
  -H "Authorization: Bearer $TOKEN"

# Set availability
curl -X POST "http://localhost:3000/api/driver/availability" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-03-20","timeSlot":"AM","isAvailable":true,"notes":"Test"}'
```

---

## Slot Capacity Update

**Changed:** Default slot capacity increased from **5 to 10** deliveries per slot.

This applies to:
- New slot creations
- System default behavior
- Existing slots retain their current capacity (update manually if needed)

### Update Existing Slots (Optional)
```sql
-- Update all slots to new default capacity
UPDATE "SlotAvailability" SET "maxCapacity" = 10 WHERE "maxCapacity" = 5;
```

---

## Summary

✅ **Driver Availability System** - Fully implemented  
✅ **Slot Capacity** - Increased from 5 to 10  
✅ **API Endpoints** - 6 new endpoints for drivers  
✅ **Admin/Manager Access** - Can view any driver's availability  
✅ **Database Migration** - Applied successfully  
✅ **Validation** - Comprehensive input validation  
✅ **Security** - Driver can only manage their own availability  

Drivers can now manage their availability independently, giving them control over their schedule while providing visibility to the system for better delivery allocation.

---

## Admin and Manager Access

Admin and Manager users can view driver availability using dedicated admin endpoints or the driver endpoints:

### Option 1: View ALL Drivers' Availability (Recommended for Admin/Manager)

**GET** `/api/admin/driver-availability`

**Query Parameters (all optional):**
- `date` (optional) - Specific date (YYYY-MM-DD)
- `startDate` (optional) - Filter from this date
- `endDate` (optional) - Filter to this date
- `timeSlot` (optional) - Filter by time slot (AM, PM, SAME_DAY)
- `isAvailable` (optional) - Filter by availability (true/false)
- `driverId` (optional) - Filter by specific driver ID

**Example Request (Admin - All drivers):**
```bash
curl -X GET "http://localhost:3000/api/admin/driver-availability?startDate=2026-03-10&endDate=2026-03-17" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Request (Admin - Specific time slot):**
```bash
curl -X GET "http://localhost:3000/api/admin/driver-availability?date=2026-03-15&timeSlot=AM" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Request (Admin - Only unavailable drivers):**
```bash
curl -X GET "http://localhost:3000/api/admin/driver-availability?isAvailable=false&startDate=2026-03-10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": 1,
      "driverId": 2,
      "date": "2026-03-10T00:00:00.000Z",
      "timeSlot": "AM",
      "isAvailable": true,
      "notes": "Available for morning deliveries",
      "createdAt": "2026-03-07T12:00:00.000Z",
      "updatedAt": "2026-03-07T12:00:00.000Z",
      "driver": {
        "id": 2,
        "fullName": "John Driver",
        "email": "john@example.com",
        "phone": "07123456789",
        "driverProfile": {
          "vehicleRegistration": "ABC123",
          "isActiveDriver": true
        }
      }
    }
  ],
  "grouped": [
    {
      "date": "2026-03-10T00:00:00.000Z",
      "timeSlot": "AM",
      "drivers": [
        {
          "id": 2,
          "fullName": "John Driver",
          "email": "john@example.com",
          "phone": "07123456789",
          "vehicleRegistration": "ABC123",
          "isActiveDriver": true,
          "isAvailable": true,
          "notes": "Available for morning deliveries",
          "availabilityId": 1
        }
      ]
    }
  ]
}
```

### Option 2: View Specific Driver's Availability

**GET** `/api/admin/drivers/:id/availability`

**Path Parameters:**
- `id` (required) - Driver ID

**Query Parameters:**
- `date` (optional) - Specific date (YYYY-MM-DD)
- `startDate` (optional) - Filter from this date
- `endDate` (optional) - Filter to this date
- `timeSlot` (optional) - Filter by time slot (AM, PM, SAME_DAY)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/drivers/2/availability?startDate=2026-03-10&endDate=2026-03-17" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "driver": {
    "id": 2,
    "fullName": "John Driver",
    "email": "john@example.com"
  },
  "count": 5,
  "data": [
    {
      "id": 1,
      "driverId": 2,
      "date": "2026-03-10T00:00:00.000Z",
      "timeSlot": "AM",
      "isAvailable": true,
      "notes": "Available for morning deliveries"
    }
  ]
}
```

### Option 3: Use Driver Endpoint with driverId Parameter

**GET** `/api/driver/availability?driverId={driverId}`

**Query Parameters:**
- `driverId` (required for Admin/Manager) - The ID of the driver to view
- `date` (optional) - Specific date (YYYY-MM-DD)
- `startDate` (optional) - Filter from this date
- `endDate` (optional) - Filter to this date
- `timeSlot` (optional) - Filter by time slot (AM, PM, SAME_DAY)

**Example Request (Admin):**
```bash
curl -X GET "http://localhost:3000/api/driver/availability?driverId=2&startDate=2026-03-10&endDate=2026-03-17" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "driverId": 2,
  "data": [
    {
      "id": 1,
      "driverId": 2,
      "date": "2026-03-10T00:00:00.000Z",
      "timeSlot": "AM",
      "isAvailable": true,
      "notes": "Available for morning deliveries"
    }
  ]
}
```

### View Driver's Upcoming Availability

**GET** `/api/driver/availability/upcoming?driverId={driverId}&days={days}`

**Example Request (Manager):**
```bash
curl -X GET "http://localhost:3000/api/driver/availability/upcoming?driverId=2&days=30" \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

### Usage Notes

**For Admin/Manager:**
- **Recommended**: Use `/api/admin/driver-availability` to view ALL drivers' availability at once
- **Alternative**: Use `/api/admin/drivers/:id/availability` for a specific driver
- **Legacy**: Can also use `/api/driver/availability?driverId=X` but admin routes are preferred
- **Filters**: Support date ranges, time slots, and availability status filtering
- **Permissions**: Admin and Manager have read-only access via admin endpoints
- **Grouped Data**: The `/api/admin/driver-availability` endpoint provides both flat and grouped data for easier calendar views

**For Drivers:**
- Call `/api/driver/availability` without `driverId` parameter to view their own availability
- Only drivers can create/update/delete their own availability entries
- Admin endpoints are not accessible to driver users

**Common Use Cases:**
1. **Find available drivers for a specific date/slot**: 
   ```
   GET /api/admin/driver-availability?date=2026-03-15&timeSlot=AM&isAvailable=true
   ```

2. **View all driver schedules for the week**:
   ```
   GET /api/admin/driver-availability?startDate=2026-03-10&endDate=2026-03-17
   ```

3. **Check who's unavailable**:
   ```
   GET /api/admin/driver-availability?isAvailable=false&startDate=2026-03-10
   ```

