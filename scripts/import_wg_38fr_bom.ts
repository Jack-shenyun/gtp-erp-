import { and, eq, sql } from "drizzle-orm";
import { bom, products } from "../drizzle/schema";
import { createBomItem, createProduct, getDb } from "../server/db";

type ProductCategory = "finished" | "semi_finished" | "raw_material" | "auxiliary" | "other";

type MaterialRow = {
  code: string;
  name: string;
  specification?: string;
  unit?: string;
  quantity?: string;
  productCategory: ProductCategory;
  description?: string;
};

const MANUFACTURER = "苏州神韵医疗器械有限公司";

const finishedProduct: MaterialRow = {
  code: "WG-38FR",
  name: "胃管",
  specification: "WG-II-38Fr",
  unit: "套",
  quantity: "1",
  productCategory: "finished",
  description: "根据《BOM-WG-38Fr产品生产物料BOM表》导入",
};

const materialRows: MaterialRow[] = [
  { code: "WG38-DG", name: "导管", specification: "Φ12.40×φ7.50×745", unit: "PCS", quantity: "1", productCategory: "semi_finished" },
  { code: "WG38-SH2270A", name: "硅橡胶", specification: "SH2270A", unit: "kg", quantity: "0.05", productCategory: "raw_material" },
  { code: "WG38-SH2270B", name: "硅橡胶", specification: "SH2270B", unit: "kg", quantity: "0.05", productCategory: "raw_material" },
  { code: "WG38-1110", name: "色母", specification: "1110", unit: "g", quantity: "0.1", productCategory: "raw_material" },
  { code: "WG38-B875380", name: "硫酸钡", specification: "B875380-500g", unit: "g", quantity: "0.1", productCategory: "raw_material" },
  { code: "WG38-NYZJT", name: "内圆锥接头", specification: "φ16.20×φ11.70×59.80", unit: "PCS", quantity: "1", productCategory: "semi_finished" },
  { code: "WG38-TYLJQ", name: "通用连接器", specification: "4.3*48", unit: "PCS", quantity: "1", productCategory: "semi_finished" },
  { code: "WG38-QN", name: "球囊", specification: "48*13", unit: "PCS", quantity: "1", productCategory: "semi_finished" },
  { code: "WG38-DXF", name: "单向阀", specification: "13.5*100", unit: "PCS", quantity: "1", productCategory: "semi_finished" },
  { code: "WG38-ZLB", name: "止流板", specification: "11.7", unit: "PCS", quantity: "1", productCategory: "semi_finished" },
  { code: "WG38-ABS", name: "ABS 管", specification: "0.5*1.4", unit: "PCS", quantity: "1", productCategory: "raw_material" },
  { code: "WG38-SJT", name: "硅胶头", specification: "19.20*8.40*12.40", unit: "PCS", quantity: "1", productCategory: "semi_finished" },
  { code: "WG38-KJ998", name: "冷粘胶", specification: "KJ-998", unit: "10ml/10套", quantity: "1", productCategory: "auxiliary" },
  { code: "WG38-ZS003B", name: "油墨", specification: "ZS-003B", unit: "10ml/20套", quantity: "1", productCategory: "auxiliary" },
  { code: "WG38-JJ75", name: "酒精", specification: "75%", unit: "ml", quantity: "50", productCategory: "auxiliary" },
  { code: "WG38-ZSD", name: "纸塑袋", specification: "260*330", unit: "PCS", quantity: "1", productCategory: "auxiliary" },
  { code: "WG38-BQZ", name: "标签纸", specification: "100×150", unit: "PCS", quantity: "1", productCategory: "auxiliary" },
  { code: "WG38-HGZ", name: "合格证", specification: "QC-45×45", unit: "PCS", quantity: "1", productCategory: "auxiliary" },
  { code: "WG38-SMS", name: "说明书", specification: "IF-WG", unit: "PCS", quantity: "1", productCategory: "auxiliary" },
  { code: "WG38-ZH", name: "中盒", specification: "WPB-330*260*30", unit: "PCS", quantity: "1", productCategory: "auxiliary" },
  { code: "WG38-ZX", name: "纸箱", specification: "BC-680*550*430", unit: "50PCS/箱", quantity: "1", productCategory: "auxiliary" },
];

async function ensureProduct(row: MaterialRow): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("数据库不可用");

  const byCode = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.code, row.code))
    .limit(1);
  if (byCode.length > 0) return byCode[0].id;

  const byNameSpec = await db
    .select({ id: products.id })
    .from(products)
    .where(and(
      eq(products.name, row.name),
      eq(products.specification, row.specification ?? null),
    ))
    .limit(1);
  if (byNameSpec.length > 0) return byNameSpec[0].id;

  const id = await createProduct({
    isMedicalDevice: row.productCategory === "finished",
    code: row.code,
    name: row.name,
    specification: row.specification,
    productCategory: row.productCategory,
    unit: row.unit,
    status: "active",
    sourceType: "production",
    salePermission: row.productCategory === "finished" ? "saleable" : "not_saleable",
    procurePermission: row.productCategory === "finished" ? "production_only" : "purchasable",
    manufacturer: MANUFACTURER,
    description: row.description,
  });
  return id;
}

async function upsertBom(finishedProductId: number, rows: MaterialRow[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("数据库不可用");

  const existing = await db
    .select({ id: bom.id, materialCode: bom.materialCode })
    .from(bom)
    .where(eq(bom.productId, finishedProductId));

  const existsSet = new Set(existing.map((x) => x.materialCode));

  for (const row of rows) {
    if (existsSet.has(row.code)) continue;
    await createBomItem({
      productId: finishedProductId,
      materialCode: row.code,
      materialName: row.name,
      specification: row.specification,
      quantity: row.quantity || "1",
      unit: row.unit,
      version: "V1.0",
      status: "active",
    });
  }
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL 未配置，无法导入");

  console.log("开始导入 WG-II-38Fr 产品与BOM数据...");

  const finishedId = await ensureProduct(finishedProduct);

  for (const row of materialRows) {
    await ensureProduct(row);
  }

  await upsertBom(finishedId, materialRows);

  const bomCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(bom)
    .where(eq(bom.productId, finishedId));

  console.log(`导入完成：成品ID=${finishedId}，BOM项目总数=${bomCount[0]?.count || 0}`);
}

main().catch((err) => {
  console.error("导入失败:", err?.message || err);
  process.exit(1);
});
