import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import ERPLayout from "@/components/ERPLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Type, Barcode, QrCode, Minus, Square, Save, Trash2,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Plus, Eye,
  Printer, ArrowLeft, Layers, Settings, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

// ── 类型 ──────────────────────────────────────────────────────────
type ElementType = "text" | "barcode" | "qrcode" | "line" | "rect";

interface LabelElement {
  id: string;
  type: ElementType;
  x: number; y: number;
  width: number; height: number;
  content: string;
  fieldBinding?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  barcodeFormat?: string;
  showText?: boolean;
}

interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: "mm" | "px";
  elements: LabelElement[];
}

// 可绑定的产品字段
const FIELD_OPTIONS = [
  { value: "productName", label: "产品名称" },
  { value: "specification", label: "规格型号" },
  { value: "registrationNo", label: "注册证号" },
  { value: "udiDi", label: "UDI-DI编码" },
  { value: "batchNo", label: "生产批号" },
  { value: "mfgDate", label: "生产日期" },
  { value: "expDate", label: "有效期至" },
  { value: "serialNo", label: "序列号" },
  { value: "manufacturer", label: "生产企业" },
  { value: "address", label: "企业地址" },
  { value: "custom", label: "自定义文本" },
];

const SAMPLE_DATA: Record<string, string> = {
  productName: "一次性使用无菌注射器",
  specification: "5ml",
  registrationNo: "国械注准20231234567",
  udiDi: "06901234567890",
  batchNo: "20240301",
  mfgDate: "2024-03-01",
  expDate: "2026-03-01",
  serialNo: "SN20240301001",
  manufacturer: "示例医疗器械有限公司",
  address: "广东省深圳市南山区科技园",
};

const BARCODE_FORMATS = ["CODE128", "CODE39", "EAN13", "EAN8", "ITF14", "GS1-128"];

const MM_TO_PX = 3.78; // 1mm ≈ 3.78px at 96dpi

function mmToPx(mm: number) { return Math.round(mm * MM_TO_PX); }

// 生成唯一ID
function uid() { return Math.random().toString(36).slice(2, 9); }

// 默认模板
function defaultTemplate(): LabelTemplate {
  return {
    id: uid(), name: "新建标签模板",
    width: 100, height: 60, unit: "mm",
    elements: [],
  };
}

// 预设模板
const PRESET_TEMPLATES: LabelTemplate[] = [
  {
    id: "preset-udi", name: "UDI标准标签（100×60mm）",
    width: 100, height: 60, unit: "mm",
    elements: [
      { id: uid(), type: "text", x: 5, y: 5, width: 90, height: 8, content: "产品名称", fieldBinding: "productName", fontSize: 12, fontWeight: "bold", textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 15, width: 90, height: 6, content: "规格型号", fieldBinding: "specification", fontSize: 10, fontWeight: "normal", textAlign: "left", color: "#333" },
      { id: uid(), type: "text", x: 5, y: 23, width: 90, height: 6, content: "注册证号：", fieldBinding: "registrationNo", fontSize: 9, fontWeight: "normal", textAlign: "left", color: "#333" },
      { id: uid(), type: "barcode", x: 5, y: 32, width: 55, height: 18, content: "06901234567890", fieldBinding: "udiDi", barcodeFormat: "CODE128", showText: true, color: "#000" },
      { id: uid(), type: "qrcode", x: 68, y: 32, width: 18, height: 18, content: "06901234567890", fieldBinding: "udiDi", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 52, width: 45, height: 5, content: "批号：", fieldBinding: "batchNo", fontSize: 8, fontWeight: "normal", textAlign: "left", color: "#555" },
      { id: uid(), type: "text", x: 52, y: 52, width: 45, height: 5, content: "有效期：", fieldBinding: "expDate", fontSize: 8, fontWeight: "normal", textAlign: "left", color: "#555" },
    ],
  },
];

