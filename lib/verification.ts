import { prisma } from './prisma';
import { sendVerificationEmail } from './email';

// Generate a random 6-digit verification code
export function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Generated verification code: ${code}`);
  return code;
}

// Check if a user can request a new verification code
export function canRequestNewCode(lastSent: Date | null): boolean {
  if (!lastSent) {
    console.log('No previous verification code sent, can send a new one');
    return true;
  }
  
  const now = new Date();
  const timeDiff = now.getTime() - lastSent.getTime();
  const secondsPassed = Math.floor(timeDiff / 1000);
  
  // Allow new code after 30 seconds
  const canRequest = secondsPassed >= 30;
  console.log(`Time since last code: ${secondsPassed}s, can request new code: ${canRequest}`);
  return canRequest;
}

// Create and send a verification code
export async function createAndSendVerificationCode(email: string, name?: string): Promise<boolean> {
  try {
    console.log(`Attempting to create and send verification code to ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      return false;
    }
    
    // Check if user can request a new code
    if (user.lastVerificationSent && !canRequestNewCode(user.lastVerificationSent)) {
      console.log(`User ${email} requested a new code too soon`);
      return false;
    }
    
    // Generate a new code
    const code = generateVerificationCode();
    console.log(`Generated verification code ${code} for ${email}`);
    
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10); // Code expires in 10 minutes
    
    // Update user with new code
    await prisma.user.update({
      where: { email },
      data: {
        verificationCode: code,
        verificationCodeExpiry: expiryTime,
        lastVerificationSent: new Date(),
        verificationAttempts: 0 // Reset attempts when sending a new code
      }
    });
    console.log(`Updated user ${email} with new verification code`);
    
    // Send the code via email - handle errors gracefully
    try {
      await sendVerificationEmail(email, code, name);
      console.log(`Verification email sent to ${email}`);
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
    console.log(`Verifying code ${code} for email ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      return { success: false, message: 'User not found' };
    }
    
    // Check if user is already verified
    if (user.emailVerified) {
      console.log(`User ${email} is already verified`);
      return { success: true, message: 'Email already verified' };
    }
    
    // Check if user has a verification code
    if (!user.verificationCode || !user.verificationCodeExpiry) {
      console.log(`User ${email} has no verification code`);
      return { success: false, message: 'No verification code found' };
    }
    
    console.log(`User ${email} has verification code: ${user.verificationCode}`);
    console.log(`Expiry: ${user.verificationCodeExpiry}, Current time: ${new Date()}`);
    
    // Check if code is expired
    const now = new Date();
    if (now > user.verificationCodeExpiry) {
      console.log(`Verification code for ${email} has expired`);
      return { success: false, message: 'Verification code expired' };
    }
    
    // Check if too many attempts
    if (user.verificationAttempts >= 5) {
      console.log(`Too many verification attempts for ${email}`);
      return { success: false, message: 'Too many attempts. Please request a new code.' };
    }
    
    // Check if code matches
    console.log(`Comparing codes: User entered ${code}, stored code is ${user.verificationCode}`);
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
      
      console.log(`Invalid verification code for ${email}. Attempts: ${user.verificationAttempts + 1}`);
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
    
    console.log(`Email ${email} verified successfully`);
    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { success: false, message: 'An error occurred during verification' };
  }
} 