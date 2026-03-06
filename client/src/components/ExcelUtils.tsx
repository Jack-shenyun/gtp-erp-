import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// ==================== 类型定义 ====================

export interface ExcelColumn {
  key: string;
  title: string;
  width?: number;
  required?: boolean;
  type?: "string" | "number" | "date" | "boolean";
}

export interface ExportConfig {
  filename: string;
  sheetName?: string;
  columns: ExcelColumn[];
  data: Record<string, any>[];
}

export interface ImportConfig {
  columns: ExcelColumn[];
  onImport: (data: Record<string, any>[]) => Promise<void>;
  templateFilename?: string;
}

// ==================== 导出功能 ====================

/**
 * 将数据导出为CSV格式（兼容Excel）
 */
export function exportToCSV(config: ExportConfig): void {
  const { filename, columns, data } = config;

  // 构建CSV头部
  const headers = columns.map((col) => `"${col.title}"`).join(",");

  // 构建CSV数据行
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        let value = row[col.key];
        if (value === null || value === undefined) {
          value = "";
        } else if (typeof value === "string") {
          // 转义双引号
          value = `"${value.replace(/"/g, '""')}"`;
        } else if (value instanceof Date) {
          value = `"${value.toISOString().split("T")[0]}"`;
        } else {
          value = String(value);
        }
        return value;
      })
      .join(",");
  });

  // 添加BOM以支持中文
  const BOM = "\uFEFF";
  const csvContent = BOM + headers + "\n" + rows.join("\n");

  // 创建下载链接
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success(`已导出 ${data.length} 条数据`);
}

/**
 * 导出按钮组件
 */
export function ExportButton({
  config,
  variant = "outline",
  size = "default",
  className = "",
}: {
  config: ExportConfig;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const handleExport = () => {
    if (config.data.length === 0) {
      toast.error("没有数据可导出");
      return;
    }
    exportToCSV(config);
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      导出Excel
    </Button>
  );
}

// ==================== 导入功能 ====================

interface ParsedRow {
  data: Record<string, any>;
  errors: string[];
  rowIndex: number;
}

/**
 * 解析CSV内容
 */
function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // 跳过下一个引号
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentLine.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        currentLine.push(currentField.trim());
        if (currentLine.some((f) => f !== "")) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = "";
        if (char === "\r") i++; // 跳过\n
      } else if (char !== "\r") {
        currentField += char;
      }
    }
  }

  // 处理最后一行
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some((f) => f !== "")) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * 验证并解析导入数据
 */
function validateAndParseData(
  rows: string[][],
  columns: ExcelColumn[]
): { parsed: ParsedRow[]; headerMapping: Map<string, number> } {
  const parsed: ParsedRow[] = [];
  const headerMapping = new Map<string, number>();

  if (rows.length === 0) {
    return { parsed, headerMapping };
  }

  // 解析表头
  const headers = rows[0];
  columns.forEach((col) => {
    const index = headers.findIndex(
      (h) => h === col.title || h === col.key || h.toLowerCase() === col.title.toLowerCase()
    );
    if (index !== -1) {
      headerMapping.set(col.key, index);
    }
  });

  // 解析数据行
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const data: Record<string, any> = {};
    const errors: string[] = [];

    columns.forEach((col) => {
      const index = headerMapping.get(col.key);
      let value: any = index !== undefined ? row[index] : undefined;

      // 类型转换
      if (value !== undefined && value !== "") {
        switch (col.type) {
          case "number":
            const num = parseFloat(value);
            if (isNaN(num)) {
              errors.push(`${col.title}: 应为数字`);
            } else {
              value = num;
            }
            break;
          case "date":
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              errors.push(`${col.title}: 日期格式无效`);
            } else {
              value = date.toISOString().split("T")[0];
            }
            break;
          case "boolean":
            value = value === "是" || value === "true" || value === "1" || value === "Y";
            break;
        }
      }

      // 必填验证
      if (col.required && (value === undefined || value === "")) {
        errors.push(`${col.title}: 必填`);
      }

      data[col.key] = value || "";
    });

    parsed.push({ data, errors, rowIndex: i + 1 });
  }

  return { parsed, headerMapping };
}

/**
 * 导入对话框组件
 */
