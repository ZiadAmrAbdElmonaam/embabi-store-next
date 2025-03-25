import { create } from 'zustand';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number | string;
  salePrice: number | string | null;
  images: string[];
  category?: string;
  slug?: string;
  description?: string;
  variants?: Array<{ color: string; quantity: number }>;
}

interface WishlistStore {
  items: Product[];
  isInitialized: boolean;
  syncWithServer: () => Promise<void>;
  addItem: (data: Product) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlist = create<WishlistStore>()((set, get) => ({
  items: [],
  isInitialized: false,
  
  syncWithServer: async () => {
    try {
      console.log("Syncing wishlist with server...");
      // Fetch wishlist data from the server
      const response = await fetch('/api/wishlist');
      
      if (!response.ok) {
        console.error(`Failed to sync wishlist: ${response.status}`);
        // Still set initialized to true but keep empty wishlist
        set({ 
          items: [],
          isInitialized: true
        });
        return;
      }
      
      const data = await response.json();
      
      // Update local state with server data
      set({ 
        items: data.items || [],
        isInitialized: true
      });
      
      console.log("Wishlist synced successfully", data.items.length, "items");
    } catch (error) {
      console.error('Failed to sync wishlist:', error);
      // Set an empty initialized state on error
      set({ 
        items: [],
        isInitialized: true 
      });
    }
  },
  
  addItem: async (data) => {
    try {
      // Make server request to add item
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ADD_ITEM',
          item: {
            id: data.id,
            name: data.name,
            price: data.price,
            salePrice: data.salePrice,
            images: data.images,
            category: data.category,
            slug: data.slug,
            description: data.description,
            variants: data.variants
          }
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to add item to wishlist: ${response.status}`);
        // If server fails, still show success to user but log error
        toast.success('Item added to wishlist');
        
        // Add to local state so it appears to work
        set((state) => ({
          items: [
            ...state.items.filter(item => item.id !== data.id),
            data
          ]
        }));
        return;
      }
      
      const responseData = await response.json();
      
      // Update local state with server response
      set({ items: responseData.items || [] });
      
      // Show success notification
      toast.success('Item added to wishlist');
    } catch (error) {
      console.error('Failed to add item to wishlist:', error);
      
      // Still show success for better UX, but log the error
      toast.success('Item added to wishlist');
      
      // Add to local state so it appears to work
      set((state) => ({
        items: [
          ...state.items.filter(item => item.id !== data.id),
          data
        ]
      }));
    }
  },
  
  removeItem: async (id) => {
    try {
      // Optimistically update UI first
      set((state) => ({
        items: state.items.filter(item => item.id !== id)
      }));
      
      // Make server request to remove item
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'REMOVE_ITEM',
          item: { id }
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to remove item from wishlist: ${response.status}`);
        // Show success anyway since we updated the UI
        toast.success('Item removed from wishlist');
        return;
      }
      
      const data = await response.json();
      
      // Update local state with server response
      set({ items: data.items || [] });
      
      // Show success notification
      toast.success('Item removed from wishlist');
    } catch (error) {
      console.error('Failed to remove item from wishlist:', error);
      toast.success('Item removed from wishlist');
      // We already updated the UI optimistically, so no need to revert
    }
  },
  
  clearWishlist: async () => {
    try {
      // Optimistically update UI first
      set({ items: [] });
      
      // Make server request to clear wishlist
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'CLEAR_WISHLIST'
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to clear wishlist: ${response.status}`);
        // Show success anyway since we updated the UI
        toast.success('Wishlist cleared');
        return;
      }
      
      // Show success notification
      toast.success('Wishlist cleared');
    } catch (error) {
      console.error('Failed to clear wishlist:', error);
      // We already updated the UI optimistically, so no need to revert
      toast.success('Wishlist cleared');
    }
  },
  
  isInWishlist: (id) => {
    return get().items.some((item) => item.id === id);
  },
}));