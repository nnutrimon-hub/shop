"use client";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { useCartStore, type CartItem as CartItemType } from "@/store/cartStore";
import { Minus, Package, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface Props {
  item: CartItemType;
}

export default function CartItem({ item }: Props) {
  const { updateQty, removeItem } = useCartStore();

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {item.imageKey ? (
          <Image
            src={getImageUrl(item.imageKey, { width: 128 })}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2">
          {item.name} x {item.quantity}
        </p>
        <p className="text-sm text-primary font-semibold mt-1">
          {formatPrice(item.price)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => removeItem(item.productId)}
          className="text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Устгах"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => updateQty(item.productId, item.quantity - 1)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-6 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => updateQty(item.productId, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
