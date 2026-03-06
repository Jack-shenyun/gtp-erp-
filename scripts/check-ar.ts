import { getDb } from '../server/db';
import { salesOrders, accountsReceivable } from '../drizzle/schema';
import { desc, sql } from 'drizzle-orm';

const run = async () => {
  const db = await getDb();
  if (!db) {
    console.log('NO_DB');
    return;
  }

  const so = await db
    .select({
      id: salesOrders.id,
      orderNo: salesOrders.orderNo,
      status: salesOrders.status,
      totalAmount: salesOrders.totalAmount,
      paymentMethod: salesOrders.paymentMethod,
      remark: salesOrders.remark,
      createdAt: salesOrders.createdAt,
    })
    .from(salesOrders)
    .orderBy(desc(salesOrders.id))
    .limit(8);

  const ar = await db
    .select({
      id: accountsReceivable.id,
      invoiceNo: accountsReceivable.invoiceNo,
      salesOrderId: accountsReceivable.salesOrderId,
      amount: accountsReceivable.amount,
      paymentMethod: accountsReceivable.paymentMethod,
      status: accountsReceivable.status,
      createdAt: accountsReceivable.createdAt,
    })
    .from(accountsReceivable)
    .orderBy(desc(accountsReceivable.id))
    .limit(20);

  const total = await db
    .select({ c: sql<number>`count(*)` })
    .from(accountsReceivable);

  console.log('SO_RECENT=', JSON.stringify(so, null, 2));
  console.log('AR_TOTAL=', total[0]?.c ?? 0);
  console.log('AR_RECENT=', JSON.stringify(ar, null, 2));
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
