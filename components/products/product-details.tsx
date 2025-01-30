'use client';

import { Session } from "next-auth";
import Image from "next/image";
import { Star } from "lucide-react";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { formatPrice } from "@/lib/utils";
import { ReviewForm } from "@/components/reviews/review-form";

interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    category: {
      name: string;
    };
    reviews: Array<{
      id: string;
      rating: number;
      comment: string;
      createdAt: string;
      user: {
        name: string;
      };
    }>;
  };
  session: Session | null;
  hasPurchased?: boolean;
}

export function ProductDetails({ product, session, hasPurchased }: ProductDetailsProps) {
  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
    : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-lg">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.slice(1).map((image, index) => (
              <div
                key={index}
                className="aspect-square relative overflow-hidden rounded-lg"
              >
                <Image
                  src={image}
                  alt={`${product.name} ${index + 2}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-lg text-gray-600 mt-2">{product.category.name}</p>
            </div>
            <WishlistButton productId={product.id} />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              ({product.reviews.length} reviews)
            </span>
          </div>

          <p className="text-gray-700">{product.description}</p>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">
              {formatPrice(product.price)}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <AddToCartButton product={product} />
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>
        
        {hasPurchased && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <ReviewForm
              productId={product.id}
              onSuccess={() => {
                window.location.reload();
              }}
            />
          </div>
        )}

        <div className="space-y-8">
          {product.reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{review.user.name}</span>
              </div>
              <p className="text-gray-600">{review.comment}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}

          {product.reviews.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No reviews yet. Be the first to review this product!
            </p>
          )}
        </div>
      </div>
    </>
  );
} 