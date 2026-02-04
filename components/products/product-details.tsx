'use client';

import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { formatPrice } from "@/lib/utils";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

type UnitWithTax = {
  id: string;
  color: string;
  stock: number;
  taxStatus?: string;
  taxType?: string;
  taxAmount?: number | null;
  taxPercentage?: number | null;
};

interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    salePrice?: number | null;
    sale?: number | null;
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
    storages: Array<{
      id: string;
      size: string;
      price: number;
      salePercentage?: number | null;
      saleEndDate?: string | null;
      units?: Array<{
        id: string;
        color: string;
        stock: number;
        taxStatus: string;
        taxType: string;
        taxAmount?: number | null;
        taxPercentage?: number | null;
      }>;
      variants?: Array<{ id: string; color: string; quantity: number }>;
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

function getUnitPrice(basePrice: number, salePct: number | null, saleEnd: string | null, unit: { taxStatus: string; taxType: string; taxAmount?: number | null; taxPercentage?: number | null }) {
  const salePrice = salePct != null && saleEnd && new Date(saleEnd) > new Date()
    ? basePrice - (basePrice * (salePct / 100))
    : basePrice;
  if (unit.taxStatus === 'UNPAID') return salePrice;
  if (unit.taxType === 'FIXED') return salePrice + (Number(unit.taxAmount) || 0);
  return salePrice + (salePrice * (Number(unit.taxPercentage) || 0) / 100);
}

/** Generated note from PAID/UNPAID and tax: "Tax Included" / "عليه ضريبة : 3,450 EGP" / "عليه ضريبة : 15%" */
function getUnitTaxNote(
  unit: { taxStatus?: string; taxType?: string; taxAmount?: number | null; taxPercentage?: number | null },
  t: (key: string) => string,
  formatPrice: (price: number) => string
): string {
  const status = unit.taxStatus ?? 'UNPAID';
  if (status === 'PAID') return t('productDetail.taxIncluded');
  const taxType = unit.taxType ?? 'FIXED';
  if (taxType === 'FIXED' && unit.taxAmount != null && Number(unit.taxAmount) > 0) {
    return t('productDetail.taxNoteLabel') + formatPrice(Number(unit.taxAmount));
  }
  if (taxType === 'PERCENTAGE' && unit.taxPercentage != null && Number(unit.taxPercentage) > 0) {
    return t('productDetail.taxNoteLabel') + Number(unit.taxPercentage) + '%';
  }
  return t('productDetail.taxExcluded');
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const hasStorageWithStock = product.storages?.some(s => (s.units ?? s.variants ?? []).some((u: { stock?: number; quantity?: number }) => (u.stock ?? u.quantity ?? 0) > 0));
  const isFullyOutOfStock = product.storages?.length
    ? !hasStorageWithStock
    : (product.stock ?? 0) <= 0;
  const firstStorageWithStock = product.storages?.find(s => (s.units ?? s.variants ?? []).some((u: { stock?: number; quantity?: number }) => (u.stock ?? u.quantity ?? 0) > 0));
  const [selectedStorage, setSelectedStorage] = useState<string | null>(
    product.storages && product.storages.length > 0 && hasStorageWithStock
      ? firstStorageWithStock?.id || product.storages[0]?.id || null
      : null
  );
  const [showImage, setShowImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.images[0] || '/images/placeholder.png');
  const { t, lang } = useTranslation();
  const isRtl = lang === 'ar';

  // Get the currently selected storage object
  const currentStorage = selectedStorage 
    ? product.storages.find(s => s.id === selectedStorage)
    : null;

  // Raw units from storage (or variants for legacy)
  const rawUnits = currentStorage?.units ?? currentStorage?.variants?.map((v: { color: string; quantity: number }) => ({ id: v.color, color: v.color, stock: v.quantity, taxStatus: 'UNPAID', taxType: 'FIXED' })) ?? [];
  const units = rawUnits as UnitWithTax[];

  // Group units by color: each color appears once, with all its units (PAID/UNPAID)
  const colorsGrouped = useMemo(() => {
    if (!currentStorage) return [];
    const withStock = units.filter(u => (u.stock ?? 0) > 0);
    const byColor = new Map<string, UnitWithTax[]>();
    for (const u of withStock) {
      const arr = byColor.get(u.color) ?? [];
      arr.push(u);
      byColor.set(u.color, arr);
    }
    return Array.from(byColor.entries()).map(([color, us]) => ({ color, units: us }));
  }, [currentStorage, units]);

  // For simple products (variants)
  const availableVariants = useMemo(
    () => (!currentStorage
      ? (product.variants ?? []).filter(v => v.quantity > 0).map(v => ({ id: v.color, color: v.color, stock: v.quantity }))
      : []),
    [currentStorage, product.variants]
  );

  // Get lowest-price unit from a list (optionally pass storage for use when currentStorage may not be updated yet)
  const getLowestPriceUnit = useCallback((unitList: UnitWithTax[], forStorage?: { price: number; salePercentage?: number | null; saleEndDate?: string | null }): UnitWithTax => {
    const storage = forStorage ?? currentStorage;
    if (!storage || unitList.length === 0) return unitList[0];
    const basePrice = Number(storage.price);
    const salePct = storage.salePercentage ?? null;
    const saleEnd = storage.saleEndDate ?? null;
    let best = unitList[0];
    let bestPrice = getUnitPrice(basePrice, salePct, saleEnd, { ...best, taxStatus: best.taxStatus ?? 'UNPAID', taxType: best.taxType ?? 'FIXED' });
    for (let i = 1; i < unitList.length; i++) {
      const u = unitList[i];
      const p = getUnitPrice(basePrice, salePct, saleEnd, { ...u, taxStatus: u.taxStatus ?? 'UNPAID', taxType: u.taxType ?? 'FIXED' });
      if (p < bestPrice) {
        bestPrice = p;
        best = unitList[i];
      }
    }
    return best;
  }, [currentStorage]);

  // Default: when storage changes, pick first color and lowest price unit
  useEffect(() => {
    if (!currentStorage || colorsGrouped.length === 0) return;
    const first = colorsGrouped[0];
    const lowest = getLowestPriceUnit(first.units);
    setSelectedColor(first.color);
    setSelectedUnitId(lowest.id);
  }, [currentStorage, colorsGrouped, getLowestPriceUnit]);

  const selectedUnit = useMemo(() => {
    if (selectedUnitId) return units.find(u => u.id === selectedUnitId) as UnitWithTax | undefined;
    if (currentStorage && selectedColor) {
      const group = colorsGrouped.find(g => g.color === selectedColor);
      return group ? getLowestPriceUnit(group.units) : undefined;
    }
    if (!currentStorage && availableVariants.length > 0) return availableVariants[0] as UnitWithTax;
    return undefined;
  }, [selectedUnitId, selectedColor, units, colorsGrouped, availableVariants, currentStorage, getLowestPriceUnit]);

  const unitsForSelectedColor = selectedColor ? colorsGrouped.find(g => g.color === selectedColor)?.units ?? [] : [];
  const hasMultipleTaxOptions = unitsForSelectedColor.length > 1;

  const getCurrentPrice = () => {
    // Use selectedUnit, or fallback to first color's lowest unit when storage has units but selection not yet set
    const effectiveUnit = selectedUnit ?? (currentStorage && colorsGrouped.length > 0 ? getLowestPriceUnit(colorsGrouped[0].units) : undefined);
    if (currentStorage && effectiveUnit) {
      const basePrice = Number(currentStorage.price);
      const salePct = currentStorage.salePercentage ?? null;
      const saleEnd = currentStorage.saleEndDate ?? null;
      const calcPrice = getUnitPrice(basePrice, salePct, saleEnd, effectiveUnit as { taxStatus: string; taxType: string; taxAmount?: number | null; taxPercentage?: number | null });
      const origPrice = getUnitPrice(basePrice, null, null, effectiveUnit as { taxStatus: string; taxType: string; taxAmount?: number | null; taxPercentage?: number | null });
      const onSale = salePct != null && saleEnd && new Date(saleEnd) > new Date();
      return { price: onSale ? origPrice : calcPrice, salePrice: onSale ? calcPrice : null };
    }
    if (currentStorage) {
      const basePrice = Number(currentStorage.price);
      if (currentStorage.salePercentage && currentStorage.saleEndDate && new Date(currentStorage.saleEndDate) > new Date()) {
        const salePrice = basePrice - (basePrice * (currentStorage.salePercentage / 100));
        return { price: basePrice, salePrice };
      }
      return { price: basePrice, salePrice: null };
    }
    // Simple product: show salePrice only when sale is active
    const basePrice = Number(product.price ?? 0);
    let salePrice: number | null = null;
    const salePct = product.sale != null ? Number(product.sale) : null;
    const saleEnd = product.saleEndDate ?? null;
    const onSale = salePct != null && saleEnd && new Date(saleEnd) > new Date();
    if (onSale && basePrice > 0) {
      salePrice = product.salePrice != null ? Number(product.salePrice) : basePrice - (basePrice * (salePct! / 100));
    }
    return { price: basePrice, salePrice };
  };

  const { price, salePrice } = getCurrentPrice();

  const calculateDiscount = () => {
    if (!salePrice || !price) return 0;
    const discount = ((price - salePrice) / price) * 100;
    return Math.round(discount);
  };

  const handleStorageSelect = (storageId: string) => {
    // Don't clear selection when clicking the same storage
    if (storageId === selectedStorage) return;

    const newStorage = product.storages?.find(s => s.id === storageId);
    if (!newStorage || !newStorage.units?.length) {
      setSelectedStorage(storageId);
      setSelectedColor(null);
      setSelectedUnitId(null);
      return;
    }

    // Compute default color and unit synchronously to avoid base-price flash
    const withStock = (newStorage.units as UnitWithTax[]).filter(u => (u.stock ?? 0) > 0);
    if (withStock.length === 0) {
      setSelectedStorage(storageId);
      setSelectedColor(null);
      setSelectedUnitId(null);
      return;
    }
    const byColor = new Map<string, UnitWithTax[]>();
    for (const u of withStock) {
      const arr = byColor.get(u.color) ?? [];
      arr.push(u);
      byColor.set(u.color, arr);
    }
    const firstColor = Array.from(byColor.keys())[0];
    const firstUnits = byColor.get(firstColor) ?? [];
    const lowest = getLowestPriceUnit(firstUnits, newStorage as { price: number; salePercentage?: number | null; saleEndDate?: string | null });

    setSelectedStorage(storageId);
    setSelectedColor(firstColor);
    setSelectedUnitId(lowest.id);
  };

  const handleColorSelect = (color: string) => {
    const group = colorsGrouped.find(g => g.color === color);
    if (!group) return;
    const lowest = getLowestPriceUnit(group.units);
    setSelectedColor(color);
    setSelectedUnitId(lowest.id);
  };

  const handleTaxSelect = (unit: UnitWithTax) => {
    setSelectedUnitId(unit.id);
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
          <div className="aspect-square relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
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
              className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-4 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors`}
            >
              {showImage ? <EyeOff className="h-5 w-5 dark:text-gray-200" /> : <Eye className="h-5 w-5 dark:text-gray-200" />}
            </button>
          </div>
          
          {/* Thumbnails or Additional Images */}
          {(product.thumbnails && product.thumbnails.length > 0) ? (
            <div className="grid grid-cols-5 gap-4">
              {/* Main image as first thumbnail */}
              <div
                className={cn(
                  "aspect-square relative overflow-hidden rounded-xl border hover:border-orange-500 transition-colors duration-200 cursor-pointer",
                  selectedImage === product.images[0] ? "border-orange-500 ring-2 ring-orange-500 ring-opacity-50" : "border-gray-200 dark:border-gray-700"
                )}
                onClick={() => handleImageSelect(product.images[0])}
              >
                <Image
                  src={product.images[0]}
                  alt={`${product.name} main image`}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Additional thumbnails */}
              {product.thumbnails.slice(0, 4).map((thumbnail, index) => (
                <div
                  key={index}
                  className={cn(
                    "aspect-square relative overflow-hidden rounded-xl border hover:border-orange-500 transition-colors duration-200 cursor-pointer",
                    selectedImage === thumbnail ? "border-orange-500 ring-2 ring-orange-500 ring-opacity-50" : "border-gray-200 dark:border-gray-700"
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
                    selectedImage === image ? "border-orange-500 ring-2 ring-orange-500 ring-opacity-50" : "border-gray-200 dark:border-gray-700"
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
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{product.name}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">{product.category.name}</p>
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

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{product.description}</p>
          </div>

          {/* Storage Selection */}
          {product.storages && product.storages.length > 0 && product.storages.some(s => (s.units ?? []).some((u: { stock: number }) => u.stock > 0)) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('productDetail.selectStorage')}</h3>
              <div className="flex flex-wrap gap-3">
                {product.storages
                  .filter(storage => (storage.units ?? []).some((u: { stock: number }) => u.stock > 0))
                  .map((storage) => (
                    <button
                      key={storage.id}
                      className={cn(
                        "px-4 py-2 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md font-medium",
                        selectedStorage === storage.id 
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" 
                          : "border-gray-200 dark:border-gray-700 hover:border-orange-300 text-gray-700 dark:text-gray-300"
                      )}
                      onClick={() => handleStorageSelect(storage.id)}
                    >
                      {storage.size}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Colors / Units Section */}
          {(colorsGrouped.length > 0 || availableVariants.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('productDetail.availableColors')}
              </h3>
              {/* Storage: one color per option, grouped by color */}
              {currentStorage && colorsGrouped.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-3">
                    {colorsGrouped.map(({ color }) => (
                      <div key={color} className="group relative flex flex-col items-center">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-full border-2 cursor-pointer transition-all duration-200 shadow-sm flex items-center justify-center",
                            selectedColor === color
                              ? "border-orange-500 ring-2 ring-orange-500 ring-opacity-50 scale-110"
                              : "border-gray-200 dark:border-gray-700 hover:border-orange-500"
                          )}
                          style={{ 
                            backgroundColor: getColorValue(color),
                            boxShadow: color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined 
                          }}
                          onClick={() => handleColorSelect(color)}
                        />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          {getColorName(color)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Tax selector: only when selected color has both PAID and UNPAID */}
                  {selectedColor && hasMultipleTaxOptions && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('productDetail.selected')}: {getColorName(selectedColor)} — {t('productDetail.taxIncluded')} / {t('productDetail.taxExcluded')}
                      </p>
                      <div className="flex gap-3">
                        {unitsForSelectedColor.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleTaxSelect(u)}
                            className={cn(
                              "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                              selectedUnitId === u.id
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                                : "border-gray-200 dark:border-gray-700 hover:border-orange-300 text-gray-700 dark:text-gray-300"
                            )}
                          >
                            {getUnitTaxNote(u, t, (p) => formatPrice(p))}
                            <span className="ml-2 text-xs opacity-80">
                              ({formatPrice(getUnitPrice(Number(currentStorage.price), currentStorage.salePercentage ?? null, currentStorage.saleEndDate ?? null, { ...u, taxStatus: u.taxStatus ?? 'UNPAID', taxType: u.taxType ?? 'FIXED' }))})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Selected summary when single tax option */}
                  {selectedUnit && !hasMultipleTaxOptions && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-900/50">
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <span className="w-4 h-4 rounded-full mr-2 shrink-0" style={{ backgroundColor: getColorValue(selectedUnit.color) }}></span>
                        {t('productDetail.selected')}: <span className="font-medium text-gray-900 dark:text-white ml-1">{getColorName(selectedUnit.color)}</span>
                      </p>
                    </div>
                  )}
                </>
              )}
              {/* Simple product: color variants (no grouping) */}
              {!currentStorage && availableVariants.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {availableVariants.map((v) => (
                    <div
                      key={v.id}
                      className={cn(
                        "h-12 w-12 rounded-full border-2 cursor-pointer transition-all",
                        selectedColor === v.color ? "border-orange-500 ring-2 ring-orange-500" : "border-gray-200 dark:border-gray-700"
                      )}
                      style={{ backgroundColor: getColorValue(v.color) }}
                      onClick={() => { setSelectedColor(v.color); setSelectedUnitId(v.id); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Price Section */}
          <div className="py-6 border-y border-gray-200 dark:border-gray-700 space-y-4">
            <div className="space-y-4">
              <div className="space-y-1">
                {isFullyOutOfStock ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 space-y-4">
                    <span className="inline-flex px-4 py-2 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                      {t('productDetail.outOfStock')}
                    </span>
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 transition-colors shadow-sm hover:shadow group"
                    >
                      {t('productDetail.exploreMoreProducts')}
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                ) : salePrice ? (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-500">
                        {formatPrice(salePrice)}
                      </span>
                      <span className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(price)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 w-fit">
                        {t('productDetail.save')} {calculateDiscount()}%
                      </span>
                      {currentStorage?.saleEndDate && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('productDetail.saleEnds')} {formatDate(currentStorage.saleEndDate)}
                        </span>
                      )}
                      {!currentStorage && product.saleEndDate && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('productDetail.saleEnds')} {formatDate(product.saleEndDate)}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(price)}
                  </span>
                )}
                {/* Generated tax note: PAID → Tax included; UNPAID with tax → عليه ضريبة : amount; UNPAID no tax → Tax excluded */}
                {currentStorage && selectedUnit && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 pt-2">
                    {getUnitTaxNote(selectedUnit, t, (p) => formatPrice(p))}
                  </p>
                )}
                {/* Other disclaimer text (only when in stock) */}
              </div>
              
              {/* Stock Status - Only show if out of stock (not already shown in price section) */}
              {!isFullyOutOfStock && (currentStorage ? (selectedUnit?.stock ?? (currentStorage.units ?? []).reduce((s: number, u: { stock?: number }) => s + (u.stock ?? 0), 0)) : (product.stock ?? 0)) === 0 && (
                <div className="flex justify-center">
                  <span className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                    {t('productDetail.outOfStock')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <AddToCartButton 
              product={product}
              selectedColor={selectedColor}
              selectedStorage={selectedStorage}
              selectedUnitId={currentStorage ? selectedUnitId : null}
            />
            <WishlistButton 
              productId={product.id} 
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                salePrice: product.salePrice || null,
                images: product.images,
                slug: product.slug,
                description: product.description,
                variants: product.variants
              }}
              variant="full"
              className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-4 px-6 rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-base font-medium"
            />
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      {product.details && product.details.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-16 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('productDetail.productDetails')}</h2>
          
          <div className="grid grid-cols-1 gap-8">
            {product.details.map((detail) => (
              <div key={detail.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{detail.label}</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{detail.description}</p>
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
              className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-4 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors`}
            >
              <EyeOff className="h-5 w-5 dark:text-gray-200" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 