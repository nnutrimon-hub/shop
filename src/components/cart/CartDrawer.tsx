"use client";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useCartStore } from "@/store/cartStore";
import CartItem from "./CartItem";
import { formatPrice } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CartDrawer() {
  const { isCartOpen, setCartOpen } = useUIStore();
  const { items, clearCart, totalPrice, totalItems } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  function handleCheckout() {
    setCartOpen(false);
    if (!session) {
      setShowLoginDialog(true);
    } else {
      router.push("/shopping-cart");
    }
  }

  return (
    <>
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Сагс
            {totalItems() > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({totalItems()} бараа)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">
              Таны сагс хоосон байна
            </p>
            <Button
              variant="outline"
              render={<Link href="/products" />}
              onClick={() => setCartOpen(false)}
            >
              Дэлгүүр хэсэх
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>

            <div className="border-t px-4 py-4 space-y-3 bg-background">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Нийт дүн:</span>
                <span className="font-bold text-lg">
                  {formatPrice(totalPrice())}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                >
                  Сагс хоослох
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCheckout}
                >
                  Захиалах
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>

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
