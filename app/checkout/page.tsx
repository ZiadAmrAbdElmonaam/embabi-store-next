'use client';

import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { BanknoteIcon, WalletIcon, UploadCloud } from "lucide-react";

interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
  paymentScreenshot?: File;
}

export default function CheckoutPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  const { items, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const router = useRouter();

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = 50; // Example shipping cost
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (paymentMethod === 'wallet' && !paymentScreenshot) {
        toast.error('Please upload payment screenshot');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('items', JSON.stringify(items));
      formData.append('paymentMethod', paymentMethod);
      formData.append('shippingInfo', JSON.stringify(shippingInfo));
      formData.append('total', total.toString());
      
      if (paymentScreenshot) {
        formData.append('paymentScreenshot', paymentScreenshot);
      }

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error();

      const { id } = await response.json();
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/orders/${id}`);
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setPaymentScreenshot(file);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shipping Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={shippingInfo.name}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={shippingInfo.phone}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, phone: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  required
                  value={shippingInfo.address}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, address: e.target.value })
                  }
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={shippingInfo.city}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, city: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  value={shippingInfo.notes}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, notes: e.target.value })
                  }
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Order Summary and Payment */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {item.quantity}x {item.name}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Shipping</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between mt-2 font-bold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Payment Method</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => {
                        setPaymentMethod('cash');
                        setPaymentScreenshot(null);
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <BanknoteIcon className="h-5 w-5" />
                    <span>Cash on Delivery</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod('wallet')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <WalletIcon className="h-5 w-5" />
                    <span>Digital Wallet</span>
                  </label>

                  {paymentMethod === 'wallet' && (
                    <div className="mt-4 space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Payment Instructions:</h4>
                        <p>Please send {formatPrice(total)} to one of these wallets:</p>
                        <ul className="list-disc list-inside mt-2">
                          <li>Vodafone Cash: 0123456789</li>
                          <li>Etisalat Cash: 0123456789</li>
                          <li>Orange Cash: 0123456789</li>
                        </ul>
                      </div>

                      <div className="border-2 border-dashed rounded-lg p-4">
                        <label className="flex flex-col items-center cursor-pointer">
                          <UploadCloud className="h-8 w-8 text-gray-400" />
                          <span className="mt-2 text-sm text-gray-500">
                            {paymentScreenshot ? paymentScreenshot.name : 'Upload payment screenshot'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !shippingInfo.name || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city}
                className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 