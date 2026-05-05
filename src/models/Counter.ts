import mongoose, { Schema, Model } from "mongoose";

interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter: Model<ICounter> =
  mongoose.models.Counter ??
  mongoose.model<ICounter>("Counter", CounterSchema);

export async function nextOrderId(year: number): Promise<string> {
  const key = `order_${year}`;
  const doc = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  const seq = ((doc!.seq - 1) + 1001).toString();
  return `AZI-${year}-${seq}`;
}

export default Counter;
