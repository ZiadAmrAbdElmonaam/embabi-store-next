'use client';

import { Product } from "@prisma/client";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import Image from 'next/image';
import { useCart } from "@/hooks/use-cart";
import { toast } from "react-hot-toast";
import { WishlistButton } from "./wishlist-button";
import { Star, ShoppingCart } from "lucide-react";
import { useTranslation } from '@/hooks/use-translation';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    categoryId: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
    rating?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { t } = useTranslation();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
    });
    toast.success('Added to cart');
  };

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <WishlistButton productId={product.id} className="absolute top-2 right-2 z-10" />
      
      {product.images[0] && (
        <Link href={`/products/${product.slug}`}>
          <div className="aspect-square relative">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        </Link>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/products/${product.slug}`}>
              <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-gray-500">{product.category.name}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            title={t('products.addToCart')}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(product.rating || 0)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            ({product.rating?.toFixed(1) || '0.0'})
          </span>
        </div>

        <p className="mt-2 font-bold text-gray-900">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
} 