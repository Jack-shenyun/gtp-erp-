import "dotenv/config";
import mysql from "mysql2/promise";

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function getFirstId(conn, table) {
  const [rows] = await conn.query(`SELECT id FROM \`${table}\` ORDER BY id ASC LIMIT 1`);
  return rows[0]?.id ?? null;
}

async function getCount(conn, table) {
  const [rows] = await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
  return Number(rows[0]?.c ?? 0);
}

async function insertIfEmpty(conn, table, sql, params = []) {
  const count = await getCount(conn, table);
  if (count > 0) {
    console.log(`SKIP ${table}: already has ${count} rows`);
    return false;
  }
  await conn.execute(sql, params);
  console.log(`SEED ${table}: inserted demo rows`);
  return true;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const userId = (await getFirstId(conn, "users")) ?? 1;
  const customerId = (await getFirstId(conn, "customers")) ?? 1;
  const productId = (await getFirstId(conn, "products")) ?? 1;
  const departmentId = (await getFirstId(conn, "departments")) ?? 1;
  const salesOrderId = (await getFirstId(conn, "sales_orders")) ?? 1;
  const inventoryId = (await getFirstId(conn, "inventory")) ?? null;
  const equipmentId = (await getFirstId(conn, "equipment")) ?? null;
  const d = today();

  await insertIfEmpty(
    conn,
    "suppliers",
    `INSERT INTO suppliers
      (code, name, shortName, type, contactPerson, phone, email, address, paymentTerms, status, createdBy)
     VALUES
      ('SUP-0001','苏州华盛医疗耗材有限公司','华盛医疗','material','赵经理','13800010001','supplier1@example.com','苏州工业园区','月结30天','qualified', ?),
      ('SUP-0002','上海精工设备有限公司','精工设备','equipment','钱工','13800010002','supplier2@example.com','上海浦东新区','月结45天','qualified', ?)`,
    [userId, userId]
  );

  await insertIfEmpty(
    conn,
    "warehouses",
    `INSERT INTO warehouses
      (code, name, type, address, manager, phone, status)
     VALUES
      ('WH-RM-01','原料仓','raw_material','1号厂房一层','仓管A','13900020001','active'),
      ('WH-FG-01','成品仓','finished','2号厂房二层','仓管B','13900020002','active')`
  );

  await insertIfEmpty(
    conn,
    "bank_accounts",
    `INSERT INTO bank_accounts
      (accountName, bankName, accountNo, currency, accountType, isDefault, balance, status, remark)
     VALUES
      ('微信','15150457575','15150457575','CNY','basic',0,0.00,'active','[ZH-007] 地址:-'),
      ('支付宝','浙江网商银行','13812600639','CNY','basic',0,0.00,'active','[ZH-006] 地址:浙江杭州'),
      ('国际站','CITIBANK N.A. SINGAPORE BRANCH','10695166385','USD','basic',0,0.00,'active','[ZH-005] 地址:51 Bras Basah Road 01-21 Singapore, 189554'),
      ('农业银行','中国农业银行股份有限公司苏州临湖支行','10540801040026476','CNY','basic',0,0.00,'active','[ZH-004] 地址:苏州市吴中区临湖镇银藏路666号11幢'),
      ('XT银行','JPMorgan Chase Bank N.A., Hong Kong Branch','63003695928','USD','basic',0,0.00,'active','[ZH-003] 地址:18/F, 20/F, 22-29/F, CHATER HOUSE, 8 CONNAUGHT ROAD CENTRAL, HONG KONG'),
      ('建设银行（美元）','China Construction Bank Corporation Suzhou Branch Wuzhong Subbranch','32250199753600004047','USD','basic',0,0.00,'active','[ZH-002] 地址:Building 11, No. 666 Yinzang Road, Linhu Town, Wuzhong District, Suzhou, P.R. China'),
      ('建设银行（人民币）','中国建设银行股份有限公司苏州滨湖支行','32250110073000001909','CNY','basic',0,0.00,'active','[ZH-001] 地址:苏州市吴中区临湖镇银藏路666号11幢')`
  );

  await insertIfEmpty(
    conn,
    "exchange_rates",
    `INSERT INTO exchange_rates
      (fromCurrency, toCurrency, rate, effectiveDate, source, createdBy)
     VALUES
      ('USD','CNY',7.180000,?, 'manual', ?),
      ('EUR','CNY',7.850000,?, 'manual', ?)`,
    [d, userId, d, userId]
  );

  await insertIfEmpty(
    conn,
    "payment_terms",
    `INSERT INTO payment_terms
      (name, type, depositPercent, creditDays, description, isActive)
     VALUES
      ('现款现结','cash',NULL,0,'付款后发货',1),
      ('月结30天','monthly',NULL,30,'月结30天',1),
      ('30%定金+发货前尾款','deposit',30.00,0,'先付定金后排产',1)`
  );

  await insertIfEmpty(
    conn,
    "code_rules",
    `INSERT INTO code_rules
      (module, prefix, dateFormat, seqLength, currentSeq, example, description)
     VALUES
      ('purchaseOrder','PO','YYYY',4,0,'PO-2026-0001','采购订单编码'),
      ('productionOrder','MO','YYYY',4,0,'MO-2026-0001','生产订单编码'),
      ('materialRequest','MR','YYYY',4,0,'MR-2026-0001','物料申请编码')`
  );

  await insertIfEmpty(
    conn,
    "personnel",
    `INSERT INTO personnel
      (employeeNo, name, gender, phone, email, departmentId, position, entryDate, status, userId, remark)
     VALUES
      ('EMP-0001','测试员工A','male','13700030001','emp1@example.com', ?, '工程师', ?, 'active', ?, '初始化数据'),
      ('EMP-0002','测试员工B','female','13700030002','emp2@example.com', ?, '质检员', ?, 'active', NULL, '初始化数据')`,
    [departmentId, d, userId, departmentId, d]
  );

  const supplierId = (await getFirstId(conn, "suppliers")) ?? 1;
  const warehouseId = (await getFirstId(conn, "warehouses")) ?? 1;
  const bankAccountId = (await getFirstId(conn, "bank_accounts")) ?? 1;

  await insertIfEmpty(
    conn,
    "material_requests",
    `INSERT INTO material_requests
      (requestNo, department, requesterId, requestDate, urgency, reason, totalAmount, status, remark)
     VALUES
      ('MR-2026-0001','生产部', ?, ?, 'normal', '常规补货', 12000.00, 'approved', '初始化申请单')`,
    [userId, d]
  );

  const materialRequestId = (await getFirstId(conn, "material_requests")) ?? null;

  await insertIfEmpty(
    conn,
    "material_request_items",
    `INSERT INTO material_request_items
      (requestId, productId, materialName, specification, quantity, unit, estimatedPrice, remark)
     VALUES
      (?, ?, '医用级硅胶原料', 'Shore A 50°', 100.0000, 'kg', 120.0000, '初始化物料明细')`,
    [materialRequestId, productId]
  );

  await insertIfEmpty(
    conn,
    "purchase_orders",
    `INSERT INTO purchase_orders
      (orderNo, supplierId, orderDate, expectedDate, totalAmount, currency, totalAmountBase, exchangeRate, materialRequestId, status, paymentStatus, remark, buyerId, createdBy)
     VALUES
      ('PO-2026-0001', ?, ?, ?, 12000.00, 'CNY', 12000.00, 1.000000, ?, 'ordered', 'unpaid', '初始化采购单', ?, ?)`,
    [supplierId, d, d, materialRequestId, userId, userId]
  );

  const purchaseOrderId = (await getFirstId(conn, "purchase_orders")) ?? null;

  await insertIfEmpty(
    conn,
    "purchase_order_items",
    `INSERT INTO purchase_order_items
      (orderId, productId, materialCode, materialName, specification, quantity, unit, unitPrice, amount, remark)
     VALUES
      (?, ?, 'YCL-0001', '医用级硅胶原料', 'Shore A 50°', 100.0000, 'kg', 120.0000, 12000.00, '初始化采购明细')`,
    [purchaseOrderId, productId]
  );

  await insertIfEmpty(
    conn,
    "bom",
    `INSERT INTO bom
      (productId, materialCode, materialName, specification, quantity, unit, version, status)
     VALUES
      (?, 'YCL-0001', '医用级硅胶原料', 'Shore A 50°', 1.2000, 'kg', 'v1.0', 'active')`,
    [productId]
  );

  await insertIfEmpty(
    conn,
    "production_orders",
    `INSERT INTO production_orders
      (orderNo, productId, plannedQty, completedQty, unit, batchNo, plannedStartDate, plannedEndDate, status, salesOrderId, remark, createdBy)
     VALUES
      ('MO-2026-0001', ?, 200.0000, 20.0000, 'pcs', 'BATCH-260301', ?, ?, 'in_progress', ?, '初始化生产单', ?)`,
    [productId, d, d, salesOrderId, userId]
  );

  await insertIfEmpty(
    conn,
    "inventory_transactions",
    `INSERT INTO inventory_transactions
      (inventoryId, warehouseId, type, documentNo, itemName, batchNo, quantity, unit, beforeQty, afterQty, relatedOrderId, remark, operatorId)
     VALUES
      (?, ?, 'purchase_in', 'PO-2026-0001', '医用级硅胶原料', 'BATCH-260301', 100.0000, 'kg', 20.0000, 120.0000, ?, '初始化入库流水', ?)`,
    [inventoryId, warehouseId, purchaseOrderId, userId]
  );

  await insertIfEmpty(
    conn,
    "quality_inspections",
    `INSERT INTO quality_inspections
      (inspectionNo, type, relatedDocNo, itemName, batchNo, sampleQty, inspectedQty, qualifiedQty, unqualifiedQty, result, inspectorId, inspectionDate, remark)
     VALUES
      ('IQC-2026-0001', 'IQC', 'PO-2026-0001', '医用级硅胶原料', 'BATCH-260301', 10.0000, 10.0000, 10.0000, 0.0000, 'qualified', ?, ?, '初始化来料检验')`,
    [userId, d]
  );

  await insertIfEmpty(
    conn,
    "expense_reimbursements",
    `INSERT INTO expense_reimbursements
      (reimbursementNo, applicantId, department, applyDate, totalAmount, currency, category, description, status, bankAccountId, remark)
     VALUES
      ('ER-2026-0001', ?, '管理部', ?, 860.00, 'CNY', 'office', '办公用品报销', 'approved', ?, '初始化报销单')`,
    [userId, d, bankAccountId]
  );

  await insertIfEmpty(
    conn,
    "payment_records",
    `INSERT INTO payment_records
      (recordNo, type, relatedType, relatedId, relatedNo, customerId, supplierId, amount, currency, amountBase, exchangeRate, bankAccountId, paymentDate, paymentMethod, remark, operatorId)
     VALUES
      ('PR-2026-0001', 'receipt', 'sales_order', ?, 'SO-INIT', ?, NULL, 5000.00, 'CNY', 5000.00, 1.000000, ?, ?, 'bank_transfer', '初始化收款记录', ?),
      ('PR-2026-0002', 'payment', 'purchase_order', ?, 'PO-2026-0001', NULL, ?, 3000.00, 'CNY', 3000.00, 1.000000, ?, ?, 'bank_transfer', '初始化付款记录', ?)`,
    [salesOrderId, customerId, bankAccountId, d, userId, purchaseOrderId, supplierId, bankAccountId, d, userId]
  );

  await insertIfEmpty(
    conn,
    "dealer_qualifications",
    `INSERT INTO dealer_qualifications
      (customerId, businessLicense, operatingLicense, licenseExpiry, authorizationNo, authorizationExpiry, contractNo, contractExpiry, territory, status, approvedBy, approvedAt)
     VALUES
      (?, 'BL-2026-0001', 'OL-2026-0001', ?, 'AUTH-2026-0001', ?, 'CT-2026-0001', ?, '江苏省', 'approved', ?, NOW())`,
    [customerId, d, d, d, userId]
  );

  await insertIfEmpty(
    conn,
    "trainings",
    `INSERT INTO trainings
      (title, type, trainerId, departmentId, startDate, endDate, location, participants, content, status, remark, createdBy)
     VALUES
      ('GMP规范培训', 'compliance', ?, ?, ?, ?, '会议室A', 12, '质量体系与GMP基础', 'completed', '初始化培训记录', ?)`,
    [userId, departmentId, d, d, userId]
  );

  await insertIfEmpty(
    conn,
    "rd_projects",
    `INSERT INTO rd_projects
      (projectNo, name, type, productId, leaderId, startDate, endDate, budget, progress, status, description, remark, createdBy)
     VALUES
      ('RD-2026-0001', '新型导管改进项目', 'improvement', ?, ?, ?, ?, 300000.00, 35, 'in_progress', '用于演示研发项目流程', '初始化项目', ?)`,
    [productId, userId, d, d, userId]
  );

  await insertIfEmpty(
    conn,
    "stocktakes",
    `INSERT INTO stocktakes
      (stocktakeNo, warehouseId, type, stocktakeDate, operatorId, systemQty, actualQty, diffQty, status, remark, createdBy)
     VALUES
      ('ST-2026-0001', ?, 'spot', ?, ?, 120.0000, 118.0000, -2.0000, 'completed', '初始化盘点记录', ?)`,
    [warehouseId, d, userId, userId]
  );

  await insertIfEmpty(
    conn,
    "quality_incidents",
    `INSERT INTO quality_incidents
      (incidentNo, title, type, severity, productId, batchNo, description, rootCause, correctiveAction, preventiveAction, reporterId, assigneeId, reportDate, status, remark)
     VALUES
      ('QI-2026-0001', '批次外观不一致', 'nonconformance', 'medium', ?, 'BATCH-260301', '抽检发现轻微色差', '原料批次差异', '调整配比并复检', '加强来料检验', ?, ?, ?, 'investigating', '初始化质量事件')`,
    [productId, userId, userId, d]
  );

  await insertIfEmpty(
    conn,
    "samples",
    `INSERT INTO samples
      (sampleNo, productId, batchNo, sampleType, quantity, unit, storageLocation, storageCondition, samplingDate, expiryDate, samplerId, status, remark)
     VALUES
      ('SP-2026-0001', ?, 'BATCH-260301', 'finished', 5.0000, 'pcs', '样品柜A-01', '常温避光', ?, ?, ?, 'stored', '初始化样品')`,
    [productId, d, d, userId]
  );

  const sampleId = (await getFirstId(conn, "samples")) ?? null;

  await insertIfEmpty(
    conn,
    "lab_records",
    `INSERT INTO lab_records
      (recordNo, sampleId, testType, testMethod, specification, result, conclusion, equipmentId, testerId, testDate, reviewerId, reviewDate, status, remark)
     VALUES
      ('LAB-2026-0001', ?, '拉伸强度', 'YY/T 0681', '>= 12N', '12.8N', 'pass', ?, ?, ?, ?, ?, 'reviewed', '初始化实验室记录')`,
    [sampleId, equipmentId, userId, d, userId, d]
  );

  await insertIfEmpty(
    conn,
    "electronic_signatures",
    `INSERT INTO electronic_signatures
      (documentType, documentId, documentNo, signatureType, signatureAction, signerId, signerName, signerTitle, signerDepartment, signatureMethod, verificationHash, signedAt, signatureMeaning, status, ipAddress, userAgent)
     VALUES
      ('IQC', 1, 'IQC-2026-0001', 'inspector', '检验签名', ?, '系统管理员', '管理员', '管理部', 'password', 'demo-hash-001', NOW(), '确认检验结果真实有效', 'valid', '127.0.0.1', 'seed-script')`,
    [userId]
  );

  const signatureId = (await getFirstId(conn, "electronic_signatures")) ?? null;

  await insertIfEmpty(
    conn,
    "signature_audit_log",
    `INSERT INTO signature_audit_log
      (signatureId, documentType, documentId, documentNo, action, userId, userName, userRole, details, ipAddress, userAgent)
     VALUES
      (?, 'IQC', 1, 'IQC-2026-0001', 'signature_completed', ?, '系统管理员', 'admin', '初始化签名审计日志', '127.0.0.1', 'seed-script')`,
    [signatureId, userId]
  );

  await insertIfEmpty(
    conn,
    "operation_logs",
    `INSERT INTO operation_logs
      (module, action, targetType, targetId, targetName, description, previousData, newData, changedFields, operatorId, operatorName, operatorRole, operatorDepartment, ipAddress, userAgent, deviceType, browser, result)
     VALUES
      ('system', 'create', '初始化', 'seed-001', '批量初始化', '执行空表初始化脚本', NULL, '{"script":"seed-empty-tables"}', '["all"]', ?, '系统管理员', 'admin', '管理部', '127.0.0.1', 'seed-script', 'PC', 'Chrome', 'success')`,
    [userId]
  );

  console.log("Done.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
