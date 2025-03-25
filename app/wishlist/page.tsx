'use client';

import { useEffect, useState, useRef } from "react";
import { Heart, Trash2, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TranslatedContent } from "@/components/ui/translated-content";
import { useTranslation } from "@/hooks/use-translation";

export default function WishlistPage() {
  const { items, removeItem, syncWithServer, isInitialized } = useWishlist();
  const { addItem: addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<typeof items[0] | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const initWishlist = async () => {
      if (!isInitialized) {
        await syncWithServer();
      }
      setIsLoading(false);
    };

    initWishlist();
  }, [syncWithServer, isInitialized]);

  useEffect(() => {
    if (!isLoading) {
      syncWithServer();
    }
  }, [syncWithServer, isLoading]);

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
  }, []);

  const handleRemoveFromWishlist = (id: string) => {
    removeItem(id);
  };

  const getColorName = (color: string) => {
    // First check if color is in translations
    const colorKey = `colors.${color.toLowerCase()}`;
    const translatedColor = t(colorKey);
    
    // If translation exists and isn't the same as the key, return translated color
    if (translatedColor !== colorKey) {
      return translatedColor;
    }
    
    // Fallback to default English names
    const colorMap: { [key: string]: string } = {
      "red": "Red",
      "blue": "Blue",
      "green": "Green",
      "yellow": "Yellow",
      "purple": "Purple",
      "pink": "Pink",
      "black": "Black",
      "white": "White",
      "gray": "Gray",
      "orange": "Orange",
      "brown": "Brown",
      "gold": "Gold",
      "silver": "Silver"
    };
    return colorMap[color.toLowerCase()] || color;
  };

  const getColorValue = (color: string) => {
    // If color is already a hex value, return it
    if (color.startsWith('#')) return color;
    
    // Map color names to hex values
    const colorMap: { [key: string]: string } = {
      "red": "#FF0000",
      "blue": "#0000FF",
      "green": "#00FF00",
      "yellow": "#FFFF00",
      "purple": "#800080",
      "pink": "#FFC0CB",
      "black": "#000000",
      "white": "#FFFFFF",
      "gray": "#808080",
      "orange": "#FFA500",
      "brown": "#A52A2A",
      "gold": "#FFD700",
      "silver": "#C0C0C0"
    };
    return colorMap[color.toLowerCase()] || color;
  };

  const handleAddToCart = (item: typeof items[0]) => {
    // Check if the item has variants
    if (item.variants && item.variants.length > 0) {
      // Show color selection modal
      setSelectedItem(item);
      setShowColorModal(true);
      return;
    }
    
    // For items without variants, add directly to cart
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      salePrice: item.salePrice,
      images: item.images,
      variants: []
    });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleAddWithColor = () => {
    if (!selectedItem) return;
    if (!selectedColor) {
      toast.error(t('products.selectColor'));
      return;
    }
    
    // Create variants array with proper structure
    const itemVariants = selectedItem.variants || [];
    
    addToCart({
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      salePrice: selectedItem.salePrice,
      images: selectedItem.images,
      selectedColor: selectedColor,
      variants: itemVariants
    });
    
    setShowColorModal(false);
    setSelectedColor(null);
    setSelectedItem(null);
  };

  const calculateDiscount = (price: number, salePrice: number | null) => {
    if (!salePrice) return 0;
    const discount = ((price - salePrice) / price) * 100;
    return Math.round(discount);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-rose-100 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-16 h-16 text-rose-500 dark:text-rose-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <TranslatedContent translationKey="wishlist.title" />
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            <TranslatedContent translationKey="wishlist.subtitle" />
          </p>
        </div>

        {/* Wishlist Content */}
        <div className=" dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-gray-700 mb-4">
                <Heart className="h-8 w-8 text-rose-500 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                <TranslatedContent translationKey="wishlist.empty" />
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                <TranslatedContent translationKey="wishlist.emptyMessage" />
              </p>
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 bg-rose-600 border border-transparent rounded-md font-medium text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                <TranslatedContent translationKey="wishlist.browse" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => handleRemoveFromWishlist(item.id)}
                    className="absolute right-2 top-2 z-10 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-300"
                  >
                    <Trash2
                      className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400"
                    />
                  </button>
                  <Link href={`/products/${item.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden">
                      {item.images[0] && (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                      
                      {/* Sale badge if on sale */}
                      {item.salePrice && item.salePrice < item.price && (
                        <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                          {calculateDiscount(Number(item.price), Number(item.salePrice))}% <TranslatedContent translationKey="products.off" />
                        </span>
                      )}
                    </div>
                    <div className="p-2 sm:p-4">
                      <h3 className="font-semibold text-sm sm:text-lg text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors duration-300 line-clamp-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="mt-1 sm:mt-2 text-gray-600 dark:text-gray-300 text-xs sm:text-sm line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2 sm:mt-3 flex items-center justify-between">
                        <div className="space-y-1">
                          {item.salePrice && Number(item.salePrice) < Number(item.price) ? (
                            <>
                              <div className="text-sm sm:text-lg font-bold text-rose-600 dark:text-rose-400">
                                {formatPrice(Number(item.salePrice))}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                                {formatPrice(Number(item.price))}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                              {formatPrice(Number(item.price))}
                            </div>
                          )}
                        </div>
                        
                        {/* Add to Cart Button */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(item);
                          }}
                          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-rose-100 dark:bg-gray-700 rounded-full hover:bg-rose-200 dark:hover:bg-gray-600 transition-colors duration-300"
                          aria-label="Add to cart"
                        >
                          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Color Selection Modal */}
      {showColorModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                <TranslatedContent translationKey="products.selectColorFor" /> {selectedItem.name}
              </h3>
              <button 
                onClick={() => setShowColorModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                {/* Display colors from variants if available */}
                {selectedItem.variants && selectedItem.variants
                  .filter(variant => variant.quantity && variant.quantity > 0) // Filter out variants with zero quantity
                  .map((variant, index) => (
                  <div
                    key={index}
                    className="group relative flex flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full border-2 cursor-pointer transition-colors duration-200 shadow-sm flex items-center justify-center",
                        selectedColor === variant.color 
                          ? "border-rose-600 ring-2 ring-rose-600 ring-opacity-50" 
                          : "border-gray-200 hover:border-rose-400"
                      )}
                      style={{ 
                        backgroundColor: getColorValue(variant.color),
                        boxShadow: variant.color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined 
                      }}
                      onClick={() => handleColorSelect(variant.color)}
                    >
                      {/* No content here */}
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {getColorName(variant.color)}
                    </span>
                  </div>
                ))}
              </div>
              
              {selectedColor && (
                <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                  <TranslatedContent translationKey="products.selected" />: <span className="font-medium">{getColorName(selectedColor)}</span>
                </p>
              )}
              
              <button
                onClick={handleAddWithColor}
                className="w-full bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed mt-2 transition-colors duration-300"
                disabled={!selectedColor}
              >
                <TranslatedContent translationKey="wishlist.addToCart" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 