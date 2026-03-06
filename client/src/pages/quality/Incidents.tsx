import { formatDateValue } from "@/lib/formatters";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DraggableDialog, DraggableDialogContent } from "@/components/DraggableDialog";
import ERPLayout from "@/components/ERPLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  AlertOctagon,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

interface IncidentRecord {
  id: number;
  incidentNo: string;
  productName: string;
  productCode: string;
  batchNo: string;
  incidentType: string;
  severity: "low" | "medium" | "high";
  reportDate: string;
  reportedBy: string;
  description: string;
  affectedQuantity: string;
  location: string;
  investigator: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  resolveDate: string;
  status: "reported" | "investigating" | "resolved" | "closed";
  remarks: string;
}

const statusMap: Record<string, any> = {
  reported: { label: "已上报", variant: "outline" as const },
  investigating: { label: "调查中", variant: "default" as const },
  resolved: { label: "已解决", variant: "secondary" as const },
  closed: { label: "已关闭", variant: "secondary" as const },
};

const severityMap: Record<string, any> = {
  low: { label: "轻微", color: "bg-green-100 text-green-800" },
  medium: { label: "一般", color: "bg-amber-100 text-amber-800" },
  high: { label: "严重", color: "bg-red-100 text-red-800" },
};

const incidentTypes = ["产品缺陷", "包装破损", "标签错误", "功能异常", "过敏反应", "使用不当", "其他"];



