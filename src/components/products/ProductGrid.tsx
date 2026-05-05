"use client";
import SkeletonGrid from "@/components/shared/SkeletonGrid";
import ProductCard from "./ProductCard";

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
  products: Product[];
  isLoading?: boolean;
}

export default function ProductGrid({ products, isLoading }: Props) {
  if (isLoading) return <SkeletonGrid />;

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-lg">Бараа олдсонгүй</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
