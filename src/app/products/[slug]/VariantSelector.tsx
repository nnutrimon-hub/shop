"use client";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import AddToCartButton from "./AddToCartButton";

interface Variant {
  label: string;
  price: number;
  order: number;
}

interface Props {
  variants: Variant[];
  basePrice: number;
  productId: string;
  name: string;
  imageKey: string;
  stock: number;
}

export default function VariantSelector({
  variants,
  basePrice,
  productId,
  name,
  imageKey,
  stock,
}: Props) {
  const sorted = [...variants].sort((a, b) => a.order - b.order);
  const [selected, setSelected] = useState<number | null>(null);

  const activePrice =
    selected !== null ? sorted[selected].price : basePrice;

  return (
    <div className="space-y-4">
      {/* Chip selector */}
      <div className="flex flex-wrap gap-2">
        {sorted.map((v, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i === selected ? null : i)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              selected === i
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-border bg-background hover:border-primary/50 text-foreground"
            }`}
          >
            {v.label}
            {v.price !== basePrice && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                {formatPrice(v.price)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* AddToCart with the variant's price */}
      <AddToCartButton
        productId={productId}
        name={selected !== null ? `${name} (${sorted[selected].label})` : name}
        imageKey={imageKey}
        price={activePrice}
        stock={stock}
      />
    </div>
  );
}
