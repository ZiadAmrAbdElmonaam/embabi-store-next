'use client';

import { Product, Category } from "@prisma/client";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import Image from 'next/image';

interface ProductCardProps {
  product: Product & {
    category: Category;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {product.images[0] && (
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold mb-2 hover:text-blue-600">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-600 text-sm mb-2">{product.category.name}</p>
        <p className="text-lg font-bold">{formatPrice(product.price)}</p>
        <button
          onClick={() => {
            // TODO: Add to cart functionality
            alert('Added to cart!');
          }}
          className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
} 