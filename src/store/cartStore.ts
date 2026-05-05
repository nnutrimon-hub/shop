import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  imageKey: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  loadFromServer: () => Promise<void>;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            const newQty = Math.min(existing.quantity + item.quantity, item.stock);
            return {
              items: s.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: newQty, stock: item.stock }
                  : i
              ),
            };
          }
          return {
            items: [
              ...s.items,
              { ...item, quantity: Math.min(item.quantity, item.stock) },
            ],
          };
        }),

      updateQty: (productId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantity: Math.min(qty, i.stock) }
                    : i
                ),
        })),

      removeItem: (productId) =>
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
        })),

      clearCart: () => set({ items: [] }),

      loadFromServer: async () => {
        try {
          const res = await fetch("/api/cart");
          if (!res.ok) return;
          const data = await res.json();
          const items: CartItem[] = (data.items ?? []).map(
            (item: { product: { _id: string } | string; name: string; imageKey: string; price: number; quantity: number; stock?: number }) => ({
              productId: typeof item.product === "object" ? String(item.product._id) : String(item.product),
              name: item.name,
              imageKey: item.imageKey,
              price: item.price,
              quantity: item.quantity,
              stock: item.stock ?? 999,
            })
          );
          set({ items });
        } catch {
          // network error — keep local cart
        }
      },

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "azimarket-cart" }
  )
);
