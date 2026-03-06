# 神韵医疗器械 ERP 系统 — 开发交接说明 V1.1

**版本**: 1.1  
**最后更新**: 2026-03-04  
**适用场景**: 在 Google Cloud IDE / IDX / Codespaces 等云端 IDE 中继续开发

---

## 1. 仓库信息

| 项目 | 内容 |
|---|---|
| **GitHub 仓库** | `https://github.com/Jack-shenyun/shenyun-erp-1.1` |
| **当前开发分支** | `临时` |
| **项目名称** | `medical-device-erp` |
| **版本** | `1.0.0` |

### 克隆与切换分支

```bash
git clone https://github.com/Jack-shenyun/shenyun-erp-1.1.git
cd shenyun-erp-1.1
git checkout 临时
```

---

## 2. 数据库配置（TiDB Cloud）

> ⚠️ **重要**：`.env` 文件已被 `.gitignore` 忽略，克隆后必须手动创建。

在项目**根目录**下创建 `.env` 文件，内容如下：

```env
DATABASE_URL=mysql://paZkiNgy2nHQcsT.root:mB5jFs2uVaZjEegW@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}
```

### 数据库连接参数明细

| 参数 | 值 |
|---|---|
| **类型** | TiDB Cloud（MySQL 兼容） |
| **Host** | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| **Port** | `4000` |
| **Username** | `paZkiNgy2nHQcsT.root` |
| **Password** | `mB5jFs2uVaZjEegW` |
| **Database** | `test` |
| **SSL** | 必须开启（`rejectUnauthorized: true`） |

> ⚠️ **注意**：`ssl` 参数值为 JSON 字符串，必须使用双引号 `"` 包裹，格式错误将导致数据库连接失败。

---

## 3. 技术栈

| 分类 | 技术 |
|---|---|
| **前端** | React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| **通信** | tRPC + Zod（前后端类型安全） |
| **路由** | wouter |
| **后端** | Node.js + Express + tsx |
| **ORM** | Drizzle ORM（MySQL 兼容） |
| **包管理** | pnpm |

---

## 4. 环境搭建与启动

```bash
# 1. 安装依赖
pnpm install

# 2. 创建 .env 文件（见上方数据库配置）

# 3. 启动开发服务器（前后端同时启动）
pnpm dev
```

服务默认运行在 `http://localhost:3000`，端口占用时自动递增（3001、3002…）。

**开发模式无需登录**：系统自动注入演示用户（ID=8，系统管理员），可直接访问所有功能。

### 其他常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm db:push` | 同步数据库 Schema（修改 schema.ts 后执行） |
| `pnpm check` | TypeScript 类型检查 |
| `pnpm format` | 代码格式化 |

---

## 5. 项目结构

```
SHENYUN-ERP-1.0/
├── client/                    # 前端代码
│   └── src/
│       ├── pages/             # 页面组件（51 个页面）
│       │   ├── Dashboard.tsx  # 仪表盘
│       │   ├── sales/         # 销售模块
│       │   ├── purchase/      # 采购模块
│       │   ├── production/    # 生产模块
│       │   ├── quality/       # 质量模块
│       │   ├── warehouse/     # 仓库模块
│       │   ├── finance/       # 财务模块
│       │   ├── rd/            # 研发模块
│       │   ├── admin/         # 行政模块
│       │   ├── investment/    # 招商模块
│       │   └── settings/      # 系统设置
│       ├── components/        # 公共组件
│       └── lib/trpc.ts        # tRPC 客户端
├── server/
│   ├── routers.ts             # 所有 tRPC 路由（核心后端逻辑）
│   ├── db.ts                  # 数据库连接
│   └── _core/                 # 服务器核心（认证、中间件）
├── drizzle/
│   ├── schema.ts              # 数据库表结构定义（47 张表）
│   └── *.sql                  # 迁移文件
├── .env                       # 环境变量（需手动创建，不在 git 中）
├── package.json
└── todo.md                    # 待办事项
```

---

## 6. 数据库表结构（47 张表）

| 分类 | 表名 |
|---|---|
| **用户与权限** | `users`, `departments` |
| **产品** | `products`, `bom` |
| **客户与销售** | `customers`, `salesOrders`, `salesOrderItems`, `orderApprovals`, `customsDeclarations` |
| **供应商与采购** | `suppliers`, `purchaseOrders`, `purchaseOrderItems` |
| **仓库与库存** | `warehouses`, `inventory`, `inventoryTransactions`, `stocktakes` |
| **生产** | `productionOrders`, `productionPlans`, `productionRecords`, `productionRoutingCards`, `productionWarehouseEntries`, `materialRequisitionOrders`, `sterilizationOrders` |
| **质量** | `qualityInspections`, `qualityIncidents`, `samples`, `labRecords` |
| **财务** | `accountsReceivable`, `accountsPayable`, `bankAccounts`, `exchangeRates`, `paymentTerms`, `paymentRecords`, `expenseReimbursements` |
| **研发** | `rdProjects` |
| **行政** | `personnel`, `trainings`, `audits` |
| **招商** | `dealerQualifications` |
| **系统** | `operationLogs`, `documents`, `equipment`, `codeRules`, `materialRequests`, `materialRequestItems`, `electronicSignatures`, `signatureAuditLog` |

