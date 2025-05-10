'use client';
import React, { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';

// Custom hook to initialize cart and wishlist from server
export const useStoreInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { syncWithServer: syncCartWithServer, loadCouponFromCookies } = useCart();
  const { syncWithServer: syncWishlistWithServer } = useWishlist();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize both stores in parallel
        await Promise.all([
          syncCartWithServer(),
          syncWishlistWithServer()
        ]);
        
        // Load any coupon from cookies
        await loadCouponFromCookies();
      } catch (error) {
        console.error('Error initializing stores:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [syncCartWithServer, syncWishlistWithServer, loadCouponFromCookies]);

  return { isInitializing };
}; 