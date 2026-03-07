require('dotenv').config();
const mysql2 = require('mysql2/promise');
const url = process.env.DATABASE_URL;
(async () => {
  const conn = await mysql2.createConnection(url);
  const [rows] = await conn.query('DESCRIBE production_records');
  const cols = rows.map(r => r.Field);
  console.log('Existing columns:', cols.join(', '));
  const needed = ['workstationName', 'workstationId', 'recordDate', 'scrapQty', 'temperatureLimit', 'humidityLimit', 'materialSpec', 'materialBatchNo', 'usedQty', 'usedUnit', 'cleanedBy', 'checkedBy', 'cleanResult', 'firstPieceResult', 'firstPieceInspector'];
  const missing = needed.filter(c => !cols.includes(c));
  console.log('Missing:', missing.join(', '));
  conn.end();
})().catch(e => console.error(e.message));
