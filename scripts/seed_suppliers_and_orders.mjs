/**
 * 建立供应商、采购价格、更新BOM单价、生成采购订单
 * 根据实际数据库表结构调整
 */
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'paZkiNgy2nHQcsT.root',
  password: 'mB5jFs2uVaZjEegW',
  database: 'test',
  ssl: { rejectUnauthorized: true }
});

console.log('✅ 数据库连接成功');

// ==================== 1. 供应商已建立，获取ID ====================
const [supplierRows] = await conn.execute('SELECT id, code, name FROM suppliers WHERE code IN (?,?,?,?,?)',
  ['SUP-RM-001','SUP-RM-002','SUP-AUX-001','SUP-AUX-002','SUP-SVC-001']);
const supplierIds = {};
supplierRows.forEach(s => { supplierIds[s.code] = s.id; });
console.log('供应商ID:', supplierIds);

// ==================== 2. 建立采购价格关联 ====================
// product_supplier_prices 实际字段：productId, supplierId, unitPrice, currency, minOrderQty, leadTimeDays, isDefault
const productMap = {
  'WG38-SH2270A': { id: 60003, name: '硅橡胶SH2270A', unit: 'kg' },
  'WG38-SH2270B': { id: 60004, name: '硅橡胶SH2270B', unit: 'kg' },
  'WG38-1110':    { id: 60005, name: '色母1110', unit: 'g' },
  'WG38-B875380': { id: 60006, name: '硫酸钡B875380', unit: 'g' },
  'WG38-KJ998':   { id: 60014, name: '冷粘胶KJ-998', unit: '10ml/10套' },
  'WG38-ZS003B':  { id: 60015, name: '油墨ZS-003B', unit: '10ml/20套' },
  'WG38-JJ75':    { id: 60016, name: '酒精75%', unit: 'ml' },
  'WG38-ZSD':     { id: 60017, name: '纸塑袋260*330', unit: 'PCS' },
  'WG38-BQZ':     { id: 60018, name: '标签纸100×150', unit: 'PCS' },
  'WG38-HGZ':     { id: 60019, name: '合格证QC-45×45', unit: 'PCS' },
  'WG38-SMS':     { id: 60020, name: '说明书IF-WG', unit: 'PCS' },
  'WG38-ZH':      { id: 60021, name: '中盒WPB-330*260*30', unit: 'PCS' },
  'WG38-ZX':      { id: 60022, name: '纸箱BC-680*550*430', unit: '50PCS/箱' },
};

const priceConfig = [
  // 道康宁 - 原材料（硅橡胶）
  { supplierCode: 'SUP-RM-001', productCode: 'WG38-SH2270A', price: 85.00, moq: 25, leadTime: 14, isDefault: 1 },
  { supplierCode: 'SUP-RM-001', productCode: 'WG38-SH2270B', price: 88.00, moq: 25, leadTime: 14, isDefault: 1 },
  // 白云化工 - 原材料（色母、硫酸钡）
  { supplierCode: 'SUP-RM-002', productCode: 'WG38-1110',    price: 0.12,  moq: 1000, leadTime: 7, isDefault: 1 },
  { supplierCode: 'SUP-RM-002', productCode: 'WG38-B875380', price: 0.08,  moq: 500,  leadTime: 7, isDefault: 1 },
  // 鑫盛包装 - 辅料（包装材料）
  { supplierCode: 'SUP-AUX-001', productCode: 'WG38-ZSD',    price: 0.35,  moq: 1000, leadTime: 10, isDefault: 1 },
  { supplierCode: 'SUP-AUX-001', productCode: 'WG38-ZH',     price: 1.20,  moq: 500,  leadTime: 10, isDefault: 1 },
  { supplierCode: 'SUP-AUX-001', productCode: 'WG38-ZX',     price: 8.50,  moq: 100,  leadTime: 10, isDefault: 1 },
  { supplierCode: 'SUP-AUX-001', productCode: 'WG38-KJ998',  price: 12.00, moq: 100,  leadTime: 7,  isDefault: 1 },
  { supplierCode: 'SUP-AUX-001', productCode: 'WG38-JJ75',   price: 0.008, moq: 5000, leadTime: 5,  isDefault: 1 },
  // 华美印刷 - 辅料（印刷品）
  { supplierCode: 'SUP-AUX-002', productCode: 'WG38-BQZ',    price: 0.08,  moq: 2000, leadTime: 7, isDefault: 1 },
  { supplierCode: 'SUP-AUX-002', productCode: 'WG38-HGZ',    price: 0.05,  moq: 2000, leadTime: 7, isDefault: 1 },
  { supplierCode: 'SUP-AUX-002', productCode: 'WG38-SMS',    price: 0.15,  moq: 1000, leadTime: 7, isDefault: 1 },
  { supplierCode: 'SUP-AUX-002', productCode: 'WG38-ZS003B', price: 18.00, moq: 50,   leadTime: 5, isDefault: 1 },
];

