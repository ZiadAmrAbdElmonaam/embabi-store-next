import { OrderStatus } from "@prisma/client";
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOrderConfirmationEmail(
  to: string,
  orderDetails: {
    id: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    shippingName: string;
    shippingAddress: string;
    shippingCity: string;
  }
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a365d;">Order Confirmation</h1>
      <p>Dear ${orderDetails.shippingName},</p>
      <p>Thank you for your order! Here are your order details:</p>
      
      <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #2d3748; margin-top: 0;">Order #${orderDetails.id}</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <th style="text-align: left; padding: 8px;">Item</th>
              <th style="text-align: right; padding: 8px;">Quantity</th>
              <th style="text-align: right; padding: 8px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderDetails.items
              .map(
                (item) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px;">${item.name}</td>
                <td style="text-align: right; padding: 8px;">${item.quantity}</td>
                <td style="text-align: right; padding: 8px;">$${item.price.toFixed(
                  2
                )}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align: right; padding: 8px; font-weight: bold;">Total:</td>
              <td style="text-align: right; padding: 8px; font-weight: bold;">$${orderDetails.total.toFixed(
                2
              )}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px;">
        <h3 style="color: #2d3748; margin-top: 0;">Shipping Details</h3>
        <p style="margin: 0;">${orderDetails.shippingName}</p>
        <p style="margin: 0;">${orderDetails.shippingAddress}</p>
        <p style="margin: 0;">${orderDetails.shippingCity}</p>
      </div>

      <p style="margin-top: 20px;">
        We'll notify you when your order has been shipped.
      </p>
      
      <p style="color: #718096; font-size: 0.875rem; margin-top: 40px;">
        If you have any questions, please don't hesitate to contact us.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Tech Store" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Order Confirmation #${orderDetails.id}`,
    html,
  });
}

export async function sendOrderStatusEmail(
  to: string,
  orderDetails: {
    id: string;
    status: string;
    shippingName: string;
  }
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a365d;">Order Status Update</h1>
      <p>Dear ${orderDetails.shippingName},</p>
      <p>Your order #${orderDetails.id} has been updated to: <strong>${orderDetails.status}</strong></p>
      
      <p style="margin-top: 20px;">
        You can check your order details by logging into your account.
      </p>
      
      <p style="color: #718096; font-size: 0.875rem; margin-top: 40px;">
        If you have any questions, please don't hesitate to contact us.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Tech Store" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Order Status Update #${orderDetails.id}`,
    html,
  });
} 