/**
 * ============================================================
 * 神韵医疗器械 ERP — 手机端标准表单组件库
 * MobileForm.tsx
 *
 * 使用规范：
 *   所有新建/编辑弹窗必须使用本文件中的组件，
 *   禁止直接使用裸 <Dialog> + <Table>，以确保手机端体验一致。
 *
 * 导出组件：
 *   - MobileFormDialog      弹窗容器（含标题、内容区、底部按钮）
 *   - MobileFormSection     表单分区（带标题分隔线）
 *   - MobileFormGrid        表单字段网格（手机单列，桌面双列）
 *   - MobileFormField       单个字段容器（含 label + 错误提示）
 *   - MobileDetailTable     明细表容器（横向可滚动）
 *   - MobileDetailAddBtn    明细表底部"添加行"按钮
 *   - MobilePageHeader      页面顶部导航栏（含返回按钮、标题、操作按钮）
 *   - MobileStatBar         统计数字横向滚动条
 *   - MobileTabBar          标签页横向滚动条
 *
 * ============================================================
 */

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// ============================================================
// 1. MobileFormDialog — 弹窗容器
// ============================================================
/**
 * 标准弹窗容器
 *
 * 特性：
 * - 手机端最大高度 92dvh，内容区自动纵向滚动
 * - 标题区固定在顶部，底部按钮固定在底部
 * - 桌面端最大宽度 2xl（672px），手机端全宽
 * - 关闭按钮始终可见（右上角 ×）
 *
 * @example
 * <MobileFormDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   title="新建采购申请"
 *   onSubmit={handleSubmit}
 *   isLoading={submitting}
 * >
 *   <MobileFormSection title="基础信息">
 *     <MobileFormGrid>
 *       <MobileFormField label="申请单号" required>
 *         <Input value={form.no} onChange={...} />
 *       </MobileFormField>
 *     </MobileFormGrid>
 *   </MobileFormSection>
 * </MobileFormDialog>
 */
export interface MobileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** 副标题或描述（可选） */
  description?: string;
  children: ReactNode;
  /** 提交按钮文字，默认"保存" */
  submitText?: string;
  /** 取消按钮文字，默认"取消" */
  cancelText?: string;
  /** 点击提交按钮时触发 */
  onSubmit?: () => void;
  /** 是否显示加载状态 */
  isLoading?: boolean;
  /** 是否隐藏底部按钮栏（自定义底部时使用） */
  hideFooter?: boolean;
  /** 自定义底部内容（替换默认取消/保存按钮） */
  footer?: ReactNode;
  /** 弹窗最大宽度，默认 sm:max-w-2xl */
  maxWidth?: string;
}

