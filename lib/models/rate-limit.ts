import mongoose, { type InferSchemaType } from "mongoose";

const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, index: true },
  timestamps: { type: [Date], default: [] },
});

export type RateLimitDocument = InferSchemaType<typeof rateLimitSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RateLimit =
  (mongoose.models.RateLimit as mongoose.Model<RateLimitDocument>) ??
  mongoose.model<RateLimitDocument>("RateLimit", rateLimitSchema);
