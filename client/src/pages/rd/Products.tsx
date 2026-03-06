import { useState, useEffect } from "react";
import ModulePage, { Column, StatusBadge } from "@/components/ModulePage";
import { Package, RefreshCw, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DetailDialog, DetailField } from "@/components/FormDialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DraftDrawer, { DraftItem } from "@/components/DraftDrawer";

interface Product {
  id: number;
  isMedicalDevice: boolean;
  isSterilized?: boolean;
  code: string;
  name: string;
  specification: string | null;
  category: string | null;
  productCategory: string | null;
  riskLevel?: string | null;
  registrationNo?: string | null;
  registrationExpiry?: string | null;
  udiDi?: string | null;
  manufacturer?: string | null;
  storageCondition?: string | null;
  shelfLife?: number | null;
  unit?: string | null;
  status: string;
  description?: string | null;
}

const statusMap: Record<string, any> = {
  draft: { label: "草稿", variant: "outline" as const },
  active: { label: "已上市", variant: "default" as const },
  discontinued: { label: "已停产", variant: "destructive" as const },
};

const riskLevelMap: Record<string, { label: string; color: string }> = {
  I: { label: "I类", color: "bg-green-100 text-green-800" },
  II: { label: "II类", color: "bg-amber-100 text-amber-800" },
  III: { label: "III类", color: "bg-red-100 text-red-800" },
};

// 产品属性映射（原 category）
const categoryMap: Record<string, string> = {
  nmpa: "NMPA注册",
  fda: "FDA注册",
  ce: "CE注册",
  oem: "OEM代工",
  other: "其他",
};

// 产品分类映射（新 productCategory）
const productCategoryMap: Record<string, { label: string; prefix: string; color: string }> = {
  finished:     { label: "成品",   prefix: "CP",  color: "bg-blue-100 text-blue-800" },
  semi_finished:{ label: "半成品", prefix: "BCP", color: "bg-purple-100 text-purple-800" },
  raw_material: { label: "原材料", prefix: "YCL", color: "bg-amber-100 text-amber-800" },
  auxiliary:    { label: "辅料",   prefix: "FL",  color: "bg-green-100 text-green-800" },
  other:        { label: "其他",   prefix: "QT",  color: "bg-gray-100 text-gray-800" },
};

const DEFAULT_MANUFACTURER = "苏州神韵医疗器械有限公司";

