ALTER TABLE `tracks` ADD `file_size` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `remix` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `genre` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `year` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `bpm_raw` real;--> statement-breakpoint
ALTER TABLE `tracks` ADD `bitrate` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `first_seen` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `last_modified` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `first_play` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `last_play` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `play_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `synced_at` integer;--> statement-breakpoint
CREATE INDEX `tracks_artist_idx` ON `tracks` (`artist`);--> statement-breakpoint
CREATE INDEX `tracks_bpm_idx` ON `tracks` (`bpm`);