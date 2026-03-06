import { useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

// 操作日志模块类型
export type LogModule =
  | "department"
  | "code_rule"
  | "user"
  | "language"
  | "system"
  | "product"
  | "customer"
  | "supplier"
  | "inventory"
  | "order"
  | "quality"
  | "production"
  | "finance"
  | "document";

// 操作类型
export type LogAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "role_change"
  | "permission_change"
  | "import"
  | "export"
  | "login"
  | "logout"
  | "reset"
  | "approve"
  | "reject";

// 操作结果
export type LogResult = "success" | "failure" | "partial";

// 操作日志条目
export interface OperationLogEntry {
  id: number;
  module: LogModule;
  action: LogAction;
  targetType: string;
  targetId?: string;
  targetName?: string;
  description: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  changedFields?: string[];
  operatorId: number;
  operatorName: string;
  operatorRole?: string;
  operatorDepartment?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  result: LogResult;
  errorMessage?: string;
  operatedAt: Date;
}

// 记录日志的参数
export interface LogParams {
  module: LogModule;
  action: LogAction;
  targetType: string;
  targetId?: string | number;
  targetName?: string;
  description: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  result?: LogResult;
  errorMessage?: string;
}

// 获取设备类型
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "Tablet";
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return "Mobile";
  }
  return "PC";
};

// 获取浏览器信息
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Unknown";
};

// 计算变更字段
const getChangedFields = (
  previousData?: Record<string, unknown>,
  newData?: Record<string, unknown>
): string[] => {
  if (!previousData || !newData) return [];
  
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(previousData), ...Object.keys(newData)]);
  
  allKeys.forEach((key) => {
    const prev = JSON.stringify(previousData[key]);
    const next = JSON.stringify(newData[key]);
    if (prev !== next) {
      changedFields.push(key);
    }
  });
  
  return changedFields;
};

// 操作日志存储（本地存储模拟，实际应用中应该调用API）
const STORAGE_KEY = "erp_operation_logs";
const MAX_LOGS = 1000; // 最大存储条数

const saveLogs = (logs: OperationLogEntry[]): void => {
  // 只保留最近的日志
  const trimmedLogs = logs.slice(-MAX_LOGS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
};

const loadLogs = (): OperationLogEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const logs = JSON.parse(stored) as OperationLogEntry[];
      // 转换日期字符串为Date对象
      return logs.map((log) => ({
        ...log,
        operatedAt: new Date(log.operatedAt),
      }));
    }
  } catch (e) {
    console.error("Failed to load operation logs:", e);
  }
  return [];
};

// 生成唯一ID
let logIdCounter = Date.now();
const generateLogId = (): number => {
  return ++logIdCounter;
};

/**
 * 操作日志记录Hook
 * 用于记录系统设置中的所有关键操作
 */
