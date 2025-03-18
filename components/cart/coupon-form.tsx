'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Ticket } from 'lucide-react';
import { TranslatedContent } from '@/components/ui/translated-content';
import { useCart } from '@/hooks/use-cart';

export default function CartCouponForm() {
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const router = useRouter();
  const { setCoupon, setDiscountAmount, items } = useCart();

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsLoading(true);
    setCouponError(null);

    try {
      const response = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: couponCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCouponError(data.error || 'Invalid coupon code');
        setIsLoading(false);
        return;
      }

      // Success - get the coupon from cookies and update cart state
      toast.success('Coupon applied successfully!');
      
      // Use the new loadCouponFromCookies method to load the coupon
      // This pulls the coupon data from the server cookies and updates the cart state
      const { loadCouponFromCookies } = useCart.getState();
      await loadCouponFromCookies();
      
      // Reset the form
      setCouponCode('');
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        <TranslatedContent translationKey="cart.applyCoupon" defaultValue="Have a coupon?" />
      </h3>
      <form onSubmit={applyCoupon} className="flex items-center gap-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-gray-400">
            <Ticket className="h-4 w-4" />
          </div>
          <input
            type="text"
            className={`pl-8 pr-2 py-2 text-sm border rounded-lg w-full ${
              couponError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-1 focus:ring-orange-500`}
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="bg-orange-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-orange-700 disabled:opacity-70 min-w-[70px] transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Applying...' : 'Apply'}
        </button>
      </form>
      {couponError && (
        <p className="text-red-500 text-xs mt-1">{couponError}</p>
      )}
    </div>
  );
} 