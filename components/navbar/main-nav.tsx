'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const mainNavItems = [
  {
    label: "Products",
    href: "/products",
  },
  {
    label: "Categories",
    href: "/categories",
  },
  {
    label: "Deals",
    href: "/deals",
  },
  {
    label: "Most Selling",
    href: "/most-selling",
  },
];

export function MainNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
      {mainNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors hover:text-black ${
            isActive(item.href) ? "text-black" : "text-neutral-500"
          }`}
        >
          {item.label}
        </Link>
      ))}
      
      {/* Admin Dashboard Link */}
      {session?.user?.role === 'admin' && (
        <Link
          href="/admin"
          className={`text-sm font-medium transition-colors hover:text-black ${
            isActive('/admin') ? "text-black" : "text-neutral-500"
          }`}
        >
          Dashboard
        </Link>
      )}
    </nav>
  );
} 