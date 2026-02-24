import mongoose, { type InferSchemaType } from "mongoose";

const recipientSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type RecipientDocument = InferSchemaType<typeof recipientSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Recipient =
  (mongoose.models.Recipient as mongoose.Model<RecipientDocument>) ??
  mongoose.model<RecipientDocument>("Recipient", recipientSchema);
