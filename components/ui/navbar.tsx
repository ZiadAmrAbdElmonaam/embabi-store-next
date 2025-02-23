'use client';

import Link from "next/link";
import { ShoppingCart, Package, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart } from "@/hooks/use-cart";
import { LanguageSwitcher } from "./language-switcher";
import { UserButton } from "./user-button";
import { useTranslation } from "@/hooks/use-translation";

export function Navbar() {
  const { data: session } = useSession();
  const { items } = useCart();
  const { t } = useTranslation();

  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            {t('common.techStore')}
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/products">{t('common.products')}</Link>
            <Link href="/categories">{t('common.categories')}</Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Settings className="h-5 w-5" />
                Admin Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-6 w-6" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>
            {session && (
              <Link href="/orders" title={t('common.orders')}>
                <Package className="h-6 w-6" />
              </Link>
            )}
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
} 