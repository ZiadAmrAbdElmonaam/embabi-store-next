'use client';

import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@prisma/client";

export interface ProductWithDetails extends Omit<Product, 'price' | 'salePrice'> {
  price: number;
  salePrice: number | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  reviews?: { rating: number }[];
  variants?: Array<{
    id: string;
    color: string;
    quantity: number;
  }>;
}

interface ProductGridProps {
  products: ProductWithDetails[];
  showDescription?: boolean;
}

export function ProductGrid({ products, showDescription = false }: ProductGridProps) {
  // Calculate average rating for each product
  const productsWithRating = products.map(product => ({
    ...product,
    rating: product.reviews?.length ? 
      product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
      : 0,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
  }));

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`}>
      {productsWithRating.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showDescription={showDescription}
        />
      ))}
    </div>
  );
} 