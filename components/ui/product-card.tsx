'use client';

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import Image from 'next/image';
import { useCart } from "@/hooks/use-cart";
import { toast } from "react-hot-toast";
import { WishlistButton } from "./wishlist-button";
import { Star, ShoppingCart, X } from "lucide-react";
import { useTranslation } from '@/hooks/use-translation';
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

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
    rating?: number;
    variants?: Array<{
      id: string;
      color: string;
      quantity: number;
    }>;
    colors?: string[];
  };
  showDescription?: boolean;
}

export function ProductCard({ product, showDescription = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowColorModal(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For products with variants, show color selection modal
    if (product.variants && product.variants.length > 0) {
      // Check if there are any variants with quantity > 0
      const hasAvailableVariants = product.variants.some(variant => variant.quantity > 0);
      
      if (hasAvailableVariants) {
        setShowColorModal(true);
        return;
      }
    }
    
    // For products without variants or with no available variants, add directly to cart
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice || null,
      images: product.images,
      variants: []
    });
  };
  
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };
  
  const handleAddWithColor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedColor) {
      toast.error('Please select a color');
      return;
    }
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice || null,
      images: product.images,
      selectedColor: selectedColor,
      variants: product.variants
    });
    
    setShowColorModal(false);
    setSelectedColor(null);
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
      {product.sale && product.stock > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
          {Math.round(product.sale)}% OFF
        </div>
      )}

      {/* Out of Stock Badge */}
      {product.stock === 0 && (
        <div className="absolute top-2 left-2 z-10 bg-gray-800 text-white px-2 py-1 rounded-full text-sm font-medium">
          Out of Stock
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
                product.stock === 0 ? 'opacity-75' : ''
              }`}
            />
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/10" />
            )}

            {/* Hover overlay with variants */}
            {isHovered && product.variants && product.variants.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Color variants on hover */}
                <div className="w-full">
                  <h4 className="text-white text-xs mb-1 font-medium">Available Colors:</h4>
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
                          {variant.quantity > 0 && (
                            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center">
                              {variant.quantity > 9 ? '9+' : variant.quantity}
                            </span>
                          )}
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
          {product.stock > 0 ? (
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
              title="Out of Stock"
              className="p-2 rounded-full bg-gray-300 text-white cursor-not-allowed flex-shrink-0"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
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

        <div className="mt-2 flex items-center gap-2">
          {product.salePrice && product.salePrice < product.price && product.stock > 0 ? (
            <>
              <p className="font-bold text-orange-600">
                {formatPrice(product.salePrice)}
              </p>
              <p className="text-sm text-gray-500 line-through">
                {formatPrice(product.price)}
              </p>
            </>
          ) : (
            <p className={`font-bold ${product.stock === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
              {formatPrice(product.price)}
            </p>
          )}
          
          {product.stock > 0 && (
            <span className="text-sm text-gray-500">
              ({product.stock} in stock)
            </span>
          )}
        </div>
      </div>

      {/* Color Selection Modal */}
      {showColorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            ref={modalRef}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Color</h3>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setShowColorModal(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                {/* Display colors from variants if available */}
                {product.variants && product.variants
                  .filter(variant => variant.quantity > 0) // Filter out variants with zero quantity
                  .map((variant) => (
                  <div
                    key={variant.id}
                    className="group relative flex flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full border-2 cursor-pointer transition-colors duration-200 shadow-sm flex items-center justify-center",
                        selectedColor === variant.color 
                          ? "border-blue-600 ring-2 ring-blue-600 ring-opacity-50" 
                          : "border-gray-200 hover:border-blue-400"
                      )}
                      style={{ 
                        backgroundColor: getColorValue(variant.color),
                        boxShadow: variant.color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined 
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleColorSelect(variant.color);
                      }}
                    >
                      <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                        {variant.quantity}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {getColorName(variant.color)}
                    </span>
                  </div>
                ))}
                
                {/* Display colors from the colors array if no variants */}
                {!product.variants && product.colors && product.colors.map((color, index) => (
                  <div
                    key={index}
                    className="group relative flex flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full border-2 cursor-pointer transition-colors duration-200 shadow-sm flex items-center justify-center",
                        selectedColor === color 
                          ? "border-blue-600 ring-2 ring-blue-600 ring-opacity-50" 
                          : "border-gray-200 hover:border-blue-400"
                      )}
                      style={{ 
                        backgroundColor: getColorValue(color),
                        boxShadow: color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined 
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleColorSelect(color);
                      }}
                    >
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {getColorName(color)}
                    </span>
                  </div>
                ))}
              </div>
              
              {selectedColor && (
                <p className="text-sm text-center text-gray-600">
                  Selected: <span className="font-medium">{getColorName(selectedColor)}</span>
                </p>
              )}
              
              <button
                onClick={handleAddWithColor}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                disabled={!selectedColor}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 