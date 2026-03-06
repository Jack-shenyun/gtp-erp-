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
  PackageOpen, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, CheckCircle, XCircle, Truck,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

const statusMap: Record<string, { label: string; variant: "outline" | "default" | "secondary" | "destructive" }> = {
  draft:    { label: "草稿",   variant: "outline" },
  pending:  { label: "待审批", variant: "default" },
  approved: { label: "已审批", variant: "secondary" },
  issued:   { label: "已发料", variant: "secondary" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

interface MaterialItem {
  materialCode: string;
  materialName: string;
  requiredQty: number;
  unit: string;
  actualQty: number;
  remark: string;
}

export default function MaterialRequisitionPage() {
  const { canDelete } = usePermission();
  const { data: orders = [], isLoading, refetch } = trpc.materialRequisitionOrders.list.useQuery({});
  const { data: productionOrders = [] } = trpc.productionOrders.list.useQuery({});
  const { data: warehouseList = [] } = trpc.warehouses.list.useQuery({});

  const createMutation = trpc.materialRequisitionOrders.create.useMutation({
    onSuccess: () => { refetch(); toast.success("领料单已创建"); setDialogOpen(false); },
    onError: (e) => toast.error("创建失败", { description: e.message }),
  });
  const updateMutation = trpc.materialRequisitionOrders.update.useMutation({
    onSuccess: () => { refetch(); toast.success("领料单已更新"); setDialogOpen(false); },
    onError: (e) => toast.error("更新失败", { description: e.message }),
  });
  const deleteMutation = trpc.materialRequisitionOrders.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("领料单已删除"); },
    onError: (e) => toast.error("删除失败", { description: e.message }),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [items, setItems] = useState<MaterialItem[]>([
    { materialCode: "", materialName: "", requiredQty: 0, unit: "件", actualQty: 0, remark: "" },
  ]);

  const [formData, setFormData] = useState({
    requisitionNo: "",
    productionOrderId: "",
    productionOrderNo: "",
    warehouseId: "",
    applicationDate: "",
    remark: "",
  });

  const filteredOrders = (orders as any[]).filter((o) => {
    const matchSearch = !searchTerm ||
      String(o.requisitionNo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.productionOrderNo ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const genNo = () => {
    const now = new Date();
    return `MR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Date.now()).slice(-4)}`;
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setItems([{ materialCode: "", materialName: "", requiredQty: 0, unit: "件", actualQty: 0, remark: "" }]);
    setFormData({
      requisitionNo: genNo(),
      productionOrderId: "",
      productionOrderNo: "",
      warehouseId: "",
      applicationDate: new Date().toISOString().split("T")[0],
      remark: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    let parsedItems: MaterialItem[] = [];
    try {
      const extra = JSON.parse(order.remark || "{}");
      parsedItems = extra.items || [];
    } catch {}
    setItems(parsedItems.length > 0 ? parsedItems : [{ materialCode: "", materialName: "", requiredQty: 0, unit: "件", actualQty: 0, remark: "" }]);
    setFormData({
      requisitionNo: order.requisitionNo,
      productionOrderId: order.productionOrderId ? String(order.productionOrderId) : "",
      productionOrderNo: order.productionOrderNo || "",
      warehouseId: order.warehouseId ? String(order.warehouseId) : "",
      applicationDate: order.applicationDate ? String(order.applicationDate).split("T")[0] : "",
      remark: "",
    });
    setDialogOpen(true);
  };

  const handleView = (order: any) => {
    setViewingOrder(order);
    setViewDialogOpen(true);
  };

  const handleDelete = (order: any) => {
    if (!canDelete) { toast.error("您没有删除权限"); return; }
    deleteMutation.mutate({ id: order.id });
  };

  const handleApprove = (order: any) => {
    updateMutation.mutate({ id: order.id, data: { status: "approved" } });
  };

  const handleIssue = (order: any) => {
    updateMutation.mutate({ id: order.id, data: { status: "issued" } });
    toast.success("已发料");
  };

  const handleProductionOrderChange = (poId: string) => {
    const po = (productionOrders as any[]).find((p) => String(p.id) === poId);
    setFormData((f) => ({ ...f, productionOrderId: poId, productionOrderNo: po?.orderNo || "" }));
  };

  const addItem = () => {
    setItems([...items, { materialCode: "", materialName: "", requiredQty: 0, unit: "件", actualQty: 0, remark: "" }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof MaterialItem, value: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = () => {
    if (!formData.requisitionNo) {
      toast.error("请填写领料单号");
      return;
    }
    const remarkData = JSON.stringify({ items, note: formData.remark });
    const payload = {
      requisitionNo: formData.requisitionNo,
      productionOrderId: formData.productionOrderId ? Number(formData.productionOrderId) : undefined,
      productionOrderNo: formData.productionOrderNo || undefined,
      warehouseId: formData.warehouseId ? Number(formData.warehouseId) : undefined,
      applicationDate: formData.applicationDate || undefined,
      status: "draft" as const,
      remark: remarkData,
    };
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data: { remark: remarkData } });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getViewItems = (order: any): MaterialItem[] => {
    try {
      const extra = JSON.parse(order.remark || "{}");
      return extra.items || [];
    } catch { return []; }
  };

  const draftCount = (orders as any[]).filter((o) => o.status === "draft").length;
  const pendingCount = (orders as any[]).filter((o) => o.status === "pending").length;
  const issuedCount = (orders as any[]).filter((o) => o.status === "issued").length;

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <PackageOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">领料单</h2>
              <p className="text-sm text-muted-foreground">生产任务领取原材料申请管理</p>
            </div>
          </div>
          <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />新建领料单</Button>
        </div>

        <div className="grid gap-4 grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">草稿</p><p className="text-2xl font-bold">{draftCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">待审批</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">已发料</p><p className="text-2xl font-bold text-green-600">{issuedCount}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索领料单号、生产任务号..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[130px]"><SelectValue placeholder="状态筛选" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="pending">待审批</SelectItem>
                  <SelectItem value="approved">已审批</SelectItem>
                  <SelectItem value="issued">已发料</SelectItem>
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
                  <TableHead>领料单号</TableHead>
                  <TableHead>关联生产任务</TableHead>
                  <TableHead>申请日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无领料单</TableCell></TableRow>
                ) : filteredOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.requisitionNo}</TableCell>
                    <TableCell>{order.productionOrderNo || "-"}</TableCell>
                    <TableCell>{order.applicationDate ? String(order.applicationDate).split("T")[0] : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[order.status]?.variant || "outline"}>
                        {statusMap[order.status]?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(order)}><Eye className="h-4 w-4 mr-2" />查看详情</DropdownMenuItem>
                          {order.status === "draft" && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(order)}><Edit className="h-4 w-4 mr-2" />编辑</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, data: { status: "pending" } })}>
                                <CheckCircle className="h-4 w-4 mr-2" />提交审批
                              </DropdownMenuItem>
                            </>
                          )}
                          {order.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(order)}><CheckCircle className="h-4 w-4 mr-2" />审批通过</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, data: { status: "rejected" } })} className="text-destructive">
                                <XCircle className="h-4 w-4 mr-2" />拒绝
                              </DropdownMenuItem>
                            </>
                          )}
                          {order.status === "approved" && (
                            <DropdownMenuItem onClick={() => handleIssue(order)}><Truck className="h-4 w-4 mr-2" />确认发料</DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem onClick={() => handleDelete(order)} className="text-destructive">
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
          <DraggableDialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingOrder ? "编辑领料单" : "新建领料单"}</DialogTitle>
              <DialogDescription>填写领料申请信息及物料明细</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>领料单号 *</Label>
                  <Input value={formData.requisitionNo} onChange={(e) => setFormData({ ...formData, requisitionNo: e.target.value })} readOnly={!!editingOrder} />
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
                  <Label>领料仓库</Label>
                  <Select value={formData.warehouseId} onValueChange={(v) => setFormData({ ...formData, warehouseId: v })}>
                    <SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger>
                    <SelectContent>
                      {(warehouseList as any[]).map((w: any) => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 物料明细 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>物料明细</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />添加物料</Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>物料编码</TableHead>
                        <TableHead>物料名称</TableHead>
                        <TableHead>需求数量</TableHead>
                        <TableHead>单位</TableHead>
                        <TableHead className="w-[60px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input value={item.materialCode} onChange={(e) => updateItem(idx, "materialCode", e.target.value)} placeholder="编码" className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Input value={item.materialName} onChange={(e) => updateItem(idx, "materialName", e.target.value)} placeholder="名称" className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={item.requiredQty} onChange={(e) => updateItem(idx, "requiredQty", Number(e.target.value))} className="h-8 w-20" />
                          </TableCell>
                          <TableCell>
                            <Input value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} className="h-8 w-16" />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                {editingOrder ? "保存修改" : "创建领料单"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>领料单详情</DialogTitle>
              <DialogDescription>{viewingOrder?.requisitionNo}</DialogDescription>
            </DialogHeader>
            {viewingOrder && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{viewingOrder.requisitionNo}</p>
                    <p className="text-sm text-muted-foreground">关联任务：{viewingOrder.productionOrderNo || "-"}</p>
                  </div>
                  <Badge variant={statusMap[viewingOrder.status]?.variant || "outline"}>
                    {statusMap[viewingOrder.status]?.label || viewingOrder.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">申请日期</p><p className="font-medium">{viewingOrder.applicationDate ? String(viewingOrder.applicationDate).split("T")[0] : "-"}</p></div>
                </div>
                {getViewItems(viewingOrder).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">物料明细</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>物料编码</TableHead>
                          <TableHead>物料名称</TableHead>
                          <TableHead className="text-right">需求数量</TableHead>
                          <TableHead>单位</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getViewItems(viewingOrder).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.materialCode}</TableCell>
                            <TableCell>{item.materialName}</TableCell>
                            <TableCell className="text-right">{item.requiredQty}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>关闭</Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>
      </div>
    </ERPLayout>
  );
}
