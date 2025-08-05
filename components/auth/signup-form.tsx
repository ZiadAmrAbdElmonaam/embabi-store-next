'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, Info } from "lucide-react";
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
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[@$!%*?&])/.test(password)) score++;
    return score;
  };
  
  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
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

    // Client-side validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please use a valid email from Gmail, Yahoo, or Outlook');
      toast.error('Please use a valid email from Gmail, Yahoo, or Outlook');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      toast.error('Password must be at least 8 characters long');
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
      // Log error only in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Signup error:', error);
      }
      
      const errorMessage = error.message || t('auth.somethingWentWrong');
      setError(errorMessage);
      toast.error(errorMessage);
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
        
        {/* Password Strength Meter */}
        {formData.password && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Password Strength:</span>
              <span className={`font-medium ${
                passwordStrength <= 1 ? 'text-red-600' :
                passwordStrength === 2 ? 'text-orange-600' :
                passwordStrength === 3 ? 'text-yellow-600' :
                passwordStrength === 4 ? 'text-blue-600' : 'text-green-600'
              }`}>
                {strengthLabels[passwordStrength - 1] || 'Very Weak'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength > 0 ? strengthColors[passwordStrength - 1] : 'bg-gray-300'
                }`}
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Password Requirements Hint */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowPasswordHint(!showPasswordHint)}
            className="flex items-center text-xs text-gray-500 hover:text-gray-700"
          >
            <Info className="h-3 w-3 mr-1" />
            <TranslatedContent translationKey="auth.passwordRequirements" />
          </button>
          
          {showPasswordHint && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-gray-700">
              <p className="font-medium mb-2">
                <TranslatedContent translationKey="auth.passwordMustContain" />
              </p>
              <ul className="space-y-1">
                <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-600'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <TranslatedContent translationKey="auth.atLeast8Characters" />
                </li>
                <li className={`flex items-center ${/(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[a-z])/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <TranslatedContent translationKey="auth.oneLowercaseLetter" />
                </li>
                <li className={`flex items-center ${/(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[A-Z])/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <TranslatedContent translationKey="auth.oneUppercaseLetter" />
                </li>
                <li className={`flex items-center ${/(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${/(?=.*\d)/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <TranslatedContent translationKey="auth.oneNumber" />
                </li>
                <li className={`flex items-center ${/(?=.*[@$!%*?&])/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[@$!%*?&])/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <TranslatedContent translationKey="auth.oneSpecialCharacter" />
                </li>
              </ul>
            </div>
          )}
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