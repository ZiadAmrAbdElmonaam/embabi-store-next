import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[];
  slug: string;
  description?: string;
  variants?: Array<{
    id?: string;
    color: string;
    quantity: number;
  }>;
}

interface WishlistStore {
  items: WishlistItem[];
  isInitialized: boolean;
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  initializeWishlist: (items: WishlistItem[]) => void;
  syncWithServer: () => Promise<void>;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isInitialized: false,

      syncWithServer: async () => {
        try {
          console.log("Syncing wishlist with server...");
          const response = await fetch('/api/wishlist', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          if (!response.ok) {
            // If unauthorized or any other error, try to load from localStorage
            const storedData = localStorage.getItem('wishlist-storage');
            if (storedData) {
              const { state } = JSON.parse(storedData);
              set({ items: state.items || [], isInitialized: true });
            } else {
              set({ isInitialized: true });
            }
            return;
          }
          const data = await response.json();
          // Merge server items with local items
          const localData = localStorage.getItem('wishlist-storage');
          let localItems: WishlistItem[] = [];
          if (localData) {
            const { state } = JSON.parse(localData);
            localItems = state.items || [];
          }
          const mergedItems = [...data.items, ...localItems.filter(localItem => 
            !data.items.some(serverItem => serverItem.id === localItem.id)
          )];
          set({ items: mergedItems, isInitialized: true });
          console.log("Wishlist synced successfully", mergedItems.length, "items");
        } catch (error) {
          console.error('Failed to sync wishlist:', error);
          // On error, try to load from localStorage
          const storedData = localStorage.getItem('wishlist-storage');
          if (storedData) {
            const { state } = JSON.parse(storedData);
            set({ items: state.items || [], isInitialized: true });
          } else {
            set({ isInitialized: true });
          }
        }
      },

      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(i => i.id === item.id);
        
        if (!existingItem) {
          const newItems = [...currentItems, item];
          set({ items: newItems });
          localStorage.setItem('wishlist-storage', JSON.stringify({
            state: { items: newItems },
            version: 0
          }));
          toast.success('Added to wishlist');
        } else {
          toast.error('Item already in wishlist');
        }
      },

      removeItem: (id) => {
        const currentItems = get().items;
        const itemExists = currentItems.some(item => item.id === id);
        
        if (itemExists) {
          const newItems = currentItems.filter(item => item.id !== id);
          set({ items: newItems });
          localStorage.setItem('wishlist-storage', JSON.stringify({
            state: { items: newItems },
            version: 0
          }));
          toast.success('Removed from wishlist');
        }
      },

      clearWishlist: () => {
        set({ items: [] });
        localStorage.setItem('wishlist-storage', JSON.stringify({
          state: { items: [] },
          version: 0
        }));
        toast.success('Wishlist cleared');
      },

      initializeWishlist: (items) => {
        set({ items, isInitialized: true });
        localStorage.setItem('wishlist-storage', JSON.stringify({
          state: { items },
          version: 0
        }));
      },
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: false, // Changed to false to allow initial hydration
    }
  )
); 