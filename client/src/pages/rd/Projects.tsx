import { formatDateValue } from "@/lib/formatters";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DraggableDialog, DraggableDialogContent } from "@/components/DraggableDialog";
import ERPLayout from "@/components/ERPLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  FolderKanban,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";

interface Project {
  id: number;
  projectNo: string;
  name: string;
  description: string;
  type: string;
  manager: string;
  team: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  status: "planning" | "in_progress" | "review" | "completed" | "suspended";
  priority: string;
  milestones: string;
  remarks: string;
}

const statusMap: Record<string, any> = {
  planning: { label: "规划中", variant: "outline" as const },
  in_progress: { label: "进行中", variant: "default" as const },
  review: { label: "评审中", variant: "secondary" as const },
  completed: { label: "已完成", variant: "secondary" as const },
  suspended: { label: "已暂停", variant: "destructive" as const },
};



const typeOptions = ["新产品开发", "产品改进", "工艺优化", "技术预研", "法规符合"];
const priorityOptions = ["高", "中", "低"];
const teamOptions = ["研发一组", "研发二组", "研发三组", "研发四组"];

export default function ProjectsPage() {
  const { data: _dbData = [], isLoading, refetch } = trpc.rdProjects.list.useQuery();
  const createMutation = trpc.rdProjects.create.useMutation({ onSuccess: () => { refetch(); toast.success("创建成功"); } });
  const updateMutation = trpc.rdProjects.update.useMutation({ onSuccess: () => { refetch(); toast.success("更新成功"); } });
  const deleteMutation = trpc.rdProjects.delete.useMutation({ onSuccess: () => { refetch(); toast.success("删除成功"); } });
  const projects = _dbData as any[];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const { canDelete } = usePermission();

  const [formData, setFormData] = useState({
    projectNo: "",
    name: "",
    description: "",
    type: "",
    manager: "",
    team: "",
    startDate: "",
    endDate: "",
    budget: 0,
    progress: 0,
    status: "planning",
    priority: "中",
    milestones: "",
    remarks: "",
  });

  const filteredProjects = projects.filter((p: any) => {
    const matchesSearch =
      String(p.projectNo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.manager ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingProject(null);
    const nextNo = projects.length + 1;
    setFormData({
      projectNo: `RD-2026-${String(nextNo).padStart(3, "0")}`,
      name: "",
      description: "",
      type: "",
      manager: "",
      team: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      budget: 0,
      progress: 0,
      status: "planning",
      priority: "中",
      milestones: "",
      remarks: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      projectNo: project.projectNo,
      name: project.name,
      description: project.description,
      type: project.type,
      manager: project.manager,
      team: project.team,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      progress: project.progress,
      status: project.status,
      priority: project.priority,
      milestones: project.milestones,
      remarks: project.remarks,
    });
    setDialogOpen(true);
  };

  const handleView = (project: Project) => {
    setViewingProject(project);
    setViewDialogOpen(true);
  };

  const handleDelete = (project: Project) => {
    if (!canDelete) {
      toast.error("您没有删除权限", { description: "只有管理员可以删除项目" });
      return;
    }
    deleteMutation.mutate({ id: project.id });
    toast.success("项目已删除");
  };

  const handleStart = (project: Project) => {
    toast.success("项目已启动");
  };

  const handleSuspend = (project: Project) => {
    toast.success("项目已暂停");
  };

  const handleComplete = (project: Project) => {
    toast.success("项目已完成");
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.manager || !formData.type) {
      toast.error("请填写必填项", { description: "项目名称、项目经理、项目类型为必填" });
      return;
    }

    if (editingProject) {
      toast.success("项目信息已更新");
    } else {
      const newProject: Project = {
        id: Math.max(...projects.map((p: any) => p.id)) + 1,
        ...formData,
        status: formData.status as Project["status"],
      };
      toast.success("项目创建成功");
    }
    setDialogOpen(false);
  };

  const inProgressCount = projects.filter((p: any) => p.status === "in_progress").length;
  const reviewCount = projects.filter((p: any) => p.status === "review").length;
  const completedCount = projects.filter((p: any) => p.status === "completed").length;

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">项目管理</h2>
              <p className="text-sm text-muted-foreground">对研发项目进行全生命周期管理，确保符合ISO 13485要求</p>
            </div>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            新建项目
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">项目总数</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">进行中</p>
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">评审中</p>
              <p className="text-2xl font-bold text-amber-600">{reviewCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">已完成</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
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
                  placeholder="搜索项目编号、名称、项目经理..."
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
                  <SelectItem value="planning">规划中</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="review">评审中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="suspended">已暂停</SelectItem>
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
                  <TableHead className="w-[120px]">项目编号</TableHead>
                  <TableHead>项目名称</TableHead>
                  <TableHead className="w-[90px]">项目经理</TableHead>
                  <TableHead className="w-[100px]">开始日期</TableHead>
                  <TableHead className="w-[100px]">结束日期</TableHead>
                  <TableHead className="w-[120px]">进度</TableHead>
                  <TableHead className="w-[80px]">状态</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.projectNo}</TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.manager}</TableCell>
                    <TableCell>{formatDateValue(project.startDate)}</TableCell>
                    <TableCell>{formatDateValue(project.endDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-2 w-16" />
                        <span className="text-xs text-muted-foreground">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[project.status]?.variant || "outline"}>
                        {statusMap[project.status]?.label || String(project.status ?? "-")}
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
                          <DropdownMenuItem onClick={() => handleView(project)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(project)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          {project.status === "planning" && (
                            <DropdownMenuItem onClick={() => handleStart(project)}>
                              <Play className="h-4 w-4 mr-2" />
                              启动项目
                            </DropdownMenuItem>
                          )}
                          {project.status === "in_progress" && (
                            <>
                              <DropdownMenuItem onClick={() => handleSuspend(project)}>
                                <Pause className="h-4 w-4 mr-2" />
                                暂停项目
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleComplete(project)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                完成项目
                              </DropdownMenuItem>
                            </>
                          )}
                          {project.status === "suspended" && (
                            <DropdownMenuItem onClick={() => handleStart(project)}>
                              <Play className="h-4 w-4 mr-2" />
                              恢复项目
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(project)}
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
              <DialogTitle>{editingProject ? "编辑项目" : "新建项目"}</DialogTitle>
              <DialogDescription>
                {editingProject ? "修改研发项目信息" : "创建新的研发项目"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>项目编号</Label>
                  <Input value={formData.projectNo} disabled />
                </div>
                <div className="space-y-2">
                  <Label>项目名称 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入项目名称"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>项目描述</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="项目目标和范围描述"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>项目类型 *</Label>
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
                  <Label>优先级</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((p: any) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="planning">规划中</SelectItem>
                      <SelectItem value="in_progress">进行中</SelectItem>
                      <SelectItem value="review">评审中</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="suspended">已暂停</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>项目经理 *</Label>
                  <Input
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    placeholder="项目负责人"
                  />
                </div>
                <div className="space-y-2">
                  <Label>研发团队</Label>
                  <Select
                    value={formData.team}
                    onValueChange={(value) => setFormData({ ...formData, team: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择团队" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamOptions.map((t: any) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>开始日期</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>结束日期</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>项目预算 (元)</Label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>当前进度 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>里程碑</Label>
                <Textarea
                  value={formData.milestones}
                  onChange={(e) => setFormData({ ...formData, milestones: e.target.value })}
                  placeholder="项目关键里程碑，用逗号分隔"
                  rows={2}
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
                {editingProject ? "保存修改" : "创建项目"}
              </Button>
            </DialogFooter>
          </DraggableDialogContent>
        </DraggableDialog>

        {/* 查看详情对话框 */}
        <DraggableDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>项目详情</DialogTitle>
              <DialogDescription>{viewingProject?.projectNo}</DialogDescription>
            </DialogHeader>
            {viewingProject && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{viewingProject.name}</h3>
                      <p className="text-sm text-muted-foreground">{viewingProject.type}</p>
                    </div>
                  </div>
                  <Badge variant={statusMap[viewingProject.status]?.variant || "outline"}>
                    {statusMap[viewingProject.status]?.label || String(viewingProject.status ?? "-")}
                  </Badge>
                </div>

                {viewingProject.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">项目描述</p>
                    <p className="text-sm">{viewingProject.description}</p>
                  </div>
                )}

                <div className="text-sm font-medium">基本信息</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">项目编号</p>
                    <p className="font-medium">{viewingProject.projectNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">项目经理</p>
                    <p className="font-medium">{viewingProject.manager}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">研发团队</p>
                    <p className="font-medium">{viewingProject.team || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">优先级</p>
                    <p className="font-medium">{viewingProject.priority}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">项目预算</p>
                    <p className="font-medium">¥{viewingProject.budget?.toLocaleString?.() ?? "0"}</p>
                  </div>
                </div>

                <div className="text-sm font-medium">时间与进度</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">开始日期</p>
                    <p className="font-medium">{formatDateValue(viewingProject.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">结束日期</p>
                    <p className="font-medium">{formatDateValue(viewingProject.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">当前进度</p>
                    <div className="flex items-center gap-2">
                      <Progress value={viewingProject.progress} className="h-2 w-16" />
                      <span className="font-medium">{viewingProject.progress}%</span>
                    </div>
                  </div>
                </div>

                {viewingProject.milestones && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">里程碑</p>
                    <p className="text-sm">{viewingProject.milestones}</p>
                  </div>
                )}

                {viewingProject.remarks && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">备注</p>
                    <p className="text-sm">{viewingProject.remarks}</p>
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
                if (viewingProject) handleEdit(viewingProject);
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
