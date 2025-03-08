import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

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

interface CartStore {
  items: CartItem[];
  isInitialized: boolean;
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
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isInitialized: false,
      
      syncWithServer: async () => {
        try {
          // First try to load from localStorage to ensure we have data
          const storedData = localStorage.getItem('cart-storage');
          if (storedData) {
            try {
              const { state } = JSON.parse(storedData);
              console.log("Loaded cart from localStorage:", state.items);
              set({ items: state.items || [], isInitialized: true });
            } catch (parseError) {
              console.error('Failed to parse localStorage cart data:', parseError);
              set({ isInitialized: true });
            }
          } else {
            // No localStorage data, set initialized to true with empty cart
            console.log("No cart data in localStorage");
            set({ items: [], isInitialized: true });
          }
        } catch (error) {
          console.error('Failed to sync cart:', error);
          // Ensure we're initialized even if there's an error
          set({ isInitialized: true });
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
      },

      removeItem: (id) => {
        set((state) => {
          // Find the item to remove
          const itemToRemove = state.items.find(item => item.id === id);
          if (!itemToRemove) return state;
          
          // Create unique ID for the item to remove
          const uniqueIdToRemove = itemToRemove.selectedColor 
            ? `${itemToRemove.id}-${itemToRemove.selectedColor}` 
            : itemToRemove.id;
          
          return {
            items: state.items.filter((item) => {
              const itemUniqueId = item.selectedColor 
                ? `${item.id}-${item.selectedColor}` 
                : item.id;
              return itemUniqueId !== uniqueIdToRemove;
            }),
          };
        });
        toast.success('Removed from cart');
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
      },

      hasUnselectedColors: () => {
        const items = get().items;
        return items.some(item => item.availableColors && item.availableColors.length > 0 && !item.selectedColor);
      },

      clearCart: () => set({ items: [] }),

      initializeCart: (items) => set({ items, isInitialized: true }),
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