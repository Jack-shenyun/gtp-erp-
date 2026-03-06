import { useState } from "react";
import ModulePage, { Column } from "@/components/ModulePage";
import FormDialog, { FormField, DetailDialog, DetailField } from "@/components/FormDialog";
import { PackageMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

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
  isSterilized?: boolean;
};

export default function OutboundPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);

  // 获取仓库列表
  const { data: warehouseList = [] } = trpc.warehouses.list.useQuery({ status: "active" });
  const { data: productList = [] } = trpc.products.list.useQuery({ limit: 1000 });
  // C2: 获取已审批的销售订单列表，用于关联出库
  const { data: salesOrderList = [] } = trpc.salesOrders.list.useQuery({ status: "approved" });

  // 获取出库记录（只查出库类型）
  const { data: rawData = [], refetch } = trpc.inventoryTransactions.list.useQuery({
    limit: 200,
  });

  // 只显示出库类型的记录
  const data = rawData.filter((r: any) =>
    ["sales_out", "production_out", "return_out", "other_out"].includes(r.type)
  );
  const products = (productList as ProductOption[]) || [];
  const productsById = new Map(products.map((p) => [p.id, p]));
  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: `${p.code} - ${p.name}${p.specification ? `（${p.specification}）` : ""}`,
  }));

  // C2: 销售订单选项
  const salesOrderOptions = (salesOrderList as any[]).map((o: any) => ({
    value: String(o.id),
    label: `${o.orderNo}${o.customerName ? ` - ${o.customerName}` : ""}`,
  }));

  const createMutation = trpc.inventoryTransactions.create.useMutation({
    onSuccess: () => { toast.success("出库单已创建"); refetch(); setFormOpen(false); },
    onError: (e) => toast.error("创建失败", { description: e.message }),
  });

  const updateMutation = trpc.inventoryTransactions.update.useMutation({
    onSuccess: () => { toast.success("出库单已更新"); refetch(); setFormOpen(false); },
    onError: (e) => toast.error("更新失败", { description: e.message }),
  });

  const deleteMutation = trpc.inventoryTransactions.delete.useMutation({
    onSuccess: () => { toast.success("出库单已删除"); refetch(); },
    onError: (e) => toast.error("删除失败", { description: e.message }),
  });

  const getWarehouseName = (warehouseId: number) => {
    const wh = warehouseList.find((w: any) => w.id === warehouseId);
    return wh ? wh.name : `仓库${warehouseId}`;
  };

  // C2: 获取关联订单号
  const getRelatedOrderNo = (relatedOrderId: number | null | undefined) => {
    if (!relatedOrderId) return "-";
    const order = (salesOrderList as any[]).find((o: any) => o.id === relatedOrderId);
    return order ? order.orderNo : `#${relatedOrderId}`;
  };

  const getFormFields = (): FormField[] => [
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
    // C2: 销售出库时显示关联销售订单选择
    {
      name: "relatedOrderId",
      label: "关联销售订单",
      type: "select",
      required: false,
      options: salesOrderOptions,
      placeholder: "请选择关联的销售订单",
      hidden: (formData) => formData.type !== "sales_out",
    },
    {
      name: "productId",
      label: "物料名称",
      type: "select",
      required: true,
      options: productOptions,
      placeholder: productOptions.length > 0 ? "请选择产品库物料" : "请先在产品管理维护产品",
    },
    { name: "batchNo", label: "批次号", type: "text", placeholder: "请输入批次号" },
    {
      name: "sterilizationBatchNo",
      label: "灭菌批号",
      type: "text",
      required: true,
      placeholder: "医疗器械必填",
      hidden: (formData) => {
        const product = productsById.get(Number(formData.productId));
        return !product?.isMedicalDevice;
      },
    },
    { name: "quantity", label: "数量", type: "number", required: true, placeholder: "请输入出库数量" },
    { name: "unit", label: "单位", type: "text", placeholder: "自动从产品带入", disabled: true },
    {
      name: "warehouseId",
      label: "出库仓库",
      type: "select",
      required: true,
      options: warehouseList.map((w: any) => ({ label: w.name, value: String(w.id) })),
    },
    { name: "remark", label: "备注", type: "textarea", span: 2, placeholder: "请输入备注信息" },
  ];

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
      title: "出库仓库",
      width: "110px",
      render: (v: number) => getWarehouseName(v),
    },
    // C2: 显示关联订单号
    {
      key: "relatedOrderId",
      title: "关联订单",
      width: "130px",
      render: (v: number) => v ? <Badge variant="secondary">{getRelatedOrderNo(v)}</Badge> : <span className="text-muted-foreground">-</span>,
    },
    {
      key: "createdAt",
      title: "出库时间",
      width: "130px",
      render: (v: string) => v ? new Date(v).toLocaleDateString("zh-CN") : "-",
    },
  ];

  const handleAdd = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleView = (record: any) => {
    setViewingRecord(record);
    setDetailOpen(true);
  };

  const handleDelete = (record: any) => {
    deleteMutation.mutate({ id: record.id });
  };

  const getInitialProductId = (record: any): string => {
    if (record?.productId) return String(record.productId);
    const matched = products.find((p) => p.name === record?.itemName);
    return matched ? String(matched.id) : "";
  };

  const handleSubmit = (formData: Record<string, any>) => {
    const selectedProduct = productsById.get(Number(formData.productId));
    if (!selectedProduct) {
      toast.error("请选择产品库中的物料");
      return;
    }
    if (selectedProduct.isMedicalDevice && !String(formData.sterilizationBatchNo || "").trim()) {
      toast.error("医疗器械必须填写灭菌批号");
      return;
    }

    const payload: any = {
      productId: selectedProduct.id,
      warehouseId: Number(formData.warehouseId),
      type: formData.type as any,
      documentNo: formData.documentNo || undefined,
      itemName: selectedProduct.name,
      batchNo: formData.batchNo || undefined,
      sterilizationBatchNo: formData.sterilizationBatchNo || undefined,
      quantity: String(formData.quantity || "0"),
      unit: formData.unit || selectedProduct.unit || undefined,
      remark: formData.remark || undefined,
      // C2: 关联销售订单
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
      createMutation.mutate(payload);
    }
  };

  const getDetailFields = (record: any): DetailField[] => [
    { label: "出库单号", value: record.documentNo || "-" },
    { label: "出库类型", value: <Badge variant="outline">{typeMap[record.type] || record.type}</Badge> },
    { label: "物料名称", value: record.itemName },
    { label: "批次号", value: record.batchNo || "-" },
    { label: "灭菌批号", value: record.sterilizationBatchNo || "-" },
    {
      label: "数量",
      value: `${parseFloat(String(record.quantity || 0))?.toLocaleString?.() ?? "0"} ${record.unit || ""}`,
    },
    { label: "出库仓库", value: getWarehouseName(record.warehouseId) },
    // C2: 显示关联订单
    { label: "关联销售订单", value: getRelatedOrderNo(record.relatedOrderId) },
    {
      label: "出库时间",
      value: record.createdAt ? new Date(record.createdAt).toLocaleString("zh-CN") : "-",
    },
    { label: "备注", value: record.remark || "-", span: 2 },
  ];

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
        fields={getFormFields()}
        initialData={editingRecord ? {
          ...editingRecord,
          productId: getInitialProductId(editingRecord),
          warehouseId: String(editingRecord.warehouseId),
          relatedOrderId: editingRecord.relatedOrderId ? String(editingRecord.relatedOrderId) : "",
        } : {
          documentNo: `OUT-${new Date().getFullYear()}-${String(data.length + 1).padStart(4, "0")}`,
          type: "sales_out",
        }}
        onSubmit={handleSubmit}
        submitText={editingRecord ? "保存修改" : "创建出库单"}
        onChange={(name, value) => {
          // Issue 12: 选择产品时自动填充单位
          if (name === "productId") {
            const product = productsById.get(Number(value));
            if (product?.unit) {
              return { unit: product.unit };
            }
          }
        }}
      />

      {viewingRecord && (
        <DetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title={`出库单详情 - ${viewingRecord.documentNo || viewingRecord.id}`}
          fields={getDetailFields(viewingRecord)}
          actions={
            <Button variant="outline" onClick={() => {
              setDetailOpen(false);
              handleEdit(viewingRecord);
            }}>
              编辑出库单
            </Button>
          }
        />
      )}
    </>
  );
}
