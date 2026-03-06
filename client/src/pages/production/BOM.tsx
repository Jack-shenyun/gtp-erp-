import { formatDateValue } from "@/lib/formatters";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DraggableDialog, DraggableDialogContent } from "@/components/DraggableDialog";
import ERPLayout from "@/components/ERPLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Layers,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  Package,
  Component,
  Box,
  FileText,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

// 三级BOM结构类型定义
interface BOMItem {
  id: number;
  code: string;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  level: 1 | 2 | 3; // 1=成品, 2=半成品/组件, 3=原材料
  type: "product" | "component" | "material";
  children?: BOMItem[];
}

interface BOMRecord {
  id: number;
  bomCode: string;
  productCode: string;
  productName: string;
  version: string;
  status: "draft" | "active" | "obsolete";
  effectiveDate: string;
  createdBy: string;
  createdAt: string;
  items: BOMItem[];
}

const statusMap: Record<string, any> = {
  draft: { label: "草稿", variant: "outline" as const, color: "text-gray-600" },
  active: { label: "生效", variant: "default" as const, color: "text-green-600" },
  obsolete: { label: "废止", variant: "secondary" as const, color: "text-red-600" },
};

const levelIcons = {
  1: Package,
  2: Component,
  3: Box,
};

const levelLabels = {
  1: "成品",
  2: "半成品/组件",
  3: "原材料",
};

// 示例数据 - 三级BOM结构


