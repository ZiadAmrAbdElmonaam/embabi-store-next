'use client';

import Link from 'next/link';
import Image from 'next/image';
import { TranslatedContent } from '@/components/ui/translated-content';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

export function Footer() {
  const { lang } = useTranslation();
  const isRtl = lang === 'ar';

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
          {/* Company Info */}
          <div className={cn(
            "flex flex-col items-center justify-center",
            isRtl && "md:order-3"
          )}>
            <div className="mb-6">
              <Image 
                src="/images/logo/footer-logo.png" 
                alt="Embabi Store Logo" 
                width={200}
                height={160}
                className="h-32 md:h-40 w-auto" 
                priority
              />
            </div>
            <p className="text-gray-400 text-center">
              <TranslatedContent translationKey="footer.safeHands" />
            </p>
          </div>

          {/* Quick Links */}
          <div className={cn(
            "mt-8 md:mt-0",
            isRtl && "md:order-2"
          )}>
            <h4 className={cn(
              "text-lg font-semibold mb-6",
              isRtl ? "text-center md:text-right" : "text-center md:text-left"
            )}>
              <TranslatedContent translationKey="footer.quickLinks" />
            </h4>
            <div className="grid grid-cols-2 gap-2 md:block md:space-y-3">
              <Link href="/products" className={cn(
                "text-gray-400 hover:text-white text-sm md:text-base block text-center md:text-left",
                isRtl && "md:text-right"
              )}>
                <TranslatedContent translationKey="footer.products" />
              </Link>
              <Link href="/categories" className={cn(
                "text-gray-400 hover:text-white text-sm md:text-base block text-center md:text-left",
                isRtl && "md:text-right"
              )}>
                <TranslatedContent translationKey="footer.categories" />
              </Link>
              <Link href="/reviews" className={cn(
                "text-gray-400 hover:text-white text-sm md:text-base block text-center md:text-left",
                isRtl && "md:text-right"
              )}>
                <TranslatedContent translationKey="footer.reviews" />
              </Link>
              <Link href="/policies" className={cn(
                "text-gray-400 hover:text-white text-sm md:text-base block text-center md:text-left",
                isRtl && "md:text-right"
              )}>
                <TranslatedContent translationKey="footer.policies" />
              </Link>
              <Link href="/contact" className={cn(
                "text-gray-400 hover:text-white text-sm md:text-base block text-center md:text-left",
                isRtl && "md:text-right"
              )}>
                <TranslatedContent translationKey="footer.contact" />
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className={cn(
            "mt-8 md:mt-0",
            isRtl && "md:order-1"
          )}>
            <h4 className={cn(
              "text-lg font-semibold mb-6",
              isRtl ? "text-center md:text-right" : "text-center md:text-left"
            )}>
              <TranslatedContent translationKey="footer.contactUs" />
            </h4>
            <ul className={cn(
              "space-y-2 md:space-y-3 text-gray-400 text-sm md:text-base",
              "text-center md:text-left",
              isRtl && "md:text-right"
            )}>
              <li className="flex justify-between items-center gap-2">
                <span><TranslatedContent translationKey="footer.email" />:</span>
                <span className="break-all">embabistore110@gmail.com</span>
              </li>
              <li className="flex justify-between items-center gap-2">
                <span><TranslatedContent translationKey="footer.phone" />:</span>
                <span><TranslatedContent translationKey="footer.mobile" /></span>
              </li>
              <li className="flex justify-between items-center gap-2">
                <span><TranslatedContent translationKey="footer.address" />:</span>
                <span><TranslatedContent translationKey="footer.addressText2" /></span>
              </li>
              <li className="flex justify-between items-center gap-2">
                <a 
                  href="https://www.google.com/maps/search/?query=OXGEN+EMBABI+Tech&query_place_id=ChIJowiuM1c_WBQRJTmuNu1JC5Y&api=1&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  <TranslatedContent translationKey="footer.getDirections" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <div className="mb-4">
            <p className="text-orange-400 font-semibold text-lg">
              ضمان شهر ضد عيوب الصناعه (Hardware) من اكسجين امبابي ستور
            </p>
          </div>
          <p>&copy; {new Date().getFullYear()} <TranslatedContent translationKey="footer.allRightsReserved" /></p>
        </div>
      </div>
    </footer>
  );
} 