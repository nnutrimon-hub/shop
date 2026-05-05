"use client";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on home page and all admin pages (admin has its own sidebar nav)
  if (pathname === "/" || pathname.startsWith("/admin")) return null;

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 -mt-2 group"
    >
      <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      Буцах
    </button>
  );
}
