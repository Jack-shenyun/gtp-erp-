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
