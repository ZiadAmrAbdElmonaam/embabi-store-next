'use client';

import CouponForm from '@/components/admin/coupon-form';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Coupon {
  id: string;
  name: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  endDate: string | null;
  userLimit: number | null;
  minimumOrderAmount: number | null;
  isEnabled: boolean;
}

export default function EditCouponPage() {
  const params = useParams();
  const router = useRouter();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const response = await fetch(`/api/admin/coupons/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch coupon');
        }
        
        const data = await response.json();
        setCoupon(data);
      } catch (error) {
        toast.error('Failed to fetch coupon');
        console.error('Failed to fetch coupon:', error);
        router.push('/admin/coupons');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchCoupon();
    }
  }, [params.id, router]);

  const onSubmit = async (formData: any) => {
    setIsSaving(true);

    try {
      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(`/api/admin/coupons/${params.id}`, {
        method: 'PUT',
        headers: {
          ...csrfHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update coupon');
      }

      toast.success('Coupon updated successfully');
      router.push('/admin/coupons');
      router.refresh();
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update coupon');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading coupon details...</div>;
  }

  if (!coupon) {
    return <div className="p-8 text-center">Coupon not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Coupon</h1>
        <p className="text-gray-500">Update the details of your coupon</p>
      </div>

      <CouponForm 
        initialData={{
          id: coupon.id,
          name: coupon.name,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          endDate: coupon.endDate,
          userLimit: coupon.userLimit,
          minimumOrderAmount: coupon.minimumOrderAmount ?? null,
          isEnabled: coupon.isEnabled
        }}
        onSubmit={onSubmit}
        isLoading={isSaving}
      />
    </div>
  );
} 