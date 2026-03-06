import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'paZkiNgy2nHQcsT.root',
  password: 'mB5jFs2uVaZjEegW',
  database: 'test',
  ssl: { rejectUnauthorized: true },
});

// 查询仓库列表
const [warehouses] = await conn.execute('SELECT id, name, type FROM warehouses ORDER BY id');
console.log('\n=== 现有仓库 ===');
console.table(warehouses);

// 查询产品列表（含分类）
const [products] = await conn.execute(
  'SELECT id, name, specification, unit, category FROM products WHERE status != "discontinued" ORDER BY id'
);
console.log('\n=== 产品列表（含分类）===');
console.table(products);

// 查看 products 表结构
const [cols] = await conn.execute('DESCRIBE products');
console.log('\n=== products 表结构 ===');
console.table(cols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Default: c.Default })));

await conn.end();
