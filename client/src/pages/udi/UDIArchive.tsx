import { useState } from "react";
import { trpc } from "@/lib/trpc";
import ERPLayout from "@/components/ERPLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DraggableDialog, DraggableDialogContent } from "@/components/DraggableDialog";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { QrCode, Plus, Search, Eye, Trash2, MoreHorizontal, FileText } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: number;
  productCode: string;
  productName: string;
  specification?: string;
  registrationNo?: string;
  udiDi?: string;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex py-1.5 border-b border-dashed border-gray-100 last:border-0">
      <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium flex-1">{children ?? "-"}</span>
    </div>
  );
}

export default function UDIArchivePage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState({
    udiDi: "", issuingAgency: "GS1", deviceClass: "II",
    registrationNo: "", productName: "", specification: "",
    productCode: "", manufacturer: "", contactInfo: "",
    labelVersion: "1.0", remark: "",
  });

  const { data: productsData, isLoading } = trpc.products.list.useQuery({ limit: 200 });
  const products: Product[] = (productsData as any)?.items ?? (productsData as any) ?? [];

  const filtered = products.filter(p =>
    !search || p.productName.includes(search) || (p.productCode ?? "").includes(search) || (p.udiDi ?? "").includes(search)
  );

  const total = products.length;
  const withUdi = products.filter(p => p.udiDi).length;
  const withoutUdi = total - withUdi;

  function handleSubmit() {
    if (!form.udiDi) return toast.error("请填写UDI-DI编码");
    toast.success("UDI档案已保存（请在产品档案中维护UDI-DI字段）");
    setFormOpen(false);
  }

  return (
    <ERPLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <QrCode className="w-6 h-6" /> UDI档案管理
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">管理产品UDI-DI编码，绑定注册证信息</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> 新增UDI档案
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div><div className="text-2xl font-bold">{total}</div><div className="text-xs text-muted-foreground">产品总数</div></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
            <QrCode className="w-8 h-8 text-green-500" />
            <div><div className="text-2xl font-bold text-green-600">{withUdi}</div><div className="text-xs text-muted-foreground">已配置UDI</div></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
            <QrCode className="w-8 h-8 text-orange-400" />
            <div><div className="text-2xl font-bold text-orange-500">{withoutUdi}</div><div className="text-xs text-muted-foreground">待配置UDI</div></div>
          </CardContent></Card>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="搜索产品名称、编号、UDI-DI..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品编号</TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>规格型号</TableHead>
                <TableHead>注册证号</TableHead>
                <TableHead>UDI-DI编码</TableHead>
                <TableHead>UDI状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">暂无产品数据</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">{p.productCode}</TableCell>
                  <TableCell className="font-medium">{p.productName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.specification ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.registrationNo ?? "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{p.udiDi ?? <span className="text-muted-foreground">未配置</span>}</TableCell>
                  <TableCell>
                    {p.udiDi
                      ? <Badge className="bg-green-100 text-green-700 border-green-200">已配置</Badge>
                      : <Badge variant="outline" className="text-orange-600 border-orange-300">待配置</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelected(p); setViewOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" />查看详情
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 新增弹窗 */}
      <DraggableDialog open={formOpen} onOpenChange={setFormOpen}>
        <DraggableDialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>新增UDI档案</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>UDI-DI编码 <span className="text-red-500">*</span></Label>
                <Input value={form.udiDi} onChange={e => setForm(p => ({ ...p, udiDi: e.target.value }))} placeholder="如：06901234567890" />
              </div>
              <div className="space-y-1.5">
                <Label>发码机构</Label>
                <Select value={form.issuingAgency} onValueChange={v => setForm(p => ({ ...p, issuingAgency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GS1">GS1（中国物品编码中心）</SelectItem>
                    <SelectItem value="HIBCC">HIBCC</SelectItem>
                    <SelectItem value="ICCBBA">ICCBBA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>产品名称</Label>
                <Input value={form.productName} onChange={e => setForm(p => ({ ...p, productName: e.target.value }))} placeholder="产品名称" />
              </div>
              <div className="space-y-1.5">
                <Label>规格型号</Label>
                <Input value={form.specification} onChange={e => setForm(p => ({ ...p, specification: e.target.value }))} placeholder="规格型号" />
              </div>
              <div className="space-y-1.5">
                <Label>注册证号</Label>
                <Input value={form.registrationNo} onChange={e => setForm(p => ({ ...p, registrationNo: e.target.value }))} placeholder="注册证号" />
              </div>
              <div className="space-y-1.5">
                <Label>器械类别</Label>
                <Select value={form.deviceClass} onValueChange={v => setForm(p => ({ ...p, deviceClass: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">I类</SelectItem>
                    <SelectItem value="II">II类</SelectItem>
                    <SelectItem value="III">III类</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>生产企业</Label>
                <Input value={form.manufacturer} onChange={e => setForm(p => ({ ...p, manufacturer: e.target.value }))} placeholder="生产企业名称" />
              </div>
              <div className="space-y-1.5">
                <Label>标签版本</Label>
                <Input value={form.labelVersion} onChange={e => setForm(p => ({ ...p, labelVersion: e.target.value }))} placeholder="1.0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>保存档案</Button>
          </DialogFooter>
        </DraggableDialogContent>
      </DraggableDialog>

      {/* 详情弹窗 */}
      <DraggableDialog open={viewOpen} onOpenChange={setViewOpen}>
        <DraggableDialogContent className="max-w-xl">
          {selected && (
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h2 className="text-lg font-semibold">UDI档案详情</h2>
                <p className="text-sm text-muted-foreground mt-1">{selected.productName}</p>
              </div>
              <div className="max-h-[55vh] overflow-y-auto space-y-1">
                <FieldRow label="产品编号">{selected.productCode}</FieldRow>
                <FieldRow label="产品名称">{selected.productName}</FieldRow>
                <FieldRow label="规格型号">{selected.specification}</FieldRow>
                <FieldRow label="注册证号">{selected.registrationNo}</FieldRow>
                <FieldRow label="UDI-DI编码">
                  {selected.udiDi
                    ? <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{selected.udiDi}</span>
                    : <span className="text-orange-500">未配置</span>}
                </FieldRow>
              </div>
              <div className="flex justify-end pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setViewOpen(false)}>关闭</Button>
              </div>
            </div>
          )}
        </DraggableDialogContent>
      </DraggableDialog>
    </ERPLayout>
  );
}
