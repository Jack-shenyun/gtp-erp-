/**
 * 默认打印模版定义
 * 包含每种业务单据的：默认 HTML 模版、默认 CSS、可用变量列表、示例数据
 */
import type { TemplateDefinition, TemplateVariable } from "./printEngine";

// ==================== 通用变量 ====================
const companyVariables: TemplateVariable[] = [
  { key: "company.name", label: "公司名称（中文）", type: "string", example: "XX医疗器械有限公司" },
  { key: "company.nameEn", label: "公司名称（英文）", type: "string", example: "XX Medical Device Co., Ltd." },
  { key: "company.address", label: "公司地址（中文）", type: "string", example: "XX省XX市XX区XX路XX号" },
  { key: "company.phone", label: "公司电话", type: "string", example: "0755-12345678" },
  { key: "company.email", label: "公司邮箱", type: "string", example: "info@example.com" },
  { key: "company.website", label: "公司网站", type: "string", example: "www.example.com" },
  { key: "company.logoUrl", label: "公司Logo地址", type: "string", example: "/uploads/logo.png" },
  { key: "printTime", label: "打印时间", type: "string", example: "2026-03-11 14:30" },
  { key: "printDate", label: "打印日期", type: "string", example: "2026-03-11" },
];

// ==================== 通用 CSS ====================
const commonCss = `
/* 文档头部 */
.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #1a56db;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.doc-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.doc-header-left img {
  height: 48px;
  width: auto;
}
.company-name {
  font-size: 18px;
  font-weight: bold;
  color: #1a56db;
}
.company-name-en {
  font-size: 11px;
  color: #6b7280;
}
.doc-title {
  font-size: 20px;
  font-weight: bold;
  color: #1a56db;
}
.doc-meta {
  font-size: 11px;
  color: #6b7280;
  text-align: right;
}

/* 区块 */
.section {
  margin-bottom: 14px;
}
.section-title {
  font-size: 13px;
  font-weight: bold;
  color: #1e40af;
  border-left: 3px solid #1a56db;
  padding-left: 8px;
  margin-bottom: 8px;
}

/* 信息表格 */
.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.info-table td, .info-table th {
  border: 1px solid #d1d5db;
  padding: 5px 8px;
}
.info-table .label {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
  width: 100px;
  white-space: nowrap;
}

/* 明细表格 */
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.detail-table th {
  background: #eff6ff;
  border: 1px solid #d1d5db;
  padding: 6px 8px;
  font-weight: 600;
  color: #1e40af;
  text-align: center;
}
.detail-table td {
  border: 1px solid #d1d5db;
  padding: 5px 8px;
  text-align: center;
}
.detail-table tr:nth-child(even) {
  background: #f9fafb;
}
.text-right { text-align: right !important; }
.text-left { text-align: left !important; }
.text-center { text-align: center !important; }
.font-bold { font-weight: bold; }

/* 合计行 */
.total-row td {
  font-weight: bold;
  background: #f0f9ff !important;
}

/* 签名栏 */
.sign-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
.sign-table th {
  border: 1px solid #d1d5db;
  padding: 5px 10px;
  background: #f9fafb;
  font-size: 11px;
}
.sign-table td {
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  text-align: center;
  height: 50px;
  font-size: 11px;
}

/* 页脚 */
.doc-footer {
  margin-top: 16px;
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  padding-top: 6px;
}

/* 备注 */
.remark-box {
  border: 1px solid #d1d5db;
  padding: 8px;
  min-height: 40px;
  font-size: 12px;
  background: #fefce8;
}
`;

// ==================== 销售订单模版 ====================
const salesOrderHtml = `<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
    <div>
      <div class="company-name">{{company.name}}</div>
      {{#if company.nameEn}}<div class="company-name-en">{{company.nameEn}}</div>{{/if}}
    </div>
  </div>
  <div>
    <div class="doc-title">销售订单</div>
    <div class="doc-meta">
      <div>订单编号：{{orderNumber}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">基本信息</div>
  <table class="info-table">
    <tr>
      <td class="label">订单编号</td><td>{{orderNumber}}</td>
      <td class="label">订单日期</td><td>{{orderDate}}</td>
      <td class="label">交货日期</td><td>{{deliveryDate}}</td>
    </tr>
    <tr>
      <td class="label">客户名称</td><td colspan="3">{{customerName}}</td>
      <td class="label">状态</td><td>{{status}}</td>
    </tr>
    <tr>
      <td class="label">收货地址</td><td colspan="5">{{shippingAddress}}</td>
    </tr>
    <tr>
      <td class="label">联系人</td><td>{{shippingContact}}</td>
      <td class="label">联系电话</td><td>{{shippingPhone}}</td>
      <td class="label">付款方式</td><td>{{paymentMethod}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">产品明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>产品名称</th>
        <th>产品编码</th>
        <th>规格型号</th>
        <th style="width:70px">数量</th>
        <th style="width:90px">单价</th>
        <th style="width:100px">金额</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td class="text-left">{{productName}}</td>
        <td>{{productCode}}</td>
        <td>{{specification}}</td>
        <td>{{quantity}}</td>
        <td class="text-right">{{unitPrice | currency}}</td>
        <td class="text-right">{{amount | currency}}</td>
      </tr>
      {{/each}}
      <tr class="total-row">
        <td colspan="6" class="text-right">合计金额：</td>
        <td class="text-right">{{totalAmount | currency}}</td>
      </tr>
    </tbody>
  </table>
</div>

{{#if notes}}
<div class="section">
  <div class="section-title">备注</div>
  <div class="remark-box">{{notes}}</div>
</div>
{{/if}}

<div class="section">
  <div class="section-title">签名确认</div>
  <table class="sign-table">
    <tr><th>制单人</th><th>审核人</th><th>客户确认</th></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td></td><td></td><td></td></tr>
  </table>
</div>

<div class="doc-footer">
  {{company.name}} {{#if company.address}}· {{company.address}}{{/if}} {{#if company.phone}}· Tel: {{company.phone}}{{/if}}
</div>`;

const salesOrderVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "orderNumber", label: "订单编号", type: "string", example: "SO-20260311-001" },
  { key: "orderDate", label: "订单日期", type: "date", example: "2026-03-11" },
  { key: "deliveryDate", label: "交货日期", type: "date", example: "2026-04-11" },
  { key: "customerName", label: "客户名称", type: "string", example: "XX医院" },
  { key: "shippingAddress", label: "收货地址", type: "string", example: "XX省XX市XX区XX路XX号" },
  { key: "shippingContact", label: "联系人", type: "string", example: "张三" },
  { key: "shippingPhone", label: "联系电话", type: "string", example: "13800138000" },
  { key: "paymentMethod", label: "付款方式", type: "string", example: "月结30天" },
  { key: "status", label: "订单状态", type: "string", example: "已审批" },
  { key: "totalAmount", label: "合计金额", type: "number", example: 125000 },
  { key: "notes", label: "备注", type: "string", example: "请尽快安排发货" },
  {
    key: "items", label: "产品明细", type: "array",
    example: [
      { productName: "一次性使用无菌注射器", productCode: "SYR-001", specification: "5ml", quantity: 1000, unitPrice: 50, amount: 50000 },
      { productName: "医用外科口罩", productCode: "MSK-002", specification: "17.5×9.5cm", quantity: 5000, unitPrice: 15, amount: 75000 },
    ],
    children: [
      { key: "productName", label: "产品名称", type: "string" },
      { key: "productCode", label: "产品编码", type: "string" },
      { key: "specification", label: "规格型号", type: "string" },
      { key: "quantity", label: "数量", type: "number" },
      { key: "unitPrice", label: "单价", type: "number" },
      { key: "amount", label: "金额", type: "number" },
    ],
  },
];

// ==================== 发货单模版 ====================
const deliveryNoteHtml = `<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
    <div>
      <div class="company-name">{{company.name}}</div>
      {{#if company.nameEn}}<div class="company-name-en">{{company.nameEn}}</div>{{/if}}
    </div>
  </div>
  <div>
    <div class="doc-title">发货单</div>
    <div class="doc-meta">
      <div>关联订单：{{orderNumber}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">发货信息</div>
  <table class="info-table">
    <tr>
      <td class="label">关联订单</td><td>{{orderNumber}}</td>
      <td class="label">发货日期</td><td>{{deliveryDate}}</td>
    </tr>
    <tr>
      <td class="label">客户名称</td><td colspan="3">{{customerName}}</td>
    </tr>
    <tr>
      <td class="label">收货地址</td><td colspan="3">{{shippingAddress}}</td>
    </tr>
    <tr>
      <td class="label">联系人</td><td>{{shippingContact}}</td>
      <td class="label">联系电话</td><td>{{shippingPhone}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">发货明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>产品名称</th>
        <th>产品编码</th>
        <th>规格型号</th>
        <th style="width:70px">数量</th>
        <th style="width:60px">单位</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td class="text-left">{{productName}}</td>
        <td>{{productCode}}</td>
        <td>{{specification}}</td>
        <td>{{quantity}}</td>
        <td>{{unit}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>

{{#if notes}}
<div class="section">
  <div class="section-title">备注</div>
  <div class="remark-box">{{notes}}</div>
</div>
{{/if}}

<div class="section">
  <div class="section-title">签名确认</div>
  <table class="sign-table">
    <tr><th>发货人</th><th>物流确认</th><th>客户签收</th></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td></td><td></td><td></td></tr>
  </table>
</div>

<div class="doc-footer">
  {{company.name}} {{#if company.address}}· {{company.address}}{{/if}} {{#if company.phone}}· Tel: {{company.phone}}{{/if}}
</div>`;

const deliveryNoteVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "orderNumber", label: "关联订单号", type: "string", example: "SO-20260311-001" },
  { key: "deliveryDate", label: "发货日期", type: "date", example: "2026-03-11" },
  { key: "customerName", label: "客户名称", type: "string", example: "XX医院" },
  { key: "shippingAddress", label: "收货地址", type: "string", example: "XX省XX市XX区XX路XX号" },
  { key: "shippingContact", label: "联系人", type: "string", example: "张三" },
  { key: "shippingPhone", label: "联系电话", type: "string", example: "13800138000" },
  { key: "notes", label: "备注", type: "string", example: "" },
  {
    key: "items", label: "发货明细", type: "array",
    example: [
      { productName: "一次性使用无菌注射器", productCode: "SYR-001", specification: "5ml", quantity: 1000, unit: "支" },
    ],
    children: [
      { key: "productName", label: "产品名称", type: "string" },
      { key: "productCode", label: "产品编码", type: "string" },
      { key: "specification", label: "规格型号", type: "string" },
      { key: "quantity", label: "数量", type: "number" },
      { key: "unit", label: "单位", type: "string" },
    ],
  },
];

// ==================== 收据模版 ====================
const receiptHtml = `<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
    <div>
      <div class="company-name">{{company.name}}</div>
      {{#if company.nameEn}}<div class="company-name-en">{{company.nameEn}}</div>{{/if}}
    </div>
  </div>
  <div>
    <div class="doc-title">收据</div>
    <div class="doc-meta">
      <div>收据编号：{{receiptNumber}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">收款信息</div>
  <table class="info-table">
    <tr>
      <td class="label">收据编号</td><td>{{receiptNumber}}</td>
      <td class="label">收据日期</td><td>{{receiptDate}}</td>
    </tr>
    <tr>
      <td class="label">关联订单</td><td>{{orderNumber}}</td>
      <td class="label">客户名称</td><td>{{customerName}}</td>
    </tr>
    <tr>
      <td class="label">付款方式</td><td>{{paymentMethod}}</td>
      <td class="label">总金额</td><td>{{totalAmount | currency}}</td>
    </tr>
    <tr>
      <td class="label">已收金额</td><td>{{paidAmount | currency}}</td>
      <td class="label">未收金额</td><td>{{remainingAmount | currency}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">收款明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>产品名称</th>
        <th style="width:70px">数量</th>
        <th style="width:90px">单价</th>
        <th style="width:100px">金额</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td class="text-left">{{productName}}</td>
        <td>{{quantity}}</td>
        <td class="text-right">{{unitPrice | currency}}</td>
        <td class="text-right">{{amount | currency}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>

{{#if notes}}
<div class="section">
  <div class="section-title">备注</div>
  <div class="remark-box">{{notes}}</div>
</div>
{{/if}}

<div class="section">
  <div class="section-title">签名确认</div>
  <table class="sign-table">
    <tr><th>收款人</th><th>审核人</th><th>付款方确认</th></tr>
    <tr><td></td><td></td><td></td></tr>
  </table>
</div>

<div class="doc-footer">
  {{company.name}} {{#if company.address}}· {{company.address}}{{/if}} {{#if company.phone}}· Tel: {{company.phone}}{{/if}}
</div>`;

const receiptVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "receiptNumber", label: "收据编号", type: "string", example: "RC-20260311-001" },
  { key: "receiptDate", label: "收据日期", type: "date", example: "2026-03-11" },
  { key: "orderNumber", label: "关联订单号", type: "string", example: "SO-20260311-001" },
  { key: "customerName", label: "客户名称", type: "string", example: "XX医院" },
  { key: "paymentMethod", label: "付款方式", type: "string", example: "银行转账" },
  { key: "totalAmount", label: "总金额", type: "number", example: 125000 },
  { key: "paidAmount", label: "已收金额", type: "number", example: 125000 },
  { key: "remainingAmount", label: "未收金额", type: "number", example: 0 },
  { key: "notes", label: "备注", type: "string", example: "" },
  {
    key: "items", label: "收款明细", type: "array",
    example: [
      { productName: "一次性使用无菌注射器", quantity: 1000, unitPrice: 50, amount: 50000 },
    ],
    children: [
      { key: "productName", label: "产品名称", type: "string" },
      { key: "quantity", label: "数量", type: "number" },
      { key: "unitPrice", label: "单价", type: "number" },
      { key: "amount", label: "金额", type: "number" },
    ],
  },
];

// ==================== 采购订单模版 ====================
const purchaseOrderHtml = `<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
    <div>
      <div class="company-name">{{company.name}}</div>
      {{#if company.nameEn}}<div class="company-name-en">{{company.nameEn}}</div>{{/if}}
    </div>
  </div>
  <div>
    <div class="doc-title">采购订单</div>
    <div class="doc-meta">
      <div>采购单号：{{orderNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">基本信息</div>
  <table class="info-table">
    <tr>
      <td class="label">采购单号</td><td>{{orderNo}}</td>
      <td class="label">采购日期</td><td>{{orderDate}}</td>
      <td class="label">交货日期</td><td>{{deliveryDate}}</td>
    </tr>
    <tr>
      <td class="label">供应商</td><td colspan="3">{{supplierName}}</td>
      <td class="label">状态</td><td>{{status}}</td>
    </tr>
    <tr>
      <td class="label">联系人</td><td>{{contactPerson}}</td>
      <td class="label">联系电话</td><td>{{contactPhone}}</td>
      <td class="label">付款条件</td><td>{{paymentTerms}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">采购明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>产品名称</th>
        <th>产品编码</th>
        <th>规格型号</th>
        <th style="width:70px">数量</th>
        <th style="width:60px">单位</th>
        <th style="width:90px">单价</th>
        <th style="width:100px">金额</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td class="text-left">{{productName}}</td>
        <td>{{productCode}}</td>
        <td>{{specification}}</td>
        <td>{{quantity}}</td>
        <td>{{unit}}</td>
        <td class="text-right">{{unitPrice | currency}}</td>
        <td class="text-right">{{amount | currency}}</td>
      </tr>
      {{/each}}
      <tr class="total-row">
        <td colspan="7" class="text-right">合计金额：</td>
        <td class="text-right">{{totalAmount | currency}}</td>
      </tr>
    </tbody>
  </table>
</div>

{{#if remark}}
<div class="section">
  <div class="section-title">备注</div>
  <div class="remark-box">{{remark}}</div>
</div>
{{/if}}

<div class="section">
  <div class="section-title">签名确认</div>
  <table class="sign-table">
    <tr><th>采购员</th><th>部门审核</th><th>总经理审批</th><th>供应商确认</th></tr>
    <tr><td></td><td></td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td></td><td></td><td></td><td></td></tr>
  </table>
</div>

<div class="doc-footer">
  {{company.name}} {{#if company.address}}· {{company.address}}{{/if}} {{#if company.phone}}· Tel: {{company.phone}}{{/if}}
</div>`;

const purchaseOrderVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "orderNo", label: "采购单号", type: "string", example: "PO-20260311-001" },
  { key: "orderDate", label: "采购日期", type: "date", example: "2026-03-11" },
  { key: "deliveryDate", label: "交货日期", type: "date", example: "2026-04-11" },
  { key: "supplierName", label: "供应商名称", type: "string", example: "XX原材料供应有限公司" },
  { key: "contactPerson", label: "联系人", type: "string", example: "李四" },
  { key: "contactPhone", label: "联系电话", type: "string", example: "13900139000" },
  { key: "paymentTerms", label: "付款条件", type: "string", example: "月结60天" },
  { key: "status", label: "订单状态", type: "string", example: "已审批" },
  { key: "totalAmount", label: "合计金额", type: "number", example: 80000 },
  { key: "remark", label: "备注", type: "string", example: "" },
  {
    key: "items", label: "采购明细", type: "array",
    example: [
      { productName: "医用级不锈钢管", productCode: "RAW-001", specification: "Φ6×1mm", quantity: 500, unit: "米", unitPrice: 80, amount: 40000 },
      { productName: "医用硅胶", productCode: "RAW-002", specification: "食品级", quantity: 200, unit: "kg", unitPrice: 200, amount: 40000 },
    ],
    children: [
      { key: "productName", label: "产品名称", type: "string" },
      { key: "productCode", label: "产品编码", type: "string" },
      { key: "specification", label: "规格型号", type: "string" },
      { key: "quantity", label: "数量", type: "number" },
      { key: "unit", label: "单位", type: "string" },
      { key: "unitPrice", label: "单价", type: "number" },
      { key: "amount", label: "金额", type: "number" },
    ],
  },
];

// ==================== 生产指令模版 ====================
const productionOrderHtml = `<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
    <div>
      <div class="company-name">{{company.name}}</div>
      {{#if company.nameEn}}<div class="company-name-en">{{company.nameEn}}</div>{{/if}}
    </div>
  </div>
  <div>
    <div class="doc-title">生产指令</div>
    <div class="doc-meta">
      <div>指令单号：{{orderNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">基本信息</div>
  <table class="info-table">
    <tr>
      <td class="label">指令单号</td><td>{{orderNo}}</td>
      <td class="label">指令类型</td><td>{{orderType}}</td>
      <td class="label">状态</td><td>{{status}}</td>
    </tr>
    <tr>
      <td class="label">产品名称</td><td colspan="3">{{productName}}</td>
      <td class="label">产品编码</td><td>{{productCode}}</td>
    </tr>
    <tr>
      <td class="label">规格型号</td><td>{{productSpec}}</td>
      <td class="label">批次号</td><td>{{batchNo}}</td>
      <td class="label">关联计划</td><td>{{planNo}}</td>
    </tr>
    <tr>
      <td class="label">计划数量</td><td>{{plannedQty}} {{unit}}</td>
      <td class="label">完成数量</td><td>{{completedQty}} {{unit}}</td>
      <td class="label">完成进度</td><td>{{progress | percent}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">时间安排</div>
  <table class="info-table">
    <tr>
      <td class="label">计划开始</td><td>{{plannedStartDate}}</td>
      <td class="label">计划完成</td><td>{{plannedEndDate}}</td>
      <td class="label">生产日期</td><td>{{productionDate}}</td>
    </tr>
    <tr>
      <td class="label">实际开始</td><td>{{actualStartDate}}</td>
      <td class="label">实际完成</td><td>{{actualEndDate}}</td>
      <td class="label">有效期至</td><td>{{expiryDate}}</td>
    </tr>
  </table>
</div>

{{#if productDescription}}
<div class="section">
  <div class="section-title">产品描述</div>
  <div class="remark-box">{{productDescription}}</div>
</div>
{{/if}}

{{#if remark}}
<div class="section">
  <div class="section-title">备注</div>
  <div class="remark-box">{{remark}}</div>
</div>
{{/if}}

<div class="section">
  <div class="section-title">生产进度</div>
  <div style="padding:6px 0;">
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span>已完成：{{completedQty}} {{unit}} / 计划：{{plannedQty}} {{unit}}</span>
      <span style="font-weight:bold;">{{progress | percent}}</span>
    </div>
    <div style="background:#e5e7eb;border-radius:4px;height:10px;width:100%;">
      <div style="background:#16a34a;height:10px;border-radius:4px;width:{{progress}}%;"></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">签名确认</div>
  <table class="sign-table">
    <tr><th>制单人</th><th>审核人</th><th>生产负责人</th><th>质量确认</th><th>仓库确认</th></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
  </table>
</div>

<div class="doc-footer">
  {{company.name}} {{#if company.address}}· {{company.address}}{{/if}} {{#if company.phone}}· Tel: {{company.phone}}{{/if}}
</div>`;

const productionOrderVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "orderNo", label: "指令单号", type: "string", example: "MO-20260311-001" },
  { key: "orderType", label: "指令类型", type: "string", example: "正常生产" },
  { key: "status", label: "状态", type: "string", example: "生产中" },
  { key: "productName", label: "产品名称", type: "string", example: "一次性使用无菌注射器" },
  { key: "productCode", label: "产品编码", type: "string", example: "SYR-001" },
  { key: "productSpec", label: "规格型号", type: "string", example: "5ml" },
  { key: "batchNo", label: "批次号", type: "string", example: "B20260311" },
  { key: "planNo", label: "关联计划号", type: "string", example: "PP-001" },
  { key: "plannedQty", label: "计划数量", type: "number", example: 10000 },
  { key: "completedQty", label: "完成数量", type: "number", example: 6500 },
  { key: "unit", label: "单位", type: "string", example: "支" },
  { key: "progress", label: "完成进度(%)", type: "number", example: 65 },
  { key: "plannedStartDate", label: "计划开始日期", type: "date", example: "2026-03-01" },
  { key: "plannedEndDate", label: "计划完成日期", type: "date", example: "2026-03-15" },
  { key: "productionDate", label: "生产日期", type: "date", example: "2026-03-01" },
  { key: "actualStartDate", label: "实际开始日期", type: "date", example: "2026-03-01" },
  { key: "actualEndDate", label: "实际完成日期", type: "date", example: "-" },
  { key: "expiryDate", label: "有效期至", type: "date", example: "2029-03-01" },
  { key: "productDescription", label: "产品描述", type: "string", example: "" },
  { key: "remark", label: "备注", type: "string", example: "" },
  {
    key: "bomItems", label: "BOM物料明细", type: "array",
    example: [
      { materialName: "不锈钢管", materialCode: "RAW-001", specification: "Φ6×1mm", unitUsage: 0.5, totalRequired: 5000, unit: "米" },
      { materialName: "医用硬胶", materialCode: "RAW-002", specification: "医用级", unitUsage: 0.02, totalRequired: 200, unit: "kg" },
    ],
    children: [
      { key: "materialName", label: "物料名称", type: "string" },
      { key: "materialCode", label: "物料编码", type: "string" },
      { key: "specification", label: "规格", type: "string" },
      { key: "unitUsage", label: "单位用量", type: "number" },
      { key: "totalRequired", label: "总需求量", type: "number" },
      { key: "unit", label: "单位", type: "string" },
    ],
  },
];

// ==================== IQC 来料检验报告模版 ====================
const iqcInspectionHtml = `<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
    <div>
      <div class="company-name">{{company.name}}</div>
      {{#if company.nameEn}}<div class="company-name-en">{{company.nameEn}}</div>{{/if}}
    </div>
  </div>
  <div>
    <div class="doc-title">来料检验报告</div>
    <div class="doc-meta">
      <div>检验单号：{{inspectionNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">基本信息</div>
  <table class="info-table">
    <tr>
      <td class="label">检验单号</td><td>{{inspectionNo}}</td>
      <td class="label">到货单号</td><td>{{goodsReceiptNo}}</td>
    </tr>
    <tr>
      <td class="label">产品名称</td><td>{{productName}}</td>
      <td class="label">产品编码</td><td>{{productCode}}</td>
    </tr>
    <tr>
      <td class="label">规格型号</td><td>{{specification}}</td>
      <td class="label">供应商</td><td>{{supplierName}}</td>
    </tr>
    <tr>
      <td class="label">批次号</td><td>{{batchNo}}</td>
      <td class="label">到货数量</td><td>{{receivedQty}} {{unit}}</td>
    </tr>
    <tr>
      <td class="label">抽样数量</td><td>{{sampleQty}} {{unit}}</td>
      <td class="label">检验日期</td><td>{{inspectionDate}}</td>
    </tr>
    <tr>
      <td class="label">检验员</td><td>{{inspectorName}}</td>
      <td class="label">检验结论</td><td style="font-weight:bold;color:{{#if resultPassed}}#16a34a{{else}}#dc2626{{/if}}">{{result}}</td>
    </tr>
  </table>
</div>

{{#if hasItems}}
<div class="section">
  <div class="section-title">检验项目明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>检验项目</th>
        <th>检验标准</th>
        <th>实测值</th>
        <th style="width:80px">结论</th>
      </tr>
    </thead>
    <tbody>
      {{#each inspectionItems}}
      <tr>
        <td>{{@number}}</td>
        <td class="text-left">{{itemName}}</td>
        <td class="text-left">{{standard}}</td>
        <td>{{measuredValue}}</td>
        <td style="color:{{#if passed}}#16a34a{{else}}#dc2626{{/if}}">{{conclusion}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>
{{/if}}

{{#if remark}}
<div class="section">
  <div class="section-title">备注</div>
  <div class="remark-box">{{remark}}</div>
</div>
{{/if}}

<div class="section">
  <div class="section-title">签名确认</div>
  <table class="sign-table">
    <tr><th>检验员</th><th>质量主管</th><th>仓库确认</th></tr>
    <tr><td></td><td></td><td></td></tr>
  </table>
</div>

<div class="doc-footer">
  {{company.name}} {{#if company.address}}· {{company.address}}{{/if}} {{#if company.phone}}· Tel: {{company.phone}}{{/if}}
</div>`;

const iqcInspectionVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "inspectionNo", label: "检验单号", type: "string", example: "IQC-20260311-001" },
  { key: "goodsReceiptNo", label: "到货单号", type: "string", example: "GR-20260311-001" },
  { key: "productName", label: "产品名称", type: "string", example: "医用级不锈钢管" },
  { key: "productCode", label: "产品编码", type: "string", example: "RAW-001" },
  { key: "specification", label: "规格型号", type: "string", example: "Φ6×1mm" },
  { key: "supplierName", label: "供应商", type: "string", example: "XX原材料供应有限公司" },
  { key: "batchNo", label: "批次号", type: "string", example: "B20260311" },
  { key: "receivedQty", label: "到货数量", type: "number", example: 500 },
  { key: "sampleQty", label: "抽样数量", type: "number", example: 20 },
  { key: "unit", label: "单位", type: "string", example: "米" },
  { key: "inspectionDate", label: "检验日期", type: "date", example: "2026-03-11" },
  { key: "inspectorName", label: "检验员", type: "string", example: "王五" },
  { key: "result", label: "检验结论", type: "string", example: "合格" },
  { key: "resultPassed", label: "是否合格", type: "boolean", example: true },
  { key: "hasItems", label: "有检验项目", type: "boolean", example: true },
  { key: "remark", label: "备注", type: "string", example: "" },
  {
    key: "inspectionItems", label: "检验项目", type: "array",
    example: [
      { itemName: "外径", standard: "6.0±0.1mm", measuredValue: "6.02mm", conclusion: "合格", passed: true },
      { itemName: "壁厚", standard: "1.0±0.05mm", measuredValue: "0.98mm", conclusion: "合格", passed: true },
    ],
    children: [
      { key: "itemName", label: "检验项目", type: "string" },
      { key: "standard", label: "检验标准", type: "string" },
      { key: "measuredValue", label: "实测值", type: "string" },
      { key: "conclusion", label: "结论", type: "string" },
      { key: "passed", label: "是否合格", type: "boolean" },
    ],
  },
];

// ==================== 导出所有模版定义 ====================

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    templateKey: "sales_order",
    name: "销售订单",
    module: "sales",
    description: "销售订单打印模版，包含客户信息、产品明细、金额汇总",
    variables: salesOrderVariables,
    defaultHtml: salesOrderHtml,
    defaultCss: commonCss,
  },
  {
    templateKey: "delivery_note",
    name: "发货单",
    module: "sales",
    description: "发货单打印模版，包含发货信息和产品明细",
    variables: deliveryNoteVariables,
    defaultHtml: deliveryNoteHtml,
    defaultCss: commonCss,
  },
  {
    templateKey: "receipt",
    name: "收据",
    module: "sales",
    description: "收据打印模版，包含收款信息和明细",
    variables: receiptVariables,
    defaultHtml: receiptHtml,
    defaultCss: commonCss,
  },
  {
    templateKey: "purchase_order",
    name: "采购订单",
    module: "purchase",
    description: "采购订单打印模版，包含供应商信息、采购明细、金额汇总",
    variables: purchaseOrderVariables,
    defaultHtml: purchaseOrderHtml,
    defaultCss: commonCss,
  },
  {
    templateKey: "production_order",
    name: "生产指令",
    module: "production",
    description: "生产指令打印模版，包含生产信息、时间安排、进度",
    variables: productionOrderVariables,
    defaultHtml: productionOrderHtml,
    defaultCss: commonCss,
  },
  {
    templateKey: "iqc_inspection",
    name: "来料检验报告",
    module: "quality",
    description: "IQC来料检验报告打印模版，包含检验信息和检验项目明细",
    variables: iqcInspectionVariables,
    defaultHtml: iqcInspectionHtml,
    defaultCss: commonCss,
  },
];

/**
 * 根据模版 key 获取默认模版定义
 */
export function getTemplateDefinition(templateKey: string): TemplateDefinition | undefined {
  return TEMPLATE_DEFINITIONS.find(t => t.templateKey === templateKey);
}

/**
 * 根据模版定义生成示例数据上下文（用于预览）
 */
export function generateExampleContext(definition: TemplateDefinition): Record<string, any> {
  const data: Record<string, any> = {};
  for (const v of definition.variables) {
    if (v.key.startsWith("company.") || v.key === "printTime" || v.key === "printDate") continue;
    data[v.key] = v.example ?? (v.type === "number" ? 0 : v.type === "boolean" ? false : "-");
  }
  return data;
}


// Appending new templates from new_templates.ts

/**
 * Additional print template definitions
 */

