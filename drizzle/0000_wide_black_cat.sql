CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_path` text NOT NULL,
	`title` text,
	`artist` text,
	`bpm` real,
	`musical_key` text,
	`duration_seconds` real
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_file_path_unique` ON `tracks` (`file_path`);