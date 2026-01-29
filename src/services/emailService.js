const nodemailer = require('nodemailer');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, text, attachments = [], replyTo = null }) {
    try {
      const mailOptions = {
        from: `M19 Logistics <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
        attachments,
      };

      if (replyTo) {
        mailOptions.replyTo = replyTo;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // ==================== DELIVERY EMAILS ====================

  async sendNewDeliveryNotification(delivery, customer) {
    const subject = `New Delivery Request – ${customer.fullName} – SPO: ${delivery.spoNumber || 'N/A'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Delivery Request</h2>
        <p>A new delivery has been requested by <strong>${customer.fullName}</strong>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>SPO Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || 'N/A'}</td>
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
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.customerName || 'N/A'}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Customer Phone:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.customerPhone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Estimated Price:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">£${delivery.totalPrice?.toFixed(2) || 'TBD'}</td>
          </tr>
          ${delivery.specialInstructions ? `
          <tr style="background-color: #fff3cd;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Special Instructions:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.specialInstructions}</td>
          </tr>
          ` : ''}
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
      to: 'hahm56825@gmail.com', // Admin email
      subject,
      html,
      replyTo: 'deliveries@m19logistics.com',
    });
  }

  async sendDriverAssignmentNotification(delivery, driver, customer) {
    const driverSubject = `New Delivery Assignment – ${new Date(delivery.deliveryDate).toLocaleDateString()} – SPO: ${delivery.spoNumber || 'N/A'}`;
    
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
              <a href="tel:${customer.phone}">${customer.phone || 'N/A'}</a>
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
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || 'N/A'}</td>
          </tr>
          ${delivery.specialInstructions ? `
          <tr style="background-color: #fff3cd;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Special Instructions:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.specialInstructions}</td>
          </tr>
          ` : ''}
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
      subject: driverSubject,
      html: driverHtml,
      replyTo: 'deliveries@m19logistics.com',
    });

    // Notify customer that driver has been assigned
    const customerSubject = `Your Delivery Has Been Scheduled – SPO: ${delivery.spoNumber || 'N/A'}`;
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
            <td style="padding: 10px; border: 1px solid #dee2e6;">${driver.phone || 'N/A'}</td>
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
      subject: customerSubject,
      html: customerHtml,
      replyTo: 'deliveries@m19logistics.com',
    });
  }

  async sendDeliveryCompletedNotification(delivery, customer, driver, receivedBy, driverNotes, signatureUrl, photoUrl) {
    const subject = `M19 Logistics – Completed Delivery Confirmation (SPO: ${delivery.spoNumber || 'N/A'})`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Delivery Completed ✓</h2>
        <p>Hello ${customer.fullName},</p>
        <p>Your delivery for SPO ${delivery.spoNumber || 'N/A'} has been completed.</p>
        
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
          ${driverNotes ? `
          <tr style="background-color: #e7f3ff;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Driver Notes:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${driverNotes}</td>
          </tr>
          ` : ''}
        </table>

        ${signatureUrl ? `<p><strong>Signature:</strong> <a href="${signatureUrl}">View Signature</a></p>` : ''}
        ${photoUrl ? `<p><strong>Delivery Photo:</strong> <a href="${photoUrl}">View Photo</a></p>` : ''}
        
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
      subject,
      html,
      replyTo: 'deliveries@m19logistics.com',
    });
  }

  async sendDriverAcceptanceNotification(delivery, customer) {
    const subject = `Delivery Confirmed – Driver Accepted – SPO: ${delivery.spoNumber || 'N/A'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Driver Confirmed ✓</h2>
        <p>Hello ${customer.fullName},</p>
        <p>The driver has accepted your delivery and is on schedule.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>SPO Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || 'N/A'}</td>
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
      subject,
      html,
      replyTo: 'deliveries@m19logistics.com',
    });
  }

  async sendDriverRejectionNotification(delivery, customer, driver, rejectionReason) {
    const subject = `⚠️ Delivery Rejected – Reassignment Required – SPO: ${delivery.spoNumber || 'N/A'} – ${customer.fullName}`;
    
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
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || 'N/A'}</td>
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
      to: 'hahm56825@gmail.com', // Admin email
      subject,
      html,
      replyTo: 'admin@m19logistics.com',
    });
  }

  async sendDeliveryCancellationNotification(delivery, customer, cancelledBy, reason) {
    const subject = `Delivery Cancelled – SPO: ${delivery.spoNumber || 'N/A'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Delivery Cancelled</h2>
        <p>Hello ${customer.fullName},</p>
        <p>Your delivery has been cancelled.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>SPO Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Delivery Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(delivery.deliveryDate).toLocaleDateString()}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Cancelled By:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${cancelledBy}</td>
          </tr>
          ${reason ? `
          <tr style="background-color: #fff3cd;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Reason:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${reason}</td>
          </tr>
          ` : ''}
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
      subject,
      html,
      replyTo: 'deliveries@m19logistics.com',
    });
  }

  async sendSameDayDeliveryAlert(delivery, customer) {
    const subject = `⚠️ Same-Day Delivery Request – CONFIRMATION REQUIRED – SPO: ${delivery.spoNumber || 'N/A'}`;
    
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
            <td style="padding: 10px; border: 1px solid #dee2e6;">${delivery.spoNumber || 'N/A'}</td>
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
      to: 'hahm56825@gmail.com', // Admin email
      subject,
      html,
      replyTo: 'deliveries@m19logistics.com',
    });
  }

  async sendSlotCapacityWarning(date, timeSlot, booked, maxCapacity) {
    const percentage = Math.round((booked / maxCapacity) * 100);
    const subject = `⚠️ Slot Capacity Alert – ${new Date(date).toLocaleDateString()} ${timeSlot} – ${percentage}% ${percentage >= 100 ? 'FULL' : 'Filled'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${percentage >= 100 ? '#dc3545' : '#ffc107'};">Slot Capacity ${percentage >= 100 ? 'Full' : 'Warning'}</h2>
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

        ${percentage >= 100 ? 
          '<p style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545;"><strong>Slot is now FULL.</strong> No more bookings can be accepted unless capacity is increased.</p>' :
          '<p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;"><strong>Suggestion:</strong> Consider increasing capacity or notifying customers of limited availability.</p>'
        }
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          M19 Logistics Admin Panel
        </p>
      </div>
    `;

    return this.sendEmail({
      to: 'hahm56825@gmail.com', // Admin email
      subject,
      html,
      replyTo: 'admin@m19logistics.com',
    });
  }
}

module.exports = new EmailService();
