# 多公司 ERP 系统实施总结

## 项目概述

本项目成功实现了医疗器械 ERP 系统的多公司架构，支持神韵医疗（主公司）与两家协同公司（苏州滴乐塑胶、江西瑞仁医疗）的独立运营与数据隔离。

## 核心功能实现

### 1. 登录系统重构

#### 登录流程
- **第一步**：用户从公司列表中选择要登录的公司
- **第二步**：输入用户名和密码进行身份验证
- **第三步**：系统校验权限并返回用户信息

#### 后端接口：`auth.login`
```typescript
// 输入参数
{
  username: string;      // 用户名（不含 user- 前缀）
  password: string;      // 密码
  companyId: number;     // 公司 ID
}

// 返回数据
{
  success: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    role: "user" | "admin";
    department: string;
    companyId: number;   // 当前登录的公司 ID
  }
}
```

#### 权限校验规则
- **系统管理员（admin）**：可以登录任何公司，不受限制
- **普通用户**：只能登录所属公司或已获得授权的协同公司
- **密码验证**：
  - 如果用户已设置密码，使用 scrypt 算法校验
  - 如果用户未设置密码，允许使用默认密码 `666-11` 登录

### 2. 认证状态管理

#### Cookie 持久化
- 登录成功后，用户信息被序列化并存储在 Cookie 中
- Cookie 有效期为 7 天
- 页面刷新时，后端从 Cookie 中读取用户信息，无需重新登录

#### 前后端同步
- **前端**：`useAuth` hook 优先从后端 `auth.me` 接口获取用户信息
- **后端**：`createContext` 函数从 Cookie 中解析用户信息，供 tRPC 上下文使用

### 3. 菜单权限过滤

#### 协同公司菜单限制
协同公司用户只能访问以下 6 个模块：
1. **采购部** (`purchase`)
2. **销售部** (`sales`)
3. **财务部** (`finance`)
4. **仓库管理** (`warehouse`)
5. **产品管理** (`products`)
6. **用户设置** (`settings` 下的子项，仅保留"用户设置"选项)

#### 菜单过滤逻辑
- **ERPLayout 组件**：根据 `activeCompanyId` 判断是否为协同公司
  - 如果是协同公司（id 1 或 2），使用 `COMPANY_MENU_IDS` 过滤菜单
  - 如果是主公司（id 3），使用用户部门权限过滤菜单
  
- **Dashboard 首页**：同步应用菜单过滤逻辑
  - 协同公司用户只能看到授权的 6 个模块的应用卡片
  - 支持搜索和最近访问功能

### 4. 公司切换功能

#### 顶部切换器
- 位置：页面顶部导航栏（Logo 右侧）
- 功能：快速在不同公司间切换
- 权限：
  - 系统管理员：可以切换到任何公司
  - 普通用户：只能切换到已授权的公司

#### 切换流程
1. 用户点击公司切换器
2. 选择目标公司
3. 系统更新 `localStorage` 中的 `erp-active-company-id`
4. 页面刷新以重新初始化菜单和权限

### 5. 数据库设计

#### 核心表结构

