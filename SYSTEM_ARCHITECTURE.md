# 医疗器械 ERP 系统 - 结构与开发指南

**版本**: 1.0
**最后更新**: 2026-03-04
**作者**: Manus AI

## 1. 概述

本文档旨在为神韵医疗器械 ERP 系统的开发与维护人员提供一份全面的技术参考，确保在交接、开发、部署过程中能够高效、无缝地进行。文档详细梳理了项目的技术栈、目录结构、数据库配置、启动流程、核心模块以及开发中的关键注意事项。

## 2. 技术栈

项目采用前后端分离、全栈 TypeScript 的现代化技术架构，具体技术选型如下：

| 分类 | 技术 | 说明 |
|---|---|---|
| **前端** | React 19, Vite, TypeScript | 采用最新的 React 19 构建用户界面，Vite 提供极速的开发服务器和构建体验。 |
| | Tailwind CSS, shadcn/ui | UI 框架，提供原子化 CSS 和高质量、可复用的 UI 组件。 |
| | tRPC, Zod | 实现前后端类型安全的数据通信，Zod 提供强大的数据校验。 |
| | wouter | 轻量级的 React 路由库。 |
| **后端** | Node.js, Express, tsx | 基于 Express 框架构建 API 服务，tsx 提供 TypeScript 的实时编译和运行。 |
| **数据库** | TiDB Cloud (MySQL 兼容) | 分布式、高可用的云原生数据库。 |
| | Drizzle ORM | TypeScript ORM，提供类型安全的数据库查询和迁移。 |
| **构建/部署** | pnpm, esbuild | pnpm 作为包管理器，esbuild 用于快速构建后端代码。 |

## 3. 项目结构

项目采用 Monorepo 结构，将前后端代码统一管理在同一个仓库中。

```
SHENYUN-ERP-1.0/
├── client/                # 前端代码 (Vite + React)
│   ├── src/
│   │   ├── components/    # 可复用 UI 组件
│   │   ├── pages/         # 页面级组件，按模块划分
│   │   ├── lib/           # 工具函数 (trpc.ts, utils.ts)
│   │   └── App.tsx        # 前端路由配置
│   └── vite.config.ts     # Vite 配置文件
├── server/                # 后端代码 (Node.js + Express)
│   ├── _core/             # 核心服务 (启动、认证、数据库连接、Vite集成)
│   │   ├── index.ts       # 服务器启动入口
│   │   ├── context.ts     # tRPC 上下文创建 (含认证逻辑)
│   │   └── vite.ts        # Vite 开发服务器集成
│   ├── db.ts              # 数据库查询函数
│   └── routers.ts         # tRPC 路由定义
├── drizzle/               # Drizzle ORM 相关
│   ├── schema.ts          # 数据库表结构定义
│   └── migrations/        # 数据库迁移历史
├── .env                   # 环境变量文件 (本地开发)
├── package.json           # 项目依赖和脚本
└── SYSTEM_ARCHITECTURE.md # 本文档
```

## 4. 数据库

### 4.1. 连接配置

**关键点**: 所有数据库操作都应通过唯一的环境变量 `DATABASE_URL` 进行配置。在任何情况下，**都不要在代码中硬编码数据库连接字符串**。

- **配置文件**: 项目根目录下的 `.env` 文件。
- **格式**: 标准的 MySQL 连接 URI，包含 SSL 配置。

```env
# .env
DATABASE_URL=\"mysql://paZkiNgy2nHQcsT.root:mB5jFs2uVaZjEegW@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}\"
```

> **注意**: `ssl` 参数的值是一个 JSON 字符串，在 `.env` 文件中需要进行转义，以确保 shell 环境能正确解析。

### 4.2. 表结构 (Schema)

所有数据库表的结构都在 `drizzle/schema.ts` 文件中定义。修改表结构后，需要执行数据库迁移。

- **核心表**: `users`, `customers`, `products`, `sales_orders`, `purchase_orders` 等。
- **示例 (`sales_orders`)**: 包含订单号、客户ID、金额、货币、汇率、本位币金额、状态等关键字段。

### 4.3. 数据库迁移

当 `drizzle/schema.ts` 文件发生变更时，需要通过以下命令生成迁移文件并应用到数据库：

```bash
pnpm db:push
```

## 5. 启动流程

项目支持开发和生产两种模式启动，均通过 `pnpm` 脚本执行。

### 5.1. 开发模式

此模式下，服务器会实时监听文件变动并自动重启，同时 Vite 提供前端的热模块替换 (HMR)。

```bash
# 确保 .env 文件中的 DATABASE_URL 正确配置
pnpm dev
```

- **流程**: `tsx` 运行 `server/_core/index.ts` -> 创建 Express 服务 -> `setupVite()` 启动 Vite 开发服务器 -> Vite 将 `/api` 请求代理到后端 tRPC 中间件。
- **认证**: 开发模式下，如果未配置 OAuth 环境变量，`server/_core/context.ts` 会自动注入一个 **演示用户 (ID=8)**，绕过登录流程。

### 5.2. 生产模式

此模式用于最终部署，会先构建前端静态资源，然后启动一个独立的 Node.js 服务器提供服务。

```bash
# 1. 构建项目
pnpm build

# 2. 启动服务器 (必须通过环境变量传入 DATABASE_URL)
DATABASE_URL=\"your_db_url\" NODE_ENV=production node dist/index.js
```

- **流程**: `vite build` 将前端代码打包到 `dist/public` -> `esbuild` 将后端代码打包到 `dist/index.js` -> `node dist/index.js` 启动服务器 -> Express 通过 `serveStatic` 中间件托管前端静态资源。

## 6. 核心开发注意事项

- **环境变量**: 始终通过 `.env` 文件管理 `DATABASE_URL`，避免直接在 shell 中 `export`，以防 SSL 参数解析错误。
- **端口管理**: 服务器启动时会自动检测端口占用情况，默认从 3000 开始尝试。如果遇到端口被意外占用的情况，应首先尝试查找并停止相关进程，而不是简单地更换端口。
- **货币处理**: 
    - **本位币**: 系统以人民币 (CNY) 为本位币。
    - **外币订单**: 创建时需录入**汇率**，系统自动计算并存储 `totalAmountBase` (本位币金额)。
    - **汇总统计**: 所有跨币种的汇总（如仪表盘）都应基于 `totalAmountBase` 字段进行，确保数据口径统一。
- **类型安全**: 充分利用 tRPC 和 Drizzle 提供的端到端类型安全。修改后端路由或数据库 schema 后，前端 TypeScript 会自动提示错误，应及时修正。
- **代码提交**: 遵循 `feat:`, `fix:`, `docs:` 等规范化提交信息，便于追溯和生成更新日志。

## 7. 附录：主要模块与路由

| 模块 | 前端页面 (示例) | 后端路由 (tRPC) |
|---|---|---|
| **销售管理** | `/sales/orders` | `salesOrders.list`, `salesOrders.getById`, `salesOrders.create` |
| **客户管理** | `/sales/customers` | `customers.list`, `customers.getById` |
| **产品管理** | `/rd/products` | `products.list`, `products.getById` |
| **仪表盘** | `/` | `dashboard.stats` |
| **用户与认证**| - | `auth.me`, `users.list` |
