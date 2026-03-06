CREATE TABLE `order_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`orderType` enum('sales','purchase','production') NOT NULL,
	`action` enum('submit','approve','reject') NOT NULL,
	`approver` varchar(100),
	`approverId` int,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_approvals_id` PRIMARY KEY(`id`)
);
