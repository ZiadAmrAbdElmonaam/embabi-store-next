'use client';

import { useEffect } from 'react';
import { useCart } from './use-cart';
import { useWishlist } from './use-wishlist';

export const useStoreInitializer = () => {
  const cart = useCart();
  const wishlist = useWishlist();

  useEffect(() => {
    // Initialize cart from server
    if (!cart.isInitialized) {
      console.log('Initializing cart from server...');
      cart.syncWithServer().catch(err => {
        console.error('Failed to initialize cart:', err);
      });
    }

    // Initialize wishlist from server
    if (!wishlist.isInitialized) {
      console.log('Initializing wishlist from server...');
      wishlist.syncWithServer().catch(err => {
        console.error('Failed to initialize wishlist:', err);
      });
    }
  }, [cart, wishlist]);

  return null;
}; 