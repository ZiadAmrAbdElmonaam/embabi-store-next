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

export default function CheckoutPage({ user }: CheckoutPageProps) {
  const { items, isInitialized, syncWithServer } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // Determine which items to use - only client items from cart storage
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Initialize cart from localStorage if needed
    const initCart = async () => {
      if (!isInitialized) {
        console.log("Cart not initialized, syncing with server...");
        await syncWithServer();
      } else {
        console.log("Cart already initialized:", items);
      }
    };
    
    initCart();
  }, [isInitialized, syncWithServer, items]);

  useEffect(() => {
    // Wait for cart to be initialized from localStorage
    if (!isInitialized) {
      console.log("Waiting for cart to initialize...");
      return;
    }
    
    // If we've already completed an order, don't do anything
    if (isOrderCompleted) {
      console.log("Order completed, skipping cart check");
      return;
    }
    
    // Use client items from localStorage
    if (items.length > 0) {
      console.log("Using client items from localStorage:", items);
      
      // Calculate totals
      const calculatedSubtotal = items.reduce(
        (total, item) => {
          // Use sale price if available, otherwise use regular price
          const itemPrice = item.salePrice !== null ? item.salePrice : item.price;
          return total + (itemPrice * item.quantity);
        },
        0
      );
      const calculatedShipping = 50; // Fixed shipping cost
      
      setCheckoutItems(items);
      setSubtotal(calculatedSubtotal);
      setShipping(calculatedShipping);
      setTotal(calculatedSubtotal + calculatedShipping);
      setIsLoading(false);
      console.log("Checkout items set:", items);
    } else {
      // No items, redirect to cart
      console.log("No items found, redirecting to cart");
      router.push('/cart');
      return;
    }
  }, [items, router, isInitialized, isOrderCompleted]);

  const handleOrderComplete = () => {
    console.log("Order completed, setting flag to prevent cart redirect");
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
            total={total}
            onOrderComplete={handleOrderComplete}
          />
        </div>
      </div>
    </div>
  );
}
