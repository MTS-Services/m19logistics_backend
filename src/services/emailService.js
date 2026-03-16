const nodemailer = require("nodemailer");
const config = require("../config");

class EmailService {
  constructor() {
    this._transporter = null;
  }

  get transporter() {
    if (!this._transporter) {
      this._transporter = nodemailer.createTransport({
        host: process.env.MAILGUN_HOST || "smtp.ionos.co.uk",
        port: parseInt(process.env.MAILGUN_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.MAILGUN_SMTP_USER,
          pass: process.env.MAILGUN_SMTP_PASS,
        },
      });
    }
    return this._transporter;
  }

  async sendEmail({
    to,
    cc,
    subject,
    html,
    text,
    attachments = [],
    replyTo = null,
    from = null,
  }) {
    try {
      const mailOptions = {
        from:
          from ||
          `M19 Logistics <${process.env.EMAIL_DELIVERIES || "deliveries@m19logistics.com"}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
        attachments,
      };

      if (cc) {
        mailOptions.cc = cc;
      }

      if (replyTo) {
        mailOptions.replyTo = replyTo;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, "");
  }

  // ==================== DELIVERY EMAILS ====================

  async sendNewDeliveryNotification(delivery, customer) {
    const subject = `New Delivery Request – ${customer.fullName} – SPO: ${delivery.spoNumber || "N/A"}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Delivery Request</h2>
        <p>A new delivery has been requested by <strong>${customer.fullName}</strong>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>SPO Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(delivery.deliveryDate).toLocaleDateString()}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Time Slot:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.timeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Address:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.deliveryAddress}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Weight:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.weight} kg</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Customer Name:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.customerName || "N/A"}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Customer Phone:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.customerPhone || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Estimated Price:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">£${delivery.totalPrice?.toFixed(2) || "TBD"}</td>
          </tr>
          ${
            delivery.specialInstructions
              ? `
          <tr style="background-color: #fff3cd;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Special Instructions:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.specialInstructions}</td>
          </tr>
          `
              : ""
          }
        </table>

        <p><strong>Action Required:</strong> Review and allocate to a driver.</p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics<br>
          Tel: 07971415430 / 01978439739<br>
          Email: deliveries@m19logistics.com
        </p>
      </div>
    `;

    return this.sendEmail({
      to: process.env.EMAIL_ADMIN,
      from: `M19 Logistics <${process.env.EMAIL_DELIVERIES || "deliveries@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_DELIVERIES,
    });
  }

  async sendDriverAssignmentNotification(delivery, driver, customer) {
    const driverSubject = `New Delivery Assignment – ${new Date(delivery.deliveryDate).toLocaleDateString()} – SPO: ${delivery.spoNumber || "N/A"}`;

    const driverHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Delivery Assignment</h2>
        <p>Hello ${driver.fullName},</p>
        <p>You have been assigned a new delivery.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Store:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${customer.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Store Contact:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
              <a href="tel:${customer.phone}">${customer.phone || "N/A"}</a>
            </td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(delivery.deliveryDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Time Slot:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.timeSlot}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Address:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.deliveryAddress}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Weight:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.weight} kg</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>SPO Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || "N/A"}</td>
          </tr>
          ${
            delivery.specialInstructions
              ? `
          <tr style="background-color: #fff3cd;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Special Instructions:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.specialInstructions}</td>
          </tr>
          `
              : ""
          }
        </table>

        <p><strong>Action Required:</strong> Please log in to accept or reject this delivery.</p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics<br>
          Tel: 07971415430
        </p>
      </div>
    `;

    // Send to driver
    await this.sendEmail({
      to: driver.email,
      from: `M19 Logistics <${process.env.EMAIL_DELIVERIES || "deliveries@m19logistics.com"}>`,
      subject: driverSubject,
      html: driverHtml,
      replyTo: process.env.EMAIL_DELIVERIES,
    });

    // Notify customer that driver has been assigned
    const customerSubject = `Your Delivery Has Been Scheduled – SPO: ${delivery.spoNumber || "N/A"}`;
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Delivery Scheduled</h2>
        <p>Hello ${customer.fullName},</p>
        <p>Your delivery has been assigned to a driver.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Driver:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${driver.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Driver Contact:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${driver.phone || "N/A"}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(delivery.deliveryDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Time Slot:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.timeSlot}</td>
          </tr>
        </table>

        <p>Your delivery is on track for the scheduled time.</p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics<br>
          Tel: 07971415430<br>
          Email: deliveries@m19logistics.com
        </p>
      </div>
    `;

    return this.sendEmail({
      to: customer.email,
      from: `M19 Logistics <${process.env.EMAIL_DELIVERIES || "deliveries@m19logistics.com"}>`,
      subject: customerSubject,
      html: customerHtml,
      replyTo: process.env.EMAIL_DELIVERIES,
    });
  }

  async sendDeliveryCompletedNotification(
    delivery,
    customer,
    driver,
    receivedBy,
    driverNotes,
    signatureUrl,
    photoUrl,
  ) {
    const subject = `M19 Logistics – Completed Delivery Confirmation (SPO: ${delivery.spoNumber || "N/A"})`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Delivery Completed ✓</h2>
        <p>Hello ${customer.fullName},</p>
        <p>Your delivery for SPO ${delivery.spoNumber || "N/A"} has been completed.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Received By:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${receivedBy}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date().toLocaleDateString()}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Time:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date().toLocaleTimeString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Driver:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${driver.fullName}</td>
          </tr>
          ${
            driverNotes
              ? `
          <tr style="background-color: #e7f3ff;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Driver Notes:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${driverNotes}</td>
          </tr>
          `
              : ""
          }
        </table>

        ${signatureUrl ? `<p><strong>Signature:</strong> <a href="${signatureUrl}">View Signature</a></p>` : ""}
        ${photoUrl ? `<p><strong>Delivery Photo:</strong> <a href="${photoUrl}">View Photo</a></p>` : ""}
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          Thank you for choosing M19 Logistics.<br>
          Tel: 07971415430<br>
          Email: deliveries@m19logistics.com
        </p>
      </div>
    `;

    // For now, include signature/photo as links in email body instead of attachments
    // To avoid file path issues
    return this.sendEmail({
      to: customer.email,
      from: `M19 Logistics <${process.env.EMAIL_INVOICES || "invoices@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_INVOICES,
    });
  }

  async sendDriverAcceptanceNotification(delivery, customer) {
    const subject = `Delivery Confirmed – Driver Accepted – SPO: ${delivery.spoNumber || "N/A"}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Driver Confirmed ✓</h2>
        <p>Hello ${customer.fullName},</p>
        <p>The driver has accepted your delivery and is on schedule.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>SPO Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(delivery.deliveryDate).toLocaleDateString()}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Time Slot:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.timeSlot}</td>
          </tr>
        </table>

        <p>Your delivery is confirmed and on the way!</p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics<br>
          Tel: 07971415430
        </p>
      </div>
    `;

    return this.sendEmail({
      to: customer.email,
      from: `M19 Logistics <${process.env.EMAIL_DELIVERIES || "deliveries@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_DELIVERIES,
    });
  }

  async sendDriverRejectionNotification(
    delivery,
    customer,
    driver,
    rejectionReason,
  ) {
    const subject = `⚠️ Delivery Rejected – Reassignment Required – SPO: ${delivery.spoNumber || "N/A"} – ${customer.fullName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Driver Rejection Alert</h2>
        <p>Driver <strong>${driver.fullName}</strong> has rejected the following delivery:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Customer:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${customer.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>SPO Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || "N/A"}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(delivery.deliveryDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Time Slot:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.timeSlot}</td>
          </tr>
          <tr style="background-color: #fff3cd;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Rejection Reason:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${rejectionReason}</td>
          </tr>
        </table>

        <p><strong>Action Required:</strong> Please reassign this delivery to another driver.</p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics Admin Panel
        </p>
      </div>
    `;

    return this.sendEmail({
      to: process.env.EMAIL_ADMIN,
      from: `M19 Logistics <${process.env.EMAIL_ADMIN || "admin@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_ADMIN,
    });
  }

  async sendDeliveryCancellationNotification(
    delivery,
    customer,
    cancelledBy,
    reason,
  ) {
    const subject = `Delivery Cancelled – SPO: ${delivery.spoNumber || "N/A"}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Delivery Cancelled</h2>
        <p>Hello ${customer.fullName},</p>
        <p>Your delivery has been cancelled.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>SPO Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(delivery.deliveryDate).toLocaleDateString()}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Cancelled By:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${cancelledBy}</td>
          </tr>
          ${
            reason
              ? `
          <tr style="background-color: #fff3cd;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Reason:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${reason}</td>
          </tr>
          `
              : ""
          }
        </table>

        <p>If you have any questions, please contact us.</p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics<br>
          Tel: 07971415430<br>
          Email: deliveries@m19logistics.com
        </p>
      </div>
    `;

    return this.sendEmail({
      to: customer.email,
      from: `M19 Logistics <${process.env.EMAIL_DELIVERIES || "deliveries@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_DELIVERIES,
    });
  }

  async sendSameDayDeliveryAlert(delivery, customer) {
    const subject = `⚠️ Same-Day Delivery Request – CONFIRMATION REQUIRED – SPO: ${delivery.spoNumber || "N/A"}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">Same-Day Delivery Request</h2>
        <p>A same-day delivery has been requested by <strong>${customer.fullName}</strong>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Customer:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${customer.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>SPO Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || "N/A"}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Address:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.deliveryAddress}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Weight:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.weight} kg</td>
          </tr>
        </table>

        <p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">
          <strong>Note:</strong> Customer was advised to call 07971415430 to confirm availability.
        </p>
        
        <p><strong>Action Required:</strong> Contact customer to confirm same-day delivery availability.</p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics Admin
        </p>
      </div>
    `;

    return this.sendEmail({
      to: process.env.EMAIL_ADMIN,
      from: `M19 Logistics <${process.env.EMAIL_ADMIN || "admin@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_DELIVERIES,
    });
  }

  async sendSlotCapacityWarning(date, timeSlot, booked, maxCapacity) {
    const percentage = Math.round((booked / maxCapacity) * 100);
    const subject = `⚠️ Slot Capacity Alert – ${new Date(date).toLocaleDateString()} ${timeSlot} – ${percentage}% ${percentage >= 100 ? "FULL" : "Filled"}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${percentage >= 100 ? "#dc3545" : "#ffc107"};">Slot Capacity ${percentage >= 100 ? "Full" : "Warning"}</h2>
        <p>The ${timeSlot} slot for ${new Date(date).toLocaleDateString()} has reached ${percentage}% capacity.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(date).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Time Slot:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${timeSlot}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Bookings:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${booked} / ${maxCapacity}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Capacity:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${percentage}%</td>
          </tr>
        </table>

        ${
          percentage >= 100
            ? '<p style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545;"><strong>Slot is now FULL.</strong> No more bookings can be accepted unless capacity is increased.</p>'
            : '<p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;"><strong>Suggestion:</strong> Consider increasing capacity or notifying customers of limited availability.</p>'
        }
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics Admin Panel
        </p>
      </div>
    `;

    return this.sendEmail({
      to: process.env.EMAIL_ADMIN,
      from: `M19 Logistics <${process.env.EMAIL_ADMIN || "admin@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_ADMIN,
    });
  }

  /**
   * Send weekly driver feedback summary email
   * @param {Array} feedbackRecords - Driver feedback records
   * @param {Array} deliveriesWithNotes - Completed deliveries with notes
   * @param {Date} startDate - Week start date
   * @param {Date} endDate - Week end date
   */
  async sendWeeklyDriverFeedbackSummary(
    feedbackRecords,
    deliveriesWithNotes,
    startDate,
    endDate,
  ) {
    const subject = `📊 Weekly Driver Feedback Summary - ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Weekly Driver Feedback Summary</h2>
        <p><strong>Period:</strong> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
        
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        
        ${
          feedbackRecords.length > 0
            ? `
          <h3 style="color: #059669;">Driver Feedback (${feedbackRecords.length})</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #2563eb; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Driver</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">SPO</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Customer</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Rating</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Comments</th>
              </tr>
            </thead>
            <tbody>
              ${feedbackRecords
                .map(
                  (feedback, index) => `
                <tr style="background-color: ${index % 2 === 0 ? "#f9fafb" : "white"};">
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date(feedback.createdAt).toLocaleDateString()}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${feedback.driver?.fullName || "N/A"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${feedback.delivery?.spoNumber || "N/A"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${feedback.delivery?.customer?.fullName || "N/A"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">⭐ ${feedback.rating}/5</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${feedback.comments || "No comments"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `
            : "<p><em>No driver feedback submitted this week.</em></p>"
        }
        
        ${
          deliveriesWithNotes.length > 0
            ? `
          <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
          <h3 style="color: #059669;">Completed Deliveries with Notes (${deliveriesWithNotes.length})</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #059669; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Driver</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">SPO</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Store</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Received By</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Address</th>
              </tr>
            </thead>
            <tbody>
              ${deliveriesWithNotes
                .map(
                  (delivery, index) => `
                <tr style="background-color: ${index % 2 === 0 ? "#f9fafb" : "white"};">
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date(delivery.deliveredAt).toLocaleDateString()}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${delivery.driver?.fullName || "N/A"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${delivery.spoNumber}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${delivery.customer?.fullName || "N/A"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${delivery.receivedBy || "N/A"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd; font-size: 12px;">${delivery.deliveryAddress}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `
            : ""
        }
        
        <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
        
        <h3 style="color: #6b7280;">Summary Statistics</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 8px; background-color: #f3f4f6; margin: 5px 0; border-radius: 4px;">
            <strong>Total Feedback Submitted:</strong> ${feedbackRecords.length}
          </li>
          <li style="padding: 8px; background-color: #f3f4f6; margin: 5px 0; border-radius: 4px;">
            <strong>Total Deliveries Completed:</strong> ${deliveriesWithNotes.length}
          </li>
          <li style="padding: 8px; background-color: #f3f4f6; margin: 5px 0; border-radius: 4px;">
            <strong>Average Rating:</strong> ${
              feedbackRecords.length > 0
                ? (
                    feedbackRecords.reduce((sum, f) => sum + f.rating, 0) /
                    feedbackRecords.length
                  ).toFixed(1)
                : "N/A"
            }/5
          </li>
        </ul>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics - Automated Weekly Report<br>
          Tel: 07971415430<br>
          Email: admin@m19logistics.com
        </p>
      </div>
    `;

    return this.sendEmail({
      to: process.env.EMAIL_ADMIN,
      cc: process.env.EMAIL_BEN,
      from: `M19 Logistics <${process.env.EMAIL_ADMIN || "admin@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_ADMIN,
    });
  }

  /**
   * Send personalized weekly feedback email to a single driver
   * @param {Object} driver - Driver object { id, fullName, email }
   * @param {Array} feedbackRecords - Driver-specific feedback records
   * @param {Array} deliveriesWithNotes - Driver-specific deliveries with notes
   * @param {Date} startDate
   * @param {Date} endDate
   */
  async sendDriverWeeklyFeedbackEmail(
    driver,
    feedbackRecords,
    deliveriesWithNotes,
    startDate,
    endDate,
  ) {
    const subject = `📬 Your Weekly Driver Feedback - ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Hello ${driver.fullName || "Driver"},</h2>
        <p>This is your weekly feedback summary for <strong>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</strong>.</p>

        ${
          feedbackRecords.length > 0
            ? `
          <h3 style="color: #059669;">Your Feedback (${feedbackRecords.length})</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
            <thead>
              <tr style="background-color: #2563eb; color: white;">
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">SPO</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Customer</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Comments</th>
              </tr>
            </thead>
            <tbody>
              ${feedbackRecords
                .map(
                  (f, i) => `
                <tr style="background-color: ${i % 2 === 0 ? "#f9fafb" : "white"};">
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(f.createdAt).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${f.delivery?.spoNumber || "N/A"}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${f.delivery?.customer?.fullName || "N/A"}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${(f.notes || "").replace(/\n/g, "<br/>")}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `
            : "<p><em>No feedback submitted this week.</em></p>"
        }

        ${
          deliveriesWithNotes.length > 0
            ? `
          <h3 style="color: #059669;">Deliveries with Notes (${deliveriesWithNotes.length})</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
            <thead>
              <tr style="background-color: #059669; color: white;">
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">SPO</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Received By</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Address</th>
              </tr>
            </thead>
            <tbody>
              ${deliveriesWithNotes
                .map(
                  (d, i) => `
                <tr style="background-color: ${i % 2 === 0 ? "#f9fafb" : "white"};">
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(d.deliveredAt).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${d.spoNumber}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${d.receivedBy || "N/A"}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${d.deliveryAddress}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `
            : ""
        }

        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6c757d; font-size: 12px;">If you'd like to stop receiving these emails, update your notification preferences in your profile.</p>

        <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">M19 Logistics</p>
      </div>
    `;

    return this.sendEmail({
      to: driver.email,
      from: `M19 Logistics <${process.env.EMAIL_ADMIN || "admin@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_ADMIN,
    });
  }

  // ==================== CONTACT & ENQUIRY EMAILS ====================

  async sendContactNotification(contact) {
    const subject = `New Contact Message – ${contact.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Contact Form Submission</h2>
        <p>A visitor has submitted a message via the contact form.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6; width: 35%;"><strong>Name:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${contact.name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Email:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><a href="mailto:${contact.email}">${contact.email}</a></td>
          </tr>
          ${
            contact.phone
              ? `
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Phone:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${contact.phone}</td>
          </tr>`
              : ""
          }
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Message:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6; white-space: pre-wrap;">${contact.message}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Submitted At:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(contact.createdAt).toLocaleString()}</td>
          </tr>
        </table>
        <p style="background-color: #d1ecf1; padding: 12px; border-left: 4px solid #bee5eb;">
          <strong>Action Required:</strong> Reply directly to <a href="mailto:${contact.email}">${contact.email}</a>.
        </p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics – Automated Notification
        </p>
      </div>
    `;
    return this.sendEmail({
      to: process.env.EMAIL_ENQUIRIES,
      from: `M19 Logistics <${process.env.EMAIL_ENQUIRIES || "enquiries@m19logistics.com"}>`,
      subject,
      html,
      replyTo: contact.email,
    });
  }

  async sendEnquiryNotification(enquiry) {
    const subject = `New Business Enquiry – ${enquiry.subject} – ${enquiry.fullName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Business Enquiry</h2>
        <p>A new enquiry has been submitted via the website.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6; width: 35%;"><strong>Full Name:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${enquiry.fullName}</td>
          </tr>
          ${
            enquiry.companyName
              ? `
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Company:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${enquiry.companyName}</td>
          </tr>`
              : ""
          }
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Email:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><a href="mailto:${enquiry.email}">${enquiry.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Phone:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${enquiry.phoneNumber}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Subject:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${enquiry.subject}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Message:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6; white-space: pre-wrap;">${enquiry.message}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Submitted At:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(enquiry.createdAt).toLocaleString()}</td>
          </tr>
        </table>
        <p style="background-color: #d4edda; padding: 12px; border-left: 4px solid #c3e6cb;">
          <strong>Action Required:</strong> Follow up with <a href="mailto:${enquiry.email}">${enquiry.email}</a>.
        </p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics – Automated Notification
        </p>
      </div>
    `;
    return this.sendEmail({
      to: process.env.EMAIL_ENQUIRIES,
      from: `M19 Logistics <${process.env.EMAIL_ENQUIRIES || "enquiries@m19logistics.com"}>`,
      subject,
      html,
      replyTo: enquiry.email,
    });
  }

  // ==================== INVOICE EMAILS ====================

  async sendInvoiceToCustomer(invoice, pdfBuffer) {
    const weekStart = new Date(invoice.weekStartDate).toLocaleDateString(
      "en-GB",
    );
    const weekEnd = new Date(invoice.weekEndDate).toLocaleDateString("en-GB");
    const subject = `Invoice ${invoice.invoiceNumber} – Week ${weekStart} to ${weekEnd} – M19 Logistics`;

    const itemRows = (invoice.items || [])
      .map(
        (item, i) => `
      <tr style="background-color: ${i % 2 === 0 ? "#f8f9fa" : "#fff"};">
        <td style="padding: 8px; border: 1px solid #dee2e6;">${item.description || ""}</td>
        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">£${(item.unitCost || 0).toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">£${(item.vatAmount || 0).toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">£${(item.total || 0).toFixed(2)}</td>
      </tr>`,
      )
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${invoice.customer.fullName},</p>
        <p>Please find your invoice for the week of <strong>${weekStart} – ${weekEnd}</strong> attached to this email.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 8px; border: 1px solid #dee2e6; width: 40%;"><strong>Invoice Number:</strong></td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Invoice Date:</strong></td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${new Date(invoice.invoiceDate).toLocaleDateString("en-GB")}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Period:</strong></td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${weekStart} – ${weekEnd}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Payment Terms:</strong></td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${invoice.paymentTerms || "30 Days (End of Month)"}</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background-color: #2c3e50; color: #fff;">
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">Description</th>
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Qty</th>
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Unit Cost</th>
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">VAT</th>
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <table style="width: 300px; margin-left: auto; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 10px;"><strong>Subtotal:</strong></td>
            <td style="padding: 6px 10px; text-align: right;">£${(invoice.subtotal || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 10px;"><strong>VAT (20%):</strong></td>
            <td style="padding: 6px 10px; text-align: right;">£${(invoice.vatTotal || 0).toFixed(2)}</td>
          </tr>
          <tr style="background-color: #2c3e50; color: #fff;">
            <td style="padding: 8px 10px;"><strong>Grand Total:</strong></td>
            <td style="padding: 8px 10px; text-align: right;"><strong>£${(invoice.grandTotal || 0).toFixed(2)}</strong></td>
          </tr>
        </table>

        <p style="margin-top: 24px; color: #555;">The full invoice PDF is attached. Please do not hesitate to contact us if you have any queries.</p>

        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics Limited<br>
          Tel: ${process.env.COMPANY_PHONE || "07971415430"}<br>
          Email: ${process.env.EMAIL_ADMIN || "admin@m19logistics.com"}
        </p>
      </div>
    `;

    const ccEmail = invoice.customer?.customerProfile?.ccEmail;
    return this.sendEmail({
      to: invoice.customer.email,
      ...(ccEmail && { cc: ccEmail }),
      from: `M19 Logistics <${process.env.EMAIL_INVOICES || "invoices@m19logistics.com"}>`,
      subject,
      html,
      attachments: [
        {
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
      replyTo: process.env.EMAIL_INVOICES,
    });
  }

  async sendInvoicePaymentReminder(invoice, pdfBuffer) {
    const weekStart = new Date(invoice.weekStartDate).toLocaleDateString(
      "en-GB",
    );
    const weekEnd = new Date(invoice.weekEndDate).toLocaleDateString("en-GB");
    const subject = `Payment Reminder – Invoice ${invoice.invoiceNumber} – M19 Logistics`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c0392b;">Payment Reminder</h2>
        <p>Dear ${invoice.customer.fullName},</p>
        <p>This is a friendly reminder that the following invoice is still outstanding:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 8px; border: 1px solid #dee2e6; width: 45%;"><strong>Invoice Number:</strong></td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Period:</strong></td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${weekStart} – ${weekEnd}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Amount Due:</strong></td>
            <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>£${(invoice.grandTotal || 0).toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Payment Terms:</strong></td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${invoice.paymentTerms || "30 Days (End of Month)"}</td>
          </tr>
        </table>

        <p>Please arrange payment at your earliest convenience. A copy of the invoice is attached.</p>
        <p>If you have already made payment, please disregard this reminder.</p>

        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics Limited<br>
          Tel: ${process.env.COMPANY_PHONE || "07971415430"}<br>
          Email: ${process.env.EMAIL_ADMIN || "admin@m19logistics.com"}
        </p>
      </div>
    `;

    const ccEmail = invoice.customer?.customerProfile?.ccEmail;
    return this.sendEmail({
      to: invoice.customer.email,
      ...(ccEmail && { cc: ccEmail }),
      from: `M19 Logistics <${process.env.EMAIL_INVOICES || "invoices@m19logistics.com"}>`,
      subject,
      html,
      attachments: pdfBuffer
        ? [
            {
              filename: `Invoice-${invoice.invoiceNumber}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        : [],
      replyTo: process.env.EMAIL_INVOICES,
    });
  }

  // ==================== JOB APPLICATION EMAILS ====================

  async sendJobApplicationAdminNotification(application) {
    const subject = `New Job Application – ${application.positionOfInterest} – ${application.fullName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Job Application Received</h2>
        <p>A new job application has been submitted via the website.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6; width: 35%;"><strong>Full Name:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${application.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Email:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><a href="mailto:${application.email}">${application.email}</a></td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Phone:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${application.phoneNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Position Applied:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${application.positionOfInterest}</td>
          </tr>
          ${
            application.coverLetter
              ? `
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Cover Letter:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6; white-space: pre-wrap;">${application.coverLetter}</td>
          </tr>`
              : ""
          }
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>CV:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><a href="${application.cvUrl}">Download CV</a></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Submitted At:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(application.createdAt).toLocaleString()}</td>
          </tr>
        </table>
        <p style="background-color: #fff3cd; padding: 12px; border-left: 4px solid #ffc107;">
          <strong>Action Required:</strong> Review the application and follow up with <a href="mailto:${application.email}">${application.email}</a>.
        </p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics – Automated Notification
        </p>
      </div>
    `;
    return this.sendEmail({
      to: process.env.EMAIL_ADMIN,
      from: `M19 Logistics <${process.env.EMAIL_ADMIN || "admin@m19logistics.com"}>`,
      subject,
      html,
      replyTo: application.email,
    });
  }

  async sendJobApplicationConfirmation(application) {
    const subject = `Application Received – ${application.positionOfInterest} – M19 Logistics`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Thank You for Your Application</h2>
        <p>Dear ${application.fullName},</p>
        <p>We have received your application for the position of <strong>${application.positionOfInterest}</strong>. Thank you for your interest in joining M19 Logistics.</p>
        <p>Our team will review your application and be in touch if your experience matches our requirements.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6; width: 35%;"><strong>Position:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${application.positionOfInterest}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Submitted:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(application.createdAt).toLocaleString()}</td>
          </tr>
        </table>
        <p>If you have any questions, please contact us at <a href="mailto:${process.env.EMAIL_ADMIN}">${process.env.EMAIL_ADMIN}</a>.</p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics Limited<br>
          Tel: ${process.env.COMPANY_PHONE || "07971415430"}<br>
          ${process.env.COMPANY_ADDRESS || "84 Acton Hall Walks, Wrexham, LL127YJ"}
        </p>
      </div>
    `;
    return this.sendEmail({
      to: application.email,
      from: `M19 Logistics <${process.env.EMAIL_ADMIN || "admin@m19logistics.com"}>`,
      subject,
      html,
      replyTo: process.env.EMAIL_ADMIN,
    });
  }
}

module.exports = new EmailService();
