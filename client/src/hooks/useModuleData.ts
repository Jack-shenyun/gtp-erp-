import { useState, useEffect, useMemo, useCallback } from "react";

/**
 * 模块数据联动 Hooks
 * 用于在不同模块之间共享和联动数据
 */

// ==================== 产品数据 ====================

export interface ProductOption {
  id: number;
  code: string;
  name: string;
  specification?: string;
  unit?: string;
  price?: number;
  stock?: number;
  category?: string;
  status?: string;
}

// 示例产品数据（实际应从API获取）
const sampleProducts: ProductOption[] = [
  { id: 1, code: "SYR-001", name: "一次性使用无菌注射器", specification: "5ml", unit: "支", price: 0.85, stock: 50000, category: "注射器", status: "active" },
  { id: 2, code: "SYR-002", name: "一次性使用无菌注射器", specification: "10ml", unit: "支", price: 1.20, stock: 35000, category: "注射器", status: "active" },
  { id: 3, code: "INF-001", name: "一次性使用输液器", specification: "带针", unit: "套", price: 2.50, stock: 28000, category: "输液器", status: "active" },
  { id: 4, code: "MASK-001", name: "医用外科口罩", specification: "17.5×9.5cm", unit: "只", price: 0.35, stock: 200000, category: "口罩", status: "active" },
  { id: 5, code: "MASK-002", name: "医用防护口罩N95", specification: "折叠式", unit: "只", price: 3.80, stock: 50000, category: "口罩", status: "active" },
  { id: 6, code: "GLV-001", name: "一次性使用医用橡胶检查手套", specification: "M", unit: "双", price: 0.45, stock: 100000, category: "手套", status: "active" },
  { id: 7, code: "GLV-002", name: "一次性使用医用橡胶检查手套", specification: "L", unit: "双", price: 0.45, stock: 80000, category: "手套", status: "active" },
  { id: 8, code: "SGLV-001", name: "无菌手术手套", specification: "7.0", unit: "双", price: 8.50, stock: 15000, category: "手套", status: "active" },
  { id: 9, code: "SGLV-002", name: "无菌手术手套", specification: "7.5", unit: "双", price: 8.50, stock: 12000, category: "手套", status: "active" },
  { id: 10, code: "GOWN-001", name: "一次性使用手术衣", specification: "L", unit: "件", price: 25.00, stock: 5000, category: "手术衣", status: "active" },
];

export function useProducts(params?: { search?: string; category?: string; status?: string }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>(sampleProducts);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (params?.search) {
        const search = params.search.toLowerCase();
        if (!String(p.code ?? "").toLowerCase().includes(search) && !String(p.name ?? "").toLowerCase().includes(search)) {
          return false;
        }
      }
      if (params?.category && p.category !== params.category) {
        return false;
      }
      if (params?.status && p.status !== params.status) {
        return false;
      }
      return true;
    });
  }, [products, params?.search, params?.category, params?.status]);

  return { products: filteredProducts, loading, allProducts: products };
}

// ==================== 客户数据 ====================

export interface CustomerOption {
  id: number;
  code: string;
  name: string;
  shortName?: string;
  type: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  status?: string;
}

const sampleCustomers: CustomerOption[] = [
  { id: 1, code: "CUS-001", name: "北京协和医院", shortName: "协和", type: "hospital", contactPerson: "张主任", phone: "010-12345678", status: "active" },
  { id: 2, code: "CUS-002", name: "上海瑞金医院", shortName: "瑞金", type: "hospital", contactPerson: "李主任", phone: "021-87654321", status: "active" },
  { id: 3, code: "CUS-003", name: "广州医药有限公司", shortName: "广药", type: "dealer", contactPerson: "王经理", phone: "020-11112222", status: "active" },
  { id: 4, code: "CUS-004", name: "深圳医疗器械贸易公司", shortName: "深医贸", type: "dealer", contactPerson: "陈总", phone: "0755-33334444", status: "active" },
  { id: 5, code: "CUS-005", name: "华东医药集团", shortName: "华东", type: "domestic", contactPerson: "刘经理", phone: "0571-55556666", status: "active" },
];

export function useCustomers(params?: { search?: string; type?: string }) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>(sampleCustomers);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (params?.search) {
        const search = params.search.toLowerCase();
        if (!String(c.code ?? "").toLowerCase().includes(search) && !String(c.name ?? "").toLowerCase().includes(search)) {
          return false;
        }
      }
      if (params?.type && c.type !== params.type) {
        return false;
      }
      return true;
    });
  }, [customers, params?.search, params?.type]);

  return { customers: filteredCustomers, loading, allCustomers: customers };
}

