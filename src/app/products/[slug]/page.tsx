import { getImageUrl } from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongoose";
import { formatPrice } from "@/lib/utils";
import Product from "@/models/Product";
import { Truck } from "lucide-react";
import { notFound } from "next/navigation";
import AddToCartButton from "./AddToCartButton";
import ImageGallery from "./ImageGallery";
import VariantSelector from "./VariantSelector";

type Props = { params: Promise<{ slug: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  try {
    await connectDB();
    const product = await Product.findOne({ slug })
      .populate("category", "name slug")
      .lean();

    if (!product) return notFound();

    const p = JSON.parse(JSON.stringify(product)) as {
      _id: string;
      name: string;
      brand: string;
      description: string;
      barcode: string;
      imageKeys: string[];
      price: number;
      salePrice?: number | null;
      stock: number;
      isFeatured: boolean;
      variants: { label: string; price: number; order: number }[];
      category: { name: string; slug: string };
    };

    const hasDiscount =
      p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price;
    const discountPct = hasDiscount
      ? Math.round((1 - p.salePrice! / p.price) * 100)
      : 0;
    const savings = hasDiscount ? p.price - p.salePrice! : 0;
    const displayPrice = hasDiscount ? p.salePrice! : p.price;

    const coverKey = p.imageKeys?.[0] ?? "";

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* ── Image gallery ───────────────────────────────────────────── */}
          <div>
            {p.imageKeys?.length > 1 ? (
              <ImageGallery imageKeys={p.imageKeys} name={p.name} />
            ) : (
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                {coverKey ? (
                  <img
                    src={getImageUrl(coverKey, { width: 700 })}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                    Зураг байхгүй
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Product info ────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Brand */}
            {p.brand && (
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {p.brand}
              </p>
            )}

            {/* Name */}
            <h1 className="text-2xl font-bold leading-snug">{p.name}</h1>

            {/* Pricing */}
            <div className="space-y-1">
              {hasDiscount ? (
                <>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(p.price)}
                    </p>
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                      -{discountPct}%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {formatPrice(p.salePrice!)}
                  </p>
                  <p className="text-sm text-orange-500 font-medium">
                    Хэмнэлт: {formatPrice(savings)}
                  </p>
                </>
              ) : (
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(p.price)}
                </p>
              )}
            </div>

            {/* Barcode */}
            {p.barcode && (
              <p className="text-sm text-muted-foreground">
                Бүтээгдэхүүний код:{" "}
                <span className="font-semibold text-foreground">{p.barcode}</span>
              </p>
            )}

            {/* Variants */}
            {p.variants?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Хэмжээ</p>
                <VariantSelector
                  variants={p.variants}
                  basePrice={displayPrice}
                  productId={p._id}
                  name={p.name}
                  imageKey={coverKey}
                  stock={p.stock}
                />
              </div>
            )}

            {/* Cart buttons (only if no variants, otherwise VariantSelector handles it) */}
            {(!p.variants || p.variants.length === 0) && (
              <AddToCartButton
                productId={p._id}
                name={p.name}
                imageKey={coverKey}
                price={displayPrice}
                stock={p.stock}
              />
            )}

            {/* Delivery */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="w-4 h-4" />
              <span>Хүргэлттэй</span>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Үлдэгдэл:</span>
              <span
                className={`text-sm font-medium ${p.stock > 0 ? "text-green-600" : "text-destructive"}`}
              >
                {p.stock > 0 ? `${p.stock} ширхэг байна` : "Дууссан"}
              </span>
            </div>

            {/* Description accordion */}
            {p.description && (
              <details className="border rounded-xl">
                <summary className="px-4 py-3 text-sm font-semibold cursor-pointer select-none hover:bg-muted/50 rounded-xl transition-colors">
                  Дэлгэрэнгүй мэдээлэл
                </summary>
                <div
                  className="px-4 pb-4 pt-2 prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: p.description }}
                />
              </details>
            )}
          </div>
        </div>
      </div>
    );
  } catch {
    return notFound();
  }
}
