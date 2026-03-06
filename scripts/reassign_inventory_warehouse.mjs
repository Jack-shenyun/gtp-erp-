import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'paZkiNgy2nHQcsT.root',
  password: 'mB5jFs2uVaZjEegW',
  database: 'test',
  ssl: { rejectUnauthorized: true },
});

// 1. 查询仓库列表
const [warehouses] = await conn.execute('SELECT id, name FROM warehouses ORDER BY id');
console.log('现有仓库:');
warehouses.forEach(w => console.log(`  id=${w.id}  ${w.name}`));

// 找到对应仓库 ID
const findWarehouse = (keyword) => {
  const wh = warehouses.find(w => w.name.includes(keyword));
  if (!wh) throw new Error(`未找到包含"${keyword}"的仓库`);
  return wh.id;
};

const finishedWarehouseId  = findWarehouse('成品');   // 成品仓
const rawMaterialWarehouseId = findWarehouse('原料');  // 原料仓
const auxiliaryWarehouseId = findWarehouse('辅料');   // 辅料仓

console.log(`\n成品仓 id=${finishedWarehouseId}，原料仓 id=${rawMaterialWarehouseId}，辅料仓 id=${auxiliaryWarehouseId}`);

// 2. 查询所有产品的分类
const [products] = await conn.execute(
  'SELECT id, name, productCategory FROM products WHERE status != "discontinued" ORDER BY id'
);

console.log('\n产品分类情况:');
products.forEach(p => console.log(`  id=${p.id}  ${p.name}  category=${p.productCategory}`));

// 3. 按 productCategory 决定仓库
//    finished      → 成品仓
//    semi_finished → 成品仓（半成品也放成品仓）
//    raw_material  → 原料仓
//    auxiliary     → 辅料仓
//    other / null  → 原料仓（默认）
const getWarehouseId = (category) => {
  if (category === 'finished' || category === 'semi_finished') return finishedWarehouseId;
  if (category === 'raw_material') return rawMaterialWarehouseId;
  if (category === 'auxiliary') return auxiliaryWarehouseId;
  return rawMaterialWarehouseId; // 默认原料仓
};

// 4. 更新 inventory 表中每个产品对应的 warehouseId
let updatedCount = 0;
for (const product of products) {
  const targetWarehouseId = getWarehouseId(product.productCategory);
  const [result] = await conn.execute(
    'UPDATE inventory SET warehouseId = ?, updatedAt = NOW() WHERE productId = ?',
    [targetWarehouseId, product.id]
  );
  if (result.affectedRows > 0) {
    const warehouseName = warehouses.find(w => w.id === targetWarehouseId)?.name;
    console.log(`  ✓ ${product.name} (${product.productCategory || 'null'}) → ${warehouseName}  (${result.affectedRows} 条)`);
    updatedCount += result.affectedRows;
  }
}

// 5. 汇总结果
console.log(`\n完成！共更新 ${updatedCount} 条库存记录`);

// 6. 验证
const [summary] = await conn.execute(`
  SELECT w.name AS 仓库, COUNT(*) AS 记录数, SUM(i.quantity) AS 总库存
  FROM inventory i
  JOIN warehouses w ON i.warehouseId = w.id
  GROUP BY w.id, w.name
  ORDER BY w.id
`);
console.log('\n=== 各仓库库存汇总 ===');
console.table(summary);

await conn.end();
