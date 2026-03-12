import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import ERPLayout from "@/components/ERPLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Type, Barcode, QrCode, Minus, Square, Save, Trash2,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Plus, Eye,
  Printer, ArrowLeft, Layers, Settings, ChevronDown, ChevronUp,
  Copy, Undo2, Redo2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
  Image, Grid3X3, ZoomIn, ZoomOut, Download, Upload, FileJson,
  Stethoscope, RotateCcw, MousePointer, Move, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import bwipjs from "bwip-js";
import { isGS1Format, is2DFormat, BARCODE_FORMAT_OPTIONS, validateGS1Data, formatHRI, formatHRILines } from "@/lib/gs1BarcodeUtils";
import { MEDICAL_SYMBOLS, renderMedicalSymbol } from "@/components/udi/MedicalSymbols";
import BatchPrintDialog from "@/components/udi/BatchPrintDialog";

// ── 类型定义 ──────────────────────────────────────────────────────
type ElementType = "text" | "barcode" | "qrcode" | "line" | "rect" | "symbol" | "image";

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
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  barcodeFormat?: string;
  showText?: boolean;
  symbolId?: string;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  lineHeight?: number;
  fontFamily?: string;
  textDecoration?: "none" | "underline";
  letterSpacing?: number;
}

interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: "mm" | "px";
  elements: LabelElement[];
  regulation?: "NMPA" | "FDA" | "MDR";
  createdAt?: string;
  updatedAt?: string;
}

interface HistoryState {
  past: LabelTemplate[];
  future: LabelTemplate[];
}

// ── 可绑定的ERP产品字段 ──────────────────────────────────────────
const FIELD_OPTIONS = [
  { value: "custom", label: "自定义文本", group: "基础" },
  { value: "productName", label: "产品名称", group: "产品" },
  { value: "productNameEn", label: "产品英文名", group: "产品" },
  { value: "specification", label: "规格型号", group: "产品" },
  { value: "productCode", label: "产品编码", group: "产品" },
  { value: "category", label: "产品属性", group: "产品" },
  { value: "riskLevel", label: "风险等级", group: "产品" },
  { value: "unit", label: "计量单位", group: "产品" },
  { value: "registrationNo", label: "注册证号", group: "UDI" },
  { value: "udiDi", label: "UDI-DI编码", group: "UDI" },
  { value: "basicUdiDi", label: "Basic UDI-DI", group: "UDI" },
  { value: "srn", label: "SRN编号", group: "UDI" },
  { value: "gtin", label: "GTIN编码", group: "UDI" },
  { value: "batchNo", label: "生产批号", group: "生产" },
  { value: "mfgDate", label: "生产日期", group: "生产" },
  { value: "expDate", label: "有效期至", group: "生产" },
  { value: "serialNo", label: "序列号", group: "生产" },
  { value: "quantity", label: "数量", group: "生产" },
  { value: "manufacturer", label: "生产企业", group: "企业" },
  { value: "manufacturerEn", label: "生产企业(英文)", group: "企业" },
  { value: "address", label: "企业地址", group: "企业" },
  { value: "addressEn", label: "企业地址(英文)", group: "企业" },
  { value: "ecRepName", label: "EC REP名称", group: "企业" },
  { value: "ecRepAddress", label: "EC REP地址", group: "企业" },
  { value: "website", label: "网站", group: "企业" },
  { value: "email", label: "邮箱", group: "企业" },
  { value: "phone", label: "电话", group: "企业" },
];

// 示例数据（用于预览）
const SAMPLE_DATA: Record<string, string> = {
  productName: "胃校准管",
  productNameEn: "Gastric Calibration Tube",
  specification: "34Fr(11.3mm)",
  productCode: "SY01-00",
  category: "CE",
  riskLevel: "II",
  unit: "PCS",
  registrationNo: "国械注准20231234567",
  udiDi: "06975573320097D2",
  basicUdiDi: "6975573320097D2",
  srn: "CN-MF-000026847",
  gtin: "06975573321040",
  batchNo: "2024092401",
  mfgDate: "2024-09-24",
  expDate: "2026-09-23",
  serialNo: "SN20240924001",
  quantity: "1 PCS",
  manufacturer: "苏州神运医疗器械有限公司",
  manufacturerEn: "Suzhou Shenyun Medical Equipment Co., Ltd",
  address: "江苏省苏州市吴中区临湖镇银藏路666号11幢",
  addressEn: "Building 11, No.666 Yinzang Road, Linhu Town, Wuzhong District, Suzhou City, Jiangsu Province, China, 215106",
  ecRepName: "MedPath GmbH",
  ecRepAddress: "Mies-van-der-Rohe-Strasse 8, 80807 Munich, Germany",
  website: "www.shenyun-medical.com",
  email: "info@medpath.pro",
  phone: "+86-512-12345678",
};

const BARCODE_FORMATS = BARCODE_FORMAT_OPTIONS;
const FONT_FAMILIES = [
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier New" },
  { value: "SimSun", label: "宋体" },
  { value: "SimHei", label: "黑体" },
  { value: "Microsoft YaHei", label: "微软雅黑" },
];

const MM_TO_PX = 3.78;
function mmToPx(mm: number) { return Math.round(mm * MM_TO_PX); }
function pxToMm(px: number) { return Math.round(px / MM_TO_PX * 10) / 10; }
function uid() { return Math.random().toString(36).slice(2, 9); }

function defaultTemplate(): LabelTemplate {
  return { id: uid(), name: "新建标签模板", width: 100, height: 150, unit: "mm", elements: [] };
}

