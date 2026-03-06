import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL!;

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Get existing tables
  const [rows] = await conn.query("SHOW TABLES") as any;
  const existingTables = new Set(rows.map((r: any) => Object.values(r)[0]));
  console.log("Existing tables:", [...existingTables].sort().join(", "));

  // New tables to create (only if they don't exist)
  const createStatements: string[] = [
    `CREATE TABLE IF NOT EXISTS bank_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      accountName VARCHAR(100) NOT NULL,
      bankName VARCHAR(100) NOT NULL,
      accountNo VARCHAR(50) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
      accountType ENUM('basic','general','foreign','special') NOT NULL DEFAULT 'basic',
      balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      isDefault BOOLEAN NOT NULL DEFAULT false,
      status ENUM('active','frozen','closed') NOT NULL DEFAULT 'active',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS exchange_rates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fromCurrency VARCHAR(10) NOT NULL,
      toCurrency VARCHAR(10) NOT NULL DEFAULT 'CNY',
      rate DECIMAL(12,6) NOT NULL,
      effectiveDate DATE NOT NULL,
      source VARCHAR(50),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS payment_terms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type ENUM('cash','monthly','installment') NOT NULL DEFAULT 'cash',
      prepaymentRatio DECIMAL(5,2) DEFAULT 0,
      creditDays INT DEFAULT 0,
      description TEXT,
      isDefault BOOLEAN NOT NULL DEFAULT false,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS material_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requestNo VARCHAR(50) NOT NULL,
      requestType ENUM('purchase','production','quality','other') NOT NULL DEFAULT 'purchase',
      departmentId INT,
      requesterId INT,
      reason TEXT,
      priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
      status ENUM('draft','pending','approved','rejected','completed') NOT NULL DEFAULT 'draft',
      approvedBy INT,
      approvedAt TIMESTAMP NULL,
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS material_request_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requestId INT NOT NULL,
      productId INT NOT NULL,
      quantity DECIMAL(15,4) NOT NULL,
      unit VARCHAR(20),
      requiredDate DATE,
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS expense_reimbursements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      expenseNo VARCHAR(50) NOT NULL,
      applicantId INT,
      department VARCHAR(50),
      expenseType ENUM('travel','office','entertainment','logistics','other') NOT NULL DEFAULT 'other',
      amount DECIMAL(15,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
      amountBase DECIMAL(15,2),
      exchangeRate DECIMAL(12,6),
      description TEXT,
      status ENUM('draft','pending','approved','rejected','paid') NOT NULL DEFAULT 'draft',
      approvedBy INT,
      approvedAt TIMESTAMP NULL,
      paidAt TIMESTAMP NULL,
      bankAccountId INT,
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS payment_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recordNo VARCHAR(50) NOT NULL,
      type ENUM('receipt','payment') NOT NULL,
      relatedType ENUM('sales_order','purchase_order','expense','other') NOT NULL,
      relatedId INT,
      relatedNo VARCHAR(50),
      customerId INT,
      supplierId INT,
      amount DECIMAL(15,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
      amountBase DECIMAL(15,2),
      exchangeRate DECIMAL(12,6),
      bankAccountId INT NOT NULL,
      paymentDate TIMESTAMP NOT NULL,
      paymentMethod VARCHAR(50),
      operatorId INT,
      status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS customs_declarations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      declarationNo VARCHAR(50) NOT NULL,
      salesOrderId INT NOT NULL,
      customerId INT NOT NULL,
      productName VARCHAR(200),
      quantity DECIMAL(15,4),
      unit VARCHAR(20),
      currency VARCHAR(10),
      amount DECIMAL(15,2),
      destination VARCHAR(100),
      portOfLoading VARCHAR(100),
      portOfDischarge VARCHAR(100),
      shippingMethod ENUM('sea','air','land','express'),
      hsCode VARCHAR(20),
      declarationDate TIMESTAMP NULL,
      status ENUM('draft','submitted','inspecting','cleared','rejected') NOT NULL DEFAULT 'draft',
      createdBy INT,
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(20) NOT NULL,
      name VARCHAR(50) NOT NULL,
      parentId INT,
      managerId INT,
      description TEXT,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      sortOrder INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS code_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      prefix VARCHAR(20) NOT NULL,
      dateFormat VARCHAR(20),
      seqLength INT NOT NULL DEFAULT 4,
      currentSeq INT NOT NULL DEFAULT 0,
      description TEXT,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS personnel (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employeeNo VARCHAR(30) NOT NULL,
      name VARCHAR(50) NOT NULL,
      gender ENUM('male','female') DEFAULT 'male',
      birthDate DATE,
      idCard VARCHAR(20),
      phone VARCHAR(20),
      email VARCHAR(100),
      department VARCHAR(50),
      position VARCHAR(50),
      entryDate DATE,
      contractExpiry DATE,
      education VARCHAR(20),
      major VARCHAR(50),
      status ENUM('active','probation','leave','resigned') NOT NULL DEFAULT 'active',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS trainings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trainingNo VARCHAR(30) NOT NULL,
      title VARCHAR(100) NOT NULL,
      type ENUM('internal','external','online') NOT NULL DEFAULT 'internal',
      trainer VARCHAR(50),
      department VARCHAR(50),
      startDate DATE,
      endDate DATE,
      location VARCHAR(100),
      participants INT DEFAULT 0,
      content TEXT,
      status ENUM('planned','ongoing','completed','cancelled') NOT NULL DEFAULT 'planned',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      auditNo VARCHAR(30) NOT NULL,
      title VARCHAR(100) NOT NULL,
      type ENUM('internal','external','supplier','customer') NOT NULL DEFAULT 'internal',
      auditor VARCHAR(50),
      department VARCHAR(50),
      auditDate DATE,
      scope TEXT,
      findings TEXT,
      correctiveActions TEXT,
      status ENUM('planned','in_progress','completed','closed') NOT NULL DEFAULT 'planned',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS rd_projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectNo VARCHAR(30) NOT NULL,
      name VARCHAR(100) NOT NULL,
      type ENUM('new_product','improvement','research','other') NOT NULL DEFAULT 'new_product',
      leaderId INT,
      department VARCHAR(50),
      startDate DATE,
      endDate DATE,
      budget DECIMAL(15,2),
      progress INT DEFAULT 0,
      description TEXT,
      status ENUM('planning','active','testing','completed','suspended','cancelled') NOT NULL DEFAULT 'planning',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS stocktakes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      stocktakeNo VARCHAR(30) NOT NULL,
      warehouseId INT,
      warehouseName VARCHAR(50),
      type ENUM('full','partial','cycle') NOT NULL DEFAULT 'full',
      operatorId INT,
      operatorName VARCHAR(50),
      stocktakeDate DATE,
      totalItems INT DEFAULT 0,
      matchedItems INT DEFAULT 0,
      discrepancyItems INT DEFAULT 0,
      status ENUM('planned','in_progress','completed','approved') NOT NULL DEFAULT 'planned',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS quality_incidents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      incidentNo VARCHAR(30) NOT NULL,
      title VARCHAR(200) NOT NULL,
      type ENUM('complaint','deviation','nonconformity','recall') NOT NULL DEFAULT 'complaint',
      severity ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
      source VARCHAR(100),
      productId INT,
      batchNo VARCHAR(50),
      description TEXT,
      rootCause TEXT,
      correctiveAction TEXT,
      preventiveAction TEXT,
      responsiblePerson VARCHAR(50),
      reportedBy INT,
      reportedAt TIMESTAMP NULL,
      closedAt TIMESTAMP NULL,
      status ENUM('reported','investigating','resolved','closed') NOT NULL DEFAULT 'reported',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS samples (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sampleNo VARCHAR(30) NOT NULL,
      productId INT,
      productName VARCHAR(100),
      batchNo VARCHAR(50),
      sampleType ENUM('incoming','process','finished','stability','retention') NOT NULL DEFAULT 'incoming',
      quantity DECIMAL(15,4),
      unit VARCHAR(20),
      sampledBy VARCHAR(50),
      sampledAt TIMESTAMP NULL,
      storageLocation VARCHAR(100),
      expiryDate DATE,
      status ENUM('registered','testing','completed','disposed') NOT NULL DEFAULT 'registered',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS lab_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recordNo VARCHAR(30) NOT NULL,
      sampleId INT,
      testType VARCHAR(50),
      testMethod VARCHAR(100),
      testItems TEXT,
      results TEXT,
      conclusion VARCHAR(50),
      testerId INT,
      testerName VARCHAR(50),
      testDate DATE,
      equipmentUsed VARCHAR(200),
      status ENUM('pending','testing','passed','failed') NOT NULL DEFAULT 'pending',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS equipment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      equipmentNo VARCHAR(30) NOT NULL,
      name VARCHAR(100) NOT NULL,
      model VARCHAR(50),
      manufacturer VARCHAR(100),
      serialNo VARCHAR(50),
      department VARCHAR(50),
      location VARCHAR(100),
      purchaseDate DATE,
      warrantyExpiry DATE,
      lastMaintenanceDate DATE,
      nextMaintenanceDate DATE,
      calibrationDate DATE,
      nextCalibrationDate DATE,
      status ENUM('active','maintenance','idle','scrapped') NOT NULL DEFAULT 'active',
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
  ];

  // Alter existing tables to add new columns
  const alterStatements: string[] = [
    // salesOrders
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS paymentTermId INT",
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS paymentTermType VARCHAR(20)",
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS prepaymentRatio DECIMAL(5,2)",
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS amountBase DECIMAL(15,2)",
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS exchangeRate DECIMAL(12,6)",
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS paidAmount DECIMAL(15,2) DEFAULT 0",
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS paidAmountBase DECIMAL(15,2) DEFAULT 0",
    // purchaseOrders
    "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS amountBase DECIMAL(15,2)",
    "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS exchangeRate DECIMAL(12,6)",
    // purchaseOrderItems
    "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS productId INT",
    // accountsReceivable
    "ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS amountBase DECIMAL(15,2)",
    "ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS exchangeRate DECIMAL(12,6)",
    "ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS bankAccountId INT",
    // accountsPayable
    "ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS amountBase DECIMAL(15,2)",
    "ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS exchangeRate DECIMAL(12,6)",
    "ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS bankAccountId INT",
  ];

  // Execute CREATE TABLE statements
  for (const sql of createStatements) {
    try {
      await conn.query(sql);
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      console.log(`✓ Created table: ${tableName}`);
    } catch (e: any) {
      console.log(`⚠ ${e.message}`);
    }
  }

  // Execute ALTER TABLE statements
  for (const sql of alterStatements) {
    try {
      await conn.query(sql);
      console.log(`✓ ${sql.substring(0, 60)}...`);
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log(`· Column already exists, skipping: ${sql.substring(0, 60)}...`);
      } else {
        console.log(`⚠ ${e.message}`);
      }
    }
  }

  await conn.end();
  console.log("\n✅ Schema push complete!");
}

main().catch(console.error);
