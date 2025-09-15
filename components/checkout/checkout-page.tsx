'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import CheckoutForm from './checkout-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { TranslatedContent } from '@/components/ui/translated-content';

interface CheckoutPageProps {
  user: {
    name: string | null;
    email: string;
    role: string;
  };
}

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

export default function CheckoutPage({ user }: CheckoutPageProps) {
  const { items, isInitialized, syncWithServer, loadCouponFromCookies, appliedCoupon } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // Determine which items to use - only client items from cart storage
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(300);
  const [total, setTotal] = useState(0);
  const [appliedCouponState, setAppliedCouponState] = useState<Coupon | null>(null);

  useEffect(() => {
    // Initialize cart from localStorage if needed
    const initCart = async () => {
      try {
        if (!isInitialized) {
          console.log("Cart not initialized, syncing with server...");
          await syncWithServer();
          
          // If there's a valid coupon already in the cart state, use it
          if (appliedCoupon) {
            setAppliedCouponState(appliedCoupon);
          }
          // Otherwise, check if there's a coupon in cookies that we need for checkout
          else {
            const coupon = await loadCouponFromCookies();
            if (coupon) {
              setAppliedCouponState(coupon);
            }
          }
        } else {
          console.log("Cart already initialized");
          
          // If there's a valid coupon already in the cart state, use it
          if (appliedCoupon) {
            setAppliedCouponState(appliedCoupon);
          }
          // Otherwise, load it from cookies only for checkout purposes
          else {
            const coupon = await loadCouponFromCookies();
            if (coupon) {
              setAppliedCouponState(coupon);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing cart:", error);
      }
    };
    
    initCart();
  }, [isInitialized, syncWithServer, loadCouponFromCookies, appliedCoupon]);

  // Update appliedCouponState when the cart's appliedCoupon changes
  useEffect(() => {
    if (appliedCoupon) {
      setAppliedCouponState(appliedCoupon);
    }
  }, [appliedCoupon]);

  useEffect(() => {
    // Wait for cart to be initialized from localStorage
    if (!isInitialized) {
      return;
    }
    
    // If we've already completed an order, don't do anything
    if (isOrderCompleted) {
      return;
    }
    
    // Use client items from localStorage
    if (items.length > 0) {
      
      // Calculate totals
      const calculatedSubtotal = items.reduce(
        (total, item) => {
          // Use sale price if available, otherwise use regular price
          const itemPrice = item.salePrice !== null ? item.salePrice : item.price;
          return total + (itemPrice * item.quantity);
        },
        0
      );
      const calculatedShipping = 300; // Fixed shipping cost
      
      // Calculate discount if a coupon is applied
      let discountAmount = 0;
      if (appliedCouponState) {
        if (appliedCouponState.type === 'PERCENTAGE') {
          discountAmount = (calculatedSubtotal * appliedCouponState.value) / 100;
        } else if (appliedCouponState.type === 'FIXED') {
          discountAmount = Math.min(appliedCouponState.value, calculatedSubtotal);
        }
      }
      
      // Calculate total: subtotal + shipping - discount
      const calculatedTotal = calculatedSubtotal + calculatedShipping - discountAmount;
      
      setCheckoutItems(items);
      setSubtotal(calculatedSubtotal);
      setShipping(calculatedShipping);
      setTotal(calculatedTotal);
      setIsLoading(false);
    } else {
      // No items, redirect to cart
      router.push('/cart');
      return;
    }
  }, [items, router, isInitialized, isOrderCompleted, appliedCouponState]);

  const handleOrderComplete = () => {
    setIsOrderCompleted(true);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/cart"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">
                <TranslatedContent translationKey="common.checkout" />
              </h1>
            </div>
            <Link
              href="/products"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              <TranslatedContent translationKey="common.continueShopping" />
            </Link>
          </div>

          <CheckoutForm
            user={user}
            items={checkoutItems}
            subtotal={subtotal}
            shipping={shipping}
            onOrderComplete={handleOrderComplete}
          />
        </div>
      </div>
    </div>
  );
}
