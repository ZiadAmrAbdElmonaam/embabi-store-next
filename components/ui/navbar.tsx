import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ShoppingCart, User } from "lucide-react";

export async function Navbar() {
  const session = await getServerSession();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Tech Store
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/products"
                className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md"
              >
                Products
              </Link>
              <Link
                href="/categories"
                className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md"
              >
                Categories
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="text-gray-900 hover:text-gray-500">
              <ShoppingCart className="h-6 w-6" />
            </Link>
            {session ? (
              <Link href="/profile" className="text-gray-900 hover:text-gray-500">
                <User className="h-6 w-6" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 