'use client';

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import CartItems from "@/components/cart/cart-items";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const { syncWithServer, isInitialized, items } = useCart();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initCart = async () => {
      if (!isInitialized) {
        console.log("Cart not initialized, syncing with server...");
        await syncWithServer();
      } else {
        console.log("Cart already initialized:", items);
      }
      setIsLoading(false);
    };

    initCart();
  }, [syncWithServer, isInitialized, items]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse">
          <ShoppingBag className="w-12 h-12 text-gray-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
          </div>
          <Link 
            href="/products" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        <CartItems />
      </div>
    </div>
  );
} 