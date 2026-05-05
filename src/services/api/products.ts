import { API_ENDPOINTS } from "./endpoints";

export interface ProductListParams {
  page?: number;
  limit?: number;
  category_id?: string;
  q?: string;
  featured?: boolean;
  sale?: boolean;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Алдаа гарлаа");
  }
  return res.json();
}

export async function fetchProducts(params: ProductListParams = {}) {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.category_id) sp.set("category_id", params.category_id);
  if (params.q) sp.set("q", params.q);
  if (params.featured) sp.set("featured", "true");
  if (params.sale) sp.set("sale", "true");

  const url = `${API_ENDPOINTS.products.list}?${sp.toString()}`;
  return handleResponse<{
    products: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
  }>(await fetch(url));
}

export async function fetchProduct(id: string) {
  return handleResponse<Record<string, unknown>>(
    await fetch(API_ENDPOINTS.products.detail(id)),
  );
}

export async function createProduct(data: Record<string, unknown>) {
  return handleResponse<Record<string, unknown>>(
    await fetch(API_ENDPOINTS.products.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  );
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  return handleResponse<Record<string, unknown>>(
    await fetch(API_ENDPOINTS.products.detail(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  );
}

export async function deleteProduct(id: string) {
  return handleResponse<{ message: string }>(
    await fetch(API_ENDPOINTS.products.detail(id), { method: "DELETE" }),
  );
}

export async function fetchCategories() {
  return handleResponse<Record<string, unknown>[]>(
    await fetch(API_ENDPOINTS.categories.list),
  );
}

export async function fetchAdminCategories(page: number, q?: string, limit = 30) {
  const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) sp.set("q", q);
  return handleResponse<{
    categories: Record<string, unknown>[];
    total: number;
    page: number;
  }>(await fetch(`${API_ENDPOINTS.categories.list}?${sp.toString()}`));
}

export async function searchProducts(q: string) {
  return handleResponse<Record<string, unknown>[]>(
    await fetch(`${API_ENDPOINTS.search}?q=${encodeURIComponent(q)}`),
  );
}
