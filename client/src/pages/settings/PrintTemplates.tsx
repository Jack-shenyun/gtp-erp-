import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import ERPLayout from "@/components/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Printer,
  FileText,
  Edit,
  Eye,
  ShoppingCart,
  Truck,
  Receipt,
  Factory,
  Package,
  ClipboardCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  TEMPLATE_DEFINITIONS,
  getTemplateDefinition,
  generateExampleContext,
} from "@/lib/printTemplateDefaults";
import {
  buildPrintDocument,
  createPrintContext,
  renderTemplate,
  spreadsheetToRenderableHtml,
} from "@/lib/printEngine";
import SpreadsheetEditor, {
  type SpreadsheetData,
  type FieldGroup,
  createEmptySpreadsheet,
  spreadsheetToHtml,
} from "@/components/print/SpreadsheetEditor";

// ==================== 图标映射 ====================
const ICON_MAP: Record<string, React.ElementType> = {
  sales_order: ShoppingCart,
  delivery_note: Truck,
  receipt: Receipt,
  purchase_order: Package,
  production_order: Factory,
  iqc_inspection: ClipboardCheck,
};

const COLOR_MAP: Record<string, string> = {
  sales: "bg-emerald-50 border-emerald-200 text-emerald-700",
  purchase: "bg-cyan-50 border-cyan-200 text-cyan-700",
  production: "bg-orange-50 border-orange-200 text-orange-700",
  quality: "bg-violet-50 border-violet-200 text-violet-700",
};

const MODULE_LABELS: Record<string, string> = {
  sales: "销售部",
  purchase: "采购部",
  production: "生产部",
  quality: "质量部",
};

// ==================== 默认模板数据（SpreadsheetData 格式）====================

function createSalesOrderTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(25, 8);
  data.colWidths = [40, 120, 80, 80, 60, 80, 80, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 24, 6, 24, 24, 24, 24, 24, 24, 24, 24, 24, 6, 24, 24, 24, 6, 28, 24, 24];

  const c = data.cells;
  // 标题行 - 合并全部列
  c["0,0"] = { value: "${company.name}", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none", color: "#1a56db" };
  for (let i = 1; i < 8; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };

  // 副标题
  c["1,0"] = { value: "销 售 订 单", bold: true, fontSize: 14, textAlign: "center", verticalAlign: "middle", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 8; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  // 空行
  c["2,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  // 基本信息区
  const infoStyle = { fontSize: 9, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  c["3,0"] = { value: "订单编号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${orderNumber}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "订单日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${orderDate}", ...infoStyle, colSpan: 2 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "客户名称：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${customerName}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "交货日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${deliveryDate}", ...infoStyle, colSpan: 2 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };

  c["5,0"] = { value: "收货地址：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,1"] = { value: "", merged: true, mergeParent: "5,0" };
  c["5,2"] = { value: "${shippingAddress}", ...infoStyle, colSpan: 6 };
  for (let i = 3; i < 8; i++) c[`5,${i}`] = { value: "", merged: true, mergeParent: "5,2" };

  c["6,0"] = { value: "联系人：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["6,1"] = { value: "", merged: true, mergeParent: "6,0" };
  c["6,2"] = { value: "${shippingContact}", ...infoStyle, colSpan: 2 };
  c["6,3"] = { value: "", merged: true, mergeParent: "6,2" };
  c["6,4"] = { value: "联系电话：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["6,5"] = { value: "", merged: true, mergeParent: "6,4" };
  c["6,6"] = { value: "${shippingPhone}", ...infoStyle, colSpan: 2 };
  c["6,7"] = { value: "", merged: true, mergeParent: "6,6" };

  // 空行
  c["7,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`7,${i}`] = { value: "", merged: true, mergeParent: "7,0" };

  // 产品明细表头
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#e8edf5", borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  c["8,0"] = { value: "序号", ...headerStyle };
  c["8,1"] = { value: "产品名称", ...headerStyle };
  c["8,2"] = { value: "产品编码", ...headerStyle };
  c["8,3"] = { value: "规格型号", ...headerStyle };
  c["8,4"] = { value: "数量", ...headerStyle };
  c["8,5"] = { value: "单价", ...headerStyle };
  c["8,6"] = { value: "金额", ...headerStyle };
  c["8,7"] = { value: "备注", ...headerStyle };

  // 明细行（循环标记）
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  // 循环开始标记行
  c["9,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["9,1"] = { value: "${items.productName}", ...bodyStyle, textAlign: "left" };
  c["9,2"] = { value: "${items.productCode}", ...bodyStyle };
  c["9,3"] = { value: "${items.specification}", ...bodyStyle };
  c["9,4"] = { value: "${items.quantity}", ...bodyStyle };
  c["9,5"] = { value: "${items.unitPrice}", ...bodyStyle };
  c["9,6"] = { value: "${items.amount}", ...bodyStyle };
  c["9,7"] = { value: "{{/each}}", ...bodyStyle };

  // 合计行
  c["10,0"] = { value: "", ...bodyStyle, colSpan: 6, textAlign: "right", bold: true };
  for (let i = 1; i < 6; i++) c[`10,${i}`] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,0"].value = "合计金额：";
  c["10,6"] = { value: "${totalAmount | currency}", ...bodyStyle, bold: true, colSpan: 2 };
  c["10,7"] = { value: "", merged: true, mergeParent: "10,6" };

  // 空行
  c["11,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`11,${i}`] = { value: "", merged: true, mergeParent: "11,0" };

  // 备注
  c["12,0"] = { value: "备注：", bold: true, fontSize: 9, colSpan: 2, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  c["12,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,2"] = { value: "${notes}", fontSize: 9, colSpan: 6, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 3; i < 8; i++) c[`12,${i}`] = { value: "", merged: true, mergeParent: "12,2" };

  // 空行
  c["13,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`13,${i}`] = { value: "", merged: true, mergeParent: "13,0" };

  // 签名区
  const sigStyle = { fontSize: 9, textAlign: "center" as const, borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000", bold: true, bgColor: "#f0f0f0" };
  c["14,0"] = { value: "制单人", ...sigStyle, colSpan: 2 };
  c["14,1"] = { value: "", merged: true, mergeParent: "14,0" };
  c["14,2"] = { value: "审核人", ...sigStyle, colSpan: 2 };
  c["14,3"] = { value: "", merged: true, mergeParent: "14,2" };
  c["14,4"] = { value: "客户确认", ...sigStyle, colSpan: 2 };
  c["14,5"] = { value: "", merged: true, mergeParent: "14,4" };
  c["14,6"] = { value: "日期", ...sigStyle, colSpan: 2 };
  c["14,7"] = { value: "", merged: true, mergeParent: "14,6" };

  // 签名空行
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  c["15,0"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["15,1"] = { value: "", merged: true, mergeParent: "15,0" };
  c["16,0"] = { value: "", merged: true, mergeParent: "15,0" };
  c["16,1"] = { value: "", merged: true, mergeParent: "15,0" };
  c["15,2"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["15,3"] = { value: "", merged: true, mergeParent: "15,2" };
  c["16,2"] = { value: "", merged: true, mergeParent: "15,2" };
  c["16,3"] = { value: "", merged: true, mergeParent: "15,2" };
  c["15,4"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["15,5"] = { value: "", merged: true, mergeParent: "15,4" };
  c["16,4"] = { value: "", merged: true, mergeParent: "15,4" };
  c["16,5"] = { value: "", merged: true, mergeParent: "15,4" };
  c["15,6"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["15,7"] = { value: "", merged: true, mergeParent: "15,6" };
  c["16,6"] = { value: "", merged: true, mergeParent: "15,6" };
  c["16,7"] = { value: "", merged: true, mergeParent: "15,6" };

  // 页脚
  c["17,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`17,${i}`] = { value: "", merged: true, mergeParent: "17,0" };

  c["18,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 4, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 4; i++) c[`18,${i}`] = { value: "", merged: true, mergeParent: "18,0" };
  c["18,4"] = { value: "${company.phone}", fontSize: 8, color: "#999", textAlign: "right", colSpan: 4, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 5; i < 8; i++) c[`18,${i}`] = { value: "", merged: true, mergeParent: "18,4" };

  return data;
}

function createPurchaseOrderTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(22, 8);
  data.colWidths = [40, 120, 80, 80, 60, 80, 80, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 6, 24, 24, 24, 24, 6, 24, 6, 24, 24, 24, 6, 24, 24, 24, 24];

  const c = data.cells;
  c["0,0"] = { value: "${company.name}", bold: true, fontSize: 16, textAlign: "center", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none", color: "#1a56db" };
  for (let i = 1; i < 8; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };

  c["1,0"] = { value: "采 购 订 单", bold: true, fontSize: 14, textAlign: "center", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 8; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  const infoStyle = { fontSize: 9, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  c["3,0"] = { value: "采购单号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${orderNo}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "采购日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${orderDate}", ...infoStyle, colSpan: 2 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "供应商：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${supplierName}", ...infoStyle, colSpan: 6 };
  for (let i = 3; i < 8; i++) c[`4,${i}`] = { value: "", merged: true, mergeParent: "4,2" };

  c["5,0"] = { value: "联系人：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,1"] = { value: "", merged: true, mergeParent: "5,0" };
  c["5,2"] = { value: "${contactPerson}", ...infoStyle, colSpan: 2 };
  c["5,3"] = { value: "", merged: true, mergeParent: "5,2" };
  c["5,4"] = { value: "联系电话：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,5"] = { value: "", merged: true, mergeParent: "5,4" };
  c["5,6"] = { value: "${contactPhone}", ...infoStyle, colSpan: 2 };
  c["5,7"] = { value: "", merged: true, mergeParent: "5,6" };

  c["6,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`6,${i}`] = { value: "", merged: true, mergeParent: "6,0" };

  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#e0f2fe", borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  c["7,0"] = { value: "序号", ...headerStyle };
  c["7,1"] = { value: "产品名称", ...headerStyle };
  c["7,2"] = { value: "产品编码", ...headerStyle };
  c["7,3"] = { value: "规格型号", ...headerStyle };
  c["7,4"] = { value: "数量", ...headerStyle };
  c["7,5"] = { value: "单价", ...headerStyle };
  c["7,6"] = { value: "金额", ...headerStyle };
  c["7,7"] = { value: "备注", ...headerStyle };

  const bodyStyle = { fontSize: 9, textAlign: "center" as const, borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  c["8,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["8,1"] = { value: "${items.productName}", ...bodyStyle, textAlign: "left" };
  c["8,2"] = { value: "${items.productCode}", ...bodyStyle };
  c["8,3"] = { value: "${items.specification}", ...bodyStyle };
  c["8,4"] = { value: "${items.quantity}", ...bodyStyle };
  c["8,5"] = { value: "${items.unitPrice}", ...bodyStyle };
  c["8,6"] = { value: "${items.amount}", ...bodyStyle };
  c["8,7"] = { value: "{{/each}}", ...bodyStyle };

  c["9,0"] = { value: "合计金额：", ...bodyStyle, colSpan: 6, textAlign: "right", bold: true };
  for (let i = 1; i < 6; i++) c[`9,${i}`] = { value: "", merged: true, mergeParent: "9,0" };
  c["9,6"] = { value: "${totalAmount | currency}", ...bodyStyle, bold: true, colSpan: 2 };
  c["9,7"] = { value: "", merged: true, mergeParent: "9,6" };

  c["10,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`10,${i}`] = { value: "", merged: true, mergeParent: "10,0" };

  c["11,0"] = { value: "备注：${remark}", fontSize: 9, colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`11,${i}`] = { value: "", merged: true, mergeParent: "11,0" };

  c["12,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`12,${i}`] = { value: "", merged: true, mergeParent: "12,0" };

  return data;
}

function createProductionOrderTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(22, 8);
  data.colWidths = [40, 120, 80, 80, 60, 80, 80, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 24, 6, 24, 24, 24, 24, 6, 24, 6, 24, 24, 24, 6, 24, 24, 24];

  const c = data.cells;
  c["0,0"] = { value: "${company.name}", bold: true, fontSize: 16, textAlign: "center", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none", color: "#1a56db" };
  for (let i = 1; i < 8; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };

  c["1,0"] = { value: "生 产 指 令 单", bold: true, fontSize: 14, textAlign: "center", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 8; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  const infoStyle = { fontSize: 9, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  c["3,0"] = { value: "生产单号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${orderNo}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "计划日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${plannedStartDate}", ...infoStyle, colSpan: 2 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "产品名称：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${productName}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "规格型号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${productSpec}", ...infoStyle, colSpan: 2 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };

  c["5,0"] = { value: "生产数量：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,1"] = { value: "", merged: true, mergeParent: "5,0" };
  c["5,2"] = { value: "${plannedQty}", ...infoStyle, colSpan: 2 };
  c["5,3"] = { value: "", merged: true, mergeParent: "5,2" };
  c["5,4"] = { value: "批号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,5"] = { value: "", merged: true, mergeParent: "5,4" };
  c["5,6"] = { value: "${batchNo}", ...infoStyle, colSpan: 2 };
  c["5,7"] = { value: "", merged: true, mergeParent: "5,6" };

  c["6,0"] = { value: "关联销售单：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["6,1"] = { value: "", merged: true, mergeParent: "6,0" };
  c["6,2"] = { value: "${planNo}", ...infoStyle, colSpan: 6 };
  for (let i = 3; i < 8; i++) c[`6,${i}`] = { value: "", merged: true, mergeParent: "6,2" };

  c["7,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`7,${i}`] = { value: "", merged: true, mergeParent: "7,0" };

  // BOM 物料表头
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#fef3c7", borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  c["8,0"] = { value: "序号", ...headerStyle };
  c["8,1"] = { value: "物料名称", ...headerStyle };
  c["8,2"] = { value: "物料编码", ...headerStyle };
  c["8,3"] = { value: "规格", ...headerStyle };
  c["8,4"] = { value: "单位用量", ...headerStyle };
  c["8,5"] = { value: "总需求量", ...headerStyle };
  c["8,6"] = { value: "单位", ...headerStyle };
  c["8,7"] = { value: "备注", ...headerStyle };

  const bodyStyle = { fontSize: 9, textAlign: "center" as const, borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  c["9,0"] = { value: "{{#each bomItems}}{{@number}}", ...bodyStyle };
  c["9,1"] = { value: "${bomItems.materialName}", ...bodyStyle, textAlign: "left" };
  c["9,2"] = { value: "${bomItems.materialCode}", ...bodyStyle };
  c["9,3"] = { value: "${bomItems.specification}", ...bodyStyle };
  c["9,4"] = { value: "${bomItems.unitUsage}", ...bodyStyle };
  c["9,5"] = { value: "${bomItems.totalRequired}", ...bodyStyle };
  c["9,6"] = { value: "${bomItems.unit}", ...bodyStyle };
  c["9,7"] = { value: "{{/each}}", ...bodyStyle };

  c["10,0"] = { value: "", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`10,${i}`] = { value: "", merged: true, mergeParent: "10,0" };

  c["11,0"] = { value: "备注：${remark}", fontSize: 9, colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`11,${i}`] = { value: "", merged: true, mergeParent: "11,0" };

  c["12,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 8, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  for (let i = 1; i < 8; i++) c[`12,${i}`] = { value: "", merged: true, mergeParent: "12,0" };

  return data;
}



// ==================== 辅助函数 ====================
// 批量设置合并单元格（被覆盖的格）
function setMergedCells(c: Record<string, any>, parentKey: string, rows: number[], cols: number[]) {
  for (const r of rows) {
    for (const col of cols) {
      const key = `${r},${col}`;
      if (key !== parentKey) c[key] = { value: "", merged: true, mergeParent: parentKey };
    }
  }
}

// ==================== 物料申请单 ====================
function createMaterialRequisitionTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(20, 8);
  data.colWidths = [40, 120, 120, 80, 80, 60, 60, 100];
  data.rowHeights = [32, 28, 6, 24, 24, 6, 24, 24, 24, 24, 24, 6, 24, 24, 24, 6, 28, 24, 24, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...noBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#e8f5e9", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  // 标题
  c["0,0"] = { value: "物 料 申 请 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 8, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 8; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "MATERIAL REQUISITION", bold: false, fontSize: 10, textAlign: "center", verticalAlign: "middle", colSpan: 8, ...noBorder, color: "#6b7280", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 8; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  // 空行
  c["2,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  // 基本信息
  c["3,0"] = { value: "申请部门：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${department}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "申请日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${applyDate}", ...infoStyle, colSpan: 2 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "申请人：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${applicantName}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "关联工单：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${productionOrderNo}", ...infoStyle, colSpan: 2 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };

  // 空行
  c["5,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`5,${i}`] = { value: "", merged: true, mergeParent: "5,0" };

  // 表头
  c["6,0"] = { value: "序号", ...headerStyle };
  c["6,1"] = { value: "物料编码", ...headerStyle };
  c["6,2"] = { value: "物料名称", ...headerStyle };
  c["6,3"] = { value: "规格型号", ...headerStyle };
  c["6,4"] = { value: "申请数量", ...headerStyle };
  c["6,5"] = { value: "单位", ...headerStyle };
  c["6,6"] = { value: "需求日期", ...headerStyle };
  c["6,7"] = { value: "备注", ...headerStyle };

  // 明细行
  c["7,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["7,1"] = { value: "${items.materialCode}", ...bodyStyle };
  c["7,2"] = { value: "${items.materialName}", ...bodyStyle, textAlign: "left" };
  c["7,3"] = { value: "${items.specification}", ...bodyStyle };
  c["7,4"] = { value: "${items.quantity}", ...bodyStyle };
  c["7,5"] = { value: "${items.unit}", ...bodyStyle };
  c["7,6"] = { value: "${items.requiredDate}", ...bodyStyle };
  c["7,7"] = { value: "{{/each}}", ...bodyStyle };

  // 空行
  c["8,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`8,${i}`] = { value: "", merged: true, mergeParent: "8,0" };

  // 签名区
  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["9,0"] = { value: "制单人", ...sigHeaderStyle, colSpan: 2 };
  c["9,1"] = { value: "", merged: true, mergeParent: "9,0" };
  c["9,2"] = { value: "部门主管", ...sigHeaderStyle, colSpan: 2 };
  c["9,3"] = { value: "", merged: true, mergeParent: "9,2" };
  c["9,4"] = { value: "仓库审核", ...sigHeaderStyle, colSpan: 2 };
  c["9,5"] = { value: "", merged: true, mergeParent: "9,4" };
  c["9,6"] = { value: "批准人", ...sigHeaderStyle, colSpan: 2 };
  c["9,7"] = { value: "", merged: true, mergeParent: "9,6" };

  c["10,0"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["10,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,0"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,2"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["10,3"] = { value: "", merged: true, mergeParent: "10,2" };
  c["11,2"] = { value: "", merged: true, mergeParent: "10,2" };
  c["11,3"] = { value: "", merged: true, mergeParent: "10,2" };
  c["10,4"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["10,5"] = { value: "", merged: true, mergeParent: "10,4" };
  c["11,4"] = { value: "", merged: true, mergeParent: "10,4" };
  c["11,5"] = { value: "", merged: true, mergeParent: "10,4" };
  c["10,6"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["10,7"] = { value: "", merged: true, mergeParent: "10,6" };
  c["11,6"] = { value: "", merged: true, mergeParent: "10,6" };
  c["11,7"] = { value: "", merged: true, mergeParent: "10,6" };

  c["12,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`12,${i}`] = { value: "", merged: true, mergeParent: "12,0" };

  return data;
}

// ==================== 入库单 ====================
function createWarehouseInTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(18, 9);
  data.colWidths = [40, 110, 110, 80, 70, 60, 80, 80, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 6, 24, 24, 24, 24, 24, 6, 24, 24, 24, 6, 24, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...noBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#e3f2fd", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  c["0,0"] = { value: "入 库 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 9, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 9; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "WAREHOUSE RECEIPT", bold: false, fontSize: 10, textAlign: "center", colSpan: 9, ...noBorder, color: "#6b7280", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 9; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 9, ...noBorder };
  for (let i = 1; i < 9; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "入库单号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${inboundNo}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "入库日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${inboundDate}", ...infoStyle, colSpan: 3 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };
  c["3,8"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "入库类型：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${inboundType}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "仓库：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${warehouseName}", ...infoStyle, colSpan: 3 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };
  c["4,8"] = { value: "", merged: true, mergeParent: "4,6" };

  c["5,0"] = { value: "", colSpan: 9, ...noBorder };
  for (let i = 1; i < 9; i++) c[`5,${i}`] = { value: "", merged: true, mergeParent: "5,0" };

  c["6,0"] = { value: "序号", ...headerStyle };
  c["6,1"] = { value: "物料编码", ...headerStyle };
  c["6,2"] = { value: "物料名称", ...headerStyle };
  c["6,3"] = { value: "规格型号", ...headerStyle };
  c["6,4"] = { value: "数量", ...headerStyle };
  c["6,5"] = { value: "单位", ...headerStyle };
  c["6,6"] = { value: "批号", ...headerStyle };
  c["6,7"] = { value: "库位", ...headerStyle };
  c["6,8"] = { value: "备注", ...headerStyle };

  c["7,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["7,1"] = { value: "${items.materialCode}", ...bodyStyle };
  c["7,2"] = { value: "${items.materialName}", ...bodyStyle, textAlign: "left" };
  c["7,3"] = { value: "${items.specification}", ...bodyStyle };
  c["7,4"] = { value: "${items.quantity}", ...bodyStyle };
  c["7,5"] = { value: "${items.unit}", ...bodyStyle };
  c["7,6"] = { value: "${items.batchNo}", ...bodyStyle };
  c["7,7"] = { value: "${items.location}", ...bodyStyle };
  c["7,8"] = { value: "{{/each}}", ...bodyStyle };

  c["8,0"] = { value: "", colSpan: 9, ...noBorder };
  for (let i = 1; i < 9; i++) c[`8,${i}`] = { value: "", merged: true, mergeParent: "8,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["9,0"] = { value: "制单人", ...sigHeaderStyle, colSpan: 3 };
  c["9,1"] = { value: "", merged: true, mergeParent: "9,0" };
  c["9,2"] = { value: "", merged: true, mergeParent: "9,0" };
  c["9,3"] = { value: "审核人", ...sigHeaderStyle, colSpan: 3 };
  c["9,4"] = { value: "", merged: true, mergeParent: "9,3" };
  c["9,5"] = { value: "", merged: true, mergeParent: "9,3" };
  c["9,6"] = { value: "仓管员", ...sigHeaderStyle, colSpan: 3 };
  c["9,7"] = { value: "", merged: true, mergeParent: "9,6" };
  c["9,8"] = { value: "", merged: true, mergeParent: "9,6" };

  c["10,0"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 2 };
  c["10,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,2"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,0"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,2"] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,3"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 2 };
  c["10,4"] = { value: "", merged: true, mergeParent: "10,3" };
  c["10,5"] = { value: "", merged: true, mergeParent: "10,3" };
  c["11,3"] = { value: "", merged: true, mergeParent: "10,3" };
  c["11,4"] = { value: "", merged: true, mergeParent: "10,3" };
  c["11,5"] = { value: "", merged: true, mergeParent: "10,3" };
  c["10,6"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 2 };
  c["10,7"] = { value: "", merged: true, mergeParent: "10,6" };
  c["10,8"] = { value: "", merged: true, mergeParent: "10,6" };
  c["11,6"] = { value: "", merged: true, mergeParent: "10,6" };
  c["11,7"] = { value: "", merged: true, mergeParent: "10,6" };
  c["11,8"] = { value: "", merged: true, mergeParent: "10,6" };

  c["12,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 9, ...noBorder };
  for (let i = 1; i < 9; i++) c[`12,${i}`] = { value: "", merged: true, mergeParent: "12,0" };

  return data;
}

// ==================== 出库单 ====================
function createWarehouseOutTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(18, 9);
  data.colWidths = [40, 110, 110, 80, 70, 60, 80, 80, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 6, 24, 24, 24, 24, 24, 6, 24, 24, 24, 6, 24, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...noBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#fff3e0", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  c["0,0"] = { value: "出 库 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 9, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 9; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "WAREHOUSE ISSUE", bold: false, fontSize: 10, textAlign: "center", colSpan: 9, ...noBorder, color: "#6b7280", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 9; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 9, ...noBorder };
  for (let i = 1; i < 9; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "出库单号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${outboundNo}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "出库日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${outboundDate}", ...infoStyle, colSpan: 3 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };
  c["3,8"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "出库类型：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${outboundType}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "领料部门：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${recipientDept}", ...infoStyle, colSpan: 3 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };
  c["4,8"] = { value: "", merged: true, mergeParent: "4,6" };

  c["5,0"] = { value: "", colSpan: 9, ...noBorder };
  for (let i = 1; i < 9; i++) c[`5,${i}`] = { value: "", merged: true, mergeParent: "5,0" };

  c["6,0"] = { value: "序号", ...headerStyle };
  c["6,1"] = { value: "物料编码", ...headerStyle };
  c["6,2"] = { value: "物料名称", ...headerStyle };
  c["6,3"] = { value: "规格型号", ...headerStyle };
  c["6,4"] = { value: "数量", ...headerStyle };
  c["6,5"] = { value: "单位", ...headerStyle };
  c["6,6"] = { value: "批号", ...headerStyle };
  c["6,7"] = { value: "库位", ...headerStyle };
  c["6,8"] = { value: "备注", ...headerStyle };

  c["7,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["7,1"] = { value: "${items.materialCode}", ...bodyStyle };
  c["7,2"] = { value: "${items.materialName}", ...bodyStyle, textAlign: "left" };
  c["7,3"] = { value: "${items.specification}", ...bodyStyle };
  c["7,4"] = { value: "${items.quantity}", ...bodyStyle };
  c["7,5"] = { value: "${items.unit}", ...bodyStyle };
  c["7,6"] = { value: "${items.batchNo}", ...bodyStyle };
  c["7,7"] = { value: "${items.location}", ...bodyStyle };
  c["7,8"] = { value: "{{/each}}", ...bodyStyle };

  c["8,0"] = { value: "", colSpan: 9, ...noBorder };
  for (let i = 1; i < 9; i++) c[`8,${i}`] = { value: "", merged: true, mergeParent: "8,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["9,0"] = { value: "制单人", ...sigHeaderStyle, colSpan: 2 };
  c["9,1"] = { value: "", merged: true, mergeParent: "9,0" };
  c["9,2"] = { value: "审核人", ...sigHeaderStyle, colSpan: 2 };
  c["9,3"] = { value: "", merged: true, mergeParent: "9,2" };
  c["9,4"] = { value: "领料人", ...sigHeaderStyle, colSpan: 3 };
  c["9,5"] = { value: "", merged: true, mergeParent: "9,4" };
  c["9,6"] = { value: "", merged: true, mergeParent: "9,4" };
  c["9,6"] = { value: "仓管员", ...sigHeaderStyle, colSpan: 3 };
  c["9,7"] = { value: "", merged: true, mergeParent: "9,6" };
  c["9,8"] = { value: "", merged: true, mergeParent: "9,6" };

  c["10,0"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["10,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,0"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,2"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["10,3"] = { value: "", merged: true, mergeParent: "10,2" };
  c["11,2"] = { value: "", merged: true, mergeParent: "10,2" };
  c["11,3"] = { value: "", merged: true, mergeParent: "10,2" };
  c["10,4"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["10,5"] = { value: "", merged: true, mergeParent: "10,4" };
  c["11,4"] = { value: "", merged: true, mergeParent: "10,4" };
  c["11,5"] = { value: "", merged: true, mergeParent: "10,4" };
  c["10,6"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 2 };
  c["10,7"] = { value: "", merged: true, mergeParent: "10,6" };
  c["10,8"] = { value: "", merged: true, mergeParent: "10,6" };
  c["11,6"] = { value: "", merged: true, mergeParent: "10,6" };
  c["11,7"] = { value: "", merged: true, mergeParent: "10,6" };
  c["11,8"] = { value: "", merged: true, mergeParent: "10,6" };

  c["12,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 9, ...noBorder };
  for (let i = 1; i < 9; i++) c[`12,${i}`] = { value: "", merged: true, mergeParent: "12,0" };

  return data;
}

// ==================== 盘点单 ====================
function createInventoryCheckTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(18, 10);
  data.colWidths = [40, 110, 110, 80, 50, 80, 80, 70, 70, 70];
  data.rowHeights = [32, 28, 6, 24, 24, 6, 24, 24, 24, 24, 24, 6, 24, 24, 24, 6, 24, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...noBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#f3e5f5", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  c["0,0"] = { value: "库 存 盘 点 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 10, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 10; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "INVENTORY CHECK SHEET", bold: false, fontSize: 10, textAlign: "center", colSpan: 10, ...noBorder, color: "#6b7280", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 10; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "盘点单号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${checkNo}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "盘点日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${checkDate}", ...infoStyle, colSpan: 4 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };
  c["3,8"] = { value: "", merged: true, mergeParent: "3,6" };
  c["3,9"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "仓库：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${warehouseName}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "负责人：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${handlerName}", ...infoStyle, colSpan: 4 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };
  c["4,8"] = { value: "", merged: true, mergeParent: "4,6" };
  c["4,9"] = { value: "", merged: true, mergeParent: "4,6" };

  c["5,0"] = { value: "", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`5,${i}`] = { value: "", merged: true, mergeParent: "5,0" };

  c["6,0"] = { value: "序号", ...headerStyle };
  c["6,1"] = { value: "物料编码", ...headerStyle };
  c["6,2"] = { value: "物料名称", ...headerStyle };
  c["6,3"] = { value: "规格型号", ...headerStyle };
  c["6,4"] = { value: "单位", ...headerStyle };
  c["6,5"] = { value: "库位/批号", ...headerStyle };
  c["6,6"] = { value: "账面数量", ...headerStyle };
  c["6,7"] = { value: "实盘数量", ...headerStyle };
  c["6,8"] = { value: "盈亏数量", ...headerStyle };
  c["6,9"] = { value: "备注", ...headerStyle };

  c["7,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["7,1"] = { value: "${items.materialCode}", ...bodyStyle };
  c["7,2"] = { value: "${items.materialName}", ...bodyStyle, textAlign: "left" };
  c["7,3"] = { value: "${items.specification}", ...bodyStyle };
  c["7,4"] = { value: "${items.unit}", ...bodyStyle };
  c["7,5"] = { value: "${items.location}", ...bodyStyle };
  c["7,6"] = { value: "${items.bookQuantity}", ...bodyStyle };
  c["7,7"] = { value: "${items.actualQuantity}", ...bodyStyle };
  c["7,8"] = { value: "${items.diffQuantity}", ...bodyStyle };
  c["7,9"] = { value: "{{/each}}", ...bodyStyle };

  c["8,0"] = { value: "", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`8,${i}`] = { value: "", merged: true, mergeParent: "8,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["9,0"] = { value: "盘点员", ...sigHeaderStyle, colSpan: 3 };
  c["9,1"] = { value: "", merged: true, mergeParent: "9,0" };
  c["9,2"] = { value: "", merged: true, mergeParent: "9,0" };
  c["9,3"] = { value: "复核员", ...sigHeaderStyle, colSpan: 4 };
  c["9,4"] = { value: "", merged: true, mergeParent: "9,3" };
  c["9,5"] = { value: "", merged: true, mergeParent: "9,3" };
  c["9,6"] = { value: "", merged: true, mergeParent: "9,3" };
  c["9,7"] = { value: "仓库主管", ...sigHeaderStyle, colSpan: 3 };
  c["9,8"] = { value: "", merged: true, mergeParent: "9,7" };
  c["9,9"] = { value: "", merged: true, mergeParent: "9,7" };

  c["10,0"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 2 };
  c["10,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,2"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,0"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["11,2"] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,3"] = { value: "", ...sigEmptyStyle, colSpan: 4, rowSpan: 2 };
  c["10,4"] = { value: "", merged: true, mergeParent: "10,3" };
  c["10,5"] = { value: "", merged: true, mergeParent: "10,3" };
  c["10,6"] = { value: "", merged: true, mergeParent: "10,3" };
  c["11,3"] = { value: "", merged: true, mergeParent: "10,3" };
  c["11,4"] = { value: "", merged: true, mergeParent: "10,3" };
  c["11,5"] = { value: "", merged: true, mergeParent: "10,3" };
  c["11,6"] = { value: "", merged: true, mergeParent: "10,3" };
  c["10,7"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 2 };
  c["10,8"] = { value: "", merged: true, mergeParent: "10,7" };
  c["10,9"] = { value: "", merged: true, mergeParent: "10,7" };
  c["11,7"] = { value: "", merged: true, mergeParent: "10,7" };
  c["11,8"] = { value: "", merged: true, mergeParent: "10,7" };
  c["11,9"] = { value: "", merged: true, mergeParent: "10,7" };

  c["12,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`12,${i}`] = { value: "", merged: true, mergeParent: "12,0" };

  return data;
}

// ==================== IPQC 巡检单 ====================
function createIpqcInspectionTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(22, 8);
  data.colWidths = [40, 120, 120, 120, 120, 80, 60, 100];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 6, 24, 24, 24, 24, 24, 6, 24, 24, 6, 24, 24, 24, 6, 24, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...noBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#e8eaf6", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  c["0,0"] = { value: "IPQC 巡 检 记 录 单", bold: true, fontSize: 14, textAlign: "center", verticalAlign: "middle", colSpan: 8, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 8; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "In-Process Quality Control Inspection Record", bold: false, fontSize: 9, textAlign: "center", colSpan: 8, ...noBorder, color: "#6b7280", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 8; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "记录单号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${inspectionNo}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "生产工单：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${productionOrderNo}", ...infoStyle, colSpan: 2 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "产品名称：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${productName}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "巡检工序：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${processName}", ...infoStyle, colSpan: 2 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };

  c["5,0"] = { value: "巡检时间：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,1"] = { value: "", merged: true, mergeParent: "5,0" };
  c["5,2"] = { value: "${inspectionTime}", ...infoStyle, colSpan: 2 };
  c["5,3"] = { value: "", merged: true, mergeParent: "5,2" };
  c["5,4"] = { value: "检验员：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,5"] = { value: "", merged: true, mergeParent: "5,4" };
  c["5,6"] = { value: "${inspectorName}", ...infoStyle, colSpan: 2 };
  c["5,7"] = { value: "", merged: true, mergeParent: "5,6" };

  c["6,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`6,${i}`] = { value: "", merged: true, mergeParent: "6,0" };

  c["7,0"] = { value: "序号", ...headerStyle };
  c["7,1"] = { value: "检验项目", ...headerStyle, colSpan: 2 };
  c["7,2"] = { value: "", merged: true, mergeParent: "7,1" };
  c["7,3"] = { value: "检验标准", ...headerStyle, colSpan: 2 };
  c["7,4"] = { value: "", merged: true, mergeParent: "7,3" };
  c["7,5"] = { value: "检验结果", ...headerStyle };
  c["7,6"] = { value: "判定", ...headerStyle };
  c["7,7"] = { value: "备注", ...headerStyle };

  c["8,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["8,1"] = { value: "${items.itemName}", ...bodyStyle, textAlign: "left", colSpan: 2 };
  c["8,2"] = { value: "", merged: true, mergeParent: "8,1" };
  c["8,3"] = { value: "${items.standard}", ...bodyStyle, textAlign: "left", colSpan: 2 };
  c["8,4"] = { value: "", merged: true, mergeParent: "8,3" };
  c["8,5"] = { value: "${items.result}", ...bodyStyle };
  c["8,6"] = { value: "${items.judgment}", ...bodyStyle };
  c["8,7"] = { value: "{{/each}}", ...bodyStyle };

  c["9,0"] = { value: "检验结论：", bold: true, ...{ ...solidBorder, bgColor: "#f0f0f0" }, fontSize: 9, colSpan: 2, textAlign: "right" };
  c["9,1"] = { value: "", merged: true, mergeParent: "9,0" };
  c["9,2"] = { value: "${finalJudgment}", ...solidBorder, fontSize: 9, colSpan: 6 };
  for (let i = 3; i < 8; i++) c[`9,${i}`] = { value: "", merged: true, mergeParent: "9,2" };

  c["10,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`10,${i}`] = { value: "", merged: true, mergeParent: "10,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["11,0"] = { value: "检验员", ...sigHeaderStyle, colSpan: 4 };
  c["11,1"] = { value: "", merged: true, mergeParent: "11,0" };
  c["11,2"] = { value: "", merged: true, mergeParent: "11,0" };
  c["11,3"] = { value: "", merged: true, mergeParent: "11,0" };
  c["11,4"] = { value: "班组长确认", ...sigHeaderStyle, colSpan: 4 };
  c["11,5"] = { value: "", merged: true, mergeParent: "11,4" };
  c["11,6"] = { value: "", merged: true, mergeParent: "11,4" };
  c["11,7"] = { value: "", merged: true, mergeParent: "11,4" };

  c["12,0"] = { value: "", ...sigEmptyStyle, colSpan: 4, rowSpan: 2 };
  c["12,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,2"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,3"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,0"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,2"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,3"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,4"] = { value: "", ...sigEmptyStyle, colSpan: 4, rowSpan: 2 };
  c["12,5"] = { value: "", merged: true, mergeParent: "12,4" };
  c["12,6"] = { value: "", merged: true, mergeParent: "12,4" };
  c["12,7"] = { value: "", merged: true, mergeParent: "12,4" };
  c["13,4"] = { value: "", merged: true, mergeParent: "12,4" };
  c["13,5"] = { value: "", merged: true, mergeParent: "12,4" };
  c["13,6"] = { value: "", merged: true, mergeParent: "12,4" };
  c["13,7"] = { value: "", merged: true, mergeParent: "12,4" };

  c["14,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`14,${i}`] = { value: "", merged: true, mergeParent: "14,0" };

  return data;
}

// ==================== OQC 成品检验单 ====================
function createOqcInspectionTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(24, 8);
  data.colWidths = [40, 120, 120, 120, 120, 80, 60, 100];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 24, 6, 24, 24, 24, 24, 24, 6, 24, 24, 6, 24, 24, 24, 6, 24, 24, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...noBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#e8f5e9", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  c["0,0"] = { value: "OQC 成 品 检 验 报 告", bold: true, fontSize: 14, textAlign: "center", verticalAlign: "middle", colSpan: 8, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 8; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "Outgoing Quality Control Inspection Report", bold: false, fontSize: 9, textAlign: "center", colSpan: 8, ...noBorder, color: "#6b7280", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 8; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "报告编号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${inspectionNo}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "生产工单：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${productionOrderNo}", ...infoStyle, colSpan: 2 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "产品名称：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${productName}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "产品批号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${batchNo}", ...infoStyle, colSpan: 2 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };

  c["5,0"] = { value: "检验日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,1"] = { value: "", merged: true, mergeParent: "5,0" };
  c["5,2"] = { value: "${inspectionDate}", ...infoStyle, colSpan: 2 };
  c["5,3"] = { value: "", merged: true, mergeParent: "5,2" };
  c["5,4"] = { value: "抽检数量：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,5"] = { value: "", merged: true, mergeParent: "5,4" };
  c["5,6"] = { value: "${sampleQuantity}", ...infoStyle, colSpan: 2 };
  c["5,7"] = { value: "", merged: true, mergeParent: "5,6" };

  c["6,0"] = { value: "检验员：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["6,1"] = { value: "", merged: true, mergeParent: "6,0" };
  c["6,2"] = { value: "${inspectorName}", ...infoStyle, colSpan: 2 };
  c["6,3"] = { value: "", merged: true, mergeParent: "6,2" };
  c["6,4"] = { value: "订单数量：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["6,5"] = { value: "", merged: true, mergeParent: "6,4" };
  c["6,6"] = { value: "${orderQuantity}", ...infoStyle, colSpan: 2 };
  c["6,7"] = { value: "", merged: true, mergeParent: "6,6" };

  c["7,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`7,${i}`] = { value: "", merged: true, mergeParent: "7,0" };

  c["8,0"] = { value: "序号", ...headerStyle };
  c["8,1"] = { value: "检验项目", ...headerStyle, colSpan: 2 };
  c["8,2"] = { value: "", merged: true, mergeParent: "8,1" };
  c["8,3"] = { value: "检验标准", ...headerStyle, colSpan: 2 };
  c["8,4"] = { value: "", merged: true, mergeParent: "8,3" };
  c["8,5"] = { value: "检验结果", ...headerStyle };
  c["8,6"] = { value: "判定", ...headerStyle };
  c["8,7"] = { value: "备注", ...headerStyle };

  c["9,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["9,1"] = { value: "${items.itemName}", ...bodyStyle, textAlign: "left", colSpan: 2 };
  c["9,2"] = { value: "", merged: true, mergeParent: "9,1" };
  c["9,3"] = { value: "${items.standard}", ...bodyStyle, textAlign: "left", colSpan: 2 };
  c["9,4"] = { value: "", merged: true, mergeParent: "9,3" };
  c["9,5"] = { value: "${items.result}", ...bodyStyle };
  c["9,6"] = { value: "${items.judgment}", ...bodyStyle };
  c["9,7"] = { value: "{{/each}}", ...bodyStyle };

  c["10,0"] = { value: "检验结论：", bold: true, ...{ ...solidBorder, bgColor: "#f0f0f0" }, fontSize: 9, colSpan: 2, textAlign: "right" };
  c["10,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,2"] = { value: "${finalJudgment}", ...solidBorder, fontSize: 9, colSpan: 6 };
  for (let i = 3; i < 8; i++) c[`10,${i}`] = { value: "", merged: true, mergeParent: "10,2" };

  c["11,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`11,${i}`] = { value: "", merged: true, mergeParent: "11,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["12,0"] = { value: "检验员", ...sigHeaderStyle, colSpan: 4 };
  c["12,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,2"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,3"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,4"] = { value: "审核人", ...sigHeaderStyle, colSpan: 4 };
  c["12,5"] = { value: "", merged: true, mergeParent: "12,4" };
  c["12,6"] = { value: "", merged: true, mergeParent: "12,4" };
  c["12,7"] = { value: "", merged: true, mergeParent: "12,4" };

  c["13,0"] = { value: "", ...sigEmptyStyle, colSpan: 4, rowSpan: 2 };
  c["13,1"] = { value: "", merged: true, mergeParent: "13,0" };
  c["13,2"] = { value: "", merged: true, mergeParent: "13,0" };
  c["13,3"] = { value: "", merged: true, mergeParent: "13,0" };
  c["14,0"] = { value: "", merged: true, mergeParent: "13,0" };
  c["14,1"] = { value: "", merged: true, mergeParent: "13,0" };
  c["14,2"] = { value: "", merged: true, mergeParent: "13,0" };
  c["14,3"] = { value: "", merged: true, mergeParent: "13,0" };
  c["13,4"] = { value: "", ...sigEmptyStyle, colSpan: 4, rowSpan: 2 };
  c["13,5"] = { value: "", merged: true, mergeParent: "13,4" };
  c["13,6"] = { value: "", merged: true, mergeParent: "13,4" };
  c["13,7"] = { value: "", merged: true, mergeParent: "13,4" };
  c["14,4"] = { value: "", merged: true, mergeParent: "13,4" };
  c["14,5"] = { value: "", merged: true, mergeParent: "13,4" };
  c["14,6"] = { value: "", merged: true, mergeParent: "13,4" };
  c["14,7"] = { value: "", merged: true, mergeParent: "13,4" };

  c["15,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`15,${i}`] = { value: "", merged: true, mergeParent: "15,0" };

  return data;
}

// ==================== 生产流转卡 ====================
function createProductionFlowCardTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(22, 8);
  data.colWidths = [40, 120, 100, 120, 120, 70, 70, 70];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 6, 24, 24, 24, 24, 24, 6, 24, 24, 24, 6, 24, 24, 24, 6, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...noBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#fff8e1", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  c["0,0"] = { value: "生 产 流 转 卡", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 8, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 8; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "PRODUCTION ROUTING CARD", bold: false, fontSize: 9, textAlign: "center", colSpan: 8, ...noBorder, color: "#6b7280", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 8; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "流转卡号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${cardNo}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "生产订单号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${productionOrderNo}", ...infoStyle, colSpan: 2 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "产品名称：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${productName}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "产品批号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${batchNo}", ...infoStyle, colSpan: 2 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };

  c["5,0"] = { value: "生产数量：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,1"] = { value: "", merged: true, mergeParent: "5,0" };
  c["5,2"] = { value: "${quantity} ${unit}", ...infoStyle, colSpan: 2 };
  c["5,3"] = { value: "", merged: true, mergeParent: "5,2" };
  c["5,4"] = { value: "状态：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,5"] = { value: "", merged: true, mergeParent: "5,4" };
  c["5,6"] = { value: "${status}", ...infoStyle, colSpan: 2 };
  c["5,7"] = { value: "", merged: true, mergeParent: "5,6" };

  c["6,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`6,${i}`] = { value: "", merged: true, mergeParent: "6,0" };

  c["7,0"] = { value: "序号", ...headerStyle };
  c["7,1"] = { value: "工序名称", ...headerStyle };
  c["7,2"] = { value: "操作人员", ...headerStyle };
  c["7,3"] = { value: "开始时间", ...headerStyle };
  c["7,4"] = { value: "结束时间", ...headerStyle };
  c["7,5"] = { value: "合格数量", ...headerStyle };
  c["7,6"] = { value: "不合格数量", ...headerStyle };
  c["7,7"] = { value: "检验员", ...headerStyle };

  c["8,0"] = { value: "{{#each processHistory}}{{@number}}", ...bodyStyle };
  c["8,1"] = { value: "${processHistory.processName}", ...bodyStyle, textAlign: "left" };
  c["8,2"] = { value: "${processHistory.operator}", ...bodyStyle };
  c["8,3"] = { value: "${processHistory.startTime}", ...bodyStyle };
  c["8,4"] = { value: "${processHistory.endTime}", ...bodyStyle };
  c["8,5"] = { value: "${processHistory.qualifiedQty}", ...bodyStyle };
  c["8,6"] = { value: "${processHistory.unqualifiedQty}", ...bodyStyle };
  c["8,7"] = { value: "{{/each}}", ...bodyStyle };

  c["9,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`9,${i}`] = { value: "", merged: true, mergeParent: "9,0" };

  c["10,0"] = { value: "备注：", bold: true, fontSize: 9, colSpan: 2, ...noBorder };
  c["10,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,2"] = { value: "${remark}", fontSize: 9, colSpan: 6, ...noBorder };
  for (let i = 3; i < 8; i++) c[`10,${i}`] = { value: "", merged: true, mergeParent: "10,2" };

  c["11,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`11,${i}`] = { value: "", merged: true, mergeParent: "11,0" };

  return data;
}

// ==================== 费用报销单 ====================
function createExpenseClaimTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(22, 8);
  data.colWidths = [100, 80, 200, 80, 60, 80, 80, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 6, 24, 24, 24, 24, 24, 6, 24, 24, 6, 24, 24, 24, 6, 24, 24, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...noBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#fce4ec", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  c["0,0"] = { value: "费 用 报 销 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 8, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 8; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "EXPENSE REIMBURSEMENT FORM", bold: false, fontSize: 9, textAlign: "center", colSpan: 8, ...noBorder, color: "#6b7280", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 8; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "报销部门：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,1"] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,2"] = { value: "${department}", ...infoStyle, colSpan: 2 };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,2" };
  c["3,4"] = { value: "报销人：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };
  c["3,6"] = { value: "${applicantName}", ...infoStyle, colSpan: 2 };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,6" };

  c["4,0"] = { value: "单据号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${reimbursementNo}", ...infoStyle, colSpan: 2 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "报销日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };
  c["4,6"] = { value: "${applyDate}", ...infoStyle, colSpan: 2 };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,6" };

  c["5,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`5,${i}`] = { value: "", merged: true, mergeParent: "5,0" };

  c["6,0"] = { value: "费用发生日期", ...headerStyle };
  c["6,1"] = { value: "费用类别", ...headerStyle };
  c["6,2"] = { value: "费用说明", ...headerStyle, colSpan: 3 };
  c["6,3"] = { value: "", merged: true, mergeParent: "6,2" };
  c["6,4"] = { value: "", merged: true, mergeParent: "6,2" };
  c["6,5"] = { value: "金额（元）", ...headerStyle };
  c["6,6"] = { value: "单据张数", ...headerStyle };
  c["6,7"] = { value: "备注", ...headerStyle };

  c["7,0"] = { value: "{{#each lines}}${lines.expenseDate}", ...bodyStyle };
  c["7,1"] = { value: "${lines.expenseType}", ...bodyStyle };
  c["7,2"] = { value: "${lines.remark}", ...bodyStyle, textAlign: "left", colSpan: 3 };
  c["7,3"] = { value: "", merged: true, mergeParent: "7,2" };
  c["7,4"] = { value: "", merged: true, mergeParent: "7,2" };
  c["7,5"] = { value: "${lines.amount}", ...bodyStyle };
  c["7,6"] = { value: "${lines.attachmentCount}", ...bodyStyle };
  c["7,7"] = { value: "{{/each}}", ...bodyStyle };

  // 合计行
  c["8,0"] = { value: "合计金额（小写）：", bold: true, ...solidBorder, fontSize: 9, textAlign: "right", colSpan: 5, bgColor: "#f5f5f5" };
  c["8,1"] = { value: "", merged: true, mergeParent: "8,0" };
  c["8,2"] = { value: "", merged: true, mergeParent: "8,0" };
  c["8,3"] = { value: "", merged: true, mergeParent: "8,0" };
  c["8,4"] = { value: "", merged: true, mergeParent: "8,0" };
  c["8,5"] = { value: "${totalAmount | currency}", bold: true, ...solidBorder, fontSize: 9 };
  c["8,6"] = { value: "${totalAttachmentCount}", bold: true, ...solidBorder, fontSize: 9 };
  c["8,7"] = { value: "", ...solidBorder, fontSize: 9 };

  c["9,0"] = { value: "合计金额（大写）：", bold: true, ...solidBorder, fontSize: 9, textAlign: "right", colSpan: 2, bgColor: "#f5f5f5" };
  c["9,1"] = { value: "", merged: true, mergeParent: "9,0" };
  c["9,2"] = { value: "${totalAmountInWords}", bold: true, ...solidBorder, fontSize: 9, colSpan: 6 };
  for (let i = 3; i < 8; i++) c[`9,${i}`] = { value: "", merged: true, mergeParent: "9,2" };

  c["10,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`10,${i}`] = { value: "", merged: true, mergeParent: "10,0" };

  // 审批区
  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };

  c["11,0"] = { value: "部门主管", ...sigHeaderStyle, colSpan: 2 };
  c["11,1"] = { value: "", merged: true, mergeParent: "11,0" };
  c["11,2"] = { value: "财务审核", ...sigHeaderStyle, colSpan: 2 };
  c["11,3"] = { value: "", merged: true, mergeParent: "11,2" };
  c["11,4"] = { value: "总经理", ...sigHeaderStyle, colSpan: 2 };
  c["11,5"] = { value: "", merged: true, mergeParent: "11,4" };
  c["11,6"] = { value: "出纳", ...sigHeaderStyle };
  c["11,7"] = { value: "领款人", ...sigHeaderStyle };

  c["12,0"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["12,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,0"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,2"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["12,3"] = { value: "", merged: true, mergeParent: "12,2" };
  c["13,2"] = { value: "", merged: true, mergeParent: "12,2" };
  c["13,3"] = { value: "", merged: true, mergeParent: "12,2" };
  c["12,4"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["12,5"] = { value: "", merged: true, mergeParent: "12,4" };
  c["13,4"] = { value: "", merged: true, mergeParent: "12,4" };
  c["13,5"] = { value: "", merged: true, mergeParent: "12,4" };
  c["12,6"] = { value: "", ...sigEmptyStyle, rowSpan: 2 };
  c["13,6"] = { value: "", merged: true, mergeParent: "12,6" };
  c["12,7"] = { value: "", ...sigEmptyStyle, rowSpan: 2 };
  c["13,7"] = { value: "", merged: true, mergeParent: "12,7" };

  c["14,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`14,${i}`] = { value: "", merged: true, mergeParent: "14,0" };

  return data;
}

// ==================== 请假申请单（内部，仅商标+版本号）====================
function createLeaveRequestTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(18, 6);
  data.colWidths = [100, 120, 80, 100, 120, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 24, 24, 6, 60, 6, 24, 24, 24, 6, 24, 24, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...solidBorder };
  const labelStyle = { bold: true, fontSize: 9, bgColor: "#f5f5f5", ...solidBorder };

  // 内部单据：只显示商标和版本号，不显示公司联系方式
  c["0,0"] = { value: "请 假 申 请 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 6, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 6; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "版本号：${company.version || 'V1.0'}  内部文件", bold: false, fontSize: 9, textAlign: "right", colSpan: 6, ...noBorder, color: "#6b7280", borderBottom: "1px solid #ccc" };
  for (let i = 1; i < 6; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "申请单号", ...labelStyle };
  c["3,1"] = { value: "${requestNo}", ...infoStyle, colSpan: 2 };
  c["3,2"] = { value: "", merged: true, mergeParent: "3,1" };
  c["3,3"] = { value: "申请日期", ...labelStyle };
  c["3,4"] = { value: "${applyDate}", ...infoStyle, colSpan: 2 };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };

  c["4,0"] = { value: "申请人", ...labelStyle };
  c["4,1"] = { value: "${applicantName}", ...infoStyle, colSpan: 2 };
  c["4,2"] = { value: "", merged: true, mergeParent: "4,1" };
  c["4,3"] = { value: "所在部门", ...labelStyle };
  c["4,4"] = { value: "${department}", ...infoStyle, colSpan: 2 };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };

  c["5,0"] = { value: "请假类型", ...labelStyle };
  c["5,1"] = { value: "${leaveType}", ...infoStyle, colSpan: 2 };
  c["5,2"] = { value: "", merged: true, mergeParent: "5,1" };
  c["5,3"] = { value: "请假天数", ...labelStyle };
  c["5,4"] = { value: "${days} 天", ...infoStyle, colSpan: 2 };
  c["5,5"] = { value: "", merged: true, mergeParent: "5,4" };

  c["6,0"] = { value: "开始时间", ...labelStyle };
  c["6,1"] = { value: "${startTime}", ...infoStyle, colSpan: 2 };
  c["6,2"] = { value: "", merged: true, mergeParent: "6,1" };
  c["6,3"] = { value: "结束时间", ...labelStyle };
  c["6,4"] = { value: "${endTime}", ...infoStyle, colSpan: 2 };
  c["6,5"] = { value: "", merged: true, mergeParent: "6,4" };

  c["7,0"] = { value: "代理人", ...labelStyle };
  c["7,1"] = { value: "${agentName}", ...infoStyle, colSpan: 2 };
  c["7,2"] = { value: "", merged: true, mergeParent: "7,1" };
  c["7,3"] = { value: "联系电话", ...labelStyle };
  c["7,4"] = { value: "${contactPhone}", ...infoStyle, colSpan: 2 };
  c["7,5"] = { value: "", merged: true, mergeParent: "7,4" };

  c["8,0"] = { value: "", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`8,${i}`] = { value: "", merged: true, mergeParent: "8,0" };

  c["9,0"] = { value: "请假事由", ...labelStyle };
  c["9,1"] = { value: "${reason}", ...infoStyle, colSpan: 5, verticalAlign: "top" };
  for (let i = 2; i < 6; i++) c[`9,${i}`] = { value: "", merged: true, mergeParent: "9,1" };

  c["10,0"] = { value: "", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`10,${i}`] = { value: "", merged: true, mergeParent: "10,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["11,0"] = { value: "申请人", ...sigHeaderStyle, colSpan: 2 };
  c["11,1"] = { value: "", merged: true, mergeParent: "11,0" };
  c["11,2"] = { value: "部门主管", ...sigHeaderStyle, colSpan: 2 };
  c["11,3"] = { value: "", merged: true, mergeParent: "11,2" };
  c["11,4"] = { value: "人事部", ...sigHeaderStyle };
  c["11,5"] = { value: "总经理", ...sigHeaderStyle };

  c["12,0"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["12,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,0"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,2"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["12,3"] = { value: "", merged: true, mergeParent: "12,2" };
  c["13,2"] = { value: "", merged: true, mergeParent: "12,2" };
  c["13,3"] = { value: "", merged: true, mergeParent: "12,2" };
  c["12,4"] = { value: "", ...sigEmptyStyle, rowSpan: 2 };
  c["13,4"] = { value: "", merged: true, mergeParent: "12,4" };
  c["12,5"] = { value: "", ...sigEmptyStyle, rowSpan: 2 };
  c["13,5"] = { value: "", merged: true, mergeParent: "12,5" };

  c["14,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`14,${i}`] = { value: "", merged: true, mergeParent: "14,0" };

  return data;
}

// ==================== 加班申请单（内部）====================
function createOvertimeRequestTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(16, 6);
  data.colWidths = [100, 120, 80, 100, 120, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 24, 24, 6, 60, 6, 24, 24, 24, 6, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...solidBorder };
  const labelStyle = { bold: true, fontSize: 9, bgColor: "#f5f5f5", ...solidBorder };

  c["0,0"] = { value: "加 班 申 请 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 6, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 6; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "版本号：${company.version || 'V1.0'}  内部文件", bold: false, fontSize: 9, textAlign: "right", colSpan: 6, ...noBorder, color: "#6b7280", borderBottom: "1px solid #ccc" };
  for (let i = 1; i < 6; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "申请单号", ...labelStyle };
  c["3,1"] = { value: "${requestNo}", ...infoStyle, colSpan: 2 };
  c["3,2"] = { value: "", merged: true, mergeParent: "3,1" };
  c["3,3"] = { value: "申请日期", ...labelStyle };
  c["3,4"] = { value: "${applyDate}", ...infoStyle, colSpan: 2 };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };

  c["4,0"] = { value: "申请人", ...labelStyle };
  c["4,1"] = { value: "${applicantName}", ...infoStyle, colSpan: 2 };
  c["4,2"] = { value: "", merged: true, mergeParent: "4,1" };
  c["4,3"] = { value: "所在部门", ...labelStyle };
  c["4,4"] = { value: "${department}", ...infoStyle, colSpan: 2 };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };

  c["5,0"] = { value: "加班类型", ...labelStyle };
  c["5,1"] = { value: "${overtimeType}", ...infoStyle, colSpan: 2 };
  c["5,2"] = { value: "", merged: true, mergeParent: "5,1" };
  c["5,3"] = { value: "加班时长", ...labelStyle };
  c["5,4"] = { value: "${hours} 小时", ...infoStyle, colSpan: 2 };
  c["5,5"] = { value: "", merged: true, mergeParent: "5,4" };

  c["6,0"] = { value: "加班日期", ...labelStyle };
  c["6,1"] = { value: "${overtimeDate}", ...infoStyle, colSpan: 2 };
  c["6,2"] = { value: "", merged: true, mergeParent: "6,1" };
  c["6,3"] = { value: "加班时间", ...labelStyle };
  c["6,4"] = { value: "${startTime} - ${endTime}", ...infoStyle, colSpan: 2 };
  c["6,5"] = { value: "", merged: true, mergeParent: "6,4" };

  c["7,0"] = { value: "加班人员", ...labelStyle };
  c["7,1"] = { value: "${participants}", ...infoStyle, colSpan: 5 };
  for (let i = 2; i < 6; i++) c[`7,${i}`] = { value: "", merged: true, mergeParent: "7,1" };

  c["8,0"] = { value: "", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`8,${i}`] = { value: "", merged: true, mergeParent: "8,0" };

  c["9,0"] = { value: "加班事由", ...labelStyle };
  c["9,1"] = { value: "${reason}", ...infoStyle, colSpan: 5, verticalAlign: "top" };
  for (let i = 2; i < 6; i++) c[`9,${i}`] = { value: "", merged: true, mergeParent: "9,1" };

  c["10,0"] = { value: "", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`10,${i}`] = { value: "", merged: true, mergeParent: "10,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["11,0"] = { value: "申请人", ...sigHeaderStyle, colSpan: 2 };
  c["11,1"] = { value: "", merged: true, mergeParent: "11,0" };
  c["11,2"] = { value: "部门主管", ...sigHeaderStyle, colSpan: 2 };
  c["11,3"] = { value: "", merged: true, mergeParent: "11,2" };
  c["11,4"] = { value: "人事部", ...sigHeaderStyle };
  c["11,5"] = { value: "总经理", ...sigHeaderStyle };

  c["12,0"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["12,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,0"] = { value: "", merged: true, mergeParent: "12,0" };
  c["13,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,2"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["12,3"] = { value: "", merged: true, mergeParent: "12,2" };
  c["13,2"] = { value: "", merged: true, mergeParent: "12,2" };
  c["13,3"] = { value: "", merged: true, mergeParent: "12,2" };
  c["12,4"] = { value: "", ...sigEmptyStyle, rowSpan: 2 };
  c["13,4"] = { value: "", merged: true, mergeParent: "12,4" };
  c["12,5"] = { value: "", ...sigEmptyStyle, rowSpan: 2 };
  c["13,5"] = { value: "", merged: true, mergeParent: "12,5" };

  c["14,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`14,${i}`] = { value: "", merged: true, mergeParent: "14,0" };

  return data;
}

// ==================== 外出申请单（内部）====================
function createOutingRequestTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(16, 6);
  data.colWidths = [100, 120, 80, 100, 120, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 24, 6, 60, 6, 24, 24, 24, 6, 24, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...solidBorder };
  const labelStyle = { bold: true, fontSize: 9, bgColor: "#f5f5f5", ...solidBorder };

  c["0,0"] = { value: "公 出 申 请 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 6, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 6; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "版本号：${company.version || 'V1.0'}  内部文件", bold: false, fontSize: 9, textAlign: "right", colSpan: 6, ...noBorder, color: "#6b7280", borderBottom: "1px solid #ccc" };
  for (let i = 1; i < 6; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "申请单号", ...labelStyle };
  c["3,1"] = { value: "${requestNo}", ...infoStyle, colSpan: 2 };
  c["3,2"] = { value: "", merged: true, mergeParent: "3,1" };
  c["3,3"] = { value: "申请日期", ...labelStyle };
  c["3,4"] = { value: "${applyDate}", ...infoStyle, colSpan: 2 };
  c["3,5"] = { value: "", merged: true, mergeParent: "3,4" };

  c["4,0"] = { value: "申请人", ...labelStyle };
  c["4,1"] = { value: "${applicantName}", ...infoStyle, colSpan: 2 };
  c["4,2"] = { value: "", merged: true, mergeParent: "4,1" };
  c["4,3"] = { value: "所在部门", ...labelStyle };
  c["4,4"] = { value: "${department}", ...infoStyle, colSpan: 2 };
  c["4,5"] = { value: "", merged: true, mergeParent: "4,4" };

  c["5,0"] = { value: "外出地点", ...labelStyle };
  c["5,1"] = { value: "${destination}", ...infoStyle, colSpan: 5 };
  for (let i = 2; i < 6; i++) c[`5,${i}`] = { value: "", merged: true, mergeParent: "5,1" };

  c["6,0"] = { value: "开始时间", ...labelStyle };
  c["6,1"] = { value: "${startTime}", ...infoStyle, colSpan: 2 };
  c["6,2"] = { value: "", merged: true, mergeParent: "6,1" };
  c["6,3"] = { value: "结束时间", ...labelStyle };
  c["6,4"] = { value: "${endTime}", ...infoStyle, colSpan: 2 };
  c["6,5"] = { value: "", merged: true, mergeParent: "6,4" };

  c["7,0"] = { value: "", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`7,${i}`] = { value: "", merged: true, mergeParent: "7,0" };

  c["8,0"] = { value: "外出事由", ...labelStyle };
  c["8,1"] = { value: "${reason}", ...infoStyle, colSpan: 5, verticalAlign: "top" };
  for (let i = 2; i < 6; i++) c[`8,${i}`] = { value: "", merged: true, mergeParent: "8,1" };

  c["9,0"] = { value: "", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`9,${i}`] = { value: "", merged: true, mergeParent: "9,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["10,0"] = { value: "申请人", ...sigHeaderStyle, colSpan: 2 };
  c["10,1"] = { value: "", merged: true, mergeParent: "10,0" };
  c["10,2"] = { value: "部门主管", ...sigHeaderStyle, colSpan: 2 };
  c["10,3"] = { value: "", merged: true, mergeParent: "10,2" };
  c["10,4"] = { value: "行政部", ...sigHeaderStyle };
  c["10,5"] = { value: "总经理", ...sigHeaderStyle };

  c["11,0"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["11,1"] = { value: "", merged: true, mergeParent: "11,0" };
  c["12,0"] = { value: "", merged: true, mergeParent: "11,0" };
  c["12,1"] = { value: "", merged: true, mergeParent: "11,0" };
  c["11,2"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["11,3"] = { value: "", merged: true, mergeParent: "11,2" };
  c["12,2"] = { value: "", merged: true, mergeParent: "11,2" };
  c["12,3"] = { value: "", merged: true, mergeParent: "11,2" };
  c["11,4"] = { value: "", ...sigEmptyStyle, rowSpan: 2 };
  c["12,4"] = { value: "", merged: true, mergeParent: "11,4" };
  c["11,5"] = { value: "", ...sigEmptyStyle, rowSpan: 2 };
  c["12,5"] = { value: "", merged: true, mergeParent: "11,5" };

  c["13,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 6, ...noBorder };
  for (let i = 1; i < 6; i++) c[`13,${i}`] = { value: "", merged: true, mergeParent: "13,0" };

  return data;
}

// ==================== 委外灭菌单（内部）====================
function createSterilizationOutsourceTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(20, 8);
  data.colWidths = [100, 120, 80, 100, 120, 80, 80, 80];
  data.rowHeights = [32, 28, 6, 24, 24, 24, 24, 24, 6, 24, 24, 24, 24, 24, 6, 24, 24, 24, 6, 24];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...solidBorder };
  const labelStyle = { bold: true, fontSize: 9, bgColor: "#f5f5f5", ...solidBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#e0f7fa", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  c["0,0"] = { value: "委 外 灭 菌 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 8, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 8; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };
  c["1,0"] = { value: "版本号：${company.version || 'V1.0'}  内部文件", bold: false, fontSize: 9, textAlign: "right", colSpan: 8, ...noBorder, color: "#6b7280", borderBottom: "1px solid #ccc" };
  for (let i = 1; i < 8; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  c["3,0"] = { value: "单据编号", ...labelStyle };
  c["3,1"] = { value: "${orderNo}", ...infoStyle, colSpan: 3 };
  c["3,2"] = { value: "", merged: true, mergeParent: "3,1" };
  c["3,3"] = { value: "", merged: true, mergeParent: "3,1" };
  c["3,4"] = { value: "灭菌方式", ...labelStyle };
  c["3,5"] = { value: "${sterilizationMethod}", ...infoStyle, colSpan: 3 };
  c["3,6"] = { value: "", merged: true, mergeParent: "3,5" };
  c["3,7"] = { value: "", merged: true, mergeParent: "3,5" };

  c["4,0"] = { value: "供应商", ...labelStyle };
  c["4,1"] = { value: "${supplierName}", ...infoStyle, colSpan: 3 };
  c["4,2"] = { value: "", merged: true, mergeParent: "4,1" };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,1" };
  c["4,4"] = { value: "灭菌批号", ...labelStyle };
  c["4,5"] = { value: "${sterilizationBatchNo}", ...infoStyle, colSpan: 3 };
  c["4,6"] = { value: "", merged: true, mergeParent: "4,5" };
  c["4,7"] = { value: "", merged: true, mergeParent: "4,5" };

  c["5,0"] = { value: "发出日期", ...labelStyle };
  c["5,1"] = { value: "${sendDate}", ...infoStyle, colSpan: 3 };
  c["5,2"] = { value: "", merged: true, mergeParent: "5,1" };
  c["5,3"] = { value: "", merged: true, mergeParent: "5,1" };
  c["5,4"] = { value: "预计返回日期", ...labelStyle };
  c["5,5"] = { value: "${expectedReturnDate}", ...infoStyle, colSpan: 3 };
  c["5,6"] = { value: "", merged: true, mergeParent: "5,5" };
  c["5,7"] = { value: "", merged: true, mergeParent: "5,5" };

  c["6,0"] = { value: "实际返回日期", ...labelStyle };
  c["6,1"] = { value: "${actualReturnDate}", ...infoStyle, colSpan: 3 };
  c["6,2"] = { value: "", merged: true, mergeParent: "6,1" };
  c["6,3"] = { value: "", merged: true, mergeParent: "6,1" };
  c["6,4"] = { value: "关联流转卡", ...labelStyle };
  c["6,5"] = { value: "${routingCardNo}", ...infoStyle, colSpan: 3 };
  c["6,6"] = { value: "", merged: true, mergeParent: "6,5" };
  c["6,7"] = { value: "", merged: true, mergeParent: "6,5" };

  c["7,0"] = { value: "产品名称", ...labelStyle };
  c["7,1"] = { value: "${productName}", ...infoStyle, colSpan: 3 };
  c["7,2"] = { value: "", merged: true, mergeParent: "7,1" };
  c["7,3"] = { value: "", merged: true, mergeParent: "7,1" };
  c["7,4"] = { value: "产品批号", ...labelStyle };
  c["7,5"] = { value: "${batchNo}", ...infoStyle, colSpan: 3 };
  c["7,6"] = { value: "", merged: true, mergeParent: "7,5" };
  c["7,7"] = { value: "", merged: true, mergeParent: "7,5" };

  c["8,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`8,${i}`] = { value: "", merged: true, mergeParent: "8,0" };

  c["9,0"] = { value: "序号", ...headerStyle };
  c["9,1"] = { value: "物料/产品名称", ...headerStyle, colSpan: 2 };
  c["9,2"] = { value: "", merged: true, mergeParent: "9,1" };
  c["9,3"] = { value: "规格型号", ...headerStyle };
  c["9,4"] = { value: "批号", ...headerStyle };
  c["9,5"] = { value: "数量", ...headerStyle };
  c["9,6"] = { value: "单位", ...headerStyle };
  c["9,7"] = { value: "备注", ...headerStyle };

  c["10,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["10,1"] = { value: "${items.materialName}", ...bodyStyle, textAlign: "left", colSpan: 2 };
  c["10,2"] = { value: "", merged: true, mergeParent: "10,1" };
  c["10,3"] = { value: "${items.specification}", ...bodyStyle };
  c["10,4"] = { value: "${items.batchNo}", ...bodyStyle };
  c["10,5"] = { value: "${items.quantity}", ...bodyStyle };
  c["10,6"] = { value: "${items.unit}", ...bodyStyle };
  c["10,7"] = { value: "{{/each}}", ...bodyStyle };

  c["11,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`11,${i}`] = { value: "", merged: true, mergeParent: "11,0" };

  c["12,0"] = { value: "备注：", bold: true, fontSize: 9, colSpan: 2, ...noBorder };
  c["12,1"] = { value: "", merged: true, mergeParent: "12,0" };
  c["12,2"] = { value: "${remark}", fontSize: 9, colSpan: 6, ...noBorder };
  for (let i = 3; i < 8; i++) c[`12,${i}`] = { value: "", merged: true, mergeParent: "12,2" };

  c["13,0"] = { value: "", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`13,${i}`] = { value: "", merged: true, mergeParent: "13,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["14,0"] = { value: "制单人", ...sigHeaderStyle, colSpan: 3 };
  c["14,1"] = { value: "", merged: true, mergeParent: "14,0" };
  c["14,2"] = { value: "", merged: true, mergeParent: "14,0" };
  c["14,3"] = { value: "QA确认", ...sigHeaderStyle, colSpan: 2 };
  c["14,4"] = { value: "", merged: true, mergeParent: "14,3" };
  c["14,5"] = { value: "供应商确认", ...sigHeaderStyle, colSpan: 3 };
  c["14,6"] = { value: "", merged: true, mergeParent: "14,5" };
  c["14,7"] = { value: "", merged: true, mergeParent: "14,5" };

  c["15,0"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 2 };
  c["15,1"] = { value: "", merged: true, mergeParent: "15,0" };
  c["15,2"] = { value: "", merged: true, mergeParent: "15,0" };
  c["16,0"] = { value: "", merged: true, mergeParent: "15,0" };
  c["16,1"] = { value: "", merged: true, mergeParent: "15,0" };
  c["16,2"] = { value: "", merged: true, mergeParent: "15,0" };
  c["15,3"] = { value: "", ...sigEmptyStyle, colSpan: 2, rowSpan: 2 };
  c["15,4"] = { value: "", merged: true, mergeParent: "15,3" };
  c["16,3"] = { value: "", merged: true, mergeParent: "15,3" };
  c["16,4"] = { value: "", merged: true, mergeParent: "15,3" };
  c["15,5"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 2 };
  c["15,6"] = { value: "", merged: true, mergeParent: "15,5" };
  c["15,7"] = { value: "", merged: true, mergeParent: "15,5" };
  c["16,5"] = { value: "", merged: true, mergeParent: "15,5" };
  c["16,6"] = { value: "", merged: true, mergeParent: "15,5" };
  c["16,7"] = { value: "", merged: true, mergeParent: "15,5" };

  c["17,0"] = { value: "打印时间：${printTime}", fontSize: 8, color: "#999", colSpan: 8, ...noBorder };
  for (let i = 1; i < 8; i++) c[`17,${i}`] = { value: "", merged: true, mergeParent: "17,0" };

  return data;
}

// ==================== 报关单（横版，对外，带抬头和联系方式）====================
function createCustomsDeclarationTemplate(): SpreadsheetData {
  const data = createEmptySpreadsheet(28, 10);
  data.orientation = "landscape";
  data.paperSize = "A4";
  data.marginTop = 10;
  data.marginRight = 8;
  data.marginBottom = 10;
  data.marginLeft = 8;
  data.colWidths = [50, 100, 80, 80, 80, 80, 80, 80, 80
, 80, 80];
  data.rowHeights = [40, 32, 8, 28, 28, 28, 28, 8, 28, 28, 28, 28, 28, 8, 28, 28, 8, 28, 28, 28, 8, 28, 28, 28, 8, 28, 28, 28];

  const c = data.cells;
  const noBorder = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none" };
  const solidBorder = { borderTop: "1px solid #000", borderRight: "1px solid #000", borderBottom: "1px solid #000", borderLeft: "1px solid #000" };
  const infoStyle = { fontSize: 9, ...noBorder };
  const headerStyle = { bold: true, fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, bgColor: "#e3f2fd", ...solidBorder };
  const bodyStyle = { fontSize: 9, textAlign: "center" as const, verticalAlign: "middle" as const, ...solidBorder };

  // 抬头：公司名称 + 联系方式（对外文件）
  c["0,0"] = { value: "${company.name}", bold: true, fontSize: 18, textAlign: "center", verticalAlign: "middle", colSpan: 10, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 10; i++) c[`0,${i}`] = { value: "", merged: true, mergeParent: "0,0" };

  c["1,0"] = { value: "地址：${company.address}  |  电话：${company.phone}  |  邮箱：${company.email}", fontSize: 9, textAlign: "center", colSpan: 10, ...noBorder, color: "#374151", borderBottom: "2px solid #1a56db" };
  for (let i = 1; i < 10; i++) c[`1,${i}`] = { value: "", merged: true, mergeParent: "1,0" };

  c["2,0"] = { value: "", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`2,${i}`] = { value: "", merged: true, mergeParent: "2,0" };

  // 报关单标题
  c["3,0"] = { value: "出 口 报 关 单", bold: true, fontSize: 16, textAlign: "center", verticalAlign: "middle", colSpan: 6, ...noBorder, color: "#1a56db" };
  for (let i = 1; i < 6; i++) c[`3,${i}`] = { value: "", merged: true, mergeParent: "3,0" };
  c["3,6"] = { value: "CUSTOMS DECLARATION", bold: true, fontSize: 12, textAlign: "center", verticalAlign: "middle", colSpan: 4, ...noBorder, color: "#6b7280" };
  for (let i = 7; i < 10; i++) c[`3,${i}`] = { value: "", merged: true, mergeParent: "3,6" };

  // 基本信息区（左右两栏）
  c["4,0"] = { value: "报关单号：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,1"] = { value: "", merged: true, mergeParent: "4,0" };
  c["4,2"] = { value: "${declarationNo}", ...infoStyle, colSpan: 3 };
  c["4,3"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,4"] = { value: "", merged: true, mergeParent: "4,2" };
  c["4,5"] = { value: "报关日期：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["4,6"] = { value: "", merged: true, mergeParent: "4,5" };
  c["4,7"] = { value: "${declarationDate}", ...infoStyle, colSpan: 3 };
  c["4,8"] = { value: "", merged: true, mergeParent: "4,7" };
  c["4,9"] = { value: "", merged: true, mergeParent: "4,7" };

  c["5,0"] = { value: "出口商：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,1"] = { value: "", merged: true, mergeParent: "5,0" };
  c["5,2"] = { value: "${exporterName}", ...infoStyle, colSpan: 3 };
  c["5,3"] = { value: "", merged: true, mergeParent: "5,2" };
  c["5,4"] = { value: "", merged: true, mergeParent: "5,2" };
  c["5,5"] = { value: "进口商：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["5,6"] = { value: "", merged: true, mergeParent: "5,5" };
  c["5,7"] = { value: "${importerName}", ...infoStyle, colSpan: 3 };
  c["5,8"] = { value: "", merged: true, mergeParent: "5,7" };
  c["5,9"] = { value: "", merged: true, mergeParent: "5,7" };

  c["6,0"] = { value: "贸易方式：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["6,1"] = { value: "", merged: true, mergeParent: "6,0" };
  c["6,2"] = { value: "${tradeMode}", ...infoStyle, colSpan: 3 };
  c["6,3"] = { value: "", merged: true, mergeParent: "6,2" };
  c["6,4"] = { value: "", merged: true, mergeParent: "6,2" };
  c["6,5"] = { value: "运输方式：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["6,6"] = { value: "", merged: true, mergeParent: "6,5" };
  c["6,7"] = { value: "${transportMode}", ...infoStyle, colSpan: 3 };
  c["6,8"] = { value: "", merged: true, mergeParent: "6,7" };
  c["6,9"] = { value: "", merged: true, mergeParent: "6,7" };

  c["7,0"] = { value: "起运港：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["7,1"] = { value: "", merged: true, mergeParent: "7,0" };
  c["7,2"] = { value: "${departurePort}", ...infoStyle, colSpan: 3 };
  c["7,3"] = { value: "", merged: true, mergeParent: "7,2" };
  c["7,4"] = { value: "", merged: true, mergeParent: "7,2" };
  c["7,5"] = { value: "目的港：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["7,6"] = { value: "", merged: true, mergeParent: "7,5" };
  c["7,7"] = { value: "${destinationPort}", ...infoStyle, colSpan: 3 };
  c["7,8"] = { value: "", merged: true, mergeParent: "7,7" };
  c["7,9"] = { value: "", merged: true, mergeParent: "7,7" };

  c["8,0"] = { value: "", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`8,${i}`] = { value: "", merged: true, mergeParent: "8,0" };

  // 货物明细表头
  c["9,0"] = { value: "序号", ...headerStyle };
  c["9,1"] = { value: "商品名称（中文）", ...headerStyle, colSpan: 2 };
  c["9,2"] = { value: "", merged: true, mergeParent: "9,1" };
  c["9,3"] = { value: "商品编码", ...headerStyle };
  c["9,4"] = { value: "规格型号", ...headerStyle };
  c["9,5"] = { value: "数量", ...headerStyle };
  c["9,6"] = { value: "单位", ...headerStyle };
  c["9,7"] = { value: "单价(USD)", ...headerStyle };
  c["9,8"] = { value: "总价(USD)", ...headerStyle };
  c["9,9"] = { value: "原产地", ...headerStyle };

  c["10,0"] = { value: "{{#each items}}{{@number}}", ...bodyStyle };
  c["10,1"] = { value: "${items.productName}", ...bodyStyle, textAlign: "left", colSpan: 2 };
  c["10,2"] = { value: "", merged: true, mergeParent: "10,1" };
  c["10,3"] = { value: "${items.hsCode}", ...bodyStyle };
  c["10,4"] = { value: "${items.specification}", ...bodyStyle };
  c["10,5"] = { value: "${items.quantity}", ...bodyStyle };
  c["10,6"] = { value: "${items.unit}", ...bodyStyle };
  c["10,7"] = { value: "${items.unitPrice}", ...bodyStyle };
  c["10,8"] = { value: "${items.totalPrice}", ...bodyStyle };
  c["10,9"] = { value: "{{/each}}", ...bodyStyle };

  // 合计行
  c["11,0"] = { value: "合计", bold: true, ...solidBorder, fontSize: 9, textAlign: "center", bgColor: "#f5f5f5", colSpan: 5 };
  for (let i = 1; i < 5; i++) c[`11,${i}`] = { value: "", merged: true, mergeParent: "11,0" };
  c["11,5"] = { value: "${totalQuantity}", bold: true, ...solidBorder, fontSize: 9 };
  c["11,6"] = { value: "", ...solidBorder, fontSize: 9 };
  c["11,7"] = { value: "", ...solidBorder, fontSize: 9 };
  c["11,8"] = { value: "${totalAmount | currency}", bold: true, ...solidBorder, fontSize: 9 };
  c["11,9"] = { value: "", ...solidBorder, fontSize: 9 };

  c["12,0"] = { value: "", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`12,${i}`] = { value: "", merged: true, mergeParent: "12,0" };

  // 包装信息
  c["13,0"] = { value: "包装方式：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["13,1"] = { value: "", merged: true, mergeParent: "13,0" };
  c["13,2"] = { value: "${packagingType}", ...infoStyle, colSpan: 2 };
  c["13,3"] = { value: "", merged: true, mergeParent: "13,2" };
  c["13,4"] = { value: "件数：", bold: true, ...infoStyle, textAlign: "right" };
  c["13,5"] = { value: "${packageCount}", ...infoStyle };
  c["13,6"] = { value: "毛重(KG)：", bold: true, ...infoStyle, textAlign: "right" };
  c["13,7"] = { value: "${grossWeight}", ...infoStyle };
  c["13,8"] = { value: "净重(KG)：", bold: true, ...infoStyle, textAlign: "right" };
  c["13,9"] = { value: "${netWeight}", ...infoStyle };

  c["14,0"] = { value: "随附单据：", bold: true, ...infoStyle, colSpan: 2, textAlign: "right" };
  c["14,1"] = { value: "", merged: true, mergeParent: "14,0" };
  c["14,2"] = { value: "${attachedDocuments}", ...infoStyle, colSpan: 8 };
  for (let i = 3; i < 10; i++) c[`14,${i}`] = { value: "", merged: true, mergeParent: "14,2" };

  c["15,0"] = { value: "", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`15,${i}`] = { value: "", merged: true, mergeParent: "15,0" };

  // 声明与签名
  c["16,0"] = { value: "申报人声明：本人保证以上所报内容真实、准确，如有不实，愿承担相应法律责任。", fontSize: 9, colSpan: 10, ...noBorder, color: "#374151" };
  for (let i = 1; i < 10; i++) c[`16,${i}`] = { value: "", merged: true, mergeParent: "16,0" };

  c["17,0"] = { value: "", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`17,${i}`] = { value: "", merged: true, mergeParent: "17,0" };

  const sigHeaderStyle = { bold: true, fontSize: 9, textAlign: "center" as const, bgColor: "#f0f0f0", ...solidBorder };
  const sigEmptyStyle = { fontSize: 9, textAlign: "center" as const, ...solidBorder };
  c["18,0"] = { value: "报关员", ...sigHeaderStyle, colSpan: 3 };
  c["18,1"] = { value: "", merged: true, mergeParent: "18,0" };
  c["18,2"] = { value: "", merged: true, mergeParent: "18,0" };
  c["18,3"] = { value: "审核人", ...sigHeaderStyle, colSpan: 4 };
  c["18,4"] = { value: "", merged: true, mergeParent: "18,3" };
  c["18,5"] = { value: "", merged: true, mergeParent: "18,3" };
  c["18,6"] = { value: "", merged: true, mergeParent: "18,3" };
  c["18,7"] = { value: "海关专用章", ...sigHeaderStyle, colSpan: 3 };
  c["18,8"] = { value: "", merged: true, mergeParent: "18,7" };
  c["18,9"] = { value: "", merged: true, mergeParent: "18,7" };

  c["19,0"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 3 };
  c["19,1"] = { value: "", merged: true, mergeParent: "19,0" };
  c["19,2"] = { value: "", merged: true, mergeParent: "19,0" };
  c["20,0"] = { value: "", merged: true, mergeParent: "19,0" };
  c["20,1"] = { value: "", merged: true, mergeParent: "19,0" };
  c["20,2"] = { value: "", merged: true, mergeParent: "19,0" };
  c["21,0"] = { value: "", merged: true, mergeParent: "19,0" };
  c["21,1"] = { value: "", merged: true, mergeParent: "19,0" };
  c["21,2"] = { value: "", merged: true, mergeParent: "19,0" };
  c["19,3"] = { value: "", ...sigEmptyStyle, colSpan: 4, rowSpan: 3 };
  c["19,4"] = { value: "", merged: true, mergeParent: "19,3" };
  c["19,5"] = { value: "", merged: true, mergeParent: "19,3" };
  c["19,6"] = { value: "", merged: true, mergeParent: "19,3" };
  c["20,3"] = { value: "", merged: true, mergeParent: "19,3" };
  c["20,4"] = { value: "", merged: true, mergeParent: "19,3" };
  c["20,5"] = { value: "", merged: true, mergeParent: "19,3" };
  c["20,6"] = { value: "", merged: true, mergeParent: "19,3" };
  c["21,3"] = { value: "", merged: true, mergeParent: "19,3" };
  c["21,4"] = { value: "", merged: true, mergeParent: "19,3" };
  c["21,5"] = { value: "", merged: true, mergeParent: "19,3" };
  c["21,6"] = { value: "", merged: true, mergeParent: "19,3" };
  c["19,7"] = { value: "", ...sigEmptyStyle, colSpan: 3, rowSpan: 3 };
  c["19,8"] = { value: "", merged: true, mergeParent: "19,7" };
  c["19,9"] = { value: "", merged: true, mergeParent: "19,7" };
  c["20,7"] = { value: "", merged: true, mergeParent: "19,7" };
  c["20,8"] = { value: "", merged: true, mergeParent: "19,7" };
  c["20,9"] = { value: "", merged: true, mergeParent: "19,7" };
  c["21,7"] = { value: "", merged: true, mergeParent: "19,7" };
  c["21,8"] = { value: "", merged: true, mergeParent: "19,7" };
  c["21,9"] = { value: "", merged: true, mergeParent: "19,7" };

  c["22,0"] = { value: "打印时间：${printTime}  |  ${company.name}  |  ${company.phone}", fontSize: 8, color: "#999", colSpan: 10, ...noBorder };
  for (let i = 1; i < 10; i++) c[`22,${i}`] = { value: "", merged: true, mergeParent: "22,0" };

  return data;
}

// 获取默认模板数据
export function getDefaultSpreadsheetData(templateKey: string): SpreadsheetData {
  switch (templateKey) {
    case "sales_order": return createSalesOrderTemplate();
    case "purchase_order": return createPurchaseOrderTemplate();
    case "production_order": return createProductionOrderTemplate();
    case "material_requisition": return createMaterialRequisitionTemplate();
    case "warehouse_in": return createWarehouseInTemplate();
    case "warehouse_out": return createWarehouseOutTemplate();
    case "inventory_check": return createInventoryCheckTemplate();
    case "ipqc_inspection": return createIpqcInspectionTemplate();
    case "oqc_inspection": return createOqcInspectionTemplate();
    case "production_flow_card": return createProductionFlowCardTemplate();
    case "expense_claim": return createExpenseClaimTemplate();
    case "leave_request": return createLeaveRequestTemplate();
    case "overtime_request": return createOvertimeRequestTemplate();
    case "outing_request": return createOutingRequestTemplate();
    case "sterilization_outsource": return createSterilizationOutsourceTemplate();
    case "customs_declaration": return createCustomsDeclarationTemplate();
    default: return createSalesOrderTemplate();
  }
}

// ==================== 将变量定义转为字段分组 ====================

function variablesToFieldGroups(templateKey: string): FieldGroup[] {
  const def = getTemplateDefinition(templateKey);
  if (!def) return [];

  const companyFields: FieldGroup = {
    name: "公司信息",
    fields: def.variables
      .filter(v => v.key.startsWith("company.") || v.key === "printTime" || v.key === "printDate")
      .map(v => ({ key: v.key, label: v.label, type: v.type })),
  };

  const businessFields: FieldGroup = {
    name: "业务数据",
    fields: def.variables
      .filter(v => !v.key.startsWith("company.") && v.key !== "printTime" && v.key !== "printDate")
      .map(v => ({
        key: v.key,
        label: v.label,
        type: v.type,
        children: v.children?.map(c => ({ key: c.key, label: c.label, type: c.type })),
      })),
  };

  return [businessFields, companyFields];
}

// ==================== 主页面组件 ====================

export default function PrintTemplatesPage() {
  // 编辑模式
  const [editorMode, setEditorMode] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData>(createEmptySpreadsheet());
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 后端数据
  const { data: savedTemplates, refetch } = trpc.printTemplates.list.useQuery();
  const upsertMutation = trpc.printTemplates.upsert.useMutation({
    onSuccess: () => { refetch(); toast.success("模板已保存到服务器"); },
    onError: (err: any) => toast.error(`保存失败：${err.message}`),
  });
  const deleteMutation = trpc.printTemplates.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("已恢复默认模板"); },
    onError: (err: any) => toast.error(`重置失败：${err.message}`),
  });
  const { data: companyInfo } = trpc.companyInfo.get.useQuery();

  // 获取模板内容
  const getTemplateContent = useCallback((templateKey: string) => {
    const saved = savedTemplates?.find((t: any) => t.templateKey === templateKey);
    const def = getTemplateDefinition(templateKey);
    if (saved?.htmlContent) {
      try {
        // 尝试解析为 SpreadsheetData（JSON 格式存储）
        const parsed = JSON.parse(saved.htmlContent);
        if (parsed.cells && parsed.rowCount) {
          return { spreadsheetData: parsed as SpreadsheetData, isCustomized: true };
        }
      } catch {
        // 不是 JSON，可能是旧的 HTML 格式
      }
    }
    return {
      spreadsheetData: getDefaultSpreadsheetData(templateKey),
      isCustomized: !!saved,
    };
  }, [savedTemplates]);

  // 打开编辑器
  const handleEdit = useCallback((templateKey: string) => {
    const content = getTemplateContent(templateKey);
    setSelectedKey(templateKey);
    setSpreadsheetData(content.spreadsheetData);
    setEditorMode(true);
    setShowPreview(false);
  }, [getTemplateContent]);

  // 生成预览 HTML
  const generatePreviewHtml = useCallback(() => {
    if (!selectedKey) return "";
    const def = getTemplateDefinition(selectedKey);
    if (!def) return "";
    const exampleData = generateExampleContext(def);
    const ctx = createPrintContext(companyInfo || {}, exampleData);
    const htmlContent = spreadsheetToRenderableHtml(spreadsheetData);
    return buildPrintDocument({
      htmlContent,
      cssContent: "",
      context: ctx,
      paperSize: spreadsheetData.paperSize,
      orientation: spreadsheetData.orientation,
      marginTop: spreadsheetData.marginTop,
      marginRight: spreadsheetData.marginRight,
      marginBottom: spreadsheetData.marginBottom,
      marginLeft: spreadsheetData.marginLeft,
    });
  }, [selectedKey, spreadsheetData, companyInfo]);

  // 预览
  const handlePreview = useCallback(() => {
    setShowPreview(true);
    setTimeout(() => {
      if (previewRef.current) {
        const doc = previewRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(generatePreviewHtml());
          doc.close();
        }
      }
    }, 100);
  }, [generatePreviewHtml]);

  // 打印
  const handlePrint = useCallback(() => {
    const html = generatePreviewHtml();
    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    }
  }, [generatePreviewHtml]);

  // 保存
  const handleSave = useCallback(() => {
    if (!selectedKey) return;
    const def = getTemplateDefinition(selectedKey);
    if (!def) return;
    // 将 SpreadsheetData 序列化为 JSON 存储到 htmlContent 字段
    upsertMutation.mutate({
      templateKey: selectedKey,
      name: def.name,
      description: def.description || "",
      module: def.module,
      htmlContent: JSON.stringify(spreadsheetData),
      cssContent: "",
      paperSize: spreadsheetData.paperSize,
      orientation: spreadsheetData.orientation,
      marginTop: spreadsheetData.marginTop,
      marginRight: spreadsheetData.marginRight,
      marginBottom: spreadsheetData.marginBottom,
      marginLeft: spreadsheetData.marginLeft,
    });
  }, [selectedKey, spreadsheetData, upsertMutation]);

  // 恢复默认
  const handleReset = useCallback(() => {
    if (!selectedKey) return;
    deleteMutation.mutate({ templateKey: selectedKey });
    setSpreadsheetData(getDefaultSpreadsheetData(selectedKey));
  }, [selectedKey, deleteMutation]);

  // 返回列表
  const handleBack = useCallback(() => {
    setEditorMode(false);
    setSelectedKey(null);
    setShowPreview(false);
  }, []);

  // 字段分组
  const fieldGroups = useMemo(() => {
    if (!selectedKey) return [];
    return variablesToFieldGroups(selectedKey);
  }, [selectedKey]);

  // 按模块分组
  const moduleGroups = useMemo(() => {
    const groups: Record<string, typeof TEMPLATE_DEFINITIONS> = {};
    for (const def of TEMPLATE_DEFINITIONS) {
      if (!groups[def.module]) groups[def.module] = [];
      groups[def.module].push(def);
    }
    return groups;
  }, []);

  // ==================== 编辑器模式 ====================
  if (editorMode && selectedKey) {
    const def = getTemplateDefinition(selectedKey);
    return (
      <div className="h-screen flex flex-col">
        {showPreview ? (
          // 预览模式
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="gap-1">
                  ← 返回编辑
                </Button>
                <span className="text-sm font-medium">预览 — {def?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1 text-xs">
                <Printer className="h-3.5 w-3.5" /> 打印
              </Button>
            </div>
            <div className="flex-1 bg-gray-200 overflow-auto flex justify-center p-8">
              <div className="bg-white shadow-lg" style={{ width: "210mm", minHeight: "297mm" }}>
                <iframe
                  ref={previewRef}
                  className="w-full border-0"
                  style={{ height: "297mm", minHeight: "297mm" }}
                  title="打印预览"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        ) : (
          // 编辑器模式
          <SpreadsheetEditor
            data={spreadsheetData}
            onChange={setSpreadsheetData}
            fieldGroups={fieldGroups}
            templateName={def?.name || "模板"}
            onSave={handleSave}
            onPreview={handlePreview}
            onPrint={handlePrint}
            onBack={handleBack}
            onReset={handleReset}
            saving={upsertMutation.isPending}
          />
        )}
      </div>
    );
  }

  // ==================== 列表模式 ====================
  return (
    <ERPLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Printer className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">打印模板管理</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              类 Excel 可视化编辑器 — 拖拽字段到表格中，所见即所得
            </p>
          </div>
        </div>

        {/* 使用说明 */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex gap-3 text-sm text-blue-800">
              <FileText className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">操作说明：</span>
                点击"编辑模板"进入类 Excel 编辑器。左侧字段面板可拖拽字段到表格单元格中，
                使用 <code className="bg-blue-100 px-1 rounded">{"${字段名}"}</code> 语法插入变量。
                支持合并单元格、字体格式化、边框设置等。编辑器中的效果与打印输出完全一致。
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 按模块分组展示 */}
        {Object.entries(moduleGroups).map(([moduleId, templates]) => (
          <div key={moduleId} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold">{MODULE_LABELS[moduleId] || moduleId}</h2>
              <Badge variant="secondary" className="text-xs">{templates.length} 个模板</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((def) => {
                const Icon = ICON_MAP[def.templateKey] || FileText;
                const color = COLOR_MAP[def.module] || "bg-gray-50 border-gray-200 text-gray-700";
                const content = getTemplateContent(def.templateKey);
                return (
                  <Card key={def.templateKey} className="border transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg border ${color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">{def.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{MODULE_LABELS[def.module]}</p>
                          </div>
                        </div>
                        {content.isCustomized && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 bg-amber-50">
                            已自定义
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{def.description}</p>
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">可用字段：</p>
                        <div className="flex flex-wrap gap-1">
                          {def.variables.filter(v => !v.key.startsWith("company.") && v.key !== "printTime" && v.key !== "printDate").slice(0, 5).map((v) => (
                            <Badge key={v.key} variant="secondary" className="text-xs px-1.5 py-0">
                              {v.label}
                            </Badge>
                          ))}
                          {def.variables.filter(v => !v.key.startsWith("company.") && v.key !== "printTime" && v.key !== "printDate").length > 5 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 text-muted-foreground">
                              +{def.variables.filter(v => !v.key.startsWith("company.") && v.key !== "printTime" && v.key !== "printDate").length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Separator className="mb-3" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleEdit(def.templateKey)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> 编辑模板
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ERPLayout>
  );
}
