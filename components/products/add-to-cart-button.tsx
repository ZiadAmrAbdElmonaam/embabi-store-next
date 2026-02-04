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
      salePercentage?: number | null;
      saleEndDate?: string | null;
      units?: Array<{
        id: string;
        color: string;
        stock: number;
        taxStatus?: string;
        taxType?: string;
        taxAmount?: number | null;
        taxPercentage?: number | null;
      }>;
      variants?: Array<{ id: string; color: string; quantity: number }>;
    }>;
  };
  selectedColor?: string | null;
  selectedStorage?: string | null;
  selectedUnitId?: string | null;
}

function getUnitPrice(basePrice: number, salePct: number | null, saleEnd: string | null, unit: { taxStatus?: string; taxType?: string; taxAmount?: number | null; taxPercentage?: number | null }) {
  const salePrice = salePct != null && saleEnd && new Date(saleEnd) > new Date()
    ? basePrice - (basePrice * (salePct / 100))
    : basePrice;
  if (unit.taxStatus === 'UNPAID') return salePrice;
  if (unit.taxType === 'FIXED') return salePrice + (Number(unit.taxAmount) || 0);
  return salePrice + (salePrice * (Number(unit.taxPercentage) || 0) / 100);
}

export function AddToCartButton({ product, selectedColor: initialColor, selectedStorage, selectedUnitId }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor || null);
  const { t } = useTranslation();

  const currentStorage = selectedStorage 
    ? product.storages?.find(s => s.id === selectedStorage)
    : null;

  const units = currentStorage?.units ?? currentStorage?.variants?.map(v => ({ id: v.color, color: v.color, stock: v.quantity })) ?? [];
  const availableColors = currentStorage 
    ? units.filter((u: { stock: number }) => u.stock > 0)
    : product.variants?.filter(v => v.quantity > 0) || [];

  const selectedUnit = selectedUnitId ? units.find((u: { id: string }) => u.id === selectedUnitId) : units[0];
  const currentStock = currentStorage
    ? (selectedUnit?.stock ?? units.reduce((s: number, u: { stock: number }) => s + u.stock, 0))
    : (product.stock ?? 0);

  const getCurrentPrice = () => {
    if (currentStorage && selectedUnit) {
      const unitWithTax = selectedUnit as { taxStatus?: string; taxType?: string; taxAmount?: number | null; taxPercentage?: number | null };
      return getUnitPrice(
        Number(currentStorage.price),
        currentStorage.salePercentage ?? null,
        currentStorage.saleEndDate ?? null,
        unitWithTax.taxStatus ? unitWithTax : { taxStatus: 'PAID', taxType: 'FIXED' }
      );
    }
    if (currentStorage) return Number(currentStorage.price);
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
    if (currentStock === 0) {
      toast.error(t('cart.outOfStock'));
      return;
    }
    if (product.storages && product.storages.length > 0 && !selectedStorage) {
      toast.error(t('cart.selectStorage'));
      return;
    }
    if (availableColors.length > 0 && !selectedColor && !selectedUnitId) {
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
      unitId: currentStorage ? selectedUnitId : undefined,
      variants: product.variants
    });
  };

  return (
    <div className="space-y-6">
      {/* We've removed the color selection UI since it's already in the product details page */}
      
      <button
        onClick={handleAddToCart}
        disabled={currentStock === 0}
        className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-4 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        <ShoppingCart className="h-5 w-5 flex-shrink-0" />
        <span className="whitespace-nowrap">
          {currentStock === 0 ? t('productDetail.outOfStock') : t('cart.addToCart')}
        </span>
      </button>
    </div>
  );
} 