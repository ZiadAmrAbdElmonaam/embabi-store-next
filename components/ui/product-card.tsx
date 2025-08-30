'use client';

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import Image from 'next/image';
import { useCart } from "@/hooks/use-cart";
import { toast } from "react-hot-toast";
import { WishlistButton } from "./wishlist-button";
import { ShoppingCart } from "lucide-react";
import { useTranslation } from '@/hooks/use-translation';
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductSelectionModal } from "@/components/products/product-selection-modal";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    salePrice: number | null;
    sale: number | null;
    stock: number;
    images: string[];
    categoryId: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
    // Keep rating in the interface but we won't display it
    rating?: number;
    variants?: Array<{
      id: string;
      color: string;
      quantity: number;
    }>;
    colors?: string[];
    storages?: Array<{
      id: string;
      size: string;
      price: number;
      stock: number;
      salePercentage?: number | null;
      saleEndDate?: string | null;
      variants: Array<{
        id: string;
        color: string;
        quantity: number;
      }>;
    }>;
  };
  showDescription?: boolean;
}

export function ProductCard({ product, showDescription = false }: ProductCardProps) {
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  const { t } = useTranslation();

  // Helper function to check stock status
  const checkStockStatus = () => {
    const hasMainStock = product.stock > 0;
    const hasStorageStock = product.storages && product.storages.some(storage => storage.stock > 0);
    return {
      hasStock: hasMainStock || hasStorageStock,
      hasMainStock,
      hasStorageStock
    };
  };

  const stockStatus = checkStockStatus();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if the product has storages
    const hasStorages = product.storages && product.storages.length > 0;
    
    // Check if the product has colors or variants
    const hasColors = product.colors && product.colors.length > 0;
    const hasVariants = product.variants && product.variants.length > 0;
    
    // Check if there are any variants with quantity > 0
    const hasAvailableVariants = product.variants && 
      product.variants.some(variant => variant.quantity > 0);
    
    // Show modal if product has storages, colors, or variants that require selection
    if (hasStorages || ((hasColors || hasVariants) && hasAvailableVariants)) {
      setShowSelectionModal(true);
      return;
    }
    
    // For products without storages, colors or variants, add directly to cart
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice || null,
      images: product.images,
      slug: product.slug,
      variants: []
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
      // Add more color values as needed
    };
    return colorMap[colorName.toLowerCase()] || colorName;
  };

  return (
    <div 
      className="group relative bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <WishlistButton 
        productId={product.id} 
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          salePrice: product.salePrice,
          images: product.images,
          slug: product.slug,
          description: product.description,
          variants: product.variants
        }}
        className="absolute top-2 right-2 z-10" 
      />
      
      {/* Sale Badge */}
      {product.sale && stockStatus.hasStock && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
          {Math.round(product.sale)}% {t('products.off')}
        </div>
      )}

      {/* Out of Stock Badge */}
      {!stockStatus.hasStock && (
        <div className="absolute top-2 left-2 z-10 bg-gray-800 text-white px-2 py-1 rounded-full text-sm font-medium">
          {t('products.outOfStock')}
        </div>
      )}
      
      {product.images[0] && (
        <Link href={`/products/${product.slug}`}>
          <div className="aspect-[4/3] relative">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-200 ${
                stockStatus.hasStock ? '' : 'opacity-75'
              }`}
            />
            {!stockStatus.hasStock && (
              <div className="absolute inset-0 bg-black/10" />
            )}

            {/* Hover overlay with variants */}
            {isHovered && product.variants && product.variants.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Color variants on hover */}
                <div className="w-full">
                  <h4 className="text-white text-xs mb-1 font-medium">{t('products.availableColors')}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants
                      .filter(variant => variant.quantity > 0) // Filter out variants with zero quantity
                      .map((variant) => (
                      <div
                        key={variant.id}
                        className="group/color relative"
                      >
                        <div
                          className="h-6 w-6 rounded-full border border-white/60 hover:border-white cursor-pointer"
                          style={{ 
                            backgroundColor: variant.color,
                            boxShadow: variant.color.toLowerCase() === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined 
                          }}
                        >
                          {/* Quantity indicator removed */}
                        </div>
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-1 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/color:opacity-100 transition-opacity">
                          {getColorName(variant.color)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Link>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <Link href={`/products/${product.slug}`}>
              <h3 className="font-semibold text-gray-900 hover:text-orange-600 transition-colors truncate">
                {product.name}
              </h3>
            </Link>
            {product.category && (
              <Link href={`/categories/${product.category.slug}`}>
                <p className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                  {product.category.name}
                </p>
              </Link>
            )}
            
            {/* Display description always under the category */}
            <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
              {product.description}
            </p>
          </div>
          {stockStatus.hasStock ? (
            <button
              onClick={handleAddToCart}
              title={t('products.addToCart')}
              className="p-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-colors flex-shrink-0"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          ) : (
            <button
              disabled
              title={t('products.outOfStock')}
              className="p-2 rounded-full bg-gray-300 text-white cursor-not-allowed flex-shrink-0"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {product.salePrice && product.salePrice < product.price && stockStatus.hasStock ? (
                <>
                  <p className="font-bold text-orange-600 truncate">
                    {formatPrice(product.salePrice)}
                  </p>
                  <p className="text-sm text-gray-500 line-through truncate">
                    {formatPrice(product.price)}
                  </p>
                </>
              ) : (
                <p className={`font-bold truncate ${stockStatus.hasStock ? 'text-gray-900' : 'text-gray-500'}`}>
                  {formatPrice(product.price)}
                </p>
              )}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              stockStatus.hasStock 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {stockStatus.hasStock ? t('products.inStock') : t('products.outOfStock')}
            </span>
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        product={product}
      />
    </div>
  );
} 