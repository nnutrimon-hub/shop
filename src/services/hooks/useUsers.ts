"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/utils/queryKeys";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { UserRole } from "@/lib/auth";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  provider: string;
  createdAt: string;
}

async function fetchAdminUsers(page: number, q?: string) {
  const sp = new URLSearchParams({ page: String(page) });
  if (q) sp.set("q", q);
  const res = await fetch(`${API_ENDPOINTS.admin.users.list}?${sp}`);
  if (!res.ok) throw new Error("Алдаа гарлаа");
  return res.json() as Promise<{ users: AdminUser[]; total: number; page: number }>;
}

export function useInfiniteAdminUsers(q: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.users(q),
    queryFn: ({ pageParam }: { pageParam: number }) => fetchAdminUsers(pageParam, q || undefined),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.users.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });
}
