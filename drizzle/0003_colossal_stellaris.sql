CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text,
	`start_time` text,
	`client_id` text,
	`engagement_id` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "event_range" CHECK("calendar_events"."ends_on" IS NULL OR "calendar_events"."ends_on" >= "calendar_events"."starts_on")
);
--> statement-breakpoint
CREATE INDEX `calendar_events_start` ON `calendar_events` (`starts_on`);--> statement-breakpoint
CREATE TABLE `reminder_log` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`target_id` text NOT NULL,
	`occurrence_on` text NOT NULL,
	`offset_days` integer NOT NULL,
	`action` text NOT NULL,
	`message_body` text,
	`acted_by` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`acted_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "reminder_kind" CHECK("reminder_log"."kind" IN ('invoice_due', 'subscription_renewal', 'important_date', 'lead_follow_up', 'own_subscription')),
	CONSTRAINT "reminder_action" CHECK("reminder_log"."action" IN ('sent', 'dismissed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_log_dedupeKey_unique` ON `reminder_log` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `reminder_target` ON `reminder_log` (`kind`,`target_id`);--> statement-breakpoint
CREATE TABLE `message_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`locale` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "template_key" CHECK("message_templates"."key" IN ('invoice_send', 'reminder_due', 'reminder_overdue', 'renewal_notice', 'portal_link', 'lead_follow_up')),
	CONSTRAINT "template_locale" CHECK("message_templates"."locale" IN ('ar', 'en'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `template_key_locale` ON `message_templates` (`key`,`locale`);