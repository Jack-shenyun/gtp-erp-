import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DraggableDialog, DraggableDialogContent } from "@/components/DraggableDialog";
import ERPLayout from "@/components/ERPLayout";
import { Cog, Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Play, CheckCircle } from "lucide-react";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

interface ProductionOrderRow {
  id: number;
  orderNo: string;
  productId: number;
  productName?: string;
  productCode?: string;
  plannedQty: string;
  completedQty: string | null;
  unit: string | null;
  batchNo: string | null;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  status: "draft" | "planned" | "in_progress" | "completed" | "cancelled";
  salesOrderId: number | null;
  remark: string | null;
  createdAt: string;
}

const statusMap: Record<string, { label: string; variant: "outline" | "secondary" | "default" | "destructive"; color: string }> = {
  draft: { label: "草稿", variant: "outline", color: "text-gray-600" },
  planned: { label: "已计划", variant: "secondary", color: "text-blue-600" },
  in_progress: { label: "生产中", variant: "default", color: "text-amber-600" },
  completed: { label: "已完成", variant: "secondary", color: "text-green-600" },
  cancelled: { label: "已取消", variant: "destructive", color: "text-red-600" },
};

/**
 * 生成统一格式批次号: YYYYMMDDNN
 * 例如: 2026031101, 2026031102
 */
function generateBatchNo(existingOrders: any[]): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  // 查找当天已有的批次号，计算序号
  const todayBatches = existingOrders
    .map((o: any) => o.batchNo || "")
    .filter((b: string) => b.startsWith(dateStr));
  let seq = 1;
  for (const b of todayBatches) {
    const suffix = b.replace(dateStr, "");
    const num = parseInt(suffix, 10);
    if (!isNaN(num) && num >= seq) {
      seq = num + 1;
    }
  }
  return `${dateStr}${String(seq).padStart(2, "0")}`;
}