// ==================== 供应商数据 ====================

export interface SupplierOption {
  id: number;
  code: string;
  name: string;
  shortName?: string;
  type: string;
  contactPerson?: string;
  phone?: string;
  status?: string;
  qualificationLevel?: string;
}

const sampleSuppliers: SupplierOption[] = [
  { id: 1, code: "SUP-001", name: "江苏医疗器材有限公司", shortName: "江苏医材", type: "material", contactPerson: "赵经理", phone: "025-11112222", status: "qualified", qualificationLevel: "A" },
  { id: 2, code: "SUP-002", name: "浙江塑料制品厂", shortName: "浙塑", type: "material", contactPerson: "钱厂长", phone: "0571-33334444", status: "qualified", qualificationLevel: "A" },
  { id: 3, code: "SUP-003", name: "山东无纺布有限公司", shortName: "山东无纺", type: "material", contactPerson: "孙经理", phone: "0531-55556666", status: "qualified", qualificationLevel: "B" },
  { id: 4, code: "SUP-004", name: "广东包装材料公司", shortName: "广包", type: "material", contactPerson: "李经理", phone: "020-77778888", status: "qualified", qualificationLevel: "B" },
  { id: 5, code: "SUP-005", name: "上海设备维修服务公司", shortName: "沪设维", type: "service", contactPerson: "周工", phone: "021-99990000", status: "qualified", qualificationLevel: "A" },
];

export function useSuppliers(params?: { search?: string; type?: string }) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>(sampleSuppliers);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (params?.search) {
        const search = params.search.toLowerCase();
        if (!String(s.code ?? "").toLowerCase().includes(search) && !String(s.name ?? "").toLowerCase().includes(search)) {
          return false;
        }
      }
      if (params?.type && s.type !== params.type) {
        return false;
      }
      return true;
    });
  }, [suppliers, params?.search, params?.type]);

  return { suppliers: filteredSuppliers, loading, allSuppliers: suppliers };
}

// ==================== 物料数据 ====================

export interface MaterialOption {
  id: number;
  code: string;
  name: string;
  specification?: string;
  unit?: string;
  price?: number;
  stock?: number;
  category?: string;
  supplierId?: number;
  supplierName?: string;
}

const sampleMaterials: MaterialOption[] = [
  { id: 1, code: "MAT-001", name: "PP塑料粒子", specification: "医用级", unit: "kg", price: 12.50, stock: 5000, category: "原材料", supplierId: 2, supplierName: "浙江塑料制品厂" },
  { id: 2, code: "MAT-002", name: "不锈钢针头", specification: "0.7×32mm", unit: "万支", price: 850.00, stock: 200, category: "零部件", supplierId: 1, supplierName: "江苏医疗器材有限公司" },
  { id: 3, code: "MAT-003", name: "橡胶活塞", specification: "5ml规格", unit: "万个", price: 320.00, stock: 150, category: "零部件", supplierId: 1, supplierName: "江苏医疗器材有限公司" },
  { id: 4, code: "MAT-004", name: "无纺布", specification: "25g/m²", unit: "卷", price: 180.00, stock: 300, category: "原材料", supplierId: 3, supplierName: "山东无纺布有限公司" },
  { id: 5, code: "MAT-005", name: "熔喷布", specification: "过滤级", unit: "卷", price: 450.00, stock: 100, category: "原材料", supplierId: 3, supplierName: "山东无纺布有限公司" },
  { id: 6, code: "MAT-006", name: "鼻梁条", specification: "90mm", unit: "万根", price: 85.00, stock: 500, category: "零部件", supplierId: 4, supplierName: "广东包装材料公司" },
  { id: 7, code: "MAT-007", name: "耳带", specification: "弹性", unit: "万米", price: 120.00, stock: 200, category: "零部件", supplierId: 4, supplierName: "广东包装材料公司" },
  { id: 8, code: "MAT-008", name: "乳胶", specification: "天然乳胶", unit: "kg", price: 35.00, stock: 2000, category: "原材料", supplierId: 1, supplierName: "江苏医疗器材有限公司" },
  { id: 9, code: "MAT-009", name: "包装袋", specification: "灭菌袋", unit: "万个", price: 280.00, stock: 100, category: "包装材料", supplierId: 4, supplierName: "广东包装材料公司" },
  { id: 10, code: "MAT-010", name: "标签纸", specification: "不干胶", unit: "卷", price: 65.00, stock: 500, category: "包装材料", supplierId: 4, supplierName: "广东包装材料公司" },
];

