'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { WarningModal } from "@/components/ui/modal";

export function ProfileForm() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    password: '',
    newPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowWarningModal(true);
  };

  const handleUpdate = async () => {
    setShowWarningModal(false);
    setLoading(true);
    try {
      await update(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-lg font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-lg py-3 bg-transparent border-b-2 border-gray-200 focus:border-orange-600 focus:outline-none transition-colors"
              placeholder="Enter your name"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-lg font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-lg py-3 bg-transparent border-b-2 border-gray-200 focus:border-orange-600 focus:outline-none transition-colors"
              placeholder="Enter your email"
            />
          </div>

          {/* Current Password Field */}
          <div className="space-y-2">
            <label className="text-lg font-medium text-gray-700">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full text-lg py-3 bg-transparent border-b-2 border-gray-200 focus:border-orange-600 focus:outline-none transition-colors"
                placeholder="Enter current password"
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
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full text-lg py-3 bg-transparent border-b-2 border-gray-200 focus:border-orange-600 focus:outline-none transition-colors"
                placeholder="Enter new password"
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>

      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleUpdate}
        title="Update Profile"
        message="Are you sure you want to update your profile information? This action cannot be undone."
      />
    </>
  );
} 