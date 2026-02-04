import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";
import { validateEmail, validatePassword, validateName, sanitizeInput } from "@/lib/validation";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request);
    const limit = checkRateLimit(key, "signup");
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }

    const data = await request.json();
    
    // Sanitize inputs
    const sanitizedData = {
      email: sanitizeInput(data.email || ''),
      password: data.password || '',
      name: sanitizeInput(data.name || '')
    };
    
    // Validate all inputs
    const emailValidation = validateEmail(sanitizedData.email);
    const passwordValidation = validatePassword(sanitizedData.password);
    const nameValidation = validateName(sanitizedData.name);
    
    const allErrors = [
      ...emailValidation.errors,
      ...passwordValidation.errors,
      ...nameValidation.errors
    ];
    
    if (allErrors.length > 0) {
      return NextResponse.json(
        { error: allErrors[0] }, // Return first error
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedData.email },
    });

    if (existingUser) {
      // If user exists but is not verified, allow re-sending verification code
      if (!existingUser.emailVerified) {
        // Generate a new verification code
        const verificationCode = generateVerificationCode();
        const verificationExpiry = new Date();
        verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 10); // 10 minutes expiry

        // Update the existing user with a new verification code
        await prisma.user.update({
          where: { email: data.email },
          data: {
            verificationCode,
            verificationCodeExpiry: verificationExpiry,
            lastVerificationSent: new Date(),
            verificationAttempts: 0 // Reset attempts
          }
        });

        // Send verification email
        try {
          await sendVerificationEmail(sanitizedData.email, verificationCode, sanitizedData.name);
        } catch (emailError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to send verification email:', emailError);
          }
          // Continue even if email fails, user can request a new code
        }

        return NextResponse.json({
          email: sanitizedData.email,
          message: 'Verification code sent. Please verify your email.'
        });
      } else {
        // If user exists and is already verified, return error
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 10); // 10 minutes expiry

    // Create user (unverified)
    const user = await prisma.user.create({
      data: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        password: hashedPassword,
        role: 'USER', // Default role
        emailVerified: false,
        verificationCode,
        verificationCodeExpiry: verificationExpiry,
        lastVerificationSent: new Date(),
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(sanitizedData.email, verificationCode, sanitizedData.name);
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send verification email:', emailError);
      }
      // Continue even if email fails, user can request a new code
    }

    // Return only necessary information
    return NextResponse.json({
      email: user.email,
      message: 'User created. Please verify your email.'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating user:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    return NextResponse.json(
      { error: 'Failed to create user. Please try again later.' },
      { status: 500 }
    );
  }
} 