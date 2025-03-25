'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { TranslatedContent } from "@/components/ui/translated-content";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const fromCart = searchParams.get('fromCart') === 'true';
  const { t, lang } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.somethingWentWrong'));
      }

      toast.success(t('auth.accountCreated'));
      
      // Redirect to verification page with email and fromCart parameter if needed
      let verifyRoute = `/verify?email=${encodeURIComponent(formData.email)}`;
      
      if (returnUrl !== '/') {
        verifyRoute += `&returnUrl=${encodeURIComponent(returnUrl)}`;
      }
      
      if (fromCart) {
        verifyRoute += '&fromCart=true';
      }
      
      router.push(verifyRoute);
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || t('auth.somethingWentWrong'));
      toast.error(error.message || t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          <TranslatedContent translationKey="auth.fullName" />
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          placeholder={t('auth.fullName')}
        />
      </div>

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
            placeholder={t('auth.createPassword')}
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

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          <TranslatedContent translationKey="auth.confirmPassword" />
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm ${
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'border-red-300'
                : 'border-gray-300'
            }`}
            placeholder={t('auth.confirmYourPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className={`absolute inset-y-0 ${lang === 'ar' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{t('auth.passwordsDoNotMatch')}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || (formData.password !== formData.confirmPassword && Boolean(formData.confirmPassword))}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <TranslatedContent translationKey="auth.createAccount" />
        )}
      </button>

      <p className="text-center text-sm text-gray-600 mt-4">
        <TranslatedContent translationKey="auth.alreadyHaveAccount" />{" "}
        <Link 
          href={`/login${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}${fromCart ? `${returnUrl !== '/' ? '&' : '?'}fromCart=true` : ''}`}
          className="font-medium text-orange-600 hover:text-orange-500"
        >
          <TranslatedContent translationKey="auth.signIn" />
        </Link>
      </p>
    </form>
  );
} 