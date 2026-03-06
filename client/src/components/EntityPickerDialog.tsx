/**
 * EntityPickerDialog — 通用弹窗选择器组件
 *
 * 全系统统一弹窗选择器风格：
 * - 可拖动移动 + 最大化 + 关闭
 * - 顶部搜索框（实时筛选）
 * - 多列表格（列定义灵活配置）
 * - 每行"选择"按钮，已选行显示绿色勾选标记
 * - 底部"取消"按钮
 *
 * 使用示例：
 * ```tsx
 * <EntityPickerDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="选择产品"
 *   searchPlaceholder="搜索产品编码、名称..."
 *   columns={[
 *     { key: "code", title: "产品编码", render: (row) => <span className="font-mono">{row.code}</span> },
 *     { key: "name", title: "产品名称" },
 *     { key: "specification", title: "规格型号" },
 *   ]}
 *   rows={products}
 *   selectedId={selectedId}
 *   onSelect={(row) => { setSelectedId(row.id); setOpen(false); }}
 *   filterFn={(row, q) => row.code?.includes(q) || row.name?.includes(q)}
 * />
 * ```
 */

import { useState, useEffect } from "react";
import { DraggableDialog, DraggableDialogContent } from "@/components/DraggableDialog";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EntityPickerColumn<T = any> {
  /** 列 key，用于 React key */
  key: string;
  /** 列标题 */
  title: string;
  /** 自定义渲染，默认取 row[key] */
  render?: (row: T) => React.ReactNode;
  /** 列宽 class，如 "w-[120px]" */
  className?: string;
}

export interface EntityPickerDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 弹窗标题，如"选择产品" */
  title: string;
  /** 搜索框占位文字 */
  searchPlaceholder?: string;
  /** 列定义 */
  columns: EntityPickerColumn<T>[];
  /** 数据行 */
  rows: T[];
  /** 当前已选中的行 id（用于显示勾选标记） */
  selectedId?: string | number | null;
  /** 获取每行的唯一 id，默认取 row.id */
  getRowId?: (row: T) => string | number;
  /** 点击"选择"时的回调 */
  onSelect: (row: T) => void;
  /** 自定义筛选函数，默认对所有列值做 toLowerCase includes 匹配 */
  filterFn?: (row: T, query: string) => boolean;
  /** 空数据提示 */
  emptyText?: string;
  /** 弹窗默认宽度 */
  defaultWidth?: number;
  /** 弹窗默认高度 */
  defaultHeight?: number;
}

export function EntityPickerDialog<T extends Record<string, any>>({
  open,
  onOpenChange,
  title,
  searchPlaceholder = "搜索...",
  columns,
  rows,
  selectedId,
  getRowId = (row) => row.id,
  onSelect,
  filterFn,
  emptyText = "未找到匹配数据",
  defaultWidth = 800,
  defaultHeight = 560,
}: EntityPickerDialogProps<T>) {
  const [search, setSearch] = useState("");

  // 弹窗关闭时清空搜索
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  // 默认筛选：对所有列值做 toLowerCase includes 匹配
  const defaultFilterFn = (row: T, q: string) => {
    if (!q.trim()) return true;
    const lower = q.toLowerCase();
    return Object.values(row).some(
      (v) => v != null && String(v).toLowerCase().includes(lower)
    );
  };

  const filteredRows = rows.filter((row) =>
    search.trim()
      ? (filterFn ? filterFn(row, search) : defaultFilterFn(row, search))
      : true
  );

  return (
    <DraggableDialog
      open={open}
      onOpenChange={onOpenChange}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
    >
      <DraggableDialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* 表格 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[380px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 sticky top-0">
                    {columns.map((col) => (
                      <TableHead key={col.key} className={col.className}>
                        {col.title}
                      </TableHead>
                    ))}
                    <TableHead className="text-right w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 1}
                        className="text-center py-10 text-muted-foreground"
                      >
                        {emptyText}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => {
                      const rowId = getRowId(row);
                      const isSelected =
                        selectedId != null &&
                        String(rowId) === String(selectedId);
                      return (
                        <TableRow
                          key={rowId}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-colors",
                            isSelected && "bg-blue-50 hover:bg-blue-50"
                          )}
                          onClick={() => onSelect(row)}
                        >
                          {columns.map((col) => (
                            <TableCell key={col.key} className={col.className}>
                              {col.render
                                ? col.render(row)
                                : (row[col.key] ?? "-")}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            {isSelected ? (
                              <Check className="h-5 w-5 text-green-600 ml-auto" />
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelect(row);
                                }}
                              >
                                选择
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 底部操作 */}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
          </DialogFooter>
        </div>
      </DraggableDialogContent>
    </DraggableDialog>
  );
}
