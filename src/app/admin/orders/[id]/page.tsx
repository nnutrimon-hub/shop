import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ORDER_PAYMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  type OrderPaymentMethod,
  type OrderStatus,
} from "@/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) {
    redirect("/auth/login?callbackUrl=/admin/orders");
  }

  const role = session.user.role ?? "user";
  const isAllowed = ["admin", "superadmin", "moderator"].includes(role);
  if (!isAllowed) {
    redirect("/unauthorized");
  }

  await connectDB();
  const { id } = await params;
  const order = await Order.findById(id).populate("userId", "name email").lean();

  if (!order) notFound();

  const status = order.status as OrderStatus;
  const paymentMethod = (order.paymentMethod ?? "qpay") as OrderPaymentMethod;
  const total = (order.totalAmount ?? 0) + (order.deliveryFee ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Захиалга #{order.orderId}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.createdAt as Date, "YYYY.MM.DD HH:mm")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {ORDER_PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod}
          </Badge>
          <Badge>
            {ORDER_STATUS_LABELS[status] ?? status}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" render={<Link href="/admin/orders" />}>
          Захиалгууд руу буцах
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-xl bg-card p-5 space-y-4">
          <h2 className="font-semibold">Захиалгын бараанууд</h2>
          <div className="space-y-3">
            {(order.items as Array<{
              name: string;
              price: number;
              quantity: number;
            }>).map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium line-clamp-2">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Барааны дүн</span>
              <span>{formatPrice(order.totalAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Хүргэлт</span>
              <span>
                {(order.deliveryFee ?? 0) > 0
                  ? formatPrice(order.deliveryFee ?? 0)
                  : "—"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Нийт</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-xl bg-card p-5 space-y-4">
          <h2 className="font-semibold">Хүргэлт ба холбоо</h2>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Хүлээн авагч</p>
            <p className="font-medium">{order.recipientName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Утас</p>
            <p className="font-medium">{order.phone}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Хаяг</p>
            <p className="font-medium">{order.district}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {order.address}
            </p>
          </div>

          {order.paidAt ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Төлсөн огноо</p>
              <p className="font-medium">
                {formatDate(order.paidAt as Date, "YYYY.MM.DD HH:mm")}
              </p>
            </div>
          ) : null}

          {order.qpayShortUrl ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">QPay холбоос</p>
              <a
                href={order.qpayShortUrl as string}
                className="text-sm text-primary underline break-all"
              >
                {order.qpayShortUrl as string}
              </a>
            </div>
          ) : null}

          {"userId" in order && order.userId ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Бүртгэлтэй хэрэглэгч</p>
              <p className="text-sm">
                {(order.userId as { name?: string; email?: string }).name ??
                  "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {(order.userId as { name?: string; email?: string }).email ??
                  "—"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

