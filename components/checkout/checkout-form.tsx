'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { CreditCard, Wallet, BanknoteIcon, QrCode, Ticket, AlertTriangle } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useTranslation } from "@/hooks/use-translation";
import { TranslatedContent } from "@/components/ui/translated-content";
import { getColorName } from "@/lib/colors";

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

type PaymentMethod = 'cash' | 'online';

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
    storageId: string | null;
    storageSize: string | null;
    uniqueId: string;
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
  const { t, lang } = useTranslation();
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email,
    phone: "",
    address: "",
    state: "",
    city: "",
    notes: ""
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { isMaintenanceMode, maintenanceMessage } = useMaintenance();

  // Disable body scroll and interactions while loading
  useEffect(() => {
    if (isLoading) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isLoading]);

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
  // Paymob online payment fee (3.2%) applies only when paying online
  const PAYMOB_FEE_RATE = 0.032;
  const paymobFee = selectedPaymentMethod === 'online' 
    ? Math.round(totalWithDiscount * PAYMOB_FEE_RATE) 
    : 0;
  const onlineTotalWithFee = totalWithDiscount + paymobFee;

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
      const formDataToSend = new FormData();
      
      // Add items data
      const itemsData = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.salePrice || item.price,
        selectedColor: item.selectedColor,
        storageId: item.storageId
      }));
      formDataToSend.append('items', JSON.stringify(itemsData));

      // Add shipping info
      const shippingData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: `${formData.city}, ${formData.state}`,
        notes: formData.notes || null
      };
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

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        body: formDataToSend
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error || t('checkout.failedToPlaceOrder');
        console.error("API Error:", errorMessage);
        throw new Error(errorMessage);
      }

      const { id } = responseData;
      
      // Set the order completed flag to prevent redirect to cart
      onOrderComplete();
      
      // Store order ID in localStorage for potential failed payment redirects
      localStorage.setItem("lastOrderId", id);
      
      // Clear the cart after successful order
      clearCart();
      
      // If user selected online payment, initiate Paymob intention
      if (selectedPaymentMethod === 'online') {
        try {
          const paymobRes = await fetch('/api/paymob/intentions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderId: id,
              // Include Paymob service fee in intention amount (not part of order total)
              amount: onlineTotalWithFee,
              currency: 'EGP',
              billingData: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
              },
              payment_methods: [5272644] // Backend will convert to integration ID
            })
          });
          const paymobData = await paymobRes.json();
          console.log('Paymob data:', paymobData);
          const redirectUrl =
            paymobData.unified_checkout_url ||
            paymobData.payment_url ||
            paymobData.iframe_url ||
            null;
          if (!paymobRes.ok || !redirectUrl) {
            throw new Error('Failed to initiate online payment');
          }
          toast.success(t('checkout.orderPlaced'));
          window.location.href = redirectUrl;
          return;
        } catch (e) {
          console.error('Paymob initiation failed', e);
          toast.error(lang === 'ar' ? 'فشل في بدء الدفع الإلكتروني. يمكنك الدفع عند الاستلام.' : 'Failed to start online payment. You can pay on delivery.');
          // Don't redirect to order page if payment initiation fails
          return;
        }
      }

      toast.success(t('checkout.orderPlaced'));
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
      {isLoading && (
        <div
          role="alert"
          aria-busy="true"
          className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="bg-white rounded-xl px-6 py-5 shadow-md flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-gray-800">
              {lang === 'ar' ? 'جارٍ إتمام الطلب والدفع...' : 'Placing your order and starting payment...'}
            </span>
          </div>
        </div>
      )}
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder={t('checkout.fullNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TranslatedContent translationKey="checkout.email" />
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder={t('checkout.emailPlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TranslatedContent translationKey="checkout.phone" />
              </label>
              <input
                type="tel"
                placeholder={t('checkout.phonePlaceholder')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
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
          
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer ${selectedPaymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}
              onClick={() => setSelectedPaymentMethod('cash')}
            >
              <div className="flex items-center gap-3">
                <BanknoteIcon className="h-6 w-6 text-orange-600" />
                <span className="font-medium text-orange-800">
                  <TranslatedContent translationKey="checkout.cashOnDelivery" />
                </span>
                <div className="ml-auto">
                  <div className={`w-4 h-4 rounded-full ${selectedPaymentMethod === 'cash' ? 'bg-orange-600' : 'bg-gray-300'} flex items-center justify-center`}>
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`border-2 rounded-lg p-4 cursor-pointer ${selectedPaymentMethod === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
              onClick={() => setSelectedPaymentMethod('online')}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-blue-700" />
                <span className="font-medium text-blue-800">
                  {lang === 'ar' ? 'الدفع أونلاين' : 'Pay Online'}
                </span>
                <div className="ml-auto">
                  <div className={`w-4 h-4 rounded-full ${selectedPaymentMethod === 'online' ? 'bg-blue-600' : 'bg-gray-300'} flex items-center justify-center`}>
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Options Hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-center mb-3">
              <p className="text-sm font-medium text-blue-800">
                {lang === 'ar' ? 'يمكنك الدفع بعد الطلب بالطرق التالية:' : 'You can pay after ordering using:'}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <Wallet className="h-5 w-5 text-red-600" />
                  <span className="text-xs font-medium text-gray-700">
                    <TranslatedContent translationKey="checkout.vodafoneCash" />
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">
                    <TranslatedContent translationKey="checkout.instapay" />
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <CreditCard className="h-5 w-5 text-blue-700" />
                  <span className="text-xs font-medium text-gray-700">
                    <TranslatedContent translationKey="checkout.creditCard" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visa Installment Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-sm font-semibold text-purple-800">
                  {lang === 'ar' ? 'التقسيط متاح باستخدام فيزا' : 'Installment is available using Visa'}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {lang === 'ar' 
                    ? 'يمكنك تقسيط مشترياتك على عدة أشهر باستخدام بطاقة فيزا' 
                    : 'You can pay for your purchases in installments over several months using Visa'
                  }
                </p>
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
                <div key={item.uniqueId} className="flex gap-3 py-3 border-b border-gray-100">
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
                    {/* Storage Display */}
                    {item.storageSize && (
                      <p className="text-xs text-gray-500 mt-1">
                        <TranslatedContent translationKey="productDetail.storage" />: {item.storageSize}
                      </p>
                    )}
                    {item.selectedColor && (
                      <p className="text-xs text-gray-500 mt-1">
                        <TranslatedContent translationKey="cart.color" />: {getColorName(item.selectedColor, lang)}
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
              {selectedPaymentMethod === 'online' && (
                <>
                  <div className="flex justify-between text-blue-700">
                    <span>
                      {lang === 'ar' ? 'ضريبة (3.2%)' : 'VAT (3.2%)'}
                    </span>
                    <span>EGP {paymobFee.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 -mt-1">
                    {lang === 'ar' ? 'تطبق فقط عند الدفع أونلاين' : 'Applies only to online payments'}
                  </p>
                </>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-100">
                <span>
                  {selectedPaymentMethod === 'online' 
                    ? (lang === 'ar' ? 'الإجمالي أونلاين' : 'Online total')
                    : <TranslatedContent translationKey="cart.total" />}
                </span>
                <span>EGP {(selectedPaymentMethod === 'online' ? onlineTotalWithFee : totalWithDiscount).toLocaleString()}</span>
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