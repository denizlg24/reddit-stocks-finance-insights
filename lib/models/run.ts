import mongoose, { type InferSchemaType } from "mongoose";

const runSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      required: true,
    },
    prompt: { type: String, required: true },
    response: { type: String, default: "" },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    searchQueries: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },
    errorMessage: { type: String },
    emailsSentTo: { type: [String], default: [] },
    redditSource: {
      type: String,
      enum: ["reddit", "arctic-shift", "none"],
      default: "none",
    },
    redditPostCount: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export type RunDocument = InferSchemaType<typeof runSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Run =
  (mongoose.models.Run as mongoose.Model<RunDocument>) ??
  mongoose.model<RunDocument>("Run", runSchema);
