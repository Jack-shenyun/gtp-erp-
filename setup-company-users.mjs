import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await createConnection(process.env.DATABASE_URL);

// 为滴乐塑胶(id=1)创建测试用户
const dileUsers = [
  { name: '滴乐管理员', openId: 'user-dl-admin', role: 'admin', department: '管理部，采购部，销售部，财务部，仓库管理', companyId: 1 },
  { name: '滴乐采购员', openId: 'user-dl-purchase', role: 'user', department: '采购部', companyId: 1 },
  { name: '滴乐销售员', openId: 'user-dl-sales', role: 'user', department: '销售部', companyId: 1 },
];

// 为瑞仁医疗(id=2)创建测试用户
const ruirenUsers = [
  { name: '瑞仁管理员', openId: 'user-rr-admin', role: 'admin', department: '管理部，采购部，销售部，财务部，仓库管理', companyId: 2 },
  { name: '瑞仁采购员', openId: 'user-rr-purchase', role: 'user', department: '采购部', companyId: 2 },
  { name: '瑞仁销售员', openId: 'user-rr-sales', role: 'user', department: '销售部', companyId: 2 },
];

const allUsers = [...dileUsers, ...ruirenUsers];

for (const u of allUsers) {
  // Check if user already exists
  const [existing] = await conn.query('SELECT id FROM users WHERE openId = ?', [u.openId]);
  if (existing.length > 0) {
    console.log(`User ${u.name} (${u.openId}) already exists, updating...`);
    await conn.query(
      'UPDATE users SET name=?, role=?, department=?, companyId=? WHERE openId=?',
      [u.name, u.role, u.department, u.companyId, u.openId]
    );
  } else {
    console.log(`Creating user ${u.name} (${u.openId})...`);
    await conn.query(
      'INSERT INTO users (openId, name, role, department, companyId) VALUES (?, ?, ?, ?, ?)',
      [u.openId, u.name, u.role, u.department, u.companyId]
    );
  }
}

// Verify
const [allCompanyUsers] = await conn.query(
  'SELECT id, name, openId, role, department, companyId FROM users WHERE companyId IN (1, 2) ORDER BY companyId, id'
);
console.log('\n=== Company Users ===');
console.log(JSON.stringify(allCompanyUsers, null, 2));

await conn.end();
console.log('\nDone!');
