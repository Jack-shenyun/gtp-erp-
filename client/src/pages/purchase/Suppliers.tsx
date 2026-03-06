import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import ModulePage, { Column, StatusBadge } from "@/components/ModulePage";
import FormDialog, { FormField, DetailDialog, DetailField } from "@/components/FormDialog";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DraftDrawer, { DraftItem } from "@/components/DraftDrawer";
import { toast } from "sonner";
import { PAYMENT_CONDITION_OPTIONS, normalizePaymentCondition } from "@shared/paymentTerms";

interface Supplier {
  id: number;
  code: string;
  name: string;
  shortName?: string;
  category: string;
  level: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNo?: string;
  bankAccount?: string;
  paymentTerms?: string;
  businessLicense?: string;
  evaluationScore?: string;
  status: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

const dbStatusToFrontend: Record<string, string> = {
  qualified: "approved",
  pending: "pending",
  disqualified: "blacklist",
};
const frontendStatusToDb: Record<string, "qualified" | "pending" | "disqualified"> = {
  approved: "qualified",
  pending: "pending",
  suspended: "disqualified",
  blacklist: "disqualified",
};
const dbTypeToCategory: Record<string, string> = {
  material: "material",
  equipment: "equipment",
  service: "service",
};
const categoryToDbType: Record<string, "material" | "equipment" | "service"> = {
  material: "material",
  package: "material",
  equipment: "equipment",
  service: "service",
};

const statusMap: Record<string, any> = {
  pending: { label: "待审核", variant: "outline" as const },
  approved: { label: "已认证", variant: "default" as const },
  suspended: { label: "已暂停", variant: "destructive" as const },
  blacklist: { label: "黑名单", variant: "destructive" as const },
};

const levelMap: Record<string, { label: string; color: string }> = {
  A: { label: "A级", color: "bg-green-100 text-green-800" },
  B: { label: "B级", color: "bg-blue-100 text-blue-800" },
  C: { label: "C级", color: "bg-amber-100 text-amber-800" },
  pending: { label: "待评级", color: "bg-gray-100 text-gray-800" },
};

const categoryMap: Record<string, string> = {
  material: "原材料",
  package: "包装材料",
  equipment: "设备",
  service: "服务",
};

const formFields: FormField[] = [
  { name: "code", label: "供应商编码", type: "text", required: true, placeholder: "如：SUP-001" },
  { name: "name", label: "供应商名称", type: "text", required: true, placeholder: "请输入供应商全称" },
  {
    name: "category",
    label: "供应类别",
    type: "select",
    required: true,
    options: [
      { label: "原材料", value: "material" },
      { label: "包装材料", value: "package" },
      { label: "设备", value: "equipment" },
      { label: "服务", value: "service" },
    ],
  },
  {
    name: "level",
    label: "供应商等级",
    type: "select",
    required: true,
    options: [
      { label: "A级（优秀）", value: "A" },
      { label: "B级（良好）", value: "B" },
      { label: "C级（一般）", value: "C" },
      { label: "待评级", value: "pending" },
    ],
    defaultValue: "pending",
  },
  {
    name: "status",
    label: "状态",
    type: "select",
    required: true,
    options: [
      { label: "待审核", value: "pending" },
      { label: "已认证", value: "approved" },
      { label: "已暂停", value: "suspended" },
      { label: "黑名单", value: "blacklist" },
    ],
    defaultValue: "pending",
  },
  { name: "contactPerson", label: "联系人", type: "text", required: true, placeholder: "请输入联系人姓名" },
  { name: "phone", label: "联系电话", type: "tel", required: true, placeholder: "请输入联系电话" },
  { name: "email", label: "电子邮箱", type: "email", placeholder: "请输入电子邮箱" },
  { name: "address", label: "地址", type: "text", placeholder: "请输入详细地址" },
  { name: "taxNo", label: "税号", type: "text", placeholder: "请输入纳税人识别号" },
  {
    name: "paymentTerms",
    label: "付款条件",
    type: "select",
    options: PAYMENT_CONDITION_OPTIONS,
  },
  { name: "bankAccount", label: "银行账号", type: "text", placeholder: "请输入银行账号" },
  { name: "businessLicense", label: "营业执照号", type: "text", placeholder: "请输入营业执照号" },
  { name: "remarks", label: "备注", type: "textarea", span: 2, placeholder: "请输入备注信息" },
];

const columns: Column<Supplier>[] = [
  { key: "code", title: "供应商编码", width: "110px" },
  { key: "name", title: "供应商名称" },
  {
    key: "category",
    title: "供应类别",
    width: "100px",
    render: (value) => <Badge variant="outline">{categoryMap[value] || value}</Badge>,
  },
  { key: "contactPerson", title: "联系人", width: "90px" },
  { key: "phone", title: "联系电话", width: "130px" },
  {
    key: "level",
    title: "等级",
    width: "70px",
    render: (value) => {
      const config = levelMap[value];
      return config ? (
        <span className={"px-2 py-1 rounded text-xs font-medium " + config.color}>
          {config.label}
        </span>
      ) : value;
    },
  },
  {
    key: "status",
    title: "状态",
    width: "100px",
    render: (value) => <StatusBadge status={value} statusMap={statusMap} />,
  },
];

function dbToSupplier(dbRecord: any): Supplier {
  return {
    id: dbRecord.id,
    code: dbRecord.code,
    name: dbRecord.name,
    shortName: dbRecord.shortName,
    category: dbTypeToCategory[dbRecord.type] || dbRecord.type,
    level: dbRecord.qualificationLevel || "pending",
    contactPerson: dbRecord.contactPerson,
    phone: dbRecord.phone,
    email: dbRecord.email,
    address: dbRecord.address,
    taxNo: dbRecord.taxNo,
    bankAccount: dbRecord.bankAccount,
    paymentTerms: normalizePaymentCondition(dbRecord.paymentTerms),
    businessLicense: dbRecord.businessLicense,
    evaluationScore: dbRecord.evaluationScore,
    status: dbStatusToFrontend[dbRecord.status] || dbRecord.status,
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt,
  };
}

export default function SuppliersPage() {
  const { data: suppliersData, isLoading, refetch } = trpc.suppliers.list.useQuery();
  const createMutation = trpc.suppliers.create.useMutation({ onSuccess: () => refetch() });
  const updateMutation = trpc.suppliers.update.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.suppliers.delete.useMutation({ onSuccess: () => refetch() });

  const [data, setData] = useState<Supplier[]>([]);

  useEffect(() => {
    if (suppliersData) {
      setData(suppliersData.map(dbToSupplier));
    }
  }, [suppliersData]);

  const drafts = data.filter((d: any) => d.status === "pending");
  const draftItems: DraftItem[] = drafts.map((d: any) => ({
    id: d.id,
    title: d.name || d.code,
    subtitle: d.code + (d.contactPerson ? " · " + d.contactPerson : ""),
    updatedAt: d.updatedAt,
    createdAt: d.createdAt,
  }));

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Supplier | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Supplier | null>(null);

  const handleDraftEdit = (item: DraftItem) => {
    const record = data.find((d) => d.id === item.id);
    if (record) handleEdit(record);
  };
  const handleDraftDelete = (item: DraftItem) => {
    const record = data.find((d) => d.id === item.id);
    if (record) handleDelete(record);
  };

  const handleAdd = () => { setEditingRecord(null); setFormOpen(true); };
  const handleEdit = (record: Supplier) => { setEditingRecord(record); setFormOpen(true); };
  const handleView = (record: Supplier) => { setViewingRecord(record); setDetailOpen(true); };
  const handleDelete = (record: Supplier) => {
    deleteMutation.mutate({ id: record.id }, {
      onSuccess: () => toast.success("供应商已删除"),
      onError: (err) => toast.error("删除失败", { description: err.message }),
    });
  };

  const buildDbPayload = (formData: Record<string, any>) => ({
    type: (categoryToDbType[formData.category] || "material") as "material" | "equipment" | "service",
    qualificationLevel: (["A", "B", "C"].includes(formData.level) ? formData.level : "pending") as "A" | "B" | "C" | "pending",
    status: (frontendStatusToDb[formData.status] || "pending") as "qualified" | "pending" | "disqualified",
    code: formData.code,
    name: formData.name,
    contactPerson: formData.contactPerson || undefined,
    phone: formData.phone || undefined,
    email: formData.email || undefined,
    address: formData.address || undefined,
    taxNo: formData.taxNo || undefined,
    bankAccount: formData.bankAccount || undefined,
    paymentTerms: formData.paymentTerms ? normalizePaymentCondition(formData.paymentTerms) : undefined,
    businessLicense: formData.businessLicense || undefined,
  });

  const handleSubmit = (formData: Record<string, any>) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: buildDbPayload(formData) }, {
        onSuccess: () => toast.success("供应商信息已更新"),
        onError: (err) => toast.error("更新失败", { description: err.message }),
      });
    } else {
      createMutation.mutate(buildDbPayload(formData), {
        onSuccess: () => toast.success("供应商已创建"),
        onError: (err) => toast.error("创建失败", { description: err.message }),
      });
    }
    setFormOpen(false);
  };

  const handleSaveDraft = (formData: Record<string, any>) => {
    const payload = {
      ...buildDbPayload(formData),
      code: formData.code || "SUP-DRAFT-" + Date.now(),
      name: formData.name || "（草稿）",
      status: "pending" as const,
    };
    createMutation.mutate(payload, {
      onSuccess: () => { toast.success("草稿已保存", { description: "可在草稿库中继续编辑" }); setFormOpen(false); },
      onError: (err) => toast.error("保存草稿失败", { description: err.message }),
    });
  };

  const getDetailFields = (record: Supplier): DetailField[] => [
    { label: "供应商编码", value: record.code },
    { label: "供应商名称", value: record.name },
    { label: "供应类别", value: <Badge variant="outline">{categoryMap[record.category] || record.category}</Badge> },
    {
      label: "供应商等级",
      value: (
        <span className={"px-2 py-1 rounded text-xs font-medium " + (levelMap[record.level]?.color || "")}>
          {levelMap[record.level]?.label || record.level}
        </span>
      ),
    },
    { label: "状态", value: <StatusBadge status={record.status} statusMap={statusMap} /> },
    { label: "联系人", value: record.contactPerson || "-" },
    { label: "联系电话", value: record.phone || "-" },
    { label: "电子邮箱", value: record.email || "-" },
    { label: "地址", value: record.address || "-" },
    { label: "税号", value: record.taxNo || "-" },
    { label: "付款条件", value: normalizePaymentCondition(record.paymentTerms) || "-" },
    { label: "银行账号", value: record.bankAccount || "-" },
    { label: "营业执照号", value: record.businessLicense || "-" },
    { label: "备注", value: record.remarks || "-", span: 2 },
  ];

  return (
    <>
      <ModulePage
        title="供应商管理"
        description="建立供应商全生命周期管理，从引入评审到绩效考核"
        icon={Building2}
        columns={columns}
        data={data}
        searchPlaceholder="搜索供应商编码、名称..."
        addButtonText="新增供应商"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        filterOptions={[
          { label: "原材料", value: "material" },
          { label: "包装材料", value: "package" },
          { label: "设备", value: "equipment" },
          { label: "服务", value: "service" },
        ]}
        stats={[
          { label: "供应商总数", value: data.length },
          { label: "A级供应商", value: data.filter((d: any) => d.level === "A").length, color: "text-green-600" },
          { label: "B级供应商", value: data.filter((d: any) => d.level === "B").length, color: "text-blue-600" },
          { label: "待审核", value: data.filter((d: any) => d.status === "pending").length, color: "text-amber-600" },
        ]}
        headerActions={
          <DraftDrawer
            count={draftItems.length}
            drafts={draftItems}
            moduleName="供应商"
            onEdit={handleDraftEdit}
            onDelete={handleDraftDelete}
          />
        }
      />
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingRecord ? "编辑供应商" : "新增供应商"}
        description={editingRecord ? "修改供应商信息" : "填写供应商基本信息创建新供应商"}
        fields={formFields}
        initialData={editingRecord || { code: "SUP-" + String(data.length + 1).padStart(3, "0") }}
        onSubmit={handleSubmit}
        submitText={editingRecord ? "保存修改" : "创建供应商"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
      {viewingRecord && (
        <DetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title={"供应商详情 - " + viewingRecord.name}
          fields={getDetailFields(viewingRecord)}
          actions={
            <Button variant="outline" onClick={() => { setDetailOpen(false); handleEdit(viewingRecord); }}>
              编辑供应商
            </Button>
          }
        />
      )}
    </>
  );
}
