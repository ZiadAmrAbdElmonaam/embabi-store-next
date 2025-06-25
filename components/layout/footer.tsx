'use client';

import Link from 'next/link';
import { TranslatedContent } from '@/components/ui/translated-content';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

export function Footer() {
  const { lang } = useTranslation();
  const isRtl = lang === 'ar';

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Company Info */}
          <div className={cn(
            "flex flex-col items-center justify-center",
            isRtl && "md:order-3"
          )}>
            <div className="mb-6">
              <img 
                src="/images/logo/footer-logo.png" 
                alt="Embabi Store Logo" 
                className="h-40 w-auto" 
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
            <ul className="space-y-3">
              <li className={cn(
                isRtl ? "text-right" : "text-left"
              )}>
                <Link href="/products" className="text-gray-400 hover:text-white">
                  <TranslatedContent translationKey="footer.products" />
                </Link>
              </li>
              <li className={cn(
                isRtl ? "text-right" : "text-left"
              )}>
                <Link href="/categories" className="text-gray-400 hover:text-white">
                  <TranslatedContent translationKey="footer.categories" />
                </Link>
              </li>
              <li className={cn(
                isRtl ? "text-right" : "text-left"
              )}>
                <Link href="/reviews" className="text-gray-400 hover:text-white">
                  <TranslatedContent translationKey="footer.reviews" />
                </Link>
              </li>
              <li className={cn(
                isRtl ? "text-right" : "text-left"
              )}>
                <Link href="/contact" className="text-gray-400 hover:text-white">
                  <TranslatedContent translationKey="footer.contact" />
                </Link>
              </li>
            </ul>
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
              "space-y-3 text-gray-400",
              isRtl ? "text-right" : "text-left"
            )}>
              <li className="flex items-center gap-2 justify-start">
                <span><TranslatedContent translationKey="footer.email" />:</span>
                <span className={isRtl ? "mr-auto" : "ml-auto"}>oxygenembabi@gmail.com</span>
              </li>
              <li className="flex items-center gap-2 justify-start">
                <span><TranslatedContent translationKey="footer.phone" />:</span>
                <span className={isRtl ? "mr-auto" : "ml-auto"}> <TranslatedContent translationKey="footer.mobile" /></span>
              </li>
              <li className="flex items-center gap-2 justify-start">
                <span><TranslatedContent translationKey="footer.address" />:</span>
                <span className={isRtl ? "mr-auto" : "ml-auto"}><TranslatedContent translationKey="footer.addressText2" /></span>
                
              </li>
             
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} <TranslatedContent translationKey="footer.allRightsReserved" /></p>
        </div>
      </div>
    </footer>
  );
} 