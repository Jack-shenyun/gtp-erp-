import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { scryptSync, randomBytes } from 'node:crypto';
config();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // 1. 获取滴乐管理员用户
  const [users] = await conn.query('SELECT id, name FROM users WHERE openId = ?', ['user-dl-admin']);
  if (users.length === 0) {
    console.error('Test user not found');
    process.exit(1);
  }
  const userId = users[0].id;
  
  // 2. 为该用户设置密码 (user_passwords 表)
  const pwdHash = hashPassword('666-11');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_passwords (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  
  await conn.query('INSERT INTO user_passwords (userId, passwordHash) VALUES (?, ?) ON DUPLICATE KEY UPDATE passwordHash = ?', 
    [userId, pwdHash, pwdHash]);
  
  console.log(`Password set for user ${users[0].name} (ID: ${userId})`);
  
  // 3. 验证公司授权 (company_user_access 表)
  const [access] = await conn.query('SELECT * FROM company_user_access WHERE userId = ? AND companyId = ?', [userId, 1]);
  if (access.length === 0) {
    console.log('Adding company access for test user...');
    await conn.query('INSERT INTO company_user_access (userId, companyId) VALUES (?, ?)', [userId, 1]);
  }
  
  console.log('Setup complete for testing.');
  await conn.end();
}

main().catch(console.error);
