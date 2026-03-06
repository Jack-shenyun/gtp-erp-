import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [dbRows] = await conn.query('SELECT DATABASE() as db');
  const dbName = dbRows[0].db;

  const [tables] = await conn.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE' ORDER BY table_name",
    [dbName]
  );

  const results = [];
  for (const row of tables) {
    const table = row.table_name;
    try {
      const [countRows] = await conn.query(`SELECT COUNT(*) as c FROM \`${table}\``);
      results.push({ table, count: Number(countRows[0].c || 0) });
    } catch {
      results.push({ table, count: -1 });
    }
  }

  const nonEmpty = results.filter(r => r.count > 0);
  const empty = results.filter(r => r.count === 0);
  const error = results.filter(r => r.count < 0);

  console.log(`DB: ${dbName}`);
  console.log(`TOTAL_TABLES ${results.length}`);
  console.log(`NON_EMPTY ${nonEmpty.length}`);
  console.log(`EMPTY ${empty.length}`);
  console.log(`ERROR ${error.length}`);
  console.log('');

  console.log('--- NON_EMPTY_TABLES ---');
  for (const r of nonEmpty) console.log(`${r.table}\t${r.count}`);
  console.log('');

  console.log('--- EMPTY_TABLES ---');
  for (const r of empty) console.log(r.table);

  if (error.length) {
    console.log('');
    console.log('--- ERROR_TABLES ---');
    for (const r of error) console.log(r.table);
  }

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
