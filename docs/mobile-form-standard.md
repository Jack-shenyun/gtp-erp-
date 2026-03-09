# 神韵医疗器械 ERP — 手机端表单开发规范

> **版本**：v1.0 | **适用范围**：所有新建/编辑表单弹窗 | **最后更新**：2026-03-09

---

## 一、核心原则

所有新建表单必须同时满足手机端（≤768px）和桌面端（≥1024px）的使用体验。手机端设计遵循以下四条原则：

**内容优先**：减少装饰性留白，每屏展示更多有效信息。触摸友好：所有可点击元素最小高度 36px，避免误触。**数据完整**：明细表横向可滑动，不截断任何列。**操作固定**：弹窗底部按钮始终可见，不随内容滚走。

---

## 二、组件使用规范

所有新建表单必须从 `@/components/MobileForm` 导入以下组件，**禁止直接使用裸 `<Dialog>` 配合 `<Table>`**。

| 组件名 | 用途 | 必须使用场景 |
|--------|------|-------------|
| `MobileFormDialog` | 弹窗容器 | 所有新建/编辑弹窗 |
| `MobileFormSection` | 表单分区 | 弹窗内每个信息分组 |
| `MobileFormGrid` | 字段网格 | 弹窗内基础信息字段排列 |
| `MobileFormField` | 单字段容器 | 每个表单字段（含 label + 错误提示） |
| `MobileDetailTable` | 明细表容器 | 所有含行项目的明细表 |
| `MobileDetailAddBtn` | 添加行按钮 | 明细表底部添加行操作 |
| `MobileStatBar` | 统计数字条 | 页面顶部统计数字展示 |

---

## 三、标准弹窗结构

每个新建/编辑弹窗必须按以下结构组织，不得随意改变层级顺序：

```
MobileFormDialog（弹窗容器）
├── MobileFormSection「基础信息」
│   └── MobileFormGrid
│       ├── MobileFormField「单号」（只读）
│       ├── MobileFormField「日期」（必填）
│       ├── MobileFormField「关联单据」（必填）
│       └── MobileFormField「备注」（fullWidth，可选）
└── MobileFormSection「产品明细」（含 action 按钮）
    ├── MobileDetailTable
    │   └── Table（含 TableHeader + TableBody）
    ├── MobileDetailAddBtn
    └── 合计行（右对齐）
```

---

## 四、代码模板

### 4.1 新建弹窗最小示例

```tsx
import {
  MobileFormDialog,
  MobileFormSection,
  MobileFormGrid,
  MobileFormField,
  MobileDetailTable,
  MobileDetailAddBtn,
} from "@/components/MobileForm";

// 状态
const [showCreate, setShowCreate] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [form, setForm] = useState({ orderNo: "", date: "", supplierId: "" });
const [errors, setErrors] = useState<Record<string, string>>({});
const [lines, setLines] = useState<LineItem[]>([]);

// 渲染
<MobileFormDialog
  open={showCreate}
  onOpenChange={setShowCreate}
  title="新建采购申请"
  onSubmit={handleSubmit}
  submitText="提交审批"
  isLoading={submitting}
>
  <MobileFormSection title="基础信息">
    <MobileFormGrid>
      <MobileFormField label="申请单号" hint="自动生成">
        <Input value={form.orderNo} readOnly className="bg-gray-50 text-gray-500" />
      </MobileFormField>

      <MobileFormField label="供应商" required error={errors.supplierId}>
        <Select value={form.supplierId} onValueChange={v => setField("supplierId", v)}>
          <SelectTrigger className={errors.supplierId ? "border-destructive" : ""}>
            <SelectValue placeholder="请选择供应商" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="s1">供应商A</SelectItem>
          </SelectContent>
        </Select>
      </MobileFormField>

      <MobileFormField label="备注" fullWidth>
        <Textarea rows={2} className="resize-none" />
      </MobileFormField>
    </MobileFormGrid>
  </MobileFormSection>

  <MobileFormSection
    title="产品明细"
    action={<Button size="sm" variant="outline" onClick={addLine}>添加</Button>}
  >
    <MobileDetailTable minWidth={600}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">产品名称</TableHead>
            <TableHead className="text-xs text-right">数量</TableHead>
            <TableHead className="text-xs text-right">单价</TableHead>
            <TableHead className="text-xs text-right">金额</TableHead>
            <TableHead className="text-xs text-center sticky right-0 bg-muted/50">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map(line => (
            <TableRow key={line.id}>
              {/* ... 字段 ... */}
              <TableCell className="text-center sticky right-0 bg-white">
                <Button variant="ghost" size="sm" onClick={() => removeLine(line.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </MobileDetailTable>
    <MobileDetailAddBtn onClick={addLine} label="添加产品" />
  </MobileFormSection>
</MobileFormDialog>
```

