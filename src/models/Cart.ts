import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface CartItem {
  product: Types.ObjectId;
  name: string;
  imageKey: string;
  price: number;
  quantity: number;
}

export interface ICart extends Document {
  userId?: Types.ObjectId;
  guestId?: string;
  items: CartItem[];
  expireAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
      index: true,
    },
    guestId: { type: String, sparse: true, index: true },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        imageKey: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

CartSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const Cart: Model<ICart> =
  mongoose.models.Cart ?? mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
