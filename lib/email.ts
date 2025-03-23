import nodemailer from 'nodemailer';

// Log email configuration
console.log('Email configuration check:');
console.log('GMAIL_USER configured:', !!process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD configured:', !!process.env.GMAIL_APP_PASSWORD);
console.log('GMAIL_USER length:', process.env.GMAIL_USER?.length);
console.log('GMAIL_APP_PASSWORD length:', process.env.GMAIL_APP_PASSWORD?.length);

// Create a simpler transporter configuration
const createTransporter = () => {
  try {
    // Check if credentials are available
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('Email credentials not configured');
      return null;
    }

    console.log('Creating transporter with credentials:');
    console.log('- User:', process.env.GMAIL_USER);
    console.log('- Password length:', process.env.GMAIL_APP_PASSWORD.length);
    
    // Create transporter with simpler configuration
    const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
      secure: true,
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false
      },
      debug: true, // Enable debug output
      logger: true  // Log information about the transport
    });

    console.log('Email transporter created with simple configuration');
    return transport;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
};

// Function to log email content when transporter is not available
const logEmailContent = (to: string, subject: string, html: string) => {
  console.log('Email would be sent (credentials not configured):');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('Content preview:', html.substring(0, 100) + '...');
};

// Function to send verification code email
export async function sendVerificationEmail(
  to: string,
  code: string,
  name?: string
) {
  console.log(`Attempting to send verification code ${code} to ${to}`);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a365d;">Email Verification</h1>
      <p>Hello ${name || 'there'},</p>
      <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
      
      <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h2 style="color: #2d3748; margin-top: 0; letter-spacing: 5px; font-size: 32px;">${code}</h2>
      </div>

      <p>This code will expire in 10 minutes.</p>
      
      <p style="color: #718096; font-size: 0.875rem; margin-top: 40px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    // Create a new transporter for each email
    const transporter = createTransporter();
    
    if (transporter) {
      console.log('Transporter created, sending email...');
      console.log('From:', `"Embabi Store" <${process.env.GMAIL_USER}>`);
      console.log('To:', to);
      
      // Verify connection configuration
      try {
        console.log('Verifying transporter connection...');
        const verifyResult = await transporter.verify();
        console.log('Transporter verification result:', verifyResult);
      } catch (verifyError) {
        console.error('Transporter verification failed:', verifyError);
        // Continue anyway since verification might fail but sending could still work
      }
      
      const result = await transporter.sendMail({
        from: `"Embabi Store" <${process.env.GMAIL_USER}>`,
        to,
        subject: `Verification Code for Embabi Store`,
        html,
      });
      
      console.log('Email sent successfully:', result.messageId);
      return result;
    } else {
      console.log('No transporter available, logging to console instead');
      logEmailContent(to, `Verification Code for Embabi Store`, html);
      console.log('VERIFICATION CODE:', code);
    }
  } catch (error: unknown) {
    console.error('Failed to send verification email. Error details:', error);
    if (error && typeof error === 'object') {
      if ('code' in error) console.error('Error code:', (error as {code: unknown}).code);
      if ('command' in error) console.error('Error command:', (error as {command: unknown}).command);
      if ('response' in error) console.error('Error response:', (error as {response: unknown}).response);
      
      // Log the full error object for debugging
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
    
    // Fall back to logging the code
    console.log('Falling back to console logging');
    logEmailContent(to, `Verification Code for Embabi Store`, html);
    console.log('VERIFICATION CODE:', code);
  }
}

// Other email functions can be updated similarly
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

  try {
    const transporter = createTransporter();
    
    if (transporter) {
  await transporter.sendMail({
        from: `"Embabi Store" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Order Confirmation #${orderDetails.id}`,
    html,
  });
    } else {
      logEmailContent(to, `Order Confirmation #${orderDetails.id}`, html);
    }
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    logEmailContent(to, `Order Confirmation #${orderDetails.id}`, html);
  }
}

interface OrderStatusEmailProps {
  id: string;
  status: string;
  shippingName: string;
}

export async function sendOrderStatusEmail(
  to: string,
  { id, status, shippingName }: OrderStatusEmailProps
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a365d;">Order Status Update</h1>
      <p>Dear ${shippingName},</p>
      <p>Your order #${id} has been updated to: <strong>${status}</strong></p>
      
      <p style="margin-top: 20px;">
        You can check your order details by logging into your account.
      </p>
      
      <p style="color: #718096; font-size: 0.875rem; margin-top: 40px;">
        If you have any questions, please don't hesitate to contact us.
      </p>
    </div>
  `;

  try {
    const transporter = createTransporter();
    
    if (transporter) {
    await transporter.sendMail({
        from: `"Embabi Store" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Order Status Update #${id}`,
      html,
    });
    } else {
      logEmailContent(to, `Order Status Update #${id}`, html);
    }
  } catch (error) {
    console.error('Failed to send order status email:', error);
    logEmailContent(to, `Order Status Update #${id}`, html);
  }
} 