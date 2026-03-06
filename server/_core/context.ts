import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// 演示模式用户（无 OAuth 配置时自动注入）
const DEMO_USER: User = {
  id: 8,
  openId: "demo-user",
  name: "系统管理员",
  email: "admin@shenyun.com",
  loginMethod: "password",
  role: "admin",
  department: "管理部",
  position: "管理员",
  phone: null,
  visibleApps: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // 无 OAuth 配置时自动使用演示用户（调试模式）
  if (!ENV.oAuthServerUrl) {
    user = DEMO_USER;
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
