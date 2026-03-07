import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const url = process.env.DATABASE_URL;
const conn = await createConnection(url);
const [rows] = await conn.query('DESCRIBE production_records');
const cols = rows.map(r => r.Field);
console.log('Existing columns:\n', cols.join('\n'));

const needed = ['workstationName', 'workstationId', 'recordDate', 'scrapQty', 'temperatureLimit', 'humidityLimit', 'materialSpec', 'materialBatchNo', 'usedQty', 'usedUnit', 'cleanedBy', 'checkedBy', 'cleanResult', 'firstPieceResult', 'firstPieceInspector'];
const missing = needed.filter(c => !cols.includes(c));
console.log('\nMissing:', missing.join(', ') || 'none');
conn.end();
