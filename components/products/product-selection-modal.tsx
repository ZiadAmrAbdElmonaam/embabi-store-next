'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
  salePercentage?: number | null;
  saleEndDate?: string | null;
  units?: Array<{ id: string; color: string; stock: number; taxStatus?: string; taxType?: string; taxAmount?: number | null; taxPercentage?: number | null }>;
  variants?: Array<{ id: string; color: string; quantity: number }>;
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
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const currentStorage = selectedStorage 
    ? product.storages?.find(s => s.id === selectedStorage)
    : null;

  type UnitWithTax = { id: string; color: string; stock: number; taxStatus?: string; taxType?: string; taxAmount?: number | null; taxPercentage?: number | null };
  const rawUnits = currentStorage?.units ?? currentStorage?.variants?.map(v => ({ id: v.color, color: v.color, stock: v.quantity, taxStatus: 'UNPAID' as const })) ?? [];
  const units = rawUnits as UnitWithTax[];

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

  const getLowestPriceUnit = (unitList: UnitWithTax[], forStorage?: { price: number; salePercentage?: number | null; saleEndDate?: string | null }): UnitWithTax => {
    const storage = forStorage ?? currentStorage;
    if (!storage || unitList.length === 0) return unitList[0];
    const base = Number(storage.price);
    const salePrice = storage.salePercentage && storage.saleEndDate && new Date(storage.saleEndDate) > new Date()
      ? base - (base * storage.salePercentage / 100) : base;
    const calcPrice = (u: UnitWithTax) => {
      if (u.taxStatus === 'UNPAID') return salePrice;
      if (u.taxType === 'FIXED') return salePrice + (Number(u.taxAmount) || 0);
      return salePrice + (salePrice * (Number(u.taxPercentage) || 0) / 100);
    };
    let best = unitList[0];
    let bestPrice = calcPrice(best);
    for (let i = 1; i < unitList.length; i++) {
      const p = calcPrice(unitList[i]);
      if (p < bestPrice) { bestPrice = p; best = unitList[i]; }
    }
    return best;
  };

  const availableUnits = currentStorage 
    ? units.filter((u: { stock: number }) => u.stock > 0)
    : product.variants?.filter(v => v.quantity > 0).map(v => ({ id: v.color, color: v.color, stock: v.quantity })) || [];

  function getUnitPrice(unit: { taxStatus?: string; taxType?: string; taxAmount?: number | null; taxPercentage?: number | null }) {
    const base = currentStorage?.price ?? 0;
    const salePrice = currentStorage?.salePercentage && currentStorage?.saleEndDate && new Date(currentStorage.saleEndDate) > new Date()
      ? base - (base * currentStorage.salePercentage / 100)
      : base;
    if (unit?.taxStatus === 'UNPAID') return salePrice;
    if (unit?.taxType === 'FIXED') return salePrice + (Number(unit.taxAmount) || 0);
    return salePrice + (salePrice * (Number(unit?.taxPercentage) || 0) / 100);
  }

  const unitsForSelectedColor = selectedColor ? colorsGrouped.find(g => g.color === selectedColor)?.units ?? [] : [];
  const hasMultipleTaxOptions = unitsForSelectedColor.length > 1;
  const selectedUnit = selectedUnitId
    ? units.find((u: { id: string }) => u.id === selectedUnitId)
    : (selectedColor && unitsForSelectedColor.length > 0 ? getLowestPriceUnit(unitsForSelectedColor) : availableUnits[0]);
  const getCurrentPrice = () => {
    if (currentStorage && selectedUnit) {
      const u = selectedUnit as { taxStatus?: string; taxType?: string; taxAmount?: number | null; taxPercentage?: number | null };
      return getUnitPrice(u.taxStatus ? u : { taxStatus: 'PAID', taxType: 'FIXED' });
    }
    if (currentStorage) {
      const p = Number(currentStorage.price);
      if (currentStorage.salePercentage && currentStorage.saleEndDate && new Date(currentStorage.saleEndDate) > new Date()) {
        return p - (p * currentStorage.salePercentage / 100);
      }
      return p;
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

  // Reset selection when modal opens and set default storage + first color with lowest unit
  useEffect(() => {
    if (isOpen) {
      if (product.storages && product.storages.length > 0) {
        setSelectedStorage(product.storages[0].id);
      } else {
        setSelectedStorage(null);
      }
      setSelectedColor(null);
      setSelectedUnitId(null);
    }
  }, [isOpen, product.storages]);

  useEffect(() => {
    if (!currentStorage || colorsGrouped.length === 0) return;
    const first = colorsGrouped[0];
    const lowest = getLowestPriceUnit(first.units);
    setSelectedColor(first.color);
    setSelectedUnitId(lowest.id);
  }, [selectedStorage, colorsGrouped]);

  const handleStorageSelect = (storageId: string) => {
    if (storageId === selectedStorage) return;

    const newStorage = product.storages?.find(s => s.id === storageId);
    if (!newStorage || !(newStorage.units ?? []).length) {
      setSelectedStorage(storageId);
      setSelectedColor(null);
      setSelectedUnitId(null);
      return;
    }

    const us = (newStorage.units ?? []) as UnitWithTax[];
    const withStock = us.filter(u => (u.stock ?? 0) > 0);
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

  const handleAddToCart = () => {
    const hasStorages = product.storages && product.storages.length > 0;
    const hasUnits = availableUnits.length > 0;

    if (hasStorages && !selectedStorage) {
      toast.error(t('cart.selectStorage') || 'Please select a storage option');
      return;
    }
    if (hasUnits && !selectedColor && !selectedUnitId) {
      toast.error(t('cart.selectColor') || 'Please select an option');
      return;
    }

    const currentStock = currentStorage
      ? (selectedUnit?.stock ?? (units as { stock: number }[]).reduce((s, u) => s + u.stock, 0))
      : (product.variants?.find(v => v.color === selectedColor)?.quantity || 0);
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
      unitId: currentStorage ? (selectedUnit?.id ?? selectedUnitId) : undefined,
      storageSize: currentStorage?.size || null,
      variants: availableUnits.map((u: { color: string; stock: number }) => ({ color: u.color, quantity: u.stock }))
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
            {currentStorage && selectedUnit && (selectedUnit as { taxStatus?: string }).taxStatus && (
              <p className="text-sm text-gray-500 mt-2">
                {(selectedUnit as { taxStatus: string }).taxStatus === 'PAID' ? t('productDetail.taxIncluded') : t('productDetail.taxExcluded')}
              </p>
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
                  const storagePrice = Number(storage.price);
                  const isStorageOnSale = storage.salePercentage && 
                    storage.saleEndDate && 
                    new Date(storage.saleEndDate) > new Date();
                  const finalStoragePrice = isStorageOnSale ? 
                    storagePrice - (storagePrice * storage.salePercentage! / 100) : 
                    storagePrice;
                  const storageUnits = storage.units ?? storage.variants?.map((v: { color: string; quantity: number }) => ({ stock: v.quantity })) ?? [];
                  const hasStock = storageUnits.some((u: { stock?: number }) => (u.stock ?? 0) > 0);

                  return (
                    <button
                      key={storage.id}
                      onClick={() => handleStorageSelect(storage.id)}
                      disabled={!hasStock}
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
                            {!hasStock && (
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

          {/* Color / Unit Selection */}
          {(colorsGrouped.length > 0 || availableUnits.length > 0) && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <TranslatedContent translationKey="productDetail.color" />
              </h3>
              {currentStorage && colorsGrouped.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-3">
                    {colorsGrouped.map(({ color }) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:shadow-md",
                          selectedColor === color
                            ? "bg-gradient-to-b from-orange-50 to-orange-100 ring-2 ring-orange-500 shadow-md"
                            : "hover:bg-gray-50 border border-gray-200"
                        )}
                      >
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
                          style={{
                            backgroundColor: getColorValue(color),
                            boxShadow: color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined
                          }}
                        />
                        <span className="text-xs font-semibold text-gray-800">{getColorName(color)}</span>
                      </button>
                    ))}
                  </div>
                  {selectedColor && hasMultipleTaxOptions && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        {t('productDetail.selected')}: {getColorName(selectedColor)} — {t('productDetail.taxIncluded')} / {t('productDetail.taxExcluded')}
                      </p>
                      <div className="flex gap-2">
                        {unitsForSelectedColor.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleTaxSelect(u)}
                            className={cn(
                              "px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                              selectedUnitId === u.id
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-gray-200 hover:border-orange-300 text-gray-700"
                            )}
                          >
                            {u.taxStatus === 'PAID' ? t('productDetail.taxIncluded') : t('productDetail.taxExcluded')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {availableUnits.map((v: { id: string; color: string; stock: number }) => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedColor(v.color); setSelectedUnitId(v.id); }}
                      disabled={v.stock === 0}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-all disabled:opacity-50",
                        selectedColor === v.color ? "bg-gradient-to-b from-orange-50 to-orange-100 ring-2 ring-orange-500" : "hover:bg-gray-50 border border-gray-200"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: getColorValue(v.color) }} />
                      <span className="text-xs font-semibold">{getColorName(v.color)}</span>
                    </button>
                  ))}
                </div>
              )}
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