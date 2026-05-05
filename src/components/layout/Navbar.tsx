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
import { getImageUrl } from "@/lib/cloudinary";
import { formatPrice } from "@/lib/utils";
import { useSearchProducts } from "@/services/hooks/useProducts";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";
import {
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const { isNavOpen, setNavOpen } = useUIStore();
  const { setCartOpen, toggleCart } = useUIStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const { data: searchResults } = useSearchProducts(debouncedSearch);

  const navLinks = [
    { href: "/products", label: "Бүтээгдэхүүн" },
    { href: "/products?category=", label: "Ангилал" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="md:px-24 px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl text-primary flex-shrink-0">
          AziMarket
        </Link>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Бараа хайх..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {debouncedSearch.length >= 2 &&
            searchResults &&
            searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
                {(
                  searchResults as Array<{
                    _id: string;
                    name: string;
                    slug: string;
                    imageKeys: string[];
                    price: number;
                  }>
                ).map((p) => (
                  <Link
                    key={p._id}
                    href={`/products/${p.slug}`}
                    onClick={() => setSearchQuery("")}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <div className="relative w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={getImageUrl(p.imageKeys?.[0] ?? "", { width: 64 })}
                        alt={p.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{p.name}</p>
                      <p className="text-xs text-primary">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                  </Link>
                ))}
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
            {totalItems > 0 && (
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
                  onClick={() => { clearCart(); signOut({ callbackUrl: "/" }); }}
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
        <SheetContent side="left" className="w-72">
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
            <input
              type="text"
              placeholder="Бараа хайх..."
              className="w-full px-3 py-2 text-sm border rounded-lg bg-muted/50 focus:outline-none"
            />
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
