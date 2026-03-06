ALTER TABLE `sales_orders` MODIFY COLUMN `status` enum('draft','pending_review','approved','in_production','ready_to_ship','shipped','completed','cancelled') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `paymentMethod` varchar(50);--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `shippingContact` varchar(50);--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `shippingPhone` varchar(50);--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `customsStatus` enum('not_required','pending','in_progress','completed') DEFAULT 'not_required';