// ── 预设模板 ──────────────────────────────────────────────────────
const PRESET_TEMPLATES: LabelTemplate[] = [
  {
    id: "preset-mdr", name: "欧盟MDR标签 (100×150mm)", width: 100, height: 150, unit: "mm", regulation: "MDR",
    elements: [
      { id: uid(), type: "text", x: 5, y: 4, width: 30, height: 7, content: "SHENYUN", fieldBinding: "custom", fontSize: 14, fontWeight: "bold", textAlign: "left", color: "#000", textDecoration: "underline" },
      { id: uid(), type: "text", x: 45, y: 4, width: 52, height: 7, content: "Gastric Calibration Tube", fieldBinding: "productNameEn", fontSize: 12, fontWeight: "bold", textAlign: "right", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 13, width: 35, height: 5, content: "Model: Type I", fieldBinding: "custom", fontSize: 8, textAlign: "left", color: "#333" },
      { id: uid(), type: "text", x: 50, y: 13, width: 47, height: 5, content: "Size: 34Fr(11.3mm)", fieldBinding: "specification", fontSize: 8, textAlign: "right", color: "#333" },
      { id: uid(), type: "symbol", x: 5, y: 20, width: 5, height: 5, content: "", symbolId: "ref", color: "#000" },
      { id: uid(), type: "text", x: 12, y: 20, width: 25, height: 5, content: "SY01-00", fieldBinding: "productCode", fontSize: 9, textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 55, y: 20, width: 42, height: 5, content: "QTY: 1 PCS", fieldBinding: "quantity", fontSize: 9, textAlign: "right", color: "#000" },
      { id: uid(), type: "symbol", x: 5, y: 27, width: 5, height: 5, content: "", symbolId: "mfgDate", color: "#000" },
      { id: uid(), type: "text", x: 12, y: 27, width: 30, height: 5, content: "2024-09-24", fieldBinding: "mfgDate", fontSize: 9, textAlign: "left", color: "#000" },
      { id: uid(), type: "symbol", x: 5, y: 34, width: 5, height: 5, content: "", symbolId: "expiryDate", color: "#000" },
      { id: uid(), type: "text", x: 12, y: 34, width: 30, height: 5, content: "2026-09-23", fieldBinding: "expDate", fontSize: 9, textAlign: "left", color: "#000" },
      { id: uid(), type: "symbol", x: 5, y: 41, width: 5, height: 5, content: "", symbolId: "lot", color: "#000" },
      { id: uid(), type: "text", x: 12, y: 41, width: 40, height: 5, content: "2024092401", fieldBinding: "batchNo", fontSize: 9, textAlign: "left", color: "#000" },
      // 医疗器械符号行
      { id: uid(), type: "symbol", x: 55, y: 27, width: 5, height: 5, content: "", symbolId: "nonSterile", color: "#000" },
      { id: uid(), type: "symbol", x: 62, y: 27, width: 5, height: 5, content: "", symbolId: "caution", color: "#000" },
      { id: uid(), type: "symbol", x: 69, y: 27, width: 5, height: 5, content: "", symbolId: "consultIFU", color: "#000" },
      { id: uid(), type: "symbol", x: 76, y: 27, width: 5, height: 5, content: "", symbolId: "keepFromSun", color: "#000" },
      { id: uid(), type: "symbol", x: 55, y: 35, width: 12, height: 5, content: "", symbolId: "sterileEO", color: "#000" },
      { id: uid(), type: "symbol", x: 70, y: 35, width: 6, height: 5, content: "", symbolId: "md", color: "#000" },
      // UDI信息
      { id: uid(), type: "text", x: 5, y: 48, width: 92, height: 5, content: "Basic UDI-DI  6975573320097D2", fieldBinding: "basicUdiDi", fontSize: 8, textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 53, width: 92, height: 5, content: "SRN  CN-MF-000026847", fieldBinding: "srn", fontSize: 8, textAlign: "left", color: "#000" },
      // CE标志
      { id: uid(), type: "symbol", x: 5, y: 59, width: 8, height: 8, content: "", symbolId: "ce", color: "#000" },
      { id: uid(), type: "text", x: 14, y: 61, width: 15, height: 6, content: "1639", fieldBinding: "custom", fontSize: 12, fontWeight: "bold", textAlign: "left", color: "#000" },
      // 制造商信息
      { id: uid(), type: "line", x: 5, y: 69, width: 92, height: 0.3, content: "", color: "#ccc" },
      { id: uid(), type: "symbol", x: 5, y: 71, width: 5, height: 5, content: "", symbolId: "manufacturer", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 77, width: 45, height: 18, content: "Suzhou Shenyun Medical Equipment Co., Ltd\nBuilding 11, No.666 Yinzang Road, Linhu Town, Wuzhong District, Suzhou City, Jiangsu Province, China, 215106", fieldBinding: "manufacturerEn", fontSize: 6, textAlign: "left", color: "#333", lineHeight: 1.3 },
      { id: uid(), type: "symbol", x: 52, y: 71, width: 10, height: 5, content: "", symbolId: "ecRep", color: "#000" },
      { id: uid(), type: "text", x: 52, y: 77, width: 45, height: 18, content: "MedPath GmbH\nMies-van-der-Rohe-Strasse 8, 80807\nMunich, Germany\ninfo@medpath.pro", fieldBinding: "ecRepName", fontSize: 6, textAlign: "left", color: "#333", lineHeight: 1.3 },
      // 条码区域
      { id: uid(), type: "line", x: 5, y: 96, width: 92, height: 0.3, content: "", color: "#ccc" },
      { id: uid(), type: "symbol", x: 5, y: 98, width: 6, height: 6, content: "", symbolId: "udi", color: "#000" },
      { id: uid(), type: "qrcode", x: 14, y: 98, width: 14, height: 14, content: "(01)06975573321040(17)250924(10)2024092401", barcodeFormat: "GS1-DATAMATRIX", color: "#000" },
      { id: uid(), type: "text", x: 32, y: 98, width: 60, height: 4, content: "(01) 06975573321040", fontSize: 7, fontWeight: "bold", textAlign: "left", color: "#c00", fontFamily: "Courier New" },
      { id: uid(), type: "text", x: 32, y: 103, width: 60, height: 4, content: "(11) 240924", fontSize: 7, fontWeight: "bold", textAlign: "left", color: "#c00", fontFamily: "Courier New" },
      { id: uid(), type: "text", x: 32, y: 108, width: 60, height: 4, content: "(10) 2024092401", fontSize: 7, fontWeight: "bold", textAlign: "left", color: "#c00", fontFamily: "Courier New" },
      // GS1-128 条码
      { id: uid(), type: "barcode", x: 5, y: 115, width: 92, height: 12, content: "(01)06975573321101(17)250112(10)20230113011", barcodeFormat: "GS1-128", showText: true, color: "#000" },
      { id: uid(), type: "barcode", x: 5, y: 129, width: 92, height: 12, content: "(01)06975573321101(17)250112(10)20230113012", barcodeFormat: "GS1-128", showText: true, color: "#000" },
      // 版本号
      { id: uid(), type: "text", x: 75, y: 144, width: 22, height: 4, content: "Ver.03", fieldBinding: "custom", fontSize: 7, textAlign: "right", color: "#c00" },
    ],
  },
  {
    id: "preset-fda", name: "美国FDA标签 (100×80mm)", width: 100, height: 80, unit: "mm", regulation: "FDA",
    elements: [
      { id: uid(), type: "text", x: 5, y: 4, width: 90, height: 7, content: "Gastric Calibration Tube", fieldBinding: "productNameEn", fontSize: 13, fontWeight: "bold", textAlign: "center", color: "#000" },
      { id: uid(), type: "line", x: 5, y: 12, width: 90, height: 0.3, content: "", color: "#000" },
      { id: uid(), type: "symbol", x: 5, y: 15, width: 5, height: 5, content: "", symbolId: "ref", color: "#000" },
      { id: uid(), type: "text", x: 12, y: 15, width: 30, height: 5, content: "SY01-00", fieldBinding: "productCode", fontSize: 9, textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 55, y: 15, width: 40, height: 5, content: "Size: 34Fr(11.3mm)", fieldBinding: "specification", fontSize: 9, textAlign: "right", color: "#000" },
      { id: uid(), type: "symbol", x: 5, y: 22, width: 5, height: 5, content: "", symbolId: "lot", color: "#000" },
      { id: uid(), type: "text", x: 12, y: 22, width: 30, height: 5, content: "2024092401", fieldBinding: "batchNo", fontSize: 9, textAlign: "left", color: "#000" },
      { id: uid(), type: "symbol", x: 55, y: 22, width: 5, height: 5, content: "", symbolId: "expiryDate", color: "#000" },
      { id: uid(), type: "text", x: 62, y: 22, width: 33, height: 5, content: "2026-09-23", fieldBinding: "expDate", fontSize: 9, textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 30, width: 90, height: 5, content: "Rx Only", fontSize: 9, fontWeight: "bold", fontStyle: "italic", textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 37, width: 90, height: 10, content: "Suzhou Shenyun Medical Equipment Co., Ltd\nJiangsu Province, China, 215106", fieldBinding: "manufacturerEn", fontSize: 7, textAlign: "left", color: "#333", lineHeight: 1.3 },
      { id: uid(), type: "line", x: 5, y: 49, width: 90, height: 0.3, content: "", color: "#000" },
      { id: uid(), type: "barcode", x: 5, y: 52, width: 60, height: 12, content: "(01)06975573321040", fieldBinding: "gtin", barcodeFormat: "GS1-128", showText: true, color: "#000" },
      { id: uid(), type: "qrcode", x: 72, y: 52, width: 14, height: 14, content: "(01)06975573321040(17)260923(10)2024092401", barcodeFormat: "GS1-DATAMATRIX", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 67, width: 90, height: 4, content: "FDA Listing: K123456", fieldBinding: "custom", fontSize: 7, textAlign: "left", color: "#555" },
      { id: uid(), type: "barcode", x: 5, y: 72, width: 90, height: 7, content: "(01)06975573321101(17)250112(10)20230113011", barcodeFormat: "GS1-128", showText: false, color: "#000" },
    ],
  },
  {
    id: "preset-nmpa", name: "中国NMPA标签 (100×80mm)", width: 100, height: 80, unit: "mm", regulation: "NMPA",
    elements: [
      { id: uid(), type: "text", x: 5, y: 4, width: 90, height: 7, content: "一次性使用胃校准管", fieldBinding: "productName", fontSize: 13, fontWeight: "bold", textAlign: "center", color: "#000" },
      { id: uid(), type: "line", x: 5, y: 12, width: 90, height: 0.3, content: "", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 15, width: 45, height: 5, content: "规格型号：34Fr(11.3mm)", fieldBinding: "specification", fontSize: 9, textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 55, y: 15, width: 40, height: 5, content: "数量：1 PCS", fieldBinding: "quantity", fontSize: 9, textAlign: "right", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 22, width: 45, height: 5, content: "注册证号：国械注准20231234567", fieldBinding: "registrationNo", fontSize: 8, textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 28, width: 45, height: 5, content: "生产日期：2024-09-24", fieldBinding: "mfgDate", fontSize: 8, textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 55, y: 28, width: 40, height: 5, content: "有效期至：2026-09-23", fieldBinding: "expDate", fontSize: 8, textAlign: "right", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 34, width: 45, height: 5, content: "生产批号：2024092401", fieldBinding: "batchNo", fontSize: 8, textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 40, width: 90, height: 5, content: "生产企业：苏州神运医疗器械有限公司", fieldBinding: "manufacturer", fontSize: 8, textAlign: "left", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 46, width: 90, height: 5, content: "地址：江苏省苏州市吴中区临湖镇银藏路666号11幢", fieldBinding: "address", fontSize: 7, textAlign: "left", color: "#333" },
      { id: uid(), type: "line", x: 5, y: 53, width: 90, height: 0.3, content: "", color: "#000" },
      { id: uid(), type: "barcode", x: 5, y: 56, width: 60, height: 12, content: "(01)06975573321040", fieldBinding: "gtin", barcodeFormat: "GS1-128", showText: true, color: "#000" },
      { id: uid(), type: "qrcode", x: 72, y: 56, width: 14, height: 14, content: "(01)06975573321040(17)260923(10)2024092401", barcodeFormat: "GS1-DATAMATRIX", color: "#000" },
      { id: uid(), type: "text", x: 5, y: 72, width: 90, height: 4, content: "UDI-DI: 06975573320097D2", fieldBinding: "udiDi", fontSize: 7, textAlign: "left", color: "#555" },
    ],
  },
  {
    id: "preset-simple", name: "简易标签 (60×40mm)", width: 60, height: 40, unit: "mm",
    elements: [
      { id: uid(), type: "text", x: 3, y: 3, width: 54, height: 6, content: "产品名称", fieldBinding: "productName", fontSize: 11, fontWeight: "bold", textAlign: "center", color: "#000" },
      { id: uid(), type: "text", x: 3, y: 10, width: 54, height: 4, content: "规格型号", fieldBinding: "specification", fontSize: 8, textAlign: "center", color: "#333" },
      { id: uid(), type: "barcode", x: 3, y: 16, width: 54, height: 12, content: "06975573321040", fieldBinding: "gtin", barcodeFormat: "CODE128", showText: true, color: "#000" },
      { id: uid(), type: "text", x: 3, y: 30, width: 27, height: 4, content: "批号：", fieldBinding: "batchNo", fontSize: 7, textAlign: "left", color: "#555" },
      { id: uid(), type: "text", x: 30, y: 30, width: 27, height: 4, content: "有效期：", fieldBinding: "expDate", fontSize: 7, textAlign: "left", color: "#555" },
      { id: uid(), type: "text", x: 3, y: 35, width: 54, height: 4, content: "生产企业", fieldBinding: "manufacturer", fontSize: 6, textAlign: "center", color: "#555" },
    ],
  },
];

