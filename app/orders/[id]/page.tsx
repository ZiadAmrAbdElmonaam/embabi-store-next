import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Package, Truck, CheckCircle, Clock, XCircle, Ticket } from "lucide-react";
import { authOptions } from "@/app/api/auth/auth-options";
import Image from "next/image";
import { format } from "date-fns";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import { getColorName } from "@/lib/colors";

const statusSteps = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
] as const;

// Function to get translations
function t(key: string) {
  // Get the language from cookies, default to English
  const cookieStore = cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  
  // Split the key by dots to navigate the translations object
  const keys = key.split('.');
  let translation: any = translations[lang];
  
  // Navigate through the keys
  for (const k of keys) {
    if (translation && translation[k]) {
      translation = translation[k];
    } else {
      // Return the key if translation not found
      return key;
    }
  }
  
  return translation;
}

export default async function OrderPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  // Get language from cookies for color name translation
  const cookieStore = cookies();
  const lang = cookieStore.get('lang')?.value || 'en';

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      coupon: true,
      statusHistory: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!order || (order.userId !== session.user.id && session.user.role !== 'ADMIN')) {
    notFound();
  }

  const currentStepIndex = statusSteps.indexOf(order.status);
  
  // Icons for each status step
  const statusIcons = {
    'PENDING': <Clock className="w-5 h-5" />,
    'PROCESSING': <Package className="w-5 h-5" />,
    'SHIPPED': <Truck className="w-5 h-5" />,
    'DELIVERED': <CheckCircle className="w-5 h-5" />,
    'CANCELLED': <XCircle className="w-5 h-5" />
  };

  // Calculate the subtotal (without discount)
  const subtotal = order.discountAmount ? Number(order.total) + Number(order.discountAmount) : Number(order.total);

  return (
    <div className="flex justify-center items-center py-12 px-4 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-4xl w-full">
        {/* Order Header */}
        <div className="p-8 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{t('order.orderDetails')}</h1>
              <p className="text-gray-500 mt-2">
                {t('order.orderId')}: {order.id}
              </p>
              <p className="text-gray-500 mt-1">
                {t('order.placedOn')}: {format(order.createdAt, 'PPP')}
              </p>
            </div>
            <div className="bg-gray-100 px-5 py-3 rounded-lg">
              <p className="text-sm font-medium">
                {t('order.status')}: <span className="text-orange-600 font-semibold">{t(`order.${order.status.toLowerCase()}`)}</span>
              </p>
            </div>
          </div>
          </div>

          {/* Progress Tracker */}
        {order.status !== 'CANCELLED' && (
          <div className="p-8 border-b">
            <h2 className="text-lg font-semibold mb-8 text-center">{t('order.trackYourOrder')}</h2>
            <div className="relative px-4">
              {/* Progress Bar */}
              <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-200 -translate-y-1/2 rounded-full"></div>
              <div 
                className="absolute top-1/2 left-0 h-2 bg-orange-500 -translate-y-1/2 transition-all duration-500 rounded-full"
                style={{ width: `${(currentStepIndex / (statusSteps.length - 2)) * 100}%` }}
              ></div>
              
              {/* Steps */}
              <div className="relative flex justify-between">
                {statusSteps.slice(0, -1).map((step, index) => {
                  const isActive = index <= currentStepIndex;
                  const isPast = index < currentStepIndex;
                  
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center z-10 shadow-sm transition-all ${
                          isActive 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        } ${isPast ? 'ring-2 ring-orange-200' : ''}`}
                      >
                        {statusIcons[step]}
                      </div>
                      <p className={`text-xs font-medium mt-3 text-center max-w-[80px] ${
                        isActive ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {t(`order.${step.toLowerCase()}`)}
                      </p>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="p-8 border-b">
          <h2 className="text-lg font-semibold mb-6">{t('order.items')}</h2>
          <div className="space-y-6">
                {order.items.map((item) => (
              <div key={item.id} className="flex gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="w-24 h-24 bg-white rounded-lg overflow-hidden relative flex-shrink-0 border border-gray-100">
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                    </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{item.product.name}</h3>
                  <div className="flex flex-wrap gap-x-6 mt-2 text-sm text-gray-500">
                    <p>{t('order.quantity')}: {item.quantity}</p>
                    {item.color && (
                      <p>{t('order.color')}: {getColorName(item.color, lang)}</p>
                    )}
                  </div>
                  <p className="mt-2 font-medium text-orange-600">
                    EGP {(Number(item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

        {/* Shipping Information */}
        <div className="p-8 border-b">
          <h2 className="text-lg font-semibold mb-6">{t('order.shippingInformation')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
            <div>
              <p className="text-gray-500 text-sm">{t('order.name')}</p>
              <p className="font-medium mt-1">{order.shippingName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">{t('order.phone')}</p>
              <p className="font-medium mt-1">{order.shippingPhone}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-500 text-sm">{t('order.address')}</p>
              <p className="font-medium mt-1">{order.shippingAddress}</p>
              <p className="font-medium">{order.shippingCity}{order.shippingNotes ? `, ${order.shippingNotes}` : ''}</p>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="p-8">
          <h2 className="text-lg font-semibold mb-6">{t('order.orderSummary')}</h2>
          <div className="space-y-3 bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between">
              <p className="text-gray-500">{t('order.subtotal')}</p>
              <p>EGP {subtotal.toLocaleString()}</p>
            </div>
            
            {/* Display coupon discount if applied */}
            {order.coupon && order.discountAmount && Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600">
                <div className="flex items-center">
                  <Ticket className="w-4 h-4 mr-2" />
                  <span>
                    {t('order.couponDiscount')} 
                    {order.coupon && (
                      <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded text-sm font-medium text-gray-700">
                        {order.coupon.code}
                      </span>
                    )}
                    {order.coupon && order.coupon.type === 'PERCENTAGE' && (
                      <span className="text-sm ml-1">({order.coupon.value}%)</span>
                    )}
                  </span>
                </div>
                <span>- EGP {Number(order.discountAmount).toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <p className="text-gray-500">{t('order.shipping')}</p>
              <p>EGP 0</p>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-200 mt-3">
              <p>{t('order.total')}</p>
              <p className="text-orange-600">EGP {Number(order.total).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 