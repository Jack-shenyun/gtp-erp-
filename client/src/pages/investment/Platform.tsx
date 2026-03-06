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
  Globe,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

interface Platform {
  id: number;
  platformName: string;
  platformUrl: string;
  province: string;
  accountNo: string;
  password: string;
  contactPerson: string;
  contactPhone: string;
  productCount: number;
  status: "active" | "pending" | "expired";
  registrationDate: string;
  expiryDate: string;
  lastUpdate: string;
  remarks: string;
}

const statusMap: Record<string, any> = {
  active: { label: "正常", variant: "default" as const },
  pending: { label: "待审", variant: "outline" as const },
  expired: { label: "已过期", variant: "destructive" as const },
};



const provinceOptions = [
  "北京市", "上海市", "天津市", "重庆市",
  "广东省", "江苏省", "浙江省", "山东省", "河南省", "四川省",
  "湖北省", "湖南省", "福建省", "安徽省", "河北省", "陕西省",
  "辽宁省", "江西省", "广西壮族自治区", "云南省", "贵州省",
  "山西省", "内蒙古自治区", "黑龙江省", "吉林省", "新疆维吾尔自治区",
  "甘肃省", "海南省", "宁夏回族自治区", "青海省", "西藏自治区"
];

export default function PlatformPage() {
  const { data: _dbData = [], isLoading, refetch } = trpc.dealerQualifications.list.useQuery();
  const createMutation = trpc.dealerQualifications.create.useMutation({ onSuccess: () => { refetch(); toast.success("创建成功"); } });
  const updateMutation = trpc.dealerQualifications.update.useMutation({ onSuccess: () => { refetch(); toast.success("更新成功"); } });
  const deleteMutation = trpc.dealerQualifications.delete.useMutation({ onSuccess: () => { refetch(); toast.success("删除成功"); } });
  const platforms = _dbData as any[];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [viewingPlatform, setViewingPlatform] = useState<Platform | null>(null);
  const { canDelete } = usePermission();

  const [formData, setFormData] = useState({
    platformName: "",
    platformUrl: "",
    province: "",
    accountNo: "",
    password: "",
    contactPerson: "",
    contactPhone: "",
    productCount: 0,
    status: "pending",
    registrationDate: "",
    expiryDate: "",
    lastUpdate: "",
    remarks: "",
  });

  const filteredPlatforms = platforms.filter((p: any) => {
    const matchesSearch =
      String(p.platformName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.province ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.accountNo ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingPlatform(null);
    setFormData({
      platformName: "",
      platformUrl: "",
      province: "",
      accountNo: "",
      password: "",
      contactPerson: "",
      contactPhone: "",
      productCount: 0,
      status: "pending",
      registrationDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      lastUpdate: new Date().toISOString().split("T")[0],
      remarks: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (platform: Platform) => {
    setEditingPlatform(platform);
    setFormData({
      platformName: platform.platformName,
      platformUrl: platform.platformUrl,
      province: platform.province,
      accountNo: platform.accountNo,
      password: platform.password,
      contactPerson: platform.contactPerson,
      contactPhone: platform.contactPhone,
      productCount: platform.productCount,
      status: platform.status,
      registrationDate: platform.registrationDate,
      expiryDate: platform.expiryDate,
      lastUpdate: platform.lastUpdate,
      remarks: platform.remarks,
    });
    setDialogOpen(true);
  };

  const handleView = (platform: Platform) => {
    setViewingPlatform(platform);
    setViewDialogOpen(true);
  };

  const handleDelete = (platform: Platform) => {
    if (!canDelete) {
      toast.error("您没有删除权限", { description: "只有管理员可以删除平台信息" });
      return;
    }
    deleteMutation.mutate({ id: platform.id });
    toast.success("平台信息已删除");
  };

  const handleSubmit = () => {
    if (!formData.platformName || !formData.province || !formData.accountNo) {
      toast.error("请填写必填项", { description: "平台名称、省份、账号为必填" });
      return;
    }

    if (editingPlatform) {
      toast.success("平台信息已更新");
    } else {
      const newPlatform: Platform = {
        id: Math.max(...platforms.map((p: any) => p.id)) + 1,
        ...formData,
        status: formData.status as Platform["status"],
      };
      toast.success("平台创建成功");
    }
    setDialogOpen(false);
  };

  const activeCount = platforms.filter((p: any) => p.status === "active").length;
  const pendingCount = platforms.filter((p: any) => p.status === "pending").length;
  const totalProducts = platforms.reduce((sum: any, p: any) => sum + p.productCount, 0);

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">挂网管理</h2>
              <p className="text-sm text-muted-foreground">统一管理各省市医药招标采购平台账号信息</p>
            </div>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            新增平台
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">平台总数</p>
              <p className="text-2xl font-bold">{platforms.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">正常运营</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">待审核</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">挂网产品</p>
              <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
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
                  placeholder="搜索平台名称、省份、账号..."
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
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="pending">待审</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
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
                  <TableHead>平台名称</TableHead>
                  <TableHead className="w-[90px]">省份</TableHead>
                  <TableHead className="w-[110px]">账号</TableHead>
                  <TableHead className="w-[90px]">挂网产品</TableHead>
                  <TableHead className="w-[80px]">状态</TableHead>
                  <TableHead className="w-[100px]">最后更新</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlatforms.map((platform: any) => (
                  <TableRow key={platform.id}>
                    <TableCell className="font-medium">{platform.platformName}</TableCell>
                    <TableCell>{platform.province}</TableCell>
                    <TableCell>{platform.accountNo}</TableCell>
                    <TableCell>{platform.productCount}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[platform.status]?.variant || "outline"}>
                        {statusMap[platform.status]?.label || String(platform.status ?? "-")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateValue(platform.lastUpdate)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(platform)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(platform)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(platform)}
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
              <DialogTitle>{editingPlatform ? "编辑平台信息" : "新增平台"}</DialogTitle>
              <DialogDescription>
                {editingPlatform ? "修改挂网平台信息" : "录入新的挂网平台账号信息"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>平台名称 *</Label>
                  <Input
                    value={formData.platformName}
                    onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                    placeholder="请输入平台名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label>省份 *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择省份" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinceOptions.map((p: any) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>平台网址</Label>
                <Input
                  value={formData.platformUrl}
                  onChange={(e) => setFormData({ ...formData, platformUrl: e.target.value })}
                  placeholder="https://"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>账号 *</Label>
                  <Input
                    value={formData.accountNo}
                    onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                    placeholder="登录账号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>密码</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="登录密码"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>联系人</Label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="平台对接联系人"
                  />
                </div>
                <div className="space-y-2">
                  <Label>联系电话</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="联系电话"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>注册日期</Label>
                  <Input
                    type="date"
                    value={formData.registrationDate}
                    onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>到期日期</Label>
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
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="pending">待审</SelectItem>
                      <SelectItem value="expired">已过期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>挂网产品数</Label>
                <Input
                  type="number"
                  value={formData.productCount}
                  onChange={(e) => setFormData({ ...formData, productCount: parseInt(e.target.value) || 0 })}
                />
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editingPlatform ? "保存修改" : "创建平台"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情对话框 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>平台详情</DialogTitle>
              <DialogDescription>{viewingPlatform?.platformName}</DialogDescription>
            </DialogHeader>
            {viewingPlatform && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{viewingPlatform.platformName}</h3>
                      <p className="text-sm text-muted-foreground">{viewingPlatform.province}</p>
                    </div>
                  </div>
                  <Badge variant={statusMap[viewingPlatform.status]?.variant || "outline"}>
                    {statusMap[viewingPlatform.status]?.label || String(viewingPlatform.status ?? "-")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">账号</p>
                    <p className="font-medium">{viewingPlatform.accountNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">挂网产品数</p>
                    <p className="font-medium">{viewingPlatform.productCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">联系人</p>
                    <p className="font-medium">{viewingPlatform.contactPerson || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">联系电话</p>
                    <p className="font-medium">{viewingPlatform.contactPhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">注册日期</p>
                    <p className="font-medium">{formatDateValue(viewingPlatform.registrationDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">到期日期</p>
                    <p className="font-medium">{formatDateValue(viewingPlatform.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">最后更新</p>
                    <p className="font-medium">{formatDateValue(viewingPlatform.lastUpdate)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">平台网址</p>
                    <p className="font-medium">
                      {viewingPlatform.platformUrl ? (
                        <a href={viewingPlatform.platformUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {viewingPlatform.platformUrl}
                        </a>
                      ) : "-"}
                    </p>
                  </div>
                </div>

                {viewingPlatform.remarks && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">备注</p>
                    <p className="text-sm">{viewingPlatform.remarks}</p>
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
                if (viewingPlatform) handleEdit(viewingPlatform);
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
