import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const url = process.env.DATABASE_URL;
const conn = await createConnection(url);

// 获取现有列
const [rows] = await conn.query('DESCRIBE production_records');
const existingCols = rows.map(r => r.Field);
console.log('Existing columns count:', existingCols.length);

// 需要添加的列
const columnsToAdd = [
  { name: 'workstationName', sql: 'VARCHAR(100) NULL' },
  { name: 'workstationId', sql: 'INT NULL' },
  { name: 'recordDate', sql: 'DATE NULL' },
  { name: 'scrapQty', sql: 'VARCHAR(50) NULL' },
  { name: 'temperatureLimit', sql: 'VARCHAR(50) NULL' },
  { name: 'humidityLimit', sql: 'VARCHAR(50) NULL' },
  { name: 'materialSpec', sql: 'VARCHAR(200) NULL' },
  { name: 'materialBatchNo', sql: 'VARCHAR(100) NULL' },
  { name: 'usedQty', sql: 'VARCHAR(50) NULL' },
  { name: 'usedUnit', sql: 'VARCHAR(50) NULL' },
  { name: 'cleanedBy', sql: 'VARCHAR(100) NULL' },
  { name: 'checkedBy', sql: 'VARCHAR(100) NULL' },
  { name: 'cleanResult', sql: "ENUM('pass','fail') NULL" },
  { name: 'firstPieceResult', sql: "ENUM('qualified','unqualified') NULL" },
  { name: 'firstPieceInspector', sql: 'VARCHAR(100) NULL' },
];

for (const col of columnsToAdd) {
  if (!existingCols.includes(col.name)) {
    try {
      await conn.query(`ALTER TABLE production_records ADD COLUMN \`${col.name}\` ${col.sql}`);
      console.log(`✓ Added column: ${col.name}`);
    } catch (e) {
      console.error(`✗ Failed to add ${col.name}: ${e.message}`);
    }
  } else {
    console.log(`- Column already exists: ${col.name}`);
  }
}

console.log('\nMigration complete!');
conn.end();
