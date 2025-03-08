'use client';

import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export function CartSummary() {
  const { items } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const subtotal = items.reduce((total, item) => {
    // Use sale price if available, otherwise use regular price
    const itemPrice = item.salePrice !== null ? item.salePrice : item.price;
    return total + (itemPrice * item.quantity);
  }, 0);

  const shipping = 50; // Fixed shipping cost
  const total = subtotal + shipping;

  const handleCheckout = (e) => {
    if (items.length === 0) {
      e.preventDefault();
      return;
    }

    // Check if all required colors are selected
    if (items.some(item => item.availableColors?.length > 0 && !item.selectedColor)) {
      e.preventDefault();
      toast.error('Please select colors for all items');
      return;
    }

    // Check authentication status
    if (status === 'loading') {
      e.preventDefault();
      return;
    }

    if (!session) {
      e.preventDefault();
      const returnUrl = '/checkout';
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Will proceed to checkout (link navigation)
    toast.success('Proceeding to checkout...');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-medium mb-4">Order Summary</h2>

        <div className="space-y-3">
          <div className="flex justify-between text-base">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between text-base">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {formatPrice(shipping)}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <button
          onClick={handleCheckout}
          className={`
            flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl
            font-medium text-base transition-all duration-200
            ${items.length === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98]'
            }
          `}
          disabled={items.length === 0}
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="h-5 w-5" />
        </button>

        {items.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-3">
            Add items to your cart to proceed
          </p>
        )}
      </div>
    </div>
  );
}