### 4.2 详情弹窗（只读模式）

```tsx
<MobileFormDialog
  open={showDetail}
  onOpenChange={setShowDetail}
  title="申请单详情"
  hideFooter
  footer={
    <Button size="sm" variant="outline" onClick={() => setShowDetail(false)}>
      关闭
    </Button>
  }
>
  {/* 只读字段用 div 替代 Input */}
  <MobileFormField label="申请单号">
    <div className="text-sm font-mono py-1.5 px-2 bg-gray-50 rounded border border-gray-200">
      {record.orderNo}
    </div>
  </MobileFormField>
</MobileFormDialog>
```

---

## 五、明细表规范

### 5.1 minWidth 计算规则

`MobileDetailTable` 的 `minWidth` 属性决定表格最小宽度，防止列被压缩。按列数估算：

| 列数 | 建议 minWidth |
|------|--------------|
| 4 列 | 400px |
| 5 列 | 480px |
| 6 列 | 560px |
| 7 列 | 640px |
| 8 列及以上 | 720px+ |

### 5.2 操作列固定规则

操作列（删除/编辑按钮）必须固定在右侧，防止横向滚动时消失：

```tsx
{/* 表头操作列 */}
<TableHead className="sticky right-0 bg-muted/50 text-center">操作</TableHead>

{/* 表体操作列 */}
<TableCell className="sticky right-0 bg-white text-center">
  <Button variant="ghost" size="sm">...</Button>
</TableCell>
```

### 5.3 行内输入框宽度规范

明细表内的 Input 必须设置固定宽度，防止撑宽或压缩：

| 字段类型 | 建议宽度 |
|----------|---------|
| 编码/单号 | `w-[90px]` |
| 名称 | `w-[130px]` |
| 规格/型号 | `w-[80px]` |
| 单位 | `w-[50px]` |
| 数量/单价 | `w-[70px]` |
| 备注 | `w-[150px]` |

---

## 六、字段验证规范

所有必填字段必须在提交前验证，并将错误信息传入 `MobileFormField` 的 `error` 属性：

```tsx
function validate(): boolean {
  const e: Record<string, string> = {};
  if (!form.supplierId) e.supplierId = "请选择供应商";
  if (!form.warehouseId) e.warehouseId = "请选择收货仓库";
  if (lines.length === 0) {
    toast.error("请至少添加一条产品明细");
    return false;
  }
  setErrors(e);
  return Object.keys(e).length === 0;
}
```

错误状态下，Select 和 Input 需添加 `border-destructive` 类：

```tsx
<SelectTrigger className={errors.supplierId ? "border-destructive" : ""}>
<Input className={cn(errors.qty && "border-destructive")} />
```

---

## 七、禁止事项

以下写法在新建表单中**严格禁止**，会导致手机端无法正常使用：

| 禁止写法 | 原因 | 替代方案 |
|----------|------|---------|
| `<Dialog>` 直接包裹 `<Table>` | 弹窗无法滚动 | 使用 `MobileFormDialog` |
| `className="rounded-lg border overflow-hidden"` | 阻止横向滚动 | 使用 `MobileDetailTable` |
| `className="grid grid-cols-3"` 在弹窗内 | 手机端三列太窄 | 使用 `MobileFormGrid`（最多两列） |
| `min-w-[600px]` 直接写在 Table 上 | 不规范 | 通过 `MobileDetailTable minWidth` 设置 |
| 弹窗内使用 `fixed` 定位的按钮 | 层级冲突 | 使用 `MobileFormDialog` 的 `footer` 属性 |

---

## 八、完整示例文件

完整的可运行示例见：

```
client/src/pages/StandardFormExample.tsx
```

新建任何表单时，复制此文件后按以下步骤修改：

1. 修改页面标题和路由
2. 替换 `FormData` 类型为业务字段
3. 替换 `LineItem` 类型为明细行字段
4. 替换 `MOCK_LIST` 为真实 tRPC 查询
5. 替换 `handleSubmit` 为真实 tRPC mutation
6. 根据列数调整 `MobileDetailTable minWidth`

---

## 九、快速检查清单

提交代码前，对照以下清单自查：

- [ ] 弹窗使用 `MobileFormDialog`，不是裸 `<Dialog>`
- [ ] 明细表使用 `MobileDetailTable`，不是 `overflow-hidden`
- [ ] 操作列有 `sticky right-0 bg-white`
- [ ] 所有必填字段有 `required` 和 `error` 属性
- [ ] 行内 Input 有固定宽度（`w-[Xpx]`）
- [ ] 备注/多行字段使用 `fullWidth` 属性
- [ ] `minWidth` 根据列数正确设置
- [ ] 提交按钮有 `isLoading` 防重复提交
