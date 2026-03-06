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
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

interface Personnel {
  id: number;
  employeeNo: string;
  name: string;
  gender: string;
  idCard: string;
  phone: string;
  email: string;
  department: string;
  position: string;
  status: "active" | "probation" | "leave" | "resigned";
  entryDate: string;
  education: string;
  major: string;
  healthStatus: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  remarks: string;
}

const statusMap: Record<string, any> = {
  active: { label: "在职", variant: "default" as const },
  probation: { label: "试用期", variant: "secondary" as const },
  leave: { label: "休假", variant: "outline" as const },
  resigned: { label: "离职", variant: "destructive" as const },
};



const departmentOptions = [
  "管理部", "招商部", "销售部", "研发部", "生产部", 
  "质量部", "采购部", "仓库管理", "财务部"
];

const educationOptions = ["高中", "大专", "本科", "硕士", "博士"];

export default function PersonnelPage() {
  const { data: _dbData = [], isLoading, refetch } = trpc.personnel.list.useQuery();
  const createMutation = trpc.personnel.create.useMutation({ onSuccess: () => { refetch(); toast.success("创建成功"); } });
  const updateMutation = trpc.personnel.update.useMutation({ onSuccess: () => { refetch(); toast.success("更新成功"); } });
  const deleteMutation = trpc.personnel.delete.useMutation({ onSuccess: () => { refetch(); toast.success("删除成功"); } });
  const personnel = _dbData as any[];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Personnel | null>(null);
  const { canDelete } = usePermission();

  const [formData, setFormData] = useState({
    employeeNo: "",
    name: "",
    gender: "男",
    idCard: "",
    phone: "",
    email: "",
    department: "",
    position: "",
    status: "probation",
    entryDate: "",
    education: "",
    major: "",
    healthStatus: "健康",
    emergencyContact: "",
    emergencyPhone: "",
    address: "",
    remarks: "",
  });

  const filteredPersonnel = personnel.filter((p: any) => {
    const matchesSearch =
      String(p.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.employeeNo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.department ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingPerson(null);
    setFormData({
      employeeNo: `EMP${String(personnel.length + 1).padStart(3, "0")}`,
      name: "",
      gender: "男",
      idCard: "",
      phone: "",
      email: "",
      department: "",
      position: "",
      status: "probation",
      entryDate: new Date().toISOString().split("T")[0],
      education: "",
      major: "",
      healthStatus: "健康",
      emergencyContact: "",
      emergencyPhone: "",
      address: "",
      remarks: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (person: Personnel) => {
    setEditingPerson(person);
    setFormData({
      employeeNo: person.employeeNo,
      name: person.name,
      gender: person.gender,
      idCard: person.idCard,
      phone: person.phone,
      email: person.email,
      department: person.department,
      position: person.position,
      status: person.status,
      entryDate: person.entryDate,
      education: person.education,
      major: person.major,
      healthStatus: person.healthStatus,
      emergencyContact: person.emergencyContact,
      emergencyPhone: person.emergencyPhone,
      address: person.address,
      remarks: person.remarks,
    });
    setDialogOpen(true);
  };

  const handleView = (person: Personnel) => {
    setViewingPerson(person);
    setViewDialogOpen(true);
  };

  const handleDelete = (person: Personnel) => {
    if (!canDelete) {
      toast.error("您没有删除权限", { description: "只有管理员可以删除员工档案" });
      return;
    }
    deleteMutation.mutate({ id: person.id });
    toast.success("员工档案已删除");
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.department || !formData.position) {
      toast.error("请填写必填项", { description: "姓名、部门、职位为必填" });
      return;
    }

    if (editingPerson) {
      toast.success("员工信息已更新");
    } else {
      const newPerson: Personnel = {
        id: Math.max(...personnel.map((p: any) => p.id)) + 1,
        ...formData,
        status: formData.status as Personnel["status"],
      };
      toast.success("员工档案创建成功");
    }
    setDialogOpen(false);
  };

  const activeCount = personnel.filter((p: any) => p.status === "active").length;
  const probationCount = personnel.filter((p: any) => p.status === "probation").length;
  const leaveCount = personnel.filter((p: any) => p.status === "leave").length;

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">人事管理</h2>
              <p className="text-sm text-muted-foreground">建立完整的员工电子档案</p>
            </div>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            新增员工
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">员工总数</p>
              <p className="text-2xl font-bold">{personnel.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">在职人数</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">试用期</p>
              <p className="text-2xl font-bold text-amber-600">{probationCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">休假中</p>
              <p className="text-2xl font-bold text-blue-600">{leaveCount}</p>
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
                  placeholder="搜索工号、姓名、部门..."
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
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="probation">试用期</SelectItem>
                  <SelectItem value="leave">休假</SelectItem>
                  <SelectItem value="resigned">离职</SelectItem>
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
                  <TableHead className="w-[100px]">工号</TableHead>
                  <TableHead className="w-[80px]">姓名</TableHead>
                  <TableHead className="w-[100px]">部门</TableHead>
                  <TableHead>职位</TableHead>
                  <TableHead className="w-[120px]">联系电话</TableHead>
                  <TableHead className="w-[100px]">状态</TableHead>
                  <TableHead className="w-[110px]">入职日期</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersonnel.map((person: any) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.employeeNo}</TableCell>
                    <TableCell>{person.name}</TableCell>
                    <TableCell>{person.department}</TableCell>
                    <TableCell>{person.position}</TableCell>
                    <TableCell>{person.phone}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[person.status]?.variant || "outline"}>
                        {statusMap[person.status]?.label || String(person.status ?? "-")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateValue(person.entryDate)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(person)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(person)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(person)}
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
              <DialogTitle>{editingPerson ? "编辑员工信息" : "新增员工"}</DialogTitle>
              <DialogDescription>
                {editingPerson ? "修改员工档案信息" : "填写新员工的基本信息"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>工号</Label>
                  <Input
                    value={formData.employeeNo}
                    onChange={(e) => setFormData({ ...formData, employeeNo: e.target.value })}
                    disabled={!!editingPerson}
                  />
                </div>
                <div className="space-y-2">
                  <Label>姓名 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label>性别</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>身份证号</Label>
                  <Input
                    value={formData.idCard}
                    onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                    placeholder="请输入身份证号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>联系电话</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>部门 *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择部门" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept: any) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>职位 *</Label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="请输入职位"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>入职日期</Label>
                  <Input
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
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
                      <SelectItem value="active">在职</SelectItem>
                      <SelectItem value="probation">试用期</SelectItem>
                      <SelectItem value="leave">休假</SelectItem>
                      <SelectItem value="resigned">离职</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>健康状况</Label>
                  <Input
                    value={formData.healthStatus}
                    onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                    placeholder="健康状况"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>学历</Label>
                  <Select
                    value={formData.education}
                    onValueChange={(value) => setFormData({ ...formData, education: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择学历" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationOptions.map((edu: any) => (
                        <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>专业</Label>
                  <Input
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="请输入专业"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>邮箱</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>紧急联系人</Label>
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="紧急联系人姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label>紧急联系电话</Label>
                  <Input
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="紧急联系电话"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>家庭住址</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入家庭住址"
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
                {editingPerson ? "保存修改" : "创建员工"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情对话框 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>员工详情</DialogTitle>
              <DialogDescription>
                {viewingPerson?.name} - {viewingPerson?.employeeNo}
              </DialogDescription>
            </DialogHeader>
            {viewingPerson && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{viewingPerson.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {viewingPerson.department} · {viewingPerson.position}
                    </p>
                    <Badge variant={statusMap[viewingPerson.status]?.variant || "outline"} className="mt-1">
                      {statusMap[viewingPerson.status]?.label || String(viewingPerson.status ?? "-")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">工号</p>
                    <p className="font-medium">{viewingPerson.employeeNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">性别</p>
                    <p className="font-medium">{viewingPerson.gender}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">联系电话</p>
                    <p className="font-medium">{viewingPerson.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">邮箱</p>
                    <p className="font-medium">{viewingPerson.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">入职日期</p>
                    <p className="font-medium">{formatDateValue(viewingPerson.entryDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">学历</p>
                    <p className="font-medium">{viewingPerson.education || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">专业</p>
                    <p className="font-medium">{viewingPerson.major || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">健康状况</p>
                    <p className="font-medium">{viewingPerson.healthStatus}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">紧急联系人</p>
                    <p className="font-medium">{viewingPerson.emergencyContact || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">紧急联系电话</p>
                    <p className="font-medium">{viewingPerson.emergencyPhone || "-"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">家庭住址</p>
                  <p className="font-medium">{viewingPerson.address || "-"}</p>
                </div>

                {viewingPerson.remarks && (
                  <div>
                    <p className="text-sm text-muted-foreground">备注</p>
                    <p className="font-medium">{viewingPerson.remarks}</p>
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
                if (viewingPerson) handleEdit(viewingPerson);
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
