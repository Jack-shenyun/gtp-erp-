import { describe, expect, it } from "vitest";

/**
 * 表单功能单元测试
 * 测试新建/编辑表单的数据验证和处理逻辑
 */

// 模拟表单数据验证函数
function validateCustomerForm(data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.code || data.code.trim() === "") {
    errors.push("客户编码不能为空");
  }
  if (!data.name || data.name.trim() === "") {
    errors.push("客户名称不能为空");
  }
  if (!data.type) {
    errors.push("客户类型不能为空");
  }
  if (!data.contactPerson || data.contactPerson.trim() === "") {
    errors.push("联系人不能为空");
  }
  if (!data.phone || data.phone.trim() === "") {
    errors.push("联系电话不能为空");
  }
  if (data.email && !data.email.includes("@")) {
    errors.push("电子邮箱格式不正确");
  }
  
  return { valid: errors.length === 0, errors };
}

function validateProductForm(data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.code || data.code.trim() === "") {
    errors.push("产品编码不能为空");
  }
  if (!data.name || data.name.trim() === "") {
    errors.push("产品名称不能为空");
  }
  if (!data.specification || data.specification.trim() === "") {
    errors.push("规格型号不能为空");
  }
  if (!data.category) {
    errors.push("产品分类不能为空");
  }
  if (!data.riskLevel) {
    errors.push("风险等级不能为空");
  }
  if (!["I", "II", "III"].includes(data.riskLevel)) {
    errors.push("风险等级必须是I、II或III");
  }
  
  return { valid: errors.length === 0, errors };
}

function validateOrderForm(data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.orderNo || data.orderNo.trim() === "") {
    errors.push("订单号不能为空");
  }
  if (!data.customerName || data.customerName.trim() === "") {
    errors.push("客户名称不能为空");
  }
  if (!data.orderDate) {
    errors.push("订单日期不能为空");
  }
  if (!data.deliveryDate) {
    errors.push("交货日期不能为空");
  }
  if (data.quantity !== undefined && data.quantity <= 0) {
    errors.push("数量必须大于0");
  }
  if (data.unitPrice !== undefined && data.unitPrice < 0) {
    errors.push("单价不能为负数");
  }
  
  return { valid: errors.length === 0, errors };
}

function validateSupplierForm(data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.code || data.code.trim() === "") {
    errors.push("供应商编码不能为空");
  }
  if (!data.name || data.name.trim() === "") {
    errors.push("供应商名称不能为空");
  }
  if (!data.category) {
    errors.push("供应类别不能为空");
  }
  if (!data.contactPerson || data.contactPerson.trim() === "") {
    errors.push("联系人不能为空");
  }
  if (!data.phone || data.phone.trim() === "") {
    errors.push("联系电话不能为空");
  }
  if (!data.level) {
    errors.push("供应商等级不能为空");
  }
  if (!["A", "B", "C", "D"].includes(data.level)) {
    errors.push("供应商等级必须是A、B、C或D");
  }
  
  return { valid: errors.length === 0, errors };
}

function validateWarehouseForm(data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.inboundNo && !data.outboundNo) {
    errors.push("单据号不能为空");
  }
  if (!data.type) {
    errors.push("类型不能为空");
  }
  if (!data.warehouse) {
    errors.push("仓库不能为空");
  }
  if (!data.date) {
    errors.push("日期不能为空");
  }
  if (!data.materialName || data.materialName.trim() === "") {
    errors.push("物料名称不能为空");
  }
  if (data.quantity !== undefined && data.quantity <= 0) {
    errors.push("数量必须大于0");
  }
  
  return { valid: errors.length === 0, errors };
}

// 计算订单金额
function calculateOrderAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

// 生成单据编号
function generateOrderNo(prefix: string, sequence: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}

