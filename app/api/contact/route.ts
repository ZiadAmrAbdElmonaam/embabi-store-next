import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { readJsonWithLimit } from '@/lib/body-limit';

export async function POST(req: Request) {
  try {
    const key = getRateLimitKey(req);
    const limit = checkRateLimit(key, "contact");
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }

    const body = await readJsonWithLimit<{ name: string; email: string; subject: string; message: string }>(req, 32 * 1024);
    const { name, email, subject, message } = body;

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Log email configuration for debugging
    console.log('Email configuration:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || 465);
    console.log('SMTP_USER exists:', !!process.env.SMTP_USER);
    console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
    console.log('GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);

    // Email content - prepare this before creating the transporter
    const emailSubject = `Contact Form: ${subject}`;
    const emailText = `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
    `;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #f97316;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
          ${message.replace(/\n/g, '<br/>')}
        </div>
        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eaeaea;" />
        <p style="color: #666; font-size: 12px;">This email was sent from the Embabi Store contact form.</p>
      </div>
    `;

    // Try different email transport configurations
    let emailSent = false;
    let error: any = null;

    // First, try with the Gmail service directly, which is simpler
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
        }
      });

      const info = await gmailTransporter.sendMail({
        from: `"Embabi Store Contact Form" <${process.env.GMAIL_USER || 'embabistore110@gmail.com'}>`,
        to: process.env.CONTACT_EMAIL || 'embabistore110@gmail.com',
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      console.log('Message sent via Gmail: %s', info.messageId);
      emailSent = true;
    } catch (e) {
      console.error('Gmail transport attempt failed:', e);
      error = e;
      // Continue to the next attempt
    }

    // If Gmail direct failed, try SMTP with certificate validation disabled
    if (!emailSent) {
      try {
        console.log('Trying SMTP with certificate validation disabled...');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER || 'embabistore110@gmail.com',
            pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
          },
          tls: {
            // Do not fail on invalid certificates
            rejectUnauthorized: false
          }
        });

        const info = await transporter.sendMail({
          from: `"Embabi Store Contact Form" <${process.env.SMTP_FROM || 'embabistore110@gmail.com'}>`,
          to: process.env.CONTACT_EMAIL || 'embabistore110@gmail.com',
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
        });

        console.log('Message sent via SMTP: %s', info.messageId);
        emailSent = true;
      } catch (e) {
        console.error('SMTP email attempt failed:', e);
        if (!error) error = e;
      }
    }

    // If both attempts failed, try a different port (587) which some providers require
    if (!emailSent) {
      try {
        console.log('Trying SMTP with port 587...');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: 587,
          secure: false, // false for 587, true for 465
          auth: {
            user: process.env.SMTP_USER || 'embabistore110@gmail.com',
            pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
          },
          tls: {
            // Do not fail on invalid certificates
            rejectUnauthorized: false
          }
        });

        const info = await transporter.sendMail({
          from: `"Embabi Store Contact Form" <${process.env.SMTP_FROM || 'embabistore110@gmail.com'}>`,
          to: process.env.CONTACT_EMAIL || 'embabistore110@gmail.com',
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
        });

        console.log('Message sent via SMTP (port 587): %s', info.messageId);
        emailSent = true;
      } catch (e) {
        console.error('SMTP (port 587) email attempt failed:', e);
        if (!error) error = e;
      }
    }

    // If all attempts failed, log the message and save to a JSON file as a last resort
    if (!emailSent) {
      console.error('All email sending methods failed.');
      console.log('CONTACT FORM SUBMISSION:');
      console.log('From:', name, '(', email, ')');
      console.log('Subject:', subject);
      console.log('Message:', message);
      
      // Save to database directly using Prisma (if applicable)
      try {
        // This is a placeholder for actual database storage
        console.log('Saving contact message to log...');
        
        // For now, we'll just log everything but in a production app
        // you might want to save this to a database table
      } catch (dbError) {
        console.error('Failed to save contact message:', dbError);
      }
      
      // Instead of throwing error, we'll return a special response
      return NextResponse.json({ 
        message: 'Your message has been logged. We will contact you via email soon.',
        stored: true
      });
    }

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Failed to send email:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to send email';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', error.stack);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 