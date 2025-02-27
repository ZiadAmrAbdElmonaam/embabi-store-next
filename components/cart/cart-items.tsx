'use client';

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, X, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[];
  quantity: number;
  stock: number;
  variants: {
    id: string;
    color: string;
    quantity: number;
    price: number;
  }[];
  selectedColor: string | null;
}

interface CartItemsProps {
  initialItems: CartItem[];
}

export default function CartItems({ initialItems }: CartItemsProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState<string>("");
  const router = useRouter();

  const getColorName = (color: string) => {
    const colors: { [key: string]: string } = {
      'white': 'White',
      'black': 'Black',
      'gray': 'Gray',
      'red': 'Red',
      'blue': 'Blue',
      'green': 'Green',
      'yellow': 'Yellow',
      'purple': 'Purple',
      'pink': 'Pink',
      'orange': 'Orange',
      'brown': 'Brown',
      'navy': 'Navy Blue',
      'gold': 'Gold',
      'silver': 'Silver'
    };
    return colors[color.toLowerCase()] || color;
  };

  const getColorValue = (color: string) => {
    const colors: { [key: string]: string } = {
      'white': '#FFFFFF',
      'black': '#000000',
      'gray': '#808080',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'orange': '#FFA500',
      'brown': '#A52A2A',
      'navy': '#000080',
      'gold': '#FFD700',
      'silver': '#C0C0C0'
    };
    return colors[color.toLowerCase()] || color;
  };

  const removeItem = async (id: string) => {
    try {
      setIsLoading(id);
      const response = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: id }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      setItems(items.filter(item => item.id !== id));
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setIsLoading("");
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    try {
      const item = items.find(item => item.id === id);
      if (!item) return;

      if (newQuantity > item.stock) {
        toast.error('Not enough stock available');
        return;
      }

      if (newQuantity < 1) {
        toast.error('Quantity must be at least 1');
        return;
      }

      setIsLoading(id);
      const response = await fetch('/api/cart/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: id, quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      setItems(items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setIsLoading("");
    }
  };

  const updateColor = (id: string, color: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, selectedColor: color } : item
    ));
  };

  const hasUnselectedColors = items.some(item => 
    item.variants.length > 0 && !item.selectedColor
  );

  const getEffectivePrice = (item: CartItem) => {
    return item.salePrice || item.price;
  };

  const subtotal = items.reduce((total, item) => total + (getEffectivePrice(item) * item.quantity), 0);
  const shipping = subtotal > 10000 ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl overflow-hidden">
          {items.map((item) => (
            <div 
              key={item.id}
              className="flex gap-6 p-6 border-b last:border-0"
            >
              {/* Product Image */}
              <div className="relative aspect-square w-24 rounded-lg overflow-hidden">
                <Image
                  src={item.images?.[0] || '/images/placeholder.png'}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <div className="text-sm mt-1">
                      {item.salePrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-orange-600 font-medium">
                            {formatPrice(item.salePrice)}
                          </span>
                          <span className="text-gray-500 line-through">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          Unit Price: {formatPrice(item.price)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={isLoading === item.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Color Selection */}
                {item.variants.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">Select Color:</span>
                      {!item.selectedColor && (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => updateColor(item.id, variant.color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            item.selectedColor === variant.color
                              ? 'border-orange-600 scale-110'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ 
                            backgroundColor: getColorValue(variant.color),
                            boxShadow: variant.color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined 
                          }}
                          title={getColorName(variant.color)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                  <div className="flex items-center gap-3 p-1 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || isLoading === item.id}
                      className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock || isLoading === item.id}
                      className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(getEffectivePrice(item) * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between text-base text-gray-900">
              <p>Subtotal</p>
              <p>{formatPrice(subtotal)}</p>
            </div>
            <div className="flex justify-between text-base text-gray-900">
              <p>Shipping</p>
              <p>{shipping === 0 ? 'Free' : formatPrice(shipping)}</p>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between text-base font-semibold text-gray-900">
              <p>Total</p>
              <p>{formatPrice(total)}</p>
            </div>
          </div>

          <button
            className="w-full mt-6 bg-orange-600 text-white py-3 px-4 rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={items.length === 0 || hasUnselectedColors}
            onClick={() => {
              if (hasUnselectedColors) {
                toast.error('Please select colors for all items');
                return;
              }
              router.push('/checkout');
            }}
          >
            {hasUnselectedColors ? 'Select Colors to Continue' : 'Proceed to Checkout'}
          </button>

          {hasUnselectedColors && (
            <p className="mt-4 text-sm text-orange-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Please select colors for all items
            </p>
          )}

          {subtotal < 10000 && (
            <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
              Add {formatPrice(10000 - subtotal)} more to get free shipping
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 