export function ImportDialog({
  open,
  onOpenChange,
  config,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ImportConfig;
}) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number }>({
    success: 0,
    failed: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("请上传CSV或Excel文件");
      return;
    }

    try {
      const content = await file.text();
      const rows = parseCSV(content);
      const { parsed } = validateAndParseData(rows, config.columns);

      if (parsed.length === 0) {
        toast.error("文件中没有有效数据");
        return;
      }

      setParsedData(parsed);
      setStep("preview");
    } catch (error) {
      toast.error("文件解析失败");
      console.error(error);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setStep("importing");

    const validData = parsedData.filter((row) => row.errors.length === 0);

    try {
      await config.onImport(validData.map((row) => row.data));
      setImportResult({
        success: validData.length,
        failed: parsedData.length - validData.length,
      });
      setStep("done");
      toast.success(`成功导入 ${validData.length} 条数据`);
    } catch (error) {
      toast.error("导入失败");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [{}]; // 空数据，只生成表头
    exportToCSV({
      filename: config.templateFilename || "导入模板",
      columns: config.columns,
      data: templateData,
    });
  };

  const handleClose = () => {
    setStep("upload");
    setParsedData([]);
    setImportResult({ success: 0, failed: 0 });
    onOpenChange(false);
  };

  const validCount = parsedData.filter((row) => row.errors.length === 0).length;
  const errorCount = parsedData.filter((row) => row.errors.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            导入数据
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "上传CSV或Excel文件导入数据"}
            {step === "preview" && "预览并确认导入数据"}
            {step === "importing" && "正在导入数据..."}
            {step === "done" && "导入完成"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {step === "upload" && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">点击或拖拽文件到此处</p>
                <p className="text-sm text-muted-foreground">支持 CSV、XLS、XLSX 格式</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="flex items-center justify-center">
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  下载导入模板
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">导入字段说明</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {config.columns.map((col) => (
                    <div key={col.key} className="flex items-center gap-1">
                      <span className={col.required ? "text-destructive" : ""}>
                        {col.title}
                        {col.required && " *"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  有效数据: {validCount} 条
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    错误数据: {errorCount} 条
                  </div>
                )}
              </div>

              <div className="border rounded-lg overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">行号</TableHead>
                      <TableHead className="w-16">状态</TableHead>
                      {config.columns.slice(0, 5).map((col) => (
                        <TableHead key={col.key}>{col.title}</TableHead>
                      ))}
                      {config.columns.length > 5 && <TableHead>...</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((row) => (
                      <TableRow
                        key={row.rowIndex}
                        className={row.errors.length > 0 ? "bg-destructive/5" : ""}
                      >
                        <TableCell>{row.rowIndex}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <span className="text-destructive text-xs" title={row.errors.join(", ")}>
                              错误
                            </span>
                          ) : (
                            <span className="text-green-600 text-xs">有效</span>
                          )}
                        </TableCell>
                        {config.columns.slice(0, 5).map((col) => (
                          <TableCell key={col.key} className="max-w-[150px] truncate">
                            {String(row.data[col.key] || "-")}
                          </TableCell>
                        ))}
                        {config.columns.length > 5 && <TableCell>...</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {parsedData.length > 50 && (
                <p className="text-sm text-muted-foreground text-center">
                  仅显示前50条数据，共 {parsedData.length} 条
                </p>
              )}
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4" />
              <p className="text-lg font-medium">正在导入数据...</p>
              <p className="text-sm text-muted-foreground">请勿关闭此窗口</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
              <p className="text-lg font-medium mb-2">导入完成</p>
              <div className="text-sm text-muted-foreground space-y-1 text-center">
                <p>成功导入: {importResult.success} 条</p>
                {importResult.failed > 0 && (
                  <p className="text-destructive">跳过错误数据: {importResult.failed} 条</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                重新选择
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                导入 {validCount} 条数据
              </Button>
            </>
          )}
          {step === "done" && <Button onClick={handleClose}>完成</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 导入按钮组件
 */
export function ImportButton({
  config,
  variant = "outline",
  size = "default",
  className = "",
}: {
  config: ImportConfig;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setDialogOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        导入Excel
      </Button>
      <ImportDialog open={dialogOpen} onOpenChange={setDialogOpen} config={config} />
    </>
  );
}

// ==================== 组合工具栏 ====================

export function ExcelToolbar({
  exportConfig,
  importConfig,
}: {
  exportConfig?: ExportConfig;
  importConfig?: ImportConfig;
}) {
  return (
    <div className="flex items-center gap-2">
      {importConfig && <ImportButton config={importConfig} />}
      {exportConfig && <ExportButton config={exportConfig} />}
    </div>
  );
}
