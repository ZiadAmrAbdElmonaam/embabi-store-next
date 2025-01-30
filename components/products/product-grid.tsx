'use client';

import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@prisma/client";

interface ProductWithDetails extends Product {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  reviews: { rating: number }[];
}

interface ProductGridProps {
  products: ProductWithDetails[];
}

export function ProductGrid({ products }: ProductGridProps) {
  // Calculate average rating for each product
  const productsWithRating = products.map(product => ({
    ...product,
    rating: product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
      : 0,
    price: Number(product.price), // Convert Decimal to number
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {productsWithRating.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
} 