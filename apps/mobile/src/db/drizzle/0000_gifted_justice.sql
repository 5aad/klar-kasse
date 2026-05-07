CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`color` text,
	`is_default` integer DEFAULT false NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`sync_action` text DEFAULT 'create' NOT NULL,
	`remote_id` text,
	`sync_version` integer DEFAULT 0 NOT NULL,
	`last_synced_at` text,
	`sync_error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `categories_sync_status_idx` ON `categories` (`sync_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_remote_id_idx` ON `categories` (`remote_id`);--> statement-breakpoint
CREATE TABLE `category_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`monthly_budget_id` text NOT NULL,
	`category_id` text NOT NULL,
	`limit_amount` real DEFAULT 0 NOT NULL,
	`spent_amount` real DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`sync_action` text DEFAULT 'create' NOT NULL,
	`remote_id` text,
	`sync_version` integer DEFAULT 0 NOT NULL,
	`last_synced_at` text,
	`sync_error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`monthly_budget_id`) REFERENCES `monthly_budgets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `category_budgets_monthly_budget_id_idx` ON `category_budgets` (`monthly_budget_id`);--> statement-breakpoint
CREATE INDEX `category_budgets_category_id_idx` ON `category_budgets` (`category_id`);--> statement-breakpoint
CREATE INDEX `category_budgets_sync_status_idx` ON `category_budgets` (`sync_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_budgets_remote_id_idx` ON `category_budgets` (`remote_id`);--> statement-breakpoint
CREATE TABLE `device_info` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`installation_id` text NOT NULL,
	`platform` text,
	`app_version` text,
	`last_sync_cursor` text,
	`last_synced_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `monthly_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`month_key` text NOT NULL,
	`limit_amount` real DEFAULT 0 NOT NULL,
	`spent_amount` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`sync_action` text DEFAULT 'create' NOT NULL,
	`remote_id` text,
	`sync_version` integer DEFAULT 0 NOT NULL,
	`last_synced_at` text,
	`sync_error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_budgets_month_key_idx` ON `monthly_budgets` (`month_key`);--> statement-breakpoint
CREATE INDEX `monthly_budgets_sync_status_idx` ON `monthly_budgets` (`sync_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_budgets_remote_id_idx` ON `monthly_budgets` (`remote_id`);--> statement-breakpoint
CREATE TABLE `receipt_items` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_id` text NOT NULL,
	`category_id` text,
	`line_index` integer NOT NULL,
	`name` text NOT NULL,
	`quantity` real,
	`unit_price` real,
	`weight_kg` real,
	`price` real DEFAULT 0 NOT NULL,
	`vat_code` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`sync_action` text DEFAULT 'create' NOT NULL,
	`remote_id` text,
	`sync_version` integer DEFAULT 0 NOT NULL,
	`last_synced_at` text,
	`sync_error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`receipt_id`) REFERENCES `receipts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `receipt_items_receipt_id_idx` ON `receipt_items` (`receipt_id`);--> statement-breakpoint
CREATE INDEX `receipt_items_category_id_idx` ON `receipt_items` (`category_id`);--> statement-breakpoint
CREATE INDEX `receipt_items_sync_status_idx` ON `receipt_items` (`sync_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `receipt_items_remote_id_idx` ON `receipt_items` (`remote_id`);--> statement-breakpoint
CREATE TABLE `receipt_vat` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_id` text NOT NULL,
	`line_index` integer NOT NULL,
	`rate` real DEFAULT 0 NOT NULL,
	`net` real DEFAULT 0 NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`sync_action` text DEFAULT 'create' NOT NULL,
	`remote_id` text,
	`sync_version` integer DEFAULT 0 NOT NULL,
	`last_synced_at` text,
	`sync_error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`receipt_id`) REFERENCES `receipts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `receipt_vat_receipt_id_idx` ON `receipt_vat` (`receipt_id`);--> statement-breakpoint
CREATE INDEX `receipt_vat_sync_status_idx` ON `receipt_vat` (`sync_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `receipt_vat_remote_id_idx` ON `receipt_vat` (`remote_id`);--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`store` text NOT NULL,
	`category_id` text,
	`category_name` text,
	`address_json` text,
	`date_text` text,
	`time_text` text,
	`total` real DEFAULT 0 NOT NULL,
	`payment_method` text,
	`card_last4` text,
	`item_count` integer DEFAULT 0 NOT NULL,
	`raw_text` text,
	`image_uri` text,
	`note` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`sync_action` text DEFAULT 'create' NOT NULL,
	`remote_id` text,
	`sync_version` integer DEFAULT 0 NOT NULL,
	`last_synced_at` text,
	`sync_error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `receipts_category_id_idx` ON `receipts` (`category_id`);--> statement-breakpoint
CREATE INDEX `receipts_date_text_idx` ON `receipts` (`date_text`);--> statement-breakpoint
CREATE INDEX `receipts_sync_status_idx` ON `receipts` (`sync_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `receipts_remote_id_idx` ON `receipts` (`remote_id`);--> statement-breakpoint
CREATE TABLE `sync_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`operation` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` text,
	`locked_at` text,
	`last_error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sync_outbox_status_idx` ON `sync_outbox` (`status`,`next_attempt_at`);--> statement-breakpoint
CREATE INDEX `sync_outbox_entity_idx` ON `sync_outbox` (`entity_type`,`entity_id`);
