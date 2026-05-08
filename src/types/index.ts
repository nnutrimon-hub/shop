import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

export type UserRole = "superadmin" | "admin" | "moderator" | "user";

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Хүлээгдэж байна",
  awaiting_payment: "Төлбөр хүлээж байна",
  paid: "Төлбөр хийгдсэн",
  processing: "Боловсруулж байна",
  shipped: "Хүргэлтэнд гарсан",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

export type OrderPaymentMethod = "qpay" | "cod";

export const ORDER_PAYMENT_METHOD_LABELS: Record<OrderPaymentMethod, string> =
  {
    qpay: "QPay",
    cod: "Бараа хүлээж аваад төлөх",
  };