const columns: Column<Product>[] = [
  { key: "code", title: "产品编码", width: "120px" },
  { key: "name", title: "产品名称" },
  { key: "specification", title: "规格型号", width: "140px" },
  {
    key: "isMedicalDevice",
    title: "产品类型",
    width: "100px",
    render: (value) => (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "医疗器械" : "非医疗器械"}
      </Badge>
    ),
  },
  {
    key: "isSterilized",
    title: "是否灭菌",
    width: "100px",
    render: (value) => (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "是" : "否"}
      </Badge>
    ),
  },
  {
    key: "productCategory",
    title: "产品分类",
    width: "90px",
    render: (value) => {
      if (!value) return <span className="text-muted-foreground">-</span>;
      const cfg = productCategoryMap[value];
      return cfg ? (
        <span className={`px-2 py-1 rounded text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      ) : <span>{value}</span>;
    },
  },
  { key: "category", title: "产品属性", width: "100px",
    render: (value) => <Badge variant="outline">{categoryMap[value] || value || "-"}</Badge>,
  },
  {
    key: "riskLevel",
    title: "风险等级",
    width: "90px",
    render: (value) => {
      if (!value) return <span className="text-muted-foreground">-</span>;
      const config = riskLevelMap[value];
      return config ? (
        <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>{config.label}</span>
      ) : value;
    },
  },
  {
    key: "registrationNo",
    title: "注册证号",
    width: "160px",
    render: (value) => value || <span className="text-muted-foreground">-</span>,
  },
  {
    key: "status",
    title: "状态",
    width: "100px",
    render: (value) => <StatusBadge status={value} statusMap={statusMap} />,
  },
];

// 产品表单组件
function ProductForm({
  open,
  onOpenChange,
  editingRecord,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingRecord: Product | null;
  onSuccess: () => void;
}) {
  const isEdit = !!editingRecord;

  const [form, setForm] = useState<Record<string, any>>({});
  const [codeError, setCodeError] = useState("");

  // 根据产品分类获取前缀
  const getPrefix = (productCategory: string) => {
    return productCategoryMap[productCategory]?.prefix || "CP";
  };

  // 获取下一个自动编码（根据当前选择的产品分类前缀）
  const currentPrefix = getPrefix(form.productCategory || "finished");
  const { data: nextCode, refetch: refetchNextCode } = trpc.products.nextCode.useQuery(
    { prefix: currentPrefix },
    { enabled: open && !isEdit }
  );

  // 校验编码唯一性
  const { data: checkResult } = trpc.products.checkCode.useQuery(
    { code: form.code || "", excludeId: editingRecord?.id },
    { enabled: !!form.code && form.code.length > 0 }
  );

  useEffect(() => {
    if (open) {
      if (isEdit && editingRecord) {
        setForm({
          isMedicalDevice: editingRecord.isMedicalDevice ?? true,
          isSterilized: editingRecord.isSterilized ?? false,
          code: editingRecord.code,
          name: editingRecord.name,
          specification: editingRecord.specification || "",
          category: editingRecord.category || "",
          productCategory: editingRecord.productCategory || "finished",
          riskLevel: editingRecord.riskLevel || "",
          status: editingRecord.status,
          salePermission: (editingRecord as any).salePermission || "saleable",
          procurePermission: (editingRecord as any).procurePermission || "purchasable",
          registrationNo: editingRecord.registrationNo || "",
          registrationExpiry: editingRecord.registrationExpiry || "",
          udiDi: editingRecord.udiDi || "",
          unit: editingRecord.unit || "",
          shelfLife: editingRecord.shelfLife || "",
          storageCondition: editingRecord.storageCondition || "",
          description: editingRecord.description || "",
        });
      } else {
        setForm({
          isMedicalDevice: true,
          isSterilized: false,
          code: nextCode || "",
          name: "",
          specification: "",
          category: "",
          productCategory: "finished",
          riskLevel: "",
          status: "draft",
          salePermission: "saleable",
          procurePermission: "purchasable",
          registrationNo: "",
          registrationExpiry: "",
          udiDi: "",
          unit: "",
          shelfLife: "",
          storageCondition: "",
          description: "",
        });
      }
      setCodeError("");
    }
  }, [open, isEdit, editingRecord]);

  // 当自动编码加载完成时更新表单
  useEffect(() => {
    if (!isEdit && nextCode && open) {
      setForm((prev) => ({ ...prev, code: nextCode }));
    }
  }, [nextCode, isEdit, open]);

  // 当产品分类改变时，自动重新获取对应前缀的编码，并处理医疗器械开关
  const handleProductCategoryChange = (value: string) => {
    const canBeMedical = value === "finished";
    setForm((prev) => ({
      ...prev,
      productCategory: value,
      isMedicalDevice: canBeMedical ? prev.isMedicalDevice : false,
    }));
    if (!isEdit) {
      setTimeout(() => refetchNextCode(), 50);
    }
  };

  // 编码重复检测
  useEffect(() => {
    if (checkResult?.exists) {
      setCodeError("该编码已存在，请修改");
    } else {
      setCodeError("");
    }
  }, [checkResult]);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => { toast.success("产品已创建"); onSuccess(); onOpenChange(false); },
    onError: (err) => toast.error("创建失败：" + err.message),
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => { toast.success("产品信息已更新"); onSuccess(); onOpenChange(false); },
    onError: (err) => toast.error("更新失败：" + err.message),
  });

  const buildPayload = (overrideStatus?: string) => ({
    isMedicalDevice: form.isMedicalDevice ?? true,
    isSterilized: form.isSterilized ?? false,
    code: form.code,
    name: form.name,
    specification: form.specification || undefined,
    category: form.category || undefined,
    productCategory: (form.productCategory as "finished" | "semi_finished" | "raw_material" | "auxiliary" | "other") || undefined,
    riskLevel: form.isMedicalDevice ? (form.riskLevel as "I" | "II" | "III" || undefined) : undefined,
    status: (overrideStatus || form.status || "draft") as "draft" | "active" | "discontinued",
    salePermission: (form.salePermission || "saleable") as "saleable" | "not_saleable",
    procurePermission: (form.procurePermission || "purchasable") as "purchasable" | "production_only",
    registrationNo: form.isMedicalDevice ? (form.registrationNo || undefined) : undefined,
    udiDi: form.isMedicalDevice ? (form.udiDi || undefined) : undefined,
    storageCondition: form.isMedicalDevice ? (form.storageCondition || undefined) : undefined,
    unit: form.unit || undefined,
    shelfLife: form.shelfLife ? Number(form.shelfLife) : undefined,
    description: form.description || undefined,
    manufacturer: DEFAULT_MANUFACTURER,
  });

  const handleSaveDraft = () => {
    if (!form.code) return toast.error("请填写产品编码");
    if (!form.name) return toast.error("请填写产品名称");
    if (codeError) return toast.error(codeError);
    const payload = buildPayload("draft");
    if (isEdit && editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSubmit = () => {
    if (!form.code) return toast.error("请填写产品编码");
    if (!form.name) return toast.error("请填写产品名称");
    if (!form.specification) return toast.error("请填写规格型号");
    if (!form.productCategory) return toast.error("请选择产品分类");
    if ((form.productCategory || "finished") === "finished" && !form.category) return toast.error("请选择产品属性");
    if (form.isMedicalDevice && !form.riskLevel) return toast.error("请选择风险等级");
    if (!form.salePermission) return toast.error("请选择销售权限");
    if (!form.procurePermission) return toast.error("请选择获取权限");
    if (codeError) return toast.error(codeError);
    const payload = buildPayload();
    if (isEdit && editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isMedical = form.isMedicalDevice ?? true;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑产品" : "新增产品"}</DialogTitle>
          <DialogDescription>{isEdit ? "修改产品信息" : "填写产品基本信息创建新产品"}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {/* 医疗器械开关 */}
          <div className="col-span-2 flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div>
              <Label className="text-sm font-medium">医疗器械产品</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                开启后显示注册证号、UDI编码、风险等级等专属字段
              </p>
            </div>
            <Switch
              checked={isMedical}
              onCheckedChange={(v) => set("isMedicalDevice", v)}
            />
          </div>

          <div className="col-span-2 flex items-center justify-between rounded-lg border p-3 bg-muted/20">
            <div>
              <Label className="text-sm font-medium">是否灭菌</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                用于生产与仓库后续筛选条件
              </p>
            </div>
            <Switch
              checked={!!form.isSterilized}
              onCheckedChange={(v) => set("isSterilized", v)}
            />
          </div>

          {/* 产品分类（决定编码前缀） */}
          <div className="space-y-1">
            <Label>产品分类 <span className="text-red-500">*</span></Label>
            <Select
              value={form.productCategory || "finished"}
              onValueChange={handleProductCategoryChange}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="finished">成品（CP）</SelectItem>
                <SelectItem value="semi_finished">半成品（BCP）</SelectItem>
                <SelectItem value="raw_material">原材料（YCL）</SelectItem>
                <SelectItem value="auxiliary">辅料（FL）</SelectItem>
                <SelectItem value="other">其他（QT）</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 产品编码（自动+可手动修改） */}
          <div className="space-y-1">
            <Label>产品编码 <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={form.code || ""}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder={`如：${getPrefix(form.productCategory || "finished")}-00001`}
                  className={codeError ? "border-red-500" : ""}
                />
                {codeError && <p className="text-xs text-red-500 mt-1">{codeError}</p>}
              </div>
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="重新生成编码"
                  onClick={() => refetchNextCode()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 产品名称 */}
          <div className="space-y-1">
            <Label>产品名称 <span className="text-red-500">*</span></Label>
            <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="请输入产品名称" />
          </div>

          {/* 规格型号 */}
          <div className="space-y-1">
            <Label>规格型号 <span className="text-red-500">*</span></Label>
            <Input value={form.specification || ""} onChange={(e) => set("specification", e.target.value)} placeholder="如：5ml、内径6mm×外径10mm" />
          </div>

          {/* 产品属性（仅成品） */}
          {(form.productCategory || "finished") === "finished" && (
            <div className="space-y-1">
              <Label>产品属性 <span className="text-red-500">*</span></Label>
              <Select value={form.category || ""} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="请选择产品属性" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nmpa">NMPA注册</SelectItem>
                  <SelectItem value="fda">FDA注册</SelectItem>
                  <SelectItem value="ce">CE注册</SelectItem>
                  <SelectItem value="oem">OEM代工</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 风险等级（仅医疗器械） */}
          {isMedical && (
            <div className="space-y-1">
              <Label>风险等级 <span className="text-red-500">*</span></Label>
              <Select value={form.riskLevel || ""} onValueChange={(v) => set("riskLevel", v)}>
                <SelectTrigger><SelectValue placeholder="请选择风险等级" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">I类（低风险）</SelectItem>
                  <SelectItem value="II">II类（中风险）</SelectItem>
                  <SelectItem value="III">III类（高风险）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 状态 */}
          <div className="space-y-1">
            <Label>状态 <span className="text-red-500">*</span></Label>
            <Select value={form.status || "draft"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue placeholder="请选择状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="active">已上市</SelectItem>
                <SelectItem value="discontinued">已停产</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 销售权限 */}
          <div className="space-y-1">
            <Label>销售权限 <span className="text-red-500">*</span></Label>
            <Select value={form.salePermission || "saleable"} onValueChange={(v) => set("salePermission", v)}>
              <SelectTrigger><SelectValue placeholder="请选择销售权限" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="saleable">销售</SelectItem>
                <SelectItem value="not_saleable">不销售</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 获取权限 */}
          <div className="space-y-1">
            <Label>获取权限 <span className="text-red-500">*</span></Label>
            <Select value={form.procurePermission || "purchasable"} onValueChange={(v) => set("procurePermission", v)}>
              <SelectTrigger><SelectValue placeholder="请选择获取权限" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="purchasable">采购</SelectItem>
                <SelectItem value="production_only">生产</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 注册证号（仅医疗器械） */}
          {isMedical && (
            <div className="space-y-1">
              <Label>注册证号</Label>
              <Input value={form.registrationNo || ""} onChange={(e) => set("registrationNo", e.target.value)} placeholder="如：国械注准20200001" />
            </div>
          )}

          {/* 注册证有效期（仅医疗器械） */}
          {isMedical && (
            <div className="space-y-1">
              <Label>注册证有效期</Label>
              <Input type="date" value={form.registrationExpiry || ""} onChange={(e) => set("registrationExpiry", e.target.value)} />
            </div>
          )}

          {/* UDI编码（仅医疗器械） */}
          {isMedical && (
            <div className="space-y-1">
              <Label>UDI编码</Label>
              <Input value={form.udiDi || ""} onChange={(e) => set("udiDi", e.target.value)} placeholder="唯一器械标识" />
            </div>
          )}

          {/* 计量单位 */}
          <div className="space-y-1">
            <Label>计量单位</Label>
            <Select value={form.unit || ""} onValueChange={(v) => set("unit", v)}>
              <SelectTrigger><SelectValue placeholder="请选择计量单位" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="支">支</SelectItem>
                <SelectItem value="只">只</SelectItem>
                <SelectItem value="双">双</SelectItem>
                <SelectItem value="副">副</SelectItem>
                <SelectItem value="套">套</SelectItem>
                <SelectItem value="盒">盒</SelectItem>
                <SelectItem value="箱">箱</SelectItem>
                <SelectItem value="包">包</SelectItem>
                <SelectItem value="袋">袋</SelectItem>
                <SelectItem value="瓶">瓶</SelectItem>
                <SelectItem value="根">根</SelectItem>
                <SelectItem value="条">条</SelectItem>
                <SelectItem value="片">片</SelectItem>
                <SelectItem value="张">张</SelectItem>
                <SelectItem value="块">块</SelectItem>
                <SelectItem value="个">个</SelectItem>
                <SelectItem value="米">米</SelectItem>
                <SelectItem value="厘米">厘米</SelectItem>
                <SelectItem value="毫米">毫米</SelectItem>
                <SelectItem value="千克">千克</SelectItem>
                <SelectItem value="克">克</SelectItem>
                <SelectItem value="毫升">毫升</SelectItem>
                <SelectItem value="升">升</SelectItem>
                <SelectItem value="卷">卷</SelectItem>
                <SelectItem value="批">批</SelectItem>
                <SelectItem value="辆">辆</SelectItem>
                <SelectItem value="台">台</SelectItem>
                <SelectItem value="套装">套装</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 保质期 */}
          <div className="space-y-1">
            <Label>保质期（月）</Label>
            <Input type="number" value={form.shelfLife || ""} onChange={(e) => set("shelfLife", e.target.value)} placeholder="如：36" />
          </div>

          {/* 储存条件（仅医疗器械） */}
          {isMedical && (
            <div className="col-span-2 space-y-1">
              <Label>储存条件</Label>
              <Input value={form.storageCondition || ""} onChange={(e) => set("storageCondition", e.target.value)} placeholder="如：常温、干燥、避光保存" />
            </div>
          )}

          {/* 产品描述 */}
          <div className="col-span-2 space-y-1">
            <Label>产品描述</Label>
            <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="请输入产品描述" rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button variant="secondary" onClick={handleSaveDraft} disabled={isLoading || !!codeError}>
            <FileText className="mr-2 h-4 w-4" />
            保存草稿
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !!codeError}>
            {isLoading ? "保存中..." : (isEdit ? "保存修改" : "创建产品")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Product | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Product | null>(null);

  const { data: productsData, isLoading, refetch } = trpc.products.list.useQuery({});
  const data: Product[] = (productsData || []) as Product[];

  // 草稿列表
  const drafts = data.filter((d: any) => d.status === "draft");
  const draftItems: DraftItem[] = drafts.map((d: any) => ({
    id: d.id,
    title: d.name || d.code,
    subtitle: d.code + (d.specification ? ` · ${d.specification}` : ""),
  }));

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => { toast.success("产品已删除"); refetch(); },
    onError: (err) => toast.error("删除失败：" + err.message),
  });

  const handleAdd = () => { setEditingRecord(null); setFormOpen(true); };
  const handleEdit = (record: Product) => { setEditingRecord(record); setFormOpen(true); };
  const handleView = (record: Product) => { setViewingRecord(record); setDetailOpen(true); };
  const handleDelete = (record: Product) => { deleteMutation.mutate({ id: record.id }); };

  // 草稿库操作
  const handleDraftEdit = (item: DraftItem) => {
    const record = data.find((d) => d.id === item.id);
    if (record) handleEdit(record);
  };
  const handleDraftDelete = (item: DraftItem) => {
    deleteMutation.mutate({ id: item.id as number });
  };

  const getDetailFields = (record: Product): DetailField[] => {
    const catCfg = productCategoryMap[record.productCategory || ""];
    const fields: DetailField[] = [
      { label: "产品编码", value: record.code },
      { label: "产品名称", value: record.name },
      { label: "规格型号", value: record.specification || "-" },
      {
        label: "产品类型",
        value: <Badge variant={record.isMedicalDevice ? "default" : "secondary"}>{record.isMedicalDevice ? "医疗器械" : "非医疗器械"}</Badge>,
      },
      {
        label: "是否灭菌",
        value: <Badge variant={record.isSterilized ? "default" : "secondary"}>{record.isSterilized ? "是" : "否"}</Badge>,
      },
      {
        label: "产品分类",
        value: catCfg ? (
          <span className={`px-2 py-1 rounded text-xs font-medium ${catCfg.color}`}>{catCfg.label}</span>
        ) : "-",
      },
      { label: "产品属性", value: <Badge variant="outline">{categoryMap[record.category || ""] || record.category || "-"}</Badge> },
      { label: "状态", value: <StatusBadge status={record.status} statusMap={statusMap} /> },
    ];

    if (record.isMedicalDevice) {
      fields.push(
        {
          label: "风险等级",
          value: (
            <span className={`px-2 py-1 rounded text-xs font-medium ${riskLevelMap[record.riskLevel || ""]?.color || ""}`}>
              {riskLevelMap[record.riskLevel || ""]?.label || record.riskLevel || "-"}
            </span>
          ),
        },
        { label: "注册证号", value: record.registrationNo || "-" },
        { label: "注册证有效期", value: record.registrationExpiry || "-" },
        { label: "UDI编码", value: record.udiDi || "-" },
        { label: "储存条件", value: record.storageCondition || "-", span: 2 },
      );
    }

     fields.push(
      { label: "生产企业", value: record.manufacturer || DEFAULT_MANUFACTURER },
      { label: "计量单位", value: record.unit || "-" },
      { label: "保质期", value: record.shelfLife ? `${record.shelfLife}个月` : "-" },
      {
        label: "销售权限",
        value: (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            (record as any).salePermission === "saleable"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}>
            {(record as any).salePermission === "saleable" ? "销售" : "不销售"}
          </span>
        ),
      },
      {
        label: "获取权限",
        value: (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            (record as any).procurePermission === "purchasable"
              ? "bg-blue-100 text-blue-800"
              : "bg-purple-100 text-purple-800"
          }`}>
            {(record as any).procurePermission === "purchasable" ? "采购" : "生产"}
          </span>
        ),
      },
      { label: "产品描述", value: record.description || "-", span: 2 },
    );
    return fields;
  };

  return (
    <>
      <ModulePage
        title="产品管理"
        description="作为整个ERP系统的数据源头，精确定义产品的所有属性"
        icon={Package}
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="搜索产品编码、名称..."
        addButtonText="新增产品"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        filterOptions={[
          { label: "已上市", value: "active" },
          { label: "草稿", value: "draft" },
          { label: "已停产", value: "discontinued" },
        ]}
        headerActions={
          <DraftDrawer
            count={draftItems.length}
            drafts={draftItems}
            moduleName="产品"
            onEdit={handleDraftEdit}
            onDelete={handleDraftDelete}
            loading={isLoading}
          />
        }
        stats={[
          { label: "产品总数", value: data.length },
          { label: "已上市", value: data.filter((d: any) => d.status === "active").length, color: "text-green-600" },
          { label: "医疗器械", value: data.filter((d: any) => d.isMedicalDevice).length, color: "text-blue-600" },
          { label: "已灭菌", value: data.filter((d: any) => d.isSterilized).length, color: "text-cyan-600" },
        ]}
      />

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingRecord={editingRecord}
        onSuccess={refetch}
      />

      {viewingRecord && (
        <DetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title={`产品详情 - ${viewingRecord.name}`}
          fields={getDetailFields(viewingRecord)}
          columns={3}
          actions={
            <Button variant="outline" onClick={() => { setDetailOpen(false); handleEdit(viewingRecord); }}>
              编辑产品
            </Button>
          }
        />
      )}
    </>
  );
}
