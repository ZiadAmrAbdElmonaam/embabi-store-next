import { NextResponse } from "next/server";
import { createAndSendVerificationCode, canRequestNewCode } from "@/lib/verification";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/validation";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request);
    const limit = checkRateLimit(key, "verify");
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.errors[0] },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json({ 
        success: true, 
        message: 'If your email exists in our system, a verification code has been sent.' 
      });
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Check if user can request a new code
    if (user.lastVerificationSent && !canRequestNewCode(user.lastVerificationSent)) {
      const now = new Date();
      const timeDiff = now.getTime() - user.lastVerificationSent.getTime();
      const secondsToWait = 30 - Math.floor(timeDiff / 1000);
      
      return NextResponse.json(
        { 
          error: `Please wait ${secondsToWait} seconds before requesting a new code`,
          waitTime: secondsToWait
        },
        { status: 429 }
      );
    }

    // Send a new verification code
    const success = await createAndSendVerificationCode(email, user.name || undefined);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Verification code sent successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error resending verification code:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification code' },
      { status: 500 }
    );
  }
} 