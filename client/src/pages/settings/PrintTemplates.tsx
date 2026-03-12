import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ERPLayout from "@/components/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Printer,
  FileText,
  Edit,
  Eye,
  RotateCcw,
  Save,
  ShoppingCart,
  Truck,
  Receipt,
  Factory,
  Package,
  ClipboardCheck,
  Copy,
  Code,
  Palette,
  Settings2,
  Maximize2,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  TEMPLATE_DEFINITIONS,
  getTemplateDefinition,
  generateExampleContext,
} from "@/lib/printTemplateDefaults";
import {
  buildPrintDocument,
  createPrintContext,
  executePrint,
} from "@/lib/printEngine";

// ==================== 图标映射 ====================
const ICON_MAP: Record<string, React.ElementType> = {
  sales_order: ShoppingCart,
  delivery_note: Truck,
  receipt: Receipt,
  purchase_order: Package,
  production_order: Factory,
  iqc_inspection: ClipboardCheck,
};

const COLOR_MAP: Record<string, string> = {
  sales: "bg-emerald-50 border-emerald-200 text-emerald-700",
  purchase: "bg-cyan-50 border-cyan-200 text-cyan-700",
  production: "bg-orange-50 border-orange-200 text-orange-700",
  quality: "bg-violet-50 border-violet-200 text-violet-700",
};

const MODULE_LABELS: Record<string, string> = {
  sales: "销售部",
  purchase: "采购部",
  production: "生产部",
  quality: "质量部",
};

// ==================== 主页面组件 ====================

