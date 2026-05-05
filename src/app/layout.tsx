import CartDrawer from "@/components/cart/CartDrawer";
import CartSync from "@/components/cart/CartSync";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/layout/Providers";
import BackButton from "@/components/layout/BackButton";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AziMarket — Монгол дэлгүүр",
  description: "Чанартай бараа бүтээгдэхүүн хямд үнээр",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="mn">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers session={session}>
          <CartSync />
          <Navbar />
          <CartDrawer />
          <main className="min-h-screen bg-background pt-16">
            <div className="md:px-24 px-4 py-8">
              <BackButton />
              {children}
            </div>
          </main>
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
