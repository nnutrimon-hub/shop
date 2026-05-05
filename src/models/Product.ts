import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface PriceHistoryEntry {
  price: number;
  changedAt: Date;
}

export interface IVariant {
  label: string;
  price: number;
  order: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  brand: string;
  description: string;
  barcode: string;
  imageKeys: string[];
  price: number;
  salePrice?: number;
  priceHistory: PriceHistoryEntry[];
  stock: number;
  category: Types.ObjectId;
  isFeatured: boolean;
  variants: IVariant[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    brand: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    barcode: { type: String, default: "", trim: true },
    imageKeys: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null },
    priceHistory: [
      {
        price: { type: Number, required: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    stock: { type: Number, default: 0, min: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isFeatured: { type: Boolean, default: false },
    variants: { type: [VariantSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ salePrice: 1 });

ProductSchema.pre(/^find/, function (next) {
  (this as mongoose.Query<unknown, unknown>).where({ isDeleted: false });
  next();
});

const Product: Model<IProduct> =
  mongoose.models.Product ??
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