export default function ProductionOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProductionOrderRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { canDelete } = usePermission();

  // ===== 数据库查询 =====
  const { data: ordersRaw = [], isLoading, refetch } = trpc.productionOrders.list.useQuery(
    { search: searchTerm || undefined, status: statusFilter !== "all" ? statusFilter : undefined }
  );
  const { data: productsData = [] } = trpc.products.list.useQuery();
  const { data: productionPlansData = [] } = trpc.productionPlans.list.useQuery();
  const createMutation = trpc.productionOrders.create.useMutation({ onSuccess: () => { refetch(); toast.success("生产单已创建"); setFormDialogOpen(false); } });
  const updateMutation = trpc.productionOrders.update.useMutation({ onSuccess: () => { refetch(); toast.success("生产单已更新"); setFormDialogOpen(false); setViewDialogOpen(false); } });
  const deleteMutation = trpc.productionOrders.delete.useMutation({ onSuccess: () => { refetch(); toast.success("生产单已删除"); } });

  // 关联产品名称
  const data: ProductionOrderRow[] = (ordersRaw as any[]).map((o: any) => {
    const product = (productsData as any[]).find((p: any) => p.id === o.productId);
    return {
      ...o,
      productName: product?.name || "-",
      productCode: product?.code || "-",
    };
  });

  // 可选的生产计划（未完成、未取消的）
  const availablePlans = (productionPlansData as any[]).filter(
    (p: any) => p.status !== "completed" && p.status !== "cancelled"
  );

  const [formData, setFormData] = useState({
    planId: 0, // 关联的生产计划 ID
    productId: 0,
    batchNo: "",
    plannedQty: "",
    unit: "",
    plannedStartDate: "",
    plannedEndDate: "",
    status: "draft" as ProductionOrderRow["status"],
    remark: "",
  });

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedRecord(null);
    const batchNo = generateBatchNo(ordersRaw as any[]);
    setFormData({
      planId: 0,
      productId: 0,
      batchNo,
      plannedQty: "",
      unit: "",
      plannedStartDate: new Date().toISOString().split("T")[0],
      plannedEndDate: "",
      status: "draft",
      remark: "",
    });
    setFormDialogOpen(true);
  };

  const handleEdit = (record: ProductionOrderRow) => {
    setIsEditing(true);
    setSelectedRecord(record);
    setFormData({
      planId: 0,
      productId: record.productId,
      batchNo: record.batchNo || "",
      plannedQty: record.plannedQty,
      unit: record.unit || "",
      plannedStartDate: record.plannedStartDate ? String(record.plannedStartDate).split("T")[0] : "",
      plannedEndDate: record.plannedEndDate ? String(record.plannedEndDate).split("T")[0] : "",
      status: record.status,
      remark: record.remark || "",
    });
    setFormDialogOpen(true);
  };

  const handleView = (record: ProductionOrderRow) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleDelete = (record: ProductionOrderRow) => {
    if (!canDelete) {
      toast.error("您没有删除权限");
      return;
    }
    deleteMutation.mutate({ id: record.id });
  };

  // 选择生产计划后自动带入产品信息
  const handlePlanChange = (planId: string) => {
    const plan = availablePlans.find((p: any) => p.id === Number(planId));
    if (plan) {
      const product = (productsData as any[]).find((p: any) => p.id === plan.productId);
      setFormData({
        ...formData,
        planId: plan.id,
        productId: plan.productId,
        plannedQty: plan.plannedQty || "",
        unit: plan.unit || product?.unit || "",
        plannedEndDate: plan.plannedEndDate ? String(plan.plannedEndDate).split("T")[0] : "",
        remark: plan.salesOrderNo ? `关联销售订单: ${plan.salesOrderNo}` : formData.remark,
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.productId || !formData.plannedQty) {
      toast.error("请选择生产计划或产品并填写计划数量");
      return;
    }

    if (isEditing && selectedRecord) {
      updateMutation.mutate({
        id: selectedRecord.id,
        data: {
          productId: formData.productId,
          plannedQty: formData.plannedQty,
          unit: formData.unit || undefined,
          batchNo: formData.batchNo || undefined,
          plannedStartDate: formData.plannedStartDate || undefined,
          plannedEndDate: formData.plannedEndDate || undefined,
          status: formData.status,
          remark: formData.remark || undefined,
        },
      });
    } else {
      const orderNo = `MO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      createMutation.mutate({
        orderNo,
        productId: formData.productId,
        plannedQty: formData.plannedQty,
        unit: formData.unit || undefined,
        batchNo: formData.batchNo || undefined,
        plannedStartDate: formData.plannedStartDate || undefined,
        plannedEndDate: formData.plannedEndDate || undefined,
        status: formData.status,
        remark: formData.remark || undefined,
      });
    }
  };

  const handleStatusChange = (record: ProductionOrderRow, newStatus: ProductionOrderRow["status"]) => {
    const updates: any = { status: newStatus };
    if (newStatus === "in_progress" && !record.actualStartDate) {
      updates.actualStartDate = new Date().toISOString().split("T")[0];
    }
    if (newStatus === "completed") {
      updates.actualEndDate = new Date().toISOString().split("T")[0];
      updates.completedQty = record.plannedQty;
    }
    updateMutation.mutate({ id: record.id, data: updates });
  };

  // 统计信息
  const stats = {
    total: data.length,
    inProgress: data.filter((r: any) => r.status === "in_progress").length,
    completed: data.filter((r: any) => r.status === "completed").length,
    pending: data.filter((r: any) => r.status === "planned" || r.status === "draft").length,
  };

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">生产任务</h1>
              <p className="text-sm text-muted-foreground">
                从生产计划下达到最终产品入库的全过程闭环管理
              </p>
            </div>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            新建生产单
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">生产单总数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">生产中</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">已完成</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">待排产</div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索生产单号、批次号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="planned">已计划</SelectItem>
              <SelectItem value="in_progress">生产中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 数据表格 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>生产单号</TableHead>
                <TableHead>批次号</TableHead>
                <TableHead>产品</TableHead>
                <TableHead>生产进度</TableHead>
                <TableHead>计划日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record: any) => {
                const planned = Number(record.plannedQty || 0);
                const completed = Number(record.completedQty || 0);
                const progress = planned > 0 ? (completed / planned) * 100 : 0;
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono">{record.orderNo}</TableCell>
                    <TableCell className="font-medium">{record.batchNo || "-"}</TableCell>
                    <TableCell>{record.productName}</TableCell>
                    <TableCell>
                      <div className="space-y-1 w-32">
                        <div className="flex items-center justify-between text-xs">
                          <span>{completed?.toLocaleString?.() ?? "0"}</span>
                          <span className="text-muted-foreground">/ {planned?.toLocaleString?.() ?? "0"}</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>{record.plannedEndDate ? String(record.plannedEndDate).split("T")[0] : "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusMap[record.status]?.variant || "outline"}
                        className={statusMap[record.status]?.color || ""}
                      >
                        {statusMap[record.status]?.label || record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(record)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(record)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          {record.status === "planned" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(record, "in_progress")}>
                              <Play className="h-4 w-4 mr-2" />
                              开始生产
                            </DropdownMenuItem>
                          )}
                          {record.status === "in_progress" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(record, "completed")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              完成生产
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(record)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isLoading ? "加载中..." : "暂无数据"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* 新建/编辑表单对话框 */}
        <DraggableDialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "编辑生产单" : "新建生产单"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div>
                <h3 className="text-sm font-medium mb-3">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 关联生产计划（新建时显示） */}
                  {!isEditing && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>关联生产计划（选择后自动带入产品信息）</Label>
                      <Select
                        value={formData.planId ? String(formData.planId) : ""}
                        onValueChange={handlePlanChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择生产计划..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePlans.map((plan: any) => (
                            <SelectItem key={plan.id} value={String(plan.id)}>
                              {plan.planNo} - {plan.productName || "未知产品"} ({plan.plannedQty} {plan.unit})
                              {plan.salesOrderNo ? ` [${plan.salesOrderNo}]` : " [内部计划]"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>产品 *</Label>
                    <Select
                      value={formData.productId ? String(formData.productId) : ""}
                      onValueChange={(v) => {
                        const product = (productsData as any[]).find((p: any) => p.id === Number(v));
                        setFormData({
                          ...formData,
                          productId: Number(v),
                          unit: product?.unit || formData.unit,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择产品" />
                      </SelectTrigger>
                      <SelectContent>
                        {(productsData as any[]).map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} ({p.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>批次号</Label>
                    <Input
                      value={formData.batchNo}
                      onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                      placeholder="格式: 2026031101"
                    />
                    <p className="text-xs text-muted-foreground">统一格式: YYYYMMDDNN</p>
                  </div>
                  <div className="space-y-2">
                    <Label>计划数量 *</Label>
                    <Input
                      type="number"
                      value={formData.plannedQty}
                      onChange={(e) => setFormData({ ...formData, plannedQty: e.target.value })}
                      placeholder="输入计划生产数量"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>单位</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="如: 个、箱"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>计划开始日期</Label>
                    <Input
                      type="date"
                      value={formData.plannedStartDate}
                      onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>计划完成日期</Label>
                    <Input
                      type="date"
                      value={formData.plannedEndDate}
                      onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>状态</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v as ProductionOrderRow["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="planned">已计划</SelectItem>
                        <SelectItem value="in_progress">生产中</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 备注 */}
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="输入备注信息"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>{isEditing ? "保存" : "创建"}</Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情对话框 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5" />
                生产单详情 - {selectedRecord?.orderNo}
              </DialogTitle>
            </DialogHeader>

            {selectedRecord && (() => {
              const planned = Number(selectedRecord.plannedQty || 0);
              const completed = Number(selectedRecord.completedQty || 0);
              const progress = planned > 0 ? (completed / planned) * 100 : 0;
              return (
                <div className="space-y-6 mt-4">
                  {/* 生产进度总览 */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">总体生产进度</span>
                        <span className="text-lg font-bold">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>已完成: {completed?.toLocaleString?.() ?? "0"}</span>
                        <span>计划: {planned?.toLocaleString?.() ?? "0"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 生产信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">基本信息</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">产品</span>
                          <span className="font-medium">{selectedRecord.productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">批次号</span>
                          <span className="font-medium">{selectedRecord.batchNo || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">计划数量</span>
                          <span className="font-medium">{planned?.toLocaleString?.() ?? "0"} {selectedRecord.unit || ""}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">完成数量</span>
                          <span className="font-medium">{completed?.toLocaleString?.() ?? "0"} {selectedRecord.unit || ""}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">时间信息</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">计划开始</span>
                          <span className="font-medium">{selectedRecord.plannedStartDate ? String(selectedRecord.plannedStartDate).split("T")[0] : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">计划完成</span>
                          <span className="font-medium">{selectedRecord.plannedEndDate ? String(selectedRecord.plannedEndDate).split("T")[0] : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">实际开始</span>
                          <span className="font-medium">{selectedRecord.actualStartDate ? String(selectedRecord.actualStartDate).split("T")[0] : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">实际完成</span>
                          <span className="font-medium">{selectedRecord.actualEndDate ? String(selectedRecord.actualEndDate).split("T")[0] : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">状态</span>
                          <Badge
                            variant={statusMap[selectedRecord.status]?.variant || "outline"}
                            className={statusMap[selectedRecord.status]?.color || ""}
                          >
                            {statusMap[selectedRecord.status]?.label || selectedRecord.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 备注 */}
                  {selectedRecord.remark && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">备注</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{selectedRecord.remark}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                      关闭
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewDialogOpen(false);
                        handleEdit(selectedRecord);
                      }}
                    >
                      编辑生产单
                    </Button>
                    {selectedRecord.status === "draft" && (
                      <Button onClick={() => handleStatusChange(selectedRecord, "planned")}>
                        确认计划
                      </Button>
                    )}
                    {selectedRecord.status === "planned" && (
                      <Button onClick={() => handleStatusChange(selectedRecord, "in_progress")}>
                        <Play className="h-4 w-4 mr-2" />
                        开始生产
                      </Button>
                    )}
                    {selectedRecord.status === "in_progress" && (
                      <Button onClick={() => handleStatusChange(selectedRecord, "completed")}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        完成生产
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </DraggableDialogContent>
        </DraggableDialog>
      </div>
    </ERPLayout>
  );
}
