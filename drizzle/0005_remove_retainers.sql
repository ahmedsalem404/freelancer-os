-- The retainer engagement type is retired. Delete every retainer engagement
-- with everything that hangs off it (the owner asked for this), children first.
-- Expenses and calendar dates only lose the link; they stay.
DELETE FROM `attachments` WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer')
	OR `payment_id` IN (
		SELECT `p`.`id` FROM `payments` AS `p`
		JOIN `invoices` AS `i` ON `i`.`id` = `p`.`invoice_id`
		WHERE `i`.`engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer'));--> statement-breakpoint
DELETE FROM `payments` WHERE `invoice_id` IN (
	SELECT `id` FROM `invoices` WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer'));--> statement-breakpoint
DELETE FROM `invoice_items` WHERE `invoice_id` IN (
	SELECT `id` FROM `invoices` WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer'));--> statement-breakpoint
DELETE FROM `invoices` WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer');--> statement-breakpoint
DELETE FROM `approvals` WHERE `deliverable_id` IN (
	SELECT `id` FROM `deliverables` WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer'));--> statement-breakpoint
DELETE FROM `review_rounds` WHERE `deliverable_id` IN (
	SELECT `id` FROM `deliverables` WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer'));--> statement-breakpoint
DELETE FROM `deliverables` WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer');--> statement-breakpoint
DELETE FROM `client_portal_links` WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer');--> statement-breakpoint
DELETE FROM `leads` WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer');--> statement-breakpoint
UPDATE `expenses` SET `engagement_id` = NULL WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer');--> statement-breakpoint
UPDATE `important_dates` SET `engagement_id` = NULL WHERE `engagement_id` IN (SELECT `id` FROM `engagements` WHERE `type` = 'retainer');--> statement-breakpoint
DELETE FROM `engagements` WHERE `type` = 'retainer';
