import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/auth-options";
import { redirect } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import WishlistItems from "@/components/wishlist/wishlist-items";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    include: {
      products: {
        include: {
          variants: true,
          category: true
        }
      }
    }
  });

  // Format products to handle Decimal serialization
  const formattedProducts = wishlist?.products.map(product => ({
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    variants: product.variants.map(variant => ({
      ...variant,
      price: Number(variant.price)
    })),
    // Convert dates to ISO strings
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null
  })) || [];

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-600" fill="currentColor" />
            <h1 className="text-3xl font-bold">My Wishlist</h1>
          </div>
          <Link 
            href="/cart" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>View Cart</span>
          </Link>
        </div>

        {formattedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Start adding items you love to your wishlist!</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-full hover:bg-orange-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <WishlistItems products={formattedProducts} />
        )}
      </div>
    </div>
  );
} 