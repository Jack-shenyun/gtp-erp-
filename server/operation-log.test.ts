import { describe, expect, it, beforeEach } from "vitest";

/**
 * 操作日志功能单元测试
 * 测试操作日志记录、查询和导出功能
 */

// 模拟操作日志数据结构
interface OperationLog {
  id: number;
  module: string;
  action: string;
  targetType: string;
  targetId: number;
  targetName: string;
  description: string;
  operatorId: number;
  operatorName: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// 模拟日志存储
const mockLogs: OperationLog[] = [];

// 模拟日志记录函数
function logOperation(params: {
  module: string;
  action: string;
  targetType: string;
  targetId: number;
  targetName: string;
  description: string;
  operatorId?: number;
  operatorName?: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}): OperationLog {
  const log: OperationLog = {
    id: mockLogs.length + 1,
    module: params.module,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: params.targetName,
    description: params.description,
    operatorId: params.operatorId || 1,
    operatorName: params.operatorName || "测试用户",
    previousData: params.previousData,
    newData: params.newData,
    ipAddress: "127.0.0.1",
    userAgent: "Test Agent",
    createdAt: new Date(),
  };
  mockLogs.push(log);
  return log;
}

// 模拟日志查询函数
function queryLogs(filters: {
  module?: string;
  action?: string;
  operatorName?: string;
  startDate?: Date;
  endDate?: Date;
}): OperationLog[] {
  return mockLogs.filter((log) => {
    if (filters.module && log.module !== filters.module) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.operatorName && !log.operatorName.includes(filters.operatorName)) return false;
    if (filters.startDate && log.createdAt < filters.startDate) return false;
    if (filters.endDate && log.createdAt > filters.endDate) return false;
    return true;
  });
}

