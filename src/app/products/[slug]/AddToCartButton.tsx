"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  productId: string;
  name: string;
  imageKey: string;
  price: number;
  stock: number;
}

export default function AddToCartButton({
  productId,
  name,
  imageKey,
  price,
  stock,
}: Props) {
  const { addItem } = useCartStore();
  const { setCartOpen } = useUIStore();
  const { data: session } = useSession();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleAdd = () => {
    if (stock <= 0) {
      toast.error("Бараа дууссан байна");
      return;
    }
    addItem({ productId, name, imageKey, price, quantity: qty, stock });
    setCartOpen(true);
  };

  const handleOrder = () => {
    if (stock <= 0) {
      toast.error("Бараа дууссан байна");
      return;
    }
    if (!session) {
      setShowLoginDialog(true);
      return;
    }
    addItem({ productId, name, imageKey, price, quantity: qty, stock });
    setCartOpen(false);
    router.push("/shopping-cart");
  };

  return (
    <>
    <div className="space-y-3">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-semibold text-lg">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(stock, q + 1))}
          disabled={qty >= stock}
          className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          size="lg"
          variant="outline"
          onClick={handleAdd}
          disabled={stock === 0}
          className="flex-1"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {stock === 0 ? "Дууссан" : "Сагслах"}
        </Button>
        <Button
          size="lg"
          onClick={handleOrder}
          disabled={stock === 0}
          className="flex-1 bg-foreground text-background hover:bg-foreground/90"
        >
          {stock === 0 ? "Дууссан" : "Захиалах"}
        </Button>
      </div>
    </div>

    <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Нэвтрэх шаардлагатай</DialogTitle>
          <DialogDescription>
            Захиалга өгөхийн тулд та эхлээд нэвтрэнэ үү.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
            Болих
          </Button>
          <Button
            onClick={() => {
              setShowLoginDialog(false);
              router.push("/auth/login?callbackUrl=/shopping-cart");
            }}
          >
            Нэвтрэх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
