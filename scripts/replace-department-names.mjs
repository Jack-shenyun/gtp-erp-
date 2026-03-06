import mysql from "mysql2/promise";

const mappings = [
  { from: "质量管理部", to: "质量部" },
  { from: "仓库管理部", to: "仓库管理" },
  { from: "财务管理", to: "财务部" },
];

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return url;
}

function quoteIdent(name) {
  return `\`${String(name).replace(/`/g, "``")}\``;
}

async function main() {
  const connection = await mysql.createConnection(getDatabaseUrl());
  try {
    const [[dbRow]] = await connection.query("SELECT DATABASE() AS dbName");
    const dbName = dbRow?.dbName;
    if (!dbName) {
      throw new Error("Cannot resolve current database name");
    }

    const [cols] = await connection.query(
      `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
         AND DATA_TYPE IN ('char','varchar','tinytext','text','mediumtext','longtext')`,
      [dbName],
    );

    const summary = [];
    let totalUpdatedRows = 0;

    for (const col of cols) {
      const tableName = col.TABLE_NAME;
      const columnName = col.COLUMN_NAME;
      const tableSql = quoteIdent(tableName);
      const colSql = quoteIdent(columnName);

      let updatedForColumn = 0;
      for (const { from, to } of mappings) {
        const [result] = await connection.query(
          `UPDATE ${tableSql}
           SET ${colSql} = REPLACE(${colSql}, ?, ?)
           WHERE ${colSql} LIKE ?`,
          [from, to, `%${from}%`],
        );
        const changed = Number(result?.affectedRows || 0);
        if (changed > 0) {
          updatedForColumn += changed;
          totalUpdatedRows += changed;
        }
      }

      if (updatedForColumn > 0) {
        summary.push({ tableName, columnName, updatedForColumn });
      }
    }

    console.log(`DATABASE ${dbName}`);
    console.log(`UPDATED_COLUMNS ${summary.length}`);
    console.log(`UPDATED_ROWS ${totalUpdatedRows}`);

    for (const item of summary) {
      console.log(`${item.tableName}.${item.columnName} => ${item.updatedForColumn}`);
    }

    for (const { from } of mappings) {
      const likePattern = `%${from}%`;
      let remaining = 0;

      for (const col of cols) {
        const tableSql = quoteIdent(col.TABLE_NAME);
        const colSql = quoteIdent(col.COLUMN_NAME);
        const [[countRow]] = await connection.query(
          `SELECT COUNT(*) AS c FROM ${tableSql} WHERE ${colSql} LIKE ?`,
          [likePattern],
        );
        remaining += Number(countRow?.c || 0);
      }

      console.log(`REMAINING_${from} ${remaining}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("replace-department-names failed:", err.message);
  process.exitCode = 1;
});
