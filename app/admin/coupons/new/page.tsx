'use client';

import CouponForm from '@/components/admin/coupon-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function NewCouponPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (formData: any) => {
    setIsLoading(true);

    try {
      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          ...csrfHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create coupon');
      }

      toast.success('Coupon created successfully');
      router.push('/admin/coupons');
      router.refresh();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create coupon');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Coupon</h1>
        <p className="text-gray-500">Create a new coupon for your customers</p>
      </div>

      <CouponForm 
        initialData={{
          name: '',
          code: '',
          type: 'PERCENTAGE',
          value: 0,
          endDate: null,
          userLimit: null,
          minimumOrderAmount: null,
          isEnabled: true
        }}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  );
} 