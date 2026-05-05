"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/cloudinary";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";
import { Package, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface Product {
  _id: string;
  name: string;
  slug: string;
  imageKeys?: string[];
  price: number;
  salePrice?: number | null;
  stock: number;
  isFeatured?: boolean;
}

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();
  const { setCartOpen } = useUIStore();
  const [hovered, setHovered] = useState(false);
  const [qty, setQty] = useState(1);

  const images = product.imageKeys ?? [];
  const canSwap = images.length >= 2;
  const displayKey = hovered && canSwap ? images[1] : images[0];

  const hasDiscount =
    product.salePrice != null &&
    product.salePrice > 0 &&
    product.salePrice < product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.salePrice! / product.price) * 100)
    : 0;
  const displayPrice = hasDiscount ? product.salePrice! : product.price;

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error("Бараа дууссан байна");
      return;
    }
    addItem({
      productId: product._id,
      name: product.name,
      imageKey: images[0] ?? "",
      price: displayPrice,
      quantity: qty,
      stock: product.stock,
    });
    setCartOpen(true);
  };

  return (
    <div
      className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {displayKey ? (
            <Image
              src={getImageUrl(displayKey ?? "", { width: 400 })}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
              -{discountPct}%
            </div>
          )}

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary">Дууссан</Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 space-y-2">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Pricing */}
        <div>
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <p className="font-bold text-primary">
                {formatPrice(product.salePrice!)}
              </p>
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price)}
              </p>
            </div>
          ) : (
            <p className="font-bold text-primary">
              {formatPrice(product.price)}
            </p>
          )}
        </div>

        {/* Quantity selector */}
        {/* dont touch this code */}
        {/* {product.stock > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="w-7 h-7 rounded border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="flex-1 text-center text-sm font-medium">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              disabled={qty >= product.stock}
              className="w-7 h-7 rounded border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )} */}

        <Button
          className="w-full"
          size="sm"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Сагсанд нэмэх
        </Button>
      </div>
    </div>
  );
}
