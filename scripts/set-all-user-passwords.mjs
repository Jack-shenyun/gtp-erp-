import { randomBytes, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";

const targetPassword = "666-11";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_passwords (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [users] = await conn.query("SELECT id, openId, name FROM users");

  let count = 0;
  for (const user of users) {
    const passwordHash = hashPassword(targetPassword);
    await conn.query(
      `INSERT INTO user_passwords (userId, passwordHash)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         passwordHash = VALUES(passwordHash),
         updatedAt = CURRENT_TIMESTAMP`,
      [user.id, passwordHash],
    );
    count += 1;
  }

  console.log(`UPDATED_USERS ${count}`);
  console.log(`PASSWORD ${targetPassword}`);
} finally {
  await conn.end();
}