export default function IncidentsPage() {
  const { data: _dbData = [], isLoading, refetch } = trpc.qualityIncidents.list.useQuery();
  const createMutation = trpc.qualityIncidents.create.useMutation({ onSuccess: () => { refetch(); toast.success("创建成功"); } });
  const updateMutation = trpc.qualityIncidents.update.useMutation({ onSuccess: () => { refetch(); toast.success("更新成功"); } });
  const deleteMutation = trpc.qualityIncidents.delete.useMutation({ onSuccess: () => { refetch(); toast.success("删除成功"); } });
  const incidents = _dbData as any[];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentRecord | null>(null);
  const [viewingIncident, setViewingIncident] = useState<IncidentRecord | null>(null);
  const { canDelete } = usePermission();

  const [formData, setFormData] = useState({
    incidentNo: "",
    productName: "",
    productCode: "",
    batchNo: "",
    incidentType: "",
    severity: "low",
    reportDate: "",
    reportedBy: "",
    description: "",
    affectedQuantity: "",
    location: "",
    investigator: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    resolveDate: "",
    status: "reported",
    remarks: "",
  });

  const filteredIncidents = incidents.filter((i: any) => {
    const matchesSearch =
      String(i.incidentNo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(i.productName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(i.batchNo ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingIncident(null);
    const today = new Date();
    const year = today.getFullYear();
    const nextNo = incidents.filter((i: any) => i.incidentNo.includes(String(year))).length + 1;
    setFormData({
      incidentNo: `AE-${year}-${String(nextNo).padStart(3, "0")}`,
      productName: "",
      productCode: "",
      batchNo: "",
      incidentType: "",
      severity: "low",
      reportDate: today.toISOString().split("T")[0],
      reportedBy: "",
      description: "",
      affectedQuantity: "",
      location: "",
      investigator: "",
      rootCause: "",
      correctiveAction: "",
      preventiveAction: "",
      resolveDate: "",
      status: "reported",
      remarks: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (incident: IncidentRecord) => {
    setEditingIncident(incident);
    setFormData({
      incidentNo: incident.incidentNo,
      productName: incident.productName,
      productCode: incident.productCode,
      batchNo: incident.batchNo,
      incidentType: incident.incidentType,
      severity: incident.severity,
      reportDate: incident.reportDate,
      reportedBy: incident.reportedBy,
      description: incident.description,
      affectedQuantity: incident.affectedQuantity,
      location: incident.location,
      investigator: incident.investigator,
      rootCause: incident.rootCause,
      correctiveAction: incident.correctiveAction,
      preventiveAction: incident.preventiveAction,
      resolveDate: incident.resolveDate,
      status: incident.status,
      remarks: incident.remarks,
    });
    setDialogOpen(true);
  };

  const handleView = (incident: IncidentRecord) => {
    setViewingIncident(incident);
    setViewDialogOpen(true);
  };

  const handleDelete = (incident: IncidentRecord) => {
    if (!canDelete) {
      toast.error("您没有删除权限", { description: "只有管理员可以删除不良事件记录" });
      return;
    }
    deleteMutation.mutate({ id: incident.id });
    toast.success("不良事件记录已删除");
  };

  const handleStartInvestigation = (incident: IncidentRecord) => {
    toast.success("已开始调查");
  };

  const handleCloseIncident = (incident: IncidentRecord) => {
    toast.success("事件已关闭");
  };

  const handleSubmit = () => {
    if (!formData.incidentNo || !formData.productName || !formData.description) {
      toast.error("请填写必填项", { description: "事件编号、产品名称、事件描述为必填" });
      return;
    }

    if (editingIncident) {
      toast.success("不良事件记录已更新");
    } else {
      const newIncident: IncidentRecord = {
        id: Math.max(...incidents.map((i: any) => i.id)) + 1,
        ...formData,
        severity: formData.severity as IncidentRecord["severity"],
        status: formData.status as IncidentRecord["status"],
      };
      toast.success("不良事件已上报");
    }
    setDialogOpen(false);
  };

  const closedCount = incidents.filter((i: any) => i.status === "closed").length;
  const processingCount = incidents.filter((i: any) => i.status === "reported" || i.status === "investigating").length;
  const severeCount = incidents.filter((i: any) => i.severity === "high").length;

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertOctagon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">不良事件</h2>
              <p className="text-sm text-muted-foreground">建立产品不良事件的上报、调查和处理流程</p>
            </div>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            上报事件
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">本年事件</p>
              <p className="text-2xl font-bold">{incidents.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">已关闭</p>
              <p className="text-2xl font-bold text-green-600">{closedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">处理中</p>
              <p className="text-2xl font-bold text-amber-600">{processingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">严重事件</p>
              <p className="text-2xl font-bold text-red-600">{severeCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索事件编号、产品名称、批次号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="reported">已上报</SelectItem>
                  <SelectItem value="investigating">调查中</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                  <SelectItem value="closed">已关闭</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 数据表格 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">事件编号</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead className="w-[100px]">批次号</TableHead>
                  <TableHead className="w-[90px]">事件类型</TableHead>
                  <TableHead className="w-[80px]">严重程度</TableHead>
                  <TableHead className="w-[100px]">上报日期</TableHead>
                  <TableHead className="w-[80px]">状态</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident: any) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">{incident.incidentNo}</TableCell>
                    <TableCell>{incident.productName}</TableCell>
                    <TableCell>{incident.batchNo}</TableCell>
                    <TableCell>{incident.incidentType}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${severityMap[incident.severity].color}`}>
                        {severityMap[incident.severity].label}
                      </span>
                    </TableCell>
                    <TableCell>{formatDateValue(incident.reportDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[incident.status]?.variant || "outline"}>
                        {statusMap[incident.status]?.label || String(incident.status ?? "-")}
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
                          <DropdownMenuItem onClick={() => handleView(incident)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(incident)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          {incident.status === "reported" && (
                            <DropdownMenuItem onClick={() => handleStartInvestigation(incident)}>
                              <FileText className="h-4 w-4 mr-2" />
                              开始调查
                            </DropdownMenuItem>
                          )}
                          {incident.status === "resolved" && (
                            <DropdownMenuItem onClick={() => handleCloseIncident(incident)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              关闭事件
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(incident)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
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
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>{editingIncident ? "编辑不良事件" : "上报不良事件"}</DialogTitle>
              <DialogDescription>
                {editingIncident ? "修改不良事件信息" : "填写不良事件详细信息"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>事件编号 *</Label>
                  <Input
                    value={formData.incidentNo}
                    onChange={(e) => setFormData({ ...formData, incidentNo: e.target.value })}
                    placeholder="事件编号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>上报日期</Label>
                  <Input
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>上报人</Label>
                  <Input
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                    placeholder="上报人"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>产品名称 *</Label>
                  <Input
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="产品名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label>产品编码</Label>
                  <Input
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    placeholder="产品编码"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>批次号</Label>
                  <Input
                    value={formData.batchNo}
                    onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                    placeholder="批次号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>事件类型</Label>
                  <Select
                    value={formData.incidentType}
                    onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map((t: any) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>严重程度</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">轻微</SelectItem>
                      <SelectItem value="medium">一般</SelectItem>
                      <SelectItem value="high">严重</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>涉及数量</Label>
                  <Input
                    value={formData.affectedQuantity}
                    onChange={(e) => setFormData({ ...formData, affectedQuantity: e.target.value })}
                    placeholder="如：10支"
                  />
                </div>
                <div className="space-y-2">
                  <Label>发生地点</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="发生地点"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>事件描述 *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细描述事件情况"
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">调查与处理</h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>调查人</Label>
                      <Input
                        value={formData.investigator}
                        onChange={(e) => setFormData({ ...formData, investigator: e.target.value })}
                        placeholder="调查负责人"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>状态</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reported">已上报</SelectItem>
                          <SelectItem value="investigating">调查中</SelectItem>
                          <SelectItem value="resolved">已解决</SelectItem>
                          <SelectItem value="closed">已关闭</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>根本原因</Label>
                    <Textarea
                      value={formData.rootCause}
                      onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                      placeholder="分析根本原因"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>纠正措施</Label>
                    <Textarea
                      value={formData.correctiveAction}
                      onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
                      placeholder="采取的纠正措施"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>预防措施</Label>
                    <Textarea
                      value={formData.preventiveAction}
                      onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
                      placeholder="预防再次发生的措施"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>解决日期</Label>
                      <Input
                        type="date"
                        value={formData.resolveDate}
                        onChange={(e) => setFormData({ ...formData, resolveDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>备注</Label>
                    <Textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="其他备注信息"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editingIncident ? "保存修改" : "上报事件"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情对话框 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>不良事件详情</DialogTitle>
              <DialogDescription>{viewingIncident?.incidentNo}</DialogDescription>
            </DialogHeader>
            {viewingIncident && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{viewingIncident.productName}</h3>
                    <p className="text-sm text-muted-foreground">批次：{viewingIncident.batchNo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${severityMap[viewingIncident.severity].color}`}>
                      {severityMap[viewingIncident.severity].label}
                    </span>
                    <Badge variant={statusMap[viewingIncident.status]?.variant || "outline"}>
                      {statusMap[viewingIncident.status]?.label || String(viewingIncident.status ?? "-")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">事件类型</p>
                    <p className="font-medium">{viewingIncident.incidentType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">上报日期</p>
                    <p className="font-medium">{formatDateValue(viewingIncident.reportDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">上报人</p>
                    <p className="font-medium">{viewingIncident.reportedBy || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">涉及数量</p>
                    <p className="font-medium">{viewingIncident.affectedQuantity || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">发生地点</p>
                    <p className="font-medium">{viewingIncident.location || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">调查人</p>
                    <p className="font-medium">{viewingIncident.investigator || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">解决日期</p>
                    <p className="font-medium">{formatDateValue(viewingIncident.resolveDate)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">事件描述</p>
                  <p className="text-sm bg-muted/30 p-3 rounded">{viewingIncident.description}</p>
                </div>

                {viewingIncident.rootCause && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">根本原因</p>
                    <p className="text-sm bg-muted/30 p-3 rounded">{viewingIncident.rootCause}</p>
                  </div>
                )}

                {viewingIncident.correctiveAction && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">纠正措施</p>
                    <p className="text-sm bg-muted/30 p-3 rounded">{viewingIncident.correctiveAction}</p>
                  </div>
                )}

                {viewingIncident.preventiveAction && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">预防措施</p>
                    <p className="text-sm bg-muted/30 p-3 rounded">{viewingIncident.preventiveAction}</p>
                  </div>
                )}

                {viewingIncident.remarks && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">备注</p>
                    <p className="text-sm">{viewingIncident.remarks}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                关闭
              </Button>
              <Button onClick={() => {
                setViewDialogOpen(false);
                if (viewingIncident) handleEdit(viewingIncident);
              }}>
                编辑
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>
      </div>
    </ERPLayout>
  );
}
