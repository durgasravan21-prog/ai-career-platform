import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ENV } from "./env";

const isLocalMode = !ENV.forgeApiUrl || ENV.forgeApiUrl.trim().length === 0;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  if (isLocalMode) {
    // Local dev mode: register simple auth endpoints that return the dev user
    console.log("[server] 🔧 LOCAL DEV MODE — OAuth and storage proxy disabled");

    app.get("/api/auth/me", (_req, res) => {
      res.json({
        user: {
          id: 1,
          openId: "local-dev-user",
          name: "Durga Sravan",
          email: "durga@example.com",
          loginMethod: "local",
          lastSignedIn: new Date().toISOString(),
        },
      });
    });

    app.post("/api/auth/logout", (_req, res) => {
      res.json({ success: true });
    });

    app.post("/api/auth/session", (_req, res) => {
      res.json({ success: true });
    });
  } else {
    // Production mode: register real OAuth and storage proxy
    const { registerOAuthRoutes } = await import("./oauth");
    const { registerStorageProxy } = await import("./storageProxy");
    registerStorageProxy(app);
    registerOAuthRoutes(app);
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    if (isLocalMode) {
      console.log(`[api] 🌐 API available at http://localhost:${port}`);
      console.log(`[api] 👤 Auto-authenticated as: Durga Sravan`);
    }
  });
}

startServer().catch(console.error);
