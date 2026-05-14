"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getImageUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { useCreateOrder, useDeliveryZones } from "@/services/hooks/useOrders";
import { useCartStore } from "@/store/cartStore";
import { ORDER_PAYMENT_METHOD_LABELS } from "@/types";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ShoppingCartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, updateQty, removeItem, clearCart, totalPrice } =
    useCartStore();
  const { data: zones } = useDeliveryZones();

  const [form, setForm] = useState({
    recipientName: session?.user?.name ?? "",
    phone: "",
    district: "",
    address: "",
    paymentMethod: "cod" as "qpay" | "cod",
  });

  const selectedZone = zones?.find((z) => z.district === form.district);
  const deliveryFee = selectedZone?.fee ?? 0;
  const grandTotal = totalPrice() + deliveryFee;

  const { mutate: createOrder, isPending } = useCreateOrder((data) => {
    clearCart();
    /* QPay: дараа ашиглахад доорхыг uncomment хийнэ
    if (data.qpayUrl) {
      router.push(data.qpayUrl);
      return;
    }
    */
    router.push("/accounts/orders");
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Захиалга өгөхийн тулд нэвтрэнэ үү");
      router.push("/auth/login");
      return;
    }
    if (!form.district) {
      toast.error("Дүүрэг сонгоно уу");
      return;
    }
    if (items.length === 0) {
      toast.error("Сагс хоосон байна");
      return;
    }

    createOrder({
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      recipientName: form.recipientName,
      phone: form.phone,
      district: form.district,
      address: form.address,
      deliveryFee,
      paymentMethod: form.paymentMethod,
    });
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-xl font-medium">Таны сагс хоосон байна</p>
        <Button render={<Link href="/products" />}>Дэлгүүр хэсэх</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Захиалах</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="font-semibold text-lg">Сагсны бараанууд</h2>
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-start gap-4 p-4 rounded-xl border bg-card"
            >
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={getImageUrl(item.imageKey, { width: 160 })}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-2">{item.name}</p>
                <p className="text-primary font-semibold mt-1">
                  {formatPrice(item.price)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <span className="ml-2 text-sm text-muted-foreground">
                    = {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Order form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 rounded-xl border bg-card"
          >
            <h2 className="font-semibold text-lg">Хүргэлтийн мэдээлэл</h2>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Хүлээн авагчийн нэр</Label>
              <Input
                id="recipientName"
                required
                maxLength={100}
                value={form.recipientName}
                onChange={(e) =>
                  setForm({ ...form, recipientName: e.target.value })
                }
                placeholder="Нэр"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Утасны дугаар</Label>
              <Input
                id="phone"
                required
                maxLength={20}
                type="number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="99112233"
              />
            </div>

            <div className="space-y-2">
              <Label>Дүүрэг</Label>
              <Select
                value={form.district}
                onValueChange={(v) => setForm({ ...form, district: v ?? "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Дүүрэг сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {zones?.map((z) => (
                    <SelectItem key={z.district} value={z.district}>
                      {z.district} — {formatPrice(z.fee)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Дэлгэрэнгүй хаяг</Label>
              <Textarea
                id="address"
                required
                maxLength={500}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Жишээ: Баянзүрх дүүрэг, 26-р хороо, 12-р байр, 34 тоот, 2-р орц (код: 1234). Холбогдох хүний дугаар: 99112233"
              />
            </div>

            <div className="space-y-2">
              <Label>Төлбөрийн арга</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    paymentMethod: (v ?? "cod") as "qpay" | "cod",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Төлбөрийн арга сонгох">
                    {ORDER_PAYMENT_METHOD_LABELS[form.paymentMethod]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* QPay: дараа идэвхжүүлэхэд uncomment
                  <SelectItem value="qpay">
                    {ORDER_PAYMENT_METHOD_LABELS.qpay}
                  </SelectItem>
                  */}
                  <SelectItem value="cod">
                    {ORDER_PAYMENT_METHOD_LABELS.cod}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Барааны дүн</span>
                <span>{formatPrice(totalPrice())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Хүргэлт</span>
                <span>{deliveryFee > 0 ? formatPrice(deliveryFee) : "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Нийт</span>
                <span className="text-primary">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* QPay идэвхтэй үед: qpay үед "QPay-р төлж захиалах" гэж өөрчилнө */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending}
            >
              {isPending ? "Захиалж байна..." : "Захиалах"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