export function useMaterials(params?: { search?: string; category?: string; supplierId?: number }) {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<MaterialOption[]>(sampleMaterials);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (params?.search) {
        const search = params.search.toLowerCase();
        if (!String(m.code ?? "").toLowerCase().includes(search) && !String(m.name ?? "").toLowerCase().includes(search)) {
          return false;
        }
      }
      if (params?.category && m.category !== params.category) {
        return false;
      }
      if (params?.supplierId && m.supplierId !== params.supplierId) {
        return false;
      }
      return true;
    });
  }, [materials, params?.search, params?.category, params?.supplierId]);

  return { materials: filteredMaterials, loading, allMaterials: materials };
}

// ==================== 仓库数据 ====================

export interface WarehouseOption {
  id: number;
  code: string;
  name: string;
  type: string;
  manager?: string;
  status?: string;
}

const sampleWarehouses: WarehouseOption[] = [
  { id: 1, code: "WH-001", name: "原材料仓库", type: "raw_material", manager: "张仓管", status: "active" },
  { id: 2, code: "WH-002", name: "半成品仓库", type: "semi_finished", manager: "李仓管", status: "active" },
  { id: 3, code: "WH-003", name: "成品仓库", type: "finished", manager: "王仓管", status: "active" },
  { id: 4, code: "WH-004", name: "待检仓库", type: "quarantine", manager: "赵仓管", status: "active" },
];

export function useWarehouses(params?: { type?: string }) {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>(sampleWarehouses);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      if (params?.type && w.type !== params.type) {
        return false;
      }
      return true;
    });
  }, [warehouses, params?.type]);

  return { warehouses: filteredWarehouses, loading, allWarehouses: warehouses };
}

// ==================== 生产订单数据 ====================

export interface ProductionOrderOption {
  id: number;
  orderNo: string;
  productId: number;
  productName: string;
  batchNo: string;
  plannedQty: number;
  completedQty: number;
  status: string;
  plannedDate: string;
}

const sampleProductionOrders: ProductionOrderOption[] = [
  { id: 1, orderNo: "PO-2026-0015", productId: 1, productName: "一次性使用无菌注射器", batchNo: "B20260201", plannedQty: 10000, completedQty: 6500, status: "in_progress", plannedDate: "2026-02-05" },
  { id: 2, orderNo: "PO-2026-0014", productId: 4, productName: "医用外科口罩", batchNo: "B20260130", plannedQty: 50000, completedQty: 50000, status: "completed", plannedDate: "2026-01-30" },
  { id: 3, orderNo: "PO-2026-0016", productId: 8, productName: "无菌手术手套", batchNo: "B20260210", plannedQty: 5000, completedQty: 0, status: "planned", plannedDate: "2026-02-10" },
];

export function useProductionOrders(params?: { status?: string }) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<ProductionOrderOption[]>(sampleProductionOrders);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (params?.status && o.status !== params.status) {
        return false;
      }
      return true;
    });
  }, [orders, params?.status]);

  return { orders: filteredOrders, loading, allOrders: orders };
}

// ==================== 通用选择器Hook ====================

export function useSelectOptions<T extends { id: number; code: string; name: string }>(
  items: T[],
  labelField: keyof T = "name" as keyof T
) {
  return useMemo(() => {
    return items.map((item) => ({
      value: String(item.id),
      label: `${item.code} - ${String(item[labelField])}`,
      data: item,
    }));
  }, [items, labelField]);
}

// ==================== 数据联动Hook ====================

/**
 * 根据产品ID获取BOM物料清单
 */
export function useBomByProduct(productId: number | null) {
  const [loading, setLoading] = useState(false);
  const [bomItems, setBomItems] = useState<MaterialOption[]>([]);

  useEffect(() => {
    if (!productId) {
      setBomItems([]);
      return;
    }

    // 模拟根据产品ID获取BOM
    // 实际应调用API: trpc.bom.getByProductId.useQuery({ productId })
    setLoading(true);
    setTimeout(() => {
      // 模拟数据
      const mockBom = sampleMaterials.slice(0, 3).map((m, i) => ({
        ...m,
        quantity: (i + 1) * 100,
      }));
      setBomItems(mockBom);
      setLoading(false);
    }, 300);
  }, [productId]);

  return { bomItems, loading };
}

/**
 * 根据供应商ID获取可采购物料
 */
export function useMaterialsBySupplier(supplierId: number | null) {
  const { materials, loading } = useMaterials({ supplierId: supplierId || undefined });
  return { materials, loading };
}

/**
 * 计算订单金额
 */
export function useOrderAmount(
  items: Array<{ quantity: number; unitPrice: number }>
) {
  return useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [items]);
}