// 模拟日志导出函数
function exportLogs(logs: OperationLog[]): string {
  const headers = ["ID", "模块", "操作", "目标类型", "目标名称", "描述", "操作人", "时间"];
  const rows = logs.map((log) => [
    log.id,
    log.module,
    log.action,
    log.targetType,
    log.targetName,
    log.description,
    log.operatorName,
    log.createdAt.toISOString(),
  ]);
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

describe("操作日志记录功能", () => {
  beforeEach(() => {
    mockLogs.length = 0; // 清空日志
  });

  it("应该正确记录创建操作日志", () => {
    const log = logOperation({
      module: "department",
      action: "create",
      targetType: "部门",
      targetId: 1,
      targetName: "研发部",
      description: "新建部门：研发部(DEPT001)",
      newData: { name: "研发部", code: "DEPT001" },
    });

    expect(log.id).toBe(1);
    expect(log.module).toBe("department");
    expect(log.action).toBe("create");
    expect(log.targetName).toBe("研发部");
    expect(log.newData).toEqual({ name: "研发部", code: "DEPT001" });
  });

  it("应该正确记录更新操作日志", () => {
    const log = logOperation({
      module: "user",
      action: "update",
      targetType: "用户",
      targetId: 1,
      targetName: "张三",
      description: "编辑用户：张三(zhangsan)",
      previousData: { name: "张三", role: "user" },
      newData: { name: "张三", role: "admin" },
    });

    expect(log.action).toBe("update");
    expect(log.previousData).toEqual({ name: "张三", role: "user" });
    expect(log.newData).toEqual({ name: "张三", role: "admin" });
  });

  it("应该正确记录删除操作日志", () => {
    const log = logOperation({
      module: "code_rule",
      action: "delete",
      targetType: "编码规则",
      targetId: 1,
      targetName: "销售订单编码",
      description: "删除编码规则：销售订单编码",
      previousData: { name: "销售订单编码", prefix: "SO" },
    });

    expect(log.action).toBe("delete");
    expect(log.previousData).toBeDefined();
    expect(log.newData).toBeUndefined();
  });

  it("应该正确记录状态变更操作日志", () => {
    const log = logOperation({
      module: "user",
      action: "status_change",
      targetType: "用户",
      targetId: 1,
      targetName: "李四",
      description: "停用用户：李四",
      previousData: { status: "active" },
      newData: { status: "inactive" },
    });

    expect(log.action).toBe("status_change");
    expect(log.previousData?.status).toBe("active");
    expect(log.newData?.status).toBe("inactive");
  });

  it("应该正确记录重置操作日志", () => {
    const log = logOperation({
      module: "code_rule",
      action: "reset",
      targetType: "编码规则",
      targetId: 1,
      targetName: "采购订单编码",
      description: "重置编码规则流水号：采购订单编码",
      previousData: { currentSerial: 100 },
      newData: { currentSerial: 0 },
    });

    expect(log.action).toBe("reset");
    expect(log.previousData?.currentSerial).toBe(100);
    expect(log.newData?.currentSerial).toBe(0);
  });
});

describe("操作日志查询功能", () => {
  beforeEach(() => {
    mockLogs.length = 0;
    // 添加测试数据
    logOperation({
      module: "department",
      action: "create",
      targetType: "部门",
      targetId: 1,
      targetName: "研发部",
      description: "新建部门",
      operatorName: "张三",
    });
    logOperation({
      module: "user",
      action: "update",
      targetType: "用户",
      targetId: 1,
      targetName: "李四",
      description: "编辑用户",
      operatorName: "张三",
    });
    logOperation({
      module: "department",
      action: "delete",
      targetType: "部门",
      targetId: 2,
      targetName: "测试部",
      description: "删除部门",
      operatorName: "王五",
    });
  });

  it("应该能按模块筛选日志", () => {
    const logs = queryLogs({ module: "department" });
    expect(logs.length).toBe(2);
    expect(logs.every((log) => log.module === "department")).toBe(true);
  });

  it("应该能按操作类型筛选日志", () => {
    const logs = queryLogs({ action: "create" });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe("create");
  });

  it("应该能按操作人筛选日志", () => {
    const logs = queryLogs({ operatorName: "张三" });
    expect(logs.length).toBe(2);
    expect(logs.every((log) => log.operatorName === "张三")).toBe(true);
  });

  it("应该能组合多个条件筛选日志", () => {
    const logs = queryLogs({ module: "department", action: "create" });
    expect(logs.length).toBe(1);
    expect(logs[0].module).toBe("department");
    expect(logs[0].action).toBe("create");
  });

  it("空条件应返回所有日志", () => {
    const logs = queryLogs({});
    expect(logs.length).toBe(3);
  });
});

describe("操作日志导出功能", () => {
  beforeEach(() => {
    mockLogs.length = 0;
    logOperation({
      module: "department",
      action: "create",
      targetType: "部门",
      targetId: 1,
      targetName: "研发部",
      description: "新建部门：研发部",
      operatorName: "管理员",
    });
  });

  it("应该正确导出CSV格式", () => {
    const csv = exportLogs(mockLogs);
    const lines = csv.split("\n");
    
    expect(lines.length).toBe(2); // 表头 + 1条数据
    expect(lines[0]).toContain("ID");
    expect(lines[0]).toContain("模块");
    expect(lines[0]).toContain("操作");
    expect(lines[1]).toContain("department");
    expect(lines[1]).toContain("create");
    expect(lines[1]).toContain("研发部");
  });

  it("应该能导出多条日志", () => {
    logOperation({
      module: "user",
      action: "update",
      targetType: "用户",
      targetId: 1,
      targetName: "测试用户",
      description: "编辑用户",
      operatorName: "管理员",
    });

    const csv = exportLogs(mockLogs);
    const lines = csv.split("\n");
    
    expect(lines.length).toBe(3); // 表头 + 2条数据
  });

  it("空日志应只返回表头", () => {
    mockLogs.length = 0;
    const csv = exportLogs(mockLogs);
    const lines = csv.split("\n");
    
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("ID");
  });
});

describe("操作日志数据完整性", () => {
  beforeEach(() => {
    mockLogs.length = 0;
  });

  it("应该记录完整的操作信息", () => {
    const log = logOperation({
      module: "department",
      action: "create",
      targetType: "部门",
      targetId: 1,
      targetName: "研发部",
      description: "新建部门",
      operatorId: 1,
      operatorName: "管理员",
      newData: { name: "研发部" },
    });

    expect(log.id).toBeDefined();
    expect(log.module).toBeDefined();
    expect(log.action).toBeDefined();
    expect(log.targetType).toBeDefined();
    expect(log.targetId).toBeDefined();
    expect(log.targetName).toBeDefined();
    expect(log.description).toBeDefined();
    expect(log.operatorId).toBeDefined();
    expect(log.operatorName).toBeDefined();
    expect(log.ipAddress).toBeDefined();
    expect(log.userAgent).toBeDefined();
    expect(log.createdAt).toBeDefined();
  });

  it("应该自动生成递增的ID", () => {
    logOperation({
      module: "department",
      action: "create",
      targetType: "部门",
      targetId: 1,
      targetName: "部门1",
      description: "新建部门1",
    });
    logOperation({
      module: "department",
      action: "create",
      targetType: "部门",
      targetId: 2,
      targetName: "部门2",
      description: "新建部门2",
    });

    expect(mockLogs[0].id).toBe(1);
    expect(mockLogs[1].id).toBe(2);
  });

  it("应该自动记录创建时间", () => {
    const before = new Date();
    const log = logOperation({
      module: "department",
      action: "create",
      targetType: "部门",
      targetId: 1,
      targetName: "研发部",
      description: "新建部门",
    });
    const after = new Date();

    expect(log.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(log.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe("操作日志模块覆盖", () => {
  beforeEach(() => {
    mockLogs.length = 0;
  });

  it("应该支持部门设置模块日志", () => {
    const log = logOperation({
      module: "department",
      action: "create",
      targetType: "部门",
      targetId: 1,
      targetName: "研发部",
      description: "新建部门",
    });
    expect(log.module).toBe("department");
  });

  it("应该支持编码设置模块日志", () => {
    const log = logOperation({
      module: "code_rule",
      action: "update",
      targetType: "编码规则",
      targetId: 1,
      targetName: "销售订单编码",
      description: "编辑编码规则",
    });
    expect(log.module).toBe("code_rule");
  });

  it("应该支持用户设置模块日志", () => {
    const log = logOperation({
      module: "user",
      action: "delete",
      targetType: "用户",
      targetId: 1,
      targetName: "测试用户",
      description: "删除用户",
    });
    expect(log.module).toBe("user");
  });

  it("应该支持语言设置模块日志", () => {
    const log = logOperation({
      module: "language",
      action: "update",
      targetType: "语言设置",
      targetId: 1,
      targetName: "系统语言设置",
      description: "更新语言设置",
    });
    expect(log.module).toBe("language");
  });
});
