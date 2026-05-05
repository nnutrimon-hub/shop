"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/utils/queryKeys";
import { API_ENDPOINTS } from "@/services/api/endpoints";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  createdAt?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Алдаа гарлаа");
  }
  return res.json();
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: async () =>
      handleResponse<Category[]>(await fetch(API_ENDPOINTS.categories.list)),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      handleResponse<Category>(
        await fetch(API_ENDPOINTS.categories.list, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      ),
    onSuccess: async () => {
      toast.success("Ангилал амжилттай нэмэгдлээ");
      await qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCategory(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      handleResponse<Category>(
        await fetch(API_ENDPOINTS.categories.detail(id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      ),
    onSuccess: async () => {
      toast.success("Ангилал амжилттай шинэчлэгдлээ");
      await qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCategory(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      handleResponse<{ message: string }>(
        await fetch(API_ENDPOINTS.categories.detail(id), { method: "DELETE" })
      ),
    onSuccess: async () => {
      toast.success("Ангилал устгагдлаа");
      await qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
