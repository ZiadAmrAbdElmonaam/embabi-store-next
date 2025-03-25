'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { WarningModal } from "@/components/ui/modal";
import { TranslatedContent } from "@/components/ui/translated-content";
import { useTranslation } from "@/hooks/use-translation";

export function ProfileForm() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password validation
  const [passwordError, setPasswordError] = useState('');
  
  const validatePassword = () => {
    if (formData.newPassword && formData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword) {
      toast.error(t('profile.currentPasswordRequired'));
      return;
    }
    
    if (formData.newPassword && !validatePassword()) {
      return;
    }
    
    setShowWarningModal(true);
  };

  const handleUpdate = async () => {
    setShowWarningModal(false);
    setLoading(true);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      
      // Reset password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast.success(t('profile.passwordUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          {/* Name Field - Read Only */}
          <div className="space-y-2">
            <label className="text-lg font-medium text-gray-700">
              <TranslatedContent translationKey="profile.name" />
            </label>
            <input
              type="text"
              value={formData.name}
              readOnly
              className="w-full text-lg py-3 bg-gray-50 border-b-2 border-gray-200 text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Email Field - Read Only */}
          <div className="space-y-2">
            <label className="text-lg font-medium text-gray-700">
              <TranslatedContent translationKey="profile.email" />
            </label>
            <input
              type="email"
              value={formData.email}
              readOnly
              className="w-full text-lg py-3 bg-gray-50 border-b-2 border-gray-200 text-gray-700 cursor-not-allowed"
            />
          </div>

          <div className="pt-4 border-t-2 border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              <TranslatedContent translationKey="profile.changePassword" />
            </h3>
          </div>

          {/* Current Password Field */}
          <div className="space-y-2">
            <label className="text-lg font-medium text-gray-700">
              <TranslatedContent translationKey="profile.currentPassword" />
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="w-full text-lg py-3 bg-transparent border-b-2 border-gray-200 focus:border-orange-600 focus:outline-none transition-colors"
                placeholder={t('profile.enterCurrentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="space-y-2">
            <label className="text-lg font-medium text-gray-700">
              <TranslatedContent translationKey="profile.newPassword" />
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full text-lg py-3 bg-transparent border-b-2 border-gray-200 focus:border-orange-600 focus:outline-none transition-colors"
                placeholder={t('profile.enterNewPassword')}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="text-lg font-medium text-gray-700">
              <TranslatedContent translationKey="profile.confirmPassword" />
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full text-lg py-3 bg-transparent border-b-2 border-gray-200 focus:border-orange-600 focus:outline-none transition-colors"
                placeholder={t('profile.confirmNewPassword')}
                minLength={8}
              />
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? t('profile.updating') : t('profile.updatePassword')}
        </button>
      </form>

      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleUpdate}
        title={t('profile.confirmPasswordChange')}
        message={t('profile.confirmPasswordChangeMessage')}
      />
    </>
  );
} 