'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { TranslatedContent } from "@/components/ui/translated-content";

export function ResetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");
  const { t, lang } = useTranslation();

  // Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          step: "request" 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.failedToReset'));
      }

      toast.success(t('auth.codeSent'));
      setStep("verify");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  // Verify the code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          code: verificationCode,
          step: "verify" 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.invalidCode'));
      }

      toast.success(t('auth.verificationCode'));
      setStep("reset");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    
    if (password.length < 8) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          password,
          step: "reset" 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.failedToReset'));
      }

      toast.success(t('auth.passwordResetSuccess'));
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.failedToReset'));
    } finally {
      setLoading(false);
    }
  };

  // Request Password Reset Form
  if (step === "request") {
    return (
      <form onSubmit={handleRequestReset} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            <TranslatedContent translationKey="auth.email" />
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            placeholder={t('auth.enterYourEmail')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TranslatedContent translationKey="auth.sendVerificationCode" />
          )}
        </button>

        <div className="text-center mt-4">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <TranslatedContent translationKey="auth.backToLogin" />
          </Link>
        </div>
      </form>
    );
  }

  // Verify Code Form
  if (step === "verify") {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            <TranslatedContent translationKey="auth.weSentVerificationCode" /> <span className="font-semibold">{email}</span>
          </p>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            <TranslatedContent translationKey="auth.verificationCode" />
          </label>
          <input
            id="code"
            type="text"
            required
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            placeholder={t('auth.enterVerificationCode')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TranslatedContent translationKey="auth.verifyCode" />
          )}
        </button>

        <div className="flex justify-between text-sm mt-4">
          <button
            type="button"
            onClick={() => setStep("request")}
            className="text-orange-600 hover:text-orange-500 font-medium"
          >
            <TranslatedContent translationKey="auth.changeEmail" />
          </button>
          <button
            type="button"
            onClick={handleRequestReset}
            className="text-orange-600 hover:text-orange-500 font-medium"
          >
            <TranslatedContent translationKey="auth.resendVerificationCode" />
          </button>
        </div>
      </form>
    );
  }

  // Reset Password Form
  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
          <TranslatedContent translationKey="auth.newPassword" />
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            placeholder={t('auth.enterNewPassword')}
            minLength={8}
          />
          <button 
            type="button"
            className={`absolute inset-y-0 ${lang === 'ar' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          <TranslatedContent translationKey="auth.confirmPassword" />
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          placeholder={t('auth.confirmNewPassword')}
          minLength={8}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <TranslatedContent translationKey="auth.resetPasswordButton" />
        )}
      </button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => setStep("verify")}
          className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <TranslatedContent translationKey="auth.backToVerification" />
        </button>
      </div>
    </form>
  );
} 