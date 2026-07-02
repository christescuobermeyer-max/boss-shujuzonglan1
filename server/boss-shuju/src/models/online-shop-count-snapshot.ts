import mongoose, { InferSchemaType, type Model } from "mongoose";

const { Schema, model, models } = mongoose;

const onlineShopCountSnapshotSchema = new Schema(
  {
    platform: { type: String, required: true, enum: ["meituan", "eleme"], index: true },
    statDateKey: { type: String, required: true, trim: true, index: true },
    count: { type: Number, required: true, min: 0 },
    capturedAt: { type: Date, required: true, index: true }
  },
  {
    collection: "online_shop_count_snapshots"
  }
);

onlineShopCountSnapshotSchema.index({ statDateKey: -1, capturedAt: -1 });

export type OnlineShopCountSnapshotDocument = InferSchemaType<
  typeof onlineShopCountSnapshotSchema
>;

export const OnlineShopCountSnapshot: Model<OnlineShopCountSnapshotDocument> =
  (models.OnlineShopCountSnapshot as Model<OnlineShopCountSnapshotDocument>) ||
  model<OnlineShopCountSnapshotDocument>(
    "OnlineShopCountSnapshot",
    onlineShopCountSnapshotSchema
  );

