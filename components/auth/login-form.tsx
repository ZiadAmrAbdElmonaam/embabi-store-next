'use client';

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { TranslatedContent } from "@/components/ui/translated-content";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const fromCart = searchParams.get('fromCart') === 'true';
  const verified = searchParams.get('verified') === 'true';
  const error = searchParams.get('error');
  const { t, lang } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Show success message if user just verified their email
  useEffect(() => {
    if (verified) {
      toast.success(t('auth.emailVerified'));
    }
  }, [verified, t]);

  // Show error message if there was an auth error
  useEffect(() => {
    if (error) {
      toast.error(t('auth.authFailed'));
    }
  }, [error, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(t('auth.invalidCredentials'));
      } else {
        // Check user role and redirect accordingly
        const response = await fetch('/api/auth/check-role');
        const { role } = await response.json();
        
        // Refresh the session first
        await router.refresh();

        // Then handle redirection
        if (role === 'ADMIN') {
          router.push('/admin');
        } else if (fromCart) {
          // If coming from cart, redirect back to cart page instead of checkout
          router.push('/cart');
        } else if (returnUrl && returnUrl !== '/') {
          router.push(returnUrl);
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      toast.error(t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          <TranslatedContent translationKey="auth.email" />
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          placeholder={t('auth.enterYourEmail')}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          <TranslatedContent translationKey="auth.password" />
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            placeholder={t('auth.enterYourPassword')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute inset-y-0 ${lang === 'ar' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <label htmlFor="remember" className="ms-2 text-gray-700">
            <TranslatedContent translationKey="auth.rememberMe" />
          </label>
        </div>

        <Link
          href="/reset-password"
          className="font-medium text-orange-600 hover:text-orange-500"
        >
          <TranslatedContent translationKey="auth.forgotPassword" />
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 mt-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <TranslatedContent translationKey="auth.signIn" />
        )}
      </button>

      <p className="text-center text-sm text-gray-600 mt-4">
        <TranslatedContent translationKey="auth.dontHaveAccount" />{" "}
        <Link 
          href={`/signup${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}${fromCart ? `${returnUrl !== '/' ? '&' : '?'}fromCart=true` : ''}`}
          className="font-medium text-orange-600 hover:text-orange-500"
        >
          <TranslatedContent translationKey="auth.signUp" />
        </Link>
      </p>
    </form>
  );
} 