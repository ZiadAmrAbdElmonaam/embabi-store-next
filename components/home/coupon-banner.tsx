'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ticket, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TranslatedContent } from '@/components/ui/translated-content';
import { useTranslation } from '@/hooks/use-translation';

interface ActiveCoupon {
  id: string;
  code: string;
  type: string;
  value: number;
  name: string;
}

export function CouponBanner() {
  const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch('/api/coupons/active')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCoupons(data);
      })
      .catch(() => setCoupons([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(t('home.couponCodeCopied'));
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error(t('cart.errorOccurred'));
    }
  };

  if (isLoading || coupons.length === 0) return null;

  return (
    <div className="promotion-banner blocks-radius relative overflow-hidden w-full max-w-[1440px] mx-auto px-2 sm:px-4 md:px-6 mb-3 sm:mb-4">
      <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <p className="font-bold text-base sm:text-lg md:text-xl">
                  <TranslatedContent translationKey="home.couponBannerTitle" defaultValue="Use Our Coupons!" />
                </p>
                <p className="text-white/90 text-xs sm:text-sm md:text-base mt-0.5">
                  <TranslatedContent translationKey="home.couponBannerMessage" defaultValue="Get exclusive discounts when you shop. Apply your coupon at checkout!" />
                </p>
              </div>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-red-600 font-semibold rounded-full text-sm sm:text-base shadow-md min-w-[120px] sm:min-w-[140px] hover:bg-white/95 transition-colors self-start sm:self-auto"
            >
              <TranslatedContent translationKey="home.buyNow" />
            </Link>
          </div>

          {/* Coupon codes section */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 border-t border-white/20">
            <span className="text-white/90 text-xs sm:text-sm font-medium">
              <TranslatedContent translationKey="home.useCode" defaultValue="Use code:" />
            </span>
            {coupons.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 sm:gap-2 bg-white/20 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2"
              >
                <code className="font-mono font-semibold text-sm sm:text-base tracking-wider">{c.code}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(c.code)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  title={t('home.copyCode')}
                >
                  {copiedCode === c.code ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
