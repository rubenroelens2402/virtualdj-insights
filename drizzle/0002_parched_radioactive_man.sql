CREATE TABLE `plays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`track_id` integer,
	`played_at` text NOT NULL,
	`position` integer NOT NULL,
	`artist` text,
	`title` text NOT NULL,
	`original_text` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plays_session_position_idx` ON `plays` (`session_id`,`position`);--> statement-breakpoint
CREATE INDEX `plays_played_at_idx` ON `plays` (`played_at`);--> statement-breakpoint
CREATE INDEX `plays_track_id_idx` ON `plays` (`track_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_date` text NOT NULL,
	`started_at` text,
	`ended_at` text,
	`source_file` text NOT NULL,
	`source_position` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_source_idx` ON `sessions` (`source_file`,`source_position`);