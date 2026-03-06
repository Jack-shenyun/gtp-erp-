import { useState } from "react";
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
  ClipboardList, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, CheckCircle, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

const statusMap: Record<string, { label: string; variant: "outline" | "default" | "secondary" | "destructive" }> = {
  in_progress: { label: "生产中", variant: "default" },
  completed:   { label: "已完成", variant: "secondary" },
  abnormal:    { label: "异常",   variant: "destructive" },
};

export default function ProductionRecordPage() {
  const { canDelete } = usePermission();
  const { data: records = [], isLoading, refetch } = trpc.productionRecords.list.useQuery({});
  const { data: productionOrders = [] } = trpc.productionOrders.list.useQuery({});
  const { data: products = [] } = trpc.products.list.useQuery({});

  const createMutation = trpc.productionRecords.create.useMutation({
    onSuccess: () => { refetch(); toast.success("生产记录单已创建"); setDialogOpen(false); },
    onError: (e) => toast.error("创建失败", { description: e.message }),
  });
  const updateMutation = trpc.productionRecords.update.useMutation({
    onSuccess: () => { refetch(); toast.success("记录已更新"); setDialogOpen(false); },
    onError: (e) => toast.error("更新失败", { description: e.message }),
  });
  const deleteMutation = trpc.productionRecords.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("记录已删除"); },
    onError: (e) => toast.error("删除失败", { description: e.message }),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);

  const [formData, setFormData] = useState({
    recordNo: "",
    productionOrderId: "",
    productionOrderNo: "",
    productId: "",
    productName: "",
    batchNo: "",
    workstationName: "",
    recordDate: "",
    plannedQty: "",
    actualQty: "",
    scrapQty: "0",
    status: "in_progress" as "in_progress" | "completed" | "abnormal",
    remark: "",
  });

  const filteredRecords = (records as any[]).filter((r) => {
    const matchSearch = !searchTerm ||
      String(r.recordNo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.productName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.batchNo ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const genNo = () => {
    const now = new Date();
    return `PR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Date.now()).slice(-4)}`;
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setFormData({
      recordNo: genNo(),
      productionOrderId: "",
      productionOrderNo: "",
      productId: "",
      productName: "",
      batchNo: "",
      workstationName: "",
      recordDate: new Date().toISOString().split("T")[0],
      plannedQty: "",
      actualQty: "",
      scrapQty: "0",
      status: "in_progress",
      remark: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({
      recordNo: record.recordNo,
      productionOrderId: record.productionOrderId ? String(record.productionOrderId) : "",
      productionOrderNo: record.productionOrderNo || "",
      productId: record.productId ? String(record.productId) : "",
      productName: record.productName || "",
      batchNo: record.batchNo || "",
      workstationName: record.workstationName || "",
      recordDate: record.recordDate ? String(record.recordDate).split("T")[0] : "",
      plannedQty: record.plannedQty || "",
      actualQty: record.actualQty || "",
      scrapQty: record.scrapQty || "0",
      status: record.status || "in_progress",
      remark: record.remark || "",
    });
    setDialogOpen(true);
  };

  const handleView = (record: any) => {
    setViewingRecord(record);
    setViewDialogOpen(true);
  };

  const handleDelete = (record: any) => {
    if (!canDelete) { toast.error("您没有删除权限"); return; }
    deleteMutation.mutate({ id: record.id });
  };

  const handleProductionOrderChange = (poId: string) => {
    const po = (productionOrders as any[]).find((p) => String(p.id) === poId);
    setFormData((f) => ({
      ...f,
      productionOrderId: poId,
      productionOrderNo: po?.orderNo || "",
      productId: po?.productId ? String(po.productId) : f.productId,
      batchNo: po?.batchNo || f.batchNo,
      plannedQty: po?.plannedQty || f.plannedQty,
    }));
  };

  const handleProductChange = (productId: string) => {
    const product = (products as any[]).find((p) => String(p.id) === productId);
    setFormData((f) => ({ ...f, productId, productName: product?.name || "" }));
  };

  const handleSubmit = () => {
    if (!formData.recordNo) {
      toast.error("请填写记录单号");
      return;
    }
    const payload = {
      recordNo: formData.recordNo,
      productionOrderId: formData.productionOrderId ? Number(formData.productionOrderId) : undefined,
      productionOrderNo: formData.productionOrderNo || undefined,
      productId: formData.productId ? Number(formData.productId) : undefined,
      productName: formData.productName || undefined,
      batchNo: formData.batchNo || undefined,
      workstationName: formData.workstationName || undefined,
      recordDate: formData.recordDate || undefined,
      plannedQty: formData.plannedQty || undefined,
      actualQty: formData.actualQty || undefined,
      scrapQty: formData.scrapQty || "0",
      status: formData.status,
      remark: formData.remark || undefined,
    };
    if (editingRecord) {
      updateMutation.mutate({
        id: editingRecord.id,
        data: {
          actualQty: payload.actualQty,
          scrapQty: payload.scrapQty,
          status: payload.status,
          remark: payload.remark,
        },
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const inProgressCount = (records as any[]).filter((r) => r.status === "in_progress").length;
  const completedCount = (records as any[]).filter((r) => r.status === "completed").length;
  const abnormalCount = (records as any[]).filter((r) => r.status === "abnormal").length;

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">生产记录单</h2>
              <p className="text-sm text-muted-foreground">记录生产过程中各工序的执行情况</p>
            </div>
          </div>
          <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />新建记录单</Button>
        </div>

        <div className="grid gap-4 grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">生产中</p><p className="text-2xl font-bold text-blue-600">{inProgressCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">已完成</p><p className="text-2xl font-bold text-green-600">{completedCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">异常</p><p className="text-2xl font-bold text-red-600">{abnormalCount}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索记录单号、产品名称、批号..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[130px]"><SelectValue placeholder="状态筛选" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="in_progress">生产中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="abnormal">异常</SelectItem>
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
                  <TableHead>记录单号</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>批号</TableHead>
                  <TableHead>工序/工位</TableHead>
                  <TableHead className="text-right">计划数量</TableHead>
                  <TableHead className="text-right">实际数量</TableHead>
                  <TableHead className="text-right">报废数量</TableHead>
                  <TableHead>记录日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">暂无生产记录</TableCell></TableRow>
                ) : filteredRecords.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.recordNo}</TableCell>
                    <TableCell>{record.productName || "-"}</TableCell>
                    <TableCell>{record.batchNo || "-"}</TableCell>
                    <TableCell>{record.workstationName || "-"}</TableCell>
                    <TableCell className="text-right">{record.plannedQty || "-"}</TableCell>
                    <TableCell className="text-right">{record.actualQty || "-"}</TableCell>
                    <TableCell className="text-right">{record.scrapQty || "0"}</TableCell>
                    <TableCell>{record.recordDate ? String(record.recordDate).split("T")[0] : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[record.status]?.variant || "outline"}>
                        {statusMap[record.status]?.label || record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(record)}><Eye className="h-4 w-4 mr-2" />查看详情</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(record)}><Edit className="h-4 w-4 mr-2" />编辑</DropdownMenuItem>
                          {record.status === "in_progress" && (
                            <>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: record.id, data: { status: "completed" } })}>
                                <CheckCircle className="h-4 w-4 mr-2" />标记完成
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: record.id, data: { status: "abnormal" } })} className="text-destructive">
                                <AlertTriangle className="h-4 w-4 mr-2" />标记异常
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <DropdownMenuItem onClick={() => handleDelete(record)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />删除
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 新建/编辑对话框 */}
        <DraggableDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DraggableDialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRecord ? "编辑生产记录单" : "新建生产记录单"}</DialogTitle>
              <DialogDescription>记录生产过程中的工序执行情况</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>记录单号 *</Label>
                  <Input value={formData.recordNo} onChange={(e) => setFormData({ ...formData, recordNo: e.target.value })} readOnly={!!editingRecord} />
                </div>
                <div className="space-y-2">
                  <Label>记录日期</Label>
                  <Input type="date" value={formData.recordDate} onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>关联生产任务</Label>
                <Select
                  value={formData.productionOrderId || "__NONE__"}
                  onValueChange={(v) => handleProductionOrderChange(v === "__NONE__" ? "" : v)}
                >
                  <SelectTrigger><SelectValue placeholder="选择生产任务（可选）" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">不关联</SelectItem>
                    {(productionOrders as any[]).map((po: any) => (
                      <SelectItem key={po.id} value={String(po.id)}>{po.orderNo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Label>生产批号</Label>
                  <Input value={formData.batchNo} onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })} placeholder="批号" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>工序/工位</Label>
                <Input value={formData.workstationName} onChange={(e) => setFormData({ ...formData, workstationName: e.target.value })} placeholder="如：装配工序、检验工序" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>计划数量</Label>
                  <Input type="number" value={formData.plannedQty} onChange={(e) => setFormData({ ...formData, plannedQty: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>实际数量</Label>
                  <Input type="number" value={formData.actualQty} onChange={(e) => setFormData({ ...formData, actualQty: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>报废数量</Label>
                  <Input type="number" value={formData.scrapQty} onChange={(e) => setFormData({ ...formData, scrapQty: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">生产中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="abnormal">异常</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRecord ? "保存修改" : "创建记录单"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>生产记录详情</DialogTitle>
              <DialogDescription>{viewingRecord?.recordNo}</DialogDescription>
            </DialogHeader>
            {viewingRecord && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{viewingRecord.productName || `产品#${viewingRecord.productId}`}</p>
                    <p className="text-sm text-muted-foreground">批号：{viewingRecord.batchNo || "-"}</p>
                  </div>
                  <Badge variant={statusMap[viewingRecord.status]?.variant || "outline"}>
                    {statusMap[viewingRecord.status]?.label || viewingRecord.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">关联生产任务</p><p className="font-medium">{viewingRecord.productionOrderNo || "-"}</p></div>
                  <div><p className="text-muted-foreground">工序/工位</p><p className="font-medium">{viewingRecord.workstationName || "-"}</p></div>
                  <div><p className="text-muted-foreground">计划数量</p><p className="font-medium">{viewingRecord.plannedQty || "-"}</p></div>
                  <div><p className="text-muted-foreground">实际数量</p><p className="font-medium">{viewingRecord.actualQty || "-"}</p></div>
                  <div><p className="text-muted-foreground">报废数量</p><p className="font-medium">{viewingRecord.scrapQty || "0"}</p></div>
                  <div><p className="text-muted-foreground">记录日期</p><p className="font-medium">{viewingRecord.recordDate ? String(viewingRecord.recordDate).split("T")[0] : "-"}</p></div>
                </div>
                {viewingRecord.remark && (
                  <div><p className="text-sm text-muted-foreground mb-1">备注</p><p className="text-sm">{viewingRecord.remark}</p></div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>关闭</Button>
              <Button onClick={() => { setViewDialogOpen(false); if (viewingRecord) handleEdit(viewingRecord); }}>编辑</Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>
      </div>
    </ERPLayout>
  );
}
