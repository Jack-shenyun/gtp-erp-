import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const customers = [
  {
    code: "KH-00003",
    name: "Medline Industries, Inc.",
    shortName: "Medline",
    type: "overseas" as const,
    contactPerson: "James Carter",
    phone: "+1-847-949-5500",
    email: "james.carter@medline.com",
    country: "美国",
    address: "Three Lakes Drive, Northfield, IL 60093, USA",
    paymentTerms: "月结60天",
    currency: "USD",
    creditLimit: "500000",
    needInvoice: false,
    status: "active" as const,
    source: "展会",
    createdBy: 1,
  },
  {
    code: "KH-00004",
    name: "苏州康华医疗器械经销有限公司",
    shortName: "康华医疗",
    type: "dealer" as const,
    contactPerson: "王建国",
    phone: "13912345678",
    email: "wangjg@kanghua-med.com",
    province: "江苏省",
    city: "苏州市",
    address: "苏州工业园区星湖街328号生物纳米园B2栋501室",
    paymentTerms: "月结30天",
    currency: "CNY",
    creditLimit: "200000",
    taxNo: "91320594MA1XXXXX01",
    bankName: "中国工商银行苏州分行",
    bankAccount: "1234567890123456789",
    needInvoice: true,
    status: "active" as const,
    source: "渠道推荐",
    createdBy: 1,
  },
];

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  for (const customer of customers) {
    const cols = Object.keys(customer).join(", ");
    const vals = Object.values(customer).map(v => {
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "boolean") return v ? "1" : "0";
      return `'${String(v).replace(/'/g, "''")}'`;
    }).join(", ");
    await connection.execute(
      `INSERT INTO customers (${cols}) VALUES (${vals})`
    );
    console.log(`✅ 已创建客户：${customer.name}`);
  }

  await connection.end();
  console.log("完成！");
}

main().catch(console.error);
