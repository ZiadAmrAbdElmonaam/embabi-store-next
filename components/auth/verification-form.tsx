'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { TranslatedContent } from '@/components/ui/translated-content';

interface VerificationFormProps {
  email: string;
  returnUrl: string;
  fromCart?: boolean;
}

export function VerificationForm({ email, returnUrl, fromCart = false }: VerificationFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Set up cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle input change
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste event
      const pastedValue = value.slice(0, 6).split('');
      const newVerificationCode = [...verificationCode];
      
      pastedValue.forEach((char, i) => {
        if (i < 6) {
          newVerificationCode[i] = char;
        }
      });
      
      setVerificationCode(newVerificationCode);
      
      // Focus on the appropriate input
      if (pastedValue.length < 6 && pastedValue.length > 0) {
        inputRefs.current[Math.min(index + pastedValue.length, 5)]?.focus();
      }
    } else {
      // Handle single character input
      const newVerificationCode = [...verificationCode];
      newVerificationCode[index] = value;
      setVerificationCode(newVerificationCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle key down
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      // Move to previous input when backspace is pressed on an empty input
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join('');
    
    if (code.length !== 6) {
      toast.error(t('auth.enterValidCode'));
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('auth.verificationFailed'));
      }
      
      toast.success(t('auth.emailVerified'));
      
      // If coming from cart, redirect straight to the checkout after verification
      if (fromCart) {
        // Redirect to login with parameters to go to checkout after login
        router.push(`/login?returnUrl=${encodeURIComponent('/checkout')}&verified=true`);
      } else {
        // Regular flow - redirect to login page with return URL
        router.push(`/login${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}${returnUrl !== '/' ? '&' : '?'}verified=true`);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    
    setResendLoading(true);
    
    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle rate limiting with specific wait time
        if (response.status === 429 && data.waitTime) {
          setResendCooldown(data.waitTime);
          throw new Error(data.error);
        }
        throw new Error(data.error || t('auth.resendFailed'));
      }
      
      toast.success(t('auth.verificationCodeResent'));
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error(error.message || t('auth.somethingWentWrong'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || verificationCode.join('').length !== 6}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TranslatedContent translationKey="auth.verifyEmail" />
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          <TranslatedContent translationKey="auth.didntReceiveCode" />
        </p>
        
        {resendCooldown > 0 ? (
          <div className="flex flex-col items-center space-y-3">
            {/* Countdown Timer Display */}
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
              <span className="text-2xl font-bold text-gray-600">{resendCooldown}</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">
                {t('auth.resendCodeIn')}
              </p>
              <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((60 - resendCooldown) / 60) * 100}%` }}
                ></div>
              </div>
            </div>
            <button
              disabled={true}
              className="px-6 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
            >
              <TranslatedContent translationKey="auth.resendCode" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleResendCode}
            disabled={resendLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {resendLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <TranslatedContent translationKey="auth.resendCode" />
            )}
          </button>
        )}
      </div>
    </div>
  );
} 