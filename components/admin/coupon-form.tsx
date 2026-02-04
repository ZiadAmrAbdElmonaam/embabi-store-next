'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface CouponFormProps {
  initialData: {
    id?: string;
    name: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    endDate: string | null;
    userLimit: number | null;
    minimumOrderAmount: number | null;
    isEnabled: boolean;
  };
  onSubmit?: (formData: any) => Promise<void>;
  isLoading?: boolean;
}

export default function CouponForm({ initialData, onSubmit, isLoading = false }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(isLoading);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    type: initialData?.type || "PERCENTAGE",
    value: initialData?.value?.toString() || "",
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
    userLimit: initialData?.userLimit?.toString() || "",
    minimumOrderAmount: initialData?.minimumOrderAmount?.toString() ?? "",
    isEnabled: initialData?.isEnabled !== undefined ? initialData.isEnabled : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name.trim()) {
      toast.error("Coupon name is required");
      return;
    }
    
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    
    if (!formData.value) {
      toast.error("Coupon value is required");
      return;
    }
    
    // Additional validation for percentage values
    if (formData.type === 'PERCENTAGE' && (parseFloat(formData.value) <= 0 || parseFloat(formData.value) > 100)) {
      toast.error("Percentage value must be between 1 and 100");
      return;
    }

    // Validate end date is not in the past
    if (formData.endDate) {
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
      
      if (endDate < today) {
        toast.error("End date cannot be in the past");
        return;
      }
    }

    if (onSubmit) {
      // Use the provided onSubmit function
      await onSubmit({
        name: formData.name,
        code: formData.code,
        type: formData.type,
        value: parseFloat(formData.value),
        endDate: formData.endDate || null,
        userLimit: formData.userLimit ? parseInt(formData.userLimit) : null,
        minimumOrderAmount: formData.minimumOrderAmount ? parseFloat(formData.minimumOrderAmount) : null,
        isEnabled: formData.isEnabled,
      });
    } else {
      // Use the default submit logic
      setLoading(true);

      try {
        const url = initialData.id 
          ? `/api/admin/coupons/${initialData.id}`
          : '/api/admin/coupons';
        const { getCsrfHeaders } = await import('@/lib/csrf-client');
        const csrfHeaders = await getCsrfHeaders();
        const response = await fetch(url, {
          method: initialData.id ? 'PUT' : 'POST',
          headers: { ...csrfHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            type: formData.type,
            value: parseFloat(formData.value),
            endDate: formData.endDate || null,
            userLimit: formData.userLimit ? parseInt(formData.userLimit) : null,
            minimumOrderAmount: formData.minimumOrderAmount ? parseFloat(formData.minimumOrderAmount) : null,
            isEnabled: formData.isEnabled,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Something went wrong');
        }

        router.push('/admin/coupons');
        router.refresh();
        toast.success(initialData.id ? 'Coupon updated' : 'Coupon created');
      } catch (error) {
        console.error('Error:', error);
        toast.error(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Code</label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 uppercase"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Coupon code that users will enter at checkout (e.g., SUMMER20)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ 
              ...formData, 
              type: e.target.value as 'PERCENTAGE' | 'FIXED',
              // Reset value when type changes to prevent invalid values
              value: "" 
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          >
            <option value="PERCENTAGE">Percentage Discount</option>
            <option value="FIXED">Fixed Amount (EGP)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {formData.type === 'PERCENTAGE' ? 'Discount Percentage' : 'Discount Amount (EGP)'}
          </label>
          <input
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            min={formData.type === 'PERCENTAGE' ? 1 : 0.01}
            max={formData.type === 'PERCENTAGE' ? 100 : undefined}
            step={formData.type === 'PERCENTAGE' ? 1 : 0.01}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
          {formData.type === 'PERCENTAGE' && (
            <p className="mt-1 text-sm text-gray-500">
              Enter a value between 1 and 100
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Minimum Order Amount (EGP)</label>
        <input
          type="number"
          value={formData.minimumOrderAmount}
          onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
          min="0"
          step="0.01"
          placeholder="No minimum"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional. Minimum cart subtotal required for this coupon to apply. Leave blank for no minimum.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional. Leave blank for no expiration.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Usage Limit Per User
          </label>
          <input
            type="number"
            value={formData.userLimit}
            onChange={(e) => setFormData({ ...formData, userLimit: e.target.value })}
            min="1"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional. Leave blank for unlimited uses per user.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isEnabled"
            checked={formData.isEnabled}
            onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isEnabled" className="ml-2 block text-sm text-gray-900">
            Enable Coupon
          </label>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Unchecking this will prevent the coupon from being used.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.push('/admin/coupons')}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 mr-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex items-center"
        >
          {(loading || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData.id ? 'Update Coupon' : 'Create Coupon'}
        </button>
      </div>
    </form>
  );
} 