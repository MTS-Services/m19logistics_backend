# Distance API & Delivery Process Testing Guide

This guide explains how to verify the new real-distance calculation (Nominatim → OSRM → Haversine fallback) works correctly end-to-end in the delivery creation flow.

---

## How It Works

When a delivery is created, the system calculates price using:

```
Depot Address (customer's stored depotAddress)
         ↓
   geocodeAddress()  →  Nominatim API (OpenStreetMap)
         ↓
   calculateDistance()  →  OSRM (real driving distance in miles)
         ↓  (if OSRM fails)
   haversineDistance()  →  straight-line maths fallback
         ↓
   calculateDeliveryPrice()  →  stores distanceFromDepot on the delivery
```

---

## Prerequisites

1. **Server running** — start with:
   ```bash
   npm start
   # or
   npm run dev
   ```
2. **Customer account exists** with a `depotAddress` set in their profile (e.g. `"Manchester M1 1AE"`)
3. **Base URL**: `http://localhost:3000/api` (adjust port as needed)

---

## Step 1 — Confirm Customer Has a Depot Address

Log in as the customer and check their profile:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "customer@store.com",
  "password": "yourpassword"
}
```

Save the returned `token`. Then:

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

Check the response for:
```json
{
  "customerProfile": {
    "depotAddress": "Manchester M1 1AE"
  }
}
```

> **If `depotAddress` is null or empty**, the distance will always fall back to the default (20 miles). Update it first:
>
> ```http
> PUT /api/auth/profile
> Authorization: Bearer <token>
> Content-Type: application/json
>
> {
>   "depotAddress": "Manchester M1 1AE"
> }
> ```

---

## Step 2 — Create a Test Delivery

```http
POST /api/deliveries
Authorization: Bearer <token>
Content-Type: application/json

{
  "spoNumber": "SPO-TEST-001",
  "deliveryDate": "2026-03-20",
  "timeSlot": "AM",
  "weight": 800,
  "deliveryAddress": "Newcastle Upon Tyne NE1 5DL",
  "customerName": "Test Store",
  "customerPhone": "07700900000",
  "requestedBy": "Store Manager"
}
```

### Expected Response (success)

```json
{
  "success": true,
  "message": "Delivery request created successfully",
  "confirmed": true,
  "bookingConfirmation": {
    "bookingId": 42,
    "spoNumber": "SPO-TEST-001",
    "totalPrice": 54.00
  },
  "data": {
    "distanceFromDepot": 98.3,
    "calculatedBasePrice": 37.50,
    "distanceSurcharge": 18.75,
    "subtotal": 56.25,
    "vatAmount": 11.25,
    "totalPrice": 67.50
  }
}
```

**Key field to verify**: `distanceFromDepot` should be a realistic driving distance in miles between the depot and delivery address — **not** a random number between 10 and 49.

---

## Step 3 — Verify the Distance in Server Logs

Watch the terminal where your server is running. You should see **no warning** if OSRM succeeded:

```
# Good — OSRM worked (no log output, silent success)
```

If Nominatim fails for one address:
```
[calculateDistance] Geocoding failed for "Bad Address", using haversine fallback
```

If OSRM is down but geocoding worked:
```
[calculateDistance] OSRM unavailable, using haversine: 94.2 miles
```

If everything fails:
```
[calculateDistance] Unexpected error: ...
```
> Delivery still succeeds but `distanceFromDepot` will be `20` (safe default).

---

## Step 4 — Test Distance Manually (Without Creating a Delivery)

You can test the Nominatim and OSRM APIs directly in your browser or with curl:

### 4a — Geocode an address (Nominatim)

```
GET https://nominatim.openstreetmap.org/search?q=Manchester+M1+1AE&format=json&limit=1&countrycodes=gb
```

Expected: array with `lat` and `lon` fields.

### 4b — Get driving distance (OSRM)

Replace `{lon1},{lat1}` and `{lon2},{lat2}` with the coordinates from step 4a:

```
GET https://router.project-osrm.org/route/v1/driving/-2.2374,53.4808;-1.6140,54.9783?overview=false
```

Expected response:
```json
{
  "routes": [
    {
      "distance": 156432.5,   ← metres
      "duration": 5640.2
    }
  ]
}
```

> `156432.5 ÷ 1609.344 = 97.2 miles`

---

## Step 5 — Test Distance Surcharge Calculation

The pricing formula applies a **50% surcharge per extra 45-mile zone** beyond the first 45 miles.

| Scenario | Distance | Base Price | Zones | Surcharge | Subtotal | VAT (20%) | Total |
|----------|----------|------------|-------|-----------|----------|-----------|-------|
| Local | 30 miles | £37.50 | 0 | £0.00 | £37.50 | £7.50 | £45.00 |
| Zone 2 | 60 miles | £37.50 | 1 | £18.75 | £56.25 | £11.25 | £67.50 |
| Zone 3 | 110 miles | £37.50 | 2 | £37.50 | £75.00 | £15.00 | £90.00 |

To trigger zone 2, use a delivery address ~60+ miles from the depot.

**Example pairs (Manchester depot):**
- **Local (<45 mi)**: `"Sheffield S1 1AA"` (~37 miles)
- **Zone 2 (45–90 mi)**: `"Newcastle Upon Tyne NE1 1AA"` (~100 miles)
- **Zone 3 (90–135 mi)**: `"Edinburgh EH1 1YZ"` (~220 miles)

---

## Step 6 — Retrieve a Delivery to Confirm Stored Distance

```http
GET /api/deliveries/42
Authorization: Bearer <token>
```

Confirm that `distanceFromDepot` stored on the delivery record matches what you expected.

---

## Step 7 — Admin Verification

Log in as admin and view the delivery list to confirm pricing breakdown is correct:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@m19logistics.com",
  "password": "admin@123"
}
```

```http
GET /api/admin/deliveries?search=SPO-TEST-001
Authorization: Bearer <admin-token>
```

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| `distanceFromDepot` is `20` | Both geocodes failed | Check `depotAddress` and `deliveryAddress` are valid UK addresses |
| `distanceFromDepot` is a decimal like `97.2` but seems wrong | Haversine (straight-line) used instead of OSRM | Check server logs for OSRM warning; OSRM may be temporarily down |
| `distanceFromDepot` was a random 10–49 | Old code still running | Restart the server after the code change |
| Slot full error | AM/PM slot at max capacity (5) | Use `SAME_DAY` or choose a different date/slot |
| 401 Unauthorized | Token expired | Re-login to get fresh token |
| Nominatim rate limiting | Too many requests too fast | Add a 1-second delay between test calls (Nominatim limit: 1 req/sec) |

---

## API Rate Limits (Free Tier)

| Service | Limit | Key Required |
|---------|-------|-------------|
| Nominatim (OpenStreetMap) | 1 request/second | No |
| OSRM (public demo server) | Fair use, no hard limit | No |
| Haversine fallback | Unlimited (local maths) | N/A |

> **Note**: The OSRM public demo server (`router.project-osrm.org`) is suitable for development and low-volume production. For high traffic, consider self-hosting OSRM or switching to OpenRouteService (2,000 req/day free with API key).
