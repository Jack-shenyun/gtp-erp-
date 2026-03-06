import { useState } from "react";
import { DraggableDialog, DraggableDialogContent } from "@/components/DraggableDialog";
import ERPLayout from "@/components/ERPLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Boxes,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  AlertTriangle,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import { trpc } from "@/lib/trpc";

const statusMap: Record<string, any> = {
  qualified: { label: "正常", variant: "default" as const },
  quarantine: { label: "待检", variant: "secondary" as const },
  unqualified: { label: "不合格", variant: "destructive" as const },
  reserved: { label: "预留", variant: "outline" as const },
};

// 根据数量和安全库存计算显示状态
function calcDisplayStatus(quantity: number, safetyStock: number) {
  if (!safetyStock || safetyStock <= 0) return "normal";
  if (quantity < safetyStock * 0.5) return "warning";
  if (quantity < safetyStock) return "low";
  return "normal";
}

const units = ["kg", "g", "m", "个", "支", "盒", "箱", "卷", "套", "片"];

const warehouseTypeMap: Record<string, string> = {
  raw_material: "原材料仓",
  semi_finished: "半成品仓",
  finished: "成品仓",
  quarantine: "待检仓",
};

export default function InventoryPage() {
  const { canDelete } = usePermission();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<"in" | "out">("in");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const [formData, setFormData] = useState({
    productId: "",
    materialCode: "",
    itemName: "",
    batchNo: "",
    warehouseId: "",
    location: "",
    quantity: "",
    unit: "kg",
    safetyStock: "",
    expiryDate: "",
    status: "qualified" as "qualified" | "quarantine" | "unqualified" | "reserved",
    remark: "",
  });

  // 获取仓库列表
  const { data: warehouseList = [] } = trpc.warehouses.list.useQuery({ status: "active" });
  const { data: products = [] } = trpc.products.list.useQuery({ limit: 1000 });

  // 获取库存列表
  const { data: inventoryList = [], refetch } = trpc.inventory.list.useQuery({
    search: searchTerm || undefined,
    warehouseId: warehouseFilter !== "all" ? Number(warehouseFilter) : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => { toast.success("库存记录创建成功"); refetch(); setDialogOpen(false); },
    onError: (e) => toast.error("创建失败", { description: e.message }),
  });

  const updateMutation = trpc.inventory.update.useMutation({
    onSuccess: () => { toast.success("库存信息已更新"); refetch(); setDialogOpen(false); },
    onError: (e) => toast.error("更新失败", { description: e.message }),
  });

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => { toast.success("库存记录已删除"); refetch(); },
    onError: (e) => toast.error("删除失败", { description: e.message }),
  });

  // 库存调整（创建 inventoryTransaction + 更新 inventory）
  const createTxMutation = trpc.inventoryTransactions.create.useMutation({
    onSuccess: () => { toast.success(`库存${adjustType === "in" ? "调入" : "调出"}成功`); refetch(); setAdjustDialogOpen(false); },
    onError: (e) => toast.error("调整失败", { description: e.message }),
  });
  const updateForAdjust = trpc.inventory.update.useMutation({
    onError: (e) => console.warn("更新库存数量失败:", e.message),
  });

  const filteredInventory = inventoryList.filter((item: any) => {
    const matchesSearch =
      !searchTerm ||
      (item.materialCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.itemName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesWarehouse = warehouseFilter === "all" || String(item.warehouseId) === warehouseFilter;
    return matchesSearch && matchesStatus && matchesWarehouse;
  });

  const filteredProducts = (products || []).filter((p: any) => {
    const kw = materialSearch.trim().toLowerCase();
    if (!kw) return true;
    return (
      String(p.code || "").toLowerCase().includes(kw) ||
      String(p.name || "").toLowerCase().includes(kw) ||
      String(p.specification || "").toLowerCase().includes(kw)
    );
  });

  const pickProduct = (product: any) => {
    setFormData((prev) => ({
      ...prev,
      productId: String(product.id),
      materialCode: product.code || "",
      itemName: product.name || "",
      unit: product.unit || prev.unit || "kg",
    }));
    setMaterialPickerOpen(false);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      productId: "",
      materialCode: "",
      itemName: "",
      batchNo: "",
      warehouseId: warehouseList[0]?.id ? String(warehouseList[0].id) : "",
      location: "",
      quantity: "",
      unit: "kg",
      safetyStock: "",
      expiryDate: "",
      status: "qualified",
      remark: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      productId: item.productId ? String(item.productId) : "",
      materialCode: item.materialCode || "",
      itemName: item.itemName || "",
      batchNo: item.batchNo || "",
      warehouseId: String(item.warehouseId || ""),
      location: item.location || "",
      quantity: String(item.quantity || ""),
      unit: item.unit || "kg",
      safetyStock: String(item.safetyStock || ""),
      expiryDate: item.expiryDate ? String(item.expiryDate).split("T")[0] : "",
      status: item.status || "qualified",
      remark: item.remark || "",
    });
    setDialogOpen(true);
  };

  const handleView = (item: any) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  const handleDelete = (item: any) => {
    if (!canDelete) {
      toast.error("您没有删除权限", { description: "只有管理员可以删除库存记录" });
      return;
    }
    deleteMutation.mutate({ id: item.id });
  };

  const handleAdjust = (item: any) => {
    setAdjustingItem(item);
    setAdjustType("in");
    setAdjustQuantity("");
    setAdjustReason("");
    setAdjustDialogOpen(true);
  };

  const handleConfirmAdjust = () => {
    if (!adjustingItem) return;
    const qty = parseFloat(adjustQuantity) || 0;
    if (qty <= 0) { toast.error("请输入有效的调整数量"); return; }
    if (!adjustReason) { toast.error("请填写调整原因"); return; }

    const currentQty = parseFloat(String(adjustingItem.quantity)) || 0;
    const newQty = adjustType === "in" ? currentQty + qty : Math.max(0, currentQty - qty);

    // 先更新库存数量
    updateForAdjust.mutate({
      id: adjustingItem.id,
      data: { quantity: String(newQty) },
    });

    // 再记录出入库流水
    createTxMutation.mutate({
      warehouseId: adjustingItem.warehouseId,
      inventoryId: adjustingItem.id,
      productId: adjustingItem.productId || undefined,
      type: adjustType === "in" ? "other_in" : "other_out",
      itemName: adjustingItem.itemName,
      batchNo: adjustingItem.batchNo || undefined,
      quantity: String(qty),
      unit: adjustingItem.unit || undefined,
      beforeQty: String(currentQty),
      afterQty: String(newQty),
      remark: adjustReason,
    });
  };

  const handleSubmit = () => {
    if (!formData.itemName) {
      toast.error("请填写必填项", { description: "物料名称为必填" });
      return;
    }
    if (!formData.warehouseId) {
      toast.error("请选择仓库");
      return;
    }

    const payload = {
      warehouseId: Number(formData.warehouseId),
      productId: formData.productId ? Number(formData.productId) : undefined,
      materialCode: formData.materialCode || undefined,
      itemName: formData.itemName,
      batchNo: formData.batchNo || undefined,
      location: formData.location || undefined,
      quantity: formData.quantity || "0",
      unit: formData.unit || undefined,
      safetyStock: formData.safetyStock || undefined,
      expiryDate: formData.expiryDate || undefined,
      status: formData.status,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getWarehouseName = (warehouseId: number) => {
    const wh = warehouseList.find((w: any) => w.id === warehouseId);
    return wh ? wh.name : `仓库${warehouseId}`;
  };

  const normalCount = filteredInventory.filter((i: any) => i.status === "qualified").length;
  const quarantineCount = filteredInventory.filter((i: any) => i.status === "quarantine").length;
  const unqualifiedCount = filteredInventory.filter((i: any) => i.status === "unqualified").length;

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Boxes className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">库存台账</h2>
              <p className="text-sm text-muted-foreground">实时监控库存状态，支持安全库存预警和库存分析</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              刷新
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              新增库存
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">库存总数</p>
              <p className="text-2xl font-bold">{filteredInventory.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">合格品</p>
              <p className="text-2xl font-bold text-green-600">{normalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">待检品</p>
              <p className="text-2xl font-bold text-amber-600">{quarantineCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-2">
              <div>
                <p className="text-sm text-muted-foreground">不合格品</p>
                <p className="text-2xl font-bold text-red-600">{unqualifiedCount}</p>
              </div>
              {unqualifiedCount > 0 && <AlertTriangle className="h-5 w-5 text-red-500 ml-auto" />}
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索物料编码、物料名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="qualified">合格品</SelectItem>
              <SelectItem value="quarantine">待检品</SelectItem>
              <SelectItem value="unqualified">不合格品</SelectItem>
              <SelectItem value="reserved">预留</SelectItem>
            </SelectContent>
          </Select>
          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="仓库筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部仓库</SelectItem>
              {warehouseList.map((w: any) => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 库存表格 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>物料编码</TableHead>
                  <TableHead>物料名称</TableHead>
                  <TableHead>批次号</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead>库位</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      库存数量 <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>安全库存</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      暂无库存记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item: any) => {
                    const qty = parseFloat(String(item.quantity)) || 0;
                    const safetyQty = parseFloat(String(item.safetyStock)) || 0;
                    const displayStatus = calcDisplayStatus(qty, safetyQty);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.materialCode || "-"}</TableCell>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="text-sm">{item.batchNo || "-"}</TableCell>
                        <TableCell className="text-sm">{getWarehouseName(item.warehouseId)}</TableCell>
                        <TableCell className="text-sm">{item.location || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`font-medium ${displayStatus === "warning" ? "text-red-600" : displayStatus === "low" ? "text-amber-600" : ""}`}>
                              {qty?.toLocaleString?.() ?? "0"} {item.unit || ""}
                            </span>
                            {safetyQty > 0 && (
                              <Progress
                                value={Math.min((qty / safetyQty) * 100, 100)}
                                className="h-1 w-16"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {safetyQty > 0 ? `${safetyQty?.toLocaleString?.() ?? "0"} ${item.unit || ""}` : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.expiryDate ? String(item.expiryDate).split("T")[0] : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusMap[item.status as keyof typeof statusMap]?.variant || "outline"}>
                            {statusMap[item.status as keyof typeof statusMap]?.label || item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(item)}>
                                <Eye className="h-4 w-4 mr-2" />查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAdjust(item)}>
                                <ArrowUpDown className="h-4 w-4 mr-2" />库存调整
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Edit className="h-4 w-4 mr-2" />编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 新增/编辑对话框 */}
        <DraggableDialog open={dialogOpen} onOpenChange={setDialogOpen} className="max-w-2xl">
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "编辑库存记录" : "新增库存记录"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "修改库存信息" : "填写新库存记录信息"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>物料编码</Label>
                  <Input
                    value={formData.materialCode}
                    readOnly
                    placeholder="物料编码"
                  />
                </div>
                <div className="space-y-2">
                  <Label>物料名称 *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.itemName}
                      readOnly
                      placeholder="请选择物料"
                    />
                    <Button variant="outline" onClick={() => setMaterialPickerOpen(true)}>
                      选择物料
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>批次号</Label>
                  <Input
                    value={formData.batchNo}
                    onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                    placeholder="批次号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>仓库 *</Label>
                  <Select
                    value={formData.warehouseId}
                    onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseList.map((w: any) => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>库位</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="如 A-01-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>当前库存</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="库存数量"
                  />
                </div>
                <div className="space-y-2">
                  <Label>单位</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u: any) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>安全库存</Label>
                  <Input
                    type="number"
                    value={formData.safetyStock}
                    onChange={(e) => setFormData({ ...formData, safetyStock: e.target.value })}
                    placeholder="安全库存数量"
                  />
                </div>
                <div className="space-y-2">
                  <Label>有效期</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualified">合格品</SelectItem>
                      <SelectItem value="quarantine">待检品</SelectItem>
                      <SelectItem value="unqualified">不合格品</SelectItem>
                      <SelectItem value="reserved">预留</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingItem ? "保存修改" : "创建记录"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 物料选择弹窗（支持筛选） */}
        <DraggableDialog open={materialPickerOpen} onOpenChange={setMaterialPickerOpen} className="max-w-4xl">
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>选择物料</DialogTitle>
              <DialogDescription>可按物料编码、名称、规格快速筛选</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  placeholder="搜索编码/名称/规格..."
                  className="pl-9"
                />
              </div>
              <div className="max-h-[420px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">物料编码</TableHead>
                      <TableHead>物料名称</TableHead>
                      <TableHead className="w-[180px]">规格</TableHead>
                      <TableHead className="w-[90px]">单位</TableHead>
                      <TableHead className="w-[90px]">医疗器械</TableHead>
                      <TableHead className="w-[90px]">是否灭菌</TableHead>
                      <TableHead className="w-[90px] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          未找到匹配物料
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.code || "-"}</TableCell>
                          <TableCell className="font-medium">{p.name || "-"}</TableCell>
                          <TableCell>{p.specification || "-"}</TableCell>
                          <TableCell>{p.unit || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={p.isMedicalDevice ? "default" : "secondary"}>
                              {p.isMedicalDevice ? "是" : "否"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.isSterilized ? "default" : "secondary"}>
                              {p.isSterilized ? "是" : "否"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => pickProduct(p)}>
                              <Check className="h-3.5 w-3.5 mr-1" />
                              选择
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMaterialPickerOpen(false)}>关闭</Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 库存调整对话框 */}
        <DraggableDialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>库存调整</DialogTitle>
              <DialogDescription>
                {adjustingItem?.materialCode} - {adjustingItem?.itemName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">当前库存</span>
                <span className="font-medium">
                  {parseFloat(String(adjustingItem?.quantity || 0))?.toLocaleString?.() ?? "0"} {adjustingItem?.unit}
                </span>
              </div>

              <div className="space-y-2">
                <Label>调整类型</Label>
                <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "in" | "out")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">调入（增加库存）</SelectItem>
                    <SelectItem value="out">调出（减少库存）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>调整数量 *</Label>
                <Input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder={`输入${adjustType === "in" ? "调入" : "调出"}数量`}
                />
              </div>

              <div className="space-y-2">
                <Label>调整原因 *</Label>
                <Textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="请填写调整原因"
                  rows={2}
                />
              </div>

              {adjustQuantity && (
                <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">调整后库存</span>
                  <span className="font-medium">
                    {(adjustType === "in"
                      ? (parseFloat(String(adjustingItem?.quantity || 0))) + (parseFloat(adjustQuantity) || 0)
                      : Math.max(0, (parseFloat(String(adjustingItem?.quantity || 0))) - (parseFloat(adjustQuantity) || 0))
                    )?.toLocaleString?.() ?? "0"} {adjustingItem?.unit}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>取消</Button>
              <Button
                onClick={handleConfirmAdjust}
                disabled={createTxMutation.isPending}
              >
                确认调整
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情对话框 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>库存详情</DialogTitle>
              <DialogDescription>{viewingItem?.materialCode}</DialogDescription>
            </DialogHeader>
            {viewingItem && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{viewingItem.itemName}</h3>
                    <p className="text-sm text-muted-foreground">{viewingItem.batchNo || "无批次号"}</p>
                  </div>
                  <Badge variant={statusMap[viewingItem.status as keyof typeof statusMap]?.variant || "outline"}>
                    {statusMap[viewingItem.status as keyof typeof statusMap]?.label || viewingItem.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>当前库存</span>
                    <span className="font-medium">
                      {parseFloat(String(viewingItem.quantity || 0))?.toLocaleString?.() ?? "0"} {viewingItem.unit}
                    </span>
                  </div>
                  {viewingItem.safetyStock && parseFloat(String(viewingItem.safetyStock)) > 0 && (
                    <>
                      <Progress
                        value={Math.min((parseFloat(String(viewingItem.quantity)) / parseFloat(String(viewingItem.safetyStock))) * 100, 100)}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>安全库存: {parseFloat(String(viewingItem.safetyStock))?.toLocaleString?.() ?? "0"}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">仓库</p>
                    <p className="font-medium">{getWarehouseName(viewingItem.warehouseId)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">库位</p>
                    <p className="font-medium">{viewingItem.location || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">有效期</p>
                    <p className="font-medium">{viewingItem.expiryDate ? String(viewingItem.expiryDate).split("T")[0] : "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">物料编码</p>
                    <p className="font-medium font-mono">{viewingItem.materialCode || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">批次号</p>
                    <p className="font-medium">{viewingItem.batchNo || "-"}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>关闭</Button>
              <Button onClick={() => {
                setViewDialogOpen(false);
                if (viewingItem) handleAdjust(viewingItem);
              }}>
                库存调整
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>
      </div>
    </ERPLayout>
  );
}
