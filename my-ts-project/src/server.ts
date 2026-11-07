import { createServer } from "http";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { initializeSocket } from "./sockets";
import './config';
const PORT = parseInt(String(process.env.PORT))

async function main(): Promise<void> {
  await connectDB();

  const app = createApp();
  const httpServer = createServer(app);
  initializeSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal startup error", err);
  process.exit(1);
});
