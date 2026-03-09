import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // 1. 尝试从 Cookie 中读取本地登录信息 (用于演示和本地用户名密码模式)
  const cookieValue = opts.req.cookies?.[COOKIE_NAME];
  if (cookieValue) {
    try {
      // 在实际生产中应该使用 JWT 签名校验，这里为了演示和快速切换，先尝试解析 JSON
      // 兼容可能存在的加密格式
      if (cookieValue.startsWith('{')) {
        user = JSON.parse(cookieValue);
      }
    } catch (e) {
      // 解析失败则忽略
    }
  }

  // 2. 如果 Cookie 中没有，且有 OAuth 配置，则尝试 OAuth 校验
  if (!user && ENV.oAuthServerUrl) {
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
