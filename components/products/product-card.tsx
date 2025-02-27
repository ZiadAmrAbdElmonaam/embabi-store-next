'use client';

import { formatPrice } from "@/lib/utils";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    salePrice?: number | null;
    saleEndDate?: string | null;
    images: string[];
    slug: string;
    colors?: string[]; // Array of color codes
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const calculateDiscount = () => {
    if (!product.salePrice) return 0;
    const discount = ((product.price - product.salePrice) / product.price) * 100;
    return Math.round(discount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      // Add more color mappings as needed
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
      // Add more color values as needed
    };
    return colorMap[colorName.toLowerCase()] || colorName;
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/wishlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add to wishlist');
      }
      toast.success('Added to wishlist');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Please login to add to wishlist');
      }
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: product.id,
          quantity: 1
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add to cart');
      }
      toast.success('Added to cart');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add to cart');
      }
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-lg overflow-hidden hover:shadow-md transition duration-300"
    >
      <div className="aspect-square relative group">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition duration-300"
          />
        )}
        {/* Sale Badge */}
        {product.salePrice && product.salePrice < product.price && (
          <div className="absolute left-0 top-3 z-10">
            <div className="flex items-center">
              <div className="bg-red-600 text-white py-1.5 px-3 rounded-r-full shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 animate-pulse" />
                <div className="relative flex items-center gap-1">
                  <span className="text-base font-bold tracking-tight">-{calculateDiscount()}%</span>
                  {product.saleEndDate && (
                    <span className="text-xs font-medium bg-red-700/50 px-1.5 py-0.5 rounded-full">
                      {formatDate(product.saleEndDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Action Buttons and Colors */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAddToWishlist}
              className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
            >
              <Heart className="w-4 h-4 text-gray-700 hover:text-red-500 transition-colors" />
            </button>
            <button
              onClick={handleAddToCart}
              className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
            >
              <ShoppingCart className="w-4 h-4 text-gray-700 hover:text-orange-500 transition-colors" />
            </button>
          </div>
          {/* Color Circles */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex flex-col gap-1 items-end translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
                <div className="flex gap-1.5">
                  {product.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-5 h-5 rounded-full shadow-inner border border-gray-200 hover:scale-125 transition-all duration-300 cursor-pointer"
                      style={{ 
                        backgroundColor: getColorValue(color),
                        boxShadow: color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined 
                      }}
                      title={getColorName(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-3.5">
        <div className="space-y-1 mb-2">
          <h3 className="font-medium text-sm text-gray-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2">
            {product.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="text-sm font-bold text-red-600">
                {formatPrice(product.salePrice)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
} 