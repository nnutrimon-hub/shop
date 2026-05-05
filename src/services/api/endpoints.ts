export const API_ENDPOINTS = {
  products: {
    list: "/api/products",
    detail: (id: string) => `/api/products/${id}`,
  },
  categories: {
    list: "/api/categories",
    detail: (id: string) => `/api/categories/${id}`,
  },
  cart: {
    base: "/api/cart",
  },
  orders: {
    list: "/api/orders",
    detail: (id: string) => `/api/orders/${id}`,
  },
  admin: {
    orders: {
      list: "/api/admin/orders",
      detail: (id: string) => `/api/admin/orders/${id}`,
    },
    users: {
      list: "/api/admin/users",
      detail: (id: string) => `/api/admin/users/${id}`,
    },
    cloudinarySign: "/api/admin/cloudinary/sign",
  },
  payment: {
    qpay: "/api/payment/qpay",
    qpayCallback: "/api/payment/qpay/callback",
  },
  deliveryZones: "/api/delivery-zones",
  search: "/api/search",
  register: "/api/register",
} as const;
