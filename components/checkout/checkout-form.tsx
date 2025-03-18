'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { CreditCard, Wallet, BanknoteIcon, QrCode, Ticket, AlertTriangle } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useTranslation } from "@/hooks/use-translation";
import { TranslatedContent } from "@/components/ui/translated-content";

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
  onOrderComplete: () => void;
}

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

// Add maintenance mode check function
const useMaintenance = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/settings/maintenance');
        const data = await response.json();
        setIsMaintenanceMode(data.maintenanceMode);
        setMaintenanceMessage(data.maintenanceMessage);
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      }
    };

    checkMaintenanceMode();
  }, []);

  return { isMaintenanceMode, maintenanceMessage };
};

export default function CheckoutForm({ user, items, subtotal, shipping, onOrderComplete }: CheckoutFormProps) {
  const router = useRouter();
  const { hasUnselectedColors, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email,
    phone: "",
    address: "",
    state: "",
    city: ""
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { isMaintenanceMode, maintenanceMessage } = useMaintenance();

  // Fetch any applied coupon
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const response = await fetch('/api/coupons/current');
        if (response.ok) {
          const data = await response.json();
          if (data.coupon) {
            setAppliedCoupon(data.coupon);
          }
        }
      } catch (error) {
        console.error('Failed to fetch applied coupon:', error);
      }
    };

    fetchCoupon();
  }, []);

  // Calculate discount amount when coupon is applied
  useEffect(() => {
    if (appliedCoupon) {
      if (appliedCoupon.type === 'PERCENTAGE') {
        const discount = (subtotal * appliedCoupon.value) / 100;
        setDiscountAmount(discount);
      } else if (appliedCoupon.type === 'FIXED') {
        setDiscountAmount(Math.min(appliedCoupon.value, subtotal));
      }
    } else {
      setDiscountAmount(0);
    }
  }, [appliedCoupon, subtotal]);

  // Recalculate total with discount
  const totalWithDiscount = subtotal + shipping - discountAmount;

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
    
    // Check if maintenance mode is enabled
    if (isMaintenanceMode) {
      toast.error(maintenanceMessage || 'Site is currently under maintenance. Please try again later.');
      return;
    }

    if (!validateEgyptianPhone(formData.phone)) {
      toast.error(t('checkout.enterValidPhone'));
      return;
    }

    if (!formData.state) {
      toast.error(t('checkout.selectState'));
      return;
    }

    // Check if any items are missing color selection
    if (checkItemsWithMissingColors() || hasUnselectedColors()) {
      toast.error(t('checkout.selectColorForItems'));
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
      formDataToSend.append('total', totalWithDiscount.toString());
      
      // Add discount amount if there's a coupon applied
      if (discountAmount > 0 && appliedCoupon) {
        formDataToSend.append('discountAmount', discountAmount.toString());
        // Also add the coupon info
        formDataToSend.append('couponInfo', JSON.stringify({
          id: appliedCoupon.id,
          code: appliedCoupon.code,
          type: appliedCoupon.type,
          value: appliedCoupon.value
        }));
      }

      console.log("Total:", totalWithDiscount, "Payment method:", selectedPaymentMethod);
      if (discountAmount > 0 && appliedCoupon) {
        console.log("Discount amount:", discountAmount, "Coupon:", appliedCoupon.code);
      }

      console.log("Sending order request...");
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        body: formDataToSend
      });

      const responseData = await response.json();
      console.log("API Response:", response.status, responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || t('checkout.failedToPlaceOrder');
        console.error("API Error:", errorMessage);
        throw new Error(errorMessage);
      }

      const { id } = responseData;
      console.log("Order created successfully with ID:", id);
      
      // Set the order completed flag to prevent redirect to cart
      onOrderComplete();
      
      // Clear the cart after successful order
      clearCart();
      
      toast.success(t('checkout.orderPlaced'));
      console.log("Redirecting to order page:", `/orders/${id}`);
      router.push(`/orders/${id}`);
    } catch (error: unknown) {
      console.error('Order creation error:', error);
      toast.error(error instanceof Error ? error.message : t('checkout.failedToPlaceOrder'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Maintenance Mode Banner */}
      {isMaintenanceMode && (
        <div className="lg:col-span-3 bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">Alert:</span> {maintenanceMessage || 'Site is currently under maintenance. Please try again later.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <form id="checkout-form" onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
        {/* Contact Information */}
        <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">
            <TranslatedContent translationKey="checkout.contactInformation" />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TranslatedContent translationKey="checkout.fullName" />
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
                <TranslatedContent translationKey="checkout.email" />
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
                <TranslatedContent translationKey="checkout.phone" />
              </label>
              <input
                type="tel"
                placeholder="01xxxxxxxxx"
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
          <h2 className="text-lg font-semibold">
            <TranslatedContent translationKey="checkout.shippingInfo" />
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TranslatedContent translationKey="checkout.address" />
              </label>
              <input
                id="address"
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('checkout.addressPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  <TranslatedContent translationKey="checkout.state" />
                </label>
                <select
                  id="state"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  <option value="">{t('checkout.selectState')}</option>
                  {EGYPTIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  <TranslatedContent translationKey="checkout.city" />
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t('checkout.cityPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">
            <TranslatedContent translationKey="checkout.paymentMethod" />
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPaymentMethod === 'cash'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => setSelectedPaymentMethod('cash')}
            >
              <div className="flex items-center gap-3">
                <BanknoteIcon className="h-6 w-6 text-orange-600" />
                <span className="font-medium">
                  <TranslatedContent translationKey="checkout.cashOnDelivery" />
                </span>
              </div>
            </div>
            
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPaymentMethod === 'vodafone'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => setSelectedPaymentMethod('vodafone')}
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-6 w-6 text-orange-600" />
                <span className="font-medium">
                  <TranslatedContent translationKey="checkout.vodafoneCash" />
                </span>
              </div>
            </div>
            
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPaymentMethod === 'instapay'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => setSelectedPaymentMethod('instapay')}
            >
              <div className="flex items-center gap-3">
                <QrCode className="h-6 w-6 text-orange-600" />
                <span className="font-medium">
                  <TranslatedContent translationKey="checkout.instapay" />
                </span>
              </div>
            </div>
            
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPaymentMethod === 'visa'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => setSelectedPaymentMethod('visa')}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-orange-600" />
                <span className="font-medium">
                  <TranslatedContent translationKey="checkout.creditCard" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl p-5 shadow-sm sticky top-4">
          <h2 className="text-lg font-semibold mb-4">
            <TranslatedContent translationKey="checkout.orderSummary" />
          </h2>
          
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 border-b border-gray-100">
                  <div className="w-16 h-16 bg-gray-50 rounded-md overflow-hidden relative flex-shrink-0">
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-600">
                        <TranslatedContent translationKey="cart.quantity" />: {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        EGP {((item.salePrice || item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                    {item.selectedColor && (
                      <p className="text-xs text-gray-500 mt-1">
                        <TranslatedContent translationKey="cart.color" />: {item.selectedColor}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  <TranslatedContent translationKey="cart.subtotal" />
                </span>
                <span>EGP {subtotal.toLocaleString()}</span>
              </div>
              
              {/* Display coupon discount if applied */}
              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600">
                  <div className="flex items-center">
                    <Ticket className="h-4 w-4 mr-1" />
                    <span>{appliedCoupon.code}</span>
                  </div>
                  <span>- EGP {discountAmount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">
                  <TranslatedContent translationKey="cart.shipping" />
                </span>
                <span>EGP {shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-100">
                <span>
                  <TranslatedContent translationKey="cart.total" />
                </span>
                <span>EGP {totalWithDiscount.toLocaleString()}</span> {/* Subtotal + Shipping - Discount */}
              </div>
            </div>
            
            <button
              type="submit"
              form="checkout-form"
              disabled={isLoading || isMaintenanceMode}
              className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <TranslatedContent translationKey="checkout.placeOrder" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 