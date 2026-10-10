PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text,
	`size_bytes` integer,
	`sha256` text,
	`storage_path` text,
	`client_id` text,
	`engagement_id` text,
	`payment_id` text,
	`invoice_id` text,
	`note` text,
	`uploaded_on` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "attachment_kind" CHECK("__new_attachments"."kind" IN ('agreement_chat', 'contract', 'payment_proof', 'receipt', 'invoice', 'deliverable_file', 'logo', 'other')),
	CONSTRAINT "attachment_has_owner" CHECK("__new_attachments"."kind" = 'logo' OR COALESCE("__new_attachments"."client_id", "__new_attachments"."engagement_id", "__new_attachments"."payment_id") IS NOT NULL),
	CONSTRAINT "attachment_proof_owner" CHECK("__new_attachments"."kind" <> 'payment_proof' OR "__new_attachments"."payment_id" IS NOT NULL),
	CONSTRAINT "attachment_invoice_owner" CHECK("__new_attachments"."kind" <> 'invoice' OR "__new_attachments"."invoice_id" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_attachments`("id", "kind", "file_name", "mime_type", "size_bytes", "sha256", "storage_path", "client_id", "engagement_id", "payment_id", "invoice_id", "note", "uploaded_on", "uploaded_by", "created_at", "updated_at") SELECT "id", "kind", "file_name", "mime_type", "size_bytes", "sha256", "storage_path", "client_id", "engagement_id", "payment_id", NULL, "note", "uploaded_on", "uploaded_by", "created_at", "updated_at" FROM `attachments`;--> statement-breakpoint
DROP TABLE `attachments`;--> statement-breakpoint
ALTER TABLE `__new_attachments` RENAME TO `attachments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `attachments_client` ON `attachments` (`client_id`);--> statement-breakpoint
CREATE INDEX `attachments_engagement` ON `attachments` (`engagement_id`);--> statement-breakpoint
CREATE INDEX `attachments_payment` ON `attachments` (`payment_id`);