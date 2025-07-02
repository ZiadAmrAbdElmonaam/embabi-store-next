'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { toast } from 'react-hot-toast';
import { TranslatedContent } from '@/components/ui/translated-content';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice, cn } from '@/lib/utils';

interface ProductStorage {
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
}

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    salePrice?: number | null;
    saleEndDate?: string | null;
    images: string[];
    slug: string;
    colors?: string[];
    variants?: Array<{
      id: string;
      color: string;
      quantity: number;
    }>;
    storages?: ProductStorage[];
  };
}

export function ProductSelectionModal({ isOpen, onClose, product }: ProductSelectionModalProps) {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Get the currently selected storage object
  const currentStorage = selectedStorage 
    ? product.storages?.find(s => s.id === selectedStorage)
    : null;

  // Determine available colors based on storage selection
  const availableColors = currentStorage 
    ? currentStorage.variants.filter(v => v.quantity > 0)
    : product.variants?.filter(v => v.quantity > 0) || [];

  // Determine current price based on storage selection
  const getCurrentPrice = () => {
    if (currentStorage) {
      const storagePrice = currentStorage.price;
      if (currentStorage.salePercentage && currentStorage.saleEndDate && new Date(currentStorage.saleEndDate) > new Date()) {
        return storagePrice - (storagePrice * currentStorage.salePercentage / 100);
      }
      return storagePrice;
    }
    return product.salePrice || product.price;
  };

  const getOriginalPrice = () => {
    if (currentStorage) {
      return currentStorage.price;
    }
    return product.price;
  };

  const isOnSale = () => {
    if (currentStorage) {
      return currentStorage.salePercentage && 
             currentStorage.saleEndDate && 
             new Date(currentStorage.saleEndDate) > new Date();
    }
    return product.salePrice && product.salePrice < product.price;
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

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset selection when modal opens and set default storage
  useEffect(() => {
    if (isOpen) {
      // Set default storage to first available storage
      if (product.storages && product.storages.length > 0) {
        setSelectedStorage(product.storages[0].id);
      } else {
        setSelectedStorage(null);
      }
      setSelectedColor(null);
    }
  }, [isOpen, product.storages]);

  const handleStorageSelect = (storageId: string) => {
    setSelectedStorage(storageId);
    setSelectedColor(null); // Reset color when storage changes
  };

  const handleAddToCart = () => {
    const hasStorages = product.storages && product.storages.length > 0;
    const hasColors = availableColors.length > 0;

    // Check if storage selection is required
    if (hasStorages && !selectedStorage) {
      toast.error(t('cart.selectStorage') || 'Please select a storage option');
      return;
    }

    // Check if color selection is required
    if (hasColors && !selectedColor) {
      toast.error(t('cart.selectColor') || 'Please select a color');
      return;
    }

    // Check stock
    const currentStock = currentStorage ? currentStorage.stock : 
      (product.variants?.find(v => v.color === selectedColor)?.quantity || 0);
    
    if (currentStock === 0) {
      toast.error(t('cart.outOfStock') || 'Out of stock');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: getCurrentPrice(),
      salePrice: getCurrentPrice() < getOriginalPrice() ? getCurrentPrice() : null,
      images: product.images,
      slug: product.slug,
      selectedColor: selectedColor,
      storageId: selectedStorage,
      storageSize: currentStorage?.size || null,
      variants: availableColors.map(c => ({ color: c.color, quantity: c.quantity }))
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {product.name}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Image */}
          <div className="aspect-square relative bg-gray-50 rounded-lg overflow-hidden">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Product Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                <TranslatedContent translationKey="productDetail.productDetails" />
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Price Display */}
          <div className="text-center">
            {isOnSale() ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-600">
                  {formatPrice(getCurrentPrice())}
                </div>
                <div className="text-lg text-gray-500 line-through">
                  {formatPrice(getOriginalPrice())}
                </div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(getCurrentPrice())}
              </div>
            )}
          </div>

          {/* Storage Selection */}
          {product.storages && product.storages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <TranslatedContent translationKey="productDetail.storage" />
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {product.storages.map((storage) => {
                  const storagePrice = storage.price;
                  const isStorageOnSale = storage.salePercentage && 
                    storage.saleEndDate && 
                    new Date(storage.saleEndDate) > new Date();
                  const finalStoragePrice = isStorageOnSale ? 
                    storagePrice - (storagePrice * storage.salePercentage! / 100) : 
                    storagePrice;

                  return (
                    <button
                      key={storage.id}
                      onClick={() => handleStorageSelect(storage.id)}
                      disabled={storage.stock === 0}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md",
                        selectedStorage === storage.id
                          ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 shadow-md"
                          : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 transition-all",
                            selectedStorage === storage.id
                              ? "border-orange-500 bg-orange-500"
                              : "border-gray-300"
                          )}>
                            {selectedStorage === storage.id && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-lg">{storage.size}</div>
                            {storage.stock === 0 && (
                              <div className="text-sm text-red-500 font-medium">Out of stock</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {isStorageOnSale ? (
                            <div>
                              <div className="font-bold text-red-600 text-lg">
                                {formatPrice(finalStoragePrice)}
                              </div>
                              <div className="text-sm text-gray-500 line-through">
                                {formatPrice(storagePrice)}
                              </div>
                              <div className="text-xs text-red-500 font-medium">
                                -{storage.salePercentage}% OFF
                              </div>
                            </div>
                          ) : (
                            <div className="font-bold text-gray-900 text-lg">
                              {formatPrice(storagePrice)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <TranslatedContent translationKey="productDetail.color" />
              </h3>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((colorOption) => (
                  <button
                    key={colorOption.color}
                    onClick={() => setSelectedColor(colorOption.color)}
                    disabled={colorOption.quantity === 0}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md",
                      selectedColor === colorOption.color
                        ? "bg-gradient-to-b from-orange-50 to-orange-100 ring-2 ring-orange-500 shadow-md"
                        : "hover:bg-gray-50 border border-gray-200"
                    )}
                  >
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-full border-3 border-white shadow-lg"
                        style={{
                          backgroundColor: getColorValue(colorOption.color),
                          boxShadow: colorOption.color.toLowerCase() === 'white' ? 
                            'inset 0 0 0 1px rgba(0,0,0,0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 
                            '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      {selectedColor === colorOption.color && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-800">
                      {getColorName(colorOption.color)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <ShoppingCart className="h-6 w-6" />
            <TranslatedContent translationKey="cart.addToCart" />
          </button>
        </div>
      </div>
    </div>
  );
} 