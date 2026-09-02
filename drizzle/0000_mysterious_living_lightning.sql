CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`starts_at` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `performance_requests` (
	`performance_id` text NOT NULL,
	`request_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_performance_requests_performance` ON `performance_requests` (`performance_id`);--> statement-breakpoint
CREATE INDEX `idx_performance_requests_request` ON `performance_requests` (`request_id`);--> statement-breakpoint
CREATE TABLE `performances` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`song_id` integer,
	`request_id` text,
	`title` text NOT NULL,
	`artist` text DEFAULT '' NOT NULL,
	`performed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_performances_event_date` ON `performances` (`event_id`,`performed_at`);--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`song_id` integer,
	`custom_title` text DEFAULT '' NOT NULL,
	`custom_artist` text DEFAULT '' NOT NULL,
	`nickname` text NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_requests_event_status_created` ON `requests` (`event_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_requests_song_id` ON `requests` (`song_id`);--> statement-breakpoint
CREATE TABLE `songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text DEFAULT '' NOT NULL,
	`language` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`key` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_songs_enabled_title` ON `songs` (`enabled`,`title`);