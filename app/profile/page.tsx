'use client';

import { useState } from "react";
import { ProfileForm } from "@/components/profile/profile-form";
import { OrderHistory } from "@/components/profile/order-history";
import { useSession } from "next-auth/react";
import { User, Package, ShoppingBag } from "lucide-react";
import { TranslatedContent } from "@/components/ui/translated-content";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <User size={36} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {session.user?.name || 'User'}
              </h1>
              <p className="text-gray-500">{session.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Navigation Tabs */}
          <div className="flex gap-8 border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-4 text-lg font-medium transition-colors
                ${activeTab === 'profile' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-gray-600 hover:text-orange-600'
                }`}
            >
              <User size={20} />
              <span><TranslatedContent translationKey="profile.title" /></span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-4 text-lg font-medium transition-colors
                ${activeTab === 'orders' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-gray-600 hover:text-orange-600'
                }`}
            >
              <Package size={20} />
              <span><TranslatedContent translationKey="profile.orderHistory" /></span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-orange-50 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600"><TranslatedContent translationKey="profile.totalOrders" /></p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>
            {/* Add more stat cards as needed */}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg">
            {activeTab === 'profile' ? <ProfileForm /> : <OrderHistory />}
          </div>
        </div>
      </div>
    </div>
  );
} 