import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { createAndSendVerificationCode, verifyCode } from "@/lib/verification";

export async function POST(req: Request) {
  try {
    const { email, step, code, password } = await req.json();

    // Step 1: Request password reset (send verification code)
    if (step === "request") {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // For security reasons, still return success even if user not found
        return NextResponse.json({ 
          success: true,
          message: "If an account exists with this email, you will receive reset instructions." 
        });
      }

      // Generate and send verification code
      const result = await createAndSendVerificationCode(email, user.name || undefined);
      
      if (!result) {
        return NextResponse.json(
          { error: "Failed to send verification code. Please try again later." },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: "Verification code sent to your email." 
      });
    }
    
    // Step 2: Verify the code
    if (step === "verify") {
      if (!code) {
        return NextResponse.json(
          { error: "Verification code is required" },
          { status: 400 }
        );
      }

      const result = await verifyCode(email, code);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: "Email verified. You can now reset your password." 
      });
    }

    // Step 3: Reset password
    if (step === "reset") {
      if (!password) {
        return NextResponse.json(
          { error: "New password is required" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Check if user's email is verified before allowing password reset
      if (!user.emailVerified) {
        return NextResponse.json(
          { error: "Email must be verified before resetting password" },
          { status: 400 }
        );
      }

      // Hash the new password
      const hashedPassword = await hash(password, 12);

      // Update user's password
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });

      return NextResponse.json({
        success: true,
        message: "Password has been reset successfully."
      });
    }

    return NextResponse.json(
      { error: "Invalid step parameter" },
      { status: 400 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Password reset error:", error);
    }
    return NextResponse.json(
      { error: "Failed to process password reset" },
      { status: 500 }
    );
  }
} 