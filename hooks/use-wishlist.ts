import { create } from 'zustand';
import { toast } from 'react-hot-toast';

interface WishlistStore {
  items: string[];
  isLoading: boolean;
  toggle: (productId: string) => Promise<void>;
  fetch: () => Promise<void>;
}

export const useWishlist = create<WishlistStore>((set, get) => ({
  items: [],
  isLoading: false,

  toggle: async (productId: string) => {
    try {
      set({ isLoading: true });
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      set({ items: data.products.map((p: any) => p.id) });
      
      const isAdded = data.products.some((p: any) => p.id === productId);
      toast.success(isAdded ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      set({ isLoading: false });
    }
  },

  fetch: async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (!response.ok) throw new Error();
      
      const data = await response.json();
      set({ items: data.products.map((p: any) => p.id) });
    } catch {
      // Silent fail for initial load
    }
  },
})); 