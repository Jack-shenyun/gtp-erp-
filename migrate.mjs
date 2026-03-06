import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// 从.env读取DATABASE_URL
const envContent = readFileSync('.env', 'utf-8');
const match = envContent.match(/DATABASE_URL=(.+)/);
const DATABASE_URL = match ? match[1].trim() : '';
console.log('Connecting to:', DATABASE_URL.substring(0, 50) + '...');

const conn = await mysql.createConnection(DATABASE_URL);

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
const [allCols] = await conn.execute('SHOW COLUMNS FROM sales_orders');
console.log('\nCurrent sales_orders columns:');
allCols.forEach(c => console.log(' -', c.Field, c.Type));

await conn.end();
