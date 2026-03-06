ALTER TABLE `customers` ADD `country` varchar(50);--> statement-breakpoint
ALTER TABLE `customers` ADD `bankName` varchar(100);--> statement-breakpoint
ALTER TABLE `customers` ADD `needInvoice` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `customers` ADD `salesPersonId` int;