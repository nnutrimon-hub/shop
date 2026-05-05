import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import Category from "@/models/Category";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Tag,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
} from "lucide-react";
import Link from "next/link";

async function getStats() {
  try {
    await connectDB();
    const [totalOrders, totalProducts, totalUsers, totalCategories, revenueResult, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments({ isDeleted: false }),
        User.countDocuments(),
        Category.countDocuments(),
        Order.aggregate([
          {
            $match: {
              status: { $in: ["paid", "processing", "shipped", "delivered"] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $add: ["$totalAmount", "$deliveryFee"] } },
            },
          },
        ]),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select("orderId status totalAmount deliveryFee createdAt recipientName")
          .lean(),
      ]);

    return {
      totalOrders,
      totalProducts,
      totalUsers,
      totalCategories,
      revenue: revenueResult[0]?.total ?? 0,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    };
  } catch {
    return {
      totalOrders: 0,
      totalProducts: 0,
      totalUsers: 0,
      totalCategories: 0,
      revenue: 0,
      recentOrders: [],
    };
  }
}

const STATUS_ICON: Record<string, React.ElementType> = {
  pending: Clock,
  awaiting_payment: Clock,
  paid: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: Package,
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50",
  awaiting_payment: "text-orange-600 bg-orange-50",
  paid: "text-blue-600 bg-blue-50",
  processing: "text-purple-600 bg-purple-50",
  shipped: "text-indigo-600 bg-indigo-50",
  delivered: "text-green-600 bg-green-50",
  cancelled: "text-red-600 bg-red-50",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Хүлээгдэж байна",
  awaiting_payment: "Төлбөр хүлээж байна",
  paid: "Төлсөн",
  processing: "Боловсруулж байна",
  shipped: "Хүргэлтэнд гарсан",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцалсан",
};

export default async function AdminDashboard() {
  await auth();
  const stats = await getStats();

  const statCards = [
    {
      icon: ShoppingBag,
      label: "Нийт захиалга",
      value: stats.totalOrders.toString(),
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/orders",
    },
    {
      icon: Package,
      label: "Нийт бараа",
      value: stats.totalProducts.toString(),
      color: "text-violet-600",
      bg: "bg-violet-50",
      href: "/admin/products",
    },
    {
      icon: Tag,
      label: "Ангилал",
      value: stats.totalCategories.toString(),
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/admin/categories",
    },
    {
      icon: Users,
      label: "Хэрэглэгч",
      value: stats.totalUsers.toString(),
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/admin/users",
    },
    {
      icon: TrendingUp,
      label: "Нийт орлого",
      value: formatPrice(stats.revenue),
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/orders",
    },
  ];

  const quickLinks = [
    { href: "/admin/products", label: "Бараа нэмэх", icon: Package },
    { href: "/admin/categories", label: "Ангилал нэмэх", icon: Tag },
    { href: "/admin/orders", label: "Захиалга харах", icon: ShoppingBag },
    { href: "/admin/users", label: "Хэрэглэгч харах", icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Удирдлагын самбар</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AziMarket системийн ерөнхий мэдээлэл
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group p-5 rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}
            >
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-muted-foreground text-xs font-medium">{card.label}</p>
            <p className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 border rounded-xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-sm">Сүүлийн захиалгууд</h2>
            <Link
              href="/admin/orders"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Бүгдийг харах <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Захиалга байхгүй байна
            </div>
          ) : (
            <div className="divide-y">
              {(
                stats.recentOrders as Array<{
                  _id: string;
                  orderId: string;
                  status: string;
                  totalAmount: number;
                  deliveryFee: number;
                  recipientName: string;
                  createdAt: string;
                }>
              ).map((order) => {
                const Icon = STATUS_ICON[order.status] ?? Package;
                const colorClass = STATUS_COLOR[order.status] ?? "text-muted-foreground bg-muted";
                return (
                  <div
                    key={order._id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {order.orderId}
                        <span className="font-normal text-muted-foreground ml-2 text-xs">
                          {order.recipientName}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {STATUS_LABEL[order.status] ?? order.status}
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">
                      {formatPrice(order.totalAmount + (order.deliveryFee ?? 0))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-sm">Хурдан үйлдэл</h2>
          </div>
          <div className="p-3 space-y-1">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <link.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {link.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
