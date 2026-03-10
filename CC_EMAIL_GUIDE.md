# CC Email Per Customer – Guide

## What is it?

When M19 Logistics emails an invoice to a customer, the system can automatically **CC (carbon copy) a third-party email address** on that same email.

**Use cases:**
- A store's head office wants a copy of every invoice
- A customer's accountant needs to receive invoices directly
- A manager at the customer's company wants to be looped in on payments

The CC email is set **per customer** — each customer can have a different CC address (or none at all).

---

## Which emails are affected?

| Email Type | CC Applied? |
|---|---|
| Weekly invoice auto-email (sent after cron generation) | ✅ Yes |
| Invoice payment reminder email | ✅ Yes |

---

## How to set a CC email for a customer

### API Endpoint

```
PUT /api/admin/customers/:id/cc-email
```

- `:id` = the User ID of the customer
- Requires **ADMIN** or **MANAGER** role token

### Set a CC email

```json
PUT /api/admin/customers/46/cc-email
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "ccEmail": "accounts@customerbusiness.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "CC email set to accounts@customerbusiness.com",
  "data": {
    "ccEmail": "accounts@customerbusiness.com"
  }
}
```

### Clear / remove a CC email

```json
PUT /api/admin/customers/46/cc-email
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "ccEmail": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "CC email cleared",
  "data": {
    "ccEmail": null
  }
}
```

---

## How to verify it is saved

Call the get user endpoint and check `customerProfile.ccEmail`:

```
GET /api/admin/users/46
Authorization: Bearer <your_token>
```

Look for this in the response:
```json
{
  "customerProfile": {
    "ccEmail": "accounts@customerbusiness.com",
    ...
  }
}
```

---

## How to test the CC is working on emails

1. **Set a CC email** on a test customer using the PUT endpoint above — use an email address you can access (e.g. your own Gmail).

2. **Trigger a manual invoice reminder** (does not wait for cron schedule):
   ```
   POST /api/admin/invoices/send-reminders
   Authorization: Bearer <admin_token>
   ```
   This will send reminder emails for all unpaid invoices older than 7 days. The CC address will receive a copy.

3. **Check both inboxes:**
   - The customer's primary email (`to:`) — should receive the invoice
   - Your CC email (`cc:`) — should receive the exact same email

---

## Where is the data stored?

- Database table: `CustomerProfile`
- Column: `ccEmail` (TEXT, nullable)
- Migration: `20260309054438_add_cc_email_to_customer_profile`

---

## Notes

- The CC field is **optional** — if not set, emails send normally with no CC
- Only one CC address is supported per customer
- The CC address must be a valid email format — the API will reject invalid values
- The CC is applied at send time, so updating it takes effect on the next invoice email immediately
