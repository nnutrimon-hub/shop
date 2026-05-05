import { API_ENDPOINTS } from "./endpoints";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Алдаа гарлаа");
  }
  return res.json();
}

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
  recipientName: string;
  phone: string;
  district: string;
  address: string;
  deliveryFee: number;
}

export async function createOrder(data: CreateOrderInput) {
  return handleResponse<{ orderId: string; qpayUrl: string | null }>(
    await fetch(API_ENDPOINTS.orders.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function fetchOrders(page = 1) {
  return handleResponse<{
    orders: Record<string, unknown>[];
    total: number;
    page: number;
  }>(await fetch(`${API_ENDPOINTS.orders.list}?page=${page}`));
}

export async function fetchOrder(id: string) {
  return handleResponse<Record<string, unknown>>(
    await fetch(API_ENDPOINTS.orders.detail(id))
  );
}

export async function fetchAdminOrders(page = 1, status?: string, q?: string) {
  const sp = new URLSearchParams({ page: String(page) });
  if (status) sp.set("status", status);
  if (q) sp.set("q", q);
  return handleResponse<{
    orders: Record<string, unknown>[];
    total: number;
    page: number;
  }>(await fetch(`${API_ENDPOINTS.admin.orders.list}?${sp.toString()}`));
}

export async function updateOrderStatus(id: string, status: string) {
  return handleResponse<Record<string, unknown>>(
    await fetch(API_ENDPOINTS.admin.orders.detail(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  );
}

export async function fetchDeliveryZones() {
  return handleResponse<{ district: string; fee: number }[]>(
    await fetch(API_ENDPOINTS.deliveryZones)
  );
}
