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

/**
 * Get the display pricing for a product, prioritizing storage options with stock
 * For products with storage: returns price from first storage with stock > 0
 * For products without storage: returns main product price
 */
export function getProductDisplayPrice(product: {
  price: number;
  salePrice?: number | null;
  saleEndDate?: string | null;
  storages?: Array<{
    id: string;
    size: string;
    price: number;
    stock: number;
    salePercentage?: number | null;
    saleEndDate?: string | null;
  }>;
}) {
  // If product has storage options, find first one with stock
  if (product.storages && product.storages.length > 0) {
    const availableStorage = product.storages.find(storage => storage.stock > 0);
    
    if (availableStorage) {
      // Calculate sale price if storage has a sale
      let storagePrice = availableStorage.price;
      let storageSalePrice = null;
      
      if (availableStorage.salePercentage && 
          availableStorage.saleEndDate && 
          new Date(availableStorage.saleEndDate) > new Date()) {
        storageSalePrice = storagePrice - (storagePrice * (availableStorage.salePercentage / 100));
      }
      
      return {
        price: storagePrice,
        salePrice: storageSalePrice,
        fromStorage: true,
        storageSize: availableStorage.size
      };
    }
  }
  
  // Fallback to main product pricing
  return {
    price: product.price,
    salePrice: product.salePrice,
    fromStorage: false,
    storageSize: null
  };
} 