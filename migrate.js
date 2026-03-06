const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const url = process.env.DATABASE_URL;
  console.log('Connecting to:', url.substring(0, 40) + '...');
  const conn = await mysql.createConnection(url);

  // 添加 needsShipping 字段
  const [cols] = await conn.execute("SHOW COLUMNS FROM sales_orders LIKE 'needsShipping'");
  if (cols.length === 0) {
    await conn.execute('ALTER TABLE sales_orders ADD COLUMN needsShipping BOOLEAN DEFAULT FALSE AFTER shippingPhone');
    console.log('✅ Added needsShipping');
  } else {
    console.log('⏭  needsShipping already exists');
  }

  // 添加 shippingFee 字段
  const [cols2] = await conn.execute("SHOW COLUMNS FROM sales_orders LIKE 'shippingFee'");
  if (cols2.length === 0) {
    await conn.execute('ALTER TABLE sales_orders ADD COLUMN shippingFee DECIMAL(14,2) AFTER needsShipping');
    console.log('✅ Added shippingFee');
  } else {
    console.log('⏭  shippingFee already exists');
  }

  // 验证
  const [allCols] = await conn.execute("SHOW COLUMNS FROM sales_orders");
  console.log('\nCurrent sales_orders columns:');
  allCols.forEach(c => console.log(' -', c.Field, c.Type));

  await conn.end();
}
main().catch(console.error);