export default function LabelDesignerPage() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<LabelTemplate>(defaultTemplate());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewMode, setPreviewMode] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<LabelTemplate[]>([]);
  const barcodeRefs = useRef<Record<string, SVGSVGElement | null>>({});
  const qrcodeRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const selectedEl = template.elements.find(e => e.id === selectedId) ?? null;
  const canvasW = mmToPx(template.width);
  const canvasH = mmToPx(template.height);

  // 渲染条形码
  useEffect(() => {
    template.elements.forEach(el => {
      if (el.type === "barcode") {
        const svgEl = barcodeRefs.current[el.id];
        if (svgEl) {
          try {
            const val = el.fieldBinding && el.fieldBinding !== "custom" ? (SAMPLE_DATA[el.fieldBinding] ?? el.content) : el.content;
            JsBarcode(svgEl, val || "0000000000", {
              format: el.barcodeFormat ?? "CODE128",
              displayValue: el.showText !== false,
              width: 1.5, height: mmToPx(el.height) - (el.showText !== false ? 14 : 2),
              margin: 2, fontSize: 9,
            });
          } catch {}
        }
      }
      if (el.type === "qrcode") {
        const canvasEl = qrcodeRefs.current[el.id];
        if (canvasEl) {
          const val = el.fieldBinding && el.fieldBinding !== "custom" ? (SAMPLE_DATA[el.fieldBinding] ?? el.content) : el.content;
          QRCode.toCanvas(canvasEl, val || "UDI", {
            width: mmToPx(el.width), margin: 1,
            color: { dark: el.color ?? "#000000", light: "#ffffff" },
          }).catch(() => {});
        }
      }
    });
  }, [template.elements, previewMode]);

  // 添加元素
  function addElement(type: ElementType) {
    const el: LabelElement = {
      id: uid(), type,
      x: 5, y: 5,
      width: type === "line" ? 60 : type === "qrcode" ? 20 : type === "barcode" ? 60 : 50,
      height: type === "line" ? 0.5 : type === "qrcode" ? 20 : type === "barcode" ? 15 : 8,
      content: type === "text" ? "文本内容" : type === "barcode" ? "06901234567890" : type === "qrcode" ? "06901234567890" : "",
      fontSize: 10, fontWeight: "normal", fontStyle: "normal",
      textAlign: "left", color: "#000000",
      borderColor: "#000000", borderWidth: 1,
      barcodeFormat: "CODE128", showText: true,
    };
    setTemplate(t => ({ ...t, elements: [...t.elements, el] }));
    setSelectedId(el.id);
  }

  // 更新选中元素属性
  function updateEl(patch: Partial<LabelElement>) {
    if (!selectedId) return;
    setTemplate(t => ({
      ...t,
      elements: t.elements.map(e => e.id === selectedId ? { ...e, ...patch } : e),
    }));
  }

  // 删除选中元素
  function deleteEl() {
    if (!selectedId) return;
    setTemplate(t => ({ ...t, elements: t.elements.filter(e => e.id !== selectedId) }));
    setSelectedId(null);
  }

  // 拖拽开始
  function handleMouseDown(e: React.MouseEvent, id: string) {
    if (previewMode) return;
    e.stopPropagation();
    setSelectedId(id);
    const el = template.elements.find(x => x.id === id);
    if (!el) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = canvasW / rect.width;
    const mouseX = (e.clientX - rect.left) * scale;
    const mouseY = (e.clientY - rect.top) * scale;
    setDragOffset({ x: mouseX - mmToPx(el.x), y: mouseY - mmToPx(el.y) });
    setDragging(true);
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !selectedId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = canvasW / rect.width;
    const mouseX = (e.clientX - rect.left) * scale;
    const mouseY = (e.clientY - rect.top) * scale;
    const newX = Math.max(0, Math.min(canvasW - 10, mouseX - dragOffset.x));
    const newY = Math.max(0, Math.min(canvasH - 10, mouseY - dragOffset.y));
    setTemplate(t => ({
      ...t,
      elements: t.elements.map(el =>
        el.id === selectedId
          ? { ...el, x: Math.round(newX / MM_TO_PX * 10) / 10, y: Math.round(newY / MM_TO_PX * 10) / 10 }
          : el
      ),
    }));
  }, [dragging, selectedId, dragOffset, canvasW, canvasH]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  function saveTemplate() {
    setSavedTemplates(prev => {
      const idx = prev.findIndex(t => t.id === template.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = template; return arr; }
      return [...prev, template];
    });
    toast.success(`模板「${template.name}」已保存`);
  }

  function loadPreset(preset: LabelTemplate) {
    setTemplate({ ...preset, id: uid(), elements: preset.elements.map(e => ({ ...e, id: uid() })) });
    setSelectedId(null);
    setShowPresets(false);
    toast.success("预设模板已加载");
  }

  function renderElement(el: LabelElement) {
    const x = mmToPx(el.x);
    const y = mmToPx(el.y);
    const w = mmToPx(el.width);
    const h = mmToPx(el.height);
    const isSelected = el.id === selectedId && !previewMode;
    const displayVal = el.fieldBinding && el.fieldBinding !== "custom"
      ? (SAMPLE_DATA[el.fieldBinding] ?? el.content)
      : el.content;

    const selStyle: React.CSSProperties = isSelected ? {
      outline: "2px solid #2563eb",
      outlineOffset: "1px",
    } : {};

    if (el.type === "text") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{
          position: "absolute", left: x, top: y, width: w, height: h,
          fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle,
          textAlign: el.textAlign, color: el.color, lineHeight: `${h}px`,
          cursor: previewMode ? "default" : "move", userSelect: "none",
          overflow: "hidden", whiteSpace: "nowrap",
          ...selStyle,
        }}>
        {displayVal}
      </div>
    );

    if (el.type === "barcode") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{ position: "absolute", left: x, top: y, width: w, height: h, cursor: previewMode ? "default" : "move", ...selStyle }}>
        <svg ref={ref => { barcodeRefs.current[el.id] = ref; }} style={{ width: "100%", height: "100%" }} />
      </div>
    );

    if (el.type === "qrcode") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{ position: "absolute", left: x, top: y, width: w, height: h, cursor: previewMode ? "default" : "move", ...selStyle }}>
        <canvas ref={ref => { qrcodeRefs.current[el.id] = ref; }} style={{ width: "100%", height: "100%" }} />
      </div>
    );

    if (el.type === "line") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{
          position: "absolute", left: x, top: y, width: w,
          height: Math.max(1, mmToPx(el.height)),
          backgroundColor: el.color ?? "#000",
          cursor: previewMode ? "default" : "move", ...selStyle,
        }} />
    );

    if (el.type === "rect") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{
          position: "absolute", left: x, top: y, width: w, height: h,
          border: `${el.borderWidth ?? 1}px solid ${el.borderColor ?? "#000"}`,
          cursor: previewMode ? "default" : "move", ...selStyle,
        }} />
    );

    return null;
  }

  return (
    <ERPLayout>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* 顶部工具栏 */}
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-white shrink-0 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/production/udi/labels")} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> 返回
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Input
            value={template.name}
            onChange={e => setTemplate(t => ({ ...t, name: e.target.value }))}
            className="w-48 h-8 text-sm"
          />
          <Separator orientation="vertical" className="h-6" />
          {/* 插入工具 */}
          <span className="text-xs text-muted-foreground">插入：</span>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => addElement("text")}>
            <Type className="w-3.5 h-3.5" /> 文本
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => addElement("barcode")}>
            <Barcode className="w-3.5 h-3.5" /> 条形码
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => addElement("qrcode")}>
            <QrCode className="w-3.5 h-3.5" /> 二维码
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => addElement("line")}>
            <Minus className="w-3.5 h-3.5" /> 线条
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => addElement("rect")}>
            <Square className="w-3.5 h-3.5" /> 矩形
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="relative">
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowPresets(!showPresets)}>
              <Layers className="w-3.5 h-3.5" /> 预设模板 {showPresets ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            {showPresets && (
              <div className="absolute top-9 left-0 z-50 bg-white border rounded-lg shadow-lg p-2 w-64">
                {PRESET_TEMPLATES.map(p => (
                  <button key={p.id} onClick={() => loadPreset(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md">
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant={previewMode ? "default" : "outline"} size="sm" className="gap-1.5 h-8"
              onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="w-3.5 h-3.5" /> {previewMode ? "退出预览" : "预览"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => toast.info("请使用浏览器打印功能")}>
              <Printer className="w-3.5 h-3.5" /> 打印
            </Button>
            <Button size="sm" className="gap-1.5 h-8" onClick={saveTemplate}>
              <Save className="w-3.5 h-3.5" /> 保存
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧：图层列表 */}
          <div className="w-44 border-r bg-gray-50 flex flex-col shrink-0 overflow-hidden">
            <div className="px-3 py-2 border-b">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> 图层
              </span>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {template.elements.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">暂无元素</p>
              ) : [...template.elements].reverse().map(el => (
                <div key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs hover:bg-white rounded-md mx-1 ${selectedId === el.id ? "bg-white shadow-sm font-medium text-blue-600" : "text-gray-700"}`}>
                  {el.type === "text" && <Type className="w-3 h-3 shrink-0" />}
                  {el.type === "barcode" && <Barcode className="w-3 h-3 shrink-0" />}
                  {el.type === "qrcode" && <QrCode className="w-3 h-3 shrink-0" />}
                  {el.type === "line" && <Minus className="w-3 h-3 shrink-0" />}
                  {el.type === "rect" && <Square className="w-3 h-3 shrink-0" />}
                  <span className="truncate">
                    {el.type === "text" ? (el.fieldBinding && el.fieldBinding !== "custom" ? FIELD_OPTIONS.find(f => f.value === el.fieldBinding)?.label : el.content) : el.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 中间：画布 */}
          <div className="flex-1 bg-gray-200 overflow-auto flex items-start justify-center p-8">
            <div className="flex flex-col items-center gap-2">
              {/* 标尺顶部 */}
              <div className="flex">
                <div className="w-6 h-5 bg-gray-300 border-b border-r border-gray-400" />
                <div className="relative bg-gray-300 border-b border-gray-400 overflow-hidden" style={{ width: canvasW }}>
                  {Array.from({ length: Math.ceil(template.width / 10) + 1 }).map((_, i) => (
                    <div key={i} style={{ position: "absolute", left: mmToPx(i * 10), top: 0 }} className="flex flex-col items-center">
                      <div className="w-px h-3 bg-gray-500" />
                      <span className="text-[8px] text-gray-600 leading-none">{i * 10}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex">
                {/* 左侧标尺 */}
                <div className="relative w-6 bg-gray-300 border-r border-gray-400 overflow-hidden" style={{ height: canvasH }}>
                  {Array.from({ length: Math.ceil(template.height / 10) + 1 }).map((_, i) => (
                    <div key={i} style={{ position: "absolute", top: mmToPx(i * 10), left: 0 }} className="flex items-center">
                      <div className="h-px w-3 bg-gray-500" />
                      <span className="text-[8px] text-gray-600 leading-none -rotate-90 ml-0.5">{i * 10}</span>
                    </div>
                  ))}
                </div>
                {/* 标签画布 */}
                <div
                  ref={canvasRef}
                  onClick={() => setSelectedId(null)}
                  style={{ width: canvasW, height: canvasH, position: "relative", background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", cursor: "default", overflow: "hidden" }}
                >
                  {template.elements.map(renderElement)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {template.width} × {template.height} mm
                {previewMode && <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-200 text-xs">预览模式</Badge>}
              </div>
            </div>
          </div>

          {/* 右侧：属性面板 */}
          <div className="w-64 border-l bg-white flex flex-col shrink-0 overflow-hidden">
            <div className="px-3 py-2 border-b">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> 属性
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {!selectedEl ? (
                /* 画布属性 */
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">标签尺寸</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">宽度 (mm)</Label>
                      <Input type="number" value={template.width} className="h-7 text-xs"
                        onChange={e => setTemplate(t => ({ ...t, width: +e.target.value || 100 }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">高度 (mm)</Label>
                      <Input type="number" value={template.height} className="h-7 text-xs"
                        onChange={e => setTemplate(t => ({ ...t, height: +e.target.value || 60 }))} />
                    </div>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">点击画布上的元素可编辑其属性</p>
                </div>
              ) : (
                /* 元素属性 */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs capitalize">{selectedEl.type}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={deleteEl}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* 位置尺寸 */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">位置与尺寸 (mm)</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[["X", "x"], ["Y", "y"], ["宽", "width"], ["高", "height"]].map(([lbl, key]) => (
                        <div key={key} className="space-y-0.5">
                          <Label className="text-xs text-muted-foreground">{lbl}</Label>
                          <Input type="number" step="0.5" value={(selectedEl as any)[key]} className="h-7 text-xs"
                            onChange={e => updateEl({ [key]: +e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* 字段绑定 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">绑定产品字段</Label>
                    <Select value={selectedEl.fieldBinding ?? "custom"} onValueChange={v => updateEl({ fieldBinding: v })}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 内容（自定义时显示） */}
                  {(!selectedEl.fieldBinding || selectedEl.fieldBinding === "custom") && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">内容</Label>
                      <Input value={selectedEl.content} className="h-7 text-xs"
                        onChange={e => updateEl({ content: e.target.value })} />
                    </div>
                  )}

                  {/* 文本属性 */}
                  {selectedEl.type === "text" && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">文本样式</p>
                        <div className="space-y-1">
                          <Label className="text-xs">字号 (px)</Label>
                          <Input type="number" value={selectedEl.fontSize ?? 10} className="h-7 text-xs"
                            onChange={e => updateEl({ fontSize: +e.target.value })} />
                        </div>
                        <div className="flex gap-1">
                          <Button variant={selectedEl.fontWeight === "bold" ? "default" : "outline"} size="sm" className="h-7 w-7 p-0"
                            onClick={() => updateEl({ fontWeight: selectedEl.fontWeight === "bold" ? "normal" : "bold" })}>
                            <Bold className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant={selectedEl.fontStyle === "italic" ? "default" : "outline"} size="sm" className="h-7 w-7 p-0"
                            onClick={() => updateEl({ fontStyle: selectedEl.fontStyle === "italic" ? "normal" : "italic" })}>
                            <Italic className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant={selectedEl.textAlign === "left" ? "default" : "outline"} size="sm" className="h-7 w-7 p-0"
                            onClick={() => updateEl({ textAlign: "left" })}><AlignLeft className="w-3.5 h-3.5" /></Button>
                          <Button variant={selectedEl.textAlign === "center" ? "default" : "outline"} size="sm" className="h-7 w-7 p-0"
                            onClick={() => updateEl({ textAlign: "center" })}><AlignCenter className="w-3.5 h-3.5" /></Button>
                          <Button variant={selectedEl.textAlign === "right" ? "default" : "outline"} size="sm" className="h-7 w-7 p-0"
                            onClick={() => updateEl({ textAlign: "right" })}><AlignRight className="w-3.5 h-3.5" /></Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">颜色</Label>
                          <div className="flex gap-1.5 items-center">
                            <input type="color" value={selectedEl.color ?? "#000000"} className="h-7 w-10 rounded cursor-pointer border"
                              onChange={e => updateEl({ color: e.target.value })} />
                            <Input value={selectedEl.color ?? "#000000"} className="h-7 text-xs flex-1"
                              onChange={e => updateEl({ color: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 条形码属性 */}
                  {selectedEl.type === "barcode" && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">条形码设置</p>
                        <div className="space-y-1">
                          <Label className="text-xs">编码格式</Label>
                          <Select value={selectedEl.barcodeFormat ?? "CODE128"} onValueChange={v => updateEl({ barcodeFormat: v })}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {BARCODE_FORMATS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="showText" checked={selectedEl.showText !== false}
                            onChange={e => updateEl({ showText: e.target.checked })} />
                          <Label htmlFor="showText" className="text-xs cursor-pointer">显示文字</Label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 矩形属性 */}
                  {selectedEl.type === "rect" && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">边框设置</p>
                        <div className="space-y-1">
                          <Label className="text-xs">边框颜色</Label>
                          <div className="flex gap-1.5 items-center">
                            <input type="color" value={selectedEl.borderColor ?? "#000000"} className="h-7 w-10 rounded cursor-pointer border"
                              onChange={e => updateEl({ borderColor: e.target.value })} />
                            <Input value={selectedEl.borderColor ?? "#000000"} className="h-7 text-xs flex-1"
                              onChange={e => updateEl({ borderColor: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">边框宽度 (px)</Label>
                          <Input type="number" value={selectedEl.borderWidth ?? 1} className="h-7 text-xs"
                            onChange={e => updateEl({ borderWidth: +e.target.value })} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ERPLayout>
  );
}
