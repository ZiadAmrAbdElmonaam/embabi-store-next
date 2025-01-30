'use client';

import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, X } from "lucide-react";

export function CartItems() {
  const { items, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm"
        >
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={item.images[0]}
              alt={item.name}
              fill
              className="object-cover rounded-md"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {item.name}
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {formatPrice(item.price)}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => removeItem(item.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-lg font-semibold text-gray-900">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 