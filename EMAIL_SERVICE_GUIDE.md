# Email Service Guide — M19 Logistics

## Overview

The system uses **IONOS SMTP** (previously Mailgun) via **Nodemailer** to send all automated emails.
Every email in the system flows through a single shared service: `src/services/emailService.js`.

---

## SMTP Configuration

### Credentials (stored in `.env`)

```env
MAILGUN_HOST=smtp.ionos.co.uk
MAILGUN_PORT=587
MAILGUN_SMTP_USER=admin@m19logistics.com
MAILGUN_SMTP_PASS="#Tar33n187#2023"
```

> **Note:** The password is wrapped in quotes because `#` is treated as a comment character in `.env` files. Always quote passwords containing `#`, `=`, or spaces.

### How the transporter is built

```
Server starts
      ↓
EmailService class instantiated (singleton)
      ↓
First email is triggered (e.g. delivery created)
      ↓
transporter getter fires — reads process.env vars
      ↓
Nodemailer SMTP connection created to smtp.ionos.co.uk:587
      ↓
STARTTLS handshake (secure: false, port 587)
      ↓
PLAIN auth with admin@m19logistics.com / password
      ↓
Email sent
```

The transporter is created **lazily** (on first use) to ensure `.env` variables are loaded before the connection is established.

---

## Email Address Routing

Each type of email uses a specific `FROM` address:

| Email Type             | FROM Address                  | TO Address                   |
| ---------------------- | ----------------------------- | ---------------------------- |
| Delivery notifications | `deliveries@m19logistics.com` | Customer store email         |
| Invoice emails         | `invoices@m19logistics.com`   | Customer store email         |
| Admin alerts           | `admin@m19logistics.com`      | `admin@m19logistics.com`     |
| Enquiries / Contact    | `enquiries@m19logistics.com`  | `enquiries@m19logistics.com` |
| Weekly summary CC      | —                             | `ben@m19logistics.com`       |

All addresses are set in `.env`:

```env
EMAIL_DELIVERIES=deliveries@m19logistics.com
EMAIL_INVOICES=invoices@m19logistics.com
EMAIL_ADMIN=admin@m19logistics.com
EMAIL_ENQUIRIES=enquiries@m19logistics.com
EMAIL_BEN=ben@m19logistics.com
```

---

## Core Send Function

Every email goes through `sendEmail()`:

```
sendEmail({ to, cc, subject, html, attachments, from, replyTo })
      ↓
Build mailOptions object
      ↓
If cc provided → add cc field
If replyTo provided → add replyTo field
If attachments provided → add as binary files
      ↓
transporter.sendMail(mailOptions)
      ↓
Success → log messageId, return { success: true }
Failure → log error, return { success: false, error }
         (does NOT throw — email failure never crashes the app)
```

---

## All Email Functions

### 1. New Delivery Created

**Trigger:** Customer submits a delivery request  
**Function:** `sendNewDeliveryNotification(delivery, customer)`  
**FROM:** `deliveries@m19logistics.com`  
**TO:** Customer store email + `admin@m19logistics.com` (CC)  
**Contains:** SPO number, delivery date, time slot, address, weight, pricing

---

### 2. Driver Assigned

**Trigger:** Admin allocates a driver to a delivery  
**Function:** `sendDriverAssignmentNotification(delivery, driver, customer)`  
**FROM:** `deliveries@m19logistics.com`  
**TO:** Customer store email  
**Contains:** Driver name, delivery date, time slot, SPO number

---

### 3. Delivery Completed (Proof of Delivery)

**Trigger:** Driver marks delivery as complete after signature/photo upload  
**Function:** `sendDeliveryCompletedNotification(delivery, customer, driver, receivedBy, driverNotes, signatureUrl, photoUrl)`  
**FROM:** `invoices@m19logistics.com`  
**TO:** Customer store email  
**Attachments:** Signature image + delivery photo (read from disk)  
**Contains:** Received by name, driver name, date/time, driver notes

---

### 4. Driver Accepted Delivery

**Trigger:** Driver accepts an allocated delivery  
**Function:** `sendDriverAcceptanceNotification(delivery, customer)`  
**FROM:** `deliveries@m19logistics.com`  
**TO:** Customer store email

---

### 5. Driver Rejected Delivery

**Trigger:** Driver rejects an allocated delivery  
**Function:** `sendDriverRejectionNotification(delivery, customer, driver, reason)`  
**FROM:** `deliveries@m19logistics.com`  
**TO:** Customer store email + `admin@m19logistics.com`  
**Contains:** Rejection reason, asks customer to contact M19

---

### 6. Delivery Cancelled

**Trigger:** Customer or admin cancels a delivery  
**Function:** `sendDeliveryCancellationNotification(delivery, customer, cancelledBy, reason)`  
**FROM:** `deliveries@m19logistics.com`  
**TO:** Customer store email + `admin@m19logistics.com`  
**Contains:** Cancellation reason, who cancelled it

---

### 7. Same-Day Delivery Alert

**Trigger:** Customer submits a same-day (`SAME_DAY`) delivery request  
**Function:** `sendSameDayDeliveryAlert(delivery, customer)`  
**FROM:** `admin@m19logistics.com`  
**TO:** `admin@m19logistics.com`  
**Contains:** Full delivery details, flagged as urgent same-day

---

### 8. Slot Capacity Warning

