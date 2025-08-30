'use client';
import React, { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';

// Custom hook to initialize cart and wishlist from server
export const useStoreInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const { syncWithServer: syncCartWithServer, loadCouponFromCookies } = useCart();
  const { syncWithServer: syncWishlistWithServer } = useWishlist();

  useEffect(() => {
    const initialize = async () => {
      // Prevent multiple initializations
      if (hasInitialized) return;
      
      try {
        setIsInitializing(true);
        
        // Initialize both stores in parallel
        await Promise.all([
          syncCartWithServer(),
          syncWishlistWithServer()
        ]);
        
        // Load any coupon from cookies
        await loadCouponFromCookies();
        
        setHasInitialized(true);
      } catch (error) {
        console.error('Error initializing stores:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [syncCartWithServer, syncWishlistWithServer, loadCouponFromCookies, hasInitialized]);

  return { isInitializing };
}; 