describe("客户表单验证", () => {
  it("应该验证完整的客户数据", () => {
    const validData = {
      code: "CUS-001",
      name: "北京协和医院",
      type: "hospital",
      contactPerson: "王主任",
      phone: "010-12345678",
      email: "wang@hospital.com",
    };
    
    const result = validateCustomerForm(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("应该拒绝缺少必填字段的客户数据", () => {
    const invalidData = {
      code: "",
      name: "测试客户",
      type: "hospital",
      contactPerson: "",
      phone: "",
    };
    
    const result = validateCustomerForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain("客户编码不能为空");
    expect(result.errors).toContain("联系人不能为空");
  });

  it("应该验证邮箱格式", () => {
    const invalidEmailData = {
      code: "CUS-001",
      name: "测试客户",
      type: "hospital",
      contactPerson: "张三",
      phone: "010-12345678",
      email: "invalid-email",
    };
    
    const result = validateCustomerForm(invalidEmailData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("电子邮箱格式不正确");
  });
});

describe("产品表单验证", () => {
  it("应该验证完整的产品数据", () => {
    const validData = {
      code: "PRD-001",
      name: "一次性使用无菌注射器",
      specification: "5ml",
      category: "syringe",
      riskLevel: "II",
    };
    
    const result = validateProductForm(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("应该验证风险等级有效性", () => {
    const invalidData = {
      code: "PRD-001",
      name: "测试产品",
      specification: "规格",
      category: "syringe",
      riskLevel: "IV", // 无效的风险等级
    };
    
    const result = validateProductForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("风险等级必须是I、II或III");
  });

  it("应该拒绝缺少必填字段的产品数据", () => {
    const invalidData = {
      code: "",
      name: "",
      specification: "",
      category: "",
      riskLevel: "",
    };
    
    const result = validateProductForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("订单表单验证", () => {
  it("应该验证完整的订单数据", () => {
    const validData = {
      orderNo: "SO-2026-0001",
      customerName: "北京协和医院",
      orderDate: "2026-02-01",
      deliveryDate: "2026-02-10",
      quantity: 1000,
      unitPrice: 15.5,
    };
    
    const result = validateOrderForm(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("应该拒绝数量为0或负数的订单", () => {
    const invalidData = {
      orderNo: "SO-2026-0001",
      customerName: "测试客户",
      orderDate: "2026-02-01",
      deliveryDate: "2026-02-10",
      quantity: 0,
      unitPrice: 15.5,
    };
    
    const result = validateOrderForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("数量必须大于0");
  });

  it("应该拒绝负数单价", () => {
    const invalidData = {
      orderNo: "SO-2026-0001",
      customerName: "测试客户",
      orderDate: "2026-02-01",
      deliveryDate: "2026-02-10",
      quantity: 100,
      unitPrice: -10,
    };
    
    const result = validateOrderForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("单价不能为负数");
  });
});

describe("供应商表单验证", () => {
  it("应该验证完整的供应商数据", () => {
    const validData = {
      code: "SUP-001",
      name: "上海塑料有限公司",
      category: "material",
      contactPerson: "王经理",
      phone: "021-12345678",
      level: "A",
    };
    
    const result = validateSupplierForm(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("应该验证供应商等级有效性", () => {
    const invalidData = {
      code: "SUP-001",
      name: "测试供应商",
      category: "material",
      contactPerson: "张三",
      phone: "021-12345678",
      level: "E", // 无效的等级
    };
    
    const result = validateSupplierForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("供应商等级必须是A、B、C或D");
  });
});

describe("仓库表单验证", () => {
  it("应该验证完整的入库单数据", () => {
    const validData = {
      inboundNo: "IN-2026-0001",
      type: "purchase",
      warehouse: "原材料仓",
      date: "2026-02-01",
      materialName: "医用级PP塑料",
      quantity: 5000,
    };
    
    const result = validateWarehouseForm(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("应该验证完整的出库单数据", () => {
    const validData = {
      outboundNo: "OUT-2026-0001",
      type: "sales",
      warehouse: "成品仓",
      date: "2026-02-01",
      materialName: "一次性使用无菌注射器",
      quantity: 10000,
    };
    
    const result = validateWarehouseForm(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("应该拒绝数量为0或负数的仓库单据", () => {
    const invalidData = {
      inboundNo: "IN-2026-0001",
      type: "purchase",
      warehouse: "原材料仓",
      date: "2026-02-01",
      materialName: "测试物料",
      quantity: -100,
    };
    
    const result = validateWarehouseForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("数量必须大于0");
  });
});

describe("订单金额计算", () => {
  it("应该正确计算订单金额", () => {
    expect(calculateOrderAmount(1000, 15.5)).toBe(15500);
    expect(calculateOrderAmount(5000, 25)).toBe(125000);
    expect(calculateOrderAmount(100, 46.8)).toBe(4680);
  });

  it("应该处理小数精度", () => {
    const amount = calculateOrderAmount(3, 0.1);
    expect(amount).toBeCloseTo(0.3, 10);
  });
});

describe("单据编号生成", () => {
  it("应该生成正确格式的销售订单号", () => {
    const orderNo = generateOrderNo("SO", 1);
    expect(orderNo).toMatch(/^SO-\d{4}-0001$/);
  });

  it("应该生成正确格式的采购订单号", () => {
    const orderNo = generateOrderNo("PO", 128);
    expect(orderNo).toMatch(/^PO-\d{4}-0128$/);
  });

  it("应该生成正确格式的入库单号", () => {
    const orderNo = generateOrderNo("IN", 5);
    expect(orderNo).toMatch(/^IN-\d{4}-0005$/);
  });

  it("应该生成正确格式的出库单号", () => {
    const orderNo = generateOrderNo("OUT", 99);
    expect(orderNo).toMatch(/^OUT-\d{4}-0099$/);
  });
});
