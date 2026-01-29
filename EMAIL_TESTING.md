# Email System Testing Guide

## Overview
The M19 Logistics email system has been implemented with the following features:
- Automated email notifications for all key delivery workflow events
- Professional HTML templates
- Support for attachments (signatures, delivery photos)
- Uses Gmail SMTP (`hahm56825@gmail.com`) for sending

---

## Email Triggers Implemented

### 1. ✅ New Delivery Request
**When:** Customer creates a new delivery
**Recipient:** Admin (`hahm56825@gmail.com`)
**Subject:** `New Delivery Request – [Customer Name] – SPO: [Number]`
**Content:**
- Delivery details (SPO, date, time slot, address, weight)
- Customer information
- Estimated price
- Special instructions

**Test:**
```bash
POST /api/deliveries
Authorization: Bearer {customer_token}

{
  "spoNumber": "SPO123",
  "deliveryDate": "2026-02-01",
  "timeSlot": "AM",
  "weight": 800,
  "deliveryAddress": "123 Test St",
  "customerName": "John Doe",
  "customerPhone": "07123456789",
  "specialInstructions": "Leave at back door"
}
```

---

### 2. ✅ Same-Day Delivery Alert
**When:** Customer selects today's date with `SAME_DAY` time slot
**Recipient:** Admin (`hahm56825@gmail.com`)
**Subject:** `⚠️ Same-Day Delivery Request – CONFIRMATION REQUIRED – SPO: [Number]`
**Content:**
- Customer details
- Warning that customer was advised to call
- Action required: Contact customer to confirm

**Test:**
```bash
POST /api/deliveries
{
  "deliveryDate": "2026-01-29", // Today
  "timeSlot": "SAME_DAY"
}
```

---

### 3. ✅ Driver Assignment
**When:** Admin allocates delivery to driver
**Recipients:** 
- Driver email
- Customer email

**Driver Email:**
- Subject: `New Delivery Assignment – [Date] – SPO: [Number]`
- Store name and contact (click-to-call)
- Delivery details
- Action required: Accept or reject

**Customer Email:**
- Subject: `Your Delivery Has Been Scheduled – SPO: [Number]`
- Driver name and contact
- Expected delivery time

**Test:**
```bash
POST /api/admin/deliveries/1/allocate
Authorization: Bearer {admin_token}

{
  "driverId": 23
}
```

---

### 4. ✅ Driver Accepts Delivery
**When:** Driver accepts assigned delivery
**Recipient:** Customer email
**Subject:** `Delivery Confirmed – Driver Accepted – SPO: [Number]`
**Content:**
- Confirmation that driver accepted
- Delivery date and time slot
- Message: "Your delivery is confirmed and on the way!"

**Test:**
```bash
POST /api/driver/deliveries/1/respond
Authorization: Bearer {driver_token}

{
  "action": "accept"
}
```

---

### 5. ✅ Driver Rejects Delivery
**When:** Driver rejects assigned delivery
**Recipient:** Admin (`hahm56825@gmail.com`)
**Subject:** `⚠️ Delivery Rejected – Reassignment Required – SPO: [Number] – [Customer]`
**Content:**
- Driver name who rejected
- Customer details
- Rejection reason
- Action required: Reassign to another driver

**Test:**
```bash
POST /api/driver/deliveries/1/respond
Authorization: Bearer {driver_token}

{
  "action": "reject",
  "reason": "Vehicle breakdown"
}
```

---

### 6. ✅ Delivery Completed
**When:** Driver completes delivery with signature and photo
**Recipient:** Customer email
**Subject:** `M19 Logistics – Completed Delivery Confirmation (SPO: [Number])`
**Content:**
- Received by name
- Date and time of delivery
- Driver name
- Driver notes (if any)
**Attachments:**
- Signature image
- Delivery photo

**Test:**
```bash
POST /api/driver/deliveries/1/complete
Authorization: Bearer {driver_token}

{
  "receivedBy": "Jane Smith",
  "signatureUrl": "https://example.com/sig.png",
  "photoUrl": "https://example.com/photo.jpg",
  "driverNotes": "Left at rear door as requested"
}
```

---

