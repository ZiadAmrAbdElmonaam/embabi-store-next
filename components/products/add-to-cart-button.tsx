'use client';

import { useCart } from "@/hooks/use-cart";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { TranslatedContent } from "@/components/ui/translated-content";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    images: string[];
    slug: string;
    stock: number;
    variants?: Array<{
      id: string;
      color: string;
      quantity: number;
    }>;
    storages?: Array<{
      id: string;
      size: string;
      price: number;
      stock: number;
      variants: Array<{
        id: string;
        color: string;
        quantity: number;
      }>;
    }>;
  };
  selectedColor?: string | null;
  selectedStorage?: string | null;
}

export function AddToCartButton({ product, selectedColor: initialColor, selectedStorage }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor || null);
  const { t } = useTranslation();

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
      return currentStorage.price;
    }
    return product.price;
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

  // Update the useEffect to sync with initialColor changes
  useEffect(() => {
    if (initialColor) {
      setSelectedColor(initialColor);
    }
  }, [initialColor]);

  const handleAddToCart = () => {
    const currentStock = currentStorage ? currentStorage.stock : product.stock;
    
    if (currentStock === 0) {
      toast.error(t('cart.outOfStock'));
      return;
    }
    
    // Check if product has storages and requires storage selection
    if (product.storages && product.storages.length > 0 && !selectedStorage) {
      toast.error(t('cart.selectStorage'));
      return;
    }
    
    // Check if colors are available and require color selection
    if (availableColors.length > 0 && !selectedColor) {
      toast.error(t('cart.selectColor'));
      return;
    }
    
    addItem({
      id: product.id,
      name: product.name,
      price: getCurrentPrice(),
      salePrice: product.salePrice || null,
      images: product.images,
      slug: product.slug,
      selectedColor: selectedColor,
      storageId: selectedStorage,
      variants: product.variants
    });
  };

  return (
    <div className="space-y-6">
      {/* We've removed the color selection UI since it's already in the product details page */}
      
      <button
        onClick={handleAddToCart}
        disabled={(currentStorage ? currentStorage.stock : product.stock) === 0}
        className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="h-5 w-5" />
        {(currentStorage ? currentStorage.stock : product.stock) === 0 ? t('productDetail.outOfStock') : t('cart.addToCart')}
      </button>
    </div>
  );
} 