import { useState } from "react";
import ModulePage, { Column } from "@/components/ModulePage";
import FormDialog, { FormField, DetailDialog, DetailField } from "@/components/FormDialog";
import { PackageMinus, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { usePermission } from "@/hooks/usePermission";

import { DeliveryNotePrint } from "@/components/print";

// ==================== 常量 ====================
const typeMap: Record<string, string> = {
  sales_out: "销售出库",
  production_out: "生产领料",
  return_out: "采购退货",
  other_out: "其他出库",
};

const outboundTypeOptions = [
  { label: "销售出库", value: "sales_out" },
  { label: "生产领料", value: "production_out" },
  { label: "采购退货", value: "return_out" },
  { label: "其他出库", value: "other_out" },
];

type ProductOption = {
  id: number;
  code: string;
  name: string;
  specification?: string | null;
  unit?: string | null;
  isMedicalDevice: boolean;
  isSterilized: boolean;
};

type SalesOrderOption = {
  id: number;
  orderNo: string;
  customerName?: string | null;
  status: string;
  shippingAddress?: string | null;
  shippingContact?: string | null;
  shippingPhone?: string | null;
};

type OutboundRecord = {
  id: number;
  documentNo?: string | null;
  type: string;
  warehouseId: number;
  productId?: number | null;
  itemName: string;
  batchNo?: string | null;
  sterilizationBatchNo?: string | null;
  quantity: string;
  unit?: string | null;
  beforeQty?: string | null;
  afterQty?: string | null;
  relatedOrderId?: number | null;
  remark?: string | null;
  createdAt: string;
};

// ==================== 主组件 ====================
export default function OutboundPage() {
  const { canDelete } = usePermission();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OutboundRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<OutboundRecord | null>(null);
  const [printDeliveryOpen, setPrintDeliveryOpen] = useState(false);

  // ==================== 数据查询 ====================
  const { data: warehouseList = [] } = trpc.warehouses.list.useQuery({ status: "active" });
  const { data: productList = [] } = trpc.products.list.useQuery({ limit: 1000 });
  const { data: inventoryList = [] } = trpc.inventory.list.useQuery({ limit: 2000 });

  // 销售订单列表（已审批 + 待发货 + 部分发货）
  const { data: approvedOrders = [] } = trpc.salesOrders.list.useQuery({ status: "approved", limit: 200 });
  const { data: readyOrders = [] } = trpc.salesOrders.list.useQuery({ status: "ready_to_ship", limit: 200 });
  const { data: partialOrders = [] } = trpc.salesOrders.list.useQuery({ status: "partial_shipped", limit: 200 });
  const salesOrderList: SalesOrderOption[] = [
    ...(approvedOrders as SalesOrderOption[]),
    ...(readyOrders as SalesOrderOption[]),
    ...(partialOrders as SalesOrderOption[]),
  ];

  const { data: rawData = [], refetch } = trpc.inventoryTransactions.list.useQuery({ limit: 200 });
  const data: OutboundRecord[] = (rawData as OutboundRecord[]).filter((r) =>
    ["sales_out", "production_out", "return_out", "other_out"].includes(r.type)
  );

  const products = (productList as ProductOption[]) || [];
  const productsById = new Map(products.map((p) => [p.id, p]));

  const syncShipmentStatusMutation = trpc.salesOrders.syncShipmentStatus.useMutation();

  const createMutation = trpc.inventoryTransactions.create.useMutation({
    onSuccess: () => { toast.success("出库单已创建"); refetch(); setFormOpen(false); },
    onError: (e) => toast.error("创建失败：" + e.message),
  });
  const updateMutation = trpc.inventoryTransactions.update.useMutation({
    onSuccess: () => { toast.success("出库单已更新"); refetch(); setFormOpen(false); },
    onError: (e) => toast.error("更新失败：" + e.message),
  });
  const deleteMutation = trpc.inventoryTransactions.delete.useMutation({
    onSuccess: () => { toast.success("出库单已删除"); refetch(); },
    onError: (e) => toast.error("删除失败：" + e.message),
  });

  // ==================== 辅助函数 ====================
  const getWarehouseName = (warehouseId: number) => {
    const wh = (warehouseList as any[]).find((w: any) => w.id === warehouseId);
    return wh ? wh.name : `仓库${warehouseId}`;
  };

  const getRelatedOrderNo = (relatedOrderId: number | null | undefined) => {
    if (!relatedOrderId) return "-";
    const o = salesOrderList.find((o) => o.id === relatedOrderId);
    return o ? `${o.orderNo}（${o.customerName || ""}）` : `#${relatedOrderId}`;
  };

  // 获取某产品在某仓库的可用批号列表
  const getBatchOptions = (productId: number, warehouseId: number) => {
    return (inventoryList as any[]).filter(
      (inv: any) => inv.productId === productId && inv.warehouseId === warehouseId
    );
  };

  const buildDefaultDocumentNo = () =>
    `OUT-${new Date().getFullYear()}-${String(data.length + 1).padStart(4, "0")}`;

  // ==================== 表单字段定义 ====================
  const getFormFields = (currentFormData?: Record<string, any>): FormField[] => {
    const selectedProductId = currentFormData?.productId ? Number(currentFormData.productId) : null;
    const selectedWarehouseId = currentFormData?.warehouseId ? Number(currentFormData.warehouseId) : null;
    const selectedProduct = selectedProductId ? productsById.get(selectedProductId) : null;
    const selectedType = currentFormData?.type || "sales_out";

    // 批号选项：从库存中获取
    const batchOptions = selectedProductId && selectedWarehouseId
      ? getBatchOptions(selectedProductId, selectedWarehouseId).map((inv: any) => ({
          label: `${inv.batchNo || `批次${inv.id}`}（库存: ${parseFloat(inv.quantity || "0").toLocaleString()}）`,
          value: inv.batchNo || `inv-${inv.id}`,
        }))
      : [];

    // 销售订单选项
    const salesOrderOptions = salesOrderList.map((o) => ({
      label: `${o.orderNo} - ${o.customerName || ""}`,
      value: String(o.id),
    }));

    return [
      {
        name: "documentNo",
        label: "出库单号",
        type: "text",
        required: true,
        placeholder: "系统自动生成或手动输入",
      },
      {
        name: "type",
        label: "出库类型",
        type: "select",
        required: true,
        options: outboundTypeOptions,
      },
      {
        name: "productId",
        label: "物料名称",
        type: "select",
        required: true,
        options: products.map((p) => ({
          value: String(p.id),
          label: `${p.code} - ${p.name}${p.specification ? `（${p.specification}）` : ""}`,
        })),
        placeholder: products.length > 0 ? "请选择产品库物料" : "请先在产品管理维护产品",
      },
      {
        name: "batchNo",
        label: "批次号",
        type: batchOptions.length > 0 ? "select" : "text",
        options: batchOptions.length > 0 ? batchOptions : undefined,
        placeholder: batchOptions.length > 0 ? "从库存中选择批次" : "请输入批次号",
      },
      {
        name: "sterilizationBatchNo",
        label: "灭菌批号",
        type: "text",
        required: true,
        placeholder: "医疗器械必填",
        hidden: (fd: Record<string, any>) => {
          const pid = fd.productId ? Number(fd.productId) : null;
          if (!pid) return true;
          const product = productsById.get(pid);
          return !(product?.isMedicalDevice && product?.isSterilized);
        },
      },
      {
        name: "quantity",
        label: "数量",
        type: "number",
        required: true,
        placeholder: "请输入出库数量",
      },
      {
        name: "unit",
        label: "单位",
        type: "text",
        placeholder: "自动从产品带入",
        disabled: true,
      },
      {
        name: "warehouseId",
        label: "来源仓库",
        type: "select",
        required: true,
        options: (warehouseList as any[]).map((w: any) => ({ label: w.name, value: String(w.id) })),
      },
      {
        name: "relatedOrderId",
        label: "关联销售订单",
        type: "select",
        options: [{ label: "无", value: "" }, ...salesOrderOptions],
        placeholder: "选择关联销售订单（可选）",
        hidden: (fd: Record<string, any>) => fd.type !== "sales_out",
      },
      {
        name: "remark",
        label: "备注",
        type: "textarea",
        span: 2,
        placeholder: "请输入备注信息",
      },
    ];
  };

  // ==================== 表格列定义 ====================
  const columns: Column<any>[] = [
    { key: "documentNo", title: "出库单号", width: "140px" },
    {
      key: "type",
      title: "出库类型",
      width: "110px",
      render: (value: string) => <Badge variant="outline">{typeMap[value] || value}</Badge>,
    },
    { key: "itemName", title: "物料名称" },
    { key: "batchNo", title: "批次号", width: "110px", render: (v: string) => v || "-" },
    { key: "sterilizationBatchNo", title: "灭菌批号", width: "120px", render: (v: string) => v || "-" },
    {
      key: "quantity",
      title: "数量",
      width: "100px",
      render: (v: string, row: any) => `${parseFloat(v || "0")?.toLocaleString?.() ?? "0"} ${row.unit || ""}`,
    },
    {
      key: "warehouseId",
      title: "来源仓库",
      width: "110px",
      render: (v: number) => getWarehouseName(v),
    },
    {
      key: "relatedOrderId",
      title: "关联订单",
      width: "140px",
      render: (v: number | null) => v ? getRelatedOrderNo(v) : "-",
    },
    {
      key: "createdAt",
      title: "出库时间",
      width: "130px",
      render: (v: string) => v ? new Date(v).toLocaleDateString("zh-CN") : "-",
    },
  ];

  // ==================== 事件处理 ====================
  const handleAdd = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleEdit = (record: OutboundRecord) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleView = (record: OutboundRecord) => {
    setViewingRecord(record);
    setDetailOpen(true);
  };

  const handleDelete = (record: OutboundRecord) => {
    if (!canDelete) { toast.error("您没有删除权限"); return; }
    deleteMutation.mutate({ id: record.id }, {
      onSuccess: () => {
        if (record.type === "sales_out" && record.relatedOrderId) {
          syncShipmentStatusMutation.mutate({ orderId: record.relatedOrderId });
        }
      },
    });
  };

  const handleSubmit = (formData: Record<string, any>) => {
    const selectedProduct = productsById.get(Number(formData.productId));
    if (!selectedProduct) {
      toast.error("请选择产品库中的物料");
      return;
    }

    // 灭菌批号校验
    if (selectedProduct.isMedicalDevice && selectedProduct.isSterilized && !String(formData.sterilizationBatchNo || "").trim()) {
      toast.error("需灭菌医疗器械必须填写灭菌批号");
      return;
    }

    // 库存数量校验
    const outQty = parseFloat(String(formData.quantity || "0"));
    if (formData.warehouseId) {
      const batchOpts = getBatchOptions(selectedProduct.id, Number(formData.warehouseId));
      if (batchOpts.length > 0) {
        if (formData.batchNo) {
          const matched = batchOpts.find((inv: any) => (inv.batchNo || `inv-${inv.id}`) === formData.batchNo);
          if (matched) {
            const available = parseFloat(String(matched.quantity || "0"));
            if (outQty > available) {
              toast.error(`批次 ${formData.batchNo} 库存不足！当前库存 ${available}，出库数量 ${outQty}`);
              return;
            }
          }
        } else {
          const totalQty = batchOpts.reduce((s: number, inv: any) => s + parseFloat(String(inv.quantity || "0")), 0);
          if (outQty > totalQty) {
            toast.error(`「${selectedProduct.name}」库存不足！当前总库存 ${totalQty}，出库数量 ${outQty}`);
            return;
          }
        }
      }
    }

    const payload = {
      productId: selectedProduct.id,
      warehouseId: Number(formData.warehouseId),
      type: formData.type as any,
      documentNo: formData.documentNo || undefined,
      itemName: selectedProduct.name,
      batchNo: formData.batchNo || undefined,
      sterilizationBatchNo: formData.sterilizationBatchNo || undefined,
      quantity: String(outQty),
      unit: formData.unit || selectedProduct.unit || undefined,
      remark: formData.remark || undefined,
      relatedOrderId: formData.relatedOrderId ? Number(formData.relatedOrderId) : undefined,
    };

    if (editingRecord) {
      updateMutation.mutate({
        id: editingRecord.id,
        data: {
          documentNo: payload.documentNo,
          productId: payload.productId,
          itemName: payload.itemName,
          batchNo: payload.batchNo,
          sterilizationBatchNo: payload.sterilizationBatchNo,
          quantity: payload.quantity,
          unit: payload.unit,
          remark: payload.remark,
          relatedOrderId: payload.relatedOrderId,
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          if (payload.type === "sales_out" && payload.relatedOrderId) {
            syncShipmentStatusMutation.mutate({ orderId: payload.relatedOrderId });
          }
        },
      });
    }
  };

  // 字段联动：选择产品时自动填充单位；切换类型时清空关联订单
  const handleFieldChange = (name: string, value: any): Record<string, any> | void => {
    if (name === "productId") {
      const product = productsById.get(Number(value));
      if (product?.unit) {
        return { unit: product.unit };
      }
    }
    if (name === "type" && value !== "sales_out") {
      return { relatedOrderId: "" };
    }
  };

  // ==================== 详情字段 ====================
  const getDetailFields = (record: OutboundRecord): DetailField[] => [
    { label: "出库单号", value: record.documentNo || "-" },
    { label: "出库类型", value: <Badge variant="outline">{typeMap[record.type] || record.type}</Badge> },
    { label: "物料名称", value: record.itemName },
    { label: "批次号", value: record.batchNo || "-" },
    { label: "灭菌批号", value: record.sterilizationBatchNo || "-" },
    {
      label: "数量",
      value: `${parseFloat(String(record.quantity || 0))?.toLocaleString?.() ?? "0"} ${record.unit || ""}`,
    },
    { label: "来源仓库", value: getWarehouseName(record.warehouseId) },
    { label: "关联订单", value: getRelatedOrderNo(record.relatedOrderId) },
    {
      label: "变动前库存",
      value: record.beforeQty ? `${parseFloat(record.beforeQty).toLocaleString()} ${record.unit || ""}` : "-",
    },
    {
      label: "变动后库存",
      value: record.afterQty ? `${parseFloat(record.afterQty).toLocaleString()} ${record.unit || ""}` : "-",
    },
    {
      label: "出库时间",
      value: record.createdAt ? new Date(record.createdAt).toLocaleString("zh-CN") : "-",
    },
    { label: "备注", value: record.remark || "-", span: 2 },
  ];

  const getInitialProductId = (record: OutboundRecord): string => {
    if (record?.productId) return String(record.productId);
    const matched = products.find((p) => p.name === record?.itemName);
    return matched ? String(matched.id) : "";
  };

  return (
    <>
      <ModulePage
        title="出库管理"
        description="管理销售出库、生产领料、采购退货等各类出库业务"
        icon={PackageMinus}
        columns={columns}
        data={data}
        searchPlaceholder="搜索出库单号、物料名称..."
        addButtonText="新建出库"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        filterOptions={outboundTypeOptions}
        stats={[
          { label: "出库总数", value: data.length },
          { label: "销售出库", value: data.filter((d: any) => d.type === "sales_out").length, color: "text-blue-600" },
          { label: "生产领料", value: data.filter((d: any) => d.type === "production_out").length, color: "text-green-600" },
          { label: "采购退货", value: data.filter((d: any) => d.type === "return_out").length, color: "text-amber-600" },
        ]}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingRecord ? "编辑出库单" : "新建出库单"}
        description={editingRecord ? "修改出库单信息" : "填写出库单基本信息"}
        fields={buildFormFields()}
        initialData={editingRecord ? {
          ...editingRecord,
          productId: getInitialProductId(editingRecord),
          warehouseId: String(editingRecord.warehouseId),
          relatedOrderId: editingRecord.relatedOrderId ? String(editingRecord.relatedOrderId) : "",
        } : {
          documentNo: buildDefaultDocumentNo(),
          type: "sales_out",
        }}
        onSubmit={handleSubmit}
        submitText={editingRecord ? "保存修改" : "创建出库单"}
        onChange={handleFieldChange}
      />

      {viewingRecord && (
        <DetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title={`出库单详情 - ${viewingRecord.documentNo || viewingRecord.id}`}
          fields={getDetailFields(viewingRecord)}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailOpen(false);
                  setPrintDeliveryOpen(true);
                }}
              >
                <Printer className="h-4 w-4 mr-1" />
                打印出库单
              </Button>
              <Button variant="outline" onClick={() => {
                setDetailOpen(false);
                handleEdit(viewingRecord);
              }}>
                编辑出库单
              </Button>
            </div>
          }
        />
      )}

      {/* 打印出库单 */}
      {viewingRecord && printDeliveryOpen && (
        <DeliveryNotePrint
          open={printDeliveryOpen}
          onClose={() => setPrintDeliveryOpen(false)}
          record={viewingRecord as any}
          salesOrder={salesOrderList.find((o) => o.id === viewingRecord.relatedOrderId) as any}
        />
      )}
    </>
  );
}