// ── 主组件 ──────────────────────────────────────────────────────
export default function LabelDesignerPage() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<LabelTemplate>(defaultTemplate());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<string | null>(null); // resize handle direction
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, elX: 0, elY: 0 });
  const [previewMode, setPreviewMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasScale, setCanvasScale] = useState(1);
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const [leftTab, setLeftTab] = useState("tools");
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showBatchPrint, setShowBatchPrint] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<LabelTemplate[]>(() => {
    try {
      const stored = localStorage.getItem("udi-label-templates-v2");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const barcodeRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const qrcodeRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const selectedEl = template.elements.find(e => e.id === selectedId) ?? null;
  const canvasW = mmToPx(template.width);
  const canvasH = mmToPx(template.height);

  // ── 历史记录 ──────────────────────────────────────────────────
  const pushHistory = useCallback((t: LabelTemplate) => {
    setHistory(h => ({
      past: [...h.past.slice(-30), t],
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        future: [template, ...h.future],
      };
    });
    setHistory(h => {
      if (h.future.length > 0) {
        const restored = h.past.length > 0 ? h.past[h.past.length - 1] : template;
        // Actually restore from the last past entry
        return h;
      }
      return h;
    });
  }, [template]);

  const handleUndo = () => {
    if (history.past.length === 0) return;
    const prev = history.past[history.past.length - 1];
    setHistory(h => ({
      past: h.past.slice(0, -1),
      future: [template, ...h.future],
    }));
    setTemplate(prev);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    setHistory(h => ({
      past: [...h.past, template],
      future: h.future.slice(1),
    }));
    setTemplate(next);
  };

  // ── 条码渲染 (bwip-js, 符合GS1 UDI标准) ──────────────────────
  useEffect(() => {
    template.elements.forEach(el => {
      if (el.type === "barcode") {
        const canvasEl = barcodeRefs.current[el.id];
        if (canvasEl) {
          try {
            const val = el.fieldBinding && el.fieldBinding !== "custom"
              ? (SAMPLE_DATA[el.fieldBinding] ?? el.content) : el.content;
            const fmt = el.barcodeFormat ?? "CODE128";
            const formatMap: Record<string, string> = {
              "CODE128": "code128", "CODE39": "code39", "EAN13": "ean13",
              "EAN8": "ean8", "ITF14": "itf14", "UPC": "upca",
              "GS1-128": "gs1-128", "GS1-DATAMATRIX": "gs1datamatrix",
              "DATAMATRIX": "datamatrix",
            };
            const bcid = formatMap[fmt.toUpperCase()] ?? "code128";
            bwipjs.toCanvas(canvasEl, {
              bcid,
              text: val || "0000000000",
              scale: 2,
              height: Math.max(5, mmToPx(el.height) / 4),
              includetext: el.showText !== false,
              textxalign: "center",
              textsize: 8,
            });
          } catch { /* invalid barcode data */ }
        }
      }
      if (el.type === "qrcode") {
        const canvasEl = qrcodeRefs.current[el.id];
        if (canvasEl) {
          try {
            const val = el.fieldBinding && el.fieldBinding !== "custom"
              ? (SAMPLE_DATA[el.fieldBinding] ?? el.content) : el.content;
            const fmt = el.barcodeFormat ?? "GS1-DATAMATRIX";
            const isGS1 = fmt.toUpperCase().includes("GS1");
            bwipjs.toCanvas(canvasEl, {
              bcid: isGS1 ? "gs1datamatrix" : "datamatrix",
              text: val || "(01)00000000000000",
              scale: 3,
              paddingwidth: 1,
              paddingheight: 1,
            });
          } catch { /* invalid qrcode data */ }
        }
      }
    });
  }, [template.elements, previewMode, canvasScale]);

  // ── 元素操作 ──────────────────────────────────────────────────
  function addElement(type: ElementType, extra?: Partial<LabelElement>) {
    pushHistory(template);
    const el: LabelElement = {
      id: uid(), type,
      x: 5, y: 5,
      width: type === "line" ? 60 : type === "qrcode" ? 20 : type === "barcode" ? 60 : type === "symbol" ? 8 : 50,
      height: type === "line" ? 0.5 : type === "qrcode" ? 20 : type === "barcode" ? 15 : type === "symbol" ? 8 : 8,
      content: type === "text" ? "文本内容" : type === "barcode" ? "06975573321040" : type === "qrcode" ? "06975573321040" : "",
      fontSize: 10, fontWeight: "normal", fontStyle: "normal",
      textAlign: "left", color: "#000000",
      borderColor: "#000000", borderWidth: 1, borderRadius: 0,
      barcodeFormat: "CODE128", showText: true,
      rotation: 0, opacity: 100, locked: false,
      lineHeight: 1.2, fontFamily: "Arial",
      textDecoration: "none", letterSpacing: 0,
      ...extra,
    };
    setTemplate(t => ({ ...t, elements: [...t.elements, el] }));
    setSelectedId(el.id);
  }

  function addSymbol(symbolId: string) {
    addElement("symbol", { symbolId, width: 8, height: 8 });
  }

  function updateEl(patch: Partial<LabelElement>) {
    if (!selectedId) return;
    pushHistory(template);
    setTemplate(t => ({
      ...t,
      elements: t.elements.map(e => e.id === selectedId ? { ...e, ...patch } : e),
    }));
  }

  function deleteEl() {
    if (!selectedId) return;
    pushHistory(template);
    setTemplate(t => ({ ...t, elements: t.elements.filter(e => e.id !== selectedId) }));
    setSelectedId(null);
  }

  function duplicateEl() {
    if (!selectedEl) return;
    pushHistory(template);
    const newEl = { ...selectedEl, id: uid(), x: selectedEl.x + 3, y: selectedEl.y + 3 };
    setTemplate(t => ({ ...t, elements: [...t.elements, newEl] }));
    setSelectedId(newEl.id);
    toast.success("元素已复制");
  }

  function moveLayer(direction: "up" | "down" | "top" | "bottom") {
    if (!selectedId) return;
    pushHistory(template);
    setTemplate(t => {
      const els = [...t.elements];
      const idx = els.findIndex(e => e.id === selectedId);
      if (idx < 0) return t;
      if (direction === "up" && idx < els.length - 1) {
        [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
      } else if (direction === "down" && idx > 0) {
        [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
      } else if (direction === "top") {
        const el = els.splice(idx, 1)[0];
        els.push(el);
      } else if (direction === "bottom") {
        const el = els.splice(idx, 1)[0];
        els.unshift(el);
      }
      return { ...t, elements: els };
    });
  }

  // ── 拖拽系统 ──────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent, id: string) {
    if (previewMode) return;
    const el = template.elements.find(x => x.id === id);
    if (el?.locked) { setSelectedId(id); return; }
    e.stopPropagation();
    setSelectedId(id);
    if (!el) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = canvasW / rect.width;
    const mouseX = (e.clientX - rect.left) * scale;
    const mouseY = (e.clientY - rect.top) * scale;
    setDragOffset({ x: mouseX - mmToPx(el.x), y: mouseY - mmToPx(el.y) });
    setDragging(true);
    pushHistory(template);
  }

  function handleResizeStart(e: React.MouseEvent, direction: string) {
    e.stopPropagation();
    if (!selectedEl || previewMode) return;
    setResizing(direction);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = canvasW / rect.width;
    setResizeStart({
      x: e.clientX, y: e.clientY,
      w: selectedEl.width, h: selectedEl.height,
      elX: selectedEl.x, elY: selectedEl.y,
    });
    pushHistory(template);
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (resizing && selectedId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scale = canvasW / rect.width;
      const dx = (e.clientX - resizeStart.x) * scale / MM_TO_PX;
      const dy = (e.clientY - resizeStart.y) * scale / MM_TO_PX;

      let newW = resizeStart.w, newH = resizeStart.h, newX = resizeStart.elX, newY = resizeStart.elY;
      if (resizing.includes("e")) newW = Math.max(3, resizeStart.w + dx);
      if (resizing.includes("w")) { newW = Math.max(3, resizeStart.w - dx); newX = resizeStart.elX + dx; }
      if (resizing.includes("s")) newH = Math.max(2, resizeStart.h + dy);
      if (resizing.includes("n")) { newH = Math.max(2, resizeStart.h - dy); newY = resizeStart.elY + dy; }

      setTemplate(t => ({
        ...t,
        elements: t.elements.map(el =>
          el.id === selectedId
            ? { ...el, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10, width: Math.round(newW * 10) / 10, height: Math.round(newH * 10) / 10 }
            : el
        ),
      }));
      return;
    }

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
          ? { ...el, x: pxToMm(newX), y: pxToMm(newY) }
          : el
      ),
    }));
  }, [dragging, resizing, selectedId, dragOffset, canvasW, canvasH, resizeStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setResizing(null);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── 键盘快捷键 ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Delete" || e.key === "Backspace") { deleteEl(); e.preventDefault(); }
      if (e.ctrlKey && e.key === "z") { handleUndo(); e.preventDefault(); }
      if (e.ctrlKey && e.key === "y") { handleRedo(); e.preventDefault(); }
      if (e.ctrlKey && e.key === "d") { duplicateEl(); e.preventDefault(); }
      if (e.key === "Escape") setSelectedId(null);
      // Arrow key nudge
      if (selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setTemplate(t => ({
          ...t,
          elements: t.elements.map(el =>
            el.id === selectedId ? { ...el, x: Math.max(0, el.x + dx * 0.5), y: Math.max(0, el.y + dy * 0.5) } : el
          ),
        }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, template]);

  // ── 模板保存/加载 ──────────────────────────────────────────────
  function saveTemplate() {
    const updated = savedTemplates.some(t => t.id === template.id)
      ? savedTemplates.map(t => t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t)
      : [...savedTemplates, { ...template, createdAt: new Date().toISOString() }];
    setSavedTemplates(updated);
    localStorage.setItem("udi-label-templates-v2", JSON.stringify(updated));
    toast.success(`模板「${template.name}」已保存`);
  }

  function loadPreset(preset: LabelTemplate) {
    pushHistory(template);
    setTemplate({ ...preset, id: uid(), elements: preset.elements.map(e => ({ ...e, id: uid() })) });
    setSelectedId(null);
    setShowPresetDialog(false);
    toast.success("预设模板已加载");
  }

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `label-template-${template.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("模板已导出为JSON");
  }

  function handleImportJSON() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as LabelTemplate;
          if (data.elements && data.width && data.height) {
            pushHistory(template);
            setTemplate({ ...data, id: uid() });
            setSelectedId(null);
            toast.success(`已导入模板: ${data.name}`);
          } else {
            toast.error("无效的模板文件");
          }
        } catch { toast.error("JSON解析失败"); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handlePrint() {
    setPreviewMode(true);
    setTimeout(() => {
      window.print();
      setPreviewMode(false);
    }, 300);
  }

  // ── 渲染元素 ──────────────────────────────────────────────────
  function renderElement(el: LabelElement) {
    const x = mmToPx(el.x);
    const y = mmToPx(el.y);
    const w = mmToPx(el.width);
    const h = mmToPx(el.height);
    const isSelected = el.id === selectedId && !previewMode;
    const displayVal = el.fieldBinding && el.fieldBinding !== "custom"
      ? (SAMPLE_DATA[el.fieldBinding] ?? el.content)
      : el.content;

    const baseStyle: React.CSSProperties = {
      position: "absolute", left: x, top: y, width: w, height: h,
      cursor: previewMode ? "default" : el.locked ? "not-allowed" : "move",
      userSelect: "none",
      opacity: (el.opacity ?? 100) / 100,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    };

    const selBorder = isSelected ? "2px solid #2563eb" : "none";
    const selOutlineOffset = isSelected ? "1px" : undefined;

    // Resize handles
    const resizeHandles = isSelected && !el.locked && !previewMode ? (
      <>
        {["nw", "ne", "sw", "se", "n", "s", "e", "w"].map(dir => {
          const pos: React.CSSProperties = {};
          if (dir.includes("n")) pos.top = -4;
          if (dir.includes("s")) pos.bottom = -4;
          if (dir.includes("w")) pos.left = -4;
          if (dir.includes("e")) pos.right = -4;
          if (dir === "n" || dir === "s") { pos.left = "50%"; pos.marginLeft = -3; }
          if (dir === "e" || dir === "w") { pos.top = "50%"; pos.marginTop = -3; }
          const cursor = dir === "nw" || dir === "se" ? "nwse-resize"
            : dir === "ne" || dir === "sw" ? "nesw-resize"
            : dir === "n" || dir === "s" ? "ns-resize" : "ew-resize";
          return (
            <div key={dir}
              onMouseDown={e => handleResizeStart(e, dir)}
              style={{
                position: "absolute", ...pos,
                width: 7, height: 7,
                background: "white", border: "1.5px solid #2563eb",
                borderRadius: 1, cursor, zIndex: 10,
              }}
            />
          );
        })}
      </>
    ) : null;

    if (el.type === "text") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{
          ...baseStyle,
          fontSize: el.fontSize,
          fontWeight: el.fontWeight,
          fontStyle: el.fontStyle,
          textAlign: el.textAlign,
          color: el.color,
          fontFamily: el.fontFamily || "Arial",
          lineHeight: el.lineHeight || 1.2,
          letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
          textDecoration: el.textDecoration === "underline" ? "underline" : undefined,
          backgroundColor: el.backgroundColor || "transparent",
          overflow: "hidden",
          whiteSpace: displayVal.includes("\n") ? "pre-wrap" : "nowrap",
          outline: selBorder,
          outlineOffset: selOutlineOffset,
        }}>
        {displayVal}
        {resizeHandles}
      </div>
    );

    if (el.type === "barcode") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{ ...baseStyle, outline: selBorder, outlineOffset: selOutlineOffset }}>
        <canvas ref={ref => { barcodeRefs.current[el.id] = ref; }} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        {resizeHandles}
      </div>
    );

    if (el.type === "qrcode") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{ ...baseStyle, outline: selBorder, outlineOffset: selOutlineOffset }}>
        <canvas ref={ref => { qrcodeRefs.current[el.id] = ref; }} style={{ width: "100%", height: "100%" }} />
        {resizeHandles}
      </div>
    );

    if (el.type === "line") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{
          ...baseStyle,
          height: Math.max(1, mmToPx(el.height)),
          backgroundColor: el.color ?? "#000",
          outline: selBorder, outlineOffset: selOutlineOffset,
        }}>
        {resizeHandles}
      </div>
    );

    if (el.type === "rect") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{
          ...baseStyle,
          border: `${el.borderWidth ?? 1}px solid ${el.borderColor ?? "#000"}`,
          borderRadius: el.borderRadius ?? 0,
          backgroundColor: el.backgroundColor || "transparent",
          outline: selBorder, outlineOffset: selOutlineOffset,
        }}>
        {resizeHandles}
      </div>
    );

    if (el.type === "symbol") return (
      <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
        style={{
          ...baseStyle,
          display: "flex", alignItems: "center", justifyContent: "center",
          outline: selBorder, outlineOffset: selOutlineOffset,
        }}>
        {el.symbolId && renderMedicalSymbol(el.symbolId, Math.min(w, h), el.color || "#000")}
        {resizeHandles}
      </div>
    );

    return null;
  }

  // ── 网格线 ──────────────────────────────────────────────────
  const gridPattern = useMemo(() => {
    if (!showGrid || previewMode) return null;
    const step = mmToPx(5);
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <pattern id="grid" width={step} height={step} patternUnits="userSpaceOnUse">
            <path d={`M ${step} 0 L 0 0 0 ${step}`} fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
          </pattern>
          <pattern id="gridBig" width={step * 2} height={step * 2} patternUnits="userSpaceOnUse">
            <path d={`M ${step * 2} 0 L 0 0 0 ${step * 2}`} fill="none" stroke="#ccc" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#gridBig)" />
      </svg>
    );
  }, [showGrid, previewMode, canvasW, canvasH]);

  // ── 渲染 ──────────────────────────────────────────────────────
  return (
    <ERPLayout>
      <div className="flex flex-col h-[calc(100vh-80px)] print:h-auto">
        {/* ===== 顶部工具栏 ===== */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b bg-white shrink-0 flex-wrap print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate("/production/udi")} className="gap-1 h-7 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> 返回
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Input
            value={template.name}
            onChange={e => setTemplate(t => ({ ...t, name: e.target.value }))}
            className="w-44 h-7 text-xs"
          />
          {template.regulation && (
            <Badge variant="outline" className="text-[10px] h-5">
              {template.regulation}
            </Badge>
          )}
          <Separator orientation="vertical" className="h-5" />

          {/* 插入工具按钮 */}
          <span className="text-[10px] text-muted-foreground font-medium">插入:</span>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => addElement("text")}>
              <Type className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">文本 (T)</p></TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => addElement("barcode")}>
              <Barcode className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">条形码</p></TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => addElement("qrcode")}>
              <QrCode className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">二维码</p></TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => addElement("line")}>
              <Minus className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">线条</p></TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => addElement("rect")}>
              <Square className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">矩形</p></TooltipContent></Tooltip>

          <Separator orientation="vertical" className="h-5" />

          {/* 撤销/重做 */}
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleUndo} disabled={history.past.length === 0}>
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">撤销 (Ctrl+Z)</p></TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleRedo} disabled={history.future.length === 0}>
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">重做 (Ctrl+Y)</p></TooltipContent></Tooltip>

          <Separator orientation="vertical" className="h-5" />

          {/* 视图控制 */}
          <Tooltip><TooltipTrigger asChild>
            <Button variant={showGrid ? "default" : "outline"} size="sm" className="h-7 w-7 p-0" onClick={() => setShowGrid(!showGrid)}>
              <Grid3X3 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">网格线</p></TooltipContent></Tooltip>

          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setCanvasScale(s => Math.max(0.5, s - 0.15))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground w-8 text-center tabular-nums">
              {Math.round(canvasScale * 100)}%
            </span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setCanvasScale(s => Math.min(3, s + 0.15))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* 右侧操作 */}
          <div className="ml-auto flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                  <Layers className="w-3.5 h-3.5" /> 模板 <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowPresetDialog(true)} className="gap-2 text-xs">
                  <Stethoscope className="w-3.5 h-3.5" /> 预设法规模板
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportJSON} className="gap-2 text-xs">
                  <Upload className="w-3.5 h-3.5" /> 导入JSON模板
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON} className="gap-2 text-xs">
                  <Download className="w-3.5 h-3.5" /> 导出JSON模板
                </DropdownMenuItem>
                {savedTemplates.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">已保存</div>
                    {savedTemplates.map(t => (
                      <DropdownMenuItem key={t.id} onClick={() => loadPreset(t)} className="text-xs gap-2">
                        <FileJson className="w-3 h-3" />
                        <span className="truncate flex-1">{t.name}</span>
                        {t.regulation && <Badge variant="outline" className="text-[9px] h-4">{t.regulation}</Badge>}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant={previewMode ? "default" : "outline"} size="sm" className="gap-1 h-7 text-xs"
              onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="w-3.5 h-3.5" /> {previewMode ? "退出预览" : "预览"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs"><Printer className="w-3.5 h-3.5" />打印<ChevronDown className="w-3 h-3" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePrint} className="gap-2 text-xs"><Printer className="w-3.5 h-3.5" />单张打印</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBatchPrint(true)} className="gap-2 text-xs"><Layers className="w-3.5 h-3.5" />批量打印 (Excel/CSV)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="gap-1 h-7 text-xs" onClick={saveTemplate}>
              <Save className="w-3.5 h-3.5" /> 保存
            </Button>
          </div>
        </div>

        {/* ===== 主区域 ===== */}
        <div className="flex flex-1 overflow-hidden print:block">
          {/* 左侧面板 */}
          <div className="w-52 border-r bg-gray-50 flex flex-col shrink-0 overflow-hidden print:hidden">
            <Tabs value={leftTab} onValueChange={setLeftTab} className="flex flex-col h-full">
              <TabsList className="h-8 bg-gray-100 rounded-none border-b shrink-0 w-full justify-start px-1">
                <TabsTrigger value="tools" className="text-[10px] h-6 px-2 gap-1">
                  <Plus className="w-3 h-3" /> 工具
                </TabsTrigger>
                <TabsTrigger value="layers" className="text-[10px] h-6 px-2 gap-1">
                  <Layers className="w-3 h-3" /> 图层
                </TabsTrigger>
                <TabsTrigger value="symbols" className="text-[10px] h-6 px-2 gap-1">
                  <Stethoscope className="w-3 h-3" /> 符号
                </TabsTrigger>
              </TabsList>

              {/* 工具标签页 */}
              <TabsContent value="tools" className="flex-1 overflow-y-auto m-0 p-2 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">基础元素</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { type: "text" as ElementType, icon: Type, label: "文本" },
                    { type: "barcode" as ElementType, icon: Barcode, label: "条形码" },
                    { type: "qrcode" as ElementType, icon: QrCode, label: "二维码" },
                    { type: "line" as ElementType, icon: Minus, label: "线条" },
                    { type: "rect" as ElementType, icon: Square, label: "矩形" },
                  ].map(({ type, icon: Icon, label }) => (
                    <button key={type} onClick={() => addElement(type)}
                      className="flex flex-col items-center gap-1 p-2 rounded-md border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs text-gray-700">
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{label}</span>
                    </button>
                  ))}
                </div>

                <Separator className="my-2" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">快捷操作</p>
                <div className="space-y-1">
                  <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5 justify-start" onClick={() => setShowPresetDialog(true)}>
                    <Stethoscope className="w-3 h-3" /> 加载预设模板
                  </Button>
                  <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5 justify-start" onClick={() => {
                    pushHistory(template);
                    setTemplate(defaultTemplate());
                    setSelectedId(null);
                  }}>
                    <RotateCcw className="w-3 h-3" /> 新建空白模板
                  </Button>
                </div>
              </TabsContent>

              {/* 图层标签页 */}
              <TabsContent value="layers" className="flex-1 overflow-y-auto m-0">
                <div className="py-1">
                  {template.elements.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">暂无元素<br />从工具栏添加</p>
                  ) : [...template.elements].reverse().map(el => (
                    <div key={el.id}
                      onClick={() => setSelectedId(el.id)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-[11px] hover:bg-white mx-1 rounded ${selectedId === el.id ? "bg-white shadow-sm font-medium text-blue-600 ring-1 ring-blue-200" : "text-gray-600"}`}>
                      <GripVertical className="w-3 h-3 text-gray-300 shrink-0" />
                      {el.type === "text" && <Type className="w-3 h-3 shrink-0" />}
                      {el.type === "barcode" && <Barcode className="w-3 h-3 shrink-0" />}
                      {el.type === "qrcode" && <QrCode className="w-3 h-3 shrink-0" />}
                      {el.type === "line" && <Minus className="w-3 h-3 shrink-0" />}
                      {el.type === "rect" && <Square className="w-3 h-3 shrink-0" />}
                      {el.type === "symbol" && <Stethoscope className="w-3 h-3 shrink-0" />}
                      <span className="truncate flex-1">
                        {el.type === "text"
                          ? (el.fieldBinding && el.fieldBinding !== "custom"
                            ? FIELD_OPTIONS.find(f => f.value === el.fieldBinding)?.label
                            : (el.content || "文本").slice(0, 12))
                          : el.type === "symbol"
                          ? MEDICAL_SYMBOLS.find(s => s.id === el.symbolId)?.nameZh || "符号"
                          : el.type}
                      </span>
                      {el.locked && <span className="text-[8px] text-orange-500">锁</span>}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* 医疗器械符号标签页 */}
              <TabsContent value="symbols" className="flex-1 overflow-y-auto m-0 p-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">ISO 15223 符号</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {MEDICAL_SYMBOLS.map(sym => (
                    <button key={sym.id} onClick={() => addSymbol(sym.id)}
                      className="flex flex-col items-center gap-1 p-2 rounded-md border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors">
                      {sym.render(20, "#333")}
                      <span className="text-[9px] text-gray-600 leading-tight text-center">{sym.nameZh}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 中间：画布 */}
          <div className="flex-1 bg-gray-200 overflow-auto flex items-start justify-center p-6 print:p-0 print:bg-white">
            <div className="flex flex-col items-center gap-1" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
              {/* 顶部标尺 */}
              {!previewMode && (
                <div className="flex print:hidden">
                  <div className="w-5 h-4 bg-gray-300 border-b border-r border-gray-400" />
                  <div className="relative bg-gray-300 border-b border-gray-400 overflow-hidden" style={{ width: canvasW }}>
                    {Array.from({ length: Math.ceil(template.width / 10) + 1 }).map((_, i) => (
                      <div key={i} style={{ position: "absolute", left: mmToPx(i * 10), top: 0 }} className="flex flex-col items-center">
                        <div className="w-px h-2.5 bg-gray-500" />
                        <span className="text-[7px] text-gray-600 leading-none">{i * 10}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex">
                {/* 左侧标尺 */}
                {!previewMode && (
                  <div className="relative w-5 bg-gray-300 border-r border-gray-400 overflow-hidden print:hidden" style={{ height: canvasH }}>
                    {Array.from({ length: Math.ceil(template.height / 10) + 1 }).map((_, i) => (
                      <div key={i} style={{ position: "absolute", top: mmToPx(i * 10), left: 0 }} className="flex items-center">
                        <div className="h-px w-2.5 bg-gray-500" />
                        <span className="text-[7px] text-gray-600 leading-none -rotate-90 ml-0.5">{i * 10}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* 标签画布 */}
                <div
                  ref={canvasRef}
                  onClick={() => !previewMode && setSelectedId(null)}
                  className="label-print-canvas"
                  style={{
                    width: canvasW, height: canvasH,
                    position: "relative", background: "white",
                    boxShadow: previewMode ? "none" : "0 2px 12px rgba(0,0,0,0.15)",
                    cursor: "default", overflow: "hidden",
                    border: previewMode ? "1px solid #333" : "none",
                  }}
                >
                  {gridPattern}
                  {template.elements.map(renderElement)}
                </div>
              </div>
              <div className="text-[10px] text-gray-500 mt-1 print:hidden">
                {template.width} × {template.height} mm
                {previewMode && <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-200 text-[10px]">预览模式</Badge>}
              </div>
            </div>
          </div>

          {/* 右侧：属性面板 */}
          <div className="w-60 border-l bg-white flex flex-col shrink-0 overflow-hidden print:hidden">
            <div className="px-3 py-2 border-b bg-gray-50">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                {selectedEl ? "元素属性" : "标签属性"}
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {!selectedEl ? (
                  /* ── 画布属性 ── */
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">模板名称</Label>
                      <Input value={template.name} className="h-7 text-xs"
                        onChange={e => setTemplate(t => ({ ...t, name: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">宽度 (mm)</Label>
                        <Input type="number" value={template.width} className="h-7 text-xs"
                          onChange={e => setTemplate(t => ({ ...t, width: +e.target.value || 100 }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">高度 (mm)</Label>
                        <Input type="number" value={template.height} className="h-7 text-xs"
                          onChange={e => setTemplate(t => ({ ...t, height: +e.target.value || 60 }))} />
                      </div>
                    </div>
                    <Separator />
                    <div className="p-2 bg-gray-50 rounded text-[10px] text-muted-foreground space-y-1">
                      <p className="font-medium text-gray-600">常用标签尺寸：</p>
                      {[
                        { w: 100, h: 150, n: "内包装 (100×150)" },
                        { w: 100, h: 80, n: "中包装 (100×80)" },
                        { w: 148, h: 210, n: "外包装 (148×210)" },
                        { w: 60, h: 40, n: "小标签 (60×40)" },
                      ].map(s => (
                        <button key={s.n} onClick={() => setTemplate(t => ({ ...t, width: s.w, height: s.h }))}
                          className="block w-full text-left px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          {s.n}
                        </button>
                      ))}
                    </div>
                    <Separator />
                    <p className="text-[10px] text-muted-foreground">
                      点击画布上的元素可编辑其属性。<br />
                      快捷键: Del删除 | Ctrl+Z撤销 | Ctrl+D复制 | 方向键微调
                    </p>
                  </div>
                ) : (
                  /* ── 元素属性 ── */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] capitalize">{selectedEl.type}</Badge>
                      <div className="flex items-center gap-0.5">
                        <Tooltip><TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={duplicateEl}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger><TooltipContent><p className="text-xs">复制 (Ctrl+D)</p></TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={deleteEl}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger><TooltipContent><p className="text-xs">删除 (Del)</p></TooltipContent></Tooltip>
                      </div>
                    </div>

                    {/* 层级控制 */}
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground mr-1">层级:</span>
                      <Tooltip><TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => moveLayer("top")}>
                          <ChevronsUp className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger><TooltipContent><p className="text-xs">置顶</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => moveLayer("up")}>
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger><TooltipContent><p className="text-xs">上移</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => moveLayer("down")}>
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger><TooltipContent><p className="text-xs">下移</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => moveLayer("bottom")}>
                          <ChevronsDown className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger><TooltipContent><p className="text-xs">置底</p></TooltipContent></Tooltip>
                    </div>

                    <Separator />

                    {/* 位置尺寸 */}
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">位置与尺寸 (mm)</p>
                      <div className="grid grid-cols-4 gap-1">
                        {[["X", "x"], ["Y", "y"], ["宽", "width"], ["高", "height"]].map(([lbl, key]) => (
                          <div key={key} className="space-y-0.5">
                            <Label className="text-[9px] text-muted-foreground">{lbl}</Label>
                            <Input type="number" step="0.5" value={(selectedEl as any)[key]} className="h-6 text-[10px] px-1"
                              onChange={e => updateEl({ [key]: +e.target.value })} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* 字段绑定 */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-medium">绑定ERP字段</Label>
                      <Select value={selectedEl.fieldBinding ?? "custom"} onValueChange={v => updateEl({ fieldBinding: v })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["基础", "产品", "UDI", "生产", "企业"].map(group => (
                            <div key={group}>
                              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">{group}</div>
                              {FIELD_OPTIONS.filter(f => f.group === group).map(f => (
                                <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 内容（自定义时显示） */}
                    {(!selectedEl.fieldBinding || selectedEl.fieldBinding === "custom") && selectedEl.type !== "symbol" && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-medium">内容</Label>
                        <Input value={selectedEl.content} className="h-7 text-xs"
                          onChange={e => updateEl({ content: e.target.value })} />
                      </div>
                    )}

                    {/* 符号选择 */}
                    {selectedEl.type === "symbol" && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-medium">符号类型</Label>
                        <Select value={selectedEl.symbolId ?? ""} onValueChange={v => updateEl({ symbolId: v })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MEDICAL_SYMBOLS.map(s => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">{s.nameZh}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* 文本属性 */}
                    {selectedEl.type === "text" && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground font-medium">文本样式</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="space-y-0.5">
                              <Label className="text-[9px] text-muted-foreground">字号</Label>
                              <Input type="number" value={selectedEl.fontSize ?? 10} className="h-6 text-[10px] px-1"
                                onChange={e => updateEl({ fontSize: +e.target.value })} />
                            </div>
                            <div className="space-y-0.5">
                              <Label className="text-[9px] text-muted-foreground">行高</Label>
                              <Input type="number" step="0.1" value={selectedEl.lineHeight ?? 1.2} className="h-6 text-[10px] px-1"
                                onChange={e => updateEl({ lineHeight: +e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[9px] text-muted-foreground">字体</Label>
                            <Select value={selectedEl.fontFamily ?? "Arial"} onValueChange={v => updateEl({ fontFamily: v })}>
                              <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {FONT_FAMILIES.map(f => (
                                  <SelectItem key={f.value} value={f.value} className="text-xs" style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-0.5">
                            <Button variant={selectedEl.fontWeight === "bold" ? "default" : "outline"} size="sm" className="h-6 w-6 p-0"
                              onClick={() => updateEl({ fontWeight: selectedEl.fontWeight === "bold" ? "normal" : "bold" })}>
                              <Bold className="w-3 h-3" />
                            </Button>
                            <Button variant={selectedEl.fontStyle === "italic" ? "default" : "outline"} size="sm" className="h-6 w-6 p-0"
                              onClick={() => updateEl({ fontStyle: selectedEl.fontStyle === "italic" ? "normal" : "italic" })}>
                              <Italic className="w-3 h-3" />
                            </Button>
                            <Separator orientation="vertical" className="h-6 mx-0.5" />
                            <Button variant={selectedEl.textAlign === "left" ? "default" : "outline"} size="sm" className="h-6 w-6 p-0"
                              onClick={() => updateEl({ textAlign: "left" })}><AlignLeft className="w-3 h-3" /></Button>
                            <Button variant={selectedEl.textAlign === "center" ? "default" : "outline"} size="sm" className="h-6 w-6 p-0"
                              onClick={() => updateEl({ textAlign: "center" })}><AlignCenter className="w-3 h-3" /></Button>
                            <Button variant={selectedEl.textAlign === "right" ? "default" : "outline"} size="sm" className="h-6 w-6 p-0"
                              onClick={() => updateEl({ textAlign: "right" })}><AlignRight className="w-3 h-3" /></Button>
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[9px] text-muted-foreground">颜色</Label>
                            <div className="flex gap-1 items-center">
                              <input type="color" value={selectedEl.color ?? "#000000"} className="h-6 w-8 rounded cursor-pointer border"
                                onChange={e => updateEl({ color: e.target.value })} />
                              <Input value={selectedEl.color ?? "#000000"} className="h-6 text-[10px] flex-1 px-1"
                                onChange={e => updateEl({ color: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[9px] text-muted-foreground">背景色</Label>
                            <div className="flex gap-1 items-center">
                              <input type="color" value={selectedEl.backgroundColor ?? "#ffffff"} className="h-6 w-8 rounded cursor-pointer border"
                                onChange={e => updateEl({ backgroundColor: e.target.value })} />
                              <Input value={selectedEl.backgroundColor ?? ""} className="h-6 text-[10px] flex-1 px-1"
                                placeholder="透明"
                                onChange={e => updateEl({ backgroundColor: e.target.value })} />
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
                          <p className="text-[10px] text-muted-foreground font-medium">条形码设置</p>
                          <div className="space-y-0.5">
                            <Label className="text-[9px] text-muted-foreground">编码格式</Label>
                            <Select value={selectedEl.barcodeFormat ?? "CODE128"} onValueChange={v => updateEl({ barcodeFormat: v })}>
                              <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {BARCODE_FORMATS.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}{f.isUDI && <Badge variant="outline" className="ml-1 text-[8px] h-3 px-1 text-green-600 border-green-300">UDI</Badge>}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="showText" checked={selectedEl.showText !== false}
                              onChange={e => updateEl({ showText: e.target.checked })} className="rounded" />
                            <Label htmlFor="showText" className="text-[10px] cursor-pointer">显示文字</Label>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 矩形属性 */}
                    {selectedEl.type === "rect" && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground font-medium">边框设置</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="space-y-0.5">
                              <Label className="text-[9px] text-muted-foreground">边框宽度</Label>
                              <Input type="number" value={selectedEl.borderWidth ?? 1} className="h-6 text-[10px] px-1"
                                onChange={e => updateEl({ borderWidth: +e.target.value })} />
                            </div>
                            <div className="space-y-0.5">
                              <Label className="text-[9px] text-muted-foreground">圆角</Label>
                              <Input type="number" value={selectedEl.borderRadius ?? 0} className="h-6 text-[10px] px-1"
                                onChange={e => updateEl({ borderRadius: +e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[9px] text-muted-foreground">边框颜色</Label>
                            <div className="flex gap-1 items-center">
                              <input type="color" value={selectedEl.borderColor ?? "#000000"} className="h-6 w-8 rounded cursor-pointer border"
                                onChange={e => updateEl({ borderColor: e.target.value })} />
                              <Input value={selectedEl.borderColor ?? "#000000"} className="h-6 text-[10px] flex-1 px-1"
                                onChange={e => updateEl({ borderColor: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[9px] text-muted-foreground">背景色</Label>
                            <div className="flex gap-1 items-center">
                              <input type="color" value={selectedEl.backgroundColor ?? "#ffffff"} className="h-6 w-8 rounded cursor-pointer border"
                                onChange={e => updateEl({ backgroundColor: e.target.value })} />
                              <Input value={selectedEl.backgroundColor ?? ""} className="h-6 text-[10px] flex-1 px-1"
                                placeholder="透明"
                                onChange={e => updateEl({ backgroundColor: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 通用属性 */}
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground font-medium">通用</p>
                      {(selectedEl.type === "text" || selectedEl.type === "symbol" || selectedEl.type === "line") && (
                        <div className="space-y-0.5">
                          <Label className="text-[9px] text-muted-foreground">颜色</Label>
                          <div className="flex gap-1 items-center">
                            <input type="color" value={selectedEl.color ?? "#000000"} className="h-6 w-8 rounded cursor-pointer border"
                              onChange={e => updateEl({ color: e.target.value })} />
                            <Input value={selectedEl.color ?? "#000000"} className="h-6 text-[10px] flex-1 px-1"
                              onChange={e => updateEl({ color: e.target.value })} />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="locked" checked={selectedEl.locked ?? false}
                          onChange={e => updateEl({ locked: e.target.checked })} className="rounded" />
                        <Label htmlFor="locked" className="text-[10px] cursor-pointer">锁定位置</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* 底部状态栏 */}
        <div className="h-6 border-t bg-gray-50 flex items-center justify-between px-3 shrink-0 print:hidden">
          <span className="text-[10px] text-muted-foreground">
            元素: {template.elements.length} | 画布: {template.width}×{template.height}mm
          </span>
          <span className="text-[10px] text-muted-foreground">
            {selectedEl ? `选中: ${selectedEl.type} (${selectedEl.x}, ${selectedEl.y})` : "未选中元素"}
          </span>
        </div>
      </div>

      {/* ===== 预设模板对话框 ===== */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              预设标签模板
            </DialogTitle>
            <DialogDescription>选择一个预设模板作为起点，加载后可自由编辑</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-3">
            {PRESET_TEMPLATES.map(p => (
              <Card key={p.id} className="cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                onClick={() => loadPreset(p)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{p.name}</span>
                    {p.regulation && <Badge variant="outline" className="text-[10px]">{p.regulation}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.width}×{p.height}mm | {p.elements.length}个元素
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 批量打印对话框 */}
      <BatchPrintDialog
        open={showBatchPrint}
        onOpenChange={setShowBatchPrint}
        template={template}
        fieldOptions={FIELD_OPTIONS}
      />
    </ERPLayout>
  );
}