export function useOperationLog() {
  const { user } = useAuth();

  /**
   * 记录操作日志
   */
  const logOperation = useCallback(
    (params: LogParams): OperationLogEntry => {
      const changedFields = getChangedFields(params.previousData, params.newData);
      
      const logEntry: OperationLogEntry = {
        id: generateLogId(),
        module: params.module,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId?.toString(),
        targetName: params.targetName,
        description: params.description,
        previousData: params.previousData,
        newData: params.newData,
        changedFields: changedFields.length > 0 ? changedFields : undefined,
        operatorId: user?.id || 0,
        operatorName: user?.name || "系统",
        operatorRole: user?.role,
        operatorDepartment: undefined,
        userAgent: navigator.userAgent,
        deviceType: getDeviceType(),
        browser: getBrowser(),
        result: params.result || "success",
        errorMessage: params.errorMessage,
        operatedAt: new Date(),
      };

      // 保存到本地存储
      const existingLogs = loadLogs();
      existingLogs.push(logEntry);
      saveLogs(existingLogs);

      // 在控制台输出日志（开发调试用）
      console.log("[OperationLog]", logEntry);

      return logEntry;
    },
    [user]
  );

  /**
   * 获取所有操作日志
   */
  const getLogs = useCallback((): OperationLogEntry[] => {
    return loadLogs();
  }, []);

  /**
   * 按条件筛选日志
   */
  const filterLogs = useCallback(
    (filters: {
      module?: LogModule;
      action?: LogAction;
      operatorId?: number;
      startDate?: Date;
      endDate?: Date;
      keyword?: string;
    }): OperationLogEntry[] => {
      let logs = loadLogs();

      if (filters.module) {
        logs = logs.filter((log) => log.module === filters.module);
      }

      if (filters.action) {
        logs = logs.filter((log) => log.action === filters.action);
      }

      if (filters.operatorId) {
        logs = logs.filter((log) => log.operatorId === filters.operatorId);
      }

      if (filters.startDate) {
        logs = logs.filter((log) => log.operatedAt >= filters.startDate!);
      }

      if (filters.endDate) {
        logs = logs.filter((log) => log.operatedAt <= filters.endDate!);
      }

      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        logs = logs.filter(
          (log) =>
            String(log.description ?? "").toLowerCase().includes(keyword) ||
            String(log.targetName ?? "").toLowerCase().includes(keyword) ||
            String(log.operatorName ?? "").toLowerCase().includes(keyword)
        );
      }

      // 按时间倒序排列
      return logs.sort((a, b) => b.operatedAt.getTime() - a.operatedAt.getTime());
    },
    []
  );

  /**
   * 清除所有日志（仅管理员可用）
   */
  const clearLogs = useCallback((): boolean => {
    if (user?.role !== "admin") {
      console.warn("Only admin can clear operation logs");
      return false;
    }
    localStorage.removeItem(STORAGE_KEY);
    return true;
  }, [user]);

  /**
   * 导出日志为JSON
   */
  const exportLogs = useCallback((logs: OperationLogEntry[]): string => {
    return JSON.stringify(logs, null, 2);
  }, []);

  /**
   * 导出日志为CSV
   */
  const exportLogsAsCSV = useCallback((logs: OperationLogEntry[]): string => {
    const headers = [
      "ID",
      "模块",
      "操作类型",
      "操作对象类型",
      "操作对象ID",
      "操作对象名称",
      "操作描述",
      "变更字段",
      "操作人ID",
      "操作人",
      "操作人角色",
      "设备类型",
      "浏览器",
      "操作结果",
      "错误信息",
      "操作时间",
    ];

    const moduleNames: Record<LogModule, string> = {
      department: "部门设置",
      code_rule: "编码设置",
      user: "用户设置",
      language: "语言设置",
      system: "系统设置",
      product: "产品管理",
      customer: "客户管理",
      supplier: "供应商管理",
      inventory: "库存管理",
      order: "订单管理",
      quality: "质量管理",
      production: "生产管理",
      finance: "财务部",
      document: "文档管理",
    };

    const actionNames: Record<LogAction, string> = {
      create: "新增",
      update: "编辑",
      delete: "删除",
      status_change: "状态变更",
      role_change: "角色变更",
      permission_change: "权限变更",
      import: "导入",
      export: "导出",
      login: "登录",
      logout: "登出",
      reset: "重置",
      approve: "审批",
      reject: "拒绝",
    };

    const resultNames: Record<LogResult, string> = {
      success: "成功",
      failure: "失败",
      partial: "部分成功",
    };

    const rows = logs.map((log) => [
      log.id,
      moduleNames[log.module],
      actionNames[log.action],
      log.targetType,
      log.targetId || "",
      log.targetName || "",
      log.description,
      log.changedFields?.join(", ") || "",
      log.operatorId,
      log.operatorName,
      log.operatorRole || "",
      log.deviceType || "",
      log.browser || "",
      resultNames[log.result],
      log.errorMessage || "",
      log.operatedAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return csvContent;
  }, []);

  return {
    logOperation,
    getLogs,
    filterLogs,
    clearLogs,
    exportLogs,
    exportLogsAsCSV,
  };
}

// 模块名称映射
export const MODULE_NAMES: Record<LogModule, string> = {
  department: "部门设置",
  code_rule: "编码设置",
  user: "用户设置",
  language: "语言设置",
  system: "系统设置",
  product: "产品管理",
  customer: "客户管理",
  supplier: "供应商管理",
  inventory: "库存管理",
  order: "订单管理",
  quality: "质量管理",
  production: "生产管理",
  finance: "财务部",
  document: "文档管理",
};

// 操作类型名称映射
export const ACTION_NAMES: Record<LogAction, string> = {
  create: "新增",
  update: "编辑",
  delete: "删除",
  status_change: "状态变更",
  role_change: "角色变更",
  permission_change: "权限变更",
  import: "导入",
  export: "导出",
  login: "登录",
  logout: "登出",
  reset: "重置",
  approve: "审批",
  reject: "拒绝",
};

// 操作结果名称映射
export const RESULT_NAMES: Record<LogResult, string> = {
  success: "成功",
  failure: "失败",
  partial: "部分成功",
};
