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
  Hospital,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

interface HospitalRecord {
  id: number;
  hospitalName: string;
  hospitalCode: string;
  level: string;
  type: string;
  province: string;
  city: string;
  address: string;
  contactDept: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  products: string;
  productCount: number;
  status: "applying" | "reviewing" | "approved" | "rejected";
  applyDate: string;
  approveDate: string;
  remarks: string;
}

const statusMap: Record<string, any> = {
  applying: { label: "申请中", variant: "outline" as const },
  reviewing: { label: "评审中", variant: "secondary" as const },
  approved: { label: "已入院", variant: "default" as const },
  rejected: { label: "已拒绝", variant: "destructive" as const },
};



const levelOptions = ["三甲", "三乙", "二甲", "二乙", "一甲", "一乙", "社区医院"];
const typeOptions = ["综合医院", "专科医院", "中医医院", "妇幼保健院", "康复医院", "社区卫生服务中心"];
const provinceOptions = [
  "北京市", "上海市", "天津市", "重庆市",
  "广东省", "江苏省", "浙江省", "山东省", "河南省", "四川省",
  "湖北省", "湖南省", "福建省", "安徽省", "河北省", "陕西省"
];

export default function HospitalPage() {
  const { data: _dbData = [], isLoading, refetch } = trpc.dealerQualifications.list.useQuery();
  const createMutation = trpc.dealerQualifications.create.useMutation({ onSuccess: () => { refetch(); toast.success("创建成功"); } });
  const updateMutation = trpc.dealerQualifications.update.useMutation({ onSuccess: () => { refetch(); toast.success("更新成功"); } });
  const deleteMutation = trpc.dealerQualifications.delete.useMutation({ onSuccess: () => { refetch(); toast.success("删除成功"); } });
  const hospitals = _dbData as any[];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<HospitalRecord | null>(null);
  const [viewingHospital, setViewingHospital] = useState<HospitalRecord | null>(null);
  const { canDelete } = usePermission();

  const [formData, setFormData] = useState({
    hospitalName: "",
    hospitalCode: "",
    level: "",
    type: "",
    province: "",
    city: "",
    address: "",
    contactDept: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    products: "",
    productCount: 0,
    status: "applying",
    applyDate: "",
    approveDate: "",
    remarks: "",
  });

  const filteredHospitals = hospitals.filter((h: any) => {
    const matchesSearch =
      String(h.hospitalName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(h.province ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(h.contactPerson ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingHospital(null);
    const nextNo = hospitals.length + 1;
    setFormData({
      hospitalName: "",
      hospitalCode: `H-${String(nextNo).padStart(3, "0")}`,
      level: "",
      type: "",
      province: "",
      city: "",
      address: "",
      contactDept: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      products: "",
      productCount: 0,
      status: "applying",
      applyDate: new Date().toISOString().split("T")[0],
      approveDate: "",
      remarks: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (hospital: HospitalRecord) => {
    setEditingHospital(hospital);
    setFormData({
      hospitalName: hospital.hospitalName,
      hospitalCode: hospital.hospitalCode,
      level: hospital.level,
      type: hospital.type,
      province: hospital.province,
      city: hospital.city,
      address: hospital.address,
      contactDept: hospital.contactDept,
      contactPerson: hospital.contactPerson,
      contactPhone: hospital.contactPhone,
      contactEmail: hospital.contactEmail,
      products: hospital.products,
      productCount: hospital.productCount,
      status: hospital.status,
      applyDate: hospital.applyDate,
      approveDate: hospital.approveDate,
      remarks: hospital.remarks,
    });
    setDialogOpen(true);
  };

  const handleView = (hospital: HospitalRecord) => {
    setViewingHospital(hospital);
    setViewDialogOpen(true);
  };

  const handleDelete = (hospital: HospitalRecord) => {
    if (!canDelete) {
      toast.error("您没有删除权限", { description: "只有管理员可以删除入院记录" });
      return;
    }
    deleteMutation.mutate({ id: hospital.id });
    toast.success("入院记录已删除");
  };

  const handleApprove = (hospital: HospitalRecord) => {
    toast.success("入院申请已通过");
  };

  const handleSubmit = () => {
    if (!formData.hospitalName || !formData.level || !formData.province) {
      toast.error("请填写必填项", { description: "医院名称、等级、省份为必填" });
      return;
    }

    if (editingHospital) {
      toast.success("入院信息已更新");
    } else {
      const newHospital: HospitalRecord = {
        id: Math.max(...hospitals.map((h: any) => h.id)) + 1,
        ...formData,
        status: formData.status as HospitalRecord["status"],
      };
      toast.success("入院申请创建成功");
    }
    setDialogOpen(false);
  };

  const approvedCount = hospitals.filter((h: any) => h.status === "approved").length;
  const reviewingCount = hospitals.filter((h: any) => h.status === "reviewing").length;

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Hospital className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">入院管理</h2>
              <p className="text-sm text-muted-foreground">专门管理产品进入医院的流程</p>
            </div>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            新增入院申请
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">目标医院</p>
              <p className="text-2xl font-bold">{hospitals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">已入院</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">评审中</p>
              <p className="text-2xl font-bold text-amber-600">{reviewingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">入院产品总数</p>
              <p className="text-2xl font-bold text-blue-600">
                {hospitals.reduce((sum: any, h: any) => sum + h.productCount, 0)}
              </p>
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
                  placeholder="搜索医院名称、省份、联系人..."
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
                  <SelectItem value="applying">申请中</SelectItem>
                  <SelectItem value="reviewing">评审中</SelectItem>
                  <SelectItem value="approved">已入院</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
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
                  <TableHead>医院名称</TableHead>
                  <TableHead className="w-[70px]">等级</TableHead>
                  <TableHead className="w-[90px]">省份</TableHead>
                  <TableHead className="w-[130px]">联系人</TableHead>
                  <TableHead className="w-[90px]">入院产品</TableHead>
                  <TableHead className="w-[80px]">状态</TableHead>
                  <TableHead className="w-[100px]">申请日期</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHospitals.map((hospital: any) => (
                  <TableRow key={hospital.id}>
                    <TableCell className="font-medium">{hospital.hospitalName}</TableCell>
                    <TableCell>{hospital.level}</TableCell>
                    <TableCell>{hospital.province}</TableCell>
                    <TableCell>{hospital.contactDept}-{hospital.contactPerson}</TableCell>
                    <TableCell>{hospital.productCount}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[hospital.status]?.variant || "outline"}>
                        {statusMap[hospital.status]?.label || String(hospital.status ?? "-")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateValue(hospital.applyDate)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(hospital)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(hospital)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          {hospital.status === "reviewing" && (
                            <DropdownMenuItem onClick={() => handleApprove(hospital)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              通过审批
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(hospital)}
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
              <DialogTitle>{editingHospital ? "编辑入院信息" : "新增入院申请"}</DialogTitle>
              <DialogDescription>
                {editingHospital ? "修改医院入院信息" : "录入新的医院入院申请"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>医院编号</Label>
                  <Input value={formData.hospitalCode} disabled />
                </div>
                <div className="space-y-2">
                  <Label>医院名称 *</Label>
                  <Input
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                    placeholder="请输入医院全称"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>医院等级 *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择等级" />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map((l: any) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>医院类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((t: any) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>城市</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="城市"
                  />
                </div>
                <div className="space-y-2">
                  <Label>详细地址</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="详细地址"
                  />
                </div>
              </div>

              <div className="text-sm font-medium text-muted-foreground mt-2">联系信息</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>联系部门</Label>
                  <Input
                    value={formData.contactDept}
                    onChange={(e) => setFormData({ ...formData, contactDept: e.target.value })}
                    placeholder="如：设备科、采购部"
                  />
                </div>
                <div className="space-y-2">
                  <Label>联系人</Label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="联系人姓名"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>联系电话</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="联系电话"
                  />
                </div>
                <div className="space-y-2">
                  <Label>电子邮箱</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="电子邮箱"
                  />
                </div>
              </div>

              <div className="text-sm font-medium text-muted-foreground mt-2">入院信息</div>
              <div className="space-y-2">
                <Label>入院产品</Label>
                <Textarea
                  value={formData.products}
                  onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                  placeholder="申请入院的产品，多个产品用逗号分隔"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>入院产品数</Label>
                  <Input
                    type="number"
                    value={formData.productCount}
                    onChange={(e) => setFormData({ ...formData, productCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>申请日期</Label>
                  <Input
                    type="date"
                    value={formData.applyDate}
                    onChange={(e) => setFormData({ ...formData, applyDate: e.target.value })}
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
                      <SelectItem value="applying">申请中</SelectItem>
                      <SelectItem value="reviewing">评审中</SelectItem>
                      <SelectItem value="approved">已入院</SelectItem>
                      <SelectItem value="rejected">已拒绝</SelectItem>
                    </SelectContent>
                  </Select>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editingHospital ? "保存修改" : "提交申请"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情对话框 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>入院详情</DialogTitle>
              <DialogDescription>{viewingHospital?.hospitalName}</DialogDescription>
            </DialogHeader>
            {viewingHospital && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Hospital className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{viewingHospital.hospitalName}</h3>
                      <p className="text-sm text-muted-foreground">{viewingHospital.level} · {viewingHospital.type}</p>
                    </div>
                  </div>
                  <Badge variant={statusMap[viewingHospital.status]?.variant || "outline"}>
                    {statusMap[viewingHospital.status]?.label || String(viewingHospital.status ?? "-")}
                  </Badge>
                </div>

                <div className="text-sm font-medium">基本信息</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">医院编号</p>
                    <p className="font-medium">{viewingHospital.hospitalCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">省份</p>
                    <p className="font-medium">{viewingHospital.province}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">城市</p>
                    <p className="font-medium">{viewingHospital.city || "-"}</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-muted-foreground">详细地址</p>
                    <p className="font-medium">{viewingHospital.address || "-"}</p>
                  </div>
                </div>

                <div className="text-sm font-medium">联系信息</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">联系部门</p>
                    <p className="font-medium">{viewingHospital.contactDept || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">联系人</p>
                    <p className="font-medium">{viewingHospital.contactPerson || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">联系电话</p>
                    <p className="font-medium">{viewingHospital.contactPhone || "-"}</p>
                  </div>
                </div>

                <div className="text-sm font-medium">入院信息</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">入院产品数</p>
                    <p className="font-medium">{viewingHospital.productCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">申请日期</p>
                    <p className="font-medium">{formatDateValue(viewingHospital.applyDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">通过日期</p>
                    <p className="font-medium">{formatDateValue(viewingHospital.approveDate)}</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-muted-foreground">入院产品</p>
                    <p className="font-medium">{viewingHospital.products || "-"}</p>
                  </div>
                </div>

                {viewingHospital.remarks && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">备注</p>
                    <p className="text-sm">{viewingHospital.remarks}</p>
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
                if (viewingHospital) handleEdit(viewingHospital);
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
