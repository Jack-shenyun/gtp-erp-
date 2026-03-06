ALTER TABLE `bom` ADD `parentId` int;--> statement-breakpoint
ALTER TABLE `bom` ADD `level` int DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `bom` ADD `unitPrice` decimal(12,4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `bom` ADD `remark` varchar(500);--> statement-breakpoint
ALTER TABLE `bom` ADD `bomCode` varchar(50);--> statement-breakpoint
ALTER TABLE `bom` ADD `effectiveDate` date;--> statement-breakpoint
ALTER TABLE `production_orders` ADD `planId` int;--> statement-breakpoint
ALTER TABLE `production_orders` ADD `productionDate` date;--> statement-breakpoint
ALTER TABLE `production_orders` ADD `expiryDate` date;