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
    salePrice?: number | null;
    saleEndDate?: string | null;
    stock: number;
    images: string[];
    category: {
      name: string;
    };
    variants: Array<{
      id: string;
      color: string;
      quantity: number;
    }>;
    details: Array<{
      id: string;
      label: string;
      description: string;
    }>;
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

export function ProductDetails({ product, hasPurchased }: ProductDetailsProps) {
  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
    : 0;

  const calculateDiscount = () => {
    if (!product.salePrice) return 0;
    const discount = ((product.price - product.salePrice) / product.price) * 100;
    return Math.round(discount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Color name mapping
  const getColorName = (colorCode: string) => {
    const colorMap: { [key: string]: string } = {
      'black': 'Black',
      'white': 'White',
      'red': 'Red',
      'green': 'Green',
      'blue': 'Blue',
      'yellow': 'Yellow',
      'purple': 'Purple',
      'pink': 'Pink',
      'gray': 'Gray',
      'brown': 'Brown',
      'orange': 'Orange',
      'navy': 'Navy Blue',
      'gold': 'Gold',
      'silver': 'Silver',
    };
    return colorMap[colorCode.toLowerCase()] || colorCode;
  };

  // Get CSS color value
  const getColorValue = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'green': '#008000',
      'blue': '#0000FF',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'gray': '#808080',
      'brown': '#A52A2A',
      'orange': '#FFA500',
      'navy': '#000080',
      'gold': '#FFD700',
      'silver': '#C0C0C0',
    };
    return colorMap[colorName.toLowerCase()] || colorName;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <div className="space-y-6">
          <div className="aspect-square relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.slice(1).map((image, index) => (
              <div
                key={index}
                className="aspect-square relative overflow-hidden rounded-xl border border-gray-200 cursor-pointer hover:border-orange-500 transition-colors duration-200"
              >
                <Image
                  src={image}
                  alt={`${product.name} ${index + 2}`}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{product.name}</h1>
              <p className="text-lg text-gray-600">{product.category.name}</p>
            </div>
            <WishlistButton 
              productId={product.id} 
              variant="full"
            />
          </div>

          <div className="flex items-center gap-3">
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
            <span className="text-gray-600 font-medium">
              ({product.reviews.length} reviews)
            </span>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
          </div>

          {/* Colors Section */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Available Colors</h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="group relative"
                  >
                    <div
                      className="h-12 w-12 rounded-full border-2 border-gray-200 cursor-pointer hover:border-orange-500 transition-colors duration-200 shadow-sm flex items-center justify-center"
                      style={{ 
                        backgroundColor: getColorValue(variant.color),
                        boxShadow: variant.color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined 
                      }}
                    >
                      <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                        {variant.quantity}
                      </span>
                    </div>
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {getColorName(variant.color)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Section */}
          <div className="py-6 border-y border-gray-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                {product.salePrice ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold text-red-600">
                        {formatPrice(product.salePrice)}
                      </span>
                      <span className="text-xl text-gray-500 line-through">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Save {calculateDiscount()}%
                      </span>
                      {product.saleEndDate && (
                        <span className="text-sm text-gray-600">
                          Sale ends {formatDate(product.saleEndDate)}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
                )}
                <p className="text-sm text-gray-500">Free shipping on orders over $100</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                product.stock > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
            }`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
            </div>
          </div>

          <AddToCartButton product={product} />
        </div>
      </div>

      {/* Product Details Section */}
      {product.details && product.details.length > 0 && (
        <div className="border-t border-gray-200 pt-16 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Product Details</h2>
          
          <div className="grid grid-cols-1 gap-8">
            {product.details.map((detail) => (
              <div key={detail.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{detail.label}</h3>
                <p className="text-gray-700 leading-relaxed">{detail.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="border-t border-gray-200 pt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>
          {hasPurchased && (
            <button 
              className="px-6 py-2 bg-orange-100 text-orange-700 rounded-full font-medium hover:bg-orange-200 transition-colors"
              onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Write a Review
            </button>
          )}
        </div>
        
        {hasPurchased && (
          <div id="review-form" className="mb-12 bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold mb-6">Share Your Experience</h3>
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
            <div key={review.id} className="border-b border-gray-200 pb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {review.user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{review.user.name}</p>
                  <div className="flex items-center gap-2">
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
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          ))}

          {product.reviews.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-4">
                <Star className="w-12 h-12 text-gray-300 mx-auto" />
              </div>
              <p className="text-gray-600 text-lg mb-2">
                No reviews yet
              </p>
              <p className="text-gray-500">
                Be the first to share your thoughts about this product!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 