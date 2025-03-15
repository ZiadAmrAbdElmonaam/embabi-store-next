'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { Minus, Plus, X, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TranslatedContent } from '@/components/ui/translated-content';
import { useTranslation } from '@/hooks/use-translation';

export default function CartItems() {
  const { items, removeItem, updateQuantity, updateColor } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const getColorName = (color: string) => {
    const colorMap: { [key: string]: string } = {
      '#000000': 'Black',
      '#FFFFFF': 'White',
      '#FF0000': 'Red',
      '#00FF00': 'Green',
      '#0000FF': 'Blue',
      // Add more color mappings as needed
    };
    return colorMap[color] || color;
  };

  const handleRemoveItem = async (id: string) => {
    setIsUpdating(true);
    await removeItem(id);
    setIsUpdating(false);
  };

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const item = items.find(i => i.id === id);
    if (!item) return;

    // If color is selected, check its available quantity
    if (item.availableColors && item.availableColors.length > 0) {
      if (!item.selectedColor) {
        toast.error(t('products.selectColor'));
        return;
      }

      const selectedColorOption = item.availableColors.find(c => c.color === item.selectedColor);
      if (!selectedColorOption) {
        toast.error('Selected color not available');
        return;
      }

      if (newQuantity > selectedColorOption.quantity) {
        toast.error(`Only ${selectedColorOption.quantity} items available in ${getColorName(item.selectedColor)}`);
        return;
      }
    }

    setIsUpdating(true);
    await updateQuantity(id, newQuantity);
    setIsUpdating(false);
  };

  const handleColorSelect = (id: string, color: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Find the selected color's available quantity
    const colorOption = item.availableColors.find(c => c.color === color);
    if (!colorOption) return;

    // If current quantity exceeds the new color's available quantity, adjust it
    if (item.quantity > colorOption.quantity) {
      updateQuantity(id, colorOption.quantity);
      toast.success(`Quantity adjusted to ${colorOption.quantity} (maximum available for ${getColorName(color)})`);
    }

    updateColor(id, color);
  };

  const handleCheckout = () => {
    // Check if all required colors are selected
    if (items.some(item => item.availableColors?.length > 0 && !item.selectedColor)) {
      toast.error(t('products.selectColor'));
      return;
    }

    // Check authentication status
    if (status === 'loading') {
      // Wait for authentication check to complete
      return;
    }

    if (!session) {
      // Save current URL to return after login
      const returnUrl = '/checkout';
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // User is authenticated, proceed to checkout
    toast.success('Proceeding to checkout...');
    router.push('/checkout');
  };

  const subtotal = items.reduce((total, item) => {
    // Use sale price if available, otherwise use regular price
    const itemPrice = item.salePrice !== null ? item.salePrice : item.price;
    return total + (itemPrice * item.quantity);
  }, 0);

  const totalBeforeSale = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const savings = totalBeforeSale - subtotal;
  const total = subtotal;

  if (!items?.length) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          <TranslatedContent translationKey="cart.emptyCart" />
        </h2>
        <p className="text-gray-600 mb-6">Looks like you have not added any items to your cart yet.</p>
        <Link
          href="/products"
          className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full hover:bg-orange-700 transition-colors"
        >
          <TranslatedContent translationKey="cart.startShopping" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={`${item.id}-${item.selectedColor || 'default'}`} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Product Image */}
                  <div className="w-full sm:w-28 h-28 bg-gray-50 rounded-xl overflow-hidden relative">
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <Link href={`/products/${item.id}`} className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {item.name}
                      </Link>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        disabled={isUpdating}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Price Display */}
                    <div className="mt-2">
                      {item.salePrice !== null && item.salePrice < item.price ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-600">EGP {item.salePrice.toLocaleString()}</span>
                          <span className="text-sm text-gray-500 line-through">EGP {item.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">EGP {item.price.toLocaleString()}</span>
                      )}
                    </div>
                    
                    {/* Color Selection - Show error if colors available but none selected */}
                    {item.availableColors && item.availableColors.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            <TranslatedContent translationKey="cart.color" />:
                          </span>
                          {!item.selectedColor && (
                            <span className="text-xs text-red-600 font-medium">* <TranslatedContent translationKey="products.selectColor" /></span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {item.availableColors.map((colorOption) => (
                            <div
                              key={colorOption.color}
                              onClick={() => handleColorSelect(item.id, colorOption.color)}
                              className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all ${
                                item.selectedColor === colorOption.color
                                  ? 'border-blue-600 ring-2 ring-blue-600 ring-opacity-50 scale-110'
                                  : 'border-gray-200 hover:border-blue-400'
                              }`}
                              style={{
                                backgroundColor: colorOption.color,
                                boxShadow: colorOption.color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined
                              }}
                              title={getColorName(colorOption.color)}
                            />
                          ))}
                        </div>
                        {item.selectedColor && (
                          <p className="text-xs text-gray-600 mt-1">
                            <TranslatedContent translationKey="products.selected" />: <span className="font-medium">{getColorName(item.selectedColor)}</span>
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating}
                          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={isUpdating}
                          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-gray-600 text-sm">
                        <TranslatedContent translationKey="cart.total" />: <span className="font-medium text-gray-900">
                          EGP {((item.salePrice !== null ? item.salePrice : item.price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            <TranslatedContent translationKey="checkout.orderSummary" />
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">
                <TranslatedContent translationKey="common.subtotal" />
              </span>
              <span className="font-medium">EGP {subtotal.toLocaleString()}</span>
            </div>
            
            {savings > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Savings</span>
                <span>- EGP {savings.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between pt-3 border-t border-gray-100">
              <span className="font-semibold">
                <TranslatedContent translationKey="common.total" />
              </span>
              <span className="font-semibold">EGP {total.toLocaleString()}</span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={isUpdating || items.length === 0}
            className="w-full bg-orange-600 text-white py-3 rounded-lg mt-4 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TranslatedContent translationKey="cart.proceedToCheckout" />
          </button>
        </div>
      </div>
    </div>
  );
} 