**Trigger:** A time slot reaches near-full capacity  
**Function:** `sendSlotCapacityWarning(date, timeSlot, booked, maxCapacity)`  
**FROM:** `admin@m19logistics.com`  
**TO:** `admin@m19logistics.com`

---

### 9. Weekly Driver Feedback Summary

**Trigger:** Cron job — every **Sunday at 11:59 PM UK time**  
**Function:** `sendWeeklyDriverFeedbackSummary(feedbackRecords, weekStart, weekEnd)`  
**FROM:** `admin@m19logistics.com`  
**TO:** `admin@m19logistics.com` + `ben@m19logistics.com`  
**Contains:** Table of all driver notes submitted that week (date, driver, store, SPO, notes)

---

### 10. Driver's Own Weekly Feedback Email

**Trigger:** Same Sunday cron job  
**Function:** `sendDriverWeeklyFeedbackEmail(driver, feedbackRecords, weekStart, weekEnd)`  
**FROM:** `admin@m19logistics.com`  
**TO:** Each individual driver's email  
**Contains:** That driver's own deliveries and feedback for the week

---

### 11. Contact Form Submission

**Trigger:** Public visitor submits the Contact Us form  
**Function:** `sendContactNotification(contact)`  
**FROM:** `enquiries@m19logistics.com`  
**TO:** `enquiries@m19logistics.com`  
**Contains:** Sender name, email, phone, message

---

### 12. Enquiry Form Submission

**Trigger:** Public visitor submits the Enquiries / Get a Quote form  
**Function:** `sendEnquiryNotification(enquiry)`  
**FROM:** `enquiries@m19logistics.com`  
**TO:** `enquiries@m19logistics.com`  
**Contains:** Company name, contact, service type, message

---

### 13. Weekly Invoice Email

**Trigger:** Admin generates invoices (manual or auto Sunday midnight)  
**Function:** `sendInvoiceToCustomer(invoice, pdfBuffer)`  
**FROM:** `invoices@m19logistics.com`  
**TO:** Customer store email  
**Attachment:** Invoice PDF (e.g. `Invoice-T0336.pdf`)  
**Contains:** Invoice number, week range, total amount, bank details

---

### 14. Invoice Payment Reminder

**Trigger:** Admin clicks "Send Reminders" or Sunday 11:00 PM cron job  
**Function:** `sendInvoicePaymentReminder(invoice, pdfBuffer)`  
**FROM:** `invoices@m19logistics.com`  
**TO:** Customer store email  
**Attachment:** Invoice PDF  
**Contains:** Outstanding amount, due date, bank details

---

### 15. Job Application — Admin Notification

**Trigger:** Someone submits a job application via the public form  
**Function:** `sendJobApplicationAdminNotification(application)`  
**FROM:** `admin@m19logistics.com`  
**TO:** `admin@m19logistics.com`  
**Contains:** Applicant name, role applied for, CV attachment link

---

### 16. Job Application — Applicant Confirmation

**Trigger:** Same job application submission  
**Function:** `sendJobApplicationConfirmation(application)`  
**FROM:** `admin@m19logistics.com`  
**TO:** Applicant's email address  
**Contains:** Confirmation that application was received

---

## Full Email Flow — Delivery Lifecycle

```
Customer submits delivery
        ↓
[Email 1] → store email + admin CC
"New Delivery Request – SPO013349"

Admin allocates driver
        ↓
[Email 2] → store email
"Driver Assigned – SPO013349"

Driver accepts
        ↓
[Email 3] → store email
"Driver Confirmed – SPO013349"

Driver completes delivery + uploads signature/photo
        ↓
[Email 4] → store email
"Delivery Completed – SPO013349"
📎 signature_SPO013349.png
📎 photo_SPO013349.jpg

Sunday midnight (auto)
        ↓
[Email 5] → store email
"Your Weekly Invoice T0336 – £450.00"
📎 Invoice-T0336.pdf

Sunday 11:00 PM (if unpaid)
        ↓
[Email 6] → store email
"Payment Reminder – Invoice T0336"
📎 Invoice-T0336.pdf
```

---

## Troubleshooting

| Error                             | Cause                                                             | Fix                                                                      |
| --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Missing credentials for "PLAIN"` | `MAILGUN_SMTP_PASS` is empty — `#` in password treated as comment | Wrap password in double quotes in `.env`                                 |
| `ECONNREFUSED`                    | Wrong SMTP host or port                                           | Check `MAILGUN_HOST=smtp.ionos.co.uk` and `MAILGUN_PORT=587`             |
| `Invalid login`                   | Wrong username or password                                        | Verify credentials in IONOS control panel                                |
| `EAUTH`                           | Auth method mismatch                                              | Ensure `secure: false` for port 587 (STARTTLS)                           |
| Email sent but not received       | Spam filter                                                       | Check spam folder; verify SPF/DKIM records on IONOS for m19logistics.com |

---

## Scheduled Email Jobs (Cron)

All cron jobs run in `src/services/cronService.js` using `node-cron`, timezone `Europe/London`:

| Job                     | Schedule                       | Email Sent                             |
| ----------------------- | ------------------------------ | -------------------------------------- |
| Payment reminders       | Sunday 11:00 PM                | Unpaid invoice reminders to all stores |
| Driver feedback summary | Sunday 11:59 PM                | Weekly notes summary to admin + ben    |
| Auto invoice generation | Sunday midnight (configurable) | New invoices + emails to all stores    |