// BOM树形结构组件
function BOMTreeItem({ item, level = 0 }: { item: BOMItem; level?: number }) {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = item.children && item.children.length > 0;
  const LevelIcon = levelIcons[item.level];

  return (
    <div className="border-l-2 border-muted ml-4 first:ml-0 first:border-l-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-r ${
            level === 0 ? "bg-primary/5 font-medium" : ""
          }`}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}

          <LevelIcon className="h-4 w-4 text-muted-foreground" />

          <Badge variant="outline" className="text-xs">
            {levelLabels[item.level]}
          </Badge>

          <span className="font-mono text-sm text-muted-foreground">{item.code}</span>
          <span className="font-medium">{item.name}</span>
          <span className="text-sm text-muted-foreground">{item.spec}</span>
          <span className="ml-auto text-sm">
            {item.quantity} {item.unit}
          </span>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <div className="pl-4">
              {item.children!.map((child: any) => (
                <BOMTreeItem key={child.id} item={child} level={level + 1} />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export default function BOMPage() {
  const { data: _dbData = [], isLoading, refetch } = trpc.bom.list.useQuery();
  const createMutation = trpc.bom.create.useMutation({ onSuccess: () => { refetch(); toast.success("创建成功"); } });
  const updateMutation = trpc.bom.update.useMutation({ onSuccess: () => { refetch(); toast.success("更新成功"); } });
  const deleteMutation = trpc.bom.delete.useMutation({ onSuccess: () => { refetch(); toast.success("删除成功"); } });
  const data = _dbData as any[];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BOMRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { canDelete } = usePermission();

  const [formData, setFormData] = useState({
    productCode: "",
    productName: "",
    version: "V1.0",
    status: "draft" as "draft" | "active" | "obsolete",
    effectiveDate: "",
  });

  const filteredData = data.filter((record: any) => {
    const matchesSearch =
      String(record.bomCode ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(record.productName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(record.productCode ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setIsEditing(false);
    setFormData({
      productCode: "",
      productName: "",
      version: "V1.0",
      status: "draft",
      effectiveDate: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (record: BOMRecord) => {
    setIsEditing(true);
    setSelectedRecord(record);
    setFormData({
      productCode: record.productCode,
      productName: record.productName,
      version: record.version,
      status: record.status,
      effectiveDate: record.effectiveDate,
    });
    setDialogOpen(true);
  };

  const handleView = (record: BOMRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleDelete = (record: BOMRecord) => {
    if (!canDelete) {
      toast.error("您没有删除权限");
      return;
    }
    deleteMutation.mutate({ id: record.id });
    toast.success("BOM已删除");
  };

  const handleSubmit = () => {
    if (!formData.productCode || !formData.productName) {
      toast.error("请填写必填字段");
      return;
    }

    if (isEditing && selectedRecord) {
      toast.success("BOM已更新");
    } else {
      const newRecord: BOMRecord = {
        id: Date.now(),
        bomCode: `BOM-${new Date().getFullYear()}-${String(data.length + 1).padStart(3, "0")}`,
        ...formData,
        createdBy: "当前用户",
        createdAt: new Date().toISOString().split("T")[0],
        items: [],
      };
      toast.success("BOM已创建");
    }

    setDialogOpen(false);
  };

  const handleCopy = (record: BOMRecord) => {
    const newRecord: BOMRecord = {
      ...record,
      id: Date.now(),
      bomCode: `BOM-${new Date().getFullYear()}-${String(data.length + 1).padStart(3, "0")}`,
      version: `${record.version}-COPY`,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
    };
    toast.success("BOM已复制");
  };

  // 统计信息
  const stats = {
    total: data.length,
    active: data.filter((r: any) => r.status === "active").length,
    draft: data.filter((r: any) => r.status === "draft").length,
    obsolete: data.filter((r: any) => r.status === "obsolete").length,
  };

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="h-6 w-6" />
              BOM物料清单
            </h1>
            <p className="text-muted-foreground mt-1">
              管理产品的三级物料清单结构（成品 → 半成品/组件 → 原材料）
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            新建BOM
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">BOM总数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">已生效</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.draft}</div>
              <div className="text-sm text-muted-foreground">草稿</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-500">{stats.obsolete}</div>
              <div className="text-sm text-muted-foreground">已废止</div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索BOM编号、产品名称..."
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
              <SelectItem value="active">已生效</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="obsolete">已废止</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* BOM列表 */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BOM编号</TableHead>
                <TableHead>产品编码</TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>生效日期</TableHead>
                <TableHead>创建人</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record: any) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono">{record.bomCode}</TableCell>
                  <TableCell className="font-mono">{record.productCode}</TableCell>
                  <TableCell className="font-medium">{record.productName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.version}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusMap[record.status]?.variant || "outline"}
                      className={statusMap[record.status]?.color || ""}
                    >
                      {statusMap[record.status]?.label || String(record.status ?? "-")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateValue(record.effectiveDate)}</TableCell>
                  <TableCell>{record.createdBy}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(record)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(record)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(record)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading ? "加载中..." : "暂无数据"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* 新建/编辑对话框 */}
        <DraggableDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "编辑BOM" : "新建BOM"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>产品编码 *</Label>
                  <Input
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    placeholder="如: MD-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>版本号</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="如: V1.0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>产品名称 *</Label>
                <Input
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="输入产品名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">草稿</SelectItem>
                      <SelectItem value="active">生效</SelectItem>
                      <SelectItem value="obsolete">废止</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>生效日期</Label>
                  <Input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>{isEditing ? "保存" : "创建"}</Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看BOM结构对话框 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                BOM结构详情 - {selectedRecord?.bomCode}
              </DialogTitle>
            </DialogHeader>

            {selectedRecord && (
              <div className="space-y-6">
                {/* 基本信息 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      基本信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">BOM编号</span>
                        <p className="font-medium font-mono">{selectedRecord.bomCode}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">产品编码</span>
                        <p className="font-medium font-mono">{selectedRecord.productCode}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">产品名称</span>
                        <p className="font-medium">{selectedRecord.productName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">版本</span>
                        <p className="font-medium">{selectedRecord.version}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">状态</span>
                        <div className="mt-1">
                          <Badge
                            variant={statusMap[selectedRecord.status]?.variant || "outline"}
                            className={statusMap[selectedRecord.status]?.color || ""}
                          >
                            {statusMap[selectedRecord.status]?.label || String(selectedRecord.status ?? "-")}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">生效日期</span>
                        <p className="font-medium">{formatDateValue(selectedRecord.effectiveDate)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">创建人</span>
                        <p className="font-medium">{selectedRecord.createdBy}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">创建时间</span>
                        <p className="font-medium">{formatDateValue(selectedRecord.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 三级BOM结构 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      三级物料结构
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedRecord.items.length > 0 ? (
                      <div className="space-y-2">
                        {/* 图例 */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>一级：成品</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Component className="h-4 w-4" />
                            <span>二级：半成品/组件</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Box className="h-4 w-4" />
                            <span>三级：原材料</span>
                          </div>
                        </div>

                        {/* BOM树形结构 */}
                        {selectedRecord.items.map((item: any) => (
                          <BOMTreeItem key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>暂未配置物料结构</p>
                        <Button variant="outline" size="sm" className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          添加物料
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DraggableDialogContent>
        </DraggableDialog>
      </div>
    </ERPLayout>
  );
}
