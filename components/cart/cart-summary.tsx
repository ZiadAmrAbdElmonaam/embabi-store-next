'use client';

import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export function CartSummary() {
  const { items } = useCart();
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = 50; // Fixed shipping cost
  const total = subtotal + shipping;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <h2 className="text-lg font-semibold">Order Summary</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>{formatPrice(shipping)}</span>
        </div>
        <div className="h-px bg-gray-200 my-2" />
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className={`w-full block text-center py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors
          ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={(e) => {
          if (items.length === 0) e.preventDefault();
        }}
      >
        Proceed to Checkout
      </Link>
    </div>
  );
} 