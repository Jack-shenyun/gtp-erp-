import { useState } from "react";
import { trpc } from "@/lib/trpc";
import ERPLayout from "@/components/ERPLayout";
import ModulePage, { Column, StatusBadge } from "@/components/ModulePage";
import { Receipt, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import FormDialog from "@/components/FormDialog";

const statusMap: Record<string, any> = {
  draft: { label: "草稿", variant: "outline" },
  pending_approval: { label: "审批中", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已驳回", variant: "destructive" },
  paid: { label: "已支付", variant: "default" },
  cancelled: { label: "已取消", variant: "outline" },
};

const categoryMap: Record<string, string> = {
  travel: "差旅费",
  office: "办公费",
  entertainment: "招待费",
  transport: "交通费",
  communication: "通讯费",
  other: "其他",
};

export default function ExpensePage() {
  const { user } = useAuth();
  const { data = [], isLoading, refetch } = trpc.expenseReimbursements.list.useQuery();
  const createMutation = trpc.expenseReimbursements.create.useMutation({ onSuccess: () => { refetch(); toast.success("提交成功"); } });
  const updateMutation = trpc.expenseReimbursements.update.useMutation({ onSuccess: () => { refetch(); toast.success("更新成功"); } });
  const deleteMutation = trpc.expenseReimbursements.delete.useMutation({ onSuccess: () => { refetch(); toast.success("删除成功"); } });

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const columns: Column<any>[] = [
    { key: "reimbursementNo", title: "报销单号", width: "140px" },
    { key: "department", title: "部门", width: "120px" },
    { key: "applyDate", title: "申请日期", width: "120px" },
    { key: "category", title: "类型", width: "100px", render: (v) => categoryMap[v] || v },
    { key: "totalAmount", title: "总金额", width: "120px", render: (v, row) => `${row.currency} ${parseFloat(v).toLocaleString()}` },
    { key: "status", title: "状态", width: "100px", render: (v) => <StatusBadge status={v} statusMap={statusMap} /> },
  ];

  const handleSubmit = (formData: any) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
    setFormOpen(false);
  };

  return (
    <ERPLayout>
      <ModulePage
        title="费用报销"
        description="管理员工日常费用报销申请及审批流程"
        icon={Receipt}
        columns={columns}
        data={data}
        loading={isLoading}
        onAdd={() => { setEditingRecord(null); setFormOpen(true); }}
        onEdit={(record) => { setEditingRecord(record); setFormOpen(true); }}
        onDelete={(record) => deleteMutation.mutate({ id: record.id })}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingRecord ? "编辑报销单" : "新建费用报销"}
        fields={[
          { name: "reimbursementNo", label: "报销单号", type: "text", required: true, placeholder: "自动生成", disabled: true },
          { name: "department", label: "部门", type: "text", required: true, defaultValue: user?.department || "" },
          { name: "applyDate", label: "申请日期", type: "date", required: true },
          { 
            name: "category", 
            label: "报销类型", 
            type: "select", 
            required: true,
            options: Object.entries(categoryMap).map(([value, label]) => ({ label, value }))
          },
          { name: "totalAmount", label: "总金额", type: "number", required: true },
          { 
            name: "currency", 
            label: "币种", 
            type: "select", 
            required: true,
            options: [
              { label: "人民币 (CNY)", value: "CNY" },
              { label: "美元 (USD)", value: "USD" },
            ]
          },
          { name: "description", label: "费用说明", type: "textarea", span: 2, required: true },
          { name: "remark", label: "备注", type: "textarea", span: 2 },
        ]}
        initialData={editingRecord || {
          reimbursementNo: `EXP-${new Date().getFullYear()}-${String(data.length + 1).padStart(4, "0")}`,
          currency: "CNY",
          category: "office",
          applyDate: new Date().toISOString().split("T")[0],
        }}
        onSubmit={handleSubmit}
      />
    </ERPLayout>
  );
}
