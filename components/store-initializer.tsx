'use client';

import { useStoreInitializer } from '@/hooks/use-store-initializer';

export function StoreInitializer() {
  // This hook handles the initialization of cart and wishlist
  useStoreInitializer();
  
  // This component doesn't render anything
  return null;
} 