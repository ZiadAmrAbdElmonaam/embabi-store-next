'use client';

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import CartItems from "@/components/cart/cart-items";
import { useCart } from "@/hooks/use-cart";
import { TranslatedContent } from "@/components/ui/translated-content";

export default function CartPage() {
  const { syncWithServer, isInitialized, items, appliedCoupon, loadCouponFromCookies } = useCart();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initCart = async () => {
      try {
        if (!isInitialized) {
          await syncWithServer();
        }
        
        // Only check for a coupon if there are items in the cart and no coupon is applied
        const cartItems = useCart.getState().items;
        const currentCoupon = useCart.getState().appliedCoupon;
        if (cartItems.length > 0 && !currentCoupon) {
          await loadCouponFromCookies();
        }
      } catch (error) {
        console.error("Error initializing cart:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initCart();
  }, [syncWithServer, isInitialized]); // Removed appliedCoupon and loadCouponFromCookies from dependencies

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse">
          <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              <TranslatedContent translationKey="cart.shoppingCart" />
            </h1>
          </div>
          <Link 
            href="/products" 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-200 hover:border-orange-500 text-gray-700 hover:text-orange-600 dark:text-gray-300 dark:hover:text-white dark:border-gray-700 dark:hover:border-orange-500 transition-all"
          >
            <TranslatedContent translationKey="cart.continueShopping" />
          </Link>
        </div>

        <CartItems />
      </div>
    </div>
  );
} 