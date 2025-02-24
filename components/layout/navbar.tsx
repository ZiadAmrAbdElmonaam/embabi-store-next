'use client';

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Facebook, 
  Instagram, 
  Phone, 
  MapPin, 
  Heart,
  Flame,
  LogOut,
  UserCircle
} from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { items } = useCart();

  return (
    <div className="sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm">
        <div className="mx-auto px-2" style={{ maxWidth: '120rem' }}>
          <div className="flex justify-between items-center h-9">
            {/* Left Side - Social Links */}
            <div className="flex items-center gap-4 ml-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                className="hover:text-orange-400">
                <Facebook size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="hover:text-orange-400">
                <Instagram size={18} />
              </a>
              <a href="https://wa.me/yourwhatsappnumber" target="_blank" rel="noopener noreferrer"
                className="hover:text-orange-400">
                <Phone size={18} />
              </a>
            </div>

            {/* Right Side - Contact & Language */}
            <div className="flex items-center gap-6 mr-2">
              <Link href="/contact" className="hover:text-orange-400">
                Contact Us
              </Link>
              <Link href="/branches" className="flex items-center gap-2 hover:text-orange-400">
                <MapPin size={16} />
                <span>Our Branches</span>
              </Link>
              <div className="hover:text-black transition-colors">
  <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-orange-50 shadow-sm">
        <div className="mx-auto px-2" style={{ maxWidth: '115rem' }}>
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center ml-2">
              <Image
                src="/logo.png"
                alt="Embabi Logo"
                width={60}
                height={60}
                className="object-contain"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-gray-700 hover:text-orange-600 text-base">
                Products
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-orange-600 text-base">
                Categories
              </Link>
              <Link href="/deals" className="flex items-center gap-2 text-gray-700 hover:text-orange-600 text-base">
                <span>Deals</span>
                <Flame size={18} className="text-red-500" />
              </Link>
              <Link href="/most-selling" className="text-gray-700 hover:text-orange-600 text-base">
                Most Selling
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-4 mr-2">
              <Link href="/wishlist" className="relative">
                <Heart className="h-6 w-6 text-gray-700 hover:text-orange-600" />
              </Link>
              <Link href="/cart" className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-orange-600" />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>

              {/* Profile Section with Dropdown */}
              <div className="relative">
                {session ? (
                  <>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="relative"
                    >
                      <User className="h-6 w-6 text-gray-700 hover:text-orange-600" />
                    </button>
                    
                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-50"
                        onMouseLeave={() => setIsProfileOpen(false)}
                      >
                        <div className="px-4 py-2 bg-orange-50 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {session.user?.name}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <UserCircle className="h-4 w-4 mr-2" />
                            Profile
                          </Link>
                          <button
                            onClick={() => {
                              signOut();
                              setIsProfileOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/login">
                    <User className="h-6 w-6 text-gray-700 hover:text-orange-600" />
                  </Link>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 text-gray-700" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-2 border-t">
              <div className="flex flex-col space-y-2">
                <Link 
                  href="/products" 
                  className="px-2 py-1 text-gray-700 hover:text-orange-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Products
                </Link>
                <Link 
                  href="/categories" 
                  className="px-2 py-1 text-gray-700 hover:text-orange-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link 
                  href="/deals" 
                  className="px-2 py-1 text-gray-700 hover:text-orange-600 flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Deals</span>
                  <Flame size={16} className="text-red-500 ml-1" />
                </Link>
                <Link 
                  href="/most-selling" 
                  className="px-2 py-1 text-gray-700 hover:text-orange-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Most Selling
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
</div> 
  );
} 