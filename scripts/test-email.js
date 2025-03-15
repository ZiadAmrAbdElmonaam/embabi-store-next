// Simple script to test email sending
const nodemailer = require('nodemailer');
require('dotenv').config();

async function main() {
  console.log('Email test script starting...');
  console.log('Email configuration check:');
  console.log('GMAIL_USER configured:', !!process.env.GMAIL_USER);
  console.log('GMAIL_APP_PASSWORD configured:', !!process.env.GMAIL_APP_PASSWORD);
  console.log('GMAIL_USER length:', process.env.GMAIL_USER?.length);
  console.log('GMAIL_APP_PASSWORD length:', process.env.GMAIL_APP_PASSWORD?.length);

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Email credentials not configured. Please check your .env file.');
    return;
  }

  try {
    console.log('Creating test transporter...');
    
    // Create transporter with simple configuration
    const transporter = nodemailer.createTransport({
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
      debug: true,
      logger: true
    });

    console.log('Verifying transporter...');
    try {
      const verifyResult = await transporter.verify();
      console.log('Verification result:', verifyResult);
    } catch (verifyError) {
      console.error('Verification failed, but continuing anyway:', verifyError);
    }

    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: `"Test Email" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Send to self for testing
      subject: 'Test Email',
      text: 'This is a test email to verify the email sending functionality.',
      html: '<p>This is a test email to verify the email sending functionality.</p>'
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(result) : 'No preview URL available');
  } catch (error) {
    console.error('Error sending test email:');
    console.error(error);
    
    if (error && typeof error === 'object') {
      if ('code' in error) console.error('Error code:', error.code);
      if ('command' in error) console.error('Error command:', error.command);
      if ('response' in error) console.error('Error response:', error.response);
    }
  }
}

main().catch(console.error); 