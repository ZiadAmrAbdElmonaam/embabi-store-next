import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';

export async function GET(req: Request) {
  try {
    // Only allow admin to test email
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log email configuration for debugging
    console.log('Email configuration test:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || 465);
    console.log('SMTP_USER exists:', !!process.env.SMTP_USER);
    console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
    console.log('GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('CONTACT_EMAIL:', process.env.CONTACT_EMAIL || 'embabistore110@gmail.com');

    // Collect environment variables for debugging
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      user: process.env.SMTP_USER || 'embabistore110@gmail.com',
      from: process.env.SMTP_FROM || 'embabistore110@gmail.com',
      to: process.env.CONTACT_EMAIL || 'embabistore110@gmail.com',
    };

    // Try different email transport configurations
    let emailSent = false;
    let error: any = null;

    // Create a transporter using direct Gmail service
    try {
      console.log('Trying direct Gmail transport with certificate rejection disabled...');
      const gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'embabistore110@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD,
        },
        tls: {
          // Do not fail on invalid certificates
          rejectUnauthorized: false
        },
        debug: true,
        logger: true
      });

      // Email content
      const mailOptions = {
        from: `"Embabi Store Test" <${emailConfig.from}>`,
        to: emailConfig.to,
        subject: 'Email Test',
        text: 'This is a test email from Embabi Store contact form.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h2 style="color: #f97316;">Email Configuration Test</h2>
            <p>This is a test email to verify that your email configuration is working correctly.</p>
            <p>If you're seeing this, it means your email is configured properly!</p>
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eaeaea;" />
            <p style="color: #666; font-size: 12px;">This is a test email from the Embabi Store contact form.</p>
          </div>
        `,
      };

      const info = await gmailTransporter.sendMail(mailOptions);
      console.log('Test message sent via Gmail: %s', info.messageId);
      emailSent = true;

      return NextResponse.json({
        message: 'Test email sent successfully via Gmail',
        id: info.messageId,
        config: { ...emailConfig, pass: '(hidden)' }
      });
    } catch (e) {
      console.error('Gmail transport attempt failed:', e);
      error = e;
    }

    // If Gmail failed, try SMTP with certificate rejection disabled
    if (!emailSent) {
      try {
        console.log('Trying SMTP with certificate validation disabled...');
        const transporter = nodemailer.createTransport({
          host: emailConfig.host,
          port: emailConfig.port,
          secure: true,
          auth: {
            user: emailConfig.user,
            pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
          },
          tls: {
            // Do not fail on invalid certificates
            rejectUnauthorized: false
          },
          debug: true,
          logger: true
        });

        // Email content
        const mailOptions = {
          from: `"Embabi Store Test" <${emailConfig.from}>`,
          to: emailConfig.to,
          subject: 'Email Test (SMTP)',
          text: 'This is a test email from Embabi Store contact form using SMTP.',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <h2 style="color: #f97316;">Email Configuration Test (SMTP)</h2>
              <p>This is a test email to verify that your SMTP email configuration is working correctly.</p>
              <p>If you're seeing this, it means your email is configured properly!</p>
              <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eaeaea;" />
              <p style="color: #666; font-size: 12px;">This is a test email from the Embabi Store contact form.</p>
            </div>
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Test message sent via SMTP: %s', info.messageId);
        emailSent = true;

        return NextResponse.json({
          message: 'Test email sent successfully via SMTP',
          id: info.messageId,
          config: { ...emailConfig, pass: '(hidden)' }
        });
      } catch (smtpError) {
        console.error('SMTP test failed:', smtpError);
        if (!error) error = smtpError;
      }
    }

    // If all attempts failed
    if (!emailSent) {
      throw error || new Error('Failed to send test email through any available method');
    }
  } catch (error) {
    console.error('Failed to send test email:', error);
    
    // Provide detailed error information
    let errorMessage = 'Failed to send test email';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
      console.error('Error details:', error.stack);
    }
    
    return NextResponse.json({
      error: errorMessage,
      details: errorDetails,
      env: {
        SMTP_HOST_EXISTS: !!process.env.SMTP_HOST,
        SMTP_PORT_EXISTS: !!process.env.SMTP_PORT,
        SMTP_USER_EXISTS: !!process.env.SMTP_USER,
        SMTP_PASS_EXISTS: !!process.env.SMTP_PASS,
        GMAIL_APP_PASSWORD_EXISTS: !!process.env.GMAIL_APP_PASSWORD,
      }
    }, { status: 500 });
  }
} 