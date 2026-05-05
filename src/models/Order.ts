import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { OrderStatus } from "@/types";

interface OrderItem {
  product: Types.ObjectId;
  name: string;
  imageKey: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  orderId: string;
  userId: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryFee: number;
  district: string;
  address: string;
  phone: string;
  recipientName: string;
  qpayInvoiceId?: string;
  qpayShortUrl?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        name: String,
        imageKey: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "awaiting_payment",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    deliveryFee: { type: Number, default: 0 },
    district: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    recipientName: { type: String, required: true },
    qpayInvoiceId: String,
    qpayShortUrl: String,
    paidAt: Date,
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderId: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
