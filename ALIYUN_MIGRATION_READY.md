# 阿里云迁移预配置说明

本项目已完成以下“可迁移”改造：

1. 数据库连接统一由 `DATABASE_URL` 控制（不写死本地/云端）
2. 附件上传统一由 `FILE_STORAGE_DRIVER` 控制（本地或云存储）
3. 附件目录统一规则：`uploads/部门名称/业务文件夹`

## 一、数据库迁移（TiDB -> 阿里云 RDS/TiDB）

上线后仅需修改环境变量：

```env
DATABASE_URL=mysql://<user>:<password>@<host>:<port>/<db_name>?ssl={"rejectUnauthorized":true}
```

注意：
- 保持 MySQL 兼容库即可，无需改业务代码。
- 建议先在预发环境导入数据并验证表结构。

## 二、文件存储迁移（本地 -> 云存储）

当前支持：
- `FILE_STORAGE_DRIVER=local`：写入本地磁盘 `uploads/...`
- `FILE_STORAGE_DRIVER=forge`：写入远程对象存储代理（后续可替换为阿里云 OSS 接口）

建议上线阶段配置：

```env
FILE_STORAGE_DRIVER=forge
BUILT_IN_FORGE_API_URL=<your-storage-proxy-url>
BUILT_IN_FORGE_API_KEY=<your-storage-proxy-key>
```

本地开发配置：

```env
FILE_STORAGE_DRIVER=local
FILE_STORAGE_ROOT=./uploads
```

## 三、统一上传规则

- 文件夹：按标准部门名创建（如：`销售部`、`财务部`）
- 历史部门名自动映射（如：`财务管理` -> `财务部`）
- 收款附件业务目录固定为：`收款单`
- 文件命名：`时间戳-随机串-单据编号-客户简称-序号.扩展名`

## 四、上线时你只需要做的事

1. 改 `.env` 中 `DATABASE_URL` 到阿里云数据库
2. 改 `.env` 中 `FILE_STORAGE_DRIVER` 到云存储模式
3. 重启服务并回归验证“收款附件上传/下载”