export default function PrintTemplatesPage() {
  // 编辑状态
  const [editOpen, setEditOpen] = useState(false);
  const [editFullscreen, setEditFullscreen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingHtml, setEditingHtml] = useState("");
  const [editingCss, setEditingCss] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingDesc, setEditingDesc] = useState("");
  const [editingPaperSize, setEditingPaperSize] = useState("A4");
  const [editingOrientation, setEditingOrientation] = useState("portrait");
  const [editingMargins, setEditingMargins] = useState({ top: 20, right: 20, bottom: 20, left: 20 });
  const [editorTab, setEditorTab] = useState("html");
  const previewRef = useRef<HTMLIFrameElement>(null);

  // 后端数据
  const { data: savedTemplates, refetch } = trpc.printTemplates.list.useQuery();
  const upsertMutation = trpc.printTemplates.upsert.useMutation({
    onSuccess: () => { refetch(); toast.success("模板已保存到服务器"); },
    onError: (err) => toast.error(`保存失败：${err.message}`),
  });
  const deleteMutation = trpc.printTemplates.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("已恢复默认模板"); },
    onError: (err) => toast.error(`重置失败：${err.message}`),
  });
  const { data: companyInfo } = trpc.companyInfo.get.useQuery();

  // 获取模版内容（优先后端保存的，否则用默认）
  const getTemplateContent = useCallback((templateKey: string) => {
    const saved = savedTemplates?.find(t => t.templateKey === templateKey);
    const def = getTemplateDefinition(templateKey);
    if (saved) {
      return {
        htmlContent: saved.htmlContent,
        cssContent: saved.cssContent || def?.defaultCss || "",
        name: saved.name,
        description: saved.description || def?.description || "",
        paperSize: saved.paperSize || "A4",
        orientation: saved.orientation || "portrait",
        marginTop: saved.marginTop ?? 20,
        marginRight: saved.marginRight ?? 20,
        marginBottom: saved.marginBottom ?? 20,
        marginLeft: saved.marginLeft ?? 20,
        isCustomized: true,
      };
    }
    return {
      htmlContent: def?.defaultHtml || "",
      cssContent: def?.defaultCss || "",
      name: def?.name || "",
      description: def?.description || "",
      paperSize: "A4",
      orientation: "portrait",
      marginTop: 20,
      marginRight: 20,
      marginBottom: 20,
      marginLeft: 20,
      isCustomized: false,
    };
  }, [savedTemplates]);

  // 生成预览 HTML
  const previewHtml = useMemo(() => {
    if (!selectedKey) return "";
    const def = getTemplateDefinition(selectedKey);
    if (!def) return "";
    const exampleData = generateExampleContext(def);
    const ctx = createPrintContext(companyInfo || {}, exampleData);
    return buildPrintDocument({
      htmlContent: editingHtml,
      cssContent: editingCss,
      context: ctx,
      paperSize: editingPaperSize,
      orientation: editingOrientation,
      marginTop: editingMargins.top,
      marginRight: editingMargins.right,
      marginBottom: editingMargins.bottom,
      marginLeft: editingMargins.left,
    });
  }, [selectedKey, editingHtml, editingCss, editingPaperSize, editingOrientation, editingMargins, companyInfo]);

  // 更新 iframe 预览
  useEffect(() => {
    if (!editOpen || !previewHtml) return;
    const writeToIframe = () => {
      if (previewRef.current) {
        const doc = previewRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(previewHtml);
          doc.close();
        }
      }
    };
    // 延迟写入确保 Dialog 动画完成后 iframe 已挂载
    const timer = setTimeout(writeToIframe, 100);
    return () => clearTimeout(timer);
  }, [previewHtml, editOpen]);

  // 打开编辑
  const handleEdit = (templateKey: string) => {
    const content = getTemplateContent(templateKey);
    setSelectedKey(templateKey);
    setEditingHtml(content.htmlContent);
    setEditingCss(content.cssContent);
    setEditingName(content.name);
    setEditingDesc(content.description);
    setEditingPaperSize(content.paperSize);
    setEditingOrientation(content.orientation);
    setEditingMargins({
      top: content.marginTop,
      right: content.marginRight,
      bottom: content.marginBottom,
      left: content.marginLeft,
    });
    setEditorTab("html");
    setEditOpen(true);
    setEditFullscreen(false);
  };

  // 预览打印
  const handlePreviewPrint = () => {
    if (!selectedKey) return;
    const def = getTemplateDefinition(selectedKey);
    if (!def) return;
    const exampleData = generateExampleContext(def);
    const ctx = createPrintContext(companyInfo || {}, exampleData);
    executePrint({
      htmlContent: editingHtml,
      cssContent: editingCss,
      context: ctx,
      paperSize: editingPaperSize,
      orientation: editingOrientation,
      marginTop: editingMargins.top,
      marginRight: editingMargins.right,
      marginBottom: editingMargins.bottom,
      marginLeft: editingMargins.left,
    });
  };

  // 保存到后端
  const handleSave = () => {
    if (!selectedKey) return;
    const def = getTemplateDefinition(selectedKey);
    if (!def) return;
    upsertMutation.mutate({
      templateKey: selectedKey,
      name: editingName,
      description: editingDesc,
      module: def.module,
      htmlContent: editingHtml,
      cssContent: editingCss,
      paperSize: editingPaperSize,
      orientation: editingOrientation,
      marginTop: editingMargins.top,
      marginRight: editingMargins.right,
      marginBottom: editingMargins.bottom,
      marginLeft: editingMargins.left,
    });
  };

  // 恢复默认
  const handleReset = () => {
    if (!selectedKey) return;
    const def = getTemplateDefinition(selectedKey);
    if (!def) return;
    // 删除后端记录
    deleteMutation.mutate({ templateKey: selectedKey });
    // 恢复编辑器内容
    setEditingHtml(def.defaultHtml);
    setEditingCss(def.defaultCss);
    setEditingName(def.name);
    setEditingDesc(def.description || "");
    setEditingPaperSize("A4");
    setEditingOrientation("portrait");
    setEditingMargins({ top: 20, right: 20, bottom: 20, left: 20 });
  };

  // 复制变量到剪贴板
  const copyVariable = (varKey: string) => {
    navigator.clipboard.writeText(`{{${varKey}}}`);
    toast.success(`已复制 {{${varKey}}}`);
  };

  // 按模块分组
  const moduleGroups = useMemo(() => {
    const groups: Record<string, typeof TEMPLATE_DEFINITIONS> = {};
    for (const def of TEMPLATE_DEFINITIONS) {
      if (!groups[def.module]) groups[def.module] = [];
      groups[def.module].push(def);
    }
    return groups;
  }, []);

  const selectedDef = selectedKey ? getTemplateDefinition(selectedKey) : null;

  return (
    <ERPLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Printer className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">打印模板管理</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              所见即所得 — 编辑器中的预览效果与实际打印输出完全一致
            </p>
          </div>
        </div>

        {/* 使用说明 */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex gap-3 text-sm text-blue-800">
              <FileText className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">模板语法说明：</span>
                使用 <code className="bg-blue-100 px-1 rounded">{"{{变量名}}"}</code> 插入数据，
                <code className="bg-blue-100 px-1 rounded">{"{{#each items}}...{{/each}}"}</code> 循环明细行，
                <code className="bg-blue-100 px-1 rounded">{"{{#if 变量}}...{{/if}}"}</code> 条件显示，
                <code className="bg-blue-100 px-1 rounded">{"{{金额 | currency}}"}</code> 格式化为货币。
                模板数据保存在服务器，多端同步。
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 按模块分组展示 */}
        {Object.entries(moduleGroups).map(([moduleId, templates]) => (
          <div key={moduleId} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold">{MODULE_LABELS[moduleId] || moduleId}</h2>
              <Badge variant="secondary" className="text-xs">{templates.length} 个模板</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((def) => {
                const Icon = ICON_MAP[def.templateKey] || FileText;
                const color = COLOR_MAP[def.module] || "bg-gray-50 border-gray-200 text-gray-700";
                const content = getTemplateContent(def.templateKey);
                return (
                  <Card key={def.templateKey} className="border transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg border ${color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">{content.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{MODULE_LABELS[def.module]}</p>
                          </div>
                        </div>
                        {content.isCustomized && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 bg-amber-50">
                            已自定义
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{content.description}</p>
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">可用变量：</p>
                        <div className="flex flex-wrap gap-1">
                          {def.variables.filter(v => !v.key.startsWith("company.") && v.key !== "printTime" && v.key !== "printDate").slice(0, 5).map((v) => (
                            <Badge key={v.key} variant="secondary" className="text-xs px-1.5 py-0">
                              {v.label}
                            </Badge>
                          ))}
                          {def.variables.filter(v => !v.key.startsWith("company.") && v.key !== "printTime" && v.key !== "printDate").length > 5 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 text-muted-foreground">
                              +{def.variables.filter(v => !v.key.startsWith("company.") && v.key !== "printTime" && v.key !== "printDate").length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Separator className="mb-3" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleEdit(def.templateKey)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> 编辑模板
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* ==================== 编辑器对话框 ==================== */}
        <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditFullscreen(false); } }}>
          <DialogContent className={editFullscreen ? "max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh]" : "max-w-[95vw] w-[1400px] max-h-[92vh]"}>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  编辑打印模板 — {editingName}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditFullscreen(!editFullscreen)}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex gap-4" style={{ height: editFullscreen ? "calc(98vh - 140px)" : "calc(92vh - 160px)" }}>
              {/* 左侧：编辑器 */}
              <div className="w-[55%] flex flex-col min-w-0">
                {/* 基本信息 */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="space-y-1">
                    <Label className="text-xs">模板名称</Label>
                    <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">纸张大小</Label>
                    <Select value={editingPaperSize} onValueChange={setEditingPaperSize}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">打印方向</Label>
                    <Select value={editingOrientation} onValueChange={setEditingOrientation}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">纵向</SelectItem>
                        <SelectItem value="landscape">横向</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">页边距 (上/右/下/左)</Label>
                    <div className="flex gap-1">
                      {(["top", "right", "bottom", "left"] as const).map((side) => (
                        <Input
                          key={side}
                          type="number"
                          value={editingMargins[side]}
                          onChange={(e) => setEditingMargins(prev => ({ ...prev, [side]: parseInt(e.target.value) || 0 }))}
                          className="h-8 text-xs w-14 text-center"
                          min={0}
                          max={100}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 编辑器标签页 */}
                <Tabs value={editorTab} onValueChange={setEditorTab} className="flex-1 flex flex-col min-h-0">
                  <TabsList className="h-8 w-fit">
                    <TabsTrigger value="html" className="text-xs gap-1 h-7"><Code className="h-3 w-3" /> HTML 模板</TabsTrigger>
                    <TabsTrigger value="css" className="text-xs gap-1 h-7"><Palette className="h-3 w-3" /> CSS 样式</TabsTrigger>
                    <TabsTrigger value="variables" className="text-xs gap-1 h-7"><Settings2 className="h-3 w-3" /> 可用变量</TabsTrigger>
                  </TabsList>

                  <TabsContent value="html" className="flex-1 mt-2 min-h-0">
                    <Textarea
                      value={editingHtml}
                      onChange={(e) => setEditingHtml(e.target.value)}
                      className="font-mono text-xs h-full resize-none"
                      placeholder="在此编写 HTML 模板..."
                      spellCheck={false}
                    />
                  </TabsContent>

                  <TabsContent value="css" className="flex-1 mt-2 min-h-0">
                    <Textarea
                      value={editingCss}
                      onChange={(e) => setEditingCss(e.target.value)}
                      className="font-mono text-xs h-full resize-none"
                      placeholder="在此编写 CSS 样式..."
                      spellCheck={false}
                    />
                  </TabsContent>

                  <TabsContent value="variables" className="flex-1 mt-2 min-h-0 overflow-y-auto">
                    {selectedDef && (
                      <div className="space-y-4">
                        {/* 公司变量 */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2">公司信息变量</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDef.variables.filter(v => v.key.startsWith("company.") || v.key === "printTime" || v.key === "printDate").map((v) => (
                              <Badge
                                key={v.key}
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => copyVariable(v.key)}
                              >
                                <Copy className="h-2.5 w-2.5 mr-1" />
                                {`{{${v.key}}}`} <span className="ml-1 text-muted-foreground">{v.label}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* 业务变量 */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2">业务数据变量</h4>
                          <div className="space-y-2">
                            {selectedDef.variables.filter(v => !v.key.startsWith("company.") && v.key !== "printTime" && v.key !== "printDate").map((v) => (
                              <div key={v.key} className="flex items-start gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                                  onClick={() => copyVariable(v.key)}
                                >
                                  <Copy className="h-2.5 w-2.5 mr-1" />
                                  {`{{${v.key}}}`}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{v.label}</span>
                                {v.type === "number" && (
                                  <Badge variant="secondary" className="text-xs">
                                    支持 | currency / decimal2
                                  </Badge>
                                )}
                                {v.type === "array" && v.children && (
                                  <div className="ml-4 mt-1">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      使用 <code className="bg-muted px-1 rounded">{`{{#each ${v.key}}}...{{/each}}`}</code> 循环，子变量：
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {v.children.map((c) => (
                                        <Badge
                                          key={c.key}
                                          variant="secondary"
                                          className="text-xs cursor-pointer"
                                          onClick={() => { navigator.clipboard.writeText(`{{${c.key}}}`); toast.success(`已复制 {{${c.key}}}`); }}
                                        >
                                          {`{{${c.key}}}`} {c.label}
                                        </Badge>
                                      ))}
                                      <Badge variant="secondary" className="text-xs">
                                        {"{{@number}}"} 序号
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 语法参考 */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2">语法参考</h4>
                          <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                            <div><span className="text-blue-600">{"{{变量名}}"}</span> — 输出变量值</div>
                            <div><span className="text-blue-600">{"{{金额 | currency}}"}</span> — 格式化为 ¥1,000.00</div>
                            <div><span className="text-blue-600">{"{{数值 | decimal2}}"}</span> — 保留2位小数</div>
                            <div><span className="text-blue-600">{"{{百分比 | percent}}"}</span> — 格式化为 65.0%</div>
                            <div><span className="text-green-600">{"{{#each items}}"}...{"{{/each}}"}</span> — 循环数组</div>
                            <div><span className="text-green-600">{"{{@number}}"}</span> — 循环序号（从1开始）</div>
                            <div><span className="text-purple-600">{"{{#if 变量}}"}...{"{{else}}"}...{"{{/if}}"}</span> — 条件判断</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* 右侧：实时预览 */}
              <div className="w-[45%] flex flex-col shrink-0 border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center justify-between border-b">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    实时预览（示例数据）
                  </span>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handlePreviewPrint}>
                      <Printer className="h-3 w-3 mr-1" /> 打印预览
                    </Button>
                  </div>
                </div>
                <div className="flex-1 bg-gray-100 overflow-auto p-2">
                  <iframe
                    ref={previewRef}
                    className="w-full border-0 bg-white shadow-md"
                    style={{
                      height: "100%",
                      minHeight: editingOrientation === "landscape" ? "500px" : "800px",
                    }}
                    title="打印预览"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 mr-auto">
                <RotateCcw className="h-3.5 w-3.5" /> 恢复默认
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setEditOpen(false); setEditFullscreen(false); }}>取消</Button>
              <Button size="sm" onClick={handleSave} className="gap-1.5" disabled={upsertMutation.isPending}>
                <Save className="h-3.5 w-3.5" /> {upsertMutation.isPending ? "保存中..." : "保存模板"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ERPLayout>
  );
}
