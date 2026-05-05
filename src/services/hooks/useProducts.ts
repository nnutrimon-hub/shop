"use client";
import {
  createProduct,
  deleteProduct,
  fetchAdminCategories,
  fetchCategories,
  fetchProduct,
  fetchProducts,
  updateProduct,
  type ProductListParams,
} from "@/services/api/products";
import { queryKeys } from "@/utils/queryKeys";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => fetchProducts(params),
    staleTime: 60 * 1000,
  });
}

export function useInfiniteProducts(
  params: Omit<ProductListParams, "page" | "limit"> = {},
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.products.all, "infinite", params] as const,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchProducts({ ...params, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.products.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });
}

export function useInfiniteAdminProducts(q: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.products(q),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchProducts({ page: pageParam, limit: 20, q: q || undefined }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.products.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });
}

export function useInfiniteAdminCategories(q: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.categories(q),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchAdminCategories(pageParam, q || undefined, 30),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.categories.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteSearchProducts(q: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.search.infinite(q),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchProducts({ q, page: pageParam, limit: 9 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.products.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: q.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useCreateProduct(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      toast.success("Бараа амжилттай нэмэгдлээ");
      await qc.invalidateQueries({ queryKey: queryKeys.products.all });
      await qc.invalidateQueries({ queryKey: ["admin", "products"] });
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProduct(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateProduct(id, data),
    onSuccess: async () => {
      toast.success("Бараа амжилттай шинэчлэгдлээ");
      await qc.invalidateQueries({ queryKey: queryKeys.products.all });
      await qc.invalidateQueries({ queryKey: ["admin", "products"] });
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProduct(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: async () => {
      toast.success("Бараа устгагдлаа");
      await qc.invalidateQueries({ queryKey: queryKeys.products.all });
      await qc.invalidateQueries({ queryKey: ["admin", "products"] });
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
