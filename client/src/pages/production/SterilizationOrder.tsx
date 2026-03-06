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
  Flame, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Send, CheckCircle, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

const statusMap: Record<string, { label: string; variant: "outline" | "default" | "secondary" | "destructive" }> = {
  draft:       { label: "草稿",   variant: "outline" },
  sent:        { label: "已发出", variant: "default" },
  processing:  { label: "灭菌中", variant: "default" },
  returned:    { label: "已回收", variant: "secondary" },
  qualified:   { label: "合格",   variant: "secondary" },
  unqualified: { label: "不合格", variant: "destructive" },
};

export default function SterilizationOrderPage() {
  const { canDelete } = usePermission();
  const { data: orders = [], isLoading, refetch } = trpc.sterilizationOrders.list.useQuery({});
  const { data: productionOrders = [] } = trpc.productionOrders.list.useQuery({});
  const { data: routingCards = [] } = trpc.productionRoutingCards.list.useQuery({});
  const { data: suppliers = [] } = trpc.suppliers.list.useQuery({});

  const createMutation = trpc.sterilizationOrders.create.useMutation({
    onSuccess: () => { refetch(); toast.success("委外灭菌单已创建"); setDialogOpen(false); },
    onError: (e) => toast.error("创建失败", { description: e.message }),
  });
  const updateMutation = trpc.sterilizationOrders.update.useMutation({
    onSuccess: () => { refetch(); toast.success("灭菌单已更新"); setDialogOpen(false); },
    onError: (e) => toast.error("更新失败", { description: e.message }),
  });
  const deleteMutation = trpc.sterilizationOrders.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("灭菌单已删除"); },
    onError: (e) => toast.error("删除失败", { description: e.message }),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  const [formData, setFormData] = useState({
    orderNo: "",
    routingCardId: "",
    routingCardNo: "",
    productionOrderId: "",
    productionOrderNo: "",
    productName: "",
    batchNo: "",
    quantity: "",
    unit: "件",
    sterilizationMethod: "EO环氧乙烷",
    supplierId: "",
    supplierName: "",
    sendDate: "",
    expectedReturnDate: "",
    remark: "",
  });

  const filteredOrders = (orders as any[]).filter((o) => {
    const matchSearch = !searchTerm ||
      String(o.orderNo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.productName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.supplierName ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const genNo = () => {
    const now = new Date();
    return `SO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Date.now()).slice(-4)}`;
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({
      orderNo: genNo(),
      routingCardId: "",
      routingCardNo: "",
      productionOrderId: "",
      productionOrderNo: "",
      productName: "",
      batchNo: "",
      quantity: "",
      unit: "件",
      sterilizationMethod: "EO环氧乙烷",
      supplierId: "",
      supplierName: "",
      sendDate: new Date().toISOString().split("T")[0],
      expectedReturnDate: "",
      remark: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setFormData({
      orderNo: order.orderNo,
      routingCardId: order.routingCardId ? String(order.routingCardId) : "",
      routingCardNo: order.routingCardNo || "",
      productionOrderId: order.productionOrderId ? String(order.productionOrderId) : "",
      productionOrderNo: order.productionOrderNo || "",
      productName: order.productName || "",
      batchNo: order.batchNo || "",
      quantity: order.quantity || "",
      unit: order.unit || "件",
      sterilizationMethod: order.sterilizationMethod || "EO环氧乙烷",
      supplierId: order.supplierId ? String(order.supplierId) : "",
      supplierName: order.supplierName || "",
      sendDate: order.sendDate ? String(order.sendDate).split("T")[0] : "",
      expectedReturnDate: order.expectedReturnDate ? String(order.expectedReturnDate).split("T")[0] : "",
      remark: order.remark || "",
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

  const handleRoutingCardChange = (rcId: string) => {
    const rc = (routingCards as any[]).find((r) => String(r.id) === rcId);
    setFormData((f) => ({
      ...f,
      routingCardId: rcId,
      routingCardNo: rc?.cardNo || "",
      productionOrderId: rc?.productionOrderId ? String(rc.productionOrderId) : f.productionOrderId,
      productionOrderNo: rc?.productionOrderNo || f.productionOrderNo,
      productName: rc?.productName || f.productName,
      batchNo: rc?.batchNo || f.batchNo,
      quantity: rc?.quantity || f.quantity,
      unit: rc?.unit || f.unit,
    }));
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = (suppliers as any[]).find((s) => String(s.id) === supplierId);
    setFormData((f) => ({ ...f, supplierId, supplierName: supplier?.name || "" }));
  };

  const handleSubmit = () => {
    if (!formData.orderNo) {
      toast.error("请填写灭菌单号");
      return;
    }
    const payload = {
      orderNo: formData.orderNo,
      routingCardId: formData.routingCardId ? Number(formData.routingCardId) : undefined,
      routingCardNo: formData.routingCardNo || undefined,
      productionOrderId: formData.productionOrderId ? Number(formData.productionOrderId) : undefined,
      productionOrderNo: formData.productionOrderNo || undefined,
      productName: formData.productName || undefined,
      batchNo: formData.batchNo || undefined,
      quantity: formData.quantity || undefined,
      unit: formData.unit || undefined,
      sterilizationMethod: formData.sterilizationMethod || undefined,
      supplierId: formData.supplierId ? Number(formData.supplierId) : undefined,
      supplierName: formData.supplierName || undefined,
      sendDate: formData.sendDate || undefined,
      expectedReturnDate: formData.expectedReturnDate || undefined,
      status: "draft" as const,
      remark: formData.remark || undefined,
    };
    if (editingOrder) {
      updateMutation.mutate({
        id: editingOrder.id,
        data: {
          sterilizationMethod: payload.sterilizationMethod,
          supplierName: payload.supplierName,
          sendDate: payload.sendDate,
          expectedReturnDate: payload.expectedReturnDate,
          remark: payload.remark,
        },
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const draftCount = (orders as any[]).filter((o) => o.status === "draft").length;
  const processingCount = (orders as any[]).filter((o) => o.status === "processing" || o.status === "sent").length;
  const qualifiedCount = (orders as any[]).filter((o) => o.status === "qualified").length;
  const unqualifiedCount = (orders as any[]).filter((o) => o.status === "unqualified").length;

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">委外灭菌单</h2>
              <p className="text-sm text-muted-foreground">标准医疗器械生产流转后的委外灭菌管理，灭菌合格后方可申请入库</p>
            </div>
          </div>
          <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />新建灭菌单</Button>
        </div>

        <div className="grid gap-4 grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">草稿</p><p className="text-2xl font-bold">{draftCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">灭菌中</p><p className="text-2xl font-bold text-amber-600">{processingCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">合格</p><p className="text-2xl font-bold text-green-600">{qualifiedCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">不合格</p><p className="text-2xl font-bold text-red-600">{unqualifiedCount}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索灭菌单号、产品名称、供应商..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[130px]"><SelectValue placeholder="状态筛选" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="sent">已发出</SelectItem>
                  <SelectItem value="processing">灭菌中</SelectItem>
                  <SelectItem value="returned">已回收</SelectItem>
                  <SelectItem value="qualified">合格</SelectItem>
                  <SelectItem value="unqualified">不合格</SelectItem>
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
                  <TableHead>灭菌单号</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>批号</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead>灭菌方式</TableHead>
                  <TableHead>灭菌供应商</TableHead>
                  <TableHead>发出日期</TableHead>
                  <TableHead>预计回收</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">暂无委外灭菌单</TableCell></TableRow>
                ) : filteredOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNo}</TableCell>
                    <TableCell>{order.productName || "-"}</TableCell>
                    <TableCell>{order.batchNo || "-"}</TableCell>
                    <TableCell className="text-right">{order.quantity} {order.unit}</TableCell>
                    <TableCell>{order.sterilizationMethod || "-"}</TableCell>
                    <TableCell>{order.supplierName || "-"}</TableCell>
                    <TableCell>{order.sendDate ? String(order.sendDate).split("T")[0] : "-"}</TableCell>
                    <TableCell>{order.expectedReturnDate ? String(order.expectedReturnDate).split("T")[0] : "-"}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(order)}><Edit className="h-4 w-4 mr-2" />编辑</DropdownMenuItem>
                          {order.status === "draft" && (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, data: { status: "sent" } })}>
                              <Send className="h-4 w-4 mr-2" />确认发出
                            </DropdownMenuItem>
                          )}
                          {order.status === "sent" && (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, data: { status: "processing" } })}>
                              <Flame className="h-4 w-4 mr-2" />开始灭菌
                            </DropdownMenuItem>
                          )}
                          {order.status === "processing" && (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, data: { status: "returned", actualReturnDate: new Date().toISOString().split("T")[0] } })}>
                              <CheckCircle className="h-4 w-4 mr-2" />确认回收
                            </DropdownMenuItem>
                          )}
                          {order.status === "returned" && (
                            <>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, data: { status: "qualified" } })}>
                                <CheckCircle className="h-4 w-4 mr-2" />验收合格
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, data: { status: "unqualified" } })} className="text-destructive">
                                <XCircle className="h-4 w-4 mr-2" />验收不合格
                              </DropdownMenuItem>
                            </>
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
          <DraggableDialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingOrder ? "编辑委外灭菌单" : "新建委外灭菌单"}</DialogTitle>
              <DialogDescription>标准医疗器械生产完成后委托外部机构进行灭菌处理</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>灭菌单号 *</Label>
                  <Input value={formData.orderNo} onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })} readOnly={!!editingOrder} />
                </div>
                <div className="space-y-2">
                  <Label>关联流转单</Label>
                  <Select
                    value={formData.routingCardId || "__NONE__"}
                    onValueChange={(v) => handleRoutingCardChange(v === "__NONE__" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="选择流转单（可选）" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">不关联</SelectItem>
                      {(routingCards as any[]).filter((rc: any) => rc.needsSterilization).map((rc: any) => (
                        <SelectItem key={rc.id} value={String(rc.id)}>{rc.cardNo} - {rc.productName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>产品名称</Label>
                  <Input value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} placeholder="产品名称" />
                </div>
                <div className="space-y-2">
                  <Label>批号</Label>
                  <Input value={formData.batchNo} onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })} placeholder="生产批号" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>数量</Label>
                  <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>单位</Label>
                  <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>灭菌方式</Label>
                  <Select value={formData.sterilizationMethod} onValueChange={(v) => setFormData({ ...formData, sterilizationMethod: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EO环氧乙烷">EO环氧乙烷</SelectItem>
                      <SelectItem value="γ射线辐照">γ射线辐照</SelectItem>
                      <SelectItem value="高压蒸汽">高压蒸汽</SelectItem>
                      <SelectItem value="干热灭菌">干热灭菌</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>灭菌供应商</Label>
                <Select
                  value={formData.supplierId || "__MANUAL__"}
                  onValueChange={(v) => handleSupplierChange(v === "__MANUAL__" ? "" : v)}
                >
                  <SelectTrigger><SelectValue placeholder="选择供应商" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__MANUAL__">手动输入</SelectItem>
                    {(suppliers as any[]).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.supplierId && (
                  <Input value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} placeholder="手动输入供应商名称" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>发出日期</Label>
                  <Input type="date" value={formData.sendDate} onChange={(e) => setFormData({ ...formData, sendDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>预计回收日期</Label>
                  <Input type="date" value={formData.expectedReturnDate} onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })} />
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
                {editingOrder ? "保存修改" : "创建灭菌单"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>委外灭菌单详情</DialogTitle>
              <DialogDescription>{viewingOrder?.orderNo}</DialogDescription>
            </DialogHeader>
            {viewingOrder && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{viewingOrder.productName || "-"}</p>
                    <p className="text-sm text-muted-foreground">批号：{viewingOrder.batchNo || "-"}</p>
                  </div>
                  <Badge variant={statusMap[viewingOrder.status]?.variant || "outline"}>
                    {statusMap[viewingOrder.status]?.label || viewingOrder.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">数量</p><p className="font-medium">{viewingOrder.quantity} {viewingOrder.unit}</p></div>
                  <div><p className="text-muted-foreground">灭菌方式</p><p className="font-medium">{viewingOrder.sterilizationMethod || "-"}</p></div>
                  <div><p className="text-muted-foreground">灭菌供应商</p><p className="font-medium">{viewingOrder.supplierName || "-"}</p></div>
                  <div><p className="text-muted-foreground">关联流转单</p><p className="font-medium">{viewingOrder.routingCardNo || "-"}</p></div>
                  <div><p className="text-muted-foreground">发出日期</p><p className="font-medium">{viewingOrder.sendDate ? String(viewingOrder.sendDate).split("T")[0] : "-"}</p></div>
                  <div><p className="text-muted-foreground">预计回收</p><p className="font-medium">{viewingOrder.expectedReturnDate ? String(viewingOrder.expectedReturnDate).split("T")[0] : "-"}</p></div>
                  {viewingOrder.actualReturnDate && (
                    <div><p className="text-muted-foreground">实际回收</p><p className="font-medium">{String(viewingOrder.actualReturnDate).split("T")[0]}</p></div>
                  )}
                </div>
                {viewingOrder.remark && (
                  <div><p className="text-sm text-muted-foreground mb-1">备注</p><p className="text-sm">{viewingOrder.remark}</p></div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>关闭</Button>
              <Button onClick={() => { setViewDialogOpen(false); if (viewingOrder) handleEdit(viewingOrder); }}>编辑</Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>
      </div>
    </ERPLayout>
  );
}
