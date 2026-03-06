import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { DraggableDialog, DraggableDialogContent } from "@/components/DraggableDialog";
import ERPLayout from "@/components/ERPLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Warehouse, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, CheckCircle, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

const statusMap: Record<string, { label: string; variant: "outline" | "default" | "secondary" | "destructive" }> = {
  draft:     { label: "草稿",   variant: "outline" },
  pending:   { label: "待审批", variant: "default" },
  approved:  { label: "已审批", variant: "secondary" },
  completed: { label: "已入库", variant: "secondary" },
  rejected:  { label: "已拒绝", variant: "destructive" },
};

export default function ProductionWarehouseEntryPage() {
  const { canDelete } = usePermission();
  const { data: entries = [], isLoading, refetch } = trpc.productionWarehouseEntries.list.useQuery({});
  const { data: productionOrders = [] } = trpc.productionOrders.list.useQuery({});
  const { data: sterilizationOrders = [] } = trpc.sterilizationOrders.list.useQuery({});
  const { data: warehouseList = [] } = trpc.warehouses.list.useQuery({});
  const { data: products = [] } = trpc.products.list.useQuery({});

  const createMutation = trpc.productionWarehouseEntries.create.useMutation({
    onSuccess: () => { refetch(); toast.success("入库申请已创建"); setDialogOpen(false); },
    onError: (e) => toast.error("创建失败", { description: e.message }),
  });
  const updateMutation = trpc.productionWarehouseEntries.update.useMutation({
    onSuccess: () => { refetch(); toast.success("入库申请已更新"); setDialogOpen(false); },
    onError: (e) => toast.error("更新失败", { description: e.message }),
  });
  const deleteMutation = trpc.productionWarehouseEntries.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("入库申请已删除"); },
    onError: (e) => toast.error("删除失败", { description: e.message }),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [viewingEntry, setViewingEntry] = useState<any>(null);
  const focusHandledRef = useRef(false);

  const [formData, setFormData] = useState({
    entryNo: "",
    productionOrderId: "",
    productionOrderNo: "",
    sterilizationOrderId: "",
    sterilizationOrderNo: "",
    productId: "",
    productName: "",
    batchNo: "",
    quantity: "",
    unit: "件",
    targetWarehouseId: "",
    applicationDate: "",
    remark: "",
  });

  const filteredEntries = (entries as any[]).filter((e) => {
    const matchSearch = !searchTerm ||
      String(e.entryNo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(e.productName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(e.batchNo ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const genNo = () => {
    const now = new Date();
    return `WE-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Date.now()).slice(-4)}`;
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setFormData({
      entryNo: genNo(),
      productionOrderId: "",
      productionOrderNo: "",
      sterilizationOrderId: "",
      sterilizationOrderNo: "",
      productId: "",
      productName: "",
      batchNo: "",
      quantity: "",
      unit: "件",
      targetWarehouseId: "",
      applicationDate: new Date().toISOString().split("T")[0],
      remark: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      entryNo: entry.entryNo,
      productionOrderId: entry.productionOrderId ? String(entry.productionOrderId) : "",
      productionOrderNo: entry.productionOrderNo || "",
      sterilizationOrderId: entry.sterilizationOrderId ? String(entry.sterilizationOrderId) : "",
      sterilizationOrderNo: entry.sterilizationOrderNo || "",
      productId: entry.productId ? String(entry.productId) : "",
      productName: entry.productName || "",
      batchNo: entry.batchNo || "",
      quantity: entry.quantity || "",
      unit: entry.unit || "件",
      targetWarehouseId: entry.targetWarehouseId ? String(entry.targetWarehouseId) : "",
      applicationDate: entry.applicationDate ? String(entry.applicationDate).split("T")[0] : "",
      remark: entry.remark || "",
    });
    setDialogOpen(true);
  };

  const handleView = (entry: any) => {
    setViewingEntry(entry);
    setViewDialogOpen(true);
  };

  const handleDelete = (entry: any) => {
    if (!canDelete) { toast.error("您没有删除权限"); return; }
    deleteMutation.mutate({ id: entry.id });
  };

  const handleProductionOrderChange = (poId: string) => {
    const po = (productionOrders as any[]).find((p) => String(p.id) === poId);
    setFormData((f) => ({
      ...f,
      productionOrderId: poId,
      productionOrderNo: po?.orderNo || "",
      productId: po?.productId ? String(po.productId) : f.productId,
      batchNo: po?.batchNo || f.batchNo,
      quantity: po?.plannedQty || f.quantity,
    }));
  };

  const handleSterilizationOrderChange = (soId: string) => {
    const so = (sterilizationOrders as any[]).find((s) => String(s.id) === soId);
    setFormData((f) => ({
      ...f,
      sterilizationOrderId: soId,
      sterilizationOrderNo: so?.orderNo || "",
      productName: so?.productName || f.productName,
      batchNo: so?.batchNo || f.batchNo,
      quantity: so?.quantity || f.quantity,
      unit: so?.unit || f.unit,
    }));
  };

  const handleProductChange = (productId: string) => {
    const product = (products as any[]).find((p) => String(p.id) === productId);
    setFormData((f) => ({ ...f, productId, productName: product?.name || "" }));
  };

  const handleSubmit = () => {
    if (!formData.entryNo || !formData.quantity) {
      toast.error("请填写必填项", { description: "入库单号和数量为必填" });
      return;
    }
    const payload = {
      entryNo: formData.entryNo,
      productionOrderId: formData.productionOrderId ? Number(formData.productionOrderId) : undefined,
      productionOrderNo: formData.productionOrderNo || undefined,
      sterilizationOrderId: formData.sterilizationOrderId ? Number(formData.sterilizationOrderId) : undefined,
      sterilizationOrderNo: formData.sterilizationOrderNo || undefined,
      productId: formData.productId ? Number(formData.productId) : undefined,
      productName: formData.productName || undefined,
      batchNo: formData.batchNo || undefined,
      quantity: formData.quantity,
      unit: formData.unit || undefined,
      targetWarehouseId: formData.targetWarehouseId ? Number(formData.targetWarehouseId) : undefined,
      applicationDate: formData.applicationDate || undefined,
      status: "draft" as const,
      remark: formData.remark || undefined,
    };
    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        data: {
          quantity: payload.quantity,
          targetWarehouseId: payload.targetWarehouseId,
          remark: payload.remark,
        },
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const draftCount = (entries as any[]).filter((e) => e.status === "draft").length;
  const pendingCount = (entries as any[]).filter((e) => e.status === "pending").length;
  const completedCount = (entries as any[]).filter((e) => e.status === "completed").length;

  useEffect(() => {
    if (focusHandledRef.current) return;
    const raw = new URLSearchParams(window.location.search).get("focusId");
    const focusId = Number(raw);
    if (!Number.isFinite(focusId) || focusId <= 0) return;
    const entry = (entries as any[]).find((item: any) => Number(item?.id) === focusId);
    if (!entry) return;
    focusHandledRef.current = true;
    handleView(entry);
    const next = new URL(window.location.href);
    next.searchParams.delete("focusId");
    window.history.replaceState({}, "", `${next.pathname}${next.search}`);
  }, [entries]);

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">生产入库申请</h2>
              <p className="text-sm text-muted-foreground">生产完成（含灭菌合格）后的成品入库申请，审批通过后完成入库</p>
            </div>
          </div>
          <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />新建入库申请</Button>
        </div>

        <div className="grid gap-4 grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">草稿/待审批</p><p className="text-2xl font-bold text-amber-600">{draftCount + pendingCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">已入库</p><p className="text-2xl font-bold text-green-600">{completedCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">总申请数</p><p className="text-2xl font-bold">{(entries as any[]).length}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索入库单号、产品名称、批号..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[130px]"><SelectValue placeholder="状态筛选" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="pending">待审批</SelectItem>
                  <SelectItem value="approved">已审批</SelectItem>
                  <SelectItem value="completed">已入库</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>入库单号</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>批号</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead>目标仓库</TableHead>
                  <TableHead>关联灭菌单</TableHead>
                  <TableHead>申请日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
                ) : filteredEntries.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">暂无入库申请</TableCell></TableRow>
                ) : filteredEntries.map((entry: any) => {
                  const warehouse = (warehouseList as any[]).find((w) => w.id === entry.targetWarehouseId);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.entryNo}</TableCell>
                      <TableCell>{entry.productName || "-"}</TableCell>
                      <TableCell>{entry.batchNo || "-"}</TableCell>
                      <TableCell className="text-right">{entry.quantity} {entry.unit}</TableCell>
                      <TableCell>{warehouse?.name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.sterilizationOrderNo || "-"}</TableCell>
                      <TableCell>{entry.applicationDate ? String(entry.applicationDate).split("T")[0] : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[entry.status]?.variant || "outline"}>
                          {statusMap[entry.status]?.label || entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(entry)}><Eye className="h-4 w-4 mr-2" />查看详情</DropdownMenuItem>
                            {entry.status === "draft" && (
                              <>
                                <DropdownMenuItem onClick={() => handleEdit(entry)}><Edit className="h-4 w-4 mr-2" />编辑</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: entry.id, data: { status: "pending" } })}>
                                  <CheckCircle className="h-4 w-4 mr-2" />提交审批
                                </DropdownMenuItem>
                              </>
                            )}
                            {entry.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: entry.id, data: { status: "approved" } })}>
                                  <CheckCircle className="h-4 w-4 mr-2" />审批通过
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: entry.id, data: { status: "rejected" } })} className="text-destructive">
                                  <XCircle className="h-4 w-4 mr-2" />拒绝
                                </DropdownMenuItem>
                              </>
                            )}
                            {entry.status === "approved" && (
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: entry.id, data: { status: "completed" } })}>
                                <Warehouse className="h-4 w-4 mr-2" />确认入库
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem onClick={() => handleDelete(entry)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />删除
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 新建/编辑对话框 */}
        <DraggableDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DraggableDialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "编辑入库申请" : "新建生产入库申请"}</DialogTitle>
              <DialogDescription>生产完成或灭菌合格后申请成品入库</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>入库单号 *</Label>
                  <Input value={formData.entryNo} onChange={(e) => setFormData({ ...formData, entryNo: e.target.value })} readOnly={!!editingEntry} />
                </div>
                <div className="space-y-2">
                  <Label>申请日期</Label>
                  <Input type="date" value={formData.applicationDate} onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>关联生产任务</Label>
                  <Select
                    value={formData.productionOrderId || "__NONE__"}
                    onValueChange={(v) => handleProductionOrderChange(v === "__NONE__" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="选择生产任务" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">不关联</SelectItem>
                      {(productionOrders as any[]).map((po: any) => (
                        <SelectItem key={po.id} value={String(po.id)}>{po.orderNo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>关联灭菌单（如有）</Label>
                  <Select
                    value={formData.sterilizationOrderId || "__NONE__"}
                    onValueChange={(v) => handleSterilizationOrderChange(v === "__NONE__" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="选择灭菌单" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">不关联</SelectItem>
                      {(sterilizationOrders as any[]).filter((s: any) => s.status === "qualified").map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.orderNo} - {s.productName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>产品</Label>
                  <Select value={formData.productId} onValueChange={handleProductChange}>
                    <SelectTrigger><SelectValue placeholder="选择产品" /></SelectTrigger>
                    <SelectContent>
                      {(products as any[]).map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>批号</Label>
                  <Input value={formData.batchNo} onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })} placeholder="生产批号" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>入库数量 *</Label>
                  <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>单位</Label>
                  <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>目标仓库</Label>
                  <Select value={formData.targetWarehouseId} onValueChange={(v) => setFormData({ ...formData, targetWarehouseId: v })}>
                    <SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger>
                    <SelectContent>
                      {(warehouseList as any[]).map((w: any) => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingEntry ? "保存修改" : "创建入库申请"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>入库申请详情</DialogTitle>
              <DialogDescription>{viewingEntry?.entryNo}</DialogDescription>
            </DialogHeader>
            {viewingEntry && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{viewingEntry.productName || "-"}</p>
                    <p className="text-sm text-muted-foreground">批号：{viewingEntry.batchNo || "-"}</p>
                  </div>
                  <Badge variant={statusMap[viewingEntry.status]?.variant || "outline"}>
                    {statusMap[viewingEntry.status]?.label || viewingEntry.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">入库数量</p><p className="font-medium">{viewingEntry.quantity} {viewingEntry.unit}</p></div>
                  <div><p className="text-muted-foreground">目标仓库</p><p className="font-medium">{(warehouseList as any[]).find((w: any) => w.id === viewingEntry.targetWarehouseId)?.name || "-"}</p></div>
                  <div><p className="text-muted-foreground">关联生产任务</p><p className="font-medium">{viewingEntry.productionOrderNo || "-"}</p></div>
                  <div><p className="text-muted-foreground">关联灭菌单</p><p className="font-medium">{viewingEntry.sterilizationOrderNo || "-"}</p></div>
                  <div><p className="text-muted-foreground">申请日期</p><p className="font-medium">{viewingEntry.applicationDate ? String(viewingEntry.applicationDate).split("T")[0] : "-"}</p></div>
                </div>
                {viewingEntry.remark && (
                  <div><p className="text-sm text-muted-foreground mb-1">备注</p><p className="text-sm">{viewingEntry.remark}</p></div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>关闭</Button>
              {viewingEntry?.status === "draft" && (
                <Button onClick={() => { setViewDialogOpen(false); if (viewingEntry) handleEdit(viewingEntry); }}>编辑</Button>
              )}
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>
      </div>
    </ERPLayout>
  );
}
