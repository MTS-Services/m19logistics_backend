# System Settings API Documentation

Complete API documentation for managing system settings including company information, banking details, and system configuration.

---

## Authentication

All settings endpoints require **ADMIN authentication**.

**Headers Required:**
```
Authorization: Bearer <admin_token>
```

---

## 📊 GET All Settings

Retrieve all system settings grouped by category.

**Endpoint:** `GET /api/admin/settings`

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "M19 Logistics Limited",
      "vat_number": "447 5918 54",
      "primary_phone": "07971415430",
      "alternative_phone": "07577574676",
      "email": "ben@m19logistics.com",
      "website": "www.m19logistics.com",
      "address": "Wrexham, United Kingdom",
      "founded_year": "2019"
    },
    "banking": {
      "bank_name": "NatWest Bank",
      "account_holder": "M19 Logistics Limited",
      "sort_code": "01-10-01",
      "account_number": "72696370",
      "payment_terms": "30 Days (End of Month)"
    },
    "system": {
      "invoice_generation_day": "Sunday",
      "invoice_generation_time": "12:00 AM",
      "session_timeout": "30",
      "auto_invoicing": "true",
      "email_notifications": "true",
      "sms_notifications": "false",
      "maps_api_enabled": "true",
      "last_invoice_number": "326"
    }
  }
}
```

---

## 📋 GET Settings by Category

Retrieve settings for a specific category.

**Endpoint:** `GET /api/admin/settings/:category`

**Categories:**
- `company` - Company information
- `banking` - Banking details
- `system` - System configuration

**Example:** `GET /api/admin/settings/company`

**Response:**
```json
{
  "success": true,
  "category": "company",
  "data": {
    "name": "M19 Logistics Limited",
    "vat_number": "447 5918 54",
    "primary_phone": "07971415430",
    "alternative_phone": "07577574676",
    "email": "ben@m19logistics.com",
    "website": "www.m19logistics.com",
    "address": "Wrexham, United Kingdom",
    "founded_year": "2019"
  }
}
```

---

## ✅ GET System Status Summary

Get a quick overview of system status.

**Endpoint:** `GET /api/admin/settings/status/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "systemStatus": "Active",
    "emailConfig": "Enabled",
    "mapsApi": "Active",
    "autoInvoicing": "On"
  }
}
```

---

## 📅 GET Invoice Generation Config

Get invoice generation schedule configuration.

**Endpoint:** `GET /api/admin/settings/invoice/config`

**Response:**
```json
{
  "success": true,
  "data": {
    "day": "Sunday",
    "time": "12:00 AM"
  }
}
```

---

## 🏢 UPDATE Company Information

Update company details.

**Endpoint:** `PUT /api/admin/settings/company`

**Request Body:**
```json
{
  "name": "M19 Logistics Limited",
  "vat_number": "447 5918 54",
  "primary_phone": "07971415430",
  "alternative_phone": "07577574676",
  "email": "ben@m19logistics.com",
  "website": "www.m19logistics.com",
  "address": "Wrexham, United Kingdom",
  "founded_year": "2019"
}
```

**All fields are optional** - only send fields you want to update.

**Response:**
```json
{
  "success": true,
  "message": "Company information updated successfully",
  "data": {
    "name": "M19 Logistics Limited",
    "vat_number": "447 5918 54",
    "primary_phone": "07971415430",
    "alternative_phone": "07577574676",
    "email": "ben@m19logistics.com",
    "website": "www.m19logistics.com",
    "address": "Wrexham, United Kingdom",
    "founded_year": "2019"
  }
}
```

---

## 💰 UPDATE Banking Details

Update banking information.

**Endpoint:** `PUT /api/admin/settings/banking`

**Request Body:**
```json
{
  "bank_name": "NatWest Bank",
  "account_holder": "M19 Logistics Limited",
  "sort_code": "01-10-01",
  "account_number": "72696370",
  "payment_terms": "30 Days (End of Month)"
}
```

**All fields are optional** - only send fields you want to update.

**Response:**
```json
{
  "success": true,
  "message": "Banking details updated successfully",
  "data": {
    "bank_name": "NatWest Bank",
    "account_holder": "M19 Logistics Limited",
    "sort_code": "01-10-01",
    "account_number": "72696370",
    "payment_terms": "30 Days (End of Month)"
  }
}
```

---

## ⚙️ UPDATE System Configuration

Update system settings.

**Endpoint:** `PUT /api/admin/settings/system`

**Request Body:**
```json
{
  "invoice_generation_day": "Sunday",
  "invoice_generation_time": "12:00 AM",
  "session_timeout": "30",
  "auto_invoicing": "true",
  "email_notifications": "true",
  "sms_notifications": "false",
  "maps_api_enabled": "true"
}
```

**All fields are optional** - only send fields you want to update.

**Field Options:**
- `invoice_generation_day`: "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
- `invoice_generation_time`: Any time in 12-hour format (e.g., "12:00 AM", "6:00 PM")
- `session_timeout`: Minutes as string (e.g., "30", "60", "120")
- `auto_invoicing`: "true" or "false"
- `email_notifications`: "true" or "false"
- `sms_notifications`: "true" or "false"
- `maps_api_enabled`: "true" or "false"

**Response:**
```json
{
  "success": true,
  "message": "System configuration updated successfully",
  "data": {
    "invoice_generation_day": "Sunday",
    "invoice_generation_time": "12:00 AM",
    "session_timeout": "30",
    "auto_invoicing": "true",
    "email_notifications": "true",
    "sms_notifications": "false",
    "maps_api_enabled": "true"
  }
}
```

---

## 🔧 UPDATE Single Setting

Update any specific setting by key.

**Endpoint:** `PUT /api/admin/settings/single`

**Request Body:**
```json
{
  "key": "COMPANY_NAME",
  "value": "M19 Logistics Limited",
  "description": "Updated company name"
}
```

**Fields:**
- `key` (required): Setting key in UPPERCASE
- `value` (required): New value
- `description` (optional): Description of the setting

**Response:**
```json
{
  "success": true,
  "message": "Setting updated successfully"
}
```

---

## 📝 Usage Examples

### Example 1: Update Only Company Name

```bash
PUT /api/admin/settings/company
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "M19 Logistics Ltd"
}
```

### Example 2: Update Invoice Generation Schedule

```bash
PUT /api/admin/settings/system
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "invoice_generation_day": "Friday",
  "invoice_generation_time": "6:00 PM"
}
```

### Example 3: Enable Email Notifications

```bash
PUT /api/admin/settings/system
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "email_notifications": "true"
}
```

### Example 4: Update Banking Sort Code

```bash
PUT /api/admin/settings/banking
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "sort_code": "01-10-01"
}
```

---

## 🔐 Security Notes

1. **Admin Only**: All settings endpoints require ADMIN role
2. **Validation**: All inputs are validated for correct format
3. **Audit Trail**: Consider logging setting changes in audit logs
4. **Sensitive Data**: Banking details should be handled securely

---

## 📚 Integration with Frontend

### React Example

```javascript
// Fetch all settings
const fetchSettings = async () => {
  const response = await fetch('http://localhost:5000/api/admin/settings', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const data = await response.json();
  return data.data;
};

// Update company info
const updateCompanyInfo = async (companyData) => {
  const response = await fetch('http://localhost:5000/api/admin/settings/company', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(companyData)
  });
  return await response.json();
};
```

---

## 🎯 Default Values

After seeding, the following default values are set:

**Company Information:**
- Name: M19 Logistics Limited
- VAT: 447 5918 54
- Primary Phone: 07971415430
- Alternative Phone: 07577574676
- Email: ben@m19logistics.com
- Website: www.m19logistics.com
- Address: Wrexham, United Kingdom
- Founded: 2019

**Banking Details:**
- Bank: NatWest Bank
- Account Holder: M19 Logistics Limited
- Sort Code: 01-10-01
- Account Number: 72696370
- Payment Terms: 30 Days (End of Month)

**System Configuration:**
- Invoice Day: Sunday
- Invoice Time: 12:00 AM
- Session Timeout: 30 minutes
- Auto Invoicing: Enabled
- Email Notifications: Enabled
- SMS Notifications: Disabled
- Maps API: Enabled

---

## 🔄 To Seed Settings

Run the following command to populate default settings:

```bash
npm run prisma:seed
```

This will create all default settings if they don't exist.

---

## ✅ Testing Checklist

- [ ] Get all settings
- [ ] Get company settings
- [ ] Get banking settings
- [ ] Get system settings
- [ ] Get system status
- [ ] Get invoice config
- [ ] Update company name
- [ ] Update VAT number
- [ ] Update all company fields
- [ ] Update bank details
- [ ] Update payment terms
- [ ] Update invoice schedule
- [ ] Enable/disable auto invoicing
- [ ] Enable/disable email notifications
- [ ] Update single setting

---

**Created for M19 Logistics Admin Panel**
