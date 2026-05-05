"use client";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/utils/queryKeys";
import {
  fetchOrders,
  fetchOrder,
  createOrder,
  fetchAdminOrders,
  updateOrderStatus,
  fetchDeliveryZones,
  type CreateOrderInput,
} from "@/services/api/orders";

export function useOrders(page = 1) {
  return useQuery({
    queryKey: queryKeys.orders.list(page),
    queryFn: () => fetchOrders(page),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => fetchOrder(id),
    enabled: !!id,
  });
}

export function useAdminOrders(page = 1, status?: string, q?: string) {
  return useQuery({
    queryKey: queryKeys.orders.adminList(page, status, q),
    queryFn: () => fetchAdminOrders(page, status, q),
  });
}

export function useInfiniteAdminOrders(q: string, status: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.orders(q, status),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchAdminOrders(pageParam, status || undefined, q || undefined),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.orders.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: queryKeys.deliveryZones.list(),
    queryFn: fetchDeliveryZones,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateOrder(onSuccess?: (data: { orderId: string; qpayUrl: string | null }) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderInput) => createOrder(data),
    onSuccess: async (data) => {
      toast.success("Захиалга амжилттай үүслээ");
      await qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      onSuccess?.(data);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateOrderStatus(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: async () => {
      toast.success("Захиалгын төлөв шинэчлэгдлээ");
      await qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
