import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  images: string[];
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: async (item) => {
        try {
          // Call the API to add item to cart
          const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              productId: item.id,
              quantity: 1
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to add to cart');
          }

          // Update local storage
          set((state) => {
            const existingItem = state.items.find((i) => i.id === item.id);
            if (existingItem) {
              return {
                items: state.items.map((i) =>
                  i.id === item.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                ),
              };
            }
            return { items: [...state.items, { ...item, quantity: 1 }] };
          });

          toast.success('Added to cart');
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to add to cart');
          throw error;
        }
      },
      removeItem: async (id) => {
        try {
          // Call the API to remove item from cart
          const response = await fetch('/api/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id }),
          });

          if (!response.ok) {
            throw new Error('Failed to remove from cart');
          }

          // Update local storage
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));

          toast.success('Removed from cart');
        } catch (error) {
          toast.error('Failed to remove from cart');
          throw error;
        }
      },
      updateQuantity: async (id, quantity) => {
        try {
          // Call the API to update quantity
          const response = await fetch('/api/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id, quantity }),
          });

          if (!response.ok) {
            throw new Error('Failed to update quantity');
          }

          // Update local storage
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          }));
        } catch (error) {
          toast.error('Failed to update quantity');
          throw error;
        }
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
); 