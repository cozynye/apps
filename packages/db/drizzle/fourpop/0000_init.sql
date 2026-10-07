CREATE TABLE `installed_packs` (
	`id` text PRIMARY KEY NOT NULL,
	`manifest_json` text NOT NULL,
	`installed_at` integer NOT NULL,
	`version` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `strips` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`layout` text NOT NULL,
	`frame_id` text NOT NULL,
	`pack_id` text NOT NULL,
	`filter` text NOT NULL,
	`hd` integer DEFAULT false NOT NULL,
	`file_name` text NOT NULL,
	`thumb_name` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_strips_created` ON `strips` ("created_at" desc);