'use client';

import { Session } from "next-auth";
import Image from "next/image";
import { Star, Eye, EyeOff } from "lucide-react";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

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
    thumbnails?: string[];
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
  // Add console log to debug thumbnails
  console.log("Product thumbnails:", product.thumbnails);
  
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.images[0] || '/images/placeholder.png');
  const { t, lang } = useTranslation();
  const isRtl = lang === 'ar';
  
  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
    : 0;

  const calculateDiscount = () => {
    if (!product.salePrice || !product.price) return 0;
    const discount = ((product.price - product.salePrice) / product.price) * 100;
    return Math.round(discount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  // Color name mapping
  const getColorName = (colorCode: string) => {
    const colorMap: { [key: string]: string } = {
      'black': lang === 'ar' ? 'أسود' : 'Black',
      'white': lang === 'ar' ? 'أبيض' : 'White',
      'red': lang === 'ar' ? 'أحمر' : 'Red',
      'green': lang === 'ar' ? 'أخضر' : 'Green',
      'blue': lang === 'ar' ? 'أزرق' : 'Blue',
      'yellow': lang === 'ar' ? 'أصفر' : 'Yellow',
      'purple': lang === 'ar' ? 'بنفسجي' : 'Purple',
      'pink': lang === 'ar' ? 'وردي' : 'Pink',
      'gray': lang === 'ar' ? 'رمادي' : 'Gray',
      'brown': lang === 'ar' ? 'بني' : 'Brown',
      'orange': lang === 'ar' ? 'برتقالي' : 'Orange',
      'navy': lang === 'ar' ? 'أزرق داكن' : 'Navy Blue',
      'gold': lang === 'ar' ? 'ذهبي' : 'Gold',
      'silver': lang === 'ar' ? 'فضي' : 'Silver',
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

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  // Handle image selection
  const handleImageSelect = (image: string) => {
    setSelectedImage(image);
  };

  // Toggle image zoom
  const toggleImageZoom = () => {
    setShowImage(!showImage);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <div className="space-y-6">
          {/* Main Product Image */}
          <div className="aspect-square relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              priority
              onClick={toggleImageZoom}
            />
            <button 
              onClick={toggleImageZoom}
              className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors`}
            >
              {showImage ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Thumbnails or Additional Images */}
          {(product.thumbnails && product.thumbnails.length > 0) ? (
            <div className="grid grid-cols-5 gap-4">
              {product.thumbnails.slice(0, 5).map((thumbnail, index) => (
                <div
                  key={index}
                  className={cn(
                    "aspect-square relative overflow-hidden rounded-xl border hover:border-orange-500 transition-colors duration-200 cursor-pointer",
                    selectedImage === thumbnail ? "border-orange-500 ring-2 ring-orange-500 ring-opacity-50" : "border-gray-200"
                  )}
                  onClick={() => handleImageSelect(thumbnail)}
                >
                  <Image
                    src={thumbnail}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : product.images.length > 1 ? (
            <div className="grid grid-cols-5 gap-4">
              {product.images.map((image, index) => (
                <div
                  key={index}
                  className={cn(
                    "aspect-square relative overflow-hidden rounded-xl border hover:border-orange-500 transition-colors duration-200 cursor-pointer",
                    selectedImage === image ? "border-orange-500 ring-2 ring-orange-500 ring-opacity-50" : "border-gray-200"
                  )}
                  onClick={() => handleImageSelect(image)}
                >
                  <Image
                    src={image}
                    alt={`${product.name} image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
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
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                salePrice: product.salePrice || null,
                images: product.images,
                slug: product.id,
                description: product.description,
                variants: product.variants
              }}
              variant="full"
            />
          </div>

          {/* <div className="flex items-center gap-3">
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
              ({product.reviews.length} {t('productDetail.reviews')})
            </span>
          </div> */}

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
          </div>

          {/* Colors Section */}
          {product.variants && product.variants.length > 0 && 
           product.variants.some(variant => variant.quantity > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">{t('productDetail.availableColors')}</h3>
              <div className="flex flex-wrap gap-3">
                {product.variants
                  .filter(variant => variant.quantity > 0)
                  .map((variant) => (
                  <div
                    key={variant.id}
                    className="group relative"
                  >
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full border-2 cursor-pointer transition-all duration-200 shadow-sm flex items-center justify-center",
                        selectedColor === variant.color 
                          ? "border-orange-500 ring-2 ring-orange-500 ring-opacity-50 scale-110" 
                          : "border-gray-200 hover:border-orange-500"
                      )}
                      style={{ 
                        backgroundColor: getColorValue(variant.color),
                        boxShadow: variant.color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined 
                      }}
                      onClick={() => handleColorSelect(variant.color)}
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
              
              {/* Selected Color Display */}
              {selectedColor && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-sm text-gray-700 flex items-center">
                    <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getColorValue(selectedColor) }}></span>
                    {t('productDetail.selected')}: <span className="font-medium text-gray-900 ml-1">{getColorName(selectedColor)}</span>
                  </p>
                </div>
              )}
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
                        {t('productDetail.save')} {calculateDiscount()}%
                      </span>
                      {product.saleEndDate && (
                        <span className="text-sm text-gray-600">
                          {t('productDetail.saleEnds')} {formatDate(product.saleEndDate)}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                )}
                <p className="text-sm text-gray-500">{t('productDetail.freeShipping')}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                product.stock > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 0 ? `${product.stock} ${t('productDetail.inStock')}` : t('productDetail.outOfStock')}
              </span>
            </div>
          </div>

          {/* Pass the selected color to the AddToCartButton */}
          <AddToCartButton 
            product={product}
            selectedColor={selectedColor}
          />
        </div>
      </div>

      {/* Product Details Section */}
      {product.details && product.details.length > 0 && (
        <div className="border-t border-gray-200 pt-16 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">{t('productDetail.productDetails')}</h2>
          
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
      {/* <div className="border-t border-gray-200 pt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{t('productDetail.customerReviews')}</h2>
          {hasPurchased && (
            <button 
              className="px-6 py-2 bg-orange-100 text-orange-700 rounded-full font-medium hover:bg-orange-200 transition-colors"
              onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('productDetail.writeReview')}
            </button>
          )}
        </div>

        {product.reviews.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-600">{t('productDetail.noReviews')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {product.reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {review.user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.user.name || t('productDetail.anonymous')}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
      //   )} */
      }

         {/* Review Form */}
      {/* //   {hasPurchased && ( */}
      {/* //     <div id="review-form" className="mt-16">
      //       <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('productDetail.writeReviewHeading')}</h3>
      //       <ReviewForm 
      //         productId={product.id} 
      //         onSuccess={() => window.location.reload()}
      //       />
      //     </div>
      //   )}
      // </div> */}

      {/* Image Zoom Modal */}
      {showImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={toggleImageZoom}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              className="object-contain"
            />
            <button 
              onClick={toggleImageZoom}
              className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors`}
            >
              <EyeOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 