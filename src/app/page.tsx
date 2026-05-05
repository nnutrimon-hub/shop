import ProductGrid from "@/components/products/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";
import {
  ArrowRight,
  CreditCard,
  HeartHandshake,
  Package,
  Shield,
  Star,
  Truck,
} from "lucide-react";
import mongoose from "mongoose";
import Link from "next/link";

async function getFeaturedProducts() {
  try {
    await connectDB();
    const products = await Product.find({ isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

async function getOnSaleProducts() {
  try {
    await connectDB();
    const products = await Product.find({
      salePrice: mongoose.trusted({ $ne: null, $gt: 0 }),
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

async function getRecentProducts() {
  try {
    await connectDB();
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    await connectDB();
    const cats = await Category.find().limit(8).lean();
    return JSON.parse(JSON.stringify(cats));
  } catch {
    return [];
  }
}

const CATEGORY_EMOJIS = ["🧴", "👗", "👟", "🏠", "📱", "🎁", "🌿", "💎"];

export default async function HomePage() {
  const [featured, onSale, recent, categories] = await Promise.all([
    getFeaturedProducts(),
    getOnSaleProducts(),
    getRecentProducts(),
    getCategories(),
  ]);
  console.log(featured);

  return (
    <div className="space-y-16">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-white/5" />
        </div>

        <div className="relative px-8 py-14 md:px-16 md:py-20">
          <div className="max-w-2xl space-y-6">
            <Badge className="bg-white/20 text-white border-0 text-xs font-medium px-3 py-1">
              🇲🇳 Монголын шилдэг онлайн дэлгүүр
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Чанартай бараа.
              <br />
              Хурдан хүргэлт.
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-md">
              Улаанбаатарт өдрийн хүргэлт. QPay болон карт хүлээн авна.
              Баталгаат бараа бүтээгдэхүүн.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 hover:text-white font-semibold shadow-lg"
                render={<Link href="/products" />}
              >
                Дэлгүүр хэсэх
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {categories.length > 0 && (
                <Button
                  size="lg"
                  className="border-white/40 text-white hover:bg-white/10"
                  render={
                    <Link
                      href={`/products?category_id=${(categories as Array<{ _id: string }>)[0]._id}`}
                    />
                  }
                >
                  Ангилал харах
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { icon: Star, label: "4.9★ үнэлгээ" },
                { icon: Package, label: "1000+ бараа" },
                { icon: HeartHandshake, label: "Баталгаат" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-sm text-primary-foreground/80"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Truck,
            title: "Хурдан хүргэлт",
            desc: "УБ хотод өдрийн дотор хүргэнэ",
            color: "text-blue-600 bg-blue-50",
          },
          {
            icon: Shield,
            title: "Баталгаат бараа",
            desc: "100% жинхэнэ, чанарын баталгаатай",
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            icon: CreditCard,
            title: "Аюулгүй төлбөр",
            desc: "QPay, карт, бэлэн мөнгө хүлээн авна",
            color: "text-primary bg-primary/10",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-4 p-5 rounded-2xl border bg-card hover:shadow-sm transition-shadow"
          >
            <div className={`p-3 rounded-xl shrink-0 ${f.color}`}>
              <f.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      {(
        categories as Array<{
          _id: string;
          name: string;
          slug: string;
          imageKey: string;
        }>
      ).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Ангилал</h2>
            <Link
              href="/products"
              className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Бүгдийг үзэх <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {(
              categories as Array<{
                _id: string;
                name: string;
              }>
            ).map((cat, i) => (
              <Link
                key={cat._id}
                href={`/products?category_id=${cat._id}`}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border bg-card hover:border-primary hover:bg-primary/5 hover:shadow-sm transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                  <span className="text-2xl">
                    {CATEGORY_EMOJIS[i % CATEGORY_EMOJIS.length]}
                  </span>
                </div>
                <span className="text-xs font-medium text-center line-clamp-2 group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Онцлох (Featured) ────────────────────────────────────────────── */}
      {(featured as unknown[]).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Онцлох</h2>
              <Badge className="bg-primary/10 text-primary border-0 text-[11px]">
                ⭐ Онцлох
              </Badge>
            </div>
            <Link
              href="/products?featured=true"
              className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Бүгдийг үзэх <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}

      {/* ── Хямдрал (Sale) ───────────────────────────────────────────────── */}
      {(onSale as unknown[]).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Хямдрал</h2>
              <Badge className="bg-red-100 text-red-600 border-0 text-[11px]">
                🔥 Хямдарсан
              </Badge>
            </div>
            <Link
              href="/products?sale=true"
              className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Бүгдийг үзэх <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ProductGrid products={onSale} />
        </section>
      )}

      {/* ── Бүгд link ────────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <Button
          size="lg"
          variant="outline"
          className="px-12 font-semibold"
          render={<Link href="/products" />}
        >
          Бүгд
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* ── Сүүлд нэмэгдсэн ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Сүүлд нэмэгдсэн</h2>
            <Badge className="bg-primary/10 text-primary border-0 text-[11px]">
              Шинэ
            </Badge>
          </div>
          <Link
            href="/products"
            className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
          >
            Бүгдийг үзэх <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <ProductGrid products={recent} />
      </section>

      {/* ── Бүгд link (bottom) ───────────────────────────────────────────── */}
      <div className="flex justify-center pb-4">
        <Button
          size="lg"
          variant="outline"
          className="px-12 font-semibold"
          render={<Link href="/products" />}
        >
          Бүгд
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* ── Why AziMarket ─────────────────────────────────────────────────── */}
      <section className="rounded-3xl border bg-card p-8 md:p-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-bold">Яагаад AziMarket?</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Монголын тэргүүлэх онлайн дэлгүүр — хурдан, найдвартай, хямд
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              emoji: "🚀",
              title: "Хурдан хүргэлт",
              desc: "УБ хотод өдрийн дотор хүргэнэ",
            },
            {
              emoji: "💯",
              title: "Баталгаат чанар",
              desc: "Бүх бараа 100% жинхэнэ, батлагдсан",
            },
            {
              emoji: "🔒",
              title: "Аюулгүй худалдаа",
              desc: "QPay болон карт хүлээн авна",
            },
            {
              emoji: "🤝",
              title: "Найдвартай үйлчилгээ",
              desc: "Хэрэглэгчийн дэмжлэг 7 хоног, 24 цаг",
            },
          ].map((item) => (
            <div key={item.title} className="text-center space-y-2">
              <span className="text-4xl">{item.emoji}</span>
              <h3 className="font-semibold text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
