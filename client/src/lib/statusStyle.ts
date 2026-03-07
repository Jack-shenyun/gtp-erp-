export function getStatusSemanticClass(status: unknown, label?: unknown): string {
  const statusStr = String(status ?? "").toLowerCase();
  const labelStr = String(label ?? "").toLowerCase();
  const text = `${statusStr} ${labelStr}`;

  // 危险/取消：红色
  const isDanger =
    /不合格|失败|拒绝|驳回|逾期|取消|异常|黑名单|unqualified|failed|reject|rejected|overdue|cancel|abnormal|error/.test(
      text
    );
  if (isDanger) {
    return "border-transparent bg-red-600 text-white";
  }

  // 部分发货：浅蓝色（需在通用完成规则之前判断）
  if (statusStr === "partial_shipped" || labelStr === "部分发货") {
    return "border-transparent bg-blue-400 text-white";
  }

  // 已发货：蓝色
  if (statusStr === "shipped" || labelStr === "已发货") {
    return "border-transparent bg-blue-600 text-white";
  }

  // 已审批：橙黄色（待处理状态）
  if (statusStr === "approved" || labelStr === "已审批") {
    return "border-transparent bg-amber-500 text-black";
  }

  // 完成/通过/合格：绿色
  const isDone =
    /完成|已完成|已收款|已付款|已通过|合格|completed|done|paid|received|qualified|pass|active/.test(
      text
    );
  if (isDone) {
    return "border-transparent bg-green-600 text-white";
  }

  // 进行中/待处理/草稿：橙黄色
  const isProgress =
    /进行|处理中|审核中|待|草稿|计划|in_progress|processing|review|pending|draft|planned/.test(
      text
    );
  if (isProgress) {
    return "border-transparent bg-amber-500 text-black";
  }

  return "";
}
