import { Schema, model, Document, Types } from "mongoose";

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  isGroup: boolean;
  name?: string;
  lastMessageAt: Date;
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  isGroup: { type: Boolean, default: false },
  name: { type: String, trim: true, maxlength: 60 },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

conversationSchema.index({ participants: 1 });

export const Conversation = model<IConversation>("Conversation", conversationSchema);
