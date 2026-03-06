import mysql from 'mysql2/promise';

const DB_URL = 'mysql://paZkiNgy2nHQcsT.root:mB5jFs2uVaZjEegW@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test';

async function main() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: 'paZkiNgy2nHQcsT.root',
    password: 'mB5jFs2uVaZjEegW',
    database: 'test',
    ssl: { rejectUnauthorized: true },
  });

  // 1. 查询所有产品
  const [products] = await conn.execute(
    `SELECT id, name, specification, unit FROM products WHERE status != 'discontinued' ORDER BY id`
  );
  console.log(`找到 ${products.length} 个产品`);

  // 2. 查询第一个仓库（用于关联）
  const [warehouses] = await conn.execute(`SELECT id, name FROM warehouses LIMIT 1`);
  if (warehouses.length === 0) {
    console.error('未找到仓库，请先创建仓库');
    await conn.end();
    return;
  }
  const warehouseId = warehouses[0].id;
  console.log(`使用仓库: ${warehouses[0].name} (id=${warehouseId})`);

  // 3. 为每个产品创建2个批次，每批次库存1000
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  // 生产日期：今天，有效期：2年后
  const expiryDate = new Date(now);
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);
  const expiryStr = expiryDate.toISOString().split('T')[0];

  let insertCount = 0;
  let skipCount = 0;

  for (const product of products) {
    for (let batchIdx = 1; batchIdx <= 2; batchIdx++) {
      // 批号格式：YYYYMMDD-产品ID-批次序号
      const batchNo = `${today.replace(/-/g, '')}-${String(product.id).padStart(4, '0')}-B${batchIdx}`;

      // 检查是否已存在相同批号
      const [existing] = await conn.execute(
        `SELECT id FROM inventory WHERE productId = ? AND batchNo = ?`,
        [product.id, batchNo]
      );
      if (existing.length > 0) {
        console.log(`  跳过已存在: ${product.name} 批号 ${batchNo}`);
        skipCount++;
        continue;
      }

      await conn.execute(
        `INSERT INTO inventory 
          (warehouseId, productId, itemName, batchNo, quantity, unit, status, productionDate, expiryDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'qualified', ?, ?, NOW(), NOW())`,
        [
          warehouseId,
          product.id,
          product.name,
          batchNo,
          1000,
          product.unit || '件',
          today,
          expiryStr,
        ]
      );
      console.log(`  ✓ ${product.name} (${product.specification || '无规格'}) 批号 ${batchNo} 数量 1000`);
      insertCount++;
    }
  }

  console.log(`\n完成！新增 ${insertCount} 条库存记录，跳过 ${skipCount} 条已存在记录`);
  await conn.end();
}

main().catch((err) => {
  console.error('执行失败:', err.message);
  process.exit(1);
});
