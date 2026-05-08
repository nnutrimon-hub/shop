"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Самбар", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Бараа", icon: Package },
  { href: "/admin/categories", label: "Ангилал", icon: Tag },
  { href: "/admin/orders", label: "Захиалга", icon: ShoppingBag },
  { href: "/admin/users", label: "Хэрэглэгч", icon: Users },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r bg-card">
        <div className="flex items-center gap-2 px-4 py-5 border-b">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Store className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm tracking-tight">
            AziMarket Админ
          </span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Store className="w-4 h-4 shrink-0" />
            Дэлгүүр руу буцах
          </Link>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 overflow-auto">
        <div className="p-6 pb-20 md:pb-6">{children}</div>
      </main>
    </div>
  );
}

