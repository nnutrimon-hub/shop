export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (...params: unknown[]) =>
      [...queryKeys.products.all, "list", ...params] as const,
    detail: (slug: string) =>
      [...queryKeys.products.all, "detail", slug] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => [...queryKeys.categories.all, "list"] as const,
  },
  cart: {
    all: ["cart"] as const,
    current: () => [...queryKeys.cart.all, "current"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (...params: unknown[]) =>
      [...queryKeys.orders.all, "list", ...params] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
    adminList: (...params: unknown[]) =>
      [...queryKeys.orders.all, "admin-list", ...params] as const,
  },
  users: {
    all: ["users"] as const,
    adminList: (...params: unknown[]) =>
      [...queryKeys.users.all, "admin-list", ...params] as const,
  },
  deliveryZones: {
    all: ["delivery-zones"] as const,
    list: () => [...queryKeys.deliveryZones.all, "list"] as const,
  },
  search: {
    all: ["search"] as const,
    results: (q: string) => [...queryKeys.search.all, q] as const,
  },
  admin: {
    products: (q: string) => ["admin", "products", q] as const,
    categories: (q: string) => ["admin", "categories", q] as const,
    orders: (q: string, status: string) => ["admin", "orders", q, status] as const,
    users: (q: string) => ["admin", "users", q] as const,
  },
} as const;
