import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeliveryZone extends Document {
  district: string;
  fee: number;
}

const DeliveryZoneSchema = new Schema<IDeliveryZone>({
  district: { type: String, required: true, unique: true, trim: true },
  fee: { type: Number, required: true, min: 0 },
});

const DeliveryZone: Model<IDeliveryZone> =
  mongoose.models.DeliveryZone ??
  mongoose.model<IDeliveryZone>("DeliveryZone", DeliveryZoneSchema);

export default DeliveryZone;