export function MobileFormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitText = "保存",
  cancelText = "取消",
  onSubmit,
  isLoading = false,
  hideFooter = false,
  footer,
  maxWidth,
}: MobileFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // 手机端：接近全屏，圆角弹窗
          "w-[calc(100vw-0.5rem)] max-w-[calc(100vw-0.5rem)]",
          // 桌面端：限制最大宽度
          maxWidth ?? "sm:max-w-2xl",
          // 高度限制 + 弹性布局
          "max-h-[92dvh] sm:max-h-[90vh]",
          "flex flex-col overflow-hidden p-0 gap-0"
        )}
      >
        {/* 标题区 — 固定在顶部 */}
        <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-base sm:text-lg font-semibold leading-tight pr-6">
            {title}
          </DialogTitle>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </DialogHeader>

        {/* 内容区 — 纵向可滚动 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-4"
          style={{ WebkitOverflowScrolling: "touch" }}>
          {children}
        </div>

        {/* 底部按钮区 — 固定在底部 */}
        {!hideFooter && (
          <DialogFooter
            className="flex-shrink-0 flex flex-row items-center justify-end gap-2 px-4 py-3 border-t border-border bg-background"
          >
            {footer ?? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="min-w-[72px]"
                >
                  {cancelText}
                </Button>
                <Button
                  size="sm"
                  onClick={onSubmit}
                  disabled={isLoading}
                  className="min-w-[72px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      提交中...
                    </>
                  ) : submitText}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 2. MobileFormSection — 表单分区
// ============================================================
/**
 * 表单分区容器，带标题分隔线
 *
 * @example
 * <MobileFormSection title="产品明细" action={<Button size="sm">添加</Button>}>
 *   <MobileDetailTable columns={...} />
 * </MobileFormSection>
 */
export interface MobileFormSectionProps {
  title: string;
  /** 右侧操作按钮（如"添加行"） */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MobileFormSection({
  title,
  action,
  children,
  className,
}: MobileFormSectionProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {/* 分区标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-primary" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// 3. MobileFormGrid — 表单字段网格
// ============================================================
/**
 * 表单字段网格布局
 * - 手机端：单列（1列）
 * - 平板/桌面端：双列（2列）
 *
 * @example
 * <MobileFormGrid>
 *   <MobileFormField label="单号">...</MobileFormField>
 *   <MobileFormField label="日期">...</MobileFormField>
 * </MobileFormGrid>
 */
export interface MobileFormGridProps {
  children: ReactNode;
  /** 强制单列（用于备注等全宽字段） */
  singleColumn?: boolean;
  className?: string;
}

export function MobileFormGrid({
  children,
  singleColumn = false,
  className,
}: MobileFormGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        singleColumn ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================
// 4. MobileFormField — 单个字段容器
// ============================================================
/**
 * 单个表单字段容器，含 label、必填星号、错误提示
 *
 * @example
 * <MobileFormField label="供应商" required error={errors.supplier}>
 *   <Input value={form.supplier} onChange={...} placeholder="请输入供应商名称" />
 * </MobileFormField>
 */
export interface MobileFormFieldProps {
  label: string;
  required?: boolean;
  /** 错误信息，有值时显示红色提示 */
  error?: string;
  /** 字段说明（显示在 label 右侧，灰色小字） */
  hint?: string;
  children: ReactNode;
  /** 占满整行（跨2列） */
  fullWidth?: boolean;
  className?: string;
}

export function MobileFormField({
  label,
  required,
  error,
  hint,
  children,
  fullWidth,
  className,
}: MobileFormFieldProps) {
  return (
    <div className={cn("space-y-1.5", fullWidth && "sm:col-span-2", className)}>
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium text-foreground leading-none">
          {label}
          {required && (
            <span className="text-destructive ml-0.5">*</span>
          )}
        </Label>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive leading-tight">{error}</p>
      )}
    </div>
  );
}

// ============================================================
// 5. MobileDetailTable — 明细表容器（横向滚动）
// ============================================================
/**
 * 明细表容器，支持横向滚动
 *
 * 规则：
 * - 外层容器必须有 overflow-x-auto
 * - table 必须有 min-width（根据列数设置，每列约 100-120px）
 * - 操作列固定在右侧，使用 sticky right-0
 *
 * @example
 * <MobileDetailTable minWidth={600}>
 *   <Table>
 *     <TableHeader>...</TableHeader>
 *     <TableBody>...</TableBody>
 *   </Table>
 * </MobileDetailTable>
 */
export interface MobileDetailTableProps {
  children: ReactNode;
  /** 表格最小宽度（px），根据列数决定，每列约 100px */
  minWidth?: number;
  className?: string;
}

export function MobileDetailTable({
  children,
  minWidth = 560,
  className,
}: MobileDetailTableProps) {
  return (
    <div
      className={cn(
        "rounded-lg border overflow-x-auto",
        className
      )}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div style={{ minWidth: `${minWidth}px` }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// 6. MobileDetailAddBtn — 明细表"添加行"按钮
// ============================================================
/**
 * 明细表底部"添加行"按钮，宽度撑满
 *
 * @example
 * <MobileDetailAddBtn onClick={handleAddLine} label="添加产品" />
 */
export interface MobileDetailAddBtnProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

export function MobileDetailAddBtn({
  onClick,
  label = "添加行",
  disabled = false,
}: MobileDetailAddBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-1.5",
        "py-2.5 text-sm text-primary border border-dashed border-primary/40",
        "rounded-lg hover:bg-primary/5 transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

// ============================================================
// 7. MobilePageHeader — 页面顶部导航栏
// ============================================================
/**
 * 标准页面顶部导航栏
 * - 左侧：返回按钮 + 页面标题
 * - 右侧：操作按钮组
 *
 * @example
 * <MobilePageHeader
 *   title="国内获客"
 *   icon={<MapPin className="h-4 w-4 text-white" />}
 *   iconBg="bg-green-600"
 *   actions={<Button size="sm" onClick={...}>新建线索</Button>}
 * />
 */
export interface MobilePageHeaderProps {
  title: string;
  /** 标题左侧图标 */
  icon?: ReactNode;
  /** 图标背景色，如 "bg-green-600" */
  iconBg?: string;
  /** 右侧操作按钮 */
  actions?: ReactNode;
  /** 返回路径，默认返回 "/" */
  backPath?: string;
  /** 自定义返回行为 */
  onBack?: () => void;
  /** 副标题（标题右侧的跳转链接等） */
  subtitle?: ReactNode;
}

export function MobilePageHeader({
  title,
  icon,
  iconBg = "bg-primary",
  actions,
  backPath = "/",
  onBack,
  subtitle,
}: MobilePageHeaderProps) {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(backPath);
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* 返回按钮 */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">返回</span>
        </button>

        <div className="h-4 w-px bg-gray-300 flex-shrink-0" />

        {/* 图标 + 标题 */}
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", iconBg)}>
              {icon}
            </div>
          )}
          <span className="font-semibold text-gray-800 text-sm truncate">{title}</span>
        </div>

        {/* 副标题 */}
        {subtitle && (
          <div className="flex-shrink-0 ml-1">{subtitle}</div>
        )}
      </div>

      {/* 右侧操作按钮 */}
      {actions && (
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 8. MobileStatBar — 统计数字横向滚动条
// ============================================================
/**
 * 统计数字横向滚动条，手机端不换行
 *
 * @example
 * <MobileStatBar stats={[
 *   { label: "总数", value: 100, color: "text-gray-700", bg: "bg-white" },
 *   { label: "进行中", value: 23, color: "text-blue-600", bg: "bg-blue-50" },
 * ]} />
 */
export interface StatItem {
  label: string;
  value: number | string;
  color?: string;
  bg?: string;
}

export interface MobileStatBarProps {
  stats: StatItem[];
  className?: string;
}

export function MobileStatBar({ stats, className }: MobileStatBarProps) {
  return (
    <div
      className={cn(
        "flex gap-2 px-3 py-2 flex-shrink-0 overflow-x-auto",
        className
      )}
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn(
            "rounded-lg px-3 py-1.5 border border-gray-100 flex-shrink-0 min-w-[68px] text-center",
            s.bg ?? "bg-white"
          )}
        >
          <div className={cn("text-lg font-bold leading-tight", s.color ?? "text-gray-700")}>
            {s.value}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 9. MobileTabBar — 标签页横向滚动条
// ============================================================
/**
 * 标签页横向滚动条，手机端不换行
 *
 * @example
 * <MobileTabBar
 *   tabs={[
 *     { key: "list", label: "列表", icon: List },
 *     { key: "import", label: "导入", icon: Upload },
 *   ]}
 *   active={activeTab}
 *   onChange={setActiveTab}
 *   activeColor="text-green-700"
 * />
 */
export interface TabItem {
  key: string;
  label: string;
  icon?: React.FC<{ className?: string }>;
}

export interface MobileTabBarProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  activeColor?: string;
  className?: string;
}

export function MobileTabBar({
  tabs,
  active,
  onChange,
  activeColor = "text-primary",
  className,
}: MobileTabBarProps) {
  return (
    <div
      className={cn(
        "flex gap-0.5 px-3 flex-shrink-0 overflow-x-auto",
        className
      )}
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg transition-colors flex-shrink-0 whitespace-nowrap",
              isActive
                ? cn("bg-white font-medium border border-b-white border-gray-200", activeColor)
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
