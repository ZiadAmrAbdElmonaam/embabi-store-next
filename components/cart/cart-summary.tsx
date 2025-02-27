'use client';

import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { ArrowRight, Truck } from "lucide-react";
import Link from "next/link";

export function CartSummary() {
  const { items } = useCart();
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal >= 10000 ? 0 : 50; // Free shipping over $100
  const total = subtotal + shipping;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Shipping</span>
            <span className="font-medium text-gray-900">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
          </div>
          
          {shipping > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <Truck className="h-4 w-4" />
              <p>Free shipping on orders over {formatPrice(10000)}</p>
            </div>
          )}

          <div className="h-px bg-gray-100" />
          
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-2xl font-bold text-gray-900">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <Link
          href="/checkout"
          className={`
            flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl
            font-medium text-base transition-all duration-200
            ${items.length === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98]'
            }
          `}
          onClick={(e) => {
            if (items.length === 0) e.preventDefault();
          }}
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="h-5 w-5" />
        </Link>

        {items.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-3">
            Add items to your cart to proceed
          </p>
        )}
      </div>
    </div>
  );
} 