import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { User } from "../models/User";
import { toPublicUser } from "../utils/serialize";

const router = Router();
router.use(requireAuth);

/** Search for users by username prefix, excluding the current user. Used when starting a new chat. */
router.get("/", async (req: AuthedRequest, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const filter: Record<string, unknown> = { _id: { $ne: req.user!.sub } };
  if (search) {
    filter.username = { $regex: `^${search}`, $options: "i" };
  }

  const users = await User.find(filter).limit(10);
  res.json(users.map(toPublicUser));
});

export default router;
