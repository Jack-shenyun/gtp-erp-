# 神韵医疗 ERP 配置与部署说明（含 TiDB）

本文档用于统一本项目的运行配置、TiDB 连接、文件存储、迁移和上线标准，避免后续环境切换出问题。

## 1. 项目基础信息

- 项目目录：`/Users/shenyun/Documents/shenyun-erp/shenyun-erp-1.1-main`
- 技术栈：`React + Vite + TypeScript + Node.js + Express + tRPC + Drizzle + TiDB(MySQL兼容)`
- 包管理器：`pnpm`
- 默认开发端口：`3000`

## 2. 环境要求

- Node.js：建议 `>= 22`
- pnpm：建议 `>= 10`
- 数据库：TiDB Cloud 或 MySQL 兼容数据库

检查命令：

```bash
node -v
pnpm -v
```

## 3. 环境变量配置

1. 复制模板：

```bash
cp .env.example .env
```

2. 填写 `.env`（核心是 `DATABASE_URL`）

关键变量说明：

- `DATABASE_URL`：数据库连接串（TiDB/MySQL）
- `JWT_SECRET`：服务端 Cookie/JWT 密钥
- `FILE_STORAGE_DRIVER`：附件存储驱动，`local` 或 `forge`
- `FILE_STORAGE_ROOT`：本地存储根目录（`local` 时生效）
- `OAUTH_SERVER_URL`、`VITE_APP_ID`、`OWNER_OPEN_ID`：OAuth 接入用，不接 OAuth 可留空
- `BUILT_IN_FORGE_API_URL`、`BUILT_IN_FORGE_API_KEY`：远程文件存储代理（`forge` 时生效）

## 4. TiDB 配置标准（重点）

TiDB 使用 MySQL 协议，统一用 `DATABASE_URL` 管理。

示例：

```env
DATABASE_URL=mysql://<user>:<password>@<host>:4000/<db>?ssl={"rejectUnauthorized":true}
```

注意事项：

1. `ssl={"rejectUnauthorized":true}` 建议保留（云数据库默认 SSL）。
2. 不要把真实账号密码提交到 Git。
3. 所有模块必须通过后端 `db.ts` + Drizzle 访问数据库，不允许前端直连。

## 5. 附件存储配置标准

### 5.1 本地开发（当前默认）

```env
FILE_STORAGE_DRIVER=local
FILE_STORAGE_ROOT=./uploads
```

### 5.2 云端部署（推荐）

```env
FILE_STORAGE_DRIVER=forge
BUILT_IN_FORGE_API_URL=<storage-proxy-url>
BUILT_IN_FORGE_API_KEY=<storage-proxy-key>
```

上传目录规则（已在代码中实现）：

- 一级目录：部门名（标准部门名称）
- 二级目录：业务目录（如“收款单”）
- 文件名：`时间戳-随机串-业务主键-客户简称-序号.扩展名`

## 6. 本地启动流程

```bash
pnpm install
pnpm dev
```

浏览器访问：

- [http://localhost:3000](http://localhost:3000)

## 7. 数据库结构变更流程（Drizzle）

当 `drizzle/schema.ts` 变更后执行：

```bash
pnpm db:push
```

该命令会：

1. 生成迁移；
2. 应用到数据库。

## 8. 生产构建与启动

```bash
pnpm build
NODE_ENV=production pnpm start
```

或：

```bash
NODE_ENV=production node dist/index.js
```

## 9. 上阿里云前检查清单

1. `.env` 中 `DATABASE_URL` 已改为阿里云实例；
2. 附件驱动已切换（建议 `forge` + OSS 代理）；
3. 执行 `pnpm db:push`，确认结构最新；
4. 核心流程回归：
   - 登录
   - 销售订单
   - 财务协同
   - 仓库入出库
   - 附件上传/下载
5. 检查磁盘、证书、域名、反向代理配置。

## 10. Git 提交规范（建议）

- `feat:` 新功能
- `fix:` 缺陷修复
- `docs:` 文档更新
- `refactor:` 重构

示例：

```bash
git add .
git commit -m "feat: 新增产品灭菌字段与仓库物料选择弹窗"
git push
```

## 11. 安全要求

1. `.env`、数据库密码、API KEY 禁止入库；
2. 生产环境密钥必须与开发环境隔离；
3. 附件目录需开启访问控制和备份策略；
4. 建议开启数据库定期备份与审计日志。

---

如需我继续，我可以再补一份《阿里云部署SOP（ECS + Nginx + PM2 + TiDB/OSS）》一步一步执行版。
