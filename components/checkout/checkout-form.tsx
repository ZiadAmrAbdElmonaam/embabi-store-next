'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { CreditCard, Wallet, BanknoteIcon, QrCode } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

// Egyptian governorates
const EGYPTIAN_STATES = [
  "Alexandria",
  "Aswan",
  "Asyut",
  "Beheira",
  "Beni Suef",
  "Cairo",
  "Dakahlia",
  "Damietta",
  "Faiyum",
  "Gharbia",
  "Giza",
  "Ismailia",
  "Kafr El Sheikh",
  "Luxor",
  "Matrouh",
  "Minya",
  "Monufia",
  "New Valley",
  "North Sinai",
  "Port Said",
  "Qalyubia",
  "Qena",
  "Red Sea",
  "Sharqia",
  "Sohag",
  "South Sinai",
  "Suez"
].sort();

type PaymentMethod = 'cash' | 'vodafone' | 'instapay' | 'visa';

interface CheckoutFormProps {
  user: {
    name: string | null;
    email: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    salePrice: number | null;
    images: string[];
    quantity: number;
    selectedColor: string | null;
    availableColors?: { color: string; quantity: number }[];
  }[];
  subtotal: number;
  shipping: number;
  total: number;
  onOrderComplete: () => void;
}

export default function CheckoutForm({ user, items, subtotal, shipping, total, onOrderComplete }: CheckoutFormProps) {
  const router = useRouter();
  const { hasUnselectedColors, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email,
    phone: "",
    address: "",
    state: "",
    city: ""
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');

  const validateEgyptianPhone = (phone: string) => {
    // Egyptian phone number format: +20 1XX XXX XXXX
    const phoneRegex = /^(\+20|0)?1[0125][0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  // Check if any items require color selection but don't have one
  const checkItemsWithMissingColors = () => {
    return items.some(item => 
      item.availableColors && 
      item.availableColors.length > 0 && 
      !item.selectedColor
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEgyptianPhone(formData.phone)) {
      toast.error("Please enter a valid Egyptian phone number");
      return;
    }

    if (!formData.state) {
      toast.error("Please select a state");
      return;
    }

    // Check if any items are missing color selection
    if (checkItemsWithMissingColors() || hasUnselectedColors()) {
      toast.error("Please select a color for all items in your cart");
      router.push('/cart');
      return;
    }

    setIsLoading(true);

    try {
      console.log("Preparing order data...");
      const formDataToSend = new FormData();
      
      // Add items data
      const itemsData = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.salePrice || item.price,
        selectedColor: item.selectedColor
      }));
      console.log("Items data:", itemsData);
      formDataToSend.append('items', JSON.stringify(itemsData));

      // Add shipping info
      const shippingData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        notes: `State: ${formData.state}`
      };
      console.log("Shipping data:", shippingData);
      formDataToSend.append('shippingInfo', JSON.stringify(shippingData));

      // Add payment method and total
      formDataToSend.append('paymentMethod', selectedPaymentMethod);
      formDataToSend.append('total', total.toString());
      console.log("Total:", total, "Payment method:", selectedPaymentMethod);

      console.log("Sending order request...");
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        body: formDataToSend
      });

      const responseData = await response.json();
      console.log("API Response:", response.status, responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to create order';
        console.error("API Error:", errorMessage);
        throw new Error(errorMessage);
      }

      const { id } = responseData;
      console.log("Order created successfully with ID:", id);
      
      // Set the order completed flag to prevent redirect to cart
      onOrderComplete();
      
      // Clear the cart after successful order
      clearCart();
      
      toast.success('Order placed successfully!');
      console.log("Redirecting to order page:", `/orders/${id}`);
      router.push(`/orders/${id}`);
    } catch (error: unknown) {
      console.error('Order creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form id="checkout-form" onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
        {/* Contact Information */}
        <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g., 01012345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">Shipping Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                rows={2}
                placeholder="Enter your full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value="">Select a state</option>
                  {EGYPTIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">Available Payment Methods</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Cash on Delivery */}
            <div 
              onClick={() => setSelectedPaymentMethod('cash')}
              className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer ${
                selectedPaymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-white transition-colors">
                <BanknoteIcon className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
              </div>
              <div>
                <p className="font-medium text-sm">Cash on Delivery</p>
                <p className="text-xs text-gray-500">Pay when you receive</p>
              </div>
            </div>

            {/* Vodafone Cash */}
            <div 
              onClick={() => setSelectedPaymentMethod('vodafone')}
              className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer ${
                selectedPaymentMethod === 'vodafone' ? 'border-orange-500 bg-orange-50' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-white transition-colors">
                <Wallet className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
              </div>
              <div>
                <p className="font-medium text-sm">Vodafone Cash</p>
                <p className="text-xs text-gray-500">Pay via Vodafone Cash</p>
              </div>
            </div>

            {/* Instapay */}
            <div 
              onClick={() => setSelectedPaymentMethod('instapay')}
              className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer ${
                selectedPaymentMethod === 'instapay' ? 'border-orange-500 bg-orange-50' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-white transition-colors">
                <QrCode className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
              </div>
              <div>
                <p className="font-medium text-sm">InstaPay</p>
                <p className="text-xs text-gray-500">Pay using InstaPay</p>
              </div>
            </div>

            {/* Credit/Debit Card */}
            <div 
              onClick={() => setSelectedPaymentMethod('visa')}
              className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer ${
                selectedPaymentMethod === 'visa' ? 'border-orange-500 bg-orange-50' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-white transition-colors">
                <CreditCard className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
              </div>
              <div>
                <p className="font-medium text-sm">Credit/Debit Card</p>
                <p className="text-xs text-gray-500">Pay with Visa/Mastercard</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl p-5 space-y-5 shadow-sm sticky top-4">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          
          <div className="space-y-4 max-h-[50vh] overflow-auto pr-2">
            {items.map((item) => (
              <div key={`${item.id}-${item.selectedColor || 'default'}`} className="flex gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.images[0] || '/images/placeholder.png'}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    {item.selectedColor && (
                      <p className="text-xs text-gray-500 ml-2">
                        Color: <span className="font-medium">{item.selectedColor}</span>
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    EGP {((item.salePrice || item.price) * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-3 border-t">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>EGP {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `EGP ${shipping.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t">
              <span>Total</span>
              <span>EGP {total.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-2.5 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? 'Processing...' : 'Place Order'}
          </button>

          {subtotal < 10000 && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Free shipping on orders over EGP 10,000
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 