import { create } from "zustand";

interface UIStore {
  isNavOpen: boolean;
  isCartOpen: boolean;
  setNavOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  toggleNav: () => void;
  toggleCart: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isNavOpen: false,
  isCartOpen: false,
  setNavOpen: (open) => set({ isNavOpen: open }),
  setCartOpen: (open) => set({ isCartOpen: open }),
  toggleNav: () => set((s) => ({ isNavOpen: !s.isNavOpen })),
  toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),
}));