### 7. ✅ Slot Capacity Warning
**When:** Slot reaches 80% or 100% capacity
**Recipient:** Admin (`hahm56825@gmail.com`)
**Subject:** `⚠️ Slot Capacity Alert – [Date] [AM/PM] – [%]% [FULL/Filled]`
**Content:**
- Date and time slot
- Current bookings vs max capacity
- Percentage filled
- Warning or full alert

**Triggered automatically when slot capacity is checked**

---

## Email Configuration

**SMTP Settings:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hahm56825@gmail.com
EMAIL_PASS=bivf agof aaqs aczd
EMAIL_SECURE=false
```

**From Address:**
All emails sent from: `M19 Logistics <hahm56825@gmail.com>`

**Reply-To Addresses:**
- Delivery-related: `deliveries@m19logistics.com`
- Admin-related: `admin@m19logistics.com`

---

## Testing Checklist

### ✅ Delivery Workflow Emails
- [ ] Customer creates delivery → Admin receives notification
- [ ] Customer creates same-day delivery → Admin receives alert
- [ ] Admin assigns driver → Driver receives assignment email
- [ ] Admin assigns driver → Customer receives scheduled notification
- [ ] Driver accepts → Customer receives confirmation
- [ ] Driver rejects → Admin receives rejection alert
- [ ] Driver completes → Customer receives proof with attachments

### ✅ Email Content Validation
- [ ] All emails display correctly in Gmail
- [ ] HTML formatting renders properly
- [ ] Tables and styling work on mobile
- [ ] Click-to-call links work on mobile
- [ ] Attachments (signature/photo) are included

### ✅ Error Handling
- [ ] Failed emails don't crash the application
- [ ] Errors are logged to console
- [ ] Delivery/assignment still succeeds even if email fails

---

## Common Issues & Fixes

### Issue: Emails not sending
**Check:**
1. Gmail credentials in `.env` are correct
2. "Less secure app access" is enabled in Gmail (if using password)
3. Using App Password instead of regular password
4. Network/firewall not blocking port 587

### Issue: Emails going to spam
**Solutions:**
- Recipients should whitelist `hahm56825@gmail.com`
- Add sender to contacts
- Use proper domain emails in production

### Issue: Attachments not working
**Check:**
- Signature/photo URLs are accessible
- Files exist at the specified paths
- File size is not too large for email

---

## Production Recommendations

1. **Use Domain Emails:**
   - Set up proper `@m19logistics.com` email accounts
   - Use professional email service (SendGrid, AWS SES)

2. **Email Queue:**
   - Implement proper queue (Bull, RabbitMQ)
   - Retry failed emails automatically
   - Track email delivery status

3. **Templates:**
   - Move HTML to separate template files
   - Use template engine (Handlebars, EJS)
   - Support email customization per customer

4. **Monitoring:**
   - Log all sent emails to database
   - Track open/click rates
   - Alert on high failure rates

5. **Compliance:**
   - Add unsubscribe links (for marketing emails)
   - Include company address
   - Follow GDPR/CAN-SPAM regulations

---

## Email Methods Available

```javascript
const emailService = require('./services/emailService');

// Send new delivery notification
await emailService.sendNewDeliveryNotification(delivery, customer);

// Send driver assignment
await emailService.sendDriverAssignmentNotification(delivery, driver, customer);

// Send driver acceptance
await emailService.sendDriverAcceptanceNotification(delivery, customer);

// Send driver rejection
await emailService.sendDriverRejectionNotification(delivery, customer, driver, reason);

// Send delivery completed
await emailService.sendDeliveryCompletedNotification(
  delivery, customer, driver, receivedBy, driverNotes, signatureUrl, photoUrl
);

// Send same-day alert
await emailService.sendSameDayDeliveryAlert(delivery, customer);

// Send slot capacity warning
await emailService.sendSlotCapacityWarning(date, timeSlot, booked, maxCapacity);

// Send cancellation notification
await emailService.sendDeliveryCancellationNotification(delivery, customer, cancelledBy, reason);
```

---

## Notes

- All email sending is wrapped in try-catch blocks
- Failed emails are logged but don't crash the application
- Emails are sent asynchronously (non-blocking)
- HTML emails include plain text fallback
- All emails are responsive (mobile-friendly)

---

## Next Steps

1. Test complete delivery workflow end-to-end
2. Verify emails in actual Gmail inbox
3. Test on mobile devices
4. Implement weekly invoice emails
5. Add driver feedback summary report
6. Consider email queue for production
