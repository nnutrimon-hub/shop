"use client";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/services/hooks/useOrders";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import Image from "next/image";
import { getImageUrl } from "@/lib/cloudinary";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "awaiting_payment", label: "Төлбөр хүлээж байна" },
  { value: "paid", label: "Төлбөр хийгдсэн" },
  { value: "processing", label: "Боловсруулж байна" },
  { value: "shipped", label: "Хүргэлтэнд гарсан" },
  { value: "delivered", label: "Хүргэгдсэн" },
  { value: "cancelled", label: "Цуцлагдсан" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "secondary",
  awaiting_payment: "outline",
  paid: "default",
  processing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

export default function OrdersPage() {
  const { data, isLoading } = useOrders();
  const orders = (data?.orders ?? []) as Array<{
    _id: string;
    orderId: string;
    status: OrderStatus;
    totalAmount: number;
    deliveryFee: number;
    createdAt: string;
    items: Array<{ name: string; imageKey: string; price: number; quantity: number }>;
  }>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Миний захиалгууд</h1>

      <Tabs defaultValue="all">
        {/* Mobile-scrollable tabs */}
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <TabsList className="inline-flex min-w-max">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {orders
                  .filter((o) => tab.value === "all" || o.status === tab.value)
                  .map((order) => (
                    <Link
                      key={order._id}
                      href={`/accounts/orders/${order._id}`}
                      className="block p-4 rounded-xl border bg-card hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium">#{order.orderId}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                          <div className="flex gap-1 flex-wrap mt-2">
                            {order.items.slice(0, 3).map((item, i) => (
                              <div
                                key={i}
                                className="relative w-10 h-10 rounded overflow-hidden bg-muted"
                              >
                                <Image
                                  src={getImageUrl(item.imageKey, { width: 80 })}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant={(STATUS_COLORS[order.status] ?? "outline") as "default" | "secondary" | "outline" | "destructive"}>
                            {ORDER_STATUS_LABELS[order.status] ?? order.status}
                          </Badge>
                          <p className="font-bold text-primary">
                            {formatPrice(order.totalAmount + order.deliveryFee)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                {orders.filter((o) => tab.value === "all" || o.status === tab.value).length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Захиалга байхгүй байна
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
