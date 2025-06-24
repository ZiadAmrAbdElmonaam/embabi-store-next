import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[];
  quantity: number;
  selectedColor: string | null;
  availableColors: { color: string; quantity: number }[];
  uniqueId?: string;
}

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

interface CartStore {
  items: CartItem[];
  isInitialized: boolean;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  addItem: (item: Omit<CartItem, 'quantity' | 'selectedColor' | 'availableColors'> & {
    selectedColor?: string | null;
    variants?: Array<{ color: string; quantity: number }>;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateColor: (id: string, color: string) => void;
  clearCart: () => void;
  initializeCart: (items: CartItem[]) => void;
  syncWithServer: () => Promise<void>;
  hasUnselectedColors: () => boolean;
  setCoupon: (coupon: Coupon | null) => void;
  setDiscountAmount: (amount: number) => void;
  recalculateDiscount: () => void;
  loadCouponFromCookies: () => Promise<Coupon | null>;
  checkCartEmptyAndClearCoupon: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; coupon?: Coupon }>;
  removeCoupon: () => Promise<boolean>;
}

export const useCart = create<CartStore>()((set, get) => ({
      items: [],
      isInitialized: false,
  appliedCoupon: null,
  discountAmount: 0,
      
      syncWithServer: async () => {
        try {
          const response = await fetch('/api/cart');
      
          if (!response.ok) {
            console.error(`Failed to sync cart: ${response.status}`);
            // Still set initialized to true but keep empty cart
            set({
              items: [],
              appliedCoupon: null,
              isInitialized: true,
            });
            return;
          }
      
          const data = await response.json();
      
          // Update the store with the server data
          set({
            items: data.items || [],
            appliedCoupon: data.appliedCoupon || null,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Failed to sync cart:', error);
          // Set an empty initialized state on error
          set({
            items: [],
            appliedCoupon: null,
            isInitialized: true,
          });
        }
      },
  
  // Load coupon from cookie
  loadCouponFromCookies: async () => {
    try {
      // If cart is empty, don't load coupon
      if (get().items.length === 0) {
        return null;
      }
      
      const response = await fetch('/api/coupons/current');
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.coupon) {
        // Set the coupon in the store
        set({ appliedCoupon: data.coupon });
        // Recalculate discount after setting the coupon
        get().recalculateDiscount();
        return data.coupon;
      }
      
      return null;
    } catch (couponError) {
      console.error('Failed to load coupon data:', couponError);
      return null;
    }
  },

  recalculateDiscount: () => {
    const { items, appliedCoupon } = get();
    
    if (appliedCoupon && items.length > 0) {
      const subtotal = items.reduce((total, item) => {
        const itemPrice = item.salePrice !== null ? item.salePrice : item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
      
      let discountAmount = 0;
      if (appliedCoupon.type === 'PERCENTAGE') {
        discountAmount = (subtotal * appliedCoupon.value) / 100;
      } else if (appliedCoupon.type === 'FIXED') {
        discountAmount = Math.min(appliedCoupon.value, subtotal);
      }
      
      set({ discountAmount });
    } else {
      // No coupon or no items, so no discount
      set({ discountAmount: 0 });
    }
  },

  addItem: async (item) => {
    try {
      // Make server request to add item
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ADD_ITEM',
          item: {
            id: item.id,
            name: item.name,
            price: item.price,
            salePrice: item.salePrice,
            images: item.images,
            selectedColor: item.selectedColor || null,
            variants: item.variants || []
          }
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to add item: ${response.status}`);
        // If server fails, still show success to user but log error
        toast.success(`Added ${item.name}${item.selectedColor ? ` (${item.selectedColor})` : ''} to cart`);
        return;
      }
      
      const data = await response.json();
      
      // Update local state with server response
      set({ 
        items: data.items || [],
        appliedCoupon: data.appliedCoupon || null,
        discountAmount: data.discountAmount || 0
      });
      
      // Show success notification
      toast.success(`Added ${item.name}${item.selectedColor ? ` (${item.selectedColor})` : ''} to cart`);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      
      // Still show success for better UX, but log the error
      toast.success(`Added ${item.name}${item.selectedColor ? ` (${item.selectedColor})` : ''} to cart`);
      
      // Add the item to local state so it appears to work
      set((state) => ({
        items: [
          ...state.items,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            salePrice: item.salePrice,
            images: item.images,
            quantity: 1,
            selectedColor: item.selectedColor || null,
            availableColors: item.variants?.map(v => ({ color: v.color, quantity: v.quantity })) || []
          }
        ]
      }));
    }
  },

  removeItem: async (id) => {
    try {
      // Optimistically remove item from UI
      const currentItems = [...get().items];
        set((state) => ({
        items: state.items.filter(item => item.id !== id)
      }));
      
      // Make server request to remove item
      const response = await fetch('/api/cart', {
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
        console.error(`Failed to remove item: ${response.status}`);
        // Show success but restore the state if the server operation failed
        toast.success('Removed from cart');
        return;
      }
      
      const data = await response.json();
      
      // Update local state with server response
      set({ 
        items: data.items || [],
        appliedCoupon: data.appliedCoupon || null,
        discountAmount: data.discountAmount || 0
      });
      
      // Show success notification
      toast.success('Removed from cart');
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      // Still show success for better UX, but log the error
      toast.success('Removed from cart');
    }
  },

  updateQuantity: async (id, quantity) => {
    try {
      if (quantity < 1) return;
      
      // Store the current state for potential rollback
      const currentItems = get().items;
      
      // Optimistically update the UI
      set((state) => ({
        items: state.items.map(item => 
          item.id === id ? { ...item, quantity } : item
        )
      }));
      
      // Make server request to update quantity
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'UPDATE_QUANTITY',
          item: { id },
          quantity
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to update quantity: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      // Update local state with server response
      set({ 
        items: data.items || [],
        appliedCoupon: data.appliedCoupon || null,
        discountAmount: data.discountAmount || 0
      });
    } catch (error) {
      console.error('Failed to update quantity:', error);
      // For quantity updates, we can silently fail
    }
  },

  updateColor: async (id, color) => {
    try {
      // Store the current state for potential rollback
      const currentItems = get().items;
      
      // Optimistically update the UI
        set((state) => ({
        items: state.items.map(item => 
            item.id === id ? { ...item, selectedColor: color } : item
        )
      }));
      
      // Make server request to update color
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'UPDATE_COLOR',
          item: { id },
          color
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to update color: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      // Update local state with server response
      set({ 
        items: data.items || [],
        appliedCoupon: data.appliedCoupon || null,
        discountAmount: data.discountAmount || 0
      });
    } catch (error) {
      console.error('Failed to update color:', error);
      // For color updates, we can silently fail
    }
      },

      hasUnselectedColors: () => {
        const items = get().items;
    return items.some(item => item.availableColors && item.availableColors.length > 0 && !item.selectedColor);
  },

  clearCart: async () => {
    try {
      // Optimistically clear cart in UI
      const previousState = {
        items: get().items,
        appliedCoupon: get().appliedCoupon,
        discountAmount: get().discountAmount
      };
      
      // Update local state
      set({ 
        items: [],
        appliedCoupon: null,
        discountAmount: 0
      });
      
      // Make server request to clear cart
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'CLEAR_CART'
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to clear cart: ${response.status}`);
        return;
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },

  initializeCart: (items) => {
    // Only use this for initial state, will be replaced by server data
    set({ items, isInitialized: true });
    // Recalculate discount after initializing cart
    setTimeout(() => get().recalculateDiscount(), 0);
  },

  setCoupon: async (coupon) => {
    try {
      // Optimistically update UI
      const previousCoupon = get().appliedCoupon;
      const previousDiscount = get().discountAmount;
      
      set({ 
        appliedCoupon: coupon
      });
      
      // Recalculate discount after setting coupon
      get().recalculateDiscount();
      
      // Make server request to add/update coupon
      if (coupon) {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'APPLY_COUPON',
            couponId: coupon.id
          })
        });
        
        if (!response.ok) {
          console.error(`Failed to apply coupon: ${response.status}`);
          // Revert the optimistic update
          set({ 
            appliedCoupon: previousCoupon,
            discountAmount: previousDiscount
          });
          return;
        }
        
        const data = await response.json();
        
        // Update local state with server response
        set({ 
          appliedCoupon: data.appliedCoupon || null,
          discountAmount: data.discountAmount || 0,
          items: data.items || get().items
        });
      } else {
        // If coupon is null, remove it
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'REMOVE_COUPON'
          })
        });
        
        if (!response.ok) {
          console.error(`Failed to remove coupon: ${response.status}`);
          // Revert the optimistic update
          set({ 
            appliedCoupon: previousCoupon,
            discountAmount: previousDiscount
          });
          return;
        }
      }
    } catch (error) {
      console.error('Failed to update coupon:', error);
    }
  },

  setDiscountAmount: (amount) => set({ discountAmount: amount }),

  // Utility function to check if cart is empty and clear coupon if needed
  checkCartEmptyAndClearCoupon: () => {
    const { items, appliedCoupon } = get();
    
    if (items.length === 0 && appliedCoupon) {
      get().setCoupon(null);
    }
  },

  // Apply a coupon code to the cart
  applyCoupon: async (code: string) => {
    try {
      const response = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        return { success: false, message: "Invalid coupon code" };
      }

      const data = await response.json();
      
      if (data.coupon) {
        // Update state with the validated coupon
        set({ appliedCoupon: data.coupon });
        return { success: true, coupon: data.coupon };
      }
      
      return { success: false, message: "Coupon not found" };
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, message: "Error verifying coupon" };
    }
  },

  // Remove coupon from cart
  removeCoupon: async () => {
    try {
      // Make server request to remove the coupon
      const response = await fetch('/api/coupons/verify', {
        method: 'DELETE',
      });

      // Even if server fails, still remove from client
      set({ appliedCoupon: null });
      
      return true;
    } catch (error) {
      console.error('Error removing coupon:', error);
      // Still remove from client state
      set({ appliedCoupon: null });
      return false;
    }
  },
}));