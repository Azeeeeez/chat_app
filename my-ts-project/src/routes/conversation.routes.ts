import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { User, IUser } from "../models/User";
import { toPublicUser, toMessagePayload } from "../utils/serialize";

const router = Router();
router.use(requireAuth);

/** List all conversations the current user belongs to, newest activity first. */
router.get("/", async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;

  const conversations = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1 })
    .populate<{ participants: IUser[] }>("participants");

  const shaped = await Promise.all(
    conversations.map(async (conversation) => {
      const lastMessage = await Message.findOne({ conversation: conversation._id })
        .sort({ createdAt: -1 })
        .populate<{ sender: IUser }>("sender");

      return {
        id: conversation._id.toString(),
        isGroup: conversation.isGroup,
        name: conversation.name,
        participants: conversation.participants.map((p) => toPublicUser(p)),
        lastMessage: lastMessage ? toMessagePayload(lastMessage, lastMessage.sender) : null,
        lastMessageAt: conversation.lastMessageAt.toISOString(),
      };
    })
  );

  res.json(shaped);
});

const createConversationSchema = z.object({
  participantUsernames: z.array(z.string().trim().min(1)).min(1),
  name: z.string().trim().max(60).optional(),
});

/** Start a new conversation (1:1 if one participant, group if more). Reuses an existing 1:1 thread if one exists. */
router.post("/", async (req: AuthedRequest, res) => {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const { participantUsernames, name } = parsed.data;
  const selfId = req.user!.sub;

  const others = await User.find({ username: { $in: participantUsernames } });
  if (others.length !== participantUsernames.length) {
    res.status(404).json({ message: "One or more usernames not found" });
    return;
  }

  const participantIds = [selfId, ...others.map((u) => u._id.toString())];
  const isGroup = participantIds.length > 2;

  if (!isGroup) {
    const existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: participantIds, $size: 2 },
    });
    if (existing) {
      res.json({ id: existing._id.toString(), reused: true });
      return;
    }
  }

  const conversation = await Conversation.create({
    participants: participantIds,
    isGroup,
    name: isGroup ? name : undefined,
  });

  res.status(201).json({ id: conversation._id.toString(), reused: false });
});

/** Paginated message history for a conversation, oldest-to-newest within each page. */
router.get("/:id/messages", async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id.toString())) {
    res.status(400).json({ message: "Invalid conversation id" });
    return;
  }

  const conversation = await Conversation.findOne({
    _id: id,
    participants: req.user!.sub,
  });
  if (!conversation) {
    res.status(404).json({ message: "Conversation not found" });
    return;
  }

  const before = typeof req.query.before === "string" ? new Date(req.query.before) : new Date();
  const limit = Math.min(parseInt(String(req.query.limit ?? "30"), 10) || 30, 100);

  const messages = await Message.find({ conversation: id, createdAt: { $lt: before } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate<{ sender: IUser }>("sender");

  res.json(messages.reverse().map((m) => toMessagePayload(m, m.sender)));
});

export default router;
