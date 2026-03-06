ALTER TABLE `products` ADD `sourceType` enum('production','purchase') DEFAULT 'production';--> statement-breakpoint
ALTER TABLE `products` ADD `needCustoms` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `products` ADD `priceByPayment` json;