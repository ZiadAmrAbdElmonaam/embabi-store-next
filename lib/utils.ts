import { Decimal } from "@prisma/client/runtime/library";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | Decimal) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
  }).format(Number(price));
}

type StorageUnit = {
  id?: string;
  color?: string;
  stock?: number;
  taxStatus?: string;
  taxType?: string;
  taxAmount?: number | null;
  taxPercentage?: number | null;
};

function getUnitCalculatedPrice(
  basePrice: number,
  salePercentage: number | null,
  saleEndDate: string | null,
  unit: StorageUnit
): number {
  const salePrice = salePercentage != null && saleEndDate && new Date(saleEndDate) > new Date()
    ? basePrice - (basePrice * (salePercentage / 100))
    : basePrice;
  // UNPAID = base/sale price only; PAID = base + tax (or any unit with taxAmount/taxPercentage set)
  if (unit.taxStatus === 'UNPAID') return salePrice;
  if (unit.taxType === 'FIXED') return salePrice + (Number(unit.taxAmount) || 0);
  if (unit.taxType === 'PERCENTAGE') return salePrice + (salePrice * (Number(unit.taxPercentage) || 0) / 100);
  // Fallback: if unit has tax amount/percentage set, treat as PAID (avoid showing raw base when only PAID units exist)
  if ((unit.taxAmount != null && Number(unit.taxAmount) > 0)) return salePrice + Number(unit.taxAmount);
  if ((unit.taxPercentage != null && Number(unit.taxPercentage) > 0)) return salePrice + (salePrice * Number(unit.taxPercentage) / 100);
  return salePrice;
}

/**
 * Get the display pricing for a product.
 * For products with storage: returns the lowest calculated price across all units with stock > 0
 * For products without storage: returns main product price
 */
export function getProductDisplayPrice(product: {
  price?: number | null;
  salePrice?: number | null;
  sale?: number | null; // percentage, e.g. 15 for 15% off
  saleEndDate?: string | null;
  storages?: Array<{
    id: string;
    size: string;
    price: number;
    salePercentage?: number | null;
    saleEndDate?: string | null;
    units?: StorageUnit[];
  }>;
}) {
  if (product.storages && product.storages.length > 0) {
    let bestPrice: number | null = null;
    let bestSalePrice: number | null = null;
    let bestOrigPrice: number | null = null;
    let bestStorageSize: string | null = null;
    let bestUnitTaxStatus: 'PAID' | 'UNPAID' | null = null;

    for (const storage of product.storages) {
      const units = storage.units ?? [];
      const basePrice = Number(storage.price);
      const salePct = storage.salePercentage != null ? Number(storage.salePercentage) : null;
      const saleEnd = storage.saleEndDate ?? null;
      const onSale = salePct != null && saleEnd && new Date(saleEnd) > new Date();

      for (const unit of units) {
        if ((unit.stock ?? 0) <= 0) continue;
        const calcPrice = getUnitCalculatedPrice(basePrice, salePct, saleEnd, unit);
        const origPrice = getUnitCalculatedPrice(basePrice, null, null, unit);
        if (bestPrice == null || calcPrice < bestPrice) {
          bestPrice = calcPrice;
          bestOrigPrice = origPrice;
          bestSalePrice = onSale ? calcPrice : null;
          bestStorageSize = storage.size;
          bestUnitTaxStatus = unit.taxStatus === 'PAID' ? 'PAID' : unit.taxStatus === 'UNPAID' ? 'UNPAID' : null;
        }
      }
    }

    if (bestPrice != null && bestStorageSize != null) {
      return {
        price: bestSalePrice != null ? (bestOrigPrice ?? bestPrice) : bestPrice,
        salePrice: bestSalePrice,
        fromStorage: true,
        storageSize: bestStorageSize,
        taxStatus: bestUnitTaxStatus
      };
    }
  }

  // Simple products: use salePrice only when sale is active; compute from sale % when salePrice is null
  let price = product.price ?? 0;
  let salePrice: number | null = null;
  const salePct = product.sale != null ? Number(product.sale) : null;
  const saleEnd = product.saleEndDate ?? null;
  const onSale = salePct != null && saleEnd && new Date(saleEnd) > new Date();
  if (onSale && price > 0) {
    salePrice = product.salePrice != null ? Number(product.salePrice) : price - (price * (salePct! / 100));
  }

  return {
    price,
    salePrice,
    fromStorage: false,
    storageSize: null,
    taxStatus: null
  };
} 