"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { getImageUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { useInfiniteSearchProducts } from "@/services/hooks/useProducts";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";
import {
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  imageKeys: string[];
  price: number;
  salePrice?: number | null;
}

function SearchDropdown({
  q,
  onSelect,
  cols = 3,
}: {
  q: string;
  onSelect: () => void;
  cols?: 2 | 3;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteSearchProducts(q);
  const sentinelRef = useInfiniteScroll(
    fetchNextPage,
    !!hasNextPage && !isFetchingNextPage,
  );

  const products =
    data?.pages.flatMap((p) => p.products as unknown as SearchProduct[]) ?? [];

  if (products.length === 0 && !isFetchingNextPage) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Хайлт олдсонгүй
      </div>
    );
  }

  return (
    <div>
      <div
        className={`grid gap-2 p-3 ${cols === 2 ? "grid-cols-2" : "grid-cols-3"}`}
      >
        {products.map((p) => {
          const hasDiscount =
            p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price;
          const displayPrice = hasDiscount ? p.salePrice! : p.price;
          return (
            <Link
              key={p._id}
              href={`/products/${p.slug}`}
              onClick={onSelect}
              className="rounded-lg border bg-card hover:bg-muted transition-colors overflow-hidden"
            >
              <div className="relative aspect-square bg-muted">
                {p.imageKeys?.[0] ? (
                  <Image
                    src={getImageUrl(p.imageKeys[0], { width: 200 })}
                    alt={p.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="p-1.5 space-y-0.5">
                <p className="text-xs font-medium line-clamp-2 leading-snug">
                  {p.name}
                </p>
                <p className="text-xs text-primary font-semibold">
                  {formatPrice(displayPrice)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {/* Sentinel — triggers next page load when visible */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="py-3 text-center text-xs text-muted-foreground">
          Ачааллаж байна...
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const { isNavOpen, setNavOpen } = useUIStore();
  const { toggleCart } = useUIStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedMobile = useDebounce(mobileQuery, 400);
  const desktopSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks = [
    { href: "/products", label: "Бүтээгдэхүүн" },
    // { href: "/products?category=", label: "Ангилал" },
  ];

  const showDesktop = searchOpen && debouncedSearch.length >= 2;
  const showMobile = debouncedMobile.length >= 2;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="md:px-24 px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl text-primary flex-shrink-0">
          AziMarket
        </Link>

        {/* Desktop search */}
        <div
          ref={desktopSearchRef}
          className="hidden md:flex flex-1 max-w-md relative"
        >
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Бараа хайх..."
              value={searchQuery}
              maxLength={50}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full px-4 py-2 pr-8 text-sm border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {showDesktop && (
            <div className="absolute top-full mt-1  -left-4 min-w-[480px] bg-background border rounded-xl shadow-xl z-50 max-h-[420px] overflow-y-auto">
              <SearchDropdown
                q={debouncedSearch}
                onSelect={() => setSearchQuery("")}
                cols={3}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Cart button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCart}
            className="relative"
            aria-label="Сагс"
          >
            <ShoppingCart className="w-5 h-5" />
            {mounted && totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {totalItems > 99 ? "99+" : totalItems}
              </Badge>
            )}
          </Button>

          {/* User menu */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" />}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session.user?.image ?? ""} />
                  <AvatarFallback>
                    {session.user?.name?.[0]?.toUpperCase() ?? "Х"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium truncate">
                  {session.user?.name}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/accounts/orders" />}>
                  <Package className="w-4 h-4 mr-2" />
                  Миний захиалгууд
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/accounts/profile" />}>
                  <Settings className="w-4 h-4 mr-2" />
                  Профайл
                </DropdownMenuItem>
                {["admin", "superadmin", "moderator"].includes(
                  session.user?.role ?? "",
                ) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem render={<Link href="/admin" />}>
                      <User className="w-4 h-4 mr-2" />
                      Удирдлага
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    clearCart();
                    signOut({ callbackUrl: "/" });
                  }}
                  className="text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Гарах
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button render={<Link href="/auth/login" />} size="sm">
              Нэвтрэх
            </Button>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Цэс"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={isNavOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          className="w-72 flex flex-col overflow-hidden"
        >
          <SheetHeader>
            <SheetTitle>
              <Link
                href="/"
                onClick={() => setNavOpen(false)}
                className="text-primary font-bold text-lg"
              >
                AziMarket
              </Link>
            </SheetTitle>
          </SheetHeader>

          {/* Mobile search */}
          <div className="mt-4">
            <div className="relative px-2">
              <input
                type="text"
                placeholder="Бараа хайх..."
                value={mobileQuery}
                maxLength={50}
                onChange={(e) => setMobileQuery(e.target.value)}
                className="w-full px-3 py-2 pr-8 text-sm border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {mobileQuery.length > 0 && (
                <button
                  onClick={() => setMobileQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors px-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showMobile && (
              <div className="mt-1 border rounded-xl bg-background max-h-[360px] overflow-y-auto">
                <SearchDropdown
                  q={debouncedMobile}
                  onSelect={() => {
                    setMobileQuery("");
                    setNavOpen(false);
                  }}
                  cols={2}
                />
              </div>
            )}
          </div>

          <nav className="mt-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setNavOpen(false)}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {!session && (
            <div className="mt-6">
              <Button
                render={<Link href="/auth/login" />}
                className="w-full"
                onClick={() => setNavOpen(false)}
              >
                Нэвтрэх
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}
