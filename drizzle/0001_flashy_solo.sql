CREATE TABLE `client_portal_links` (
	`id` text PRIMARY KEY NOT NULL,
	`engagement_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`token_hint` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` text,
	`revoked_at` text,
	`last_viewed_at` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_portal_links_tokenHash_unique` ON `client_portal_links` (`token_hash`);--> statement-breakpoint
CREATE INDEX `portal_links_engagement` ON `client_portal_links` (`engagement_id`);