// ==================== 物料申请单 ====================
const materialRequisitionHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">物料申请单</div>
    <div class="doc-meta">
      <div>申请单号：{{requisitionNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">申请部门</td><td>{{department}}</td>
      <td class="label">申请人</td><td>{{applicantName}}</td>
      <td class="label">申请日期</td><td>{{applyDate}}</td>
    </tr>
    <tr>
      <td class="label">关联生产订单</td><td colspan="3">{{productionOrderNo}}</td>
      <td class="label">状态</td><td>{{status}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">申请物料明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>物料编码</th>
        <th>物料名称</th>
        <th>规格型号</th>
        <th style="width:80px">申请数量</th>
        <th style="width:60px">单位</th>
        <th>备注</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td>{{materialCode}}</td>
        <td class="text-left">{{materialName}}</td>
        <td>{{specification}}</td>
        <td>{{quantity}}</td>
        <td>{{unit}}</td>
        <td class="text-left">{{remark}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>制单人</th><th>审核人</th><th>批准人</th><th>仓管员</th></tr>
    <tr><td>{{applicantName}}</td><td></td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td>{{applyDate}}</td><td></td><td></td><td></td></tr>
  </table>
</div>
`;

const materialRequisitionVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "requisitionNo", label: "申请单号", type: "string", example: "MR-20260312-001" },
  { key: "department", label: "申请部门", type: "string", example: "生产部" },
  { key: "applicantName", label: "申请人", type: "string", example: "李四" },
  { key: "applyDate", label: "申请日期", type: "date", example: "2026-03-12" },
  { key: "productionOrderNo", label: "生产订单号", type: "string", example: "PO-20260312-001" },
  { key: "status", label: "状态", type: "string", example: "待审核" },
  {
    key: "items", label: "物料明细", type: "array",
    example: [
      { materialCode: "RAW-001", materialName: "外壳", specification: "PC+ABS", quantity: 100, unit: "个", remark: "" },
      { materialCode: "ELE-002", materialName: "PCB主板", specification: "V1.2", quantity: 100, unit: "片", remark: "" },
    ],
    children: [
      { key: "materialCode", label: "物料编码", type: "string" },
      { key: "materialName", label: "物料名称", type: "string" },
      { key: "specification", label: "规格型号", type: "string" },
      { key: "quantity", label: "申请数量", type: "number" },
      { key: "unit", label: "单位", type: "string" },
      { key: "remark", label: "备注", type: "string" },
    ],
  },
];

// ==================== 入库单 ====================
const warehouseInHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">入库单</div>
    <div class="doc-meta">
      <div>入库单号：{{inboundNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">入库日期</td><td>{{inboundDate}}</td>
      <td class="label">关联单号</td><td>{{sourceNo}}</td>
      <td class="label">入库类型</td><td>{{inboundType}}</td>
    </tr>
    <tr>
      <td class="label">经办人</td><td>{{handlerName}}</td>
      <td class="label">仓库</td><td colspan="3">{{warehouseName}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">入库物料明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>物料编码</th>
        <th>物料名称</th>
        <th>规格型号</th>
        <th style="width:80px">数量</th>
        <th style="width:60px">单位</th>
        <th>批号</th>
        <th>库位</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td>{{materialCode}}</td>
        <td class="text-left">{{materialName}}</td>
        <td>{{specification}}</td>
        <td>{{quantity}}</td>
        <td>{{unit}}</td>
        <td>{{batchNo}}</td>
        <td>{{location}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>制单人</th><th>审核人</th><th>仓管员</th></tr>
    <tr><td>{{handlerName}}</td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td>{{inboundDate}}</td><td></td><td></td></tr>
  </table>
</div>
`;

const warehouseInVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "inboundNo", label: "入库单号", type: "string", example: "WIN-20260312-001" },
  { key: "inboundDate", label: "入库日期", type: "date", example: "2026-03-12" },
  { key: "sourceNo", label: "关联单号", type: "string", example: "PO-20260310-005" },
  { key: "inboundType", label: "入库类型", type: "string", example: "采购入库" },
  { key: "handlerName", label: "经办人", type: "string", example: "王五" },
  { key: "warehouseName", label: "仓库", type: "string", example: "原材料仓" },
  {
    key: "items", label: "物料明细", type: "array",
    example: [
      { materialCode: "RAW-001", materialName: "外壳", specification: "PC+ABS", quantity: 100, unit: "个", batchNo: "BN-20260312-001", location: "A-01-01" },
    ],
    children: [
      { key: "materialCode", label: "物料编码", type: "string" },
      { key: "materialName", label: "物料名称", type: "string" },
      { key: "specification", label: "规格型号", type: "string" },
      { key: "quantity", label: "数量", type: "number" },
      { key: "unit", label: "单位", type: "string" },
      { key: "batchNo", label: "批号", type: "string" },
      { key: "location", label: "库位", type: "string" },
    ],
  },
];

// ==================== 出库单 ====================
const warehouseOutHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">出库单</div>
    <div class="doc-meta">
      <div>出库单号：{{outboundNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">出库日期</td><td>{{outboundDate}}</td>
      <td class="label">关联单号</td><td>{{sourceNo}}</td>
      <td class="label">出库类型</td><td>{{outboundType}}</td>
    </tr>
    <tr>
      <td class="label">领料人/部门</td><td>{{recipientName}}</td>
      <td class="label">仓库</td><td colspan="3">{{warehouseName}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">出库物料明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>物料编码</th>
        <th>物料名称</th>
        <th>规格型号</th>
        <th style="width:80px">数量</th>
        <th style="width:60px">单位</th>
        <th>批号</th>
        <th>库位</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td>{{materialCode}}</td>
        <td class="text-left">{{materialName}}</td>
        <td>{{specification}}</td>
        <td>{{quantity}}</td>
        <td>{{unit}}</td>
        <td>{{batchNo}}</td>
        <td>{{location}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>制单人</th><th>审核人</th><th>领料人</th><th>仓管员</th></tr>
    <tr><td>{{handlerName}}</td><td></td><td>{{recipientName}}</td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td>{{outboundDate}}</td><td></td><td></td><td></td></tr>
  </table>
</div>
`;

const warehouseOutVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "outboundNo", label: "出库单号", type: "string", example: "WOUT-20260312-001" },
  { key: "outboundDate", label: "出库日期", type: "date", example: "2026-03-12" },
  { key: "sourceNo", label: "关联单号", type: "string", example: "MR-20260312-001" },
  { key: "outboundType", label: "出库类型", type: "string", example: "生产领料" },
  { key: "recipientName", label: "领料人/部门", type: "string", example: "生产部" },
  { key: "handlerName", label: "经办人", type: "string", example: "王五" },
  { key: "warehouseName", label: "仓库", type: "string", example: "原材料仓" },
  {
    key: "items", label: "物料明细", type: "array",
    example: [
      { materialCode: "RAW-001", materialName: "外壳", specification: "PC+ABS", quantity: 100, unit: "个", batchNo: "BN-20260312-001", location: "A-01-01" },
    ],
    children: [
      { key: "materialCode", label: "物料编码", type: "string" },
      { key: "materialName", label: "物料名称", type: "string" },
      { key: "specification", label: "规格型号", type: "string" },
      { key: "quantity", label: "数量", type: "number" },
      { key: "unit", label: "单位", type: "string" },
      { key: "batchNo", label: "批号", type: "string" },
      { key: "location", label: "库位", type: "string" },
    ],
  },
];

// ==================== 盘点单 ====================
const inventoryCheckHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">库存盘点单</div>
    <div class="doc-meta">
      <div>盘点单号：{{checkNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">盘点日期</td><td>{{checkDate}}</td>
      <td class="label">盘点仓库</td><td>{{warehouseName}}</td>
      <td class="label">盘点负责人</td><td>{{handlerName}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">盘点明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>物料编码</th>
        <th>物料名称</th>
        <th>规格型号</th>
        <th>单位</th>
        <th>库位</th>
        <th>批号</th>
        <th style="width:80px">账面数量</th>
        <th style="width:80px">实盘数量</th>
        <th style="width:80px">盈亏数量</th>
        <th>备注</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td>{{materialCode}}</td>
        <td class="text-left">{{materialName}}</td>
        <td>{{specification}}</td>
        <td>{{unit}}</td>
        <td>{{location}}</td>
        <td>{{batchNo}}</td>
        <td>{{bookQuantity}}</td>
        <td>{{actualQuantity}}</td>
        <td>{{diffQuantity}}</td>
        <td class="text-left">{{remark}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>盘点员</th><th>复核员</th><th>仓库主管</th></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td></td><td></td><td></td></tr>
  </table>
</div>
`;

const inventoryCheckVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "checkNo", label: "盘点单号", type: "string", example: "IC-20260312-001" },
  { key: "checkDate", label: "盘点日期", type: "date", example: "2026-03-12" },
  { key: "warehouseName", label: "盘点仓库", type: "string", example: "成品仓" },
  { key: "handlerName", label: "盘点负责人", type: "string", example: "张三" },
  {
    key: "items", label: "盘点明细", type: "array",
    example: [
      { materialCode: "PROD-001", materialName: "产品A", specification: "Model-X", unit: "个", location: "C-01-01", batchNo: "BN-20260310-001", bookQuantity: 100, actualQuantity: 99, diffQuantity: -1, remark: "损坏" },
    ],
    children: [
      { key: "materialCode", label: "物料编码", type: "string" },
      { key: "materialName", label: "物料名称", type: "string" },
      { key: "specification", label: "规格型号", type: "string" },
      { key: "unit", label: "单位", type: "string" },
      { key: "location", label: "库位", type: "string" },
      { key: "batchNo", label: "批号", type: "string" },
      { key: "bookQuantity", label: "账面数量", type: "number" },
      { key: "actualQuantity", label: "实盘数量", type: "number" },
      { key: "diffQuantity", label: "盈亏数量", type: "number" },
      { key: "remark", label: "备注", type: "string" },
    ],
  },
];
_// ==================== IPQC巡检单 ====================
const ipqcInspectionHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">IPQC巡检记录单</div>
    <div class="doc-meta">
      <div>记录单号：{{inspectionNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">生产工单</td><td>{{productionOrderNo}}</td>
      <td class="label">产品名称</td><td>{{productName}}</td>
      <td class="label">产品编码</td><td>{{productCode}}</td>
    </tr>
    <tr>
      <td class="label">巡检工序</td><td>{{processName}}</td>
      <td class="label">巡检时间</td><td>{{inspectionTime}}</td>
      <td class="label">检验员</td><td>{{inspectorName}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">检验项目及结果</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>检验项目</th>
        <th>检验标准</th>
        <th style="width:100px">检验结果</th>
        <th style="width:80px">判定</th>
        <th>备注</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td class="text-left">{{itemName}}</td>
        <td class="text-left">{{standard}}</td>
        <td>{{result}}</td>
        <td>{{judgment}}</td>
        <td class="text-left">{{remark}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>

<div class="section">
    <div class="section-title">检验结论</div>
    <div class="remark-box">结论：{{finalJudgment}}</div>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>检验员</th><th>班组长确认</th></tr>
    <tr><td>{{inspectorName}}</td><td></td></tr>
    <tr><th>日期</th><th>日期</th></tr>
    <tr><td>{{inspectionDate}}</td><td></td></tr>
  </table>
</div>
`;

const ipqcInspectionVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "inspectionNo", label: "检验单号", type: "string", example: "IPQC-20260312-001" },
  { key: "productionOrderNo", label: "生产工单", type: "string", example: "PO-20260312-001" },
  { key: "productName", label: "产品名称", type: "string", example: "产品A" },
  { key: "productCode", label: "产品编码", type: "string", example: "PROD-001" },
  { key: "processName", label: "巡检工序", type: "string", example: "组装" },
  { key: "inspectionTime", label: "巡检时间", type: "string", example: "2026-03-12 10:30" },
  { key: "inspectionDate", label: "巡检日期", type: "string", example: "2026-03-12" },
  { key: "inspectorName", label: "检验员", type: "string", example: "质检员01" },
  { key: "finalJudgment", label: "检验结论", type: "string", example: "合格" },
  {
    key: "items", label: "检验项目", type: "array",
    example: [
      { itemName: "外观检查", standard: "无划痕、无毛刺", result: "OK", judgment: "合格", remark: "" },
      { itemName: "尺寸检查", standard: "10±0.1mm", result: "9.98", judgment: "合格", remark: "" },
    ],
    children: [
      { key: "itemName", label: "检验项目", type: "string" },
      { key: "standard", label: "检验标准", type: "string" },
      { key: "result", label: "检验结果", type: "string" },
      { key: "judgment", label: "判定", type: "string" },
      { key: "remark", label: "备注", type: "string" },
    ],
  },
];

// ==================== OQC检验单 ====================
const oqcInspectionHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">OQC成品检验报告</div>
    <div class="doc-meta">
      <div>报告编号：{{inspectionNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">生产工单</td><td>{{productionOrderNo}}</td>
      <td class="label">产品名称</td><td colspan="3">{{productName}}</td>
    </tr>
    <tr>
      <td class="label">产品编码</td><td>{{productCode}}</td>
      <td class="label">产品批号</td><td>{{batchNo}}</td>
      <td class="label">检验日期</td><td>{{inspectionDate}}</td>
    </tr>
    <tr>
      <td class="label">订单数量</td><td>{{orderQuantity}}</td>
      <td class="label">抽检数量</td><td>{{sampleQuantity}}</td>
      <td class="label">检验员</td><td>{{inspectorName}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">检验项目及结果</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>检验项目</th>
        <th>检验标准</th>
        <th style="width:100px">检验结果</th>
        <th style="width:80px">判定</th>
        <th>备注</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td class="text-left">{{itemName}}</td>
        <td class="text-left">{{standard}}</td>
        <td>{{result}}</td>
        <td>{{judgment}}</td>
        <td class="text-left">{{remark}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>

<div class="section">
    <div class="section-title">检验结论</div>
    <div class="remark-box">结论：{{finalJudgment}}</div>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>检验员</th><th>审核人</th></tr>
    <tr><td>{{inspectorName}}</td><td></td></tr>
    <tr><th>日期</th><th>日期</th></tr>
    <tr><td>{{inspectionDate}}</td><td></td></tr>
  </table>
</div>
`;

const oqcInspectionVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "inspectionNo", label: "报告编号", type: "string", example: "OQC-20260312-001" },
  { key: "productionOrderNo", label: "生产工单", type: "string", example: "PO-20260312-001" },
  { key: "productName", label: "产品名称", type: "string", example: "产品A" },
  { key: "productCode", label: "产品编码", type: "string", example: "PROD-001" },
  { key: "batchNo", label: "产品批号", type: "string", example: "BN-20260312-001" },
  { key: "inspectionDate", label: "检验日期", type: "date", example: "2026-03-12" },
  { key: "orderQuantity", label: "订单数量", type: "number", example: 1000 },
  { key: "sampleQuantity", label: "抽检数量", type: "number", example: 80 },
  { key: "inspectorName", label: "检验员", type: "string", example: "质检员02" },
  { key: "finalJudgment", label: "检验结论", type: "string", example: "合格" },
  {
    key: "items", label: "检验项目", type: "array",
    example: [
      { itemName: "包装检查", standard: "包装完好，标签清晰", result: "OK", judgment: "合格", remark: "" },
      { itemName: "功能测试", standard: "功能正常", result: "OK", judgment: "合格", remark: "" },
    ],
    children: [
      { key: "itemName", label: "检验项目", type: "string" },
      { key: "standard", label: "检验标准", type: "string" },
      { key: "result", label: "检验结果", type: "string" },
      { key: "judgment", label: "判定", type: "string" },
      { key: "remark", label: "备注", type: "string" },
    ],
  },
];

// ==================== 生产流转卡 ====================
const productionFlowCardHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">生产流转卡</div>
    <div class="doc-meta">
      <div>流转卡号：{{cardNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">生产订单号</td><td>{{productionOrderNo}}</td>
      <td class="label">产品名称</td><td colspan="3">{{productName}}</td>
    </tr>
    <tr>
      <td class="label">产品批号</td><td>{{batchNo}}</td>
      <td class="label">数量</td><td>{{quantity}} {{unit}}</td>
      <td class="label">状态</td><td>{{status}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">工序流转记录</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>工序名称</th>
        <th>设备/人员</th>
        <th style="width:120px">开始时间</th>
        <th style="width:120px">结束时间</th>
        <th style="width:80px">合格数量</th>
        <th style="width:80px">不合格数量</th>
        <th>检验员</th>
      </tr>
    </thead>
    <tbody>
      {{#each processHistory}}
      <tr>
        <td>{{@number}}</td>
        <td>{{processName}}</td>
        <td>{{operator}}</td>
        <td>{{startTime}}</td>
        <td>{{endTime}}</td>
        <td>{{qualifiedQty}}</td>
        <td>{{unqualifiedQty}}</td>
        <td>{{inspector}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>

<div class="section">
    <div class="section-title">备注</div>
    <div class="remark-box">{{remark}}</div>
</div>

`;

const productionFlowCardVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "cardNo", label: "流转卡号", type: "string", example: "RC-20260312-001" },
  { key: "productionOrderNo", label: "生产订单号", type: "string", example: "PO-20260312-001" },
  { key: "productName", label: "产品名称", type: "string", example: "产品A" },
  { key: "batchNo", label: "产品批号", type: "string", example: "BN-20260312-001" },
  { key: "quantity", label: "数量", type: "number", example: 100 },
  { key: "unit", label: "单位", type: "string", example: "个" },
  { key: "status", label: "状态", type: "string", example: "工序中" },
  { key: "remark", label: "备注", type: "string", example: "" },
  {
    key: "processHistory", label: "工序流转记录", type: "array",
    example: [
      { processName: "组装", operator: "张三", startTime: "2026-03-12 08:00", endTime: "2026-03-12 10:00", qualifiedQty: 100, unqualifiedQty: 0, inspector: "检01" },
      { processName: "测试", operator: "李四", startTime: "2026-03-12 10:05", endTime: "2026-03-12 11:00", qualifiedQty: 100, unqualifiedQty: 0, inspector: "检02" },
    ],
    children: [
      { key: "processName", label: "工序名称", type: "string" },
      { key: "operator", label: "设备/人员", type: "string" },
      { key: "startTime", label: "开始时间", type: "string" },
      { key: "endTime", label: "结束时间", type: "string" },
      { key: "qualifiedQty", label: "合格数量", type: "number" },
      { key: "unqualifiedQty", label: "不合格数量", type: "number" },
      { key: "inspector", label: "检验员", type: "string" },
    ],
  },
];
_// ==================== 费用报销单 ====================
const expenseClaimHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">费用报销单</div>
    <div class="doc-meta">
      <div>报销单号：{{reimbursementNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">申请人</td><td>{{applicantName}}</td>
      <td class="label">部门</td><td>{{department}}</td>
      <td class="label">申请日期</td><td>{{applyDate}}</td>
    </tr>
    <tr>
      <td class="label">事由</td><td colspan="5">{{title}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">费用明细</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th>费用日期</th>
        <th>费用类型</th>
        <th>发票类型</th>
        <th style="width:80px">金额</th>
        <th>备注</th>
      </tr>
    </thead>
    <tbody>
      {{#each lines}}
      <tr>
        <td>{{@number}}</td>
        <td>{{expenseDate}}</td>
        <td>{{expenseType}}</td>
        <td>{{invoiceType}}</td>
        <td class="text-right">{{amount | currency}}</td>
        <td class="text-left">{{remark}}</td>
      </tr>
      {{/each}}
      <tr class="total-row">
        <td colspan="4" class="text-right">合计金额：</td>
        <td class="text-right">{{totalAmount | currency}}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>申请人</th><th>部门主管</th><th>财务审核</th><th>总经理审批</th></tr>
    <tr><td>{{applicantName}}</td><td></td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td>{{applyDate}}</td><td></td><td></td><td></td></tr>
  </table>
</div>
`;

const expenseClaimVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "reimbursementNo", label: "报销单号", type: "string", example: "EX-20260312-001" },
  { key: "applicantName", label: "申请人", type: "string", example: "张三" },
  { key: "department", label: "部门", type: "string", example: "销售部" },
  { key: "applyDate", label: "申请日期", type: "date", example: "2026-03-12" },
  { key: "title", label: "事由", type: "string", example: "客户招待" },
  { key: "totalAmount", label: "合计金额", type: "number", example: 850.00 },
  {
    key: "lines", label: "费用明细", type: "array",
    example: [
      { expenseDate: "2026-03-10", expenseType: "招待费", invoiceType: "专票", amount: 500.00, remark: "招待客户A" },
      { expenseDate: "2026-03-11", expenseType: "交通费", invoiceType: "普票", amount: 350.00, remark: "市内交通" },
    ],
    children: [
      { key: "expenseDate", label: "费用日期", type: "string" },
      { key: "expenseType", label: "费用类型", type: "string" },
      { key: "invoiceType", label: "发票类型", type: "string" },
      { key: "amount", label: "金额", type: "number" },
      { key: "remark", label: "备注", type: "string" },
    ],
  },
];
_// ==================== 请假申请单 ====================
const leaveRequestHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">请假申请单</div>
    <div class="doc-meta">
      <div>申请单号：{{requestNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">申请人</td><td>{{applicantName}}</td>
      <td class="label">部门</td><td>{{department}}</td>
      <td class="label">申请日期</td><td>{{applyDate}}</td>
    </tr>
    <tr>
      <td class="label">请假类型</td><td>{{leaveType}}</td>
      <td class="label">请假天数</td><td colspan="3">{{days}} 天</td>
    </tr>
    <tr>
      <td class="label">开始时间</td><td>{{startTime}}</td>
      <td class="label">结束时间</td><td colspan="3">{{endTime}}</td>
    </tr>
    <tr>
      <td class="label">请假事由</td><td colspan="5">{{reason}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>申请人</th><th>部门主管</th><th>人事部</th><th>总经理</th></tr>
    <tr><td>{{applicantName}}</td><td></td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td>{{applyDate}}</td><td></td><td></td><td></td></tr>
  </table>
</div>
`;

const leaveRequestVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "requestNo", label: "申请单号", type: "string", example: "LEAVE-20260312-001" },
  { key: "applicantName", label: "申请人", type: "string", example: "员工A" },
  { key: "department", label: "部门", type: "string", example: "研发部" },
  { key: "applyDate", label: "申请日期", type: "date", example: "2026-03-12" },
  { key: "leaveType", label: "请假类型", type: "string", example: "事假" },
  { key: "startTime", label: "开始时间", type: "string", example: "2026-03-13 09:00" },
  { key: "endTime", label: "结束时间", type: "string", example: "2026-03-13 18:00" },
  { key: "days", label: "请假天数", type: "number", example: 1 },
  { key: "reason", label: "请假事由", type: "string", example: "处理个人事务" },
];
_// ==================== 加班申请单 ====================
const overtimeRequestHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">加班申请单</div>
    <div class="doc-meta">
      <div>申请单号：{{requestNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">申请人</td><td>{{applicantName}}</td>
      <td class="label">部门</td><td>{{department}}</td>
      <td class="label">申请日期</td><td>{{applyDate}}</td>
    </tr>
    <tr>
      <td class="label">加班类型</td><td>{{overtimeType}}</td>
      <td class="label">加班时长</td><td colspan="3">{{hours}} 小时</td>
    </tr>
    <tr>
      <td class="label">加班日期</td><td>{{overtimeDate}}</td>
      <td class="label">时间</td><td colspan="3">{{startTime}} - {{endTime}}</td>
    </tr>
    <tr>
      <td class="label">加班事由</td><td colspan="5">{{reason}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>申请人</th><th>部门主管</th><th>人事部</th></tr>
    <tr><td>{{applicantName}}</td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td>{{applyDate}}</td><td></td><td></td></tr>
  </table>
</div>
`;

const overtimeRequestVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "requestNo", label: "申请单号", type: "string", example: "OT-20260312-001" },
  { key: "applicantName", label: "申请人", type: "string", example: "员工B" },
  { key: "department", label: "部门", type: "string", example: "生产部" },
  { key: "applyDate", label: "申请日期", type: "date", example: "2026-03-12" },
  { key: "overtimeType", label: "加班类型", type: "string", example: "平日加班" },
  { key: "overtimeDate", label: "加班日期", type: "date", example: "2026-03-12" },
  { key: "startTime", label: "开始时间", type: "string", example: "18:00" },
  { key: "endTime", label: "结束时间", type: "string", example: "20:00" },
  { key: "hours", label: "加班时长", type: "number", example: 2 },
  { key: "reason", label: "加班事由", type: "string", example: "赶生产任务" },
];

// ==================== 外出申请单 ====================
const outingRequestHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
  </div>
  <div>
    <div class="doc-title">公出申请单</div>
    <div class="doc-meta">
      <div>申请单号：{{requestNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">申请人</td><td>{{applicantName}}</td>
      <td class="label">部门</td><td>{{department}}</td>
      <td class="label">申请日期</td><td>{{applyDate}}</td>
    </tr>
    <tr>
      <td class="label">外出地点</td><td colspan="5">{{destination}}</td>
    </tr>
    <tr>
      <td class="label">开始时间</td><td>{{startTime}}</td>
      <td class="label">结束时间</td><td colspan="3">{{endTime}}</td>
    </tr>
    <tr>
      <td class="label">外出事由</td><td colspan="5">{{reason}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>申请人</th><th>部门主管</th><th>行政部</th></tr>
    <tr><td>{{applicantName}}</td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td>{{applyDate}}</td><td></td><td></td></tr>
  </table>
</div>
`;

const outingRequestVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "requestNo", label: "申请单号", type: "string", example: "OUT-20260312-001" },
  { key: "applicantName", label: "申请人", type: "string", example: "员工C" },
  { key: "department", label: "部门", type: "string", example: "市场部" },
  { key: "applyDate", label: "申请日期", type: "date", example: "2026-03-12" },
  { key: "destination", label: "外出地点", type: "string", example: "XX客户公司" },
  { key: "startTime", label: "开始时间", type: "string", example: "2026-03-13 14:00" },
  { key: "endTime", label: "结束时间", type: "string", example: "2026-03-13 17:00" },
  { key: "reason", label: "外出事由", type: "string", example: "洽谈业务" },
];
_// ==================== 委外灭菌单 ====================
const sterilizationOutsourceHtml = `
<div class="doc-header">
  <div class="doc-header-left">
    {{#if company.logoUrl}}<img src="{{company.logoUrl}}" alt="logo" />{{/if}}
    <div>
      <div class="company-name">{{company.name}}</div>
      {{#if company.nameEn}}<div class="company-name-en">{{company.nameEn}}</div>{{/if}}
    </div>
  </div>
  <div>
    <div class="doc-title">委外灭菌单</div>
    <div class="doc-meta">
      <div>单据编号：{{orderNo}}</div>
      <div>打印时间：{{printTime}}</div>
    </div>
  </div>
</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">供应商</td><td colspan="3">{{supplierName}}</td>
      <td class="label">灭菌方式</td><td>{{sterilizationMethod}}</td>
    </tr>
    <tr>
      <td class="label">发出日期</td><td>{{sendDate}}</td>
      <td class="label">预计返回日期</td><td>{{expectedReturnDate}}</td>
      <td class="label">实际返回日期</td><td>{{actualReturnDate}}</td>
    </tr>
    <tr>
      <td class="label">关联流转卡</td><td>{{routingCardNo}}</td>
      <td class="label">灭菌批号</td><td colspan="3">{{sterilizationBatchNo}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">灭菌产品信息</div>
  <table class="detail-table">
    <thead>
      <tr>
        <th>产品名称</th>
        <th>产品批号</th>
        <th style="width:100px">数量</th>
        <th style="width:80px">单位</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{productName}}</td>
        <td>{{batchNo}}</td>
        <td>{{quantity}}</td>
        <td>{{unit}}</td>
      </tr>
    </tbody>
  </table>
</div>

{{#if remark}}
<div class="section">
  <div class="section-title">备注</div>
  <div class="remark-box">{{remark}}</div>
</div>
{{/if}}

<div class="section">
  <table class="sign-table">
    <tr><th>制单人</th><th>QA确认</th><th>供应商确认</th></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><th>日期</th><th>日期</th><th>日期</th></tr>
    <tr><td></td><td></td><td></td></tr>
  </table>
</div>

<div class="doc-footer">
  {{company.name}} {{#if company.address}}· {{company.address}}{{/if}} {{#if company.phone}}· Tel: {{company.phone}}{{/if}}
</div>
`;

const sterilizationOutsourceVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "orderNo", label: "单据编号", type: "string", example: "STO-20260312-001" },
  { key: "supplierName", label: "供应商", type: "string", example: "XX灭菌服务有限公司" },
  { key: "sterilizationMethod", label: "灭菌方式", type: "string", example: "EO环氧乙烷" },
  { key: "sendDate", label: "发出日期", type: "date", example: "2026-03-12" },
  { key: "expectedReturnDate", label: "预计返回日期", type: "date", example: "2026-03-20" },
  { key: "actualReturnDate", label: "实际返回日期", type: "date", example: "" },
  { key: "routingCardNo", label: "关联流转卡", type: "string", example: "RC-20260312-001" },
  { key: "sterilizationBatchNo", label: "灭菌批号", type: "string", example: "STER-BATCH-001" },
  { key: "productName", label: "产品名称", type: "string", example: "产品A" },
  { key: "batchNo", label: "产品批号", type: "string", example: "BN-20260312-001" },
  { key: "quantity", label: "数量", type: "number", example: 100 },
  { key: "unit", label: "单位", type: "string", example: "个" },
  { key: "remark", label: "备注", type: "string", example: "加急处理" },
];

// ==================== 报关单 ====================
const customsDeclarationHtml = `
<style>
  .landscape-title {
    font-size: 24px;
    text-align: center;
    font-weight: bold;
    color: #1a56db;
    margin-bottom: 20px;
  }
</style>
<div class="landscape-title">出境货物报关单</div>

<div class="section">
  <table class="info-table">
    <tr>
      <td class="label">境内发货人</td><td colspan="3">{{company.name}}</td>
      <td class="label">出境关别</td><td colspan="2">{{portOfLoading}}</td>
      <td class="label">报关单号</td><td colspan="2">{{declarationNo}}</td>
    </tr>
    <tr>
      <td class="label">境外收货人</td><td colspan="3">{{customerName}}</td>
      <td class="label">运输方式</td><td colspan="2">{{shippingMethod}}</td>
      <td class="label">运输工具名称</td><td colspan="2">{{transportationName}}</td>
    </tr>
    <tr>
      <td class="label">合同协议号</td><td colspan="3">{{orderNo}}</td>
      <td class="label">贸易国（地区）</td><td colspan="2">{{destinationCountry}}</td>
      <td class="label">运抵国（地区）</td><td colspan="2">{{destinationCountry}}</td>
    </tr>
     <tr>
      <td class="label">指运港</td><td>{{portOfDischarge}}</td>
      <td class="label">成交方式</td><td>{{tradeTerm}}</td>
      <td class="label">运费</td><td>{{freight}}</td>
      <td class="label">保费</td><td>{{insurance}}</td>
      <td class="label">杂费</td><td>{{otherFee}}</td>
    </tr>
  </table>
</div>

<div class="section">
  <table class="detail-table">
    <thead>
      <tr>
        <th style="width:40px">项号</th>
        <th>商品编号(HS Code)</th>
        <th>商品名称及规格型号</th>
        <th style="width:100px">数量及单位</th>
        <th style="width:100px">单价</th>
        <th style="width:100px">总价</th>
        <th>币制</th>
        <th>原产国</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@number}}</td>
        <td>{{hsCode}}</td>
        <td class="text-left">{{productName}} ({{specification}})</td>
        <td>{{quantity}} {{unit}}</td>
        <td class="text-right">{{unitPrice | currency}}</td>
        <td class="text-right">{{amount | currency}}</td>
        <td>{{currency}}</td>
        <td>中国</td>
      </tr>
      {{/each}}
      <tr class="total-row">
        <td colspan="5" class="text-right">合计总价：</td>
        <td class="text-right">{{totalAmount | currency}}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>
</div>

<div class="section">
    <div class="section-title">备注</div>
    <div class="remark-box">{{remarks}}</div>
</div>

<div class="section">
  <table class="sign-table">
    <tr><th>申报单位（签章）</th><th>海关审单（签章）</th></tr>
    <tr><td style="height: 80px;"></td><td style="height: 80px;"></td></tr>
    <tr><th>申报日期：{{declarationDate}}</th><th>海关放行日期：{{clearanceDate}}</th></tr>
  </table>
</div>
`;

const customsDeclarationVariables: TemplateVariable[] = [
  ...companyVariables,
  { key: "declarationNo", label: "报关单号", type: "string", example: "CD-2026-123456" },
  { key: "portOfLoading", label: "出境关别", type: "string", example: "深圳皇岗" },
  { key: "customerName", label: "境外收货人", type: "string", example: "International Medical Corp." },
  { key: "shippingMethod", label: "运输方式", type: "string", example: "陆运" },
  { key: "transportationName", label: "运输工具名称", type: "string", example: "粤B12345" },
  { key: "orderNo", label: "合同协议号", type: "string", example: "SO-20260310-001" },
  { key: "destinationCountry", label: "贸易国/运抵国", type: "string", example: "美国" },
  { key: "portOfDischarge", label: "指运港", type: "string", example: "Los Angeles" },
  { key: "tradeTerm", label: "成交方式", type: "string", example: "FOB" },
  { key: "freight", label: "运费", type: "number", example: 1200 },
  { key: "insurance", label: "保费", type: "number", example: 300 },
  { key: "otherFee", label: "杂费", type: "number", example: 50 },
  { key: "totalAmount", label: "合计总价", type: "number", example: 125000 },
  { key: "remarks", label: "备注", type: "string", example: "" },
  { key: "declarationDate", label: "申报日期", type: "date", example: "2026-03-12" },
  { key: "clearanceDate", label: "海关放行日期", type: "date", example: "2026-03-13" },
  {
    key: "items", label: "商品信息", type: "array",
    example: [
      { hsCode: "9018.90.90", productName: "医用内窥镜", specification: "Model-Z", quantity: 10, unit: "台", unitPrice: 12500, amount: 125000, currency: "USD" },
    ],
    children: [
      { key: "hsCode", label: "商品编号(HS Code)", type: "string" },
      { key: "productName", label: "商品名称", type: "string" },
      { key: "specification", label: "规格型号", type: "string" },
      { key: "quantity", label: "数量", type: "number" },
      { key: "unit", label: "单位", type: "string" },
      { key: "unitPrice", label: "单价", type: "number" },
      { key: "amount", label: "总价", type: "number" },
      { key: "currency", label: "币制", type: "string" },
    ],
  },
];
_// ==================== 统一导出 ====================
export const allTemplates: Record<string, TemplateDefinition> = {
  sales_order: {
    name: "销售订单",
    html: salesOrderHtml,
    css: commonCss,
    variables: salesOrderVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  delivery_note: {
    name: "发货单",
    html: deliveryNoteHtml,
    css: commonCss,
    variables: deliveryNoteVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  receipt: {
    name: "收款单",
    html: receiptHtml,
    css: commonCss,
    variables: receiptVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  purchase_order: {
    name: "采购订单",
    html: purchaseOrderHtml,
    css: commonCss,
    variables: purchaseOrderVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  production_order: {
    name: "生产订单",
    html: productionOrderHtml,
    css: commonCss,
    variables: productionOrderVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  iqc_inspection: {
    name: "IQC检验单",
    html: iqcInspectionHtml,
    css: commonCss,
    variables: iqcInspectionVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  sterilization_outsource: {
    name: "委外灭菌单",
    html: sterilizationOutsourceHtml,
    css: commonCss,
    variables: sterilizationOutsourceVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  customs_declaration: {
    name: "报关单",
    html: customsDeclarationHtml,
    css: commonCss,
    variables: customsDeclarationVariables,
    paperSize: "A4",
    orientation: "landscape",
  },
  material_requisition: {
    name: "物料申请单",
    html: materialRequisitionHtml,
    css: commonCss,
    variables: materialRequisitionVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  warehouse_in: {
    name: "入库单",
    html: warehouseInHtml,
    css: commonCss,
    variables: warehouseInVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  warehouse_out: {
    name: "出库单",
    html: warehouseOutHtml,
    css: commonCss,
    variables: warehouseOutVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  inventory_check: {
    name: "盘点单",
    html: inventoryCheckHtml,
    css: commonCss,
    variables: inventoryCheckVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  ipqc_inspection: {
    name: "IPQC巡检单",
    html: ipqcInspectionHtml,
    css: commonCss,
    variables: ipqcInspectionVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  oqc_inspection: {
    name: "OQC检验单",
    html: oqcInspectionHtml,
    css: commonCss,
    variables: oqcInspectionVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  production_flow_card: {
    name: "生产流转卡",
    html: productionFlowCardHtml,
    css: commonCss,
    variables: productionFlowCardVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  expense_claim: {
    name: "费用报销单",
    html: expenseClaimHtml,
    css: commonCss,
    variables: expenseClaimVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  leave_request: {
    name: "请假申请单",
    html: leaveRequestHtml,
    css: commonCss,
    variables: leaveRequestVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  overtime_request: {
    name: "加班申请单",
    html: overtimeRequestHtml,
    css: commonCss,
    variables: overtimeRequestVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
  outing_request: {
    name: "外出申请单",
    html: outingRequestHtml,
    css: commonCss,
    variables: outingRequestVariables,
    paperSize: "A4",
    orientation: "portrait",
  },
};
