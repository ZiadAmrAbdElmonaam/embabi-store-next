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
  storages?: Array<{
    id: string;
    size: string;
    price: number;
    stock: number;
    salePercentage?: number | null;
    saleEndDate?: string | null;
    variants: Array<{
      id: string;
      color: string;
      quantity: number;
    }>;
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
          // Attempt to fetch server wishlist
          const response = await fetch('/api/wishlist');
          
          if (!response.ok) {
            console.error(`Failed to sync wishlist: ${response.status}`);
            // Still set initialized to true but keep current items
            set({ isInitialized: true });
            return;
          }
          
          const { items: serverItems } = await response.json();
          
          // Get current local items
          const { items: localItems } = get();
          
          // Create map for faster lookups
          const localItemMap = new Map(
            localItems.map(item => [item.id, item])
          );
          
          // Merge: prefer local items, but include all server items not in local
          const mergedItems = [
            ...localItems,
            ...(serverItems || []).filter(
              serverItem => !localItemMap.has(serverItem.id)
            )
          ];
          
          // Update the store with the merged data
          set({ 
            items: mergedItems,
            isInitialized: true
          });
        } catch (error) {
          console.error('Failed to sync wishlist:', error);
          // Set initialized state on error, but keep current items
          set({ isInitialized: true });
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