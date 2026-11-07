import { Router, Response } from 'express';
import bcrypt from "bcrypt";
import { z } from "zod";
import crypto from 'crypto'
import { User } from "../models/User";
import { signToken } from "../utils/jwt";
import { toPublicUser } from "../utils/serialize";
import { sendEmail, welcomeEmail } from "../utils/sendMail";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import {registerLimiter, loginLimiter, accountLockLimiter} from "../middleware/rateLimit";

const router = Router();

const registerSchema = z.object({
  username: z.string().trim().min(3).max(24),
  email: z.string().email(),  
  password: z.string().min(6).max(72),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1),   
  password: z.string().min(6).max(72),
});




router.post("/register", registerLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    return;
  }
  const { username, email, password } = parsed.data;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }
   const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    res.status(409).json({ message: "Username already taken" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash });

  const token = signToken({ sub: user._id.toString(), username: user.username });
  res.status(201).json({ token, user: toPublicUser(user) });
  await welcomeEmail(user.email);
});

router.post("/login", loginLimiter, accountLockLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
      return  res.status(400).json({ message: "Invalid input" });
    return;
  }
  const { identifier, password } = parsed.data;
  

  const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier.toLowerCase() }] });
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
   return  res.status(401).json({ message: "Invalid username or password" });
    
  }

  const token = signToken({ sub: user._id.toString(), username: user.username });
  return res.json({ token, user: toPublicUser(user) });
});


router.post("/forgot-password", async (req, res) => {
  console.log("forgot-password hit");
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Same response either way — don't leak whether the email is registered
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires =  new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password reset',
      html: `<p>Click to reset your password. Expires in 15 minutes.</p><a href="${resetUrl}">${resetUrl}</a>`,
    });

   return res.json({ message: 'If that email is registered, a reset link has been sent' });
  } catch (err) {
   return res.status(500).json({ message: 'Server error' });
  }
}
 )  


router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Token is invalid or has expired' });

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

   return res.json({ message: 'Password updated' });
  } catch (err) {
   return res.status(500).json({ message: 'Server error' });
  }
}

);


router.post("/update-email", requireAuth, async (req:AuthedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { email } = req.body;
    const existing = await User.findOne({ email });
    if (existing && existing._id.toString() !== req.user.sub.toString()) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    const user = await User.findByIdAndUpdate(req.user.sub.toString(), { email }, { new: true });
if (!user) {
  return res.status(404).json({ message: "User not found" });
}
return res.json({ id: user._id, username: user.username, email: user.email });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
