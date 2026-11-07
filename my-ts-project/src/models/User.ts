import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  avatarColor: string;
  lastSeen: Date;
  createdAt: Date;
  status: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const AVATAR_COLORS = ["#3A6B5C", "#C79A3D", "#4C6B8A", "#8A4C6B", "#6B8A4C"];

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 24,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
  },
  passwordHash: { type: String, required: true, minlength: 8 },
  avatarColor: {
    type: String,
    default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  status: {type: String, required: true, default: "unrestricted"},
  resetPasswordToken: {type: String, required: false },
  resetPasswordExpires: {type: Date, required: false},
});

userSchema.index({ username: 1 }, { unique: true });

export const User = model<IUser>("User", userSchema);