**companies 表**
```sql
CREATE TABLE companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,           -- 公司名称
  shortName VARCHAR(50),                -- 简称
  type ENUM('main', 'sales', 'supplier', 'other'),
  modules TEXT,                         -- 可访问模块列表
  description TEXT,
  color VARCHAR(20),                    -- UI 显示颜色
  status ENUM('active', 'inactive'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**company_user_access 表**
```sql
CREATE TABLE company_user_access (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  userId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**user_passwords 表**（新增）
```sql
CREATE TABLE user_passwords (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,   -- scrypt 格式: scrypt$salt$hash
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 现有数据

| 公司 ID | 公司名称 | 简称 | 类型 | 颜色 |
|---------|---------|------|------|------|
| 1 | 苏州滴乐塑胶有限公司 | 滴乐塑胶 | sales | #0ea5e9 |
| 2 | 江西瑞仁医疗器械有限公司 | 瑞仁医疗 | sales | #8b5cf6 |
| 3 | 苏州神韵医疗器械有限公司 | 神韵医疗 | main | #059669 |

#### 测试用户

**滴乐塑胶公司（ID=1）**
- `user-dl-admin` / 滴乐管理员 / admin 角色
- `user-dl-purchase` / 滴乐采购员 / user 角色
- `user-dl-sales` / 滴乐销售员 / user 角色

**瑞仁医疗公司（ID=2）**
- `user-rr-admin` / 瑞仁管理员 / admin 角色
- `user-rr-purchase` / 瑞仁采购员 / user 角色
- `user-rr-sales` / 瑞仁销售员 / user 角色

**所有测试用户默认密码**：`666-11`

## 文件修改清单

### 后端文件

1. **server/routers.ts**
   - 新增 `auth.login` 接口
   - 实现密码验证逻辑
   - 实现公司权限校验
   - 支持 Cookie 设置

2. **server/_core/context.ts**
   - 修改 `createContext` 函数
   - 添加 Cookie 解析逻辑
   - 支持本地登录状态持久化

3. **server/_core/index.ts**
   - 添加 `cookie-parser` 中间件
   - 支持 Cookie 读取和设置

4. **drizzle/schema.ts**
   - 确保 `companies` 和 `company_user_access` 表存在

### 前端文件

1. **client/src/pages/Login.tsx**
   - 重构登录流程：公司选择 → 用户名密码
   - 调用后端 `auth.login` 接口
   - 处理登录错误并显示提示

2. **client/src/components/ERPLayout.tsx**
   - 添加协同公司菜单过滤逻辑
   - 实现公司切换器
   - 支持系统管理员跨公司访问

3. **client/src/pages/Dashboard.tsx**
   - 同步菜单过滤逻辑
   - 添加公司切换器
   - 支持协同公司首页应用过滤

4. **client/src/_core/hooks/useAuth.ts**
   - 修改用户信息获取优先级
   - 优先使用后端 `auth.me` 接口

### 依赖项

- 新增：`cookie-parser@1.4.7`
- 新增（开发）：`@types/cookie-parser@1.4.10`

## 测试指南

### 测试场景 1：协同公司普通员工登录

1. 访问登录页面
2. 选择"苏州滴乐塑胶有限公司"
3. 输入用户名：`dl-purchase`，密码：`666-11`
4. 点击登录
5. **预期结果**：
   - 成功登录
   - 左侧菜单只显示 6 个模块
   - 首页只显示授权的应用卡片

### 测试场景 2：系统管理员跨公司登录

1. 访问登录页面
2. 选择"苏州滴乐塑胶有限公司"
3. 输入用户名：`admin`（系统管理员），密码：`666-11`
4. 点击登录
5. **预期结果**：
   - 成功登录
   - 左侧菜单显示所有 9 个部门模块
   - 可以访问所有功能

### 测试场景 3：公司切换

1. 以系统管理员身份登录任何公司
2. 点击顶部导航栏的公司切换器
3. 选择不同的公司
4. **预期结果**：
   - 页面刷新
   - 菜单根据新公司进行过滤
   - 用户信息中的 `companyId` 更新

### 测试场景 4：权限校验

1. 以"滴乐采购员"身份登录滴乐塑胶
2. 尝试访问"销售部"模块的 URL（如 `/sales/orders`）
3. **预期结果**：
   - 页面重定向到首页
   - 显示权限不足提示

## 部署说明

### 环境要求
- Node.js 22+
- pnpm 10+
- MySQL 8.0+ 或 TiDB 兼容版本

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

### 构建生产版本
```bash
pnpm build
pnpm start
```

### 初始化数据库
```bash
# 生成迁移文件
pnpm db:push

# 运行测试用户创建脚本
node setup-company-users.mjs
```

## 已知限制与改进方向

### 当前限制
1. 密码存储使用 scrypt 算法，生产环境建议升级为 bcrypt
2. Cookie 中的用户信息未加密，建议使用 JWT 签名
3. 协同公司的数据隔离依赖应用层逻辑，未在数据库层强制执行

### 改进方向
1. **增强安全性**：
   - 使用 JWT 替代纯 JSON Cookie
   - 实现 CSRF 保护
   - 添加登录尝试限制

2. **完善权限管理**：
   - 实现细粒度的资源级权限控制
   - 支持动态权限配置
   - 添加审计日志

3. **优化用户体验**：
   - 支持记住登录状态
   - 实现单点登录（SSO）
   - 添加登录历史记录

4. **数据隔离**：
   - 在所有业务表中添加 `companyId` 字段
   - 实现数据库层面的行级安全（RLS）
   - 自动为所有查询添加公司过滤条件

## 相关文档

- [项目 README](./README.md)
- [数据库架构](./docs/database.md)
- [API 文档](./docs/api.md)
- [用户指南](./docs/user-guide.md)

## 支持与反馈

如有问题或建议，请提交 Issue 或联系开发团队。

---

**最后更新**：2026-03-09  
**实施者**：Manus AI Agent  
**版本**：1.0.0
