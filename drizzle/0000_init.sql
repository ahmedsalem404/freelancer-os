CREATE TABLE `important_dates` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`due_on` text NOT NULL,
	`recurrence` text DEFAULT 'yearly' NOT NULL,
	`remind_days_before` integer DEFAULT 14 NOT NULL,
	`client_id` text,
	`engagement_id` text,
	`handled_on` text,
	`notes` text,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "date_kind" CHECK("important_dates"."kind" IN ('domain', 'ssl', 'hosting', 'license', 'other')),
	CONSTRAINT "date_recurrence" CHECK("important_dates"."recurrence" IN ('none', 'monthly', 'yearly'))
);
--> statement-breakpoint
CREATE INDEX `important_dates_due` ON `important_dates` (`due_on`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`billing_identity_id` text NOT NULL,
	`whatsapp` text,
	`email` text,
	`city` text,
	`country` text,
	`timezone` text DEFAULT 'Asia/Riyadh' NOT NULL,
	`currency` text DEFAULT 'SAR' NOT NULL,
	`color` text NOT NULL,
	`lead_source` text,
	`notes` text,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`billing_identity_id`) REFERENCES `billing_identities`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "client_kind" CHECK("clients"."kind" IN ('person', 'company')),
	CONSTRAINT "client_currency" CHECK("clients"."currency" IN ('SAR', 'USD', 'YER'))
);
--> statement-breakpoint
CREATE INDEX `clients_name` ON `clients` (`archived_at`,`name`);--> statement-breakpoint
CREATE INDEX `clients_identity` ON `clients` (`billing_identity_id`);--> statement-breakpoint
CREATE TABLE `vault_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`label` text NOT NULL,
	`url` text,
	`username` text,
	`ciphertext` text,
	`nonce` text,
	`algo` text DEFAULT 'aes-256-gcm' NOT NULL,
	`key_version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vault_client` ON `vault_entries` (`client_id`);--> statement-breakpoint
CREATE TABLE `engagement_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`engagement_id` text NOT NULL,
	`seq` integer NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`amount` integer NOT NULL,
	`included_units` real,
	`grace_days` integer DEFAULT 0 NOT NULL,
	`grace_extended_days` integer DEFAULT 0 NOT NULL,
	`decision` text DEFAULT 'pending' NOT NULL,
	`decided_at` text,
	`decided_by` text,
	`decision_note` text,
	`renewal_invoice_id` text,
	`service_stopped_on` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`decided_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cycle_decision" CHECK("engagement_cycles"."decision" IN ('pending', 'renewed', 'grace', 'stopped')),
	CONSTRAINT "cycle_dates" CHECK("engagement_cycles"."ends_on" > "engagement_cycles"."starts_on"),
	CONSTRAINT "cycle_renewed_has_invoice" CHECK("engagement_cycles"."decision" <> 'renewed' OR "engagement_cycles"."renewal_invoice_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cycle_one_open` ON `engagement_cycles` (`engagement_id`) WHERE "engagement_cycles"."decision" IN ('pending','grace');--> statement-breakpoint
