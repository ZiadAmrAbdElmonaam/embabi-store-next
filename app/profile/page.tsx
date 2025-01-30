'use client';

import { ProfileForm } from "@/components/profile/profile-form";
import { OrderHistory } from "@/components/profile/order-history";
import { useState } from "react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">My Account</h1>
        
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 ${activeTab === 'profile' ? 'border-b-2 border-blue-600' : ''}`}
          >
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 ${activeTab === 'orders' ? 'border-b-2 border-blue-600' : ''}`}
          >
            Order History
          </button>
        </div>

        {activeTab === 'profile' ? <ProfileForm /> : <OrderHistory />}
      </div>
    </div>
  );
} 