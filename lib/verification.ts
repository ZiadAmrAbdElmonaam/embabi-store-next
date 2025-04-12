import { prisma } from './prisma';
import { sendVerificationEmail } from './email';

// Generate a random 6-digit verification code
export function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

// Check if a user can request a new verification code
export function canRequestNewCode(lastSent: Date | null): boolean {
  if (!lastSent) {
    return true;
  }
  
  const now = new Date();
  const timeDiff = now.getTime() - lastSent.getTime();
  const secondsPassed = Math.floor(timeDiff / 1000);
  
  // Allow new code after 30 seconds
  const canRequest = secondsPassed >= 30;
  return canRequest;
}

// Create and send a verification code
export async function createAndSendVerificationCode(email: string, name?: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return false;
    }
    
    if (user.lastVerificationSent && !canRequestNewCode(user.lastVerificationSent)) {
      return false;
    }
    
    const code = generateVerificationCode();
    
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10); // Code expires in 10 minutes
    
    await prisma.user.update({
      where: { email },
      data: {
        verificationCode: code,
        verificationCodeExpiry: expiryTime,
        lastVerificationSent: new Date(),
        verificationAttempts: 0 // Reset attempts when sending a new code
      }
    });
    
    try {
      await sendVerificationEmail(email, code, name);
    } catch (emailError) {
      console.error(`Error sending verification email to ${email}:`, emailError);
      // Continue even if email sending fails
    }
    
    return true;
  } catch (error) {
    console.error('Error creating verification code:', error);
    return false;
  }
}

// Verify a code
export async function verifyCode(email: string, code: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Check if user is already verified
    if (user.emailVerified) {
      return { success: true, message: 'Email already verified' };
    }
    
    // Check if user has a verification code
    if (!user.verificationCode || !user.verificationCodeExpiry) {
      return { success: false, message: 'No verification code found' };
    }
    
    // Check if code is expired
    const now = new Date();
    if (now > user.verificationCodeExpiry) {
      return { success: false, message: 'Verification code expired' };
    }
    
    // Check if too many attempts
    if (user.verificationAttempts >= 5) {
      return { success: false, message: 'Too many attempts. Please request a new code.' };
    }
    
    // Check if code matches
    if (user.verificationCode !== code) {
      // Increment attempts
      await prisma.user.update({
        where: { email },
        data: {
          verificationAttempts: {
            increment: 1
          }
        }
      });
      
      return { success: false, message: 'Invalid verification code' };
    }
    
    // Code is valid, mark user as verified
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
        verificationAttempts: 0
      }
    });
    
    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { success: false, message: 'An error occurred during verification' };
  }
} 