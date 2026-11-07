import { Types } from "mongoose";
import { IUser } from "../models/User";
import { PublicUser, MessagePayload } from "../types";

export function toPublicUser(user: IUser): PublicUser {
  return {
    id: user._id.toString(),
    username: user.username,
    avatarColor: user.avatarColor,
    lastSeen: user.lastSeen.toISOString(),
  };
}

/**
 * Accepts the subset of a Message document we need, rather than the exact
 * IMessage type — callers typically pass a `.populate("sender")` result,
 * whose `sender` field is an IUser instead of the raw ObjectId that IMessage
 * declares, so a structural type keeps this function usable in both cases.
 */
interface MessageLike {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  content: string;
  createdAt: Date;
  readBy: Types.ObjectId[];
}

export function toMessagePayload(message: MessageLike, sender: IUser): MessagePayload {
  return {
    id: message._id.toString(),
    conversationId: message.conversation.toString(),
    sender: toPublicUser(sender),
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    readBy: message.readBy.map((id) => id.toString()),
  };
}