---

## 7. 已完成功能总览

以下所有模块均已完成前后端数据库对接，使用真实 tRPC 接口，无 Mock 数据。

| 模块 | 功能 | 状态 |
|---|---|---|
| **仪表盘** | 月销售额、待处理订单、库存预警、最近订单、待办事项（全部实时读库） | ✅ 完成 |
| **销售订单** | 列表/新增/编辑/删除、草稿库、审批流程、运费、报关、多货币、打印 | ✅ 完成 |
| **客户管理** | 列表/新增/编辑/删除、草稿库、客户详情（含历史订单、交易统计） | ✅ 完成 |
| **产品管理** | 列表/新增/编辑/删除、销售权限/获取权限字段、BOM 管理 | ✅ 完成 |
| **供应商管理** | 列表/新增/编辑/删除、草稿库、采购负责人关联用户表 | ✅ 完成 |
| **采购订单** | 列表/新增/编辑/删除、物料明细、状态流转（草稿→审批→下单→收货） | ✅ 完成 |
| **库存台账** | 列表/新增/编辑/删除 | ✅ 完成 |
| **入库管理** | 对接 `inventoryTransactions`（type=inbound） | ✅ 完成 |
| **出库管理** | 对接 `inventoryTransactions`（type=outbound） | ✅ 完成 |
| **仓库管理** | 列表/新增/编辑/删除 | ✅ 完成 |
| **库存盘点** | 创建盘点、开始盘点、完成盘点状态流转 | ✅ 完成 |
| **质量检验 IQC** | 来料检验列表/新增/编辑/删除 | ✅ 完成 |
| **质量检验 IPQC** | 过程检验列表/新增/编辑/删除 | ✅ 完成 |
| **质量检验 OQC** | 出货检验列表/新增/编辑/删除 | ✅ 完成 |
| **生产订单** | 列表/新增/编辑/删除 | ✅ 完成 |
| **生产计划** | 列表/新增/编辑/删除 | ✅ 完成 |
| **生产记录** | 列表/新增/编辑/删除 | ✅ 完成 |
| **操作日志** | 实时读库、按模块/类型/日期筛选、导出 CSV/JSON、管理员清除 | ✅ 完成 |
| **知识库** | 文件元数据管理、列表/新增/编辑/删除 | ✅ 完成 |
| **用户管理** | 列表/新增/编辑/删除、角色管理 | ✅ 完成 |
| **系统设置** | 部门管理、编码规则 | ✅ 完成 |

---

## 8. 核心开发准则

在继续开发时，请严格遵守以下三条准则：

**准则一：UI 布局保护**。当前系统的 UI 页面和布局已定稿，用户满意。未收到明确指令前，严禁修改任何 UI 或布局。

**准则二：真实数据驱动**。所有页面开发的第一原则是建立真实数据库数据。严禁仅使用前端 Mock 数据，必须通过真实数据的增删改查来测试系统逻辑。

**准则三：高效执行**。减少不必要的步骤，追求最快完成，严禁冗余操作。

---

## 9. 后续待开发方向

根据系统现状，以下方向可优先考虑继续开发：

| 优先级 | 方向 | 说明 |
|---|---|---|
| 高 | **财务模块深化** | 应收/应付账款的付款记录、账期管理、财务报表生成 |
| 高 | **权限细化** | 按用户角色（admin/user）控制侧边栏菜单可见性和操作权限 |
| 中 | **招商模块** | 经销商资质、医院档案、平台管理完善 |
| 中 | **研发模块** | 研发项目进度跟踪、文件关联 |
| 中 | **知识库增强** | 支持真实文件上传/下载（目前仅元数据） |
| 低 | **报表中心** | 销售/采购/生产多维度统计报表 |

---

## 10. 常见问题

**Q: 数据库连接失败，页面显示"暂无数据"？**  
A: 检查根目录 `.env` 文件是否存在，`DATABASE_URL` 格式是否正确，特别是 `ssl={"rejectUnauthorized":true}` 部分必须使用双引号。

**Q: 端口被占用启动失败？**  
A: 执行 `fuser -k 3000/tcp` 释放端口，或系统会自动使用 3001 等备用端口。

**Q: 修改了数据库 Schema 后数据不同步？**  
A: 执行 `pnpm db:push` 将 `drizzle/schema.ts` 的变更同步到 TiDB Cloud。

**Q: 前端修改后页面没有更新？**  
A: Vite 支持热更新，保存文件后浏览器自动刷新。如仍不更新，尝试硬刷新（Ctrl+Shift+R）。

---

*本文档由 Manus AI 生成，最后更新于 2026-03-04。*
