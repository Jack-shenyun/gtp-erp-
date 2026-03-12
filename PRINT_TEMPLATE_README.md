# 统一打印模版引擎 - 使用说明

## 一、架构概览

本次重构将 gtp-erp 项目中分散的打印实现统一为**模版驱动**的打印引擎，实现**所见即所得**：设置页面的预览效果与实际打印输出完全一致。

```
┌─────────────────────────────────────────────────┐
│            设置页面 (PrintTemplates)              │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  模版列表     │  │  所见即所得编辑器         │  │
│  │  - 销售订单   │  │  ┌─────────┐ ┌────────┐ │  │
│  │  - 发货单     │  │  │ HTML编辑 │ │ 实时   │ │  │
│  │  - 收据       │  │  │          │ │ 预览   │ │  │
│  │  - 采购订单   │  │  │ CSS编辑  │ │        │ │  │
│  │  - 生产指令   │  │  └─────────┘ └────────┘ │  │
│  │  - IQC检验    │  │  纸张设置 | 边距设置      │  │
│  │  - UDI标签    │  └─────────────────────────┘  │
│  └──────────────┘                                │
└─────────────────────────────────────────────────┘
         │ 保存到数据库                    │ 预览
         ▼                                ▼
┌─────────────────┐          ┌──────────────────┐
│  print_templates │          │   printEngine    │
│  数据库表        │◄────────│   渲染引擎        │
└─────────────────┘  读取    │  (变量注入+循环)  │
                              └──────────────────┘
                                       ▲
                                       │ 调用
                              ┌──────────────────┐
                              │ usePrintTemplate  │
                              │ Hook              │
                              └──────────────────┘
                                       ▲
                    ┌──────────┼──────────┼──────────┐
                    │          │          │          │
              销售订单    采购订单    生产指令    出库单
              (3个按钮)   (打印下达)  (打印)    (发货单)
```

## 二、新增文件清单

| 文件路径 | 说明 |
|---|---|
| `client/src/lib/printEngine.ts` | 打印引擎核心：模版渲染器、变量注入、打印执行 |
| `client/src/lib/printTemplateDefaults.ts` | 7 套内置默认模版定义（HTML + CSS + 变量声明） |
| `client/src/hooks/usePrintTemplate.ts` | React Hook：统一的打印调用接口 |
| `client/src/components/print/UnifiedPrintButton.tsx` | 通用打印按钮组件（可选使用） |
| `drizzle/schema.ts` (追加) | `print_templates` 数据库表定义 |
| `server/db.ts` (追加) | 打印模版 CRUD 函数 |
| `server/routers.ts` (追加) | `printTemplates` tRPC 路由 |

## 三、修改文件清单

| 文件路径 | 修改内容 |
|---|---|
| `client/src/pages/settings/PrintTemplates.tsx` | 完全重写为所见即所得编辑器 |
| `client/src/pages/sales/Orders.tsx` | 3 个打印按钮接入统一引擎，移除旧对话框 |
| `client/src/pages/purchase/Orders.tsx` | 打印下达按钮接入统一引擎 |
| `client/src/pages/production/Orders.tsx` | 打印按钮接入统一引擎 |
| `client/src/pages/warehouse/Outbound.tsx` | 发货单打印接入统一引擎 |

## 四、模版语法说明

### 变量插值

使用双花括号 `{{变量名}}` 插入数据：

```html
<div>订单号：{{orderNumber}}</div>
<div>客户：{{customerName}}</div>
<div>总金额：¥{{totalAmount}}</div>
```

### 系统变量

以下变量由系统自动注入，所有模版均可使用：

| 变量名 | 说明 |
|---|---|
| `{{companyName}}` | 公司中文名称 |
| `{{companyNameEn}}` | 公司英文名称 |
| `{{companyAddress}}` | 公司地址 |
| `{{companyPhone}}` | 公司电话 |
| `{{companyLogo}}` | 公司 Logo URL |
| `{{printDate}}` | 打印日期 (YYYY-MM-DD) |
| `{{printTime}}` | 打印时间 (HH:MM:SS) |

### 循环语法

使用 `{{#each 数组名}}...{{/each}}` 遍历列表：

```html
<table>
  {{#each items}}
  <tr>
    <td>{{productName}}</td>
    <td>{{quantity}}</td>
    <td>¥{{unitPrice}}</td>
    <td>¥{{amount}}</td>
  </tr>
  {{/each}}
</table>
```

### 条件语法

使用 `{{#if 变量名}}...{{/if}}` 条件显示：

```html
{{#if remark}}
<div class="remark">备注：{{remark}}</div>
{{/if}}
```

## 五、如何修改模版

### 方法一：通过设置页面（推荐）

1. 进入 **系统设置 → 打印模版**
2. 左侧选择要修改的模版（如"销售订单"）
3. 右侧编辑器分为 HTML 和 CSS 两个标签页
4. 修改后右侧实时预览区域立即显示效果
5. 点击 **保存模版** 持久化到数据库
6. 可随时点击 **重置为默认** 恢复内置模版

### 方法二：通过代码修改默认模版

修改 `client/src/lib/printTemplateDefaults.ts` 中对应模版的 `defaultHtml` 和 `defaultCss`。

## 六、如何在新页面中使用打印

### 方式一：使用 Hook

```tsx
import { usePrintTemplate } from "@/hooks/usePrintTemplate";

function MyPage() {
  const { print } = usePrintTemplate();

  const handlePrint = () => {
    print("sales_order", {
      orderNumber: "SO-2026-001",
      customerName: "XX医院",
      items: [
        { productName: "产品A", quantity: 10, unitPrice: 100, amount: 1000 },
      ],
      totalAmount: 1000,
    });
  };

  return <button onClick={handlePrint}>打印</button>;
}
```

### 方式二：使用按钮组件

```tsx
import UnifiedPrintButton from "@/components/print/UnifiedPrintButton";

<UnifiedPrintButton
  templateKey="sales_order"
  data={{ orderNumber: "SO-001", customerName: "XX医院", items: [...] }}
  label="打印订单"
/>
```

## 七、如何新增模版类型

1. 在 `printTemplateDefaults.ts` 中添加新的模版定义：

```typescript
{
  key: "my_new_template",
  name: "我的新模版",
  category: "自定义",
  variables: [
    { name: "field1", label: "字段1", type: "string", sample: "示例值" },
  ],
  defaultHtml: `<div>{{field1}}</div>`,
  defaultCss: `div { font-size: 14px; }`,
}
```

2. 在业务页面中调用：

```typescript
templatePrint("my_new_template", { field1: "实际值" });
```

## 八、数据库迁移

新增的 `print_templates` 表会在首次访问时自动创建（通过 `ensurePrintTemplatesTable` 函数）。如需手动创建，SQL 如下：

```sql
CREATE TABLE IF NOT EXISTS print_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) DEFAULT '通用',
  html_content TEXT NOT NULL,
  css_content TEXT,
  paper_size VARCHAR(20) DEFAULT 'A4',
  orientation VARCHAR(20) DEFAULT 'portrait',
  margin_top INT DEFAULT 20,
  margin_right INT DEFAULT 20,
  margin_bottom INT DEFAULT 20,
  margin_left INT DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
