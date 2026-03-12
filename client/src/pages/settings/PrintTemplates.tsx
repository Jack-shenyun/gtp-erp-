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

// 获取默认模板数据
export function getDefaultSpreadsheetData(templateKey: string): SpreadsheetData {
  switch (templateKey) {
    case "sales_order": return createSalesOrderTemplate();
    case "purchase_order": return createPurchaseOrderTemplate();
    case "production_order": return createProductionOrderTemplate();
    default: return createSalesOrderTemplate(); // 其他模板暂用销售订单模板
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