console.log('\n=== 建立采购价格关联 ===');
for (const pc of priceConfig) {
  const supplierId = supplierIds[pc.supplierCode];
  const product = productMap[pc.productCode];
  if (!supplierId || !product) continue;

  const [existing] = await conn.execute(
    'SELECT id FROM product_supplier_prices WHERE productId=? AND supplierId=?',
    [product.id, supplierId]
  );
  if (existing.length > 0) {
    await conn.execute(
      'UPDATE product_supplier_prices SET unitPrice=?, minOrderQty=?, leadTimeDays=?, isDefault=?, updatedAt=NOW() WHERE id=?',
      [pc.price, pc.moq, pc.leadTime, pc.isDefault, existing[0].id]
    );
    console.log(`  更新价格: ${product.name} - ¥${pc.price}/${product.unit}`);
  } else {
    await conn.execute(
      `INSERT INTO product_supplier_prices (productId, supplierId, unitPrice, currency, minOrderQty, leadTimeDays, isDefault, effectiveDate, createdAt, updatedAt)
       VALUES (?, ?, ?, 'CNY', ?, ?, ?, '2026-01-01', NOW(), NOW())`,
      [product.id, supplierId, pc.price, pc.moq, pc.leadTime, pc.isDefault]
    );
    console.log(`  ✅ 创建价格: ${product.name} - ¥${pc.price}/${product.unit}`);
  }
}

// ==================== 3. 更新BOM单价 ====================
console.log('\n=== 更新BOM单价 ===');
const bomPrices = {
  'WG38-SH2270A': 85.00,
  'WG38-SH2270B': 88.00,
  'WG38-1110':    0.12,
  'WG38-B875380': 0.08,
  'WG38-KJ998':   12.00,
  'WG38-ZS003B':  18.00,
  'WG38-JJ75':    0.008,
  'WG38-ZSD':     0.35,
  'WG38-BQZ':     0.08,
  'WG38-HGZ':     0.05,
  'WG38-SMS':     0.15,
  'WG38-ZH':      1.20,
  'WG38-ZX':      8.50,
  // 半成品估算单价（加工成本）
  'WG38-DG':      2.50,
  'WG38-NYZJT':   0.80,
  'WG38-TYLJQ':   0.60,
  'WG38-QN':      0.45,
  'WG38-DXF':     0.35,
  'WG38-ZLB':     0.25,
  'WG38-SJT':     0.30,
  'WG38-ABS':     0.15,
};

for (const [code, price] of Object.entries(bomPrices)) {
  const [result] = await conn.execute(
    'UPDATE bom SET unitPrice=? WHERE materialCode=?',
    [price, code]
  );
  if (result.affectedRows > 0) {
    console.log(`  ✅ BOM单价: ${code} = ¥${price}`);
  }
}

// ==================== 4. 生成采购订单 ====================
console.log('\n=== 生成采购订单 ===');

// 获取当前最大采购订单序号
const [maxNo] = await conn.execute("SELECT MAX(orderNo) as maxNo FROM purchase_orders WHERE orderNo LIKE 'PO-2026%'");
let orderSeq = 1;
if (maxNo[0].maxNo) {
  const match = maxNo[0].maxNo.match(/(\d+)$/);
  if (match) orderSeq = parseInt(match[1]) + 1;
}