CREATE INDEX `cycles_ends_on` ON `engagement_cycles` (`ends_on`);--> statement-breakpoint
CREATE UNIQUE INDEX `cycle_seq` ON `engagement_cycles` (`engagement_id`,`seq`);--> statement-breakpoint
CREATE TABLE `engagements` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`billing_identity_id` text,
	`lead_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`rate_to_base` real NOT NULL,
	`base_amount` integer NOT NULL,
	`start_on` text NOT NULL,
	`end_on` text,
	`allowance_unit` text NOT NULL,
	`allowance_included` real DEFAULT 0 NOT NULL,
	`overage_unit_price` integer DEFAULT 0 NOT NULL,
	`default_revision_limit` integer,
	`scope_agreed_deliverables` integer DEFAULT 0 NOT NULL,
	`cycle_period` text,
	`grace_days` integer,
	`next_action` text DEFAULT '' NOT NULL,
	`next_action_on` text,
	`lessons_note` text,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`billing_identity_id`) REFERENCES `billing_identities`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "engagement_type" CHECK("engagements"."type" IN ('project', 'retainer', 'subscription')),
	CONSTRAINT "engagement_status" CHECK("engagements"."status" IN ('active', 'paused', 'completed', 'cancelled')),
	CONSTRAINT "engagement_unit" CHECK("engagements"."allowance_unit" IN ('revisions', 'hours', 'tickets', 'days')),
	CONSTRAINT "engagement_type_shape" CHECK(("engagements"."type" = 'project' AND "engagements"."allowance_unit" = 'revisions'
           AND "engagements"."cycle_period" IS NULL AND "engagements"."allowance_included" = 0)
       OR ("engagements"."type" = 'retainer' AND "engagements"."allowance_unit" IN ('hours','tickets')
           AND "engagements"."cycle_period" IS NOT NULL AND "engagements"."allowance_included" > 0)
       OR ("engagements"."type" = 'subscription' AND "engagements"."allowance_unit" = 'days'
           AND "engagements"."cycle_period" IS NOT NULL)),
	CONSTRAINT "engagement_dates" CHECK("engagements"."end_on" IS NULL OR "engagements"."end_on" >= "engagements"."start_on"),
	CONSTRAINT "engagement_amount" CHECK("engagements"."amount" >= 0)
);
--> statement-breakpoint
CREATE INDEX `engagements_client` ON `engagements` (`client_id`);--> statement-breakpoint
CREATE INDEX `engagements_type_status` ON `engagements` (`type`,`status`);--> statement-breakpoint
CREATE INDEX `engagements_next_action` ON `engagements` (`next_action_on`);--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`deliverable_id` text NOT NULL,
	`review_round_id` text,
	`source` text NOT NULL,
	`portal_link_id` text,
	`recorded_by` text,
	`decision` text NOT NULL,
	`signer_name` text,
	`comment` text,
	`ip_hash` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`deliverable_id`) REFERENCES `deliverables`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`review_round_id`) REFERENCES `review_rounds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "approval_source" CHECK("approvals"."source" IN ('client_link', 'owner')),
	CONSTRAINT "approval_decision" CHECK("approvals"."decision" IN ('approved', 'changes_requested'))
);
--> statement-breakpoint
CREATE INDEX `approvals_deliverable` ON `approvals` (`deliverable_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `review_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`deliverable_id` text NOT NULL,
	`round_no` integer NOT NULL,
	`received_on` text NOT NULL,
	`note` text NOT NULL,
	`source` text DEFAULT 'owner' NOT NULL,
	`created_by` text,
	`portal_link_id` text,
	`invoice_item_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`deliverable_id`) REFERENCES `deliverables`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "round_source" CHECK("review_rounds"."source" IN ('owner', 'assistant', 'client_link'))
);
--> statement-breakpoint
CREATE INDEX `rounds_invoice_item` ON `review_rounds` (`invoice_item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `round_no` ON `review_rounds` (`deliverable_id`,`round_no`);--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` text PRIMARY KEY NOT NULL,
	`engagement_id` text NOT NULL,
	`stage_id` text,
	`title` text NOT NULL,
	`due_on` text,
	`revision_limit` integer NOT NULL,
	`origin` text DEFAULT 'contract' NOT NULL,
	`invoice_item_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`cancelled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `engagement_stages`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "deliverable_origin" CHECK("deliverables"."origin" IN ('contract', 'change_scope')),
	CONSTRAINT "deliverable_limit" CHECK("deliverables"."revision_limit" >= 0),
	CONSTRAINT "deliverable_scope_billed" CHECK("deliverables"."origin" = 'contract' OR "deliverables"."invoice_item_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `deliverables_engagement` ON `deliverables` (`engagement_id`,`position`);--> statement-breakpoint
CREATE INDEX `deliverables_due` ON `deliverables` (`due_on`);--> statement-breakpoint
CREATE TABLE `engagement_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`engagement_id` text NOT NULL,
	`title` text NOT NULL,
	`position` integer NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stage_position` ON `engagement_stages` (`engagement_id`,`position`);--> statement-breakpoint
CREATE TABLE `attachments` (
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
	`note` text,
	`uploaded_on` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "attachment_kind" CHECK("attachments"."kind" IN ('agreement_chat', 'contract', 'payment_proof', 'receipt', 'deliverable_file', 'logo', 'other')),
	CONSTRAINT "attachment_has_owner" CHECK("attachments"."kind" = 'logo' OR COALESCE("attachments"."client_id", "attachments"."engagement_id", "attachments"."payment_id") IS NOT NULL),
	CONSTRAINT "attachment_proof_owner" CHECK("attachments"."kind" <> 'payment_proof' OR "attachments"."payment_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `attachments_client` ON `attachments` (`client_id`);--> statement-breakpoint
CREATE INDEX `attachments_engagement` ON `attachments` (`engagement_id`);--> statement-breakpoint
CREATE INDEX `attachments_payment` ON `attachments` (`payment_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`rate_to_base` real NOT NULL,
	`base_amount` integer NOT NULL,
	`spent_on` text NOT NULL,
	`vendor` text,
	`own_subscription_id` text,
	`engagement_id` text,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`own_subscription_id`) REFERENCES `own_subscriptions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "expense_category" CHECK("expenses"."category" IN ('software', 'equipment', 'contractors', 'marketing', 'subscription', 'other'))
);
--> statement-breakpoint
CREATE INDEX `expenses_spent` ON `expenses` (`spent_on`);--> statement-breakpoint
CREATE UNIQUE INDEX `expense_sub_charge` ON `expenses` (`own_subscription_id`,`spent_on`);--> statement-breakpoint
CREATE TABLE `own_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`vendor` text,
	`category` text,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`rate_to_base` real NOT NULL,
	`base_amount` integer NOT NULL,
	`period` text NOT NULL,
	`started_on` text NOT NULL,
	`next_renewal_on` text NOT NULL,
	`cancelled_on` text,
	`remind_days_before` integer DEFAULT 3 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "own_sub_period" CHECK("own_subscriptions"."period" IN ('monthly', 'yearly'))
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`description` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`amount` integer NOT NULL,
	`source_kind` text DEFAULT 'manual' NOT NULL,
	`deliverable_id` text,
	`cycle_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deliverable_id`) REFERENCES `deliverables`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cycle_id`) REFERENCES `engagement_cycles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "item_source" CHECK("invoice_items"."source_kind" IN ('manual', 'deposit', 'revision_overage', 'retainer_overage', 'scope_change', 'renewal')),
	CONSTRAINT "item_quantity" CHECK("invoice_items"."quantity" > 0),
	CONSTRAINT "item_cycle_link" CHECK("invoice_items"."source_kind" NOT IN ('retainer_overage','renewal') OR "invoice_items"."cycle_id" IS NOT NULL),
	CONSTRAINT "item_deliverable_link" CHECK("invoice_items"."source_kind" <> 'revision_overage' OR "invoice_items"."deliverable_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `items_invoice` ON `invoice_items` (`invoice_id`,`position`);--> statement-breakpoint
CREATE INDEX `items_cycle` ON `invoice_items` (`cycle_id`);--> statement-breakpoint
CREATE INDEX `items_deliverable` ON `invoice_items` (`deliverable_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text,
	`state` text DEFAULT 'draft' NOT NULL,
	`kind` text DEFAULT 'standard' NOT NULL,
	`client_id` text NOT NULL,
	`engagement_id` text,
	`billing_identity_id` text NOT NULL,
	`issue_on` text NOT NULL,
	`due_on` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`rate_to_base` real NOT NULL,
	`base_amount` integer NOT NULL,
	`note` text,
	`issued_at` text,
	`voided_at` text,
	`void_reason` text,
	`last_sent_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`billing_identity_id`) REFERENCES `billing_identities`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "invoice_state" CHECK("invoices"."state" IN ('draft', 'issued', 'void')),
	CONSTRAINT "invoice_kind" CHECK("invoices"."kind" IN ('standard', 'deposit', 'overage', 'renewal', 'scope')),
	CONSTRAINT "invoice_issued_numbered" CHECK("invoices"."state" = 'draft' OR ("invoices"."number" IS NOT NULL AND "invoices"."issued_at" IS NOT NULL)),
	CONSTRAINT "invoice_void_dated" CHECK("invoices"."state" <> 'void' OR "invoices"."voided_at" IS NOT NULL),
	CONSTRAINT "invoice_due_after_issue" CHECK("invoices"."due_on" >= "invoices"."issue_on"),
	CONSTRAINT "invoice_amount" CHECK("invoices"."amount" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE INDEX `invoices_client` ON `invoices` (`client_id`,`issue_on`);--> statement-breakpoint
CREATE INDEX `invoices_engagement` ON `invoices` (`engagement_id`);--> statement-breakpoint
CREATE INDEX `invoices_state_due` ON `invoices` (`state`,`due_on`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`rate_to_base` real NOT NULL,
	`base_amount` integer NOT NULL,
	`applied_amount` integer NOT NULL,
	`received_on` text NOT NULL,
	`payment_method_id` text,
	`method_kind` text NOT NULL,
	`reference` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`confirmed_at` text,
	`confirmed_by` text,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`confirmed_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payment_status" CHECK("payments"."status" IN ('pending', 'confirmed', 'rejected')),
	CONSTRAINT "payment_method_kind" CHECK("payments"."method_kind" IN ('bank', 'kuraimi', 'usdt', 'cash')),
	CONSTRAINT "payment_positive" CHECK("payments"."applied_amount" > 0 AND "payments"."amount" > 0),
	CONSTRAINT "payment_confirmed_dated" CHECK("payments"."status" <> 'confirmed' OR "payments"."confirmed_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `payments_invoice` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `payments_received` ON `payments` (`received_on`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`whatsapp` text,
	`service` text NOT NULL,
	`stage` text DEFAULT 'lead' NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`rate_to_base` real NOT NULL,
	`base_amount` integer NOT NULL,
	`source` text,
	`proposal_sent_on` text,
	`last_contact_on` text,
	`next_follow_up_on` text,
	`lost_reason` text,
	`closed_at` text,
	`client_id` text,
	`engagement_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "lead_stage" CHECK("leads"."stage" IN ('lead', 'proposal', 'negotiation', 'won', 'lost')),
	CONSTRAINT "lead_closed_dated" CHECK("leads"."stage" NOT IN ('won','lost') OR "leads"."closed_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `leads_stage` ON `leads` (`stage`,`position`);--> statement-breakpoint
CREATE INDEX `leads_follow_up` ON `leads` (`next_follow_up_on`);--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`effective_on` text NOT NULL,
	`sar_in_yer` real NOT NULL,
	`usd_in_yer` real NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "rate_sar_positive" CHECK("exchange_rates"."sar_in_yer" > 0),
	CONSTRAINT "rate_usd_positive" CHECK("exchange_rates"."usd_in_yer" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exchange_rates_effectiveOn_unique` ON `exchange_rates` (`effective_on`);--> statement-breakpoint
CREATE TABLE `billing_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`legal_name` text,
	`tagline` text DEFAULT '' NOT NULL,
	`initials` text NOT NULL,
	`color` text NOT NULL,
	`whatsapp` text,
	`email` text,
	`address` text,
	`tax_number` text,
	`invoice_footer` text,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "identity_kind" CHECK("billing_identities"."kind" IN ('personal', 'business'))
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`billing_identity_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`details` text NOT NULL,
	`currency` text,
	`position` integer DEFAULT 0 NOT NULL,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`billing_identity_id`) REFERENCES `billing_identities`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payment_method_kind" CHECK("payment_methods"."kind" IN ('bank', 'kuraimi', 'usdt', 'cash'))
);
--> statement-breakpoint
CREATE INDEX `payment_methods_identity` ON `payment_methods` (`billing_identity_id`,`position`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`business_name` text DEFAULT 'Freelancer OS' NOT NULL,
	`timezone` text DEFAULT 'Asia/Aden' NOT NULL,
	`default_billing_identity_id` text,
	`invoice_prefix` text DEFAULT 'INV' NOT NULL,
	`invoice_seq_year` integer NOT NULL,
	`invoice_seq_next` integer DEFAULT 1 NOT NULL,
	`invoice_seq_pad` integer DEFAULT 3 NOT NULL,
	`default_due_days` integer DEFAULT 7 NOT NULL,
	`reminder_offsets` text DEFAULT '[0,7,14]' NOT NULL,
	`renewal_notice_days` integer DEFAULT 7 NOT NULL,
	`default_revision_limit` integer DEFAULT 2 NOT NULL,
	`default_grace_days` integer DEFAULT 5 NOT NULL,
	`meter_near_ratio` real DEFAULT 0.8 NOT NULL,
	`due_soon_days` integer DEFAULT 7 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`default_billing_identity_id`) REFERENCES `billing_identities`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "settings_single_row" CHECK("settings"."id" = 1),
	CONSTRAINT "settings_due_days" CHECK("settings"."default_due_days" >= 0)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`email` text NOT NULL,
	`whatsapp` text,
	`password_hash` text,
	`is_active` integer DEFAULT true NOT NULL,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "team_role" CHECK("team_members"."role" IN ('owner', 'assistant'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_email_unique` ON `team_members` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_one_owner` ON `team_members` (`role`) WHERE "team_members"."role" = 'owner';--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`client_id` text,
	`engagement_id` text,
	`deliverable_id` text,
	`task_id` text,
	`work_on` text NOT NULL,
	`started_at` text,
	`minutes` integer NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`entry_type` text DEFAULT 'manual' NOT NULL,
	`billable` integer DEFAULT true NOT NULL,
	`counts_to_allowance` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`deliverable_id`) REFERENCES `deliverables`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "time_minutes" CHECK("time_entries"."minutes" > 0),
	CONSTRAINT "time_engagement_has_client" CHECK("time_entries"."engagement_id" IS NULL OR "time_entries"."client_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `time_engagement` ON `time_entries` (`engagement_id`,`work_on`);--> statement-breakpoint
CREATE INDEX `time_client` ON `time_entries` (`client_id`,`work_on`);--> statement-breakpoint
CREATE INDEX `time_member` ON `time_entries` (`member_id`,`work_on`);--> statement-breakpoint
CREATE TABLE `daily_reflections` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`on_date` text NOT NULL,
	`reflection` text NOT NULL,
	`carried_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reflection_per_day` ON `daily_reflections` (`member_id`,`on_date`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`engagement_id` text,
	`stage_id` text,
	`assignee_id` text NOT NULL,
	`created_by` text NOT NULL,
	`due_on` text,
	`completed_at` text,
	`completed_by` text,
	`carried_over_count` integer DEFAULT 0 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`stage_id`) REFERENCES `engagement_stages`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assignee_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completed_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tasks_assignee` ON `tasks` (`assignee_id`,`completed_at`,`due_on`);--> statement-breakpoint
CREATE INDEX `tasks_engagement` ON `tasks` (`engagement_id`);