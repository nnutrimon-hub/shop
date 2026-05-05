"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInfiniteAdminOrders, useUpdateOrderStatus } from "@/services/hooks/useOrders";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDebounce } from "@/hooks/use-debounce";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { ShoppingBag, Loader2, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUS_LIST = [
  "awaiting_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  awaiting_payment: "bg-orange-100 text-orange-700 border-orange-200",
  paid: "bg-blue-100 text-blue-700 border-blue-200",
  processing: "bg-purple-100 text-purple-700 border-purple-200",
  shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function AdminOrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const [inputQ, setInputQ] = useState(q);
  const debouncedQ = useDebounce(inputQ, 400);

  useEffect(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (debouncedQ) p.set("q", debouncedQ);
    else p.delete("q");
    router.replace(`${pathname}?${p}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const setParam = useCallback(
    (key: string, val: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (val) p.set(key, val);
      else p.delete(key);
      router.replace(`${pathname}?${p}`);
    },
    [searchParams, router, pathname],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteAdminOrders(debouncedQ, status);
  const updateStatus = useUpdateOrderStatus();

  const sentinelRef = useInfiniteScroll(
    useCallback(() => fetchNextPage(), [fetchNextPage]),
    !!hasNextPage && !isFetchingNextPage,
  );

  const orders = (data?.pages.flatMap((p) => p.orders) ?? []) as Array<{
    _id: string;
    orderId: string;
    status: OrderStatus;
    totalAmount: number;
    deliveryFee: number;
    recipientName: string;
    phone: string;
    district: string;
    createdAt: string;
    userId?: { name: string; email: string };
  }>;

  const total = data?.pages[0]?.total ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Захиалга удирдах</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {debouncedQ || status ? `${orders.length} / ${total} олдлоо` : `Нийт ${total} захиалга`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Захиалга, нэрээр хайх..."
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              className="pl-9 w-52"
            />
          </div>
          <Select
            value={status || "all"}
            onValueChange={(v) => setParam("status", v === "all" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Бүх төлөв" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүх төлөв</SelectItem>
              {STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground border-2 border-dashed rounded-2xl">
          <ShoppingBag className="w-14 h-14 opacity-20" />
          <p className="font-medium">
            {q || status ? "Хайлтын үр дүн олдсонгүй" : "Захиалга байхгүй байна"}
          </p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">
                    Захиалга
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">
                    Хэрэглэгч
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden md:table-cell">
                    Хаяг
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden sm:table-cell">
                    Огноо
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">
                    Дүн
                  </th>
                  <th className="px-4 py-3 w-52">
                    <span className="sr-only">Төлөв</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px] border font-medium px-2 py-0.5",
                            STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold mt-1">{order.orderId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{order.recipientName}</p>
                      <p className="text-xs text-muted-foreground">{order.phone}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-muted-foreground">{order.district}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-bold text-primary">
                        {formatPrice(order.totalAmount + (order.deliveryFee ?? 0))}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={order.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({ id: order._id, status: v ?? order.status })
                        }
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_LIST.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {ORDER_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrdersContent />
    </Suspense>
  );
}
