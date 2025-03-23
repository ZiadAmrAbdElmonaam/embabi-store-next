'use client';

import { Product, Category, ProductVariant } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";

interface FormattedProduct extends Omit<Product, 'price' | 'salePrice' | 'discountPrice' | 'createdAt' | 'updatedAt' | 'saleEndDate'> {
  price: number;
  salePrice: number | null;
  discountPrice: number | null;
  createdAt: string;
  updatedAt: string;
  saleEndDate: string | null;
  category: Category | null;
  variants: (Omit<ProductVariant, 'price'> & { price: number })[];
}

interface WishlistItemsProps {
  products: FormattedProduct[];
}

export default function WishlistItems({ products }: WishlistItemsProps) {
  const [isLoading, setIsLoading] = useState<string>("");

  const removeFromWishlist = async (productId: string) => {
    try {
      setIsLoading(productId);
      const response = await fetch('/api/wishlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      toast.success('Removed from wishlist');
      // Refresh the page to update the wishlist
      window.location.reload();
    } catch (error) {
      toast.error('Error removing from wishlist');
    } finally {
      setIsLoading("");
    }
  };

  const addToCart = async (productId: string) => {
    try {
      setIsLoading(productId);
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      toast.success('Added to cart');
    } catch (error) {
      toast.error('Error adding to cart');
    } finally {
      setIsLoading("");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group"
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={product.images[0] || '/images/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Product Info */}
          <div className="p-4">
            <Link 
              href={`/product/${product.slug}`}
              className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-1"
            >
              {product.name}
            </Link>
            
            <div className="mt-2 flex items-center gap-2">
              <span className="text-orange-600 font-semibold">
                {formatPrice(product.price)}
              </span>
              {product.salePrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.salePrice)}
                </span>
              )}
            </div>

            {/* Category and Stock */}
            <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
              <span>{product.category?.name}</span>
              <span>{product.stock > 0 ? '' : 'Out of stock'}</span>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => addToCart(product.id)}
                disabled={product.stock === 0 || isLoading === product.id}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
              <button
                onClick={() => removeFromWishlist(product.id)}
                disabled={isLoading === product.id}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 