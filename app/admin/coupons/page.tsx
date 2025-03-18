'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Ticket, CalendarClock, Users, PercentCircle, Check, X } from 'lucide-react';

interface Coupon {
  id: string;
  name: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  endDate: string | null;
  userLimit: number | null;
  isEnabled: boolean;
  usedCount: number;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      toast.error('Failed to fetch coupons');
      console.error('Failed to fetch coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Extract error message from the response
        const errorMessage = data.error || 'Failed to delete coupon';
        throw new Error(errorMessage);
      }
      
      toast.success('Coupon deleted successfully');
      fetchCoupons(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete coupon';
      toast.error(errorMessage);
      console.error('Failed to delete coupon:', error);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Fetch the coupon first to get all its data
      const getResponse = await fetch(`/api/admin/coupons/${id}`);
      if (!getResponse.ok) throw new Error('Failed to fetch coupon');
      
      const coupon = await getResponse.json();
      
      // Update the isEnabled status
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...coupon,
          isEnabled: !currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update coupon status');
      }
      
      toast.success(`Coupon ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      fetchCoupons(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update coupon status';
      toast.error(errorMessage);
      console.error('Failed to update coupon status:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiration';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if coupon is expired
  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading coupons...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Link
          href="/admin/coupons/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Coupon
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Code</th>
              <th className="px-6 py-3 text-left">Discount</th>
              <th className="px-6 py-3 text-left">End Date</th>
              <th className="px-6 py-3 text-left">Usage</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No coupons found. Create your first coupon.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b">
                  <td className="px-6 py-4">{coupon.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center bg-gray-100 px-2.5 py-1 rounded-full text-sm font-medium">
                      <Ticket className="mr-1 h-4 w-4 text-gray-500" />
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {coupon.type === 'PERCENTAGE' ? (
                      <span className="inline-flex items-center text-green-700">
                        <PercentCircle className="mr-1 h-4 w-4" />
                        {coupon.value}%
                      </span>
                    ) : (
                      <span className="text-green-700">
                        {coupon.value.toFixed(2)} EGP
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center">
                      <CalendarClock className="mr-1 h-4 w-4 text-gray-500" />
                      <span className={isExpired(coupon.endDate) ? 'text-red-600' : ''}>
                        {formatDate(coupon.endDate)}
                        {isExpired(coupon.endDate) && ' (Expired)'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center">
                      <Users className="mr-1 h-4 w-4 text-gray-500" />
                      <span>
                        {coupon.usedCount} used
                        {coupon.userLimit ? ` / Limit: ${coupon.userLimit} per user` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {coupon.isEnabled ? (
                      <span className="inline-flex items-center text-green-600">
                        <Check className="mr-1 h-4 w-4" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-600">
                        <X className="mr-1 h-4 w-4" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/coupons/${coupon.id}/edit`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(coupon.id, coupon.isEnabled)}
                        className={`${
                          coupon.isEnabled ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {coupon.isEnabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 