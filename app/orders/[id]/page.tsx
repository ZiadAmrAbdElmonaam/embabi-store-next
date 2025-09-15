import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Package, Truck, CheckCircle, Clock, XCircle, Ticket, CreditCard, AlertCircle } from "lucide-react";
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

// Translation helper factory (avoids reading cookies inside)
function makeT(lang: string) {
  return (key: string) => {
    const keys = key.split('.');
    let translation: any = translations[lang];
    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        return key;
      }
    }
    return translation;
  };
}

// Lightweight localization for common Egyptian cities/governorates
const cityDictionary: Array<{ en: string; ar: string }> = [
  { en: 'Cairo', ar: 'القاهرة' },
  { en: 'Giza', ar: 'الجيزة' },
  { en: 'Alexandria', ar: 'الإسكندرية' },
  { en: 'Luxor', ar: 'الأقصر' },
  { en: 'Aswan', ar: 'أسوان' },
  { en: 'Asyut', ar: 'أسيوط' },
  { en: 'Qena', ar: 'قنا' },
  { en: 'Minya', ar: 'المنيا' },
  { en: 'Mansoura', ar: 'المنصورة' },
  { en: 'Tanta', ar: 'طنطا' },
  { en: 'Port Said', ar: 'بورسعيد' },
  { en: 'Suez', ar: 'السويس' },
  { en: 'Ismailia', ar: 'الإسماعيلية' },
  { en: 'Beni Suef', ar: 'بني سويف' },
  { en: 'Fayoum', ar: 'الفيوم' },
  { en: 'Sohag', ar: 'سوهاج' },
  { en: 'Damietta', ar: 'دمياط' },
  { en: 'Kafr El Sheikh', ar: 'كفر الشيخ' },
  { en: 'Qalyubia', ar: 'القليوبية' },
  { en: 'Sharqia', ar: 'الشرقية' },
  { en: 'Beheira', ar: 'البحيرة' },
  { en: 'Red Sea', ar: 'البحر الأحمر' },
  { en: 'New Valley', ar: 'الوادي الجديد' },
  { en: 'Matrouh', ar: 'مطروح' },
  { en: 'North Sinai', ar: 'شمال سيناء' },
  { en: 'South Sinai', ar: 'جنوب سيناء' },
  { en: 'Nasr City', ar: 'مدينة نصر' },
];

function localizeCityName(raw: string | null | undefined, lang: string): string {
  const value = (raw || '').trim();
  if (!value) return '';
  for (const entry of cityDictionary) {
    if (value.toLowerCase() === entry.en.toLowerCase()) {
      return lang === 'ar' ? entry.ar : entry.en;
    }
    if (value === entry.ar) {
      return lang === 'ar' ? entry.ar : entry.en;
    }
  }
  return value; // fallback to what user entered
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  // Get language from cookies for color name translation
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  const t = makeT(lang);
  const isRTL = lang === 'ar';

  const { id } = await params;
  const { payment } = await searchParams;
  
  // Check if this is a failed payment redirect
  const isFailedPayment = payment === 'failed';
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              storages: {
                select: {
                  id: true,
                  size: true,
                  price: true,
                },
              },
            },
          },
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

  // Calculate the actual subtotal from order items (before shipping and discount)
  const subtotal = order.items.reduce((total, item) => {
    return total + (Number(item.price) * item.quantity);
  }, 0);

  return (
    <div className="flex justify-center items-center py-12 px-4 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-4xl w-full">
        {/* Payment Status Banner (moved to top) */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {order.paymentStatus === 'SUCCESS' && (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">
                      {lang === 'ar' ? 'تم الدفع بنجاح' : 'Payment Successful'}
                    </p>
                    <p className="text-sm text-green-600">
                      {lang === 'ar' ? 'تم تأكيد الدفع ويمكن الآن معالجة الطلب' : 'Payment confirmed and order can now be processed'}
                    </p>
                  </div>
                </>
              )}
              {order.paymentStatus === 'PENDING' && (
                <>
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-800">
                      {lang === 'ar' ? 'في انتظار الدفع' : 'Payment Pending'}
                    </p>
                    <p className="text-sm text-yellow-600">
                      {lang === 'ar' ? 'جاري معالجة الدفع، يرجى الانتظار' : 'Payment is being processed, please wait'}
                    </p>
                  </div>
                </>
              )}
              {order.paymentStatus === 'FAILED' && (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">
                      {lang === 'ar' ? 'فشل في الدفع' : 'Payment Failed'}
                    </p>
                    <p className="text-sm text-red-600">
                      {isFailedPayment 
                        ? (lang === 'ar' ? 'لم يتم الدفع بنجاح، يمكنك المحاولة مرة أخرى من صفحة الطلب' : 'Payment failed, you can try again from the order page')
                        : (lang === 'ar' ? 'لم يتم الدفع بنجاح، يمكنك المحاولة مرة أخرى' : 'Payment was not successful, you can try again')
                      }
                    </p>
                  </div>
                </>
              )}
              {order.paymentStatus === 'CANCELLED' && (
                <>
                  <AlertCircle className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {lang === 'ar' ? 'تم إلغاء الدفع' : 'Payment Cancelled'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {lang === 'ar' ? 'تم إلغاء عملية الدفع' : 'Payment process was cancelled'}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>
                {order.paymentMethod === 'CASH' 
                  ? (lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery')
                  : (lang === 'ar' ? 'الدفع الإلكتروني' : 'Online Payment')
                }
              </span>
            </div>
          </div>
        </div>

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
            {!isFailedPayment && order.paymentStatus !== 'FAILED' && (
              <div className="bg-gray-100 px-5 py-3 rounded-lg">
                <p className="text-sm font-medium">
                  {t('order.status')}: <span className="text-orange-600 font-semibold">{t(`order.${order.status.toLowerCase()}`)}</span>
                </p>
              </div>
            )}
          </div>
          </div>

          {/* Payment Status Banner moved above */}

          {/* Progress Tracker - Only show if payment is successful and not a failed payment redirect */}
        {!isFailedPayment && order.paymentStatus === 'SUCCESS' && order.status !== 'CANCELLED' && (
          <div className="p-8 border-b">
            <h2 className="text-lg font-semibold mb-8 text-center">{t('order.trackYourOrder')}</h2>
            <div className="relative px-4">
              {/* Progress Bar */}
              <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-200 -translate-y-1/2 rounded-full"></div>
              <div 
                className={`absolute top-1/2 ${isRTL ? 'right-0' : 'left-0'} h-2 bg-orange-500 -translate-y-1/2 transition-all duration-500 rounded-full`}
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
                {order.items.map((item) => {
                  // Resolve storage by storage id or, if historical, by variant id
                  const selectedStorage = (() => {
                    if (!item.storageId) return null;
                    const storages = item.product.storages || [];
                    const direct = storages.find((s: any) => s.id === item.storageId);
                    if (direct) return direct;
                    const viaVariant = storages.find((s: any) => Array.isArray((s as any).variants) && (s as any).variants.some((v: any) => v.id === item.storageId));
                    return viaVariant || null;
                  })();
                  
                  return (
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
                          {selectedStorage && (
                            <p>{t('productDetail.storage')}: {selectedStorage.size}</p>
                          )}
                    {item.color && (
                      <p>{t('order.color')}: {getColorName(item.color, lang)}</p>
                    )}
                  </div>
                  <p className="mt-2 font-medium text-orange-600">
                    EGP {(Number(item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  );
                })}
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
              <p className="font-medium">{localizeCityName(order.shippingCity, lang)}</p>
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
              <p>EGP 300</p>
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