// 4家采购供应商的订单配置（不含灭菌服务商）
const orderConfigs = [
  {
    supplierCode: 'SUP-RM-001',
    remark: '硅橡胶原材料采购 - 月结30天',
    items: [
      { productId: 60003, code: 'WG38-SH2270A', name: '硅橡胶', spec: 'SH2270A', qty: 50, unit: 'kg', price: 85.00 },
      { productId: 60004, code: 'WG38-SH2270B', name: '硅橡胶', spec: 'SH2270B', qty: 50, unit: 'kg', price: 88.00 },
    ]
  },
  {
    supplierCode: 'SUP-RM-002',
    remark: '色母及硫酸钡采购 - 月结60天',
    items: [
      { productId: 60005, code: 'WG38-1110',    name: '色母',   spec: '1110',       qty: 5000, unit: 'g',   price: 0.12 },
      { productId: 60006, code: 'WG38-B875380', name: '硫酸钡', spec: 'B875380-500g', qty: 2000, unit: 'g', price: 0.08 },
    ]
  },
  {
    supplierCode: 'SUP-AUX-001',
    remark: '包装辅料采购 - 预付款100%',
    items: [
      { productId: 60017, code: 'WG38-ZSD',   name: '纸塑袋', spec: '260*330',         qty: 2000, unit: 'PCS',      price: 0.35 },
      { productId: 60021, code: 'WG38-ZH',    name: '中盒',   spec: 'WPB-330*260*30',  qty: 1000, unit: 'PCS',      price: 1.20 },
      { productId: 60022, code: 'WG38-ZX',    name: '纸箱',   spec: 'BC-680*550*430',  qty: 200,  unit: '50PCS/箱', price: 8.50 },
      { productId: 60014, code: 'WG38-KJ998', name: '冷粘胶', spec: 'KJ-998',          qty: 200,  unit: '10ml/10套',price: 12.00 },
    ]
  },
  {
    supplierCode: 'SUP-AUX-002',
    remark: '印刷辅料采购 - 预付款50%，发货前付清',
    items: [
      { productId: 60018, code: 'WG38-BQZ',   name: '标签纸', spec: '100×150',   qty: 5000, unit: 'PCS',       price: 0.08 },
      { productId: 60019, code: 'WG38-HGZ',   name: '合格证', spec: 'QC-45×45',  qty: 5000, unit: 'PCS',       price: 0.05 },
      { productId: 60020, code: 'WG38-SMS',   name: '说明书', spec: 'IF-WG',     qty: 3000, unit: 'PCS',       price: 0.15 },
      { productId: 60015, code: 'WG38-ZS003B',name: '油墨',   spec: 'ZS-003B',   qty: 100,  unit: '10ml/20套', price: 18.00 },
    ]
  },
];

for (const oc of orderConfigs) {
  const supplierId = supplierIds[oc.supplierCode];
  const orderNo = `PO-2026${String(orderSeq).padStart(4, '0')}`;
  orderSeq++;

  const totalAmount = oc.items.reduce((sum, item) => sum + item.qty * item.price, 0);

  // 检查是否已存在
  const [existingOrder] = await conn.execute('SELECT id FROM purchase_orders WHERE orderNo=?', [orderNo]);
  let orderId;

  if (existingOrder.length > 0) {
    orderId = existingOrder[0].id;
    console.log(`  订单已存在: ${orderNo}`);
  } else {
    const [orderResult] = await conn.execute(
      `INSERT INTO purchase_orders (orderNo, supplierId, orderDate, expectedDate, totalAmount, currency, status, remark, createdAt, updatedAt)
       VALUES (?, ?, '2026-03-07', '2026-03-21', ?, 'CNY', 'draft', ?, NOW(), NOW())`,
      [orderNo, supplierId, totalAmount, oc.remark]
    );
    orderId = orderResult.insertId;
    console.log(`  ✅ 采购订单: ${orderNo} 金额¥${totalAmount.toFixed(2)}`);
  }

  // 插入订单明细
  for (const item of oc.items) {
    const [existingItem] = await conn.execute(
      'SELECT id FROM purchase_order_items WHERE orderId=? AND materialCode=?',
      [orderId, item.code]
    );
    if (existingItem.length > 0) continue;

    await conn.execute(
      `INSERT INTO purchase_order_items (orderId, productId, materialCode, materialName, specification, quantity, unit, unitPrice, amount, receivedQty, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [orderId, item.productId, item.code, item.name, item.spec, item.qty, item.unit, item.price, item.qty * item.price]
    );
    console.log(`    + ${item.name}(${item.spec}) x${item.qty} ${item.unit} @ ¥${item.price} = ¥${(item.qty * item.price).toFixed(2)}`);
  }
}

// ==================== 5. 验证汇总 ====================
console.log('\n=== 验证汇总 ===');
const [supplierCount] = await conn.execute('SELECT COUNT(*) as cnt FROM suppliers WHERE code LIKE "SUP-%"');
const [priceCount] = await conn.execute('SELECT COUNT(*) as cnt FROM product_supplier_prices WHERE supplierId IN (SELECT id FROM suppliers WHERE code LIKE "SUP-%")');
const [orderCount] = await conn.execute("SELECT COUNT(*) as cnt, SUM(totalAmount) as total FROM purchase_orders WHERE orderNo LIKE 'PO-2026%'");
const [bomCount] = await conn.execute('SELECT COUNT(*) as cnt FROM bom WHERE unitPrice > 0');

console.log(`  供应商: ${supplierCount[0].cnt} 家`);
console.log(`  采购价格关联: ${priceCount[0].cnt} 条`);
console.log(`  采购订单: ${orderCount[0].cnt} 张，总金额 ¥${Number(orderCount[0].total || 0).toFixed(2)}`);
console.log(`  BOM有单价行数: ${bomCount[0].cnt} 条`);

await conn.end();
console.log('\n✅ 全部完成！');
