CREATE TABLE `accounts_payable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNo` varchar(50) NOT NULL,
	`supplierId` int NOT NULL,
	`purchaseOrderId` int,
	`amount` decimal(14,2) NOT NULL,
	`paidAmount` decimal(14,2) DEFAULT '0',
	`currency` varchar(10) DEFAULT 'CNY',
	`invoiceDate` date,
	`dueDate` date,
	`status` enum('pending','partial','paid','overdue') NOT NULL DEFAULT 'pending',
	`remark` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_payable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts_receivable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNo` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`salesOrderId` int,
	`amount` decimal(14,2) NOT NULL,
	`paidAmount` decimal(14,2) DEFAULT '0',
	`currency` varchar(10) DEFAULT 'CNY',
	`invoiceDate` date,
	`dueDate` date,
	`status` enum('pending','partial','paid','overdue') NOT NULL DEFAULT 'pending',
	`remark` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_receivable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bom` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`materialCode` varchar(50) NOT NULL,
	`materialName` varchar(200) NOT NULL,
	`specification` varchar(200),
	`quantity` decimal(10,4) NOT NULL,
	`unit` varchar(20),
	`version` varchar(20),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bom_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`shortName` varchar(100),
	`type` enum('hospital','dealer','domestic','overseas') NOT NULL,
	`contactPerson` varchar(50),
	`phone` varchar(50),
	`email` varchar(100),
	`address` text,
	`province` varchar(50),
	`city` varchar(50),
	`paymentTerms` varchar(100),
	`currency` varchar(10) DEFAULT 'CNY',
	`creditLimit` decimal(12,2),
	`taxNo` varchar(50),
	`bankAccount` varchar(100),
	`status` enum('active','inactive','blacklist') NOT NULL DEFAULT 'active',
	`source` varchar(50),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `dealer_qualifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`businessLicense` varchar(100),
	`operatingLicense` varchar(100),
	`licenseExpiry` date,
	`authorizationNo` varchar(100),
	`authorizationExpiry` date,
	`contractNo` varchar(100),
	`contractExpiry` date,
	`territory` text,
	`status` enum('pending','approved','expired','terminated') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealer_qualifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`docNo` varchar(50) NOT NULL,
	`title` varchar(200) NOT NULL,
	`category` enum('policy','sop','record','certificate','external','contract') NOT NULL,
	`version` varchar(20),
	`department` varchar(50),
	`effectiveDate` date,
	`expiryDate` date,
	`filePath` text,
	`status` enum('draft','reviewing','approved','obsolete') NOT NULL DEFAULT 'draft',
	`description` text,
	`createdBy` int,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `documents_docNo_unique` UNIQUE(`docNo`)
);
--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`model` varchar(100),
	`manufacturer` varchar(200),
	`serialNo` varchar(100),
	`purchaseDate` date,
	`installDate` date,
	`location` varchar(100),
	`department` varchar(50),
	`status` enum('normal','maintenance','repair','scrapped') NOT NULL DEFAULT 'normal',
	`nextMaintenanceDate` date,
	`remark` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int,
	`materialCode` varchar(50),
	`itemName` varchar(200) NOT NULL,
	`batchNo` varchar(50),
	`lotNo` varchar(50),
	`quantity` decimal(12,4) NOT NULL,
	`unit` varchar(20),
	`location` varchar(50),
	`status` enum('qualified','quarantine','unqualified','reserved') NOT NULL DEFAULT 'quarantine',
	`productionDate` date,
	`expiryDate` date,
	`udiPi` varchar(100),
	`safetyStock` decimal(12,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryId` int,
	`warehouseId` int NOT NULL,
	`type` enum('purchase_in','production_in','return_in','other_in','production_out','sales_out','return_out','other_out','transfer','adjust') NOT NULL,
	`documentNo` varchar(50),
	`itemName` varchar(200) NOT NULL,
	`batchNo` varchar(50),
	`quantity` decimal(12,4) NOT NULL,
	`unit` varchar(20),
	`beforeQty` decimal(12,4),
	`afterQty` decimal(12,4),
	`relatedOrderId` int,
	`remark` text,
	`operatorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNo` varchar(50) NOT NULL,
	`productId` int NOT NULL,
	`plannedQty` decimal(12,4) NOT NULL,
	`completedQty` decimal(12,4) DEFAULT '0',
	`unit` varchar(20),
	`batchNo` varchar(50),
	`plannedStartDate` date,
	`plannedEndDate` date,
	`actualStartDate` date,
	`actualEndDate` date,
	`status` enum('draft','planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
	`salesOrderId` int,
	`remark` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `production_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `production_orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`specification` varchar(200),
	`category` varchar(100),
	`unit` varchar(20),
	`registrationNo` varchar(100),
	`udiDi` varchar(100),
	`manufacturer` varchar(200),
	`storageCondition` varchar(200),
	`shelfLife` int,
	`riskLevel` enum('I','II','III'),
	`status` enum('draft','active','discontinued') NOT NULL DEFAULT 'draft',
	`description` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`materialCode` varchar(50) NOT NULL,
	`materialName` varchar(200) NOT NULL,
	`specification` varchar(200),
	`quantity` decimal(12,4) NOT NULL,
	`unit` varchar(20),
	`unitPrice` decimal(12,4),
	`amount` decimal(14,2),
	`receivedQty` decimal(12,4) DEFAULT '0',
	`remark` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchase_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNo` varchar(50) NOT NULL,
	`supplierId` int NOT NULL,
	`orderDate` date NOT NULL,
	`expectedDate` date,
	`totalAmount` decimal(14,2),
	`currency` varchar(10) DEFAULT 'CNY',
	`status` enum('draft','approved','ordered','partial_received','received','cancelled') NOT NULL DEFAULT 'draft',
	`paymentStatus` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
	`remark` text,
	`buyerId` int,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `quality_inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inspectionNo` varchar(50) NOT NULL,
	`type` enum('IQC','IPQC','OQC') NOT NULL,
	`relatedDocNo` varchar(50),
	`itemName` varchar(200) NOT NULL,
	`batchNo` varchar(50),
	`sampleQty` decimal(12,4),
	`inspectedQty` decimal(12,4),
	`qualifiedQty` decimal(12,4),
	`unqualifiedQty` decimal(12,4),
	`result` enum('qualified','unqualified','conditional'),
	`inspectorId` int,
	`inspectionDate` date,
	`remark` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quality_inspections_id` PRIMARY KEY(`id`),
	CONSTRAINT `quality_inspections_inspectionNo_unique` UNIQUE(`inspectionNo`)
);
--> statement-breakpoint
CREATE TABLE `sales_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(12,4) NOT NULL,
	`unit` varchar(20),
	`unitPrice` decimal(12,4),
	`amount` decimal(14,2),
	`deliveredQty` decimal(12,4) DEFAULT '0',
	`remark` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNo` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`orderDate` date NOT NULL,
	`deliveryDate` date,
	`totalAmount` decimal(14,2),
	`currency` varchar(10) DEFAULT 'CNY',
	`status` enum('draft','confirmed','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'draft',
	`paymentStatus` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
	`shippingAddress` text,
	`isExport` boolean DEFAULT false,
	`remark` text,
	`salesPersonId` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`shortName` varchar(100),
	`type` enum('material','equipment','service') NOT NULL,
	`contactPerson` varchar(50),
	`phone` varchar(50),
	`email` varchar(100),
	`address` text,
	`businessLicense` varchar(100),
	`qualificationLevel` enum('A','B','C','pending') DEFAULT 'pending',
	`paymentTerms` varchar(100),
	`bankAccount` varchar(100),
	`taxNo` varchar(50),
	`evaluationScore` decimal(5,2),
	`status` enum('qualified','pending','disqualified') NOT NULL DEFAULT 'pending',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('raw_material','semi_finished','finished','quarantine') NOT NULL,
	`address` text,
	`manager` varchar(50),
	`phone` varchar(50),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouses_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `position` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);