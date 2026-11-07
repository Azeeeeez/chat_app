import express, { Express, Request, Response, NextFunction } from "express";
import "express-async-errors"; // patches Router so rejected async handlers reach the error middleware
import cors from 'cors';
import authRoutes from "./routes/auth.routes";
import conversationRoutes from "./routes/conversation.routes";
import userRoutes from "./routes/user.routes";
import './config';
const client = process.env.CLIENT_ORIGIN;

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: client, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/users", userRoutes);

  // Centralized error handler — keeps route handlers free of try/catch boilerplate
  // when combined with express-async-errors-style rejection forwarding below.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[error]", err);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}
