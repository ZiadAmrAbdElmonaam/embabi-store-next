import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isInitialized: false,
      appliedCoupon: null,
      discountAmount: 0,
      
      syncWithServer: async () => {
        try {
          // First try to load from localStorage to ensure we have data
          const storedData = localStorage.getItem('cart-storage');
          if (storedData) {
            try {
              const { state } = JSON.parse(storedData);
              console.log("Loaded cart from localStorage:", state.items);
              
              // Check if cart is empty in the stored data
              const isCartEmpty = !state.items || state.items.length === 0;
              
              // If cart is empty, ensure no coupon is applied
              if (isCartEmpty) {
                console.log("Cart is empty in localStorage, ensuring coupon is cleared");
                set({ 
                  items: [],
                  isInitialized: true,
                  appliedCoupon: null,
                  discountAmount: 0
                });
                
                // Also ensure coupon is removed from cookies
                fetch('/api/coupons/remove', { method: 'POST' }).catch(error => {
                  console.error('Failed to remove coupon from cookies:', error);
                });
                
                // Also update localStorage to ensure consistency
                try {
                  const updatedState = { ...state, appliedCoupon: null, discountAmount: 0 };
                  localStorage.setItem('cart-storage', JSON.stringify({ state: updatedState }));
                  console.log("Updated localStorage with cleared coupon for empty cart");
                } catch (updateError) {
                  console.error('Failed to update localStorage:', updateError);
                }
              } else {
                // Not empty, set items and continue
                set({ 
                  items: state.items || [], 
                  isInitialized: true,
                  // Keep any existing coupon state as is
                  appliedCoupon: get().appliedCoupon 
                });
              }
            } catch (parseError) {
              console.error('Failed to parse localStorage cart data:', parseError);
              set({ 
                isInitialized: true,
                items: [],
                appliedCoupon: null,
                discountAmount: 0 
              });
            }
          } else {
            // No localStorage data, set initialized to true with empty cart
            console.log("No cart data in localStorage");
            set({ 
              items: [],
              isInitialized: true,
              appliedCoupon: null,  // Always clear coupon when cart is empty
              discountAmount: 0
            });
          }
          
          // We're not automatically loading coupons during syncWithServer
          // Coupons will only be loaded when explicitly applied via the coupon form
        } catch (error) {
          console.error('Failed to sync cart:', error);
          // Ensure we're initialized even if there's an error
          set({ isInitialized: true });
        }
      },
      
      // Add a separate method to load coupon data from cookies
      // This will only be called when we need to explicitly retrieve an applied coupon
      loadCouponFromCookies: async () => {
        try {
          console.log("Explicitly loading coupon from cookies...");
          
          // First check if cart is empty - don't load coupon for empty cart
          const { items } = get();
          if (items.length === 0) {
            console.log("Cart is empty, not loading coupon and removing from cookies");
            
            // If cart is empty, make sure to remove any coupon from cookies
            fetch('/api/coupons/remove', { method: 'POST' }).catch(error => {
              console.error('Failed to remove coupon from cookies:', error);
            });
            
            set({ appliedCoupon: null, discountAmount: 0 });
            return null;
          }
          
          // Cart has items, proceed to load coupon
          const response = await fetch('/api/coupons/current');
          if (response.ok) {
            const data = await response.json();
            if (data.coupon) {
              console.log("Loaded coupon from cookies:", data.coupon);
              set({ appliedCoupon: data.coupon });
              // Recalculate discount based on current items and the fetched coupon
              get().recalculateDiscount();
              return data.coupon;
            }
          }
          return null;
        } catch (couponError) {
          console.error('Failed to load coupon data from cookies:', couponError);
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

      addItem: (item) => {
        set((state) => {
          // Create a unique identifier based on product ID and color
          const itemUniqueId = item.selectedColor 
            ? `${item.id}-${item.selectedColor}` 
            : item.id;
          
          const existingItem = state.items.find((i) => {
            const existingUniqueId = i.selectedColor 
              ? `${i.id}-${i.selectedColor}` 
              : i.id;
            return existingUniqueId === itemUniqueId;
          });
          
          if (existingItem) {
            // Check if the selected color has enough quantity
            if (existingItem.selectedColor && existingItem.availableColors) {
              const colorVariant = existingItem.availableColors.find(c => c.color === existingItem.selectedColor);
              if (colorVariant && existingItem.quantity + 1 > colorVariant.quantity) {
                toast.error(`Only ${colorVariant.quantity} items available in ${existingItem.selectedColor}`);
                return state;
              }
            }

            // Increment quantity of existing item
            toast.success(`Updated quantity of ${existingItem.name}${existingItem.selectedColor ? ` (${existingItem.selectedColor})` : ''}`);
            return {
              items: state.items.map((i) => {
                const iUniqueId = i.selectedColor 
                  ? `${i.id}-${i.selectedColor}` 
                  : i.id;
                return iUniqueId === itemUniqueId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i;
              }),
            };
          }

          // Create a new cart item with the proper structure
          const availableColors = item.variants 
            ? item.variants.map(variant => ({
                color: variant.color,
                quantity: variant.quantity
              }))
            : [];

          const newItem: CartItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            salePrice: item.salePrice,
            images: item.images,
            quantity: 1,
            selectedColor: item.selectedColor || null,
            availableColors,
            uniqueId: itemUniqueId
          };
          
          toast.success(`Added ${newItem.name}${newItem.selectedColor ? ` (${newItem.selectedColor})` : ''} to cart`);
          return {
            items: [...state.items, newItem],
          };
        });
        
        // Recalculate discount after adding item
        setTimeout(() => get().recalculateDiscount(), 0);
      },

      removeItem: (id) => {
        // Find the item to remove first (before updating state)
        const itemToRemove = get().items.find(item => item.id === id);
        if (!itemToRemove) return;
        
        // Create unique ID for the item to remove
        const uniqueIdToRemove = itemToRemove.selectedColor 
          ? `${itemToRemove.id}-${itemToRemove.selectedColor}` 
          : itemToRemove.id;
        
        // Filter out the item to remove
        const updatedItems = get().items.filter((item) => {
          const itemUniqueId = item.selectedColor 
            ? `${item.id}-${item.selectedColor}` 
            : item.id;
          return itemUniqueId !== uniqueIdToRemove;
        });
        
        // Check if this is the last item being removed
        const isCartBecomingEmpty = updatedItems.length === 0;
        
        // Update the state with the new items
        set({ items: updatedItems });
        
        // Show success toast
        toast.success('Removed from cart');
        
        // If cart is becoming empty, explicitly handle the coupon clearing
        if (isCartBecomingEmpty) {
          console.log("Last item removed, clearing coupon immediately");
          
          // Update the state to clear coupon
          set({ 
            appliedCoupon: null,
            discountAmount: 0
          });
          
          // Clear coupon from cookies by making an API call
          fetch('/api/coupons/remove', { method: 'POST' })
            .then(() => {
              console.log("Coupon removed from cookies");
              
              // Force update localStorage to reflect the change immediately
              try {
                const storageData = localStorage.getItem('cart-storage');
                if (storageData) {
                  const parsedData = JSON.parse(storageData);
                  parsedData.state.items = [];
                  parsedData.state.appliedCoupon = null;
                  parsedData.state.discountAmount = 0;
                  localStorage.setItem('cart-storage', JSON.stringify(parsedData));
                  console.log("Updated localStorage with cleared cart and coupon");
                }
              } catch (error) {
                console.error("Error updating localStorage:", error);
              }
            })
            .catch(error => {
              console.error('Failed to remove coupon from cookies:', error);
            });
        } else {
          // If the cart is not empty, just recalculate the discount
          setTimeout(() => get().recalculateDiscount(), 0);
        }
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;

          // Create unique ID for the item to update
          const uniqueIdToUpdate = item.selectedColor 
            ? `${item.id}-${item.selectedColor}` 
            : item.id;

          // Check if the selected color has enough quantity
          if (item.selectedColor && item.availableColors) {
            const colorVariant = item.availableColors.find(c => c.color === item.selectedColor);
            if (colorVariant && quantity > colorVariant.quantity) {
              toast.error(`Only ${colorVariant.quantity} items available in ${item.selectedColor}`);
              return state;
            }
          }

          return {
            items: state.items.map((item) => {
              const itemUniqueId = item.selectedColor 
                ? `${item.id}-${item.selectedColor}` 
                : item.id;
              return itemUniqueId === uniqueIdToUpdate ? { ...item, quantity } : item;
            }),
          };
        });
        
        // Recalculate discount after updating quantity
        setTimeout(() => get().recalculateDiscount(), 0);
      },

      updateColor: (id, color) => {
        set((state) => {
          // Find the item to update
          const itemToUpdate = state.items.find(item => item.id === id);
          if (!itemToUpdate) return state;
          
          // Create a new unique ID with the new color
          const newUniqueId = `${itemToUpdate.id}-${color}`;
          
          // Check if an item with this new unique ID already exists
          const existingItemWithNewColor = state.items.find(item => {
            const itemUniqueId = item.selectedColor 
              ? `${item.id}-${item.selectedColor}` 
              : item.id;
            return itemUniqueId === newUniqueId && item.id !== itemToUpdate.id;
          });
          
          if (existingItemWithNewColor) {
            // If an item with the same product and new color already exists,
            // merge quantities and remove the old item
            const updatedItems = state.items.map(item => {
              const itemUniqueId = item.selectedColor 
                ? `${item.id}-${item.selectedColor}` 
                : item.id;
              if (itemUniqueId === newUniqueId) {
                return { 
                  ...item, 
                  quantity: item.quantity + itemToUpdate.quantity 
                };
              }
              return item;
            }).filter(item => item.id !== itemToUpdate.id || item.selectedColor !== itemToUpdate.selectedColor);
            
            return { items: updatedItems };
          }
          
          // Otherwise, just update the color
          return {
            items: state.items.map((item) =>
              item.id === id ? { 
                ...item, 
                selectedColor: color,
                uniqueId: newUniqueId
              } : item
            ),
          };
        });
        
        // Recalculate discount after updating color
        setTimeout(() => get().recalculateDiscount(), 0);
      },

      hasUnselectedColors: () => {
        const items = get().items;
        return items.some(item => item.availableColors && item.availableColors.length > 0 && !item.selectedColor);
      },

      clearCart: () => {
        set({ 
          items: [],
          appliedCoupon: null, // Also clear the coupon when clearing the cart
          discountAmount: 0 
        });
      },

      initializeCart: (items) => {
        set({ items, isInitialized: true });
        // Recalculate discount after initializing cart
        setTimeout(() => get().recalculateDiscount(), 0);
      },

      setCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
        // Recalculate discount after setting coupon
        setTimeout(() => get().recalculateDiscount(), 0);
      },

      setDiscountAmount: (amount) => set({ discountAmount: amount }),

      // Utility function to check if cart is empty and clear coupon if needed
      checkCartEmptyAndClearCoupon: () => {
        const { items } = get();
        
        if (items.length === 0) {
          console.log("Cart is empty, clearing coupon");
          
          // Update the state to clear coupon
          set({ 
            appliedCoupon: null,
            discountAmount: 0
          });
          
          // Clear coupon from cookies by making an API call
          fetch('/api/coupons/remove', { method: 'POST' })
            .then(() => {
              console.log("Coupon removed from cookies");
              
              // Force update localStorage to reflect the change immediately
              // This is needed because zustand's persist middleware might not update immediately
              try {
                const storageData = localStorage.getItem('cart-storage');
                if (storageData) {
                  const parsedData = JSON.parse(storageData);
                  parsedData.state.appliedCoupon = null;
                  parsedData.state.discountAmount = 0;
                  localStorage.setItem('cart-storage', JSON.stringify(parsedData));
                  console.log("Updated localStorage with cleared coupon");
                }
              } catch (error) {
                console.error("Error updating localStorage:", error);
              }
            })
            .catch(error => {
              console.error('Failed to remove coupon from cookies:', error);
            });
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitialized = true;
          console.log("Cart rehydrated from storage:", state.items);
        }
      },
    }
  )
); 