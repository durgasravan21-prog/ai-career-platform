import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";

const isLocalMode = !ENV.forgeApiUrl || ENV.forgeApiUrl.trim().length === 0;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Local dev user — always authenticated
const LOCAL_DEV_USER: User = {
  id: 1,
  openId: "local-dev-user",
  name: "Durga Sravan",
  email: "durga@example.com",
  loginMethod: "local",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// Lazily resolved SDK (only loaded once, in production mode)
let sdkInstance: any = null;
async function getSdk() {
  if (!sdkInstance) {
    const mod = await import("./sdk");
    sdkInstance = mod.sdk;
  }
  return sdkInstance;
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  if (isLocalMode) {
    // In local dev mode, always use the dev user
    user = LOCAL_DEV_USER;
  } else {
    try {
      const sdk = await getSdk();
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
