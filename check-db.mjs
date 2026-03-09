import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await createConnection(process.env.DATABASE_URL);

const [companies] = await conn.query('SELECT * FROM companies');
console.log('=== Companies ===');
console.log(JSON.stringify(companies, null, 2));

const [users] = await conn.query('SELECT id, name, openId, role, department, companyId FROM users LIMIT 20');
console.log('\n=== Users ===');
console.log(JSON.stringify(users, null, 2));

await